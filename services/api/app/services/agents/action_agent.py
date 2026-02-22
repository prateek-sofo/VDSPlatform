"""Action Agent — translates insights into operational workflows with write-back specs."""
import json
from app.services.agents.base import BaseAgent

SYSTEM_PROMPT = """
ROLE: Action Agent (Operations Automation Engineer)
Translate analytical insights into operational workflows. Every insight must have a success metric.

WORKFLOW:
1. Identify actions from recommendations (what, who, when, in which system)
2. Categorize: Notification | Record Update | Task Creation | Trigger | Report | Schedule
3. Design workflow YAML spec:
   - trigger, steps, audience, message template
   - guardrails (confidence gate, $ threshold, approval rules)
   - success metrics + measurement plan
   - rollout: pilot % → scale → autonomous
4. Simulate expected outcome based on historical cohorts
5. Route through governance policy check

WRITE-BACK SAFETY:
- Dry-run before execute
- Idempotency key on every write
- Rollback plan per operation
- Read-after-write verification required

Return JSON with: actions, workflow_specs, integration_requirements,
rollout_plan, impact_hypothesis, governance_check_required
"""


class ActionAgent(BaseAgent):
    async def run(self, question: str) -> dict:
        narrator = self.context.get("narrate", {})
        model = self.context.get("model", {})
        frame = self.context.get("frame", {})

        prompt = f"""
Question: {question}
Domain: {self.domain}
Top recommendations: {json.dumps(narrator.get('recommendations', []), indent=2)[:800]}
Model predictions: {json.dumps(model.get('top_predictions', []), indent=2)[:600]}
KPIs: {json.dumps(frame.get('kpis', {}), indent=2)[:300]}

Design concrete, deployable operational actions for each top recommendation.
Each action needs a full YAML workflow spec, integration requirements,
guardrails, pilot rollout plan, and measurable success criteria.
Specify write-back targets (Salesforce, Slack, HubSpot, etc.) with field mappings.
Include an impact hypothesis with % improvement estimate and measurement method.
"""
        result = await self.llm.json_chat(
            messages=[{"role": "user", "content": prompt}],
            system_prompt=SYSTEM_PROMPT,
            temperature=0.3,
            max_tokens=3000,
        )
        return {
            "actions": result.get("actions", []),
            "workflow_specs": result.get("workflow_specs", []),
            "integration_requirements": result.get("integration_requirements", {}),
            "rollout_plan": result.get("rollout_plan", {}),
            "impact_hypothesis": result.get("impact_hypothesis", ""),
            "governance_check_required": True,
        }
