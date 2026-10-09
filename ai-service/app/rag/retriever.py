import re
import math
from typing import List, Dict, Any, Set, Tuple

# Comprehensive English stop words including common conversational/question words
STOPWORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", 
    "by", "can", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", 
    "further", "get", "give", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", 
    "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", 
    "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", 
    "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she", 
    "should", "show", "so", "some", "such", "tell", "than", "that", "the", "their", "theirs", "them", 
    "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too", 
    "under", "until", "up", "use", "uses", "used", "using", "very", "was", "we", "were", "what", "when", "where", "which", 
    "while", "who", "whom", "why", "will", "with", "would", "you", "your", "yours", "yourself"
}

# Domain-wide generic terms that identify the system itself rather than specific topics
DOMAIN_GENERIC_TERMS: Set[str] = {"orbit", "ai"}


def stem_term(term: str) -> str:
    """
    Lightweight, transparent rule-based stemmer for English information retrieval.
    Normalizes morphological variants (e.g. 'retrieval', 'retriever', 'retrieved' -> 'retriev')
    so keyword retrieval matches conceptual stems across questions and documents.
    """
    t = term.lower().strip()
    if len(t) <= 3:
        return t

    # Canonical IR stems for domain concepts
    if t.startswith("retriev"): return "retriev"
    if t.startswith("execut"): return "execut"
    if t.startswith("valid"): return "valid"
    if t.startswith("approv"): return "approv"
    if t.startswith("extract"): return "extract"
    if t.startswith("summari"): return "summari"
    if t.startswith("knowledg"): return "knowledg"
    if t.startswith("method"): return "method"
    if t.startswith("rank"): return "rank"
    if t.startswith("chunk"): return "chunk"
    if t.startswith("model"): return "model"
    if t.startswith("passag"): return "passag"
    if t.startswith("citat"): return "citat"
    if t.startswith("document"): return "document"

    # Standard English suffix reductions
    suffixes = [
        ("ations", "ate"), ("ation", "ate"), ("ational", "ate"),
        ("ements", ""), ("ement", ""), ("ments", ""), ("ment", ""),
        ("alities", "al"), ("ality", "al"),
        ("iveness", "ive"), ("ive", ""),
        ("encies", "ence"), ("ence", ""),
        ("ancies", "ance"), ("ance", ""),
        ("ables", ""), ("able", ""),
        ("ibles", ""), ("ible", ""),
        ("ingly", ""), ("ings", ""), ("ing", ""),
        ("fully", ""), ("ful", ""),
        ("ously", ""), ("ous", ""),
        ("alism", "al"), ("alist", "al"), ("als", ""), ("al", ""),
        ("ities", "ity"), ("ity", ""),
        ("ises", "ise"), ("ised", "ise"), ("ising", "ise"),
        ("izes", "ize"), ("ized", "ize"), ("izing", "ize"),
        ("iers", "ier"), ("ier", ""),
        ("ers", ""), ("er", ""),
        ("ors", ""), ("or", ""),
        ("ies", "y"), ("ied", "y"),
        ("es", ""), ("ed", ""),
        ("ly", ""),
        ("s", "")
    ]
    for sfx, rep in suffixes:
        if t.endswith(sfx) and len(t) - len(sfx) >= 3:
            return t[:-len(sfx)] + rep
    return t


