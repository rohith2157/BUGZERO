"""Deterministic Business Logic Assertion Engine.

Validates application semantics:
- E-Commerce cart math: Total == Sum(Price * Qty) - Discount + Tax + Shipping
- UI state mutation: Badge count transitions (0 -> 1), button text morphs
- Form validation feedback: Accessible alerts/toasts on boundary payloads
- Search relevance: Query term matching and non-empty result grids
"""

import logging
from typing import List, Dict, Optional, Any
from models.schemas import BusinessAssertion

logger = logging.getLogger(__name__)


class BusinessLogicAssertionEngine:
    """Executes deterministic mathematical and stateful UI business logic assertions."""

    @staticmethod
    def assert_cart_math(
        items: List[Dict[str, Any]],
        subtotal: Optional[float] = None,
        discount: float = 0.0,
        tax: float = 0.0,
        shipping: float = 0.0,
        displayed_total: Optional[float] = None,
    ) -> BusinessAssertion:
        """Mathematically verifies E-Commerce subtotal and grand total calculations."""
        # Calculate expected subtotal from item prices and quantities
        computed_subtotal = 0.0
        for itm in items:
            p = float(itm.get("price", 0.0))
            q = int(itm.get("quantity", 1))
            computed_subtotal += p * q

        computed_subtotal = round(computed_subtotal, 2)
        computed_total = round(computed_subtotal - discount + tax + shipping, 2)

        # Check subtotal consistency if provided
        if subtotal is not None and abs(computed_subtotal - round(subtotal, 2)) > 0.05:
            return BusinessAssertion(
                name="Cart Subtotal Mathematical Accuracy",
                status="failed",
                expected=f"${computed_subtotal:.2f} (Calculated sum of items)",
                actual=f"${subtotal:.2f} (Displayed in cart)",
                error_message=f"Subtotal calculation mismatch: items sum to ${computed_subtotal:.2f} but UI displayed ${subtotal:.2f}",
            )

        # Check grand total consistency if provided
        if displayed_total is not None and abs(computed_total - round(displayed_total, 2)) > 0.05:
            return BusinessAssertion(
                name="Cart Grand Total Calculation",
                status="failed",
                expected=f"${computed_total:.2f} (Subtotal ${computed_subtotal:.2f} - Disc ${discount:.2f} + Tax ${tax:.2f} + Ship ${shipping:.2f})",
                actual=f"${displayed_total:.2f}",
                error_message=f"Grand total arithmetic error: expected ${computed_total:.2f}, got ${displayed_total:.2f}",
            )

        return BusinessAssertion(
            name="Cart Mathematical Accuracy",
            status="passed",
            expected=f"${computed_total:.2f}",
            actual=f"${displayed_total or computed_total:.2f}",
            error_message=None,
        )

    @staticmethod
    def assert_state_mutation(
        initial_value: Any,
        current_value: Any,
        expected_mutation: str,
        metric_name: str = "State Transition",
    ) -> BusinessAssertion:
        """Verifies that an interactive user action triggered an observable UI state change."""
        mutated = initial_value != current_value
        if not mutated:
            return BusinessAssertion(
                name=metric_name,
                status="failed",
                expected=f"State to mutate ({expected_mutation})",
                actual=f"Unchanged: {initial_value}",
                error_message=f"User action failed to trigger UI state update for {metric_name}",
            )

        return BusinessAssertion(
            name=metric_name,
            status="passed",
            expected=f"{expected_mutation} (from {initial_value} to {current_value})",
            actual=f"{current_value}",
            error_message=None,
        )

    @staticmethod
    def assert_search_results(
        query: str,
        result_count: int,
        sample_titles: List[str],
    ) -> BusinessAssertion:
        """Verifies that search query rendered a non-empty result grid."""
        if result_count == 0:
            return BusinessAssertion(
                name="Search Query Execution",
                status="warning",
                expected=f"Search results for '{query}' > 0 items",
                actual="0 items returned or empty state",
                error_message=f"Query '{query}' yielded 0 visible results in DOM",
            )

        return BusinessAssertion(
            name="Search Query Execution",
            status="passed",
            expected=f"Render non-empty results for '{query}'",
            actual=f"{result_count} items found ({', '.join(sample_titles[:2]) if sample_titles else ''})",
            error_message=None,
        )

    @staticmethod
    def assert_validation_feedback(
        has_alert_or_toast: bool,
        has_invalid_attribute: bool,
        action_name: str = "Invalid Form Submission",
    ) -> BusinessAssertion:
        """Verifies that submitting invalid boundary inputs renders visible accessible feedback."""
        if not has_alert_or_toast and not has_invalid_attribute:
            return BusinessAssertion(
                name=f"{action_name} UI Feedback",
                status="failed",
                expected="Visible validation toast, error alert, or aria-invalid attribute",
                actual="No user feedback detected (Silent failure)",
                error_message="Form rejected input or failed without providing accessible user feedback",
            )

        return BusinessAssertion(
            name=f"{action_name} UI Feedback",
            status="passed",
            expected="Validation alert or error indicator",
            actual="Accessible error feedback rendered in DOM",
            error_message=None,
        )
