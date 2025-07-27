import re

def sanitize_filename(filename: str) -> str:
    # Remove characters that are problematic for filenames and URLs
    # Includes: < > : " / \ | ? * # % [ ] { } + spaces and other URL-problematic chars
    return re.sub(r'[<>:"/\\|?*#%\[\]{}+]', '_', filename or "unnamed_file")