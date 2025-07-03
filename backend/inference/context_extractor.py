import os
import chromadb
import sqlite3
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from sklearn.cluster import MiniBatchKMeans
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import CrossEncoder

from embedding.clip_embedder import ClipEmbedder
from embedding.whisper_embedder import WhisperTextEmbedder

CHROMA_DIR = "./data/chroma_db"
METADATA_DB = "./data/video_metadata.db"
VIDEO_PATH = os.path.abspath("./data/videos")

class ContextExtractor:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)

        # Initialize embedders
        self.clip_embedder = ClipEmbedder()
        self.whisper_embedder = WhisperTextEmbedder()

        self.video_collection_name = "frames"
        self.audio_collection_name = "asr"

        self.cross_encoder = CrossEncoder("BAAI/bge-reranker-base")

    def _get_query_embedding(self, question: str, collection_name: str) -> List[float]:
        if collection_name == "frames":
            return self.clip_embedder.embed_query(question)
        elif collection_name == "asr":
            return self.whisper_embedder.embed_query(question)
        else:
            raise ValueError(f"Invalid collection name: {collection_name}")

    def _get_closest_to_centroids_cosine(self, cluster_centers, embeddings):
        similarities = cosine_similarity(cluster_centers, np.array(embeddings))
        closest_indices = similarities.argmax(axis=1)
        return closest_indices
    
    def _get_clustered_context(self, results, n_results: int = 20) -> Dict[str, Any]:
        texts = [metadata["text"] for metadata in results["metadatas"]]
        embeddings = results["embeddings"]
        n_results = min(len(texts), n_results)
        print("start clustering")

        kmeans = MiniBatchKMeans(n_clusters=n_results, random_state=42, batch_size=64)
        kmeans.fit(embeddings)
        print("end clustering")

        closest_indices = self._get_closest_to_centroids_cosine(kmeans.cluster_centers_, embeddings)
        results["metadatas"] = [results["metadatas"][i] for i in closest_indices]

        return results
        
    def _get_all_context(self, video_filename: str, collection_name: str) -> Dict[str, Any]:
        collection = self.chroma_client.get_collection(collection_name)
        results = collection.get(
            where={"video_filename": video_filename},
            include=["metadatas", "embeddings"]
        )
        return results
    
    def _get_selected_time_context(self, config: Dict[str, Any], video_filename: str, video_metadata: Dict[str, Any], collection_name: str) -> Dict[str, Any]:
        start_sec, end_sec = config["timestamp_range"]

        collection = self.chroma_client.get_collection(collection_name)
        results = collection.get(
            where={
                "video_filename": video_filename,
                "ts_start": {"$gte": max(0, start_sec - 30), "$lte": min(end_sec + 30, video_metadata["duration"])},
                "ts_end": {"$gte": max(0, start_sec - 30), "$lte": min(end_sec + 30, video_metadata["duration"])}
            },
            include=["metadatas", "embeddings"]
        )

        return results
        
    def _get_relevant_context(self, question: str, video_filename: str, collection_name: str, n_results: int = 40) -> Dict[str, Any]:
        collection = self.chroma_client.get_collection(collection_name)
        query_embedding = self._get_query_embedding(question, collection_name)

        results = collection.query(
            query_embeddings=[query_embedding],
            where={"video_filename": video_filename},
            n_results=n_results,
            include=["metadatas", "embeddings", "distances"]
        )

        flattened_results = {
            "ids": results["ids"][0] if results["ids"] else [],
            "metadatas": results["metadatas"][0] if results["metadatas"] else [],
            "embeddings": results["embeddings"][0] if results["embeddings"] else [],
            "distances": results["distances"][0] if results["distances"] else []
        }

        return flattened_results
    
    def _mmr(self, results: Dict[str, Any], question: str, collection_name: str, n_results: int = 50, lambda_value: float = 0.7) -> Dict[str, Any]:
        embeddings = results["embeddings"]
        query_embedding = self._get_query_embedding(question, collection_name)

        selected = []
        remaining = list(range(len(embeddings)))

        while len(selected) < n_results and remaining:
            mmr_scores = []

            for i in remaining:
                relevance_score = cosine_similarity(np.array([query_embedding]), np.array([embeddings[i]]))[0][0]
                diversity_score = max(
                    [
                        cosine_similarity(
                            np.array([embeddings[i]]), 
                            np.array([embeddings[j]])
                        )[0][0] for j in selected
                    ],
                    default=0.0
                )
                score = lambda_value * relevance_score - (1 - lambda_value) * diversity_score
                mmr_scores.append((i, score))

            best = max(mmr_scores, key=lambda x: x[1])[0]
            selected.append(best)
            remaining.remove(best)

        # Return results in the same format as other methods
        return {
            "ids": [results["ids"][i] for i in selected] if results["ids"] else [],
            "metadatas": [results["metadatas"][i] for i in selected] if results["metadatas"] else [],
            "embeddings": [embeddings[i] for i in selected] if len(results["embeddings"]) > 0 else [],
            "distances": [results["distances"][i] for i in selected] if results["distances"] else []
        }

    def _rerank_with_bge(self, results: Dict[str, Any], question: str, n_results: int = 30) -> Dict[str, Any]:
        texts = [metadata["text"] for metadata in results["metadatas"]]
        pairs = [(text, question) for text in texts]
        scores = self.cross_encoder.predict(pairs)
        sorted_indices = np.argsort(scores)[::-1]
        sorted_indices = sorted_indices[:n_results]

        return {
            "ids": [results["ids"][i] for i in sorted_indices] if results["ids"] else [],
            "metadatas": [results["metadatas"][i] for i in sorted_indices] if results["metadatas"] else [],
            "embeddings": [results["embeddings"][i] for i in sorted_indices] if len(results["embeddings"]) > 0 else [],
            "distances": [results["distances"][i] for i in sorted_indices] if results["distances"] else []
        }

    def _timepin_context(self, config: Dict[str, Any], question: str, video_filename: str, video_metadata: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        asr_results = self._get_selected_time_context(config, video_filename, video_metadata, self.audio_collection_name)
        asr_results = self._get_clustered_context(asr_results, n_results=45)

        frame_results = self._get_selected_time_context(config, video_filename, video_metadata, self.video_collection_name)
        frame_results = self._get_clustered_context(frame_results, n_results=15)

        return asr_results, frame_results   
    
    def _summary_context(self, config: Dict[str, Any], question: str, video_name: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        # Get context from both ASR and frame collections
        asr_results = self._get_all_context(video_name, self.audio_collection_name)
        asr_results = self._get_clustered_context(asr_results, n_results=45)

        frame_results = self._get_all_context(video_name, self.video_collection_name)
        frame_results = self._get_clustered_context(frame_results, n_results=15)
                
        return asr_results, frame_results
    
    def _query_context(self, config: Dict[str, Any], question: str, video_name: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        frame_results = self._get_relevant_context(question, video_name, self.video_collection_name, n_results=100)
        # frame_results = self._mmr(frame_results, question, self.video_collection_name, n_results=50)
        frame_results = self._rerank_with_bge(frame_results, question, n_results=45)

        asr_results = self._get_relevant_context(question, video_name, self.audio_collection_name, n_results=100)
        # asr_results = self._mmr(asr_results, question, self.audio_collection_name, n_results=50)
        asr_results = self._rerank_with_bge(asr_results, question, n_results=15)

        return frame_results, asr_results

    def get_video_metadata(self, video_name: str) -> Dict[str, Any]:
        with sqlite3.connect(METADATA_DB) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM video_metadata WHERE video_path = ?", (os.path.join(VIDEO_PATH, video_name),))

            row = cursor.fetchone()
            if row is None:
                return {}
            
            metadata = {
                "video_id": int(row[0]),
                "video_path": row[1],
                "audio_path": row[2],
                "duration": row[3],
                "width": row[4],
                "height": row[5],
                "codec": row[6],
                "fps": row[7],
                "thumbnail_path": row[8]
            }
            
            return metadata
        
    def get_video_metadata_context(self, video_name: str) -> str:
        metadata = self.get_video_metadata(video_name)
        if not metadata:
            return ""
        context_parts = []
        
        context_parts.append(f"Video Information of {os.path.basename(metadata['video_path'])}:")
        context_parts.append(f"- Duration: {metadata['duration']} seconds")
        context_parts.append(f"- Resolution: {metadata['width']}x{metadata['height']}")
        context_parts.append(f"- FPS: {metadata['fps']}")

        return "\n".join(context_parts)

    def format_context(
        self, 
        config: Dict[str, Any],
        question: str, 
        video_names: List[str]
    ) -> str:
        if config["mode"] == "ignore":
            return ""
        
        context_parts = []

        for video_name in video_names:
            video_metadata = self.get_video_metadata(video_name)
            
            # Initialize results with empty defaults
            asr_results = {"metadatas": []}
            frame_results = {"metadatas": []}
            
            if config["mode"] in ["summary", "timestamps"]:
                asr_results, frame_results = self._summary_context(config, question, video_name)
            elif config["mode"] == "query":
                asr_results, frame_results = self._query_context(config, question, video_name)

            # Add video metadata if available
            if video_metadata:
                context_parts.append("\n" + self.get_video_metadata_context(video_name))

            # Add relevant ASR context
            if asr_results and asr_results["metadatas"]:
                context_parts.append("\nRelevant Speech:")
                for metadata in asr_results["metadatas"]:
                    start_minute = int(metadata['ts_start'] // 60)
                    start_second = int(metadata['ts_start'] % 60)
                    end_minute = int(metadata['ts_end'] // 60)
                    end_second = int(metadata['ts_end'] % 60)
                    context_parts.append(f"At {start_minute}:{start_second:02d} - {end_minute}:{end_second:02d}: {metadata['text']}")

            # Add relevant frame context
            if frame_results and frame_results["metadatas"]:
                context_parts.append("\nRelevant Visual Scenes:")
                for metadata in frame_results["metadatas"]:
                    start_minute = int(metadata['ts_start'] // 60)
                    start_second = int(metadata['ts_start'] % 60)
                    context_parts.append(f"At {start_minute}:{start_second:02d}: {metadata['text']}")

        context = "\n".join(context_parts)
        return context