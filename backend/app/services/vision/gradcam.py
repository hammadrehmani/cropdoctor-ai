"""
Vision Service — Grad-CAM Explainability
==========================================
Generates real Grad-CAM heatmap overlays using pytorch-grad-cam.

Key design decisions:
  - Hooks onto EfficientNet-B0's last convolutional block (features[-1])
  - Returns the overlay as base64-encoded JPEG (avoids filesystem coupling)
  - Works ONLY when a real model is provided — never generates fake heatmaps
  - In mock mode, returns None (API response has gradcam_image=null)

IMPORTANT: This module does NOT fabricate heatmaps. If the model is not
loaded, gradcam_image will be None, which is clearly communicated to the
frontend via the response schema.
"""
from __future__ import annotations

import base64
import io
import logging

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


class GradCAMService:
    """
    Real Grad-CAM overlay generator.

    Requires:
      - pytorch-grad-cam installed (`pip install grad-cam`)
      - A loaded nn.Module (EfficientNet-B0) passed as argument
    """

    @staticmethod
    def generate_overlay(
        image_bytes: bytes,
        model: object,
        target_class: int | None = None,
        image_size: int = 224,
    ) -> str | None:
        """
        Generate a Grad-CAM heatmap overlay for the given image.

        Args:
            image_bytes: Raw JPEG/PNG bytes of the leaf image.
            model: Loaded EfficientNet-B0 nn.Module in eval() mode.
            target_class: Class index to explain. None = highest-scoring class.
            image_size: Input size expected by the model.

        Returns:
            Base64-encoded JPEG string of the overlay, or None on failure.
        """
        if model is None:
            logger.debug("GradCAM: no model provided — skipping (not fabricating).")
            return None

        try:
            import cv2
            from pytorch_grad_cam import GradCAM
            from pytorch_grad_cam.utils.image import show_cam_on_image
            from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
            from torchvision import transforms

            # ── Prepare input tensor ──────────────────────────────────────
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            pil_resized = pil_img.resize((image_size, image_size), Image.BILINEAR)

            transform = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                ),
            ])
            input_tensor = transform(pil_resized).unsqueeze(0)

            # ── Select target layer ───────────────────────────────────────
            # EfficientNet-B0: last block of features
            target_layers = [model.features[-1]]  # type: ignore[union-attr]

            # ── Build targets ─────────────────────────────────────────────
            targets = [ClassifierOutputTarget(target_class)] if target_class is not None else None

            # ── Run Grad-CAM ──────────────────────────────────────────────
            with GradCAM(model=model, target_layers=target_layers) as cam:  # type: ignore
                grayscale_cam = cam(input_tensor=input_tensor, targets=targets)
                # grayscale_cam shape: (1, H, W)

            # ── Build overlay ─────────────────────────────────────────────
            rgb_img = np.array(pil_resized).astype(np.float32) / 255.0
            cam_image = show_cam_on_image(
                rgb_img,
                grayscale_cam[0],
                use_rgb=True,
                colormap=cv2.COLORMAP_JET,
            )

            # ── Encode as base64 JPEG ──────────────────────────────────────
            result_pil = Image.fromarray(cam_image)
            buffer = io.BytesIO()
            result_pil.save(buffer, format="JPEG", quality=85)
            b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

            logger.info("GradCAM: overlay generated successfully.")
            return f"data:image/jpeg;base64,{b64}"

        except ImportError as e:
            logger.error(
                f"GradCAM: missing dependency ({e}). "
                "Install with: pip install grad-cam"
            )
            return None
        except Exception as exc:
            logger.exception(f"GradCAM generation failed: {exc}")
            return None


# Module-level singleton
gradcam_service = GradCAMService()
