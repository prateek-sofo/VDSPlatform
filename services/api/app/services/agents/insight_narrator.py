"""Insight Narrator Agent — transforms analysis into executive-ready narratives with evidence."""
import json
from app.services.agents.base import BaseAgent

SYSTEM_PROMPT = """
ROLE: Insight Narrator (Executive Communications + Data Storyteller)
Transform analytical outputs into clear, decision-ready business narratives with full evidence trails.

QUALITY STANDARDS:
- Lead with the DECISION and the ANSWER
- Quantify: what changed, by how much, why, so what, now what
- Every numeric claim cites: metric ID + time range + scope
- Express uncertainty honestly: CIs, data gaps, model limitations
- Three tiers of output (audience-adaptive):

TIER 1 — EXECUTIVE SUMMARY (5 bullets, CXO-ready):
  Each bullet: [Observation] → [Driver] → [Implication / Action needed]
  One top recommendation with expected $ / % impact.

TIER 2 — DEEP DIVE (analytical audience):
  Key findings with specific numbers, segment breakdown, period comparison

TIER 3 — APPENDIX (data team):
  All metric definitions, model versions, data quality notes, assumptions

Return JSON with: executive_summary, findings, root_cause_analysis,
segment_analysis, recommendations, risks_caveats, appendix, next_steps
"""


class InsightNarratorAgent(BaseAgent):
    async def run(self, question: str) -> dict:
        frame = self.context.get("frame", {})
        eda = self.context.get("eda", {})
        model = self.context.get("model", {})
        domain_ctx = self._domain_context()

        prompt = f"""
Original question: {question}
Domain: {self.domain} — {domain_ctx}
Problem statement: {frame.get('problem_statement', '')}
KPIs: {json.dumps(frame.get('kpis', {}), indent=2)[:400]}
EDA summary: {eda.get('eda_summary', '')[:1000]}
Hypothesis results: {json.dumps(eda.get('hypothesis_register', []), indent=2)[:800]}
Top model predictions: {json.dumps(model.get('top_predictions', []), indent=2)[:600]}
Business impact sim: {json.dumps(model.get('business_impact_sim', {}), indent=2)[:400]}
NL explanation: {model.get('nl_explanation', '')[:400]}

Write a comprehensive, executive-quality narrative. The executive_summary should be 5 bullet points each
with [Observation] → [Driver] → [Implication]. Include specific numbers and percentages.
Recommendations should be ranked by (impact × confidence) and include expected $ or % outcome, time-to-value,
and implementation effort. The appendix should list all data sources, metric definitions, and model versions used.
"""
        result = await self.llm.json_chat(
            messages=[{"role": "user", "content": prompt}],
            system_prompt=SYSTEM_PROMPT,
            temperature=0.4,
            max_tokens=4096,
        )
        return {
            "executive_summary": result.get("executive_summary", ""),
            "findings": result.get("findings", []),
            "root_cause_analysis": result.get("root_cause_analysis", ""),
            "segment_analysis": result.get("segment_analysis", {}),
            "recommendations": result.get("recommendations", []),
            "risks_caveats": result.get("risks_caveats", []),
            "appendix": result.get("appendix", {}),
            "next_steps": result.get("next_steps", []),
        }
