import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.model_selection import train_test_split
import joblib
import os

# Create mock data for training
np.random.seed(42)
n_samples = 1000

data = {
    'age': np.random.randint(18, 80, n_samples),
    'gender': np.random.choice([0, 1], n_samples), # 0: Male, 1: Female
    'sleep_hours': np.random.uniform(4, 10, n_samples),
    'exercise_frequency': np.random.randint(0, 8, n_samples),
    'diet_quality': np.random.randint(1, 11, n_samples),
    'screen_time': np.random.uniform(1, 14, n_samples),
    'stress_level': np.random.randint(1, 11, n_samples)
}

df = pd.DataFrame(data)

# Generate synthetic target variables based on inputs
# Health score: 0-100 (higher is better)
df['health_score'] = 100 - (
    (df['age'] * 0.2) + 
    ((10 - df['sleep_hours']) * 3) + 
    ((10 - df['exercise_frequency']) * 2) + 
    ((10 - df['diet_quality']) * 2) + 
    (df['screen_time'] * 1.5) + 
    (df['stress_level'] * 3)
)
df['health_score'] = df['health_score'].clip(0, 100)

# Risks (0 to 1 scaling, later converted to percentages)
# Obesity risk: higher age, low exercise, low diet quality, high screen time
db_risk_base = (df['age']*0.01) - (df['exercise_frequency']*0.1) - (df['diet_quality']*0.05) + (df['screen_time']*0.02)
df['obesity_risk_binary'] = (db_risk_base > db_risk_base.median()).astype(int)

# Stress risk: high stress_level, low sleep
st_risk_base = (df['stress_level']*0.2) - (df['sleep_hours']*0.1)
df['stress_risk_binary'] = (st_risk_base > st_risk_base.median()).astype(int)

# Sleep disorder: low sleep, high screen
sl_risk_base = (10 - df['sleep_hours'])*0.2 + (df['screen_time']*0.1)
df['sleep_disorder_binary'] = (sl_risk_base > sl_risk_base.median()).astype(int)

X = df[['age', 'gender', 'sleep_hours', 'exercise_frequency', 'diet_quality', 'screen_time', 'stress_level']]

# Train Health Score Model (Regression)
y_score = df['health_score']
score_model = LinearRegression()
score_model.fit(X, y_score)

# Train Risk Models (Classification returning probabilities)
y_obesity = df['obesity_risk_binary']
obesity_model = LogisticRegression(max_iter=1000)
obesity_model.fit(X, y_obesity)

y_stress = df['stress_risk_binary']
stress_model = LogisticRegression(max_iter=1000)
stress_model.fit(X, y_stress)

y_sleep = df['sleep_disorder_binary']
sleep_model = LogisticRegression(max_iter=1000)
sleep_model.fit(X, y_sleep)

# Save models
os.makedirs('models', exist_ok=True)
joblib.dump(score_model, 'models/health_score_model.pkl')
joblib.dump(obesity_model, 'models/obesity_model.pkl')
joblib.dump(stress_model, 'models/stress_model.pkl')
joblib.dump(sleep_model, 'models/sleep_model.pkl')

print("Models trained and saved successfully.")
