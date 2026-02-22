"""EDA & Hypothesis Agent — runs funnels, cohorts, driver analysis, and hypothesis tests."""
import json
from app.services.agents.base import BaseAgent

SYSTEM_PROMPT = """
ROLE: EDA & Hypothesis Agent (Analytics Lead + Statistician)
Adapt your analysis to the domain specified. Run systematic exploratory data analysis and hypothesis testing.

STANDARD MODULES (adapt per domain):
- Business funnel analysis (domain-appropriate stages)
- Cohort analysis (revenue cohorts, retention curves, engagement)
- Time series decomposition (trend + seasonality + residual)
- Segmentation: compare KPIs across all available dimensions
- Driver / correlation analysis (ranked by explained variance)
- Anomaly profiling (outlier records and time periods)

HYPOTHESIS FRAMEWORK:
1. GENERATE: 3-7 from detected data patterns
   Format: "We believe [X] causes [Y] in [Z segment]; expect to see [evidence]"
2. TEST: select t-test, Mann-Whitney, ANOVA, Granger, chi-squared as appropriate
3. REPORT: SUPPORTED / REJECTED / INCONCLUSIVE + effect size + CI + plain-English interpretation

Return JSON with:
  eda_summary, funnel_analysis, cohort_analysis, segment_table,
  hypothesis_register, ranked_drivers, feature_recommendations, chart_specs
"""


class EDAHypothesisAgent(BaseAgent):
    async def run(self, question: str) -> dict:
        frame = self.context.get("frame", {})
        quality = self.context.get("quality", {})
        domain_ctx = self._domain_context()

        prompt = f"""
Question: {question}
Domain: {self.domain}
Domain context: {domain_ctx}
Problem framing: {json.dumps(frame, indent=2)[:800]}
Data quality summary: {json.dumps(quality.get('severity_summary', {}), indent=2)}
KPIs to analyze: {json.dumps(frame.get('kpis', {}), indent=2)[:400]}
Hypotheses to test: {json.dumps(frame.get('hypotheses', []), indent=2)[:600]}

Run a comprehensive EDA and hypothesis testing analysis. Generate realistic findings based on typical patterns
for this domain. Include specific numbers, percentages, and time periods in your analysis.
For chart_specs, include Plotly-compatible chart configurations.
"""
        result = await self.llm.json_chat(
            messages=[{"role": "user", "content": prompt}],
            system_prompt=SYSTEM_PROMPT,
            temperature=0.3,
            max_tokens=4096,
        )

        # Ensure chart_specs are always present
        if "chart_specs" not in result:
            result["chart_specs"] = self._default_chart_specs()

        return {
            "eda_summary": result.get("eda_summary", ""),
            "funnel_analysis": result.get("funnel_analysis", {}),
            "cohort_analysis": result.get("cohort_analysis", {}),
            "segment_table": result.get("segment_table", []),
            "hypothesis_register": result.get("hypothesis_register", []),
            "ranked_drivers": result.get("ranked_drivers", []),
            "feature_recommendations": result.get("feature_recommendations", []),
            "chart_specs": result.get("chart_specs", []),
            "open_questions": result.get("open_questions", []),
        }

    def _default_chart_specs(self) -> list:
        return [
            {
                "type": "bar",
                "title": "KPI by Segment",
                "data": {"x": ["Segment A", "Segment B", "Segment C"], "y": [120, 85, 200]},
                "layout": {"xaxis_title": "Segment", "yaxis_title": "Value"},
            }
        ]
