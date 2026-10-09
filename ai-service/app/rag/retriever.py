import re
import math
from typing import List, Dict, Any, Set

STOPWORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", 
    "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", 
    "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", 
    "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", 
    "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", 
    "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she", 
    "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", 
    "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too", 
    "under", "until", "up", "very", "was", "we", "were", "what", "when", "where", "which", 
    "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself"
}

class TFIDFRetriever:
    """
    Transparent TF-IDF (Term Frequency - Inverse Document Frequency) Retriever.
    Provides clear, explainable keyword ranking without external vector databases or hidden weights.
    """

    @staticmethod
    def tokenize(text: str) -> List[str]:
        """
        Tokenizes text into lowercase alphanumeric words, filtering out stopwords.
        """
        words = re.findall(r'\b[a-zA-Z0-9_\-]{2,}\b', text.lower())
        return [w for w in words if w not in STOPWORDS]

    @classmethod
    def rank_chunks(
        cls,
        query: str,
        chunks: List[Dict[str, Any]],
        top_k: int = 3,
        min_score: float = 0.05
    ) -> List[Dict[str, Any]]:
        """
        Scores and ranks chunks against a query using TF-IDF and Cosine Similarity.
        Returns top_k chunks with their calculated TF-IDF score.
        """
        if not chunks or not query.strip():
            return []

        query_tokens = cls.tokenize(query)
        if not query_tokens:
            return []

        num_docs = len(chunks)

        # 1. Compute Document Frequencies (DF) for each term across the chunk corpus
        df: Dict[str, int] = {}
        chunk_token_lists: List[List[str]] = []

        for chunk in chunks:
            tokens = cls.tokenize(chunk.get("content", ""))
            chunk_token_lists.append(tokens)
            unique_terms = set(tokens)
            for term in unique_terms:
                df[term] = df.get(term, 0) + 1

        # 2. Compute IDF for terms: log(1 + num_docs / df[term])
        idf: Dict[str, float] = {}
        for term, freq in df.items():
            idf[term] = math.log(1.0 + (num_docs / freq))

        # 3. Compute Query vector
        query_tf: Dict[str, float] = {}
        for term in query_tokens:
            query_tf[term] = query_tf.get(term, 0.0) + 1.0

        query_vec: Dict[str, float] = {}
        query_norm_sq = 0.0
        for term, count in query_tf.items():
            # Use query IDF or default to log(1 + num_docs) for unseen query terms
            term_idf = idf.get(term, math.log(1.0 + num_docs))
            tfidf = (count / len(query_tokens)) * term_idf
            query_vec[term] = tfidf
            query_norm_sq += tfidf ** 2

        query_norm = math.sqrt(query_norm_sq)
        if query_norm == 0.0:
            return []

        # 4. Compute Cosine Similarity for each chunk
        scored_chunks: List[Dict[str, Any]] = []

        for idx, chunk in enumerate(chunks):
            tokens = chunk_token_lists[idx]
            if not tokens:
                continue

            # Compute chunk TF
            chunk_tf: Dict[str, float] = {}
            for t in tokens:
                chunk_tf[t] = chunk_tf.get(t, 0.0) + 1.0

            chunk_vec: Dict[str, float] = {}
            chunk_norm_sq = 0.0
            for t, count in chunk_tf.items():
                term_idf = idf.get(t, 0.0)
                tfidf = (count / len(tokens)) * term_idf
                chunk_vec[t] = tfidf
                chunk_norm_sq += tfidf ** 2

            chunk_norm = math.sqrt(chunk_norm_sq)
            if chunk_norm == 0.0:
                continue

            # Dot product between query and chunk
            dot_product = 0.0
            matched_terms = []
            for term, q_val in query_vec.items():
                if term in chunk_vec:
                    dot_product += q_val * chunk_vec[term]
                    matched_terms.append(term)

            similarity = dot_product / (query_norm * chunk_norm)

            if similarity >= min_score:
                scored_item = dict(chunk)
                scored_item["score"] = round(similarity, 4)
                scored_item["matched_terms"] = matched_terms
                scored_chunks.append(scored_item)

        # Sort descending by score
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]
