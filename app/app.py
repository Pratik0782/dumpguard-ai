from flask import Flask, render_template, jsonify, request
from pathlib import Path
import pandas as pd
import joblib
import json
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent
with open(BASE_DIR / "data" / "dumping_data.json", encoding="utf-8") as f:
    DATA = json.load(f)
MODEL = joblib.load(BASE_DIR / "model" / "hotspot_model.joblib")
with open(BASE_DIR / "model" / "metadata.json", encoding="utf-8") as f:
    META = json.load(f)

app = Flask(__name__)
DF = pd.DataFrame(DATA)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/data")
def data():
    return jsonify({"records": DATA, "total": len(DATA), "model_accuracy": META["accuracy"]})

@app.route("/api/stats")
def stats():
    risk = DF["hotspot_risk"].astype(str).str.lower()
    return jsonify({
        "total": len(DF),
        "high": int((risk=="high").sum()),
        "medium": int((risk=="medium").sum()),
        "low": int((risk=="low").sum()),
        "districts": sorted(DF["district"].dropna().astype(str).unique().tolist()),
        "model_accuracy": META["accuracy"]
    })

@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}
    numeric = {
        "hour": int(float(data.get("hour", 0))),
        "is_weekend": int(float(data.get("is_weekend", 0))),
        "previous_incidents_30d": float(data.get("previous_incidents_30d", 0)),
        "complaints_30d": float(data.get("complaints_30d", 0)),
        "distance_to_main_road_km": float(data.get("distance_to_main_road_km", 0)),
        "nearby_road_density_km": float(data.get("nearby_road_density_km", 0)),
        "night_indicator": int(float(data.get("night_indicator", 0)))
    }
    row = {
        "district": str(data.get("district", "")),
        "taluka": str(data.get("taluka", "")),
        "village_name": str(data.get("village_name", "")),
        "waste_type": str(data.get("waste_type", "")),
        "land_type": str(data.get("land_type", "")),
        "weather": str(data.get("weather", "")),
        "day_of_week": str(data.get("day_of_week", "")),
        **numeric
    }
    X = pd.DataFrame([row], columns=META["features"])
    for col in [c for c in META["features"] if c not in {"hour", "is_weekend", "previous_incidents_30d", "complaints_30d", "distance_to_main_road_km", "nearby_road_density_km", "night_indicator"}]:
        X[col] = X[col].astype(str)
    prediction = str(MODEL.predict(X)[0])
    probs = {}
    if hasattr(MODEL, "predict_proba"):
        p = MODEL.predict_proba(X)[0]
        classes = MODEL.named_steps["classifier"].classes_
        probs = {str(c): round(float(v)*100,2) for c,v in zip(classes,p)}
    return jsonify({"prediction":prediction,"probabilities":probs})

@app.route("/api/locations")
def locations():
    cols=["latitude","longitude","district","taluka","village_name","waste_type","hotspot_risk","risk_score"]
    cols=[c for c in cols if c in DF.columns]
    return jsonify(DF[cols].replace({np.nan:None}).to_dict(orient="records"))

if __name__ == "__main__":
    app.run(debug=True)
