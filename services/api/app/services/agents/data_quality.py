"""Data Quality Agent — profiles and cleans data with full transparency."""
import pandas as pd
import numpy as np
from typing import Optional
from app.services.agents.base import BaseAgent

SYSTEM_PROMPT = """
ROLE: Data Quality & Cleaning Agent (Data Engineer + Statistician)
You detect, diagnose, and propose fixes for data quality issues with complete transparency.
Every change is logged. Nothing is silently dropped or modified.

CHECK DIMENSIONS:
1. FRESHNESS: Is data within expected lag for each source?
2. COMPLETENESS: Null rates by column, by time period (detect spikes vs 30-day baseline)
3. UNIQUENESS: Key integrity — are primary keys truly unique?
4. CONSISTENCY: Cross-field rules, cross-source reconciliation, sequential integrity
5. VALIDITY: Numeric bounds, date sequences, categorical values
6. ACCURACY: Reconcile totals vs system-of-record where available
7. TIMELINESS: Events timestamped far from when they occurred

FIX RULES:
- Never drop rows/columns silently
- All fixes require before/after sample + record count + % affected
- If > 2% of records affected → CHECKPOINT for human approval
- Log every transformation with: what, why, how many, approver

Return JSON with: quality_scorecard, issues, proposed_fixes, severity_summary
"""


class DataQualityAgent(BaseAgent):
    async def run(self, question: str) -> dict:
        # Get snapshot data from context (populated by connector agent)
        snapshot_data = self.context.get("connect", {}).get("sample_data", {})
        issues = []
        fixes = []
        scorecard = {}

        for table_name, records in snapshot_data.items():
            if not records:
                continue
            df = pd.DataFrame(records)
            table_issues, table_score = self._profile_table(df, table_name)
            issues.extend(table_issues)
            scorecard[table_name] = table_score

        # If no actual data in context, use LLM to describe quality checks
        if not issues:
            result = await self.llm.json_chat(
                messages=[{"role": "user", "content": f"Data quality analysis for: {question}. Context: {str(self.context.get('connect', {}))[:1000]}"}],
                system_prompt=SYSTEM_PROMPT,
                temperature=0.1,
            )
            issues = result.get("issues", [])
            scorecard = result.get("quality_scorecard", {"overall": "good"})

        critical = [i for i in issues if i.get("severity") == "CRITICAL"]
        return {
            "quality_scorecard": scorecard,
            "issues": issues,
            "proposed_fixes": fixes,
            "severity_summary": {
                "critical": len([i for i in issues if i.get("severity") == "CRITICAL"]),
                "high": len([i for i in issues if i.get("severity") == "HIGH"]),
                "medium": len([i for i in issues if i.get("severity") == "MEDIUM"]),
            },
            "checkpoint_required": len(critical) > 0,
            "clean_snapshot_id": f"clean_{self.session_id[:8]}",
        }

    def _profile_table(self, df: pd.DataFrame, table_name: str) -> tuple[list, dict]:
        issues = []
        total = len(df)
        if total == 0:
            return issues, {"rows": 0, "score": "N/A"}

        null_rates = (df.isnull().sum() / total * 100).round(2)
        high_null = null_rates[null_rates > 20]
        for col, rate in high_null.items():
            severity = "HIGH" if rate > 50 else "MEDIUM"
            issues.append({
                "table": table_name, "column": col, "issue": "high_null_rate",
                "severity": severity, "affected_pct": float(rate),
                "fix": f"Investigate null source for {col}; impute or flag"
            })

        # Duplicate check on likely ID columns
        id_cols = [c for c in df.columns if c.lower().endswith("_id") or c.lower() == "id"]
        for col in id_cols:
            dup_rate = (df[col].duplicated().sum() / total * 100)
            if dup_rate > 0.1:
                issues.append({
                    "table": table_name, "column": col, "issue": "duplicate_key",
                    "severity": "CRITICAL" if dup_rate > 1 else "HIGH",
                    "affected_pct": float(dup_rate),
                    "fix": "Deduplicate by keeping most recent record"
                })

        # Negative value check on amount/price columns
        num_cols = [c for c in df.select_dtypes(include=[np.number]).columns
                    if any(k in c.lower() for k in ["amount", "price", "revenue", "cost", "value"])]
        for col in num_cols:
            neg_count = (df[col] < 0).sum()
            if neg_count > 0:
                issues.append({
                    "table": table_name, "column": col, "issue": "negative_amount",
                    "severity": "MEDIUM", "affected_count": int(neg_count),
                    "fix": "Flag negatives as returns/credits or investigate data source"
                })

        score = "excellent" if len(issues) == 0 else "good" if len(issues) < 3 else "needs_attention"
        return issues, {"rows": total, "score": score, "null_rates": null_rates.to_dict()}
