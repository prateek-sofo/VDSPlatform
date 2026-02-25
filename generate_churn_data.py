import pandas as pd
import numpy as np

np.random.seed(42)
n = 200

data = {
    "customer_id": [f"CUST-{i:04d}" for i in range(1, n+1)],
    "tenure_months": np.random.randint(1, 72, n),
    "monthly_charges": np.round(np.random.uniform(20.0, 120.0, n), 2),
    "contract_type": np.random.choice(["Month-to-month", "One year", "Two year"], n, p=[0.5, 0.3, 0.2]),
    "support_tickets": np.random.randint(0, 10, n),
    "is_churned": np.random.choice([0, 1], n, p=[0.7, 0.3])
}

# Add some correlation
df = pd.DataFrame(data)
df.loc[(df["contract_type"] == "Month-to-month") & (df["support_tickets"] > 5), "is_churned"] = 1
df.loc[(df["tenure_months"] > 60), "is_churned"] = 0

df.to_csv("/Users/kaizen/.gemini/antigravity/scratch/vds-platform/churn_data.csv", index=False)
print("Created churn_data.csv")