class TFIDFRetriever:
    """
    Transparent TF-IDF (Term Frequency - Inverse Document Frequency) Retriever.
    Provides clear, explainable keyword ranking with morphological normalization
    and domain-term suppression without requiring black-box embeddings.
    """

    @classmethod
    def tokenize_with_surface_map(
        cls,
        text: str,
        is_query: bool = False
    ) -> Tuple[List[str], Dict[str, str]]:
        """
        Tokenizes text into normalized stems and preserves surface forms
        for human-readable citation keyword badges in the UI.
        """
        # Extract alphanumeric words and preserve hyphenated tokens like 'tf-idf'
        raw_words = re.findall(r'\b[a-zA-Z0-9_\-]{2,}\b', text.lower())
        expanded_words = []
        for w in raw_words:
            if '-' in w:
                parts = [p for p in w.split('-') if len(p) >= 2]
                expanded_words.extend(parts)
                expanded_words.append(w.replace('-', ''))
            expanded_words.append(w)

        # Filter standard conversational stop words
        filtered = [w for w in expanded_words if w not in STOPWORDS]

        # For search queries: if the query contains specific topical words in addition
        # to generic domain terms ('orbit', 'ai'), remove the generic domain terms
        # so they do not dominate ranking over the user's actual information need.
        if is_query:
            non_generic = [w for w in filtered if w not in DOMAIN_GENERIC_TERMS]
            if non_generic:
                filtered = non_generic

        stems: List[str] = []
        surface_map: Dict[str, str] = {}

        for w in filtered:
            s = stem_term(w)
            stems.append(s)
            if s not in surface_map:
                surface_map[s] = w

        return stems, surface_map

    @classmethod
    def tokenize(cls, text: str, is_query: bool = False) -> List[str]:
        """
        Tokenizes text into normalized stems, filtering out stop words.
        """
        stems, _ = cls.tokenize_with_surface_map(text, is_query=is_query)
        return stems

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
        Employs sublinear TF scaling and coordination weighting to prioritize chunks
        that genuinely cover the user's question concepts.
        """
        if not chunks or not query or not query.strip():
            return []

        query_stems, query_surface_map = cls.tokenize_with_surface_map(query, is_query=True)
        if not query_stems:
            return []

        num_docs = len(chunks)

        # 1. Compute Document Frequencies (DF) across the chunk corpus
        df: Dict[str, int] = {}
        chunk_stem_lists: List[List[str]] = []
        chunk_surface_maps: List[Dict[str, str]] = []

        for chunk in chunks:
            stems, s_map = cls.tokenize_with_surface_map(chunk.get("content", ""), is_query=False)
            chunk_stem_lists.append(stems)
            chunk_surface_maps.append(s_map)
            unique_terms = set(stems)
            for term in unique_terms:
                df[term] = df.get(term, 0) + 1

        # 2. Compute smooth IDF: log(1 + N / df)
        idf: Dict[str, float] = {}
        for term, freq in df.items():
            idf[term] = math.log(1.0 + (num_docs / freq))

        # 3. Compute Query vector with sublinear term frequency: 1 + log(tf)
        query_counts: Dict[str, int] = {}
        for term in query_stems:
            query_counts[term] = query_counts.get(term, 0) + 1

        query_vec: Dict[str, float] = {}
        query_norm_sq = 0.0
        for term, count in query_counts.items():
            sublinear_tf = 1.0 + math.log(count)
            term_idf = idf.get(term, math.log(1.0 + num_docs))
            tfidf = sublinear_tf * term_idf
            query_vec[term] = tfidf
            query_norm_sq += tfidf ** 2

        query_norm = math.sqrt(query_norm_sq)
        if query_norm == 0.0:
            return []

        # 4. Compute Cosine Similarity for each document chunk
        scored_chunks: List[Dict[str, Any]] = []

        for idx, chunk in enumerate(chunks):
            stems = chunk_stem_lists[idx]
            if not stems:
                continue

            # Compute chunk sublinear TF-IDF vector
            chunk_counts: Dict[str, int] = {}
            for t in stems:
                chunk_counts[t] = chunk_counts.get(t, 0) + 1

            chunk_vec: Dict[str, float] = {}
            chunk_norm_sq = 0.0
            for t, count in chunk_counts.items():
                sublinear_tf = 1.0 + math.log(count)
                term_idf = idf.get(t, 0.0)
                tfidf = sublinear_tf * term_idf
                chunk_vec[t] = tfidf
                chunk_norm_sq += tfidf ** 2

            chunk_norm = math.sqrt(chunk_norm_sq)
            if chunk_norm == 0.0:
                continue

            # Dot product between query and chunk
            dot_product = 0.0
            matched_surface_words = []
            for term, q_val in query_vec.items():
                if term in chunk_vec:
                    dot_product += q_val * chunk_vec[term]
                    # Display the readable surface word from chunk or query
                    surface_word = (
                        chunk_surface_maps[idx].get(term) 
                        or query_surface_map.get(term) 
                        or term
                    )
                    matched_surface_words.append(surface_word)

            cosine_sim = dot_product / (query_norm * chunk_norm)

            if cosine_sim >= min_score:
                scored_item = dict(chunk)
                scored_item["score"] = round(cosine_sim, 4)
                # Deduplicate matched surface terms while preserving order
                scored_item["matched_terms"] = list(dict.fromkeys(matched_surface_words))
                scored_chunks.append(scored_item)

        # Sort descending by score
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]
