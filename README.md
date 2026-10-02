# DumpGuard Maharashtra — Second-Year Python Project

## Languages
**Python + HTML + CSS + JavaScript**

## Frameworks / libraries
- Flask — Python web framework
- Pandas — dataset handling
- Scikit-learn — machine learning
- Joblib — model storage
- Leaflet + OpenStreetMap — interactive map

## Main features
- Responsive dashboard for desktop, tablet and mobile
- 6,000-record dataset explorer
- Kolhapur, Sangli and Satara filters
- High / Medium / Low risk statistics
- Interactive map with popup details
- Search by village, taluka and waste type
- AI hotspot-risk prediction form
- Prediction probabilities
- Simple Flask API

## Machine learning
The model is a **Decision Tree Classifier**, chosen because it is easier for second-year students to understand and explain.

Input features:
- district
- taluka
- village_name
- waste_type
- land_type
- weather
- hour
- day_of_week
- is_weekend
- previous_incidents_30d
- complaints_30d
- distance_to_main_road_km
- nearby_road_density_km
- night_indicator

The existing `risk_score` column is not used as an input because it can cause target leakage.

Test accuracy on the supplied dataset: **96.33%**.

The supplied dataset identifies itself as synthetic, so this project is an academic demonstration rather than a real-world incident verification system.

## Run in VS Code (Windows)

Open this folder in VS Code.

### 1. Create virtual environment
```powershell
python -m venv venv
```

### 2. Activate it
```powershell
venv\Scripts\activate
```

### 3. Install packages
```powershell
pip install -r requirements.txt
```

### 4. Run the project
```powershell
python -m app.app
```

Open:
http://127.0.0.1:5000

## Project structure

```text
DumpGuard-Maharashtra-Flask/
│
├── app/
│   ├── app.py
│   ├── templates/
│   │   └── index.html
│   └── static/
│       ├── css/style.css
│       └── js/app.js
│
├── data/
│   └── dumping_data.json
│
├── model/
│   ├── hotspot_model.joblib
│   └── metadata.json
│
├── api/
│   └── index.py
│
├── train_model.py
├── requirements.txt
├── vercel.json
└── README.md
```

## Vercel
`api/index.py` and `vercel.json` are included for a Vercel Python deployment. ML packages can be large for serverless builds, so if Vercel rejects the dependency bundle, use a Python-friendly backend host and keep the frontend on Vercel.

## Viva explanation
**Python:** backend and ML prediction.

**HTML:** page structure.

**CSS:** responsive design.

**JavaScript:** map, filters and communication with Flask APIs.

**Decision Tree:** learns patterns from previous records and predicts Low, Medium or High hotspot risk.
