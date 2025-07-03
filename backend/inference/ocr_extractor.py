import easyocr
import cv2 
import numpy as np
from typing import List, Any
    
def extract_text_from_video_frame(reader: easyocr.Reader, video_path: str, frame_number: int) -> List[List[Any]]:
    """
    Extract text from a specific frame of a video using EasyOCR.

    Args:
        reader (easyocr.Reader): Initialized EasyOCR reader.
        video_path (str): Path to the video file.
        frame_number (int): The frame number to extract text from.

    Raises:
        ValueError: If the video file cannot be read or the frame number is invalid.
    
    Returns:
        List[List[Any]]: List of detected text with bounding boxes and confidence scores.
    """
    cap = cv2.VideoCapture(video_path)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number) 
    success, frame = cap.read()
    cap.release()

    if not success:
        raise ValueError(f"Could not read frame {frame_number} from video {video_path}")

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    return reader.readtext(frame_rgb)