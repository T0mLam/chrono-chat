import os
import sqlite3
from typing import Dict, Any, Optional
import ffmpeg
import hashlib

def video_exists(video_path: str, db_path: str = "./data/video_metadata.db") -> bool:
    """
    Check if a video exists in the SQLite database.

    Args:
        video_path (str): Path to the video file.
        db_path (str): Path to the SQLite database file.

    Returns:
        bool: True if the video exists, False otherwise.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute('SELECT 1 FROM video_metadata WHERE video_path = ?', (video_path,))
    exists = cursor.fetchone() is not None

    conn.close()
    return exists

def _save_video_thumbnail(video_path: str, thumbnail_dir: str = "./data/thumbnails") -> str:
    """
    Save a thumbnail image from the video at 1 second into the specified directory.

    Args:
        video_path (str): Path to the video file.
        thumbnail_dir (str): Directory where the thumbnail will be saved.

    Returns:
        str: Path to the saved thumbnail image.
    """
    os.makedirs(thumbnail_dir, exist_ok=True)
    filename = os.path.splitext(os.path.basename(video_path))[0] + ".jpg"
    thumbnail_path = os.path.join(thumbnail_dir, filename)

    (
        ffmpeg
        .input(video_path, ss=1)  # Grab frame at 1 second
        .output(thumbnail_path, vframes=1)
        .run(overwrite_output=True, quiet=True)
    )
    
    return thumbnail_path

def _extract_video_metadata(video_path: str, audio_path: str) -> Dict[str, Any]:
    probe = ffmpeg.probe(video_path)
    video_streams = next(stream for stream in probe['streams'] if stream['codec_type'] == 'video')

    thumbnail_path = _save_video_thumbnail(video_path)

    metadata = {
        "video_path": video_path,
        "audio_path": audio_path,   
        "duration": float(probe["format"]["duration"]), # in seconds
        "width": int(video_streams["width"]), # in pixels
        "height": int(video_streams["height"]), # in pixels
        "codec": video_streams["codec_name"], # e.g., 'h264'
        "fps": eval(video_streams["r_frame_rate"]), # fps
        "thumbnail_path": thumbnail_path, # Path to the thumbnail image
    }

    return metadata

def create_video_metadata_table(db_path: str = "./data/video_metadata.db"):
    """Create the video metadata table if it doesn't exist."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS video_metadata (
            video_id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_path TEXT UNIQUE,
            audio_path TEXT,
            duration REAL,
            width INTEGER,
            height INTEGER,
            codec TEXT,
            fps REAL,
            thumbnail_path TEXT,
            task_id TEXT,
            task_status TEXT,
            task_progress INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()

def store_video_metadata(
    video_path: str, 
    audio_path: str, 
    task_id: Optional[str] = None,
    task_status: Optional[str] = None,
    task_progress: Optional[int] = None,
    db_path: str = "./data/video_metadata.db"
) -> int:
    """
    Store video metadata in the SQLite database.

    Args:
        video_path (str): Path to the video file.
        audio_path (str): Path to the audio file.
        task_id (str, optional): ID of the processing task.
        task_status (str, optional): Current status of the task.
        task_progress (int, optional): Progress percentage of the task.
        db_path (str): Path to the SQLite database file.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    metadata = _extract_video_metadata(video_path, audio_path)

    cursor.execute('''
        INSERT OR REPLACE INTO video_metadata (
            video_path, audio_path, duration, width, height, codec, fps, 
            thumbnail_path, task_id, task_status, task_progress
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        metadata.get("video_path"),
        metadata.get("audio_path"),
        metadata.get("duration"),
        metadata.get("width"),
        metadata.get("height"),
        metadata.get("codec"),
        metadata.get("fps"),
        metadata.get("thumbnail_path"),
        task_id,
        task_status,
        task_progress
    ))

    video_id = cursor.lastrowid
    conn.commit()
    conn.close()
    if video_id is None:
        raise ValueError("Failed to insert video metadata - no row ID returned")
    return video_id

def update_task_status(
    video_path: str,
    task_id: Optional[str] = None,
    task_status: Optional[str] = None,
    task_progress: Optional[int] = None,
    db_path: str = "./data/video_metadata.db"
):
    """
    Update task status for a video.

    Args:
        video_path (str): Path to the video file.
        task_id (str, optional): ID of the processing task.
        task_status (str, optional): Current status of the task.
        task_progress (int, optional): Progress percentage of the task.
        db_path (str): Path to the SQLite database file.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute('''
        UPDATE video_metadata 
        SET task_id = ?, task_status = ?, task_progress = ?
        WHERE video_path = ?
    ''', (task_id, task_status, task_progress, video_path))

    conn.commit()
    conn.close()

def get_video_metadata(video_path: str, db_path: str = "./data/video_metadata.db") -> Optional[Dict[str, Any]]:
    """
    Get video metadata from the database.

    Args:
        video_path (str): Path to the video file.
        db_path (str): Path to the SQLite database file.

    Returns:
        Optional[Dict[str, Any]]: Video metadata if found, None otherwise.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM video_metadata WHERE video_path = ?
    ''', (video_path,))

    row = cursor.fetchone()
    conn.close()

    if row is None:
        return None

    return {
        "id": row[0],
        "video_path": row[1],
        "audio_path": row[2],
        "duration": row[3],
        "width": row[4],
        "height": row[5],
        "codec": row[6],
        "fps": row[7],
        "thumbnail_path": row[8],
        "task_id": row[9],
        "task_status": row[10],
        "task_progress": row[11],
        "created_at": row[12]
    }

def delete_video_metadata(video_path: str, db_path: str = "./data/video_metadata.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute('SELECT video_id, video_path, audio_path, thumbnail_path FROM video_metadata WHERE video_path = ?', (video_path,))
    row = cursor.fetchone()
    if row is None:
        raise ValueError("Video not found in database")
    
    video_id, video_path, audio_path, thumbnail_path = row
    
    cursor.execute('DELETE FROM video_metadata WHERE video_path = ?', (video_path,))
    conn.commit()
    conn.close()

    return row 

    