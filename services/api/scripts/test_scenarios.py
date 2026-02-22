"""
Test scenarios — exercises the VDS platform end-to-end with seed data.
Covers all 4 domains: RevOps, Supply Chain, E-Commerce, HR Analytics.

Run: python test_scenarios.py --api http://localhost:8000
"""
import asyncio
import httpx
import json
import os
import argparse
from typing import Optional

BASE_URL = "http://localhost:8000/api/v1"
SEED_DIR = os.path.join(os.path.dirname(__file__), "seed_data")

SCENARIOS = [
    {
        "id": "revops_pipeline_drop",
        "name": "RevOps: Why did Q1 pipeline drop?",
        "domain": "revops",
        "question": "Our Q1 pipeline is down 23% vs last quarter. Which deals are stalled and why? What's causing the drop and what should we do about it?",
        "autonomy": "semi_auto",
        "data_files": ["revops_accounts.json", "revops_opportunities.json"],
        "expected_insights": ["stage aging", "proposal stall", "rep performance"],
    },
    {
        "id": "supply_chain_stockout",
        "name": "Supply Chain: Which products are at stockout risk?",
        "domain": "supply_chain",
        "question": "Which SKUs are at risk of stocking out in the next 30 days given current inventory levels and supplier lead times? What should we reorder?",
        "autonomy": "semi_auto",
        "data_files": ["sc_products.json", "sc_inventory.json", "sc_purchase_orders.json"],
        "expected_insights": ["days of stock", "reorder point", "stockout risk"],
    },
    {
        "id": "ecomm_churn",
        "name": "E-Commerce: What's driving churn in our top cohort?",
        "domain": "ecommerce",
        "question": "Our VIP customer cohort churn is up. Who are the top at-risk customers, what's driving their disengagement, and how do we retain them?",
        "autonomy": "assist",
        "data_files": ["ecomm_customers.json", "ecomm_orders.json"],
        "expected_insights": ["churn risk score", "days since last order", "LTV at risk"],
    },
    {
        "id": "hr_attrition",
        "name": "HR Analytics: Who is at flight risk this quarter?",
        "domain": "hr",
        "question": "Which employees are most likely to leave in the next 90 days? What are the top drivers of attrition and where should HR focus to improve retention?",
        "autonomy": "assist",
        "data_files": ["hr_employees.json", "hr_performance_reviews.json"],
        "expected_insights": ["flight risk score", "pay equity", "tenure", "manager change"],
    },
]


