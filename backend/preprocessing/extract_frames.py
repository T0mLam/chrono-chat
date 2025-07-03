import os
import cv2
import torch
from PIL import Image
import numpy as np 
from typing import List, Tuple

def sample_frames(
    video_path: str,
    sample_interval_sec: float = 5.0,   
)  -> List[Image.Image]:
    """
    Extract frames from a video at specified intervals.

    Args:
        video_path (str): Path to the video file.
        sample_interval_sec (float): Interval in seconds to sample frames.
    
    Raises:
        ValueError: If the video file cannot be opened.
        Exception: If a frame cannot be read at the specified timestamp.

    Returns:
        List[Image.Image]: List of PIL Image objects representing the sampled frames.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_sec = total_frames / fps

    frames = []
    timestamps = np.arange(0, duration_sec, sample_interval_sec)

    for timestamp in timestamps:
        miliseconds = float(timestamp) * 1000
        cap.set(cv2.CAP_PROP_POS_MSEC, miliseconds)

        success, frame = cap.read()
        if not success:
            raise Exception(f"[Warn] Failed to read frame at {timestamp:.2f} seconds.")

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(frame_rgb)
        frames.append(pil_image)

    cap.release()
    return frames

if __name__ == "__main__":
    # testing 

    # video_path = "trump_zelensky.mp4"
    # sample_interval_sec = 5.0  # Sample every 5 seconds

    # try:
    #     frames = sample_frames(video_path, sample_interval_sec)
    #     for timestamp, frame in frames:
    #         print(f"Timestamp: {timestamp:.2f} seconds, Frame size: {frame.size}")
    # except Exception as e:
    #     print(f"Error: {e}")
    pass