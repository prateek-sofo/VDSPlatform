"""
Metric Compiler — validates and compiles metric formulas against the semantic layer.
"""
import re
from app.services.llm.client import LLMClient


class MetricCompiler:
    def __init__(self):
        self.llm = LLMClient()

    async def validate(self, formula: str) -> dict:
        """Validate a metric formula for semantic correctness and SQL safety."""
        issues = []
        warnings = []

        # SQL safety checks
        forbidden = ["DROP", "DELETE", "TRUNCATE", "INSERT", "UPDATE", "ALTER", "EXEC", "--", "/*"]
        for term in forbidden:
            if term.upper() in formula.upper():
                issues.append({"type": "security", "message": f"Forbidden SQL term: {term}", "severity": "CRITICAL"})

        # Structure checks
        if not any(agg in formula.upper() for agg in ["SUM", "COUNT", "AVG", "MAX", "MIN", "RATIO", "RATE", "/", "+"]):
            warnings.append({"type": "structure", "message": "Formula has no aggregation function", "severity": "WARN"})

        # Column reference check (basic)
        col_refs = re.findall(r'\b[a-z_]+\.[a-z_]+\b', formula.lower())
        unresolved = [r for r in col_refs if not r.startswith(("sum(", "count(", "avg("))]

        valid = len(issues) == 0
        return {
            "valid": valid,
            "issues": issues,
            "warnings": warnings,
            "formula": formula,
            "column_references": col_refs,
            "message": "Formula valid" if valid else f"{len(issues)} blocking issue(s)",
        }
