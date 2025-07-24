import re

def sanitize_filename(filename: str) -> str:
    return re.sub(r'[<>:"/\\|?*]', '_', filename or "unnamed_file")