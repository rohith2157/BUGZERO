"""Unit tests for SIMD engine modules.

Validates numerical accuracy of vectorized SSIM, collision matrix,
and cosine similarity against known reference values.
"""

import sys
import os
import unittest
import numpy as np
from PIL import Image
import io

# Add ai-core to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from utils.simd_vision_engine import compute_simd_diff, compute_simd_ssim, SIMD_TIER
from utils.simd_collision_engine import detect_simd_collisions
from utils.simd_feature_engine import (
    element_to_vector, elements_to_feature_matrix,
    batch_cosine_similarity, find_best_match, FEATURE_DIM
)


def _make_image_bytes(color: tuple, size: tuple = (100, 100)) -> bytes:
    """Create a solid-color test image as PNG bytes."""
    img = Image.new('RGB', size, color)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()


class TestSIMDVisionEngine(unittest.TestCase):
    """Test vectorized pixel diff and SSIM calculations."""

    def test_identical_images_diff(self):
        """Identical images should produce 0% drift."""
        img = _make_image_bytes((128, 64, 200))
        result = compute_simd_diff(img, img)
        self.assertAlmostEqual(result['drift_percentage'], 0.0, places=4)
        self.assertAlmostEqual(result['regression_score'], 100.0, places=2)
        self.assertEqual(result['mse'], 0.0)

    def test_different_images_diff(self):
        """Black vs white should produce significant drift."""
        black = _make_image_bytes((0, 0, 0))
        white = _make_image_bytes((255, 255, 255))
        result = compute_simd_diff(black, white)
        self.assertGreater(result['drift_percentage'], 90.0)
        self.assertAlmostEqual(result['regression_score'], 0.0, places=0)

    def test_identical_images_ssim(self):
        """SSIM of identical images should be ~1.0."""
        img = _make_image_bytes((100, 150, 200))
        ssim = compute_simd_ssim(img, img)
        self.assertGreater(ssim, 0.99)

    def test_inverted_images_ssim(self):
        """SSIM of black vs white should be very low."""
        black = _make_image_bytes((0, 0, 0))
        white = _make_image_bytes((255, 255, 255))
        ssim = compute_simd_ssim(black, white)
        self.assertLess(ssim, 0.1)

    def test_simd_tier_detected(self):
        """SIMD tier should be detected at import."""
        self.assertIn(SIMD_TIER, ['tier1_avx2', 'tier2_vectorized'])


class TestSIMDCollisionEngine(unittest.TestCase):
    """Test vectorized AABB collision matrix."""

    def test_no_overlap(self):
        """Non-overlapping boxes should produce no collisions."""
        elements = [
            {'x1': 0, 'y1': 0, 'x2': 50, 'y2': 50, 'tag': 'div', 'text': 'A'},
            {'x1': 100, 'y1': 100, 'x2': 150, 'y2': 150, 'tag': 'div', 'text': 'B'},
        ]
        defects = detect_simd_collisions(elements)
        self.assertEqual(len(defects), 0)

    def test_overlap_detected(self):
        """Overlapping boxes with different text should produce a collision."""
        elements = [
            {'x1': 0, 'y1': 0, 'x2': 100, 'y2': 100, 'tag': 'span', 'text': 'Hello'},
            {'x1': 50, 'y1': 50, 'x2': 150, 'y2': 150, 'tag': 'span', 'text': 'World'},
        ]
        defects = detect_simd_collisions(elements)
        self.assertEqual(len(defects), 1)
        self.assertEqual(defects[0]['type'], 'Visual')
        self.assertIn('overlaps', defects[0]['message'])

    def test_containment_filtered(self):
        """One box fully inside another should NOT be a collision (parent/child)."""
        elements = [
            {'x1': 0, 'y1': 0, 'x2': 200, 'y2': 200, 'tag': 'div', 'text': 'Parent'},
            {'x1': 50, 'y1': 50, 'x2': 150, 'y2': 150, 'tag': 'span', 'text': 'Child'},
        ]
        defects = detect_simd_collisions(elements)
        self.assertEqual(len(defects), 0)

    def test_identity_filtered(self):
        """Near-identical boxes (< 5px diff) should be filtered out."""
        elements = [
            {'x1': 10, 'y1': 10, 'x2': 100, 'y2': 100, 'tag': 'div', 'text': 'A'},
            {'x1': 12, 'y1': 12, 'x2': 102, 'y2': 102, 'tag': 'div', 'text': 'B'},
        ]
        defects = detect_simd_collisions(elements)
        self.assertEqual(len(defects), 0)

    def test_max_defects_limit(self):
        """Should respect max_defects cap."""
        # Create 10 overlapping elements
        elements = [
            {'x1': i*5, 'y1': i*5, 'x2': i*5+60, 'y2': i*5+60,
             'tag': 'span', 'text': f'El{i}'}
            for i in range(10)
        ]
        defects = detect_simd_collisions(elements, max_defects=3)
        self.assertLessEqual(len(defects), 3)

    def test_empty_text_filtered(self):
        """Both elements with empty text should be filtered out."""
        elements = [
            {'x1': 0, 'y1': 0, 'x2': 100, 'y2': 100, 'tag': 'div', 'text': ''},
            {'x1': 50, 'y1': 50, 'x2': 150, 'y2': 150, 'tag': 'div', 'text': ''},
        ]
        defects = detect_simd_collisions(elements)
        self.assertEqual(len(defects), 0)


class TestSIMDFeatureEngine(unittest.TestCase):
    """Test vectorized cosine similarity and feature extraction."""

    def test_identical_vectors_cosine(self):
        """Cosine similarity of identical vectors should be 1.0."""
        v = np.array([1.0, 2.0, 3.0, 4.0], dtype=np.float32)
        candidates = v.reshape(1, -1)
        scores = batch_cosine_similarity(candidates, v)
        self.assertAlmostEqual(float(scores[0]), 1.0, places=5)

    def test_orthogonal_vectors_cosine(self):
        """Cosine similarity of orthogonal vectors should be 0.0."""
        v1 = np.array([1.0, 0.0, 0.0, 0.0], dtype=np.float32)
        v2 = np.array([0.0, 1.0, 0.0, 0.0], dtype=np.float32)
        scores = batch_cosine_similarity(v1.reshape(1, -1), v2)
        self.assertAlmostEqual(float(scores[0]), 0.0, places=5)

    def test_element_to_vector_shape(self):
        """Feature vector should have correct dimension."""
        el = {'tagName': 'BUTTON', 'id': 'submit', 'className': 'btn primary',
              'textContent': 'Submit', 'rect': {'x': 100, 'y': 200, 'width': 80, 'height': 40}}
        vec = element_to_vector(el)
        self.assertEqual(vec.shape, (FEATURE_DIM,))
        self.assertEqual(vec.dtype, np.float32)

    def test_feature_matrix_shape(self):
        """Feature matrix should be (N, FEATURE_DIM)."""
        elements = [
            {'tagName': 'BUTTON', 'id': 'a', 'className': '', 'textContent': 'A',
             'rect': {'x': 10, 'y': 20, 'width': 50, 'height': 30}},
            {'tagName': 'INPUT', 'id': 'b', 'className': 'form', 'textContent': '',
             'rect': {'x': 100, 'y': 200, 'width': 150, 'height': 40}},
        ]
        matrix = elements_to_feature_matrix(elements)
        self.assertEqual(matrix.shape, (2, FEATURE_DIM))

    def test_find_best_match(self):
        """Should find the most similar element."""
        target = {'tagName': 'BUTTON', 'id': 'submit', 'className': 'btn',
                  'textContent': 'Submit', 'rect': {'x': 100, 'y': 200, 'width': 80, 'height': 40}}
        candidates = [
            {'tagName': 'DIV', 'id': '', 'className': 'wrapper',
             'textContent': 'Container', 'rect': {'x': 0, 'y': 0, 'width': 500, 'height': 500}},
            {'tagName': 'BUTTON', 'id': 'submit-btn', 'className': 'btn primary',
             'textContent': 'Submit Form', 'rect': {'x': 105, 'y': 205, 'width': 85, 'height': 42}},
        ]
        idx, score = find_best_match(target, candidates)
        self.assertEqual(idx, 1)  # The button should match better than the div
        self.assertGreater(score, 0.5)

    def test_empty_candidates(self):
        """Empty candidates should return -1."""
        target = {'tagName': 'BUTTON', 'id': '', 'className': '', 'textContent': '',
                  'rect': {'x': 0, 'y': 0, 'width': 0, 'height': 0}}
        idx, score = find_best_match(target, [])
        self.assertEqual(idx, -1)


if __name__ == '__main__':
    print(f"SIMD Tier: {SIMD_TIER}")
    print(f"NumPy: {np.__version__}")
    print()
    unittest.main(verbosity=2)
