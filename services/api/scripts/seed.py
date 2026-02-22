"""
Seed data generator — creates realistic test data for all 4 test scenarios:
  1. RevOps: Why did Q1 pipeline drop? (Salesforce-style data)
  2. Supply Chain: Which products are at stockout risk? (inventory data)
  3. E-Commerce: What's driving churn in our top cohort? (order/customer data)
  4. HR Analytics: Who is at flight risk this quarter? (employee data)

Run: python seed.py
"""
import asyncio
import uuid
import random
from datetime import datetime, timedelta, timezone
from typing import List
import structlog

log = structlog.get_logger()

NOW = datetime.now(timezone.utc)
TENANT_ID = "default"


def random_date(days_back: int = 365, days_forward: int = 0) -> datetime:
    delta = random.randint(-days_back, days_forward)
    return NOW + timedelta(days=delta)


def uid() -> str:
    return str(uuid.uuid4())


# ──────────────────────────────────────────────────────────────────────────────
# Scenario 1: RevOps — Sales Pipeline (Salesforce-style)
# ──────────────────────────────────────────────────────────────────────────────

STAGES = ["Prospecting", "Qualification", "Demo", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]
STAGE_PROB = [0.15, 0.20, 0.25, 0.30, 0.35, 0.70, 0.0]
INDUSTRIES = ["Software", "Financial Services", "Healthcare", "Manufacturing", "Retail", "Telecom", "Media"]
REGIONS = ["Northeast", "Southeast", "Midwest", "West", "Southwest"]
REPS = ["Alice Nguyen", "Bob Patel", "Carmen Ruiz", "David Kim", "Eve Chen", "Frank Torres"]
LOSS_REASONS = ["No budget", "Went with competitor", "Timeline shifted", "No decision", "Feature gap"]


def generate_revops_data(n_accounts=80, n_opps=200) -> dict:
    accounts = []
    for _ in range(n_accounts):
        a_id = uid()
        accounts.append({
            "id": a_id,
            "name": f"{random.choice(['Acme', 'Globex', 'Initech', 'Umbrella', 'Stark', 'Wayne', 'LexCorp', 'Oscorp', 'Cyberdyne', 'Weyland'])} {random.choice(['Corp', 'Inc', 'LLC', 'Group', 'Tech', 'Solutions', 'Systems'])}",
            "industry": random.choice(INDUSTRIES),
            "region": random.choice(REGIONS),
            "annual_revenue": random.randint(1_000_000, 500_000_000),
            "employees": random.randint(50, 10000),
            "tier": random.choice(["Enterprise", "Mid-Market", "SMB"]),
            "arr": random.randint(10_000, 500_000),
        })

    opportunities = []
    for _ in range(n_opps):
        account = random.choice(accounts)
        stage = random.choice(STAGES)
        created = random_date(180)
        close_days = random.randint(14, 180)
        close_date = created + timedelta(days=close_days)
        is_won = stage == "Closed Won"
        is_lost = stage == "Closed Lost"
        amount = random.randint(5_000, 300_000)

        # Inject some realistic anomalies: Q1 pipeline drop by making deals stall in Proposal
        if random.random() < 0.3 and stage == "Proposal":
            created = NOW - timedelta(days=random.randint(60, 120))  # stale proposals

        opportunities.append({
            "id": uid(),
            "account_id": account["id"],
            "account_name": account["name"],
            "name": f"{account['name']} — {random.choice(['Platform License', 'Enterprise Expansion', 'New Logo', 'Renewal', 'Upsell'])}",
            "amount": amount,
            "stage": stage,
            "created_date": created.isoformat(),
            "close_date": close_date.isoformat(),
            "is_won": is_won,
            "is_closed": is_won or is_lost,
            "owner": random.choice(REPS),
            "region": account["region"],
            "industry": account["industry"],
            "probability": round(random.uniform(0.1, 0.9), 2) if not is_won and not is_lost else (1.0 if is_won else 0.0),
            "loss_reason": random.choice(LOSS_REASONS) if is_lost else None,
            "days_in_stage": random.randint(1, 90),
            "activity_count": random.randint(0, 20),
            "last_activity_date": random_date(60).isoformat(),
        })

    return {"accounts": accounts, "opportunities": opportunities}


