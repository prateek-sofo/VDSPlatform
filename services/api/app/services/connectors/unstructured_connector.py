"""Unstructured data connector — handles PDFs, Markdown, and raw text."""
import pandas as pd
import structlog
from typing import Optional
from app.services.connectors.registry import ConnectorRegistry
from app.db.models import ConnectorType

log = structlog.get_logger()

@ConnectorRegistry.register(ConnectorType.unstructured)
class UnstructuredConnector:
    async def test_connection(self, config: dict, secret_ref: Optional[str] = None) -> dict:
        """Test if the unstructured source path is specified."""
        path = config.get("source_path")
        if not path:
            return {"success": False, "message": "Missing source_path (URL or directory)"}
        return {"success": True, "message": f"Unstructured source '{path}' is ready for processing."}

    async def sync(self, config: dict, secret_ref: Optional[str], incremental: bool, run_id: str) -> dict:
        """Sync/Parse unstructured data (Mocked logic)."""
        source = config.get("source_path", "blob_storage")
        
        log.info("unstructured.sync.start", source=source)
        
        # Mocking extraction of text into structured chunks
        df = pd.DataFrame([
            { "doc_id": "doc_1", "text": "The quarterly revenue increased by 15%...", "source_file": "report_q1.pdf" },
            { "doc_id": "doc_2", "text": "Supply chain disruptions are expected in region X...", "source_file": "memo_logistics.txt" }
        ])
        
        return {
            "rows_read": 2,
            "rows_written": 2,
            "sample_data": df.head(10).to_dict(orient="records"),
            "profile_report": {
                "row_count": 2,
                "column_count": 3,
                "columns": {
                    "doc_id": {"dtype": "object", "null_pct": 0, "unique_count": 2},
                    "text": {"dtype": "object", "null_pct": 0, "unique_count": 2},
                    "source_file": {"dtype": "object", "null_pct": 0, "unique_count": 2}
                }
            },
            "semantic_pack": {
                "entity_candidates": [{"entity": "DocumentChunk", "table": "knowledge_base", "confidence": 0.9}],
                "metric_candidates": [],
                "synonyms": []
            }
        }