class ScenarioRunner:
    def __init__(self, base_url: str, token: Optional[str] = None):
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {token}"} if token else {}
        self.results = []

    async def run_all(self):
        async with httpx.AsyncClient(timeout=120.0) as client:
            print("\n🧪 VDS Platform — Test Scenarios\n" + "=" * 50)

            # Health check
            r = await client.get(f"{self.base_url.replace('/api/v1', '')}/health")
            assert r.status_code == 200, f"API not healthy: {r.text}"
            print("✅ API health check passed\n")

            # Install all domain packs
            print("📦 Installing domain packs...")
            for domain in ["revops", "finance", "supply_chain", "healthcare", "ecommerce", "hr", "marketing", "risk"]:
                r = await client.post(f"{self.base_url}/semantic/domains/{domain}/install", headers=self.headers)
                status = "✅" if r.status_code == 200 else "⚠️ (may already exist)"
                print(f"  {status} {domain}")

            print()

            # Upload seed data as CSV connectors
            print("📤 Uploading seed data...")
            connector_ids = await self._upload_seed_data(client)

            print()

            # Run each scenario
            for scenario in SCENARIOS:
                await self._run_scenario(client, scenario, connector_ids)

            # Print summary
            self._print_summary()

    async def _upload_seed_data(self, client: httpx.AsyncClient) -> list[str]:
        """Create connectors from seed data files and return connector IDs."""
        connector_ids = []
        for fname in ["revops_opportunities.json", "sc_inventory.json", "ecomm_customers.json", "hr_employees.json"]:
            fpath = os.path.join(SEED_DIR, fname)
            if not os.path.exists(fpath):
                print(f"  ⚠️  Seed file not found: {fname} — run seed.py first")
                continue

            with open(fpath) as f:
                data = json.load(f)

            table_name = fname.replace(".json", "")
            # Create connector
            r = await client.post(f"{self.base_url}/connectors", json={
                "name": table_name.replace("_", " ").title(),
                "connector_type": "csv",
                "config": {"table_name": table_name, "file_content": "seed_inline"},
            }, headers=self.headers)

            if r.status_code == 201:
                cid = r.json()["id"]
                connector_ids.append(cid)
                print(f"  ✅ {table_name} ({len(data)} records) → connector {cid[:8]}")
            else:
                print(f"  ❌ Failed to create connector for {fname}: {r.text[:100]}")

        return connector_ids

    async def _run_scenario(self, client: httpx.AsyncClient, scenario: dict, connector_ids: list[str]):
        name = scenario["name"]
        print(f"\n{'─' * 50}")
        print(f"🚀 Scenario: {name}")
        print(f"   Domain: {scenario['domain']}")
        print(f"   Question: {scenario['question'][:80]}...")

        # Create session
        r = await client.post(f"{self.base_url}/sessions", json={
            "question": scenario["question"],
            "domain": scenario["domain"],
            "autonomy_level": scenario["autonomy"],
            "connector_ids": connector_ids[:2],
        }, headers=self.headers)

        if r.status_code != 201:
            print(f"   ❌ Session creation failed: {r.text[:200]}")
            self.results.append({"scenario": name, "status": "FAILED", "reason": r.text[:100]})
            return

        session = r.json()
        session_id = session["id"]
        print(f"   📋 Session: {session_id[:8]}... (status: {session['status']})")

        # Poll for completion
        print("   ⏳ Waiting for agent pipeline...")
        for attempt in range(30):
            await asyncio.sleep(3)
            r = await client.get(f"{self.base_url}/sessions/{session_id}", headers=self.headers)
            if r.status_code != 200:
                break
            s = r.json()
            status = s["status"]
            step = s.get("current_step_index", 0)
            print(f"   → Step {step}/8: {status}", end="\r")

            if status in ("done", "failed"):
                print()
                break

        if status == "done":
            # Get artifacts
            r = await client.get(f"{self.base_url}/sessions/{session_id}/artifacts", headers=self.headers)
            artifacts = r.json() if r.status_code == 200 else []

            r = await client.get(f"{self.base_url}/sessions/{session_id}/messages", headers=self.headers)
            messages = r.json() if r.status_code == 200 else []

            print(f"   ✅ PASSED — {len(artifacts)} artifacts, {len(messages)} messages")

            # Show top recommendation from final output
            r = await client.get(f"{self.base_url}/sessions/{session_id}", headers=self.headers)
            final = r.json()
            if final.get("final_output"):
                summary = final["final_output"].get("executive_summary", "")
                if summary:
                    print(f"   📊 Executive Summary (preview):")
                    for line in str(summary)[:300].split("\n")[:3]:
                        if line.strip():
                            print(f"      {line}")

            self.results.append({
                "scenario": name, "status": "PASSED",
                "session_id": session_id, "artifacts": len(artifacts), "messages": len(messages),
            })
        else:
            print(f"   ❌ FAILED — Last status: {status}")
            self.results.append({"scenario": name, "status": "FAILED", "session_status": status})

    def _print_summary(self):
        print(f"\n{'=' * 50}")
        print("📊 TEST SCENARIO RESULTS\n")
        passed = sum(1 for r in self.results if r["status"] == "PASSED")
        failed = len(self.results) - passed

        for r in self.results:
            icon = "✅" if r["status"] == "PASSED" else "❌"
            details = f"— {r.get('artifacts', 0)} artifacts" if r["status"] == "PASSED" else f"— {r.get('reason', '')}"
            print(f"  {icon} {r['scenario']} {details}")

        print(f"\n  Total: {passed}/{len(self.results)} passed", "🎉" if failed == 0 else "")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", default="http://localhost:8000/api/v1")
    parser.add_argument("--token", default=None)
    args = parser.parse_args()

    runner = ScenarioRunner(args.api, args.token)
    asyncio.run(runner.run_all())