# ──────────────────────────────────────────────────────────────────────────────
# Scenario 2: Supply Chain — Inventory & Demand
# ──────────────────────────────────────────────────────────────────────────────

CATEGORIES = ["Electronics", "Apparel", "Home & Garden", "Sports", "Food & Beverage", "Health & Beauty"]
WAREHOUSES = ["West Coast DC", "East Coast DC", "Midwest Hub", "Southeast Fulfillment"]
SUPPLIERS = [
    {"id": uid(), "name": "Taiwan Precision Parts", "country": "Taiwan", "lead_time_days": 21, "reliability_score": 0.92},
    {"id": uid(), "name": "Guangzhou Manufacturing", "country": "China", "lead_time_days": 35, "reliability_score": 0.78},
    {"id": uid(), "name": "Mexico Nearshore Co", "country": "Mexico", "lead_time_days": 10, "reliability_score": 0.95},
    {"id": uid(), "name": "Vietnamese Textiles Ltd", "country": "Vietnam", "lead_time_days": 28, "reliability_score": 0.85},
    {"id": uid(), "name": "US Domestic Supplier", "country": "USA", "lead_time_days": 5, "reliability_score": 0.98},
]


def generate_supply_chain_data(n_products=60) -> dict:
    products = []
    inventory = []
    purchase_orders = []

    for i in range(n_products):
        cat = random.choice(CATEGORIES)
        supplier = random.choice(SUPPLIERS)
        p_id = uid()
        avg_daily_demand = random.randint(5, 200)
        reorder_point = avg_daily_demand * supplier["lead_time_days"] * 1.2

        products.append({
            "id": p_id,
            "sku": f"SKU-{1000 + i}",
            "name": f"{cat} Product {i+1}",
            "category": cat,
            "supplier_id": supplier["id"],
            "unit_cost": round(random.uniform(2.50, 250.0), 2),
            "unit_price": round(random.uniform(5.0, 500.0), 2),
            "avg_daily_demand": avg_daily_demand,
            "lead_time_days": supplier["lead_time_days"],
        })

        for wh in random.sample(WAREHOUSES, random.randint(1, 3)):
            current_stock = random.randint(0, int(reorder_point * 2.5))
            days_of_stock = current_stock / max(avg_daily_demand, 1)
            stockout_risk = days_of_stock < supplier["lead_time_days"]

            inventory.append({
                "id": uid(),
                "product_id": p_id,
                "sku": f"SKU-{1000 + i}",
                "warehouse": wh,
                "quantity_on_hand": current_stock,
                "reorder_point": round(reorder_point),
                "days_of_stock": round(days_of_stock, 1),
                "stockout_risk": stockout_risk,
                "last_updated": NOW.isoformat(),
            })

        # Some open POs
        if random.random() < 0.4:
            order_date = NOW - timedelta(days=random.randint(1, supplier["lead_time_days"]))
            purchase_orders.append({
                "id": uid(),
                "product_id": p_id,
                "supplier_id": supplier["id"],
                "quantity": random.randint(100, 5000),
                "unit_cost": products[-1]["unit_cost"],
                "order_date": order_date.isoformat(),
                "expected_arrival": (order_date + timedelta(days=supplier["lead_time_days"])).isoformat(),
                "status": random.choice(["pending", "shipped", "in_transit"]),
            })

    return {"suppliers": SUPPLIERS, "products": products, "inventory": inventory, "purchase_orders": purchase_orders}


# ──────────────────────────────────────────────────────────────────────────────
# Scenario 3: E-Commerce — Customers & Orders
# ──────────────────────────────────────────────────────────────────────────────

CHANNELS = ["Organic Search", "Paid Search", "Social", "Email", "Direct", "Referral", "Influencer"]
PRODUCT_CATS = ["Clothing", "Electronics", "HomeGoods", "Fitness", "Beauty", "Books", "Toys"]


