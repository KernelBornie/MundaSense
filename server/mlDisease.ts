/**
 * MundaSense — Local PlantVillage disease classifier (ONNX).
 *
 * Loads the trained MobileNetV3 model and classifies leaf images
 * in ~50ms on CPU. Zero API cost, works offline.
 *
 * Falls back gracefully if:
 *   - onnxruntime-node or sharp are not installed
 *   - the model file is missing
 *   - inference fails
 *
 * In all fallback cases, the caller should proceed to Gemini.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_PATH = path.join(__dirname, '..', 'ml', 'checkpoints', 'plantvillage_mobilenet.onnx');
const CLASSES_PATH = path.join(__dirname, '..', 'ml', 'classes.json');

let session: any = null;
let classNames: string[] = [];
try {
  if (fs.existsSync(CLASSES_PATH)) {
    classNames = JSON.parse(fs.readFileSync(CLASSES_PATH, 'utf-8'));
  }
} catch {}
let ort: any = null;
let sharp: any = null;
let loadError: string | null = null;
let loadAttempted = false;

export function isLocalModelReady(): boolean {
  return Boolean(session) && classNames.length > 0;
}

export function getLocalModelStatus() {
  return {
    ready: isLocalModelReady(),
    modelPath: MODEL_PATH,
    classes: classNames.length,
    error: loadError,
    attempted: loadAttempted,
  };
}

/**
 * Lazy-load ONNX runtime, sharp, model file, and class names.
 */
export async function initLocalModel(): Promise<boolean> {
  if (loadAttempted) return isLocalModelReady();
  loadAttempted = true;

  // 1. Load onnxruntime-node
  try {
    ort = await import('onnxruntime-node' as any);
  } catch (e: any) {
    loadError = 'onnxruntime-node not installed';
    console.warn('[ml] onnxruntime-node unavailable:', e.message);
    return false;
  }

  // 2. Load sharp
  try {
    sharp = (await import('sharp')).default;
  } catch (e: any) {
    loadError = 'sharp not installed';
    console.warn('[ml] sharp unavailable:', e.message);
    return false;
  }

  // 3. Load classes.json
  if (!fs.existsSync(CLASSES_PATH)) {
    loadError = `classes.json missing at ${CLASSES_PATH}`;
    console.warn(`[ml] ${loadError}`);
    return false;
  }
  try {
    classNames = JSON.parse(fs.readFileSync(CLASSES_PATH, 'utf-8'));
  } catch (e: any) {
    loadError = `classes.json parse error: ${e.message}`;
    return false;
  }

  // 4. Load ONNX model
  if (!fs.existsSync(MODEL_PATH)) {
    loadError = `model not found at ${MODEL_PATH}`;
    console.warn(`[ml] ${loadError} — training required`);
    console.warn('[ml] Run ml/train_plantvillage.py on Colab, then commit the ONNX file.');
    return false;
  }

  try {
    session = await ort.InferenceSession.create(MODEL_PATH);
    console.log(`[ml] ✅ Local model loaded (${classNames.length} classes)`);
    return true;
  } catch (e: any) {
    loadError = `ONNX session failed: ${e.message}`;
    console.error(`[ml] ${loadError}`);
    return false;
  }
}

/**
 * Preprocess a base64 data URL into a 224x224 normalized Float32 tensor.
 */
async function preprocessImage(dataUrl: string): Promise<any> {
  const match = dataUrl.match(/^data:image\/[a-z+]+;base64,(.+)$/i);
  if (!match) throw new Error('Invalid data URL');
  const buffer = Buffer.from(match[1], 'base64');

  const { data: rgb } = await sharp(buffer)
    .resize(224, 224, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  const floatData = new Float32Array(3 * 224 * 224);

  for (let c = 0; c < 3; c++) {
    for (let y = 0; y < 224; y++) {
      for (let x = 0; x < 224; x++) {
        const src = (y * 224 + x) * 3 + c;
        const dst = c * 224 * 224 + y * 224 + x;
        const px = rgb[src] / 255;
        floatData[dst] = (px - mean[c]) / std[c];
      }
    }
  }

  return new ort.Tensor('float32', floatData, [1, 3, 224, 224]);
}

export interface LocalPrediction {
  className: string;
  crop: string;
  disease: string;
  confidence: number;
  top3: Array<{ className: string; confidence: number }>;
}

/**
 * Classify a base64 leaf image with the local model.
 * Returns null if the model isn't loaded or inference fails.
 */
export async function classifyLeaf(dataUrl: string): Promise<LocalPrediction | null> {
  if (!session) {
    const ok = await initLocalModel();
    if (!ok) return null;
  }

  try {
    const tensor = await preprocessImage(dataUrl);
    const outputs = await session.run({ image: tensor });
    const logits = outputs.logits.data as Float32Array;

    // Softmax
    const maxLogit = Math.max(...logits);
    const exps = Array.from(logits).map((v) => Math.exp(v - maxLogit));
    const sumExp = exps.reduce((s, v) => s + v, 0);
    const probs = exps.map((v) => v / sumExp);

    const indexed = probs.map((p, i) => ({ i, p }));
    indexed.sort((a, b) => b.p - a.p);
    const top3 = indexed.slice(0, 3).map(({ i, p }) => ({
      className: classNames[i],
      confidence: +p.toFixed(4),
    }));

    const top = top3[0];
    const [crop, disease] = parseClassName(top.className);

    return {
      className: top.className,
      crop,
      disease,
      confidence: top.confidence,
      top3,
    };
  } catch (e: any) {
    console.error('[ml] Inference error:', e.message);
    return null;
  }
}

function parseClassName(cls: string): [string, string] {
  const parts = cls.split('___');
  const crop = (parts[0] || '').replace(/_/g, ' ');
  const disease = (parts[1] || 'healthy').replace(/_/g, ' ');
  return [crop, disease];
}
