# MundaSense — Local Disease Classifier

MobileNetV3-Small trained on the PlantVillage dataset (38 classes
across 14 crops). Runs in ~50ms on CPU, free, offline-capable.

## Training (Google Colab, ~30 min on GPU)

```python
!pip install -r ml/requirements.txt
!kaggle datasets download -d abdallahalidev/plantvillage-dataset
!unzip -q plantvillage-dataset.zip -d data/
!python ml/train_plantvillage.py
!python ml/export_to_onnx.py
```

Download `ml/checkpoints/plantvillage_mobilenet.onnx` and commit
it to the repo.

## Inference

Called automatically by `server/disease.ts` before Gemini.
Falls through to Gemini when:
- The model file is missing
- Confidence is below 0.75
- Inference throws an error

## Classes

38 classes across: Apple, Blueberry, Cherry, Corn, Grape, Orange,
Peach, Pepper bell, Potato, Raspberry, Soybean, Squash, Strawberry,
Tomato.

Zambian crops not in PlantVillage (maize native varieties,
groundnuts, cassava, sorghum, millet, cowpea, etc.) are handled by
the Gemini fallback.