def generate_ecommerce_data(n_customers=300, n_products=50) -> dict:
    products = []
    for i in range(n_products):
        cat = random.choice(PRODUCT_CATS)
        products.append({
            "id": uid(), "sku": f"P{i:04d}", "name": f"{cat} Item {i+1}",
            "category": cat, "price": round(random.uniform(9.99, 299.99), 2),
            "margin_pct": round(random.uniform(0.15, 0.65), 2),
        })

    customers = []
    orders = []
    order_lines = []

    for _ in range(n_customers):
        c_id = uid()
        acq_date = random_date(730)
        channel = random.choice(CHANNELS)
        tier = random.choices(["VIP", "Regular", "At-Risk", "New"], weights=[0.1, 0.5, 0.25, 0.15])[0]
        n_orders = random.choices([0, 1, 2, 3, 5, 8, 12], weights=[0.1, 0.2, 0.25, 0.2, 0.1, 0.1, 0.05])[0]

        # Churn signal: at-risk customers have no orders in last 90 days
        is_churned = tier == "At-Risk" and random.random() < 0.6
        ltv = 0

        customer_orders = []
        for o in range(n_orders):
            if is_churned:
                o_date = random_date(365, -90)  # older orders only
            else:
                o_date = random_date(365, 30)

            n_lines = random.randint(1, 5)
            order_total = 0
            o_id = uid()

            for _ in range(n_lines):
                prod = random.choice(products)
                qty = random.randint(1, 4)
                line_total = round(prod["price"] * qty * (1 - random.uniform(0, 0.15)), 2)
                order_total += line_total
                order_lines.append({
                    "id": uid(), "order_id": o_id, "product_id": prod["id"],
                    "sku": prod["sku"], "quantity": qty, "unit_price": prod["price"],
                    "line_total": line_total,
                })

            customer_orders.append({
                "id": o_id, "customer_id": c_id,
                "order_date": o_date.isoformat(),
                "total_amount": round(order_total, 2),
                "status": random.choices(["completed", "refunded", "partial_refund"], weights=[0.85, 0.10, 0.05])[0],
                "channel": channel,
            })
            ltv += order_total

        orders.extend(customer_orders)
        last_order = max((datetime.fromisoformat(o["order_date"]) for o in customer_orders), default=None) if customer_orders else None
        days_since_last = (NOW - last_order).days if last_order else 999

        customers.append({
            "id": c_id, "email": f"user_{c_id[:6]}@example.com",
            "acquisition_channel": channel, "acquisition_date": acq_date.isoformat(),
            "tier": tier, "ltv": round(ltv, 2),
            "order_count": n_orders, "is_churned": is_churned,
            "days_since_last_order": days_since_last,
            "churn_risk_score": round(min(days_since_last / 180, 1.0), 2),
        })

    return {"customers": customers, "orders": orders, "order_lines": order_lines, "products": products}


# ──────────────────────────────────────────────────────────────────────────────
# Scenario 4: HR Analytics — Employees & Attrition
# ──────────────────────────────────────────────────────────────────────────────

DEPARTMENTS = ["Engineering", "Sales", "Marketing", "Finance", "Operations", "Customer Success", "HR", "Product"]
ROLES = ["IC1", "IC2", "IC3", "Senior", "Staff", "Principal", "Manager", "Director", "VP"]
LOCATIONS = ["New York", "San Francisco", "Austin", "Chicago", "Remote"]


