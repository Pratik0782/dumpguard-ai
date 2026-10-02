import pandas as pd, joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

BASE = Path(__file__).resolve().parent
df = pd.read_csv(BASE / "Maharashtra_Illegal_Dumping_Hotspot_6000_Kolhapur_Sangli_Satara.csv")
features = [
    "district", "taluka", "village_name", "waste_type", "land_type", "weather",
    "hour", "day_of_week", "is_weekend", "previous_incidents_30d", "complaints_30d",
    "distance_to_main_road_km", "nearby_road_density_km", "night_indicator"
]
X = df[features].copy()
y = df["hotspot_risk"]

for col in features:
    if not pd.api.types.is_numeric_dtype(X[col]):
        X[col] = X[col].astype(str)

cat = [c for c in features if not pd.api.types.is_numeric_dtype(X[c])]
num = [c for c in features if c not in cat]
pre = ColumnTransformer([
    ("categorical", OneHotEncoder(handle_unknown="ignore"), cat),
    ("numeric", "passthrough", num)
])
model = Pipeline([
    ("preprocessor", pre),
    ("classifier", DecisionTreeClassifier(max_depth=10, min_samples_leaf=3, random_state=42, class_weight="balanced"))
])
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
model.fit(Xtr, ytr)
print("Test accuracy:", accuracy_score(yte, model.predict(Xte)))
joblib.dump(model, BASE / "model" / "hotspot_model.joblib")
