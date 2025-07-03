import os
from pytubefix import YouTube
from typing import Tuple

def is_youtube_video_downloadable(url: str) -> bool:
    """
    Check if a YouTube video can be downloaded.

    Args:
        url (str): URL of the YouTube video.

    Returns:
        bool: True if the video can be downloaded, False otherwise.
    """
    try:
        yt = YouTube(url)
        return yt.streams.filter(file_extension='mp4').first() is not None
    except Exception as e:
        print(f"Error checking video: {e}")
        return False

def download_youtube_video(
    url: str, 
    output_video_path: str = "./data/videos"
    #output_audio_path: str = "./data/audio",
) -> str:
    """
    Download a YouTube video using pytube.

    Args:
        url (str): URL of the YouTube video.
        output_video_path (str): Path to save the downloaded video.
    
    Raises:
        ValueError: If no video stream is found for the specified resolution.

    Returns:
        str: Path to the downloaded video file.
    """
    yt = YouTube(url)

    video_stream = yt.streams.filter(file_extension='mp4').first()  
    # audio_stream = yt.streams.filter(
    #     only_audio=True,
    #     file_extension='mp4', 
    # ).first()           

    if not video_stream:
        raise ValueError(f"No video stream found.")

    os.makedirs(output_video_path, exist_ok=True)
    # os.makedirs(output_audio_path, exist_ok=True)

    output_video_file = video_stream.download(output_video_path)
    # output_audio_file = audio_stream.download(output_audio_path)

    return output_video_file

if __name__ == "__main__":
    video_url = "https://www.youtube.com/watch?v=eGzwB1h9VbU"
    print(download_youtube_video(video_url))