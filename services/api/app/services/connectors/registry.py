"""
Connector Registry — maps ConnectorType to implementation class.
"""
from app.db.models import ConnectorType


class ConnectorRegistry:
    _implementations = {}

    @classmethod
    def register(cls, connector_type: ConnectorType):
        def decorator(klass):
            cls._implementations[connector_type] = klass
            return klass
        return decorator

    @classmethod
    def get(cls, connector_type: ConnectorType):
        impl = cls._implementations.get(connector_type)
        if not impl:
            raise ValueError(f"No connector implementation for: {connector_type}")
        return impl()

    @classmethod
    def catalog(cls) -> list[dict]:
        from app.services.connectors import (
            csv_connector, postgres_connector, mongo_connector,
            unstructured_connector, snowflake_connector,
            salesforce_connector, stripe_connector, hubspot_connector,
            bigquery_connector, segment_connector, zendesk_connector
        )
        return [
            {"type": "csv", "name": "CSV / Excel", "category": "file", "tier": 0, "auth": "none"},
            {"type": "postgres", "name": "PostgreSQL", "category": "database", "tier": 0, "auth": "connection_string"},
            {"type": "mongo", "name": "MongoDB", "category": "database", "tier": 0, "auth": "connection_string"},
            {"type": "unstructured", "name": "Unstructured (PDF, Mix)", "category": "unstructured", "tier": 0, "auth": "none"},
            {"type": "mysql", "name": "MySQL", "category": "database", "tier": 0, "auth": "connection_string"},
            {"type": "snowflake", "name": "Snowflake", "category": "warehouse", "tier": 0, "auth": "oauth"},
            {"type": "bigquery", "name": "Google BigQuery", "category": "warehouse", "tier": 0, "auth": "service_account"},
            {"type": "redshift", "name": "Amazon Redshift", "category": "warehouse", "tier": 1, "auth": "connection_string"},
            {"type": "salesforce", "name": "Salesforce CRM", "category": "crm", "tier": 0, "auth": "oauth"},
            {"type": "hubspot", "name": "HubSpot", "category": "crm", "tier": 1, "auth": "oauth"},
            {"type": "stripe", "name": "Stripe Billing", "category": "billing", "tier": 0, "auth": "api_key"},
            {"type": "google_ads", "name": "Google Ads", "category": "marketing", "tier": 1, "auth": "oauth"},
            {"type": "segment", "name": "Segment", "category": "product_analytics", "tier": 1, "auth": "api_key"},
            {"type": "amplitude", "name": "Amplitude", "category": "product_analytics", "tier": 1, "auth": "api_key"},
            {"type": "zendesk", "name": "Zendesk", "category": "support", "tier": 1, "auth": "api_key"},
            {"type": "s3", "name": "Amazon S3", "category": "data_lake", "tier": 1, "auth": "iam"},
            {"type": "google_sheets", "name": "Google Sheets", "category": "file", "tier": 0, "auth": "oauth"},
            {"type": "excel", "name": "Excel Upload", "category": "file", "tier": 0, "auth": "none"},
        ]
