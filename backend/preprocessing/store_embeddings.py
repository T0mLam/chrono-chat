import chromadb
from typing import List, Dict, Any

def get_chroma_collection(
    name: str,
    client: chromadb.PersistentClient,
) -> chromadb.Collection:
    """
    Get or create a ChromaDB collection for video embeddings.

    Args:
        name (str): Name of the collection.
        client (chromadb.PersistentClient): Shared ChromaDB PersistentClient.

    Returns:
        chromadb.Collection: The ChromaDB collection.
    """
    return client.get_or_create_collection(name=name)

def store_frame_embeddings(
    collection: chromadb.Collection,
    video_filename: str,
    frame_embeddings: List[Dict[str, Any]],
) -> None:
    """
    Store frame embeddings in the ChromaDB collection.

    Args:
        collection (chromadb.Collection): The ChromaDB collection.
        video_filename (str): Filename of the video (e.g., "trump_zelensky.mp4").
        frame_embeddings (List[Dict[str, Any]]): List of frame embeddings to store.
    """
    ids = []
    embeddings = []
    metadatas = []

    for i, seg in enumerate(frame_embeddings):
        vector_id = f"{video_filename}_frame_{i}"
        ids.append(vector_id)
        embeddings.append(seg["emb"])
        metadatas.append({
            "video_filename": video_filename,
            "modality": "frame",
            "ts_start": seg["start"],
            "ts_end": seg["start"],
            "text": seg["text"]
        })

    collection.add(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
    )

def store_audio_embeddings(
    collection: chromadb.Collection,
    video_filename: str,
    segments: List[Dict[str, Any]],
) -> None:
    """
    Store audio embedding in the ChromaDB collection.

    Args:
        collection (chromadb.Collection): The ChromaDB collection.
        video_filename (str): Filename of the video (e.g., "trump_zelensky.mp4").
        audio_embedding (List[Dict[str, Any]]): List of audio segments with embeddings to store.
    """
    ids = []
    embeddings = []
    metadatas = []

    for i, seg in enumerate(segments):
        vector_id = f"{video_filename}_asr_{i}"
        ids.append(vector_id)
        embeddings.append(seg["emb"])
        metadatas.append({
            "video_filename": video_filename,
            "modality": "asr",
            "ts_start": seg["start"],
            "ts_end": seg["end"],
            "text": seg["text"]
        })

    collection.add(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
    )

def delete_all_embeddings(video_filename: str):
    client = chromadb.PersistentClient(path="./data/chroma_db")

    for collection in client.list_collections():
        collection.delete(where={"video_filename": video_filename})