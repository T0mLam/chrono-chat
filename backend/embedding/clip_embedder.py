import torch
import numpy as np
import clip
from PIL import Image
from torchvision import transforms as T
from transformers import BlipProcessor, BlipForConditionalGeneration
from typing import List, Dict, Any
import time

from preprocessing.extract_frames import sample_frames

class ClipEmbedder:
    """CLIP embedders for image and text data."""

    def __init__(
        self, 
        blip_model_name: str = "Salesforce/blip-image-captioning-base",
        clip_model_name: str = "ViT-B/16", 
        device: str = "cuda" if torch.cuda.is_available() else "cpu", 
        batch_size: int = 8
    ):      
        self.clip_model_name = clip_model_name
        self.device = device
        self.batch_size = batch_size
        self.clip_model, self.clip_preprocess = clip.load(clip_model_name, device=device)
        self.clip_model.to(device)
        self.clip_model.eval()

        self.blip_model = BlipForConditionalGeneration.from_pretrained(blip_model_name, torch_dtype=torch.float16).to(device)
        self.blip_processor = BlipProcessor.from_pretrained(blip_model_name, use_fast=True)

    def embed_frames(
        self, 
        images: List[Image.Image],
        sample_interval_sec: float
    ) -> List[Dict[str, float]]:
        """
        Embed a list of images using the CLIP model.

        Args:
            images (List[Image.Image]): List of PIL Image objects.
            sample_interval_sec (float): Interval in seconds to sample frames.

        Returns:
            List[Dict[str, float]]: List of dictionaries containing start time, end time, and embeddings.
        """
        frames = map(lambda f: self.clip_preprocess(f), images)
        frames_tensor = torch.stack(list(frames), dim=0).to(self.device)  
        
        N = frames_tensor.shape[0]
        all_embeddings = []
        all_captions = []

        with torch.no_grad():
            for start in range(0, N, self.batch_size):
                end = min(start + self.batch_size, N)
                batch_tensor = frames_tensor[start: end]  # [B, C, H, W]

                emb = self.clip_model.encode_image(batch_tensor) # [1, 512]
                emb /= emb.norm(dim=1, keepdim=True)

                blip_inputs = self.blip_processor(images[start: end], return_tensors="pt", padding=True).to(self.device)
                blip_outputs = self.blip_model.generate(**blip_inputs)
                captions = self.blip_processor.batch_decode(blip_outputs, skip_special_tokens=True)

                all_embeddings.extend(emb.cpu().tolist())
                all_captions.extend(captions)

        results = []

        for i in range(N):
            results.append({
                "start": i * sample_interval_sec,
                "end": (i + 1) * sample_interval_sec,
                "emb": all_embeddings[i],
                "text": all_captions[i]
            })

        return results 

    def embed_query(self, query: str) -> List[float]:
        with torch.no_grad():
            tokens = clip.tokenize([query]).to(self.device)
            emb = self.clip_model.encode_text(tokens)  # [1, 512]
            emb /= emb.norm(dim=1, keepdim=True)
            return emb.cpu().tolist()[0]  # Return first (and only) embedding