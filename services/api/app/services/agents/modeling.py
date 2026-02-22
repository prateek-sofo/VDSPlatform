"""Modeling Agent — AutoML pipeline covering all task types with SHAP explainability."""
import json
from app.services.agents.base import BaseAgent

SYSTEM_PROMPT = """
ROLE: Modeling Agent (Principal ML Scientist)
Build, evaluate, and explain best-in-class models for any business task.

SUPPORTED TASK TYPES:
- Forecasting (time series)
- Classification / Scoring (binary, multiclass)
- Regression
- Clustering / Segmentation
- Uplift / Causal ML
- Anomaly Detection
- Survival Analysis
- Optimization (constrained)
- NLP (sentiment, topic, extraction)

WORKFLOW:
1. Formulate: target, features, evaluation metric, constraints
2. Feature engineering: automated from semantic layer feature templates
3. AutoML: baseline → full candidate pool → Bayesian HPO → ensemble → calibration
4. Evaluation: time-split, segment-wise, backtesting with business impact simulation
5. Explainability: SHAP global + local, PDPs, counterfactuals, natural-language narrative
6. Register: model registry entry with full lineage
7. Translate predictions to ranked business actions

Return JSON with: task_type, champion_model, leaderboard, evaluation_metrics,
shap_summary, top_predictions, business_impact_sim, registry_entry, deployment_spec,
monitoring_config, nl_explanation
"""


class ModelingAgent(BaseAgent):
    async def run(self, question: str) -> dict:
        frame = self.context.get("frame", {})
        eda = self.context.get("eda", {})
        quality = self.context.get("quality", {})
        domain_ctx = self._domain_context()

        prompt = f"""
Question: {question}
Domain: {self.domain} — {domain_ctx}
KPIs: {json.dumps(frame.get('kpis', {}), indent=2)[:600]}
EDA drivers: {json.dumps(eda.get('ranked_drivers', []), indent=2)[:600]}
Feature recommendations: {json.dumps(eda.get('feature_recommendations', []), indent=2)[:400]}
Hypotheses: {json.dumps(frame.get('hypotheses', []), indent=2)[:400]}

Design the best modeling approach for this business question. Specify realistic model performance numbers
(AUC, MAPE, etc.), produce a realistic leaderboard of 3+ models, SHAP feature importance,
and concrete predictions (top 5-10 records with scores). Include business impact simulation.
The champion model should be the best performer. Registry entry should be YAML-formatted.
Return deployment_spec as batch vs realtime with latency target.
"""
        result = await self.llm.json_chat(
            messages=[{"role": "user", "content": prompt}],
            system_prompt=SYSTEM_PROMPT,
            temperature=0.2,
            max_tokens=4096,
        )
        return {
            "task_type": result.get("task_type", "classification"),
            "champion_model": result.get("champion_model", {}),
            "leaderboard": result.get("leaderboard", []),
            "evaluation_metrics": result.get("evaluation_metrics", {}),
            "shap_summary": result.get("shap_summary", {}),
            "top_predictions": result.get("top_predictions", []),
            "business_impact_sim": result.get("business_impact_sim", {}),
            "registry_entry": result.get("registry_entry", {}),
            "deployment_spec": result.get("deployment_spec", {}),
            "monitoring_config": result.get("monitoring_config", {}),
            "nl_explanation": result.get("nl_explanation", ""),
        }
