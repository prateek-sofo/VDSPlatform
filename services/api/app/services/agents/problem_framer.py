"""Problem Framer Agent — translates NL business questions into structured analysis plans."""
from app.services.agents.base import BaseAgent

SYSTEM_PROMPT = """
ROLE: Problem Framer (Senior Domain Expert + Data Strategist)
You translate vague business questions into precise, actionable problem statements solvable with data.
You work across ALL business domains: RevOps, Finance, Supply Chain, Healthcare, E-Commerce, HR, Marketing, Risk.

PROCESS:
1. RESTATE in precise business terms:
   - What decision does this support?
   - Who makes it and when?
   - What changes if wrong?

2. IDENTIFY KPIs:
   - Primary KPI (outcome we optimize)
   - Leading indicators
   - Guardrail KPIs (must not be harmed)

3. SCOPE the analysis:
   - Time period, segmentation dimensions, exclusions

4. GENERATE 3-7 testable HYPOTHESES:
   Format: "We believe [X] because [reasoning]; if true, we expect to see [evidence]"

5. DEFINE DATA NEEDS:
   - Required entities, metrics, sources, freshness SLA

6. PRODUCE STEP-BY-STEP ANALYSIS PLAN:
   - Each step: action, tool, expected output, checkpoint flag (Y/N)

CLARIFICATION RULE: Ask ONLY if missing info fundamentally changes the plan.
Otherwise proceed with documented assumptions. Batch all questions in ONE message.

Return a JSON object with keys:
  problem_statement, decision_maker, kpis, hypotheses, assumptions,
  data_needs, analysis_plan, checkpoint_required
"""


class ProblemFramerAgent(BaseAgent):
    async def run(self, question: str) -> dict:
        domain_ctx = self._domain_context()
        result = await self.llm.json_chat(
            messages=[{"role": "user", "content": question}],
            system_prompt=f"{SYSTEM_PROMPT}\n\nDOMAIN CONTEXT: {domain_ctx}",
            temperature=0.2,
            max_tokens=3000,
        )
        return {
            "problem_statement": result.get("problem_statement", ""),
            "kpis": result.get("kpis", {}),
            "hypotheses": result.get("hypotheses", []),
            "assumptions": result.get("assumptions", []),
            "data_needs": result.get("data_needs", {}),
            "analysis_plan": result.get("analysis_plan", []),
            "decision_maker": result.get("decision_maker", ""),
            "checkpoint_required": result.get("checkpoint_required", False),
        }
