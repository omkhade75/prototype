from typing import List, Dict, Any

class DocumentChunker:
    """
    Splits document pages into bounded, overlapping chunks.
    Ensures that document metadata and authentic page numbers are preserved.
    """

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100):
        if chunk_overlap >= chunk_size:
            raise ValueError("chunk_overlap must be strictly less than chunk_size.")
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_pages(
        self,
        pages: List[Dict[str, Any]],
        document_id: Any = None
    ) -> List[Dict[str, Any]]:
        """
        Splits a list of page objects into overlapping text chunks:
        pages: [{"page_number": 1, "text": "..."}]
        Returns: [
          {
            "chunk_index": 0,
            "document_id": document_id,
            "page_number": 1,
            "content": "...",
            "token_count": 85,
            "char_count": 480
          }
        ]
        """
        chunks: List[Dict[str, Any]] = []
        global_index = 0

        for page in pages:
            page_no = page.get("page_number", 1)
            text = page.get("text", "").strip()

            if not text:
                continue

            # If text is shorter than chunk_size, create a single chunk
            if len(text) <= self.chunk_size:
                chunks.append({
                    "chunk_index": global_index,
                    "document_id": document_id,
                    "page_number": page_no,
                    "content": text,
                    "token_count": len(text.split()),
                    "char_count": len(text)
                })
                global_index += 1
                continue

            # Sliding window with overlap
            start = 0
            step = self.chunk_size - self.chunk_overlap

            while start < len(text):
                end = min(start + self.chunk_size, len(text))
                
                # Attempt to break on word or newline boundary within reasonable limit
                if end < len(text):
                    last_space = text.rfind(" ", start + step, end)
                    if last_space != -1 and last_space > start:
                        end = last_space

                chunk_content = text[start:end].strip()
                if chunk_content:
                    chunks.append({
                        "chunk_index": global_index,
                        "document_id": document_id,
                        "page_number": page_no,
                        "content": chunk_content,
                        "token_count": len(chunk_content.split()),
                        "char_count": len(chunk_content)
                    })
                    global_index += 1

                start += step
                if start >= len(text):
                    break

        return chunks
