"""
MundaSense — Train MobileNetV3-Small on PlantVillage.

Run this on Google Colab (free GPU) or a local machine with CUDA.

Setup:
    pip install -r ml/requirements.txt
    kaggle datasets download -d abdallahalidev/plantvillage-dataset
    unzip plantvillage-dataset.zip -d data/

Train:
    python ml/train_plantvillage.py

Export:
    python ml/export_to_onnx.py

Outputs:
    ml/checkpoints/best_model.pt                 (PyTorch weights)
    ml/checkpoints/plantvillage_mobilenet.onnx   (~10 MB)
    ml/classes.json                              (auto-generated)
"""

import os
import json
from pathlib import Path
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, transforms, models
from tqdm import tqdm

# -------------------- CONFIG --------------------
DATA_DIR = Path("data/plantvillage")
OUT_DIR = Path("ml/checkpoints")
OUT_DIR.mkdir(parents=True, exist_ok=True)

BATCH_SIZE = 32
EPOCHS = 15
LR = 1e-3
WD = 1e-4
WORKERS = 2
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
SEED = 42
torch.manual_seed(SEED)

# -------------------- TRANSFORMS --------------------
train_tf = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

val_tf = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

def find_dataset_root(base: Path) -> Path:
    for root, dirs, _ in os.walk(base):
        if len(dirs) > 10 and any("Tomato" in d for d in dirs):
            return Path(root)
    return base

def main():
    print(f"[train] Device: {DEVICE}")
    root = find_dataset_root(DATA_DIR)
    print(f"[train] Dataset root: {root}")

    train_full = datasets.ImageFolder(str(root), transform=train_tf)
    val_full = datasets.ImageFolder(str(root), transform=val_tf)
    n = len(train_full)
    print(f"[train] {len(train_full.classes)} classes, {n} images")

    with open("ml/classes.json", "w") as f:
        json.dump(train_full.classes, f, indent=2)

    idx = torch.randperm(n).tolist()
    split = int(0.8 * n)
    train_ds = Subset(train_full, idx[:split])
    val_ds = Subset(val_full, idx[split:])

    train_ld = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,
                          num_workers=WORKERS, pin_memory=True)
    val_ld = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False,
                        num_workers=WORKERS, pin_memory=True)

    model = models.mobilenet_v3_small(
        weights=models.MobileNet_V3_Small_Weights.DEFAULT
    )
    model.classifier[3] = nn.Linear(1024, len(train_full.classes))
    model = model.to(DEVICE)

    crit = nn.CrossEntropyLoss()
    opt = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=WD)
    sch = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=EPOCHS)

    best = 0.0
    for epoch in range(1, EPOCHS + 1):
        model.train()
        correct, total = 0, 0
        pbar = tqdm(train_ld, desc=f"Epoch {epoch}/{EPOCHS}")
        for x, y in pbar:
            x, y = x.to(DEVICE), y.to(DEVICE)
            opt.zero_grad()
            out = model(x)
            loss = crit(out, y)
            loss.backward()
            opt.step()
            correct += (out.argmax(1) == y).sum().item()
            total += x.size(0)
            pbar.set_postfix(acc=f"{correct/total:.3f}")
        sch.step()

        model.eval()
        vc, vt = 0, 0
        with torch.no_grad():
            for x, y in val_ld:
                x, y = x.to(DEVICE), y.to(DEVICE)
                vc += (model(x).argmax(1) == y).sum().item()
                vt += x.size(0)
        vacc = vc / vt
        print(f"[train] Epoch {epoch}: val_acc={vacc:.4f}")

        if vacc > best:
            best = vacc
            torch.save(model.state_dict(), OUT_DIR / "best_model.pt")
            print(f"[train] ✅ Saved (best={best:.4f})")

    print(f"\n[train] Done. Best val_acc={best:.4f}")

if __name__ == "__main__":
    main()
