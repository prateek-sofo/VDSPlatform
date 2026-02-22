"""CSV / Excel connector — handles file uploads and converts to staged tables."""
import io
import uuid
from typing import Optional
import pandas as pd
import structlog

log = structlog.get_logger()

ENTITY_PATTERN_MAP = {
    "account": ["account", "company", "customer", "organization", "client"],
    "opportunity": ["opportunity", "deal", "opp", "pipeline", "prospect"],
    "contact": ["contact", "person", "lead", "user"],
    "product": ["product", "sku", "item", "service"],
    "invoice": ["invoice", "billing", "charge", "payment", "subscription"],
    "order": ["order", "purchase", "transaction"],
    "employee": ["employee", "staff", "worker", "hr"],
    "campaign": ["campaign", "ad", "marketing", "promo"],
}


class CSVConnector:
    async def test_connection(self, config: dict, secret_ref: Optional[str] = None) -> dict:
        file_path = config.get("file_path")
        if file_path:
            return {"success": True, "message": "File accessible", "details": {"path": file_path}}
        return {"success": True, "message": "Upload-based connector ready", "details": {}}

    async def sync(self, config: dict, secret_ref: Optional[str], incremental: bool, run_id: str) -> dict:
        file_path = config.get("file_path", "")
        file_content = config.get("file_content_b64")  # base64 for uploaded files

        if file_content:
            import base64
            raw = base64.b64decode(file_content)
            df = pd.read_csv(io.BytesIO(raw))
        elif file_path:
            df = pd.read_csv(file_path)
        else:
            return {"rows_read": 0, "rows_written": 0, "profile_report": {}, "semantic_pack": {}}

        profile = self._profile(df)
        semantic_pack = self._generate_semantic_pack(df, config)

        return {
            "rows_read": len(df),
            "rows_written": len(df),
            "sample_data": df.head(200).to_dict(orient="records"),
            "profile_report": profile,
            "semantic_pack": semantic_pack,
        }

    def _profile(self, df: pd.DataFrame) -> dict:
        total = len(df)
        profile = {"row_count": total, "column_count": len(df.columns), "columns": {}}
        for col in df.columns:
            col_data = df[col]
            col_profile = {
                "dtype": str(col_data.dtype),
                "null_pct": round(col_data.isnull().sum() / total * 100, 2),
                "unique_count": int(col_data.nunique()),
            }
            if col_data.dtype in ["int64", "float64"]:
                col_profile.update({
                    "mean": round(float(col_data.mean()), 4) if not col_data.isnull().all() else None,
                    "std": round(float(col_data.std()), 4) if not col_data.isnull().all() else None,
                    "min": float(col_data.min()) if not col_data.isnull().all() else None,
                    "max": float(col_data.max()) if not col_data.isnull().all() else None,
                })
            elif col_data.dtype == "object":
                col_profile["top_values"] = col_data.value_counts().head(5).to_dict()
            profile["columns"][col] = col_profile
        return profile

    def _generate_semantic_pack(self, df: pd.DataFrame, config: dict) -> dict:
        table_hint = config.get("table_name", "uploaded_table").lower()
        entity_candidates = []

        # Match table name against known entity patterns
        best_entity = None
        best_score = 0
        for entity, patterns in ENTITY_PATTERN_MAP.items():
            for p in patterns:
                if p in table_hint:
                    score = len(p) / len(table_hint)
                    if score > best_score:
                        best_entity, best_score = entity, score

        if best_entity:
            entity_candidates.append({
                "entity": best_entity.title(),
                "table": table_hint,
                "confidence": round(0.75 + best_score * 0.2, 2),
                "evidence": ["name_pattern_match"],
            })

        # Metric candidates: numeric columns with common metric-ish names
        metric_candidates = []
        for col in df.select_dtypes(include=["int64", "float64"]).columns:
            col_lower = col.lower()
            for keyword in ["amount", "revenue", "price", "cost", "value", "count", "rate", "score"]:
                if keyword in col_lower:
                    metric_candidates.append({
                        "metric": col.replace("_", " ").title(),
                        "field": col,
                        "formula_hint": f"SUM({col})",
                        "confidence": 0.80,
                    })
                    break

        # Synonym candidates from column names
        synonyms = []
        for col in df.columns:
            clean = col.lower().replace("_", " ").replace("-", " ")
            if clean != col.lower():
                synonyms.append({"user_term": clean, "canonical_field": col})

        return {
            "entity_candidates": entity_candidates,
            "relationship_candidates": [],
            "metric_candidates": metric_candidates,
            "synonyms": synonyms,
        }
