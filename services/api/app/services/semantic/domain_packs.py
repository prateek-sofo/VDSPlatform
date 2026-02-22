"""
Domain Packs — Pre-built ontology templates for all 8 supported verticals.
Each pack defines: entities, metrics, feature templates, and agent workflow templates.
"""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import EntityType, MetricDefinition

DOMAIN_PACKS = {
    "revops": {
        "meta": {"name": "Revenue Operations", "description": "Sales pipeline, forecasting, renewals, and revenue analytics", "icon": "💰"},
        "entities": [
            {"name": "Account", "description": "B2B company/customer record", "properties": {"id": {"type": "string", "role": "pk"}, "name": {"type": "string"}, "industry": {"type": "string"}, "annual_revenue": {"type": "number"}, "arr": {"type": "number"}, "tier": {"type": "string"}}},
            {"name": "Opportunity", "description": "Sales deal in progress", "properties": {"id": {"type": "string", "role": "pk"}, "account_id": {"type": "string", "role": "fk"}, "name": {"type": "string"}, "amount": {"type": "number"}, "stage": {"type": "string"}, "close_date": {"type": "date"}, "owner": {"type": "string"}, "probability": {"type": "number"}, "is_won": {"type": "boolean"}}},
            {"name": "Contact", "description": "Individual person at an Account", "properties": {"id": {"type": "string", "role": "pk"}, "account_id": {"type": "string", "role": "fk"}, "name": {"type": "string"}, "email": {"type": "string"}, "title": {"type": "string"}}},
            {"name": "Lead", "description": "Unqualified prospect", "properties": {"id": {"type": "string", "role": "pk"}, "name": {"type": "string"}, "email": {"type": "string"}, "source": {"type": "string"}, "status": {"type": "string"}, "created_date": {"type": "date"}}},
            {"name": "Activity", "description": "Sales activity (call, email, meeting)", "properties": {"id": {"type": "string", "role": "pk"}, "related_to_id": {"type": "string", "role": "fk"}, "type": {"type": "string"}, "subject": {"type": "string"}, "date": {"type": "date"}, "owner": {"type": "string"}}},
            {"name": "Campaign", "description": "Marketing campaign", "properties": {"id": {"type": "string", "role": "pk"}, "name": {"type": "string"}, "channel": {"type": "string"}, "status": {"type": "string"}, "budget": {"type": "number"}, "start_date": {"type": "date"}}},
            {"name": "Rep", "description": "Sales representative", "properties": {"id": {"type": "string", "role": "pk"}, "name": {"type": "string"}, "team": {"type": "string"}, "region": {"type": "string"}, "quota": {"type": "number"}}},
        ],
        "metrics": [
            {"name": "ARR", "formula": "SUM(opportunity.amount) WHERE opportunity.is_won = true AND recurring = true", "grain": ["quarter", "segment", "rep"], "synonyms": ["annual recurring revenue", "recurring revenue"]},
            {"name": "MRR", "formula": "ARR / 12", "grain": ["month", "segment"], "synonyms": ["monthly recurring revenue"]},
            {"name": "Pipeline Coverage", "formula": "SUM(opportunity.amount WHERE stage NOT IN ('Closed Won','Closed Lost')) / quota", "grain": ["quarter", "rep", "region"], "synonyms": ["pipe coverage", "pipeline ratio"]},
            {"name": "Win Rate", "formula": "COUNT(opportunity WHERE is_won=true) / COUNT(opportunity WHERE stage IN ('Closed Won','Closed Lost'))", "grain": ["quarter", "rep", "segment"], "synonyms": ["close rate", "conversion rate"]},
            {"name": "Average Deal Size", "formula": "AVG(opportunity.amount WHERE is_won=true)", "grain": ["quarter", "segment"], "synonyms": ["ADS", "average contract value", "ACV"]},
            {"name": "Time To Close", "formula": "AVG(opportunity.close_date - opportunity.created_date WHERE is_won=true)", "grain": ["quarter", "segment", "rep"], "synonyms": ["sales cycle length", "days to close"]},
            {"name": "NRR", "formula": "(ARR_start + expansion - churn - contraction) / ARR_start", "grain": ["quarter", "cohort"], "synonyms": ["net revenue retention", "net dollar retention", "NDR"]},
            {"name": "Churn Rate", "formula": "ARR_churned / ARR_start", "grain": ["quarter", "segment"], "synonyms": ["churn", "logo churn", "revenue churn"]},
        ],
        "agent_templates": ["pipeline_monitor", "forecast_tracker", "renewal_watchdog", "comp_auditor"],
    },

    "finance": {
        "meta": {"name": "Finance / FP&A", "description": "Budget vs actuals, cash flow, P&L, and scenario planning", "icon": "📊"},
        "entities": [
            {"name": "GLAccount", "description": "General ledger account", "properties": {"id": {"type": "string", "role": "pk"}, "code": {"type": "string"}, "name": {"type": "string"}, "category": {"type": "string"}, "type": {"type": "string"}}},
            {"name": "CostCenter", "description": "Organizational budget unit", "properties": {"id": {"type": "string", "role": "pk"}, "name": {"type": "string"}, "owner": {"type": "string"}, "department": {"type": "string"}}},
            {"name": "BudgetLine", "description": "Budgeted amount per account and period", "properties": {"id": {"type": "string", "role": "pk"}, "account_id": {"type": "string", "role": "fk"}, "period": {"type": "date"}, "amount": {"type": "number"}, "version": {"type": "string"}}},
            {"name": "Invoice", "description": "Customer invoice or vendor bill", "properties": {"id": {"type": "string", "role": "pk"}, "amount": {"type": "number"}, "date": {"type": "date"}, "status": {"type": "string"}, "entity_id": {"type": "string", "role": "fk"}}},
        ],
        "metrics": [
            {"name": "Budget Variance", "formula": "SUM(actuals) - SUM(budget)", "grain": ["month", "cost_center", "gl_account"], "synonyms": ["variance", "budget vs actual", "BvA"]},
            {"name": "EBITDA", "formula": "Revenue - COGS - Operating_Expenses + Depreciation + Amortization", "grain": ["quarter", "segment"], "synonyms": ["earnings before interest taxes depreciation amortization"]},
            {"name": "Gross Margin", "formula": "(Revenue - COGS) / Revenue", "grain": ["month", "product", "segment"], "synonyms": ["GM%", "gross profit margin"]},
            {"name": "Burn Rate", "formula": "SUM(operating_expenses) / months", "grain": ["month"], "synonyms": ["monthly burn", "cash burn"]},
            {"name": "Cash Runway", "formula": "cash_balance / burn_rate", "grain": ["month"], "synonyms": ["runway", "months of runway"]},
        ],
        "agent_templates": ["budget_actuals_monitor", "cash_flow_forecaster", "reforecast_agent"],
    },

    "supply_chain": {
        "meta": {"name": "Supply Chain", "description": "Demand forecasting, inventory optimization, supplier risk", "icon": "🚚"},
        "entities": [
            {"name": "Product", "description": "Physical product or SKU", "properties": {"id": {"type": "string", "role": "pk"}, "sku": {"type": "string"}, "name": {"type": "string"}, "category": {"type": "string"}, "unit_cost": {"type": "number"}, "lead_time_days": {"type": "number"}}},
            {"name": "Supplier", "description": "Vendor or manufacturer", "properties": {"id": {"type": "string", "role": "pk"}, "name": {"type": "string"}, "country": {"type": "string"}, "lead_time_days": {"type": "number"}, "reliability_score": {"type": "number"}}},
            {"name": "Inventory", "description": "Stock on hand by location", "properties": {"id": {"type": "string", "role": "pk"}, "product_id": {"type": "string", "role": "fk"}, "warehouse": {"type": "string"}, "quantity": {"type": "number"}, "reorder_point": {"type": "number"}}},
            {"name": "PurchaseOrder", "description": "Order placed with a supplier", "properties": {"id": {"type": "string", "role": "pk"}, "supplier_id": {"type": "string", "role": "fk"}, "product_id": {"type": "string", "role": "fk"}, "quantity": {"type": "number"}, "order_date": {"type": "date"}, "expected_date": {"type": "date"}}},
            {"name": "Shipment", "description": "Outbound delivery to customer", "properties": {"id": {"type": "string", "role": "pk"}, "order_id": {"type": "string", "role": "fk"}, "shipped_date": {"type": "date"}, "delivered_date": {"type": "date"}, "status": {"type": "string"}}},
        ],
        "metrics": [
            {"name": "OTIF Rate", "formula": "COUNT(shipment WHERE on_time=true AND in_full=true) / COUNT(shipment)", "grain": ["week", "supplier", "product"], "synonyms": ["on time in full", "OTIF"]},
            {"name": "Inventory Turns", "formula": "COGS / AVG(inventory_value)", "grain": ["month", "category", "warehouse"], "synonyms": ["inventory turnover", "stock turns"]},
            {"name": "Stockout Rate", "formula": "COUNT(days WHERE inventory.quantity = 0) / COUNT(days)", "grain": ["week", "product", "warehouse"], "synonyms": ["out of stock rate", "OOS rate"]},
            {"name": "Demand Forecast MAPE", "formula": "AVG(ABS(forecast - actual) / actual)", "grain": ["month", "product", "region"], "synonyms": ["forecast accuracy", "MAPE"]},
            {"name": "Supplier Lead Time", "formula": "AVG(purchase_order.received_date - purchase_order.order_date)", "grain": ["month", "supplier", "product"], "synonyms": ["lead time", "vendor lead time"]},
        ],
        "agent_templates": ["demand_forecast_agent", "stockout_scout", "supplier_risk_monitor"],
    },

    "healthcare": {
        "meta": {"name": "Healthcare", "description": "Patient outcomes, clinical quality, claims optimization (HIPAA mode)", "icon": "🏥"},
        "entities": [
            {"name": "Patient", "description": "De-identified patient (HIPAA safe)", "properties": {"id": {"type": "string", "role": "pk"}, "age_group": {"type": "string"}, "gender": {"type": "string"}, "payer": {"type": "string"}, "risk_score": {"type": "number"}}},
            {"name": "Encounter", "description": "Clinical visit or admission", "properties": {"id": {"type": "string", "role": "pk"}, "patient_id": {"type": "string", "role": "fk"}, "type": {"type": "string"}, "admit_date": {"type": "date"}, "discharge_date": {"type": "date"}, "drg": {"type": "string"}, "los_days": {"type": "number"}}},
            {"name": "Diagnosis", "description": "ICD-10 diagnosis code on encounter", "properties": {"id": {"type": "string", "role": "pk"}, "encounter_id": {"type": "string", "role": "fk"}, "icd10_code": {"type": "string"}, "description": {"type": "string"}, "primary": {"type": "boolean"}}},
            {"name": "Claim", "description": "Insurance claim submission", "properties": {"id": {"type": "string", "role": "pk"}, "encounter_id": {"type": "string", "role": "fk"}, "amount_billed": {"type": "number"}, "amount_paid": {"type": "number"}, "status": {"type": "string"}, "denial_reason": {"type": "string"}}},
        ],
        "metrics": [
            {"name": "30-Day Readmission Rate", "formula": "COUNT(encounter WHERE readmitted_within_30d=true) / COUNT(encounter WHERE type='inpatient')", "grain": ["month", "drg", "provider"], "synonyms": ["readmission rate", "30-day readmit"]},
            {"name": "Average Length of Stay", "formula": "AVG(encounter.los_days)", "grain": ["month", "drg", "service_line"], "synonyms": ["ALOS", "LOS", "average LOS"]},
            {"name": "Claim Denial Rate", "formula": "COUNT(claim WHERE status='denied') / COUNT(claim)", "grain": ["month", "payer", "drg"], "synonyms": ["denial rate", "claims denial"]},
            {"name": "Cost Per Case", "formula": "SUM(direct_cost) / COUNT(encounter WHERE type='inpatient')", "grain": ["quarter", "drg", "service_line"], "synonyms": ["cost per admission", "CPC"]},
        ],
        "agent_templates": ["readmission_risk_agent", "care_gap_agent", "claims_optimizer"],
    },

    "ecommerce": {
        "meta": {"name": "E-Commerce", "description": "Conversion, LTV, churn, promotions, and product analytics", "icon": "🛒"},
        "entities": [
            {"name": "Customer", "description": "Registered shopper", "properties": {"id": {"type": "string", "role": "pk"}, "email": {"type": "string"}, "acquisition_channel": {"type": "string"}, "acquisition_date": {"type": "date"}, "ltv": {"type": "number"}, "tier": {"type": "string"}}},
            {"name": "Order", "description": "Customer purchase", "properties": {"id": {"type": "string", "role": "pk"}, "customer_id": {"type": "string", "role": "fk"}, "order_date": {"type": "date"}, "total_amount": {"type": "number"}, "status": {"type": "string"}, "channel": {"type": "string"}}},
            {"name": "OrderLine", "description": "Line item within an order", "properties": {"id": {"type": "string", "role": "pk"}, "order_id": {"type": "string", "role": "fk"}, "product_id": {"type": "string", "role": "fk"}, "quantity": {"type": "number"}, "unit_price": {"type": "number"}}},
            {"name": "Product", "description": "Item for sale", "properties": {"id": {"type": "string", "role": "pk"}, "sku": {"type": "string"}, "name": {"type": "string"}, "category": {"type": "string"}, "price": {"type": "number"}, "margin_pct": {"type": "number"}}},
            {"name": "Promotion", "description": "Discount or coupon", "properties": {"id": {"type": "string", "role": "pk"}, "code": {"type": "string"}, "discount_pct": {"type": "number"}, "start_date": {"type": "date"}, "end_date": {"type": "date"}}},
        ],
        "metrics": [
            {"name": "Conversion Rate", "formula": "COUNT(session WHERE converted=true) / COUNT(session)", "grain": ["day", "channel", "device"], "synonyms": ["CVR", "checkout rate"]},
            {"name": "Average Order Value", "formula": "SUM(order.total_amount) / COUNT(order)", "grain": ["week", "channel", "customer_tier"], "synonyms": ["AOV", "basket size", "average basket"]},
            {"name": "Customer Lifetime Value", "formula": "SUM(order.total_amount) GROUP BY customer_id", "grain": ["cohort", "channel", "tier"], "synonyms": ["LTV", "CLV", "lifetime value"]},
            {"name": "Customer Acquisition Cost", "formula": "SUM(marketing_spend) / COUNT(new_customers)", "grain": ["month", "channel"], "synonyms": ["CAC", "cost per acquisition"]},
            {"name": "Repeat Purchase Rate", "formula": "COUNT(customer WHERE order_count > 1) / COUNT(customer)", "grain": ["cohort", "channel"], "synonyms": ["repurchase rate", "retention rate"]},
            {"name": "Return Rate", "formula": "COUNT(return) / COUNT(order_line)", "grain": ["week", "product", "category"], "synonyms": ["refund rate", "return %"]},
        ],
        "agent_templates": ["churn_scout", "ltv_ranker", "campaign_roi_tracker"],
    },

    "hr": {
        "meta": {"name": "HR Analytics", "description": "Attrition, recruitment, DEI, compensation, and workforce planning", "icon": "👥"},
        "entities": [
            {"name": "Employee", "description": "Current or former employee", "properties": {"id": {"type": "string", "role": "pk"}, "name": {"type": "string"}, "department": {"type": "string"}, "role": {"type": "string"}, "hire_date": {"type": "date"}, "termination_date": {"type": "date"}, "manager_id": {"type": "string", "role": "fk"}, "salary": {"type": "number"}, "location": {"type": "string"}}},
            {"name": "PerformanceReview", "description": "Annual or cycle performance rating", "properties": {"id": {"type": "string", "role": "pk"}, "employee_id": {"type": "string", "role": "fk"}, "period": {"type": "string"}, "rating": {"type": "number"}, "reviewer_id": {"type": "string"}}},
            {"name": "JobRequisition", "description": "Open headcount request", "properties": {"id": {"type": "string", "role": "pk"}, "department": {"type": "string"}, "role": {"type": "string"}, "open_date": {"type": "date"}, "hire_date": {"type": "date"}, "status": {"type": "string"}}},
        ],
        "metrics": [
            {"name": "Attrition Rate", "formula": "COUNT(employee WHERE termination_date IS NOT NULL) / AVG(headcount)", "grain": ["quarter", "department", "role"], "synonyms": ["turnover rate", "churn rate", "attrition"]},
            {"name": "Time to Fill", "formula": "AVG(requisition.hire_date - requisition.open_date)", "grain": ["quarter", "department", "role"], "synonyms": ["TTF", "days to hire", "hiring cycle time"]},
            {"name": "Engagement Score", "formula": "AVG(survey.engagement_score)", "grain": ["quarter", "department", "manager"], "synonyms": ["eNPS", "employee engagement"]},
            {"name": "Pay Equity Ratio", "formula": "AVG(salary WHERE gender='F') / AVG(salary WHERE gender='M')", "grain": ["role", "level", "department"], "synonyms": ["gender pay gap", "pay equity"]},
        ],
        "agent_templates": ["attrition_sentinel", "dei_dashboard_agent"],
    },

    "marketing": {
        "meta": {"name": "Marketing", "description": "Attribution, ROAS, CAC, funnel, and budget optimization", "icon": "📣"},
        "entities": [
            {"name": "Campaign", "description": "Paid or organic marketing campaign", "properties": {"id": {"type": "string", "role": "pk"}, "name": {"type": "string"}, "channel": {"type": "string"}, "type": {"type": "string"}, "budget": {"type": "number"}, "start_date": {"type": "date"}, "end_date": {"type": "date"}}},
            {"name": "Touchpoint", "description": "Marketing interaction on the path to conversion", "properties": {"id": {"type": "string", "role": "pk"}, "campaign_id": {"type": "string", "role": "fk"}, "lead_id": {"type": "string", "role": "fk"}, "type": {"type": "string"}, "date": {"type": "date"}, "channel": {"type": "string"}}},
            {"name": "Lead", "description": "Top-of-funnel prospect generated by marketing", "properties": {"id": {"type": "string", "role": "pk"}, "source_campaign_id": {"type": "string", "role": "fk"}, "created_date": {"type": "date"}, "status": {"type": "string"}, "converted_date": {"type": "date"}}},
        ],
        "metrics": [
            {"name": "ROAS", "formula": "SUM(attributed_revenue) / SUM(campaign.spend)", "grain": ["week", "channel", "campaign"], "synonyms": ["return on ad spend", "advertising ROI"]},
            {"name": "CAC", "formula": "SUM(marketing_spend + sales_cost) / COUNT(new_customers)", "grain": ["month", "channel", "segment"], "synonyms": ["cost per acquisition", "customer acquisition cost"]},
            {"name": "MQL to SQL Rate", "formula": "COUNT(lead WHERE status='SQL') / COUNT(lead WHERE status='MQL')", "grain": ["month", "channel", "campaign"], "synonyms": ["lead quality rate", "MQL conversion"]},
            {"name": "Marketing Influenced Pipeline", "formula": "SUM(opportunity.amount WHERE touchpoint_count > 0)", "grain": ["quarter", "channel"], "synonyms": ["MIP", "marketing attributed pipeline"]},
        ],
        "agent_templates": ["ad_spend_optimizer", "attribution_agent", "funnel_leakage_detector"],
    },

    "risk": {
        "meta": {"name": "Risk / Fraud", "description": "Fraud detection, credit risk, AML, and exposure simulation", "icon": "🛡️"},
        "entities": [
            {"name": "Transaction", "description": "Financial transaction record", "properties": {"id": {"type": "string", "role": "pk"}, "account_id": {"type": "string", "role": "fk"}, "amount": {"type": "number"}, "timestamp": {"type": "datetime"}, "type": {"type": "string"}, "merchant": {"type": "string"}, "country": {"type": "string"}, "is_fraud": {"type": "boolean"}}},
            {"name": "FraudAlert", "description": "Generated fraud or risk alert", "properties": {"id": {"type": "string", "role": "pk"}, "transaction_id": {"type": "string", "role": "fk"}, "score": {"type": "number"}, "rule_triggered": {"type": "string"}, "status": {"type": "string"}, "created_at": {"type": "datetime"}}},
            {"name": "CreditLine", "description": "Credit facility for an account", "properties": {"id": {"type": "string", "role": "pk"}, "account_id": {"type": "string", "role": "fk"}, "limit": {"type": "number"}, "balance": {"type": "number"}, "utilization_pct": {"type": "number"}, "risk_grade": {"type": "string"}}},
        ],
        "metrics": [
            {"name": "Fraud Rate", "formula": "COUNT(transaction WHERE is_fraud=true) / COUNT(transaction)", "grain": ["day", "channel", "country"], "synonyms": ["fraud %", "transaction fraud rate"]},
            {"name": "False Positive Rate", "formula": "COUNT(alert WHERE status='false_positive') / COUNT(alert)", "grain": ["week", "rule"], "synonyms": ["FPR", "false alarm rate"]},
            {"name": "Fraud Loss Amount", "formula": "SUM(transaction.amount WHERE is_fraud=true AND recovered=false)", "grain": ["month", "channel", "country"], "synonyms": ["fraud losses", "write-off amount"]},
            {"name": "Average Risk Score", "formula": "AVG(fraud_alert.score)", "grain": ["day", "segment"], "synonyms": ["risk score", "fraud score"]},
        ],
        "agent_templates": ["fraud_anomaly_detector", "credit_risk_monitor"],
    },
}


async def install_domain(domain_id: str, db: AsyncSession) -> dict:
    """Install all entities and metrics for a domain pack into the database."""
    pack = DOMAIN_PACKS[domain_id]
    entities_created = 0
    metrics_created = 0

    for entity_def in pack["entities"]:
        e = EntityType(
            id=str(uuid.uuid4()),
            tenant_id="default",
            name=entity_def["name"],
            description=entity_def.get("description"),
            domain=domain_id,
            status="certified",
            properties=entity_def.get("properties", {}),
            source_mappings={},
            version=1,
        )
        db.add(e)
        entities_created += 1

    for metric_def in pack["metrics"]:
        m = MetricDefinition(
            id=str(uuid.uuid4()),
            tenant_id="default",
            name=metric_def["name"],
            formula=metric_def["formula"],
            grain=metric_def.get("grain", []),
            synonyms=metric_def.get("synonyms", []),
            domain=domain_id,
            status="certified",
            version=1,
        )
        db.add(m)
        metrics_created += 1

    await db.commit()
    return {
        "domain": domain_id,
        "entities_created": entities_created,
        "metrics_created": metrics_created,
        "agent_templates": pack["agent_templates"],
    }
