"""
MundaSense — Export trained MobileNetV3 to ONNX.

Usage:
    python ml/export_to_onnx.py

Outputs:
    ml/checkpoints/plantvillage_mobilenet.onnx
"""

import json
from pathlib import Path
import torch
import torch.nn as nn
from torchvision import models

CKPT = Path("ml/checkpoints/best_model.pt")
OUT = Path("ml/checkpoints/plantvillage_mobilenet.onnx")
CLASSES = Path("ml/classes.json")

def main():
    with open(CLASSES) as f:
        classes = json.load(f)
    print(f"[export] {len(classes)} classes")

    model = models.mobilenet_v3_small(weights=None)
    model.classifier[3] = nn.Linear(1024, len(classes))
    model.load_state_dict(torch.load(CKPT, map_location="cpu"))
    model.eval()

    dummy = torch.randn(1, 3, 224, 224)
    torch.onnx.export(
        model, dummy, str(OUT),
        input_names=["image"], output_names=["logits"],
        dynamic_axes={"image": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
    )
    print(f"[export] ✅ {OUT} ({OUT.stat().st_size // 1024} KB)")

if __name__ == "__main__":
    main()
