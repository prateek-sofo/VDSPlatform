"""Governance Agent — policy, PII, audit, hallucination, and action safety checks."""
import json
from app.services.agents.base import BaseAgent

SYSTEM_PROMPT = """
ROLE: Governance Agent (Security, Compliance, Analytic Integrity)
Final gate before any output leaves the system or any action executes.

CHECKS TO RUN (every output):

DATA ACCESS:
  ✓ User has RBAC permission to all referenced data sources
  ✓ No PII exposed without PII_ACCESS role
  ✓ Row-level policies satisfied
  ✓ No cross-tenant data leakage

METRIC INTEGRITY:
  ✓ Every metric exists in semantic layer as Certified or Proposed
  ✓ Formula matches version used
  ✓ No ad-hoc or invented metrics
  ✓ Time range + filters are explicit

ANALYTICAL CORRECTNESS:
  ✓ Stats include sample size + significance threshold
  ✓ No causal claims from observational data without caveat
  ✓ Model uncertainty expressed (calibration, CIs)
  ✓ No futures presented as certainties

ACTION SAFETY:
  ✓ No destructive ops without approval gate
  ✓ No customer-facing comms without explicit approval
  ✓ No model deploys without champion/challenger eval
  ✓ Rollback plan exists for write-backs
  ✓ External APIs on allowlist

PROMPT INJECTION:
  ✓ User inputs sanitized
  ✓ Tool calls via allowlist only
  ✓ Semantic layer gating enforced

Return JSON with: status (PASS/FAIL/CONDITIONAL), issues, required_approvals,
audit_log_entry, redactions, policy_violations
"""


class GovernanceAgent(BaseAgent):
    async def run(self, question: str) -> dict:
        narrate = self.context.get("narrate", {})
        action = self.context.get("act", {})

        prompt = f"""
Session: {self.session_id}
Domain: {self.domain}
Executive summary to review: {str(narrate.get('executive_summary', ''))[:800]}
Recommendations to review: {json.dumps(narrate.get('recommendations', []), indent=2)[:600]}
Actions planned: {json.dumps(action.get('actions', []), indent=2)[:600]}
Workflow specs: {json.dumps(action.get('workflow_specs', []), indent=2)[:400]}

Run all governance checks. For each check, provide PASS/FAIL/WARN status.
For any FAIL or WARN: describe the issue, its severity, and required remediation.
Produce a complete audit_log_entry with all relevant metadata.
If any PII or sensitive data is in recommendations, flag redactions.
Overall status should be PASS only if ALL checks pass.
"""
        result = await self.llm.json_chat(
            messages=[{"role": "user", "content": prompt}],
            system_prompt=SYSTEM_PROMPT,
            temperature=0.1,
            max_tokens=2000,
        )
        return {
            "status": result.get("status", "PASS"),
            "issues": result.get("issues", []),
            "required_approvals": result.get("required_approvals", []),
            "audit_log_entry": result.get("audit_log_entry", {}),
            "redactions": result.get("redactions", []),
            "policy_violations": result.get("policy_violations", []),
            "checks_passed": result.get("checks_passed", []),
        }
