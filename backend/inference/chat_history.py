import sqlite3
from typing import List, Dict, Any, Optional
import json

DB_PATH = "./data/chat_history.db"

class ChatHistory:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ChatHistory, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        self.db_path = DB_PATH
        self._init_db()

    def _init_db(self):
        """Initialize the SQLite database with required tables."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    chat_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_name TEXT OPTIONAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id INTEGER NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (chat_id) REFERENCES chat_sessions(chat_id)
                )
            """)
            conn.commit()
        
    def create_chat(self, chat_id: int, chat_name: Optional[str] = None) -> None:
        """Create a new chat session and return its ID."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO chat_sessions (chat_id, chat_name) VALUES (?, ?)", (chat_id, chat_name))
            conn.commit()

    def get_new_chat_id(self) -> int:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT MAX(chat_id) FROM chat_sessions")
            max_id = cursor.fetchone()[0]
        return max_id + 1 if max_id is not None else 1

    def add_message(self, chat_id: int, role: str, content: str):
        """Add a message to a specific chat session."""
        print(f"DEBUG: Inserting message into DB - chat_id: {chat_id}, role: {role}, content: {content[:50]}...")
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO chat_messages (chat_id, role, content) VALUES (?, ?, ?)",
                (chat_id, role, content)
            )
            # Update last_updated timestamp
            cursor.execute(
                "UPDATE chat_sessions SET last_updated = CURRENT_TIMESTAMP WHERE chat_id = ?",
                (chat_id,)
            )
            conn.commit()
        print(f"DEBUG: Successfully inserted message with ID: {cursor.lastrowid}")
    
    def get_history(self, chat_id: int) -> List[Dict[str, str]]:
        """Get the chat history for a specific session."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT role, content FROM chat_messages WHERE chat_id = ? ORDER BY timestamp ASC",
                (chat_id,)
            )
            rows = cursor.fetchall()
            return [{"role": row[0], "content": row[1]} for row in rows]

    def get_messages_for_llm(self, chat_id: int, limit: int = 15) -> List[Dict[str, str]]:
        """Get chat history formatted for LLM input."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT role, content 
                FROM chat_messages 
                WHERE chat_id = ? 
                AND id IN (
                    SELECT id 
                    FROM chat_messages 
                    WHERE chat_id = ? 
                    AND role != 'thinking'
                    ORDER BY timestamp DESC 
                    LIMIT ?
                )
                ORDER BY timestamp ASC
            """,
                (chat_id, chat_id, limit)
            )
            rows = cursor.fetchall()
            return [{"role": row[0], "content": row[1]} for row in rows]
    
    def clear_history(self, chat_id: int):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM chat_messages WHERE chat_id = ?", (chat_id,))
            conn.commit()
    
    def delete_chat(self, chat_id: int):
        """Delete an entire chat session."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM chat_messages WHERE chat_id = ?", (chat_id,))
            cursor.execute("DELETE FROM chat_sessions WHERE chat_id = ?", (chat_id,))
            conn.commit()

    def list_chats(self) -> List[Dict[str, Any]]:
        """List all chat sessions with their metadata."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    cs.chat_id,
                    cs.chat_name,
                    cs.created_at,
                    cs.last_updated,
                FROM chat_sessions cs
                LEFT JOIN chat_messages cm ON cs.chat_id = cm.chat_id
                GROUP BY cs.chat_id
                ORDER BY cs.last_updated DESC
            """)
            rows = cursor.fetchall()
            return [{
                "chat_id": row[0],
                "chat_name": row[1],
                "created_at": row[2],
                "last_updated": row[3],
                "message_count": row[4]
            } for row in rows]

    def get_chat_name(self, chat_id: int) -> Optional[str]:
        """Get the name of a chat session."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT chat_name FROM chat_sessions WHERE chat_id = ?",
                (chat_id,)
            )
            row = cursor.fetchone()
            return row[0] if row else None

    def update_chat_name(self, chat_id: int, new_name: str):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE chat_sessions SET chat_name = ? WHERE chat_id = ?",
                (new_name, chat_id)
            )
            conn.commit()

    def get_chats(self) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT chat_id, chat_name FROM chat_sessions ORDER BY last_updated DESC")
            rows = cursor.fetchall()
            return [{"chat_id": row[0], "chat_name": row[1]} for row in rows]
