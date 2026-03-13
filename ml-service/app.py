from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Load models
# Note: we need to handle case where models are not generated yet
models = {}
def load_models():
    try:
        models['health_score'] = joblib.load('models/health_score_model.pkl')
        models['obesity'] = joblib.load('models/obesity_model.pkl')
        models['stress'] = joblib.load('models/stress_model.pkl')
        models['sleep'] = joblib.load('models/sleep_model.pkl')
        print("Models loaded successfully.")
    except Exception as e:
        print(f"Error loading models: {e}. Please run train_model.py first.")

load_models()

def parse_gender(gender_str):
    # Mapping for mock model: 0 Male, 1 Female (ignoring others for simplicity in this mock)
    if gender_str == 'Female':
        return 1
    return 0

@app.route('/predict', methods=['POST'])
def predict():
    if not models:
        return jsonify({"error": "Models not loaded. Train models first."}), 503

    try:
        data = request.json
        
        # Extract features
        features = pd.DataFrame([{
            'age': data.get('age', 30),
            'gender': parse_gender(data.get('gender', 'Other')),
            'sleep_hours': data.get('sleep_hours', 7.0),
            'exercise_frequency': data.get('exercise_frequency', 3),
            'diet_quality': data.get('diet_quality', 5),
            'screen_time': data.get('screen_time', 4.0),
            'stress_level': data.get('stress_level', 5)
        }])

        # Predict Health Score
        health_score_pred = models['health_score'].predict(features)[0]
        
        # Predict Risks (Probability of class 1 * 100)
        obesity_risk_pred = models['obesity'].predict_proba(features)[0][1] * 100
        stress_risk_pred = models['stress'].predict_proba(features)[0][1] * 100
        sleep_risk_pred = models['sleep'].predict_proba(features)[0][1] * 100

        return jsonify({
            'health_score': float(max(0, min(100, health_score_pred))), # clamp to 0-100
            'obesity_risk': float(obesity_risk_pred),
            'stress_risk': float(stress_risk_pred),
            'sleep_disorder_risk': float(sleep_risk_pred)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "ML Service is running"})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