def generate_hr_data(n_employees=200) -> dict:
    employees = []
    reviews = []
    current_managers = [uid() for _ in range(20)]

    for i in range(n_employees):
        e_id = uid()
        dept = random.choice(DEPARTMENTS)
        role = random.choice(ROLES)
        hire_date = random_date(2190)  # up to 6 years back
        tenure_months = (NOW - hire_date).days / 30

        # Flight risk factors
        low_perf = random.random() < 0.2
        long_tenure_no_promo = tenure_months > 18 and random.random() < 0.3
        mgr_change = random.random() < 0.25
        pay_below_market = random.random() < 0.3

        flight_risk_score = (
            (0.3 if low_perf else 0) +
            (0.25 if long_tenure_no_promo else 0) +
            (0.2 if mgr_change else 0) +
            (0.25 if pay_below_market else 0)
        )
        is_attrition = flight_risk_score > 0.5 and random.random() < 0.4

        salary = random.randint(60_000, 320_000)
        salary_band_midpoint = random.randint(70_000, 300_000)

        employees.append({
            "id": e_id,
            "name": f"Employee {i+1}",
            "department": dept,
            "role_level": role,
            "location": random.choice(LOCATIONS),
            "hire_date": hire_date.isoformat(),
            "termination_date": random_date(90).isoformat() if is_attrition else None,
            "is_active": not is_attrition,
            "manager_id": random.choice(current_managers),
            "salary": salary,
            "salary_band_midpoint": salary_band_midpoint,
            "compa_ratio": round(salary / salary_band_midpoint, 2),
            "tenure_months": round(tenure_months, 1),
            "flight_risk_score": round(flight_risk_score, 2),
            "is_high_flight_risk": flight_risk_score >= 0.45,
            "last_promotion_months_ago": random.randint(3, 48),
            "manager_change_last_year": mgr_change,
            "gender": random.choice(["M", "F", "N"]),
            "ethnicity": random.choice(["White", "Asian", "Hispanic", "Black", "Other"]),
        })

        # Performance review
        if tenure_months > 6:
            reviews.append({
                "id": uid(), "employee_id": e_id,
                "period": "2025-Annual",
                "rating": random.choices([1, 2, 3, 4, 5], weights=[0.05, 0.15, 0.45, 0.25, 0.10])[0],
                "reviewer_id": random.choice(current_managers),
                "engagement_score": round(random.uniform(1.0, 5.0), 1),
            })

    return {"employees": employees, "performance_reviews": reviews}


# ──────────────────────────────────────────────────────────────────────────────
# Seed runner
# ──────────────────────────────────────────────────────────────────────────────

async def seed_all():
    import json, os
    output_dir = os.path.join(os.path.dirname(__file__), "seed_data")
    os.makedirs(output_dir, exist_ok=True)

    print("🌱 Generating seed data for all 4 test scenarios...")

    # Generate
    revops = generate_revops_data(n_accounts=80, n_opps=200)
    sc = generate_supply_chain_data(n_products=60)
    ecomm = generate_ecommerce_data(n_customers=300, n_products=50)
    hr = generate_hr_data(n_employees=200)

    datasets = {
        "revops_accounts.json": revops["accounts"],
        "revops_opportunities.json": revops["opportunities"],
        "sc_suppliers.json": sc["suppliers"],
        "sc_products.json": sc["products"],
        "sc_inventory.json": sc["inventory"],
        "sc_purchase_orders.json": sc["purchase_orders"],
        "ecomm_customers.json": ecomm["customers"],
        "ecomm_orders.json": ecomm["orders"],
        "ecomm_order_lines.json": ecomm["order_lines"],
        "ecomm_products.json": ecomm["products"],
        "hr_employees.json": hr["employees"],
        "hr_performance_reviews.json": hr["performance_reviews"],
    }

    for filename, data in datasets.items():
        path = os.path.join(output_dir, filename)
        with open(path, "w") as f:
            json.dump(data, f, indent=2, default=str)
        print(f"  ✅ {filename} ({len(data)} records)")

    # Summary
    print("\n📊 Seed Data Summary:")
    print(f"  RevOps:       {len(revops['accounts'])} accounts, {len(revops['opportunities'])} opportunities")
    print(f"  Supply Chain: {len(sc['products'])} products, {len(sc['inventory'])} inventory records")
    print(f"  E-Commerce:   {len(ecomm['customers'])} customers, {len(ecomm['orders'])} orders")
    print(f"  HR Analytics: {len(hr['employees'])} employees, {len(hr['performance_reviews'])} reviews")
    print(f"\n✅ All seed data written to: {output_dir}")


if __name__ == "__main__":
    asyncio.run(seed_all())
