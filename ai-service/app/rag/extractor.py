import io
from typing import List, Dict, Any
import pypdf

class DocumentExtractor:
    """
    Extracts text and page-level metadata from PDF, TXT, and Markdown files.
    Preserves true page numbers where available and refuses unreadable or unsupported files.
    """
    
    ALLOWED_EXTENSIONS = {"pdf", "txt", "md"}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit

    @staticmethod
    def extract_from_bytes(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        """
        Parses raw bytes based on filename extension and returns a list of pages:
        [{"page_number": 1, "text": "..."}]
        """
        if not file_bytes:
            raise ValueError(f"Document '{filename}' is empty (0 bytes).")

        if len(file_bytes) > DocumentExtractor.MAX_FILE_SIZE:
            raise ValueError(
                f"File '{filename}' exceeds maximum allowed size of {DocumentExtractor.MAX_FILE_SIZE // (1024*1024)}MB."
            )

        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in DocumentExtractor.ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported file format '.{ext}'. Supported formats: PDF, TXT, Markdown (.md).")

        pages: List[Dict[str, Any]] = []

        if ext == "pdf":
            try:
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                total_pages = len(reader.pages)
                if total_pages == 0:
                    raise ValueError(f"PDF document '{filename}' has no pages.")

                for idx, page in enumerate(reader.pages, start=1):
                    extracted = page.extract_text() or ""
                    cleaned = extracted.strip()
                    if cleaned:
                        pages.append({
                            "page_number": idx,
                            "text": cleaned
                        })

                if not pages:
                    raise ValueError(f"PDF document '{filename}' contains no readable text (it may be scanned/image-only).")

            except Exception as e:
                if "contains no readable text" in str(e) or "empty" in str(e):
                    raise
                raise ValueError(f"Failed to parse PDF '{filename}': {str(e)}")

        elif ext in ("txt", "md"):
            try:
                # Attempt UTF-8 first, fallback to latin-1
                try:
                    text_content = file_bytes.decode("utf-8")
                except UnicodeDecodeError:
                    text_content = file_bytes.decode("latin-1")

                cleaned = text_content.strip()
                if not cleaned:
                    raise ValueError(f"Text document '{filename}' contains no text content.")

                pages.append({
                    "page_number": 1,
                    "text": cleaned
                })
            except Exception as e:
                raise ValueError(f"Failed to read '{filename}': {str(e)}")

        return pages
