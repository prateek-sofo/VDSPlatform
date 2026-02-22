"""Base class for all specialist agents."""
from abc import ABC, abstractmethod
from typing import Optional
from app.services.llm.client import LLMClient


class BaseAgent(ABC):
    def __init__(
        self,
        session_id: str,
        domain: str,
        context: dict,
        connector_ids: list[str],
        llm: Optional[LLMClient] = None,
    ):
        self.session_id = session_id
        self.domain = domain
        self.context = context
        self.connector_ids = connector_ids
        self.llm = llm or LLMClient()

    @abstractmethod
    async def run(self, question: str) -> dict:
        """Execute the agent and return a result dict."""
        ...

    def _domain_context(self) -> str:
        """Return domain-specific instructions for the LLM."""
        domain_hints = {
            "revops": "Focus on sales pipeline, opportunities, revenue metrics (ARR/MRR/NRR), forecast accuracy, and customer lifecycle.",
            "finance": "Focus on P&L, budget vs actuals, cash flow, cost centers, EBITDA, and variance decomposition.",
            "supply_chain": "Focus on inventory, demand forecasting, supplier lead times, OTIF, stockouts, and logistics costs.",
            "healthcare": "Focus on patient outcomes, readmission rates, length of stay, claims, and care quality metrics. Apply HIPAA-safe analysis.",
            "ecommerce": "Focus on conversion rates, LTV, CAC, cart abandonment, promotion efficiency, and product affinity.",
            "hr": "Focus on attrition risk, flight risk prediction, headcount, time-to-fill, engagement scores, and pay equity.",
            "marketing": "Focus on campaign ROI, ROAS, multi-touch attribution, CAC, and channel efficiency.",
            "risk": "Focus on fraud detection, risk scoring, exposure simulation, and anomaly detection.",
            "generic": "Adapt your analysis to whatever domain emerges from the data and user question.",
        }
        return domain_hints.get(self.domain, domain_hints["generic"])
