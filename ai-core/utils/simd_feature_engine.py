"""SIMD Feature Engine — Vectorized DOM Selector Similarity.

Replaces scalar Levenshtein loops in self_healing_agent with vectorized
cosine similarity on packed float32 feature vectors.

ponytail: memory alignment matters here — DOM nodes are scattered dicts,
so we pack them into contiguous arrays ONCE, then vectorize the distance math.
"""

import logging
import numpy as np

logger = logging.getLogger(__name__)

# Feature dimensions for DOM element vectorization
# [tag_hash, id_len, class_count, text_len, x_norm, y_norm, w_norm, h_norm]
FEATURE_DIM = 8


def element_to_vector(el: dict, viewport_w: float = 1920.0, viewport_h: float = 1080.0) -> np.ndarray:
    """Convert a DOM element dict to a flat float32 feature vector.

    ponytail: simple numeric encoding — no embeddings model needed.
    Upgrade path: use a learned embedding from a fine-tuned DOM encoder.
    """
    tag_hash = hash(el.get('tagName', '')) % 1000 / 1000.0
    id_len = min(len(el.get('id', '')), 50) / 50.0
    class_count = min(len(el.get('className', '').split()), 10) / 10.0
    text_len = min(len(el.get('textContent', '')), 80) / 80.0

    rect = el.get('rect', {})
    x_norm = rect.get('x', 0) / viewport_w
    y_norm = rect.get('y', 0) / viewport_h
    w_norm = rect.get('width', 0) / viewport_w
    h_norm = rect.get('height', 0) / viewport_h

    return np.array([tag_hash, id_len, class_count, text_len,
                     x_norm, y_norm, w_norm, h_norm], dtype=np.float32)


def elements_to_feature_matrix(elements: list[dict],
                                viewport_w: float = 1920.0,
                                viewport_h: float = 1080.0) -> np.ndarray:
    """Pack N DOM elements into a contiguous (N, FEATURE_DIM) float32 matrix.

    This is the critical step: scattered Python dicts become a flat memory block
    that NumPy can load directly into AVX2 vector registers.
    """
    n = len(elements)
    if n == 0:
        return np.empty((0, FEATURE_DIM), dtype=np.float32)

    matrix = np.empty((n, FEATURE_DIM), dtype=np.float32)
    for i, el in enumerate(elements):
        matrix[i] = element_to_vector(el, viewport_w, viewport_h)
    return matrix


def batch_cosine_similarity(candidates: np.ndarray, query: np.ndarray) -> np.ndarray:
    """Vectorized cosine similarity between query vector and N candidate vectors.

    candidates: (N, D) float32 matrix — contiguous in memory
    query: (D,) float32 vector

    Returns: (N,) float32 array of similarity scores in [0, 1].

    All math is vectorized NumPy dot products — dispatched to AVX2 vfmadd231ps.
    """
    if candidates.shape[0] == 0:
        return np.array([], dtype=np.float32)

    # Vectorized dot product: (N, D) @ (D,) = (N,) — single SIMD pass
    dots = candidates @ query                           # SIMD: vfmadd231ps

    # Vectorized norms
    cand_norms = np.linalg.norm(candidates, axis=1)     # SIMD: vmulps + vsqrtps
    query_norm = np.linalg.norm(query)

    # Avoid division by zero
    denom = cand_norms * query_norm
    denom = np.where(denom == 0, 1.0, denom)

    return dots / denom


def find_best_match(target: dict, candidates: list[dict],
                    viewport_w: float = 1920.0,
                    viewport_h: float = 1080.0) -> tuple[int, float]:
    """Find the most similar DOM element to target from candidates.

    Returns (best_index, similarity_score).
    """
    if not candidates:
        return -1, 0.0

    query = element_to_vector(target, viewport_w, viewport_h)
    matrix = elements_to_feature_matrix(candidates, viewport_w, viewport_h)
    scores = batch_cosine_similarity(matrix, query)

    best_idx = int(np.argmax(scores))
    return best_idx, float(scores[best_idx])
