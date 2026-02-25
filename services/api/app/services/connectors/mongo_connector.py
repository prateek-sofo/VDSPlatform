"""MongoDB connector — handles connection testing and data syncing."""
import pandas as pd
import structlog
from typing import Optional
from app.services.connectors.registry import ConnectorRegistry
from app.db.models import ConnectorType

log = structlog.get_logger()

@ConnectorRegistry.register(ConnectorType.mongo)
class MongoConnector:
    async def test_connection(self, config: dict, secret_ref: Optional[str] = None) -> dict:
        """Test connection to a MongoDB database."""
        conn_str = config.get("connection_string")
        if not conn_str:
            return {"success": False, "message": "Missing connection_string"}
        
        if not conn_str.startswith("mongodb"):
            return {"success": False, "message": "Invalid MongoDB connection string (must start with mongodb:// or mongodb+srv://)"}
            
        return {"success": True, "message": "MongoDB connection string format is valid."}

    async def sync(self, config: dict, secret_ref: Optional[str], incremental: bool, run_id: str) -> dict:
        """Sync data from MongoDB (Mocked for now)."""
        collection = config.get("collection", "data_collection")
        
        log.info("mongo.sync.start", collection=collection)
        
        # Mocking 250 documents
        df = pd.DataFrame([{ "_id": f"obj_{i}", "payload": {"val": i}, "meta": {"type": "json"} } for i in range(250)])
        
        return {
            "rows_read": 250,
            "rows_written": 250,
            "sample_data": df.head(100).to_dict(orient="records"),
            "profile_report": {
                "row_count": 250,
                "column_count": 3,
                "columns": {
                    "_id": {"dtype": "object", "null_pct": 0, "unique_count": 250},
                    "payload": {"dtype": "object", "null_pct": 0, "unique_count": 250},
                    "meta": {"dtype": "object", "null_pct": 0, "unique_count": 1}
                }
            },
            "semantic_pack": {
                "entity_candidates": [{"entity": "Document", "table": collection, "confidence": 0.4}],
                "metric_candidates": [],
                "synonyms": []
            }
        }
