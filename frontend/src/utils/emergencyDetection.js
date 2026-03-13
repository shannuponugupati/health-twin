/**
 * Health Emergency Detection Utility
 * Identifies high-risk symptoms and calculates urgency levels.
 */

export const EMERGENCY_SYMPTOMS = {
    chest_pain: {
        label: "Severe Chest Pain",
        severity: "HIGH",
        advice: "Stop all activity. Sit or lie down in a comfortable position. If pain is crushing or spreads to arms/jaw, call emergency services immediately.",
        keywords: ["chest pain", "tightness in chest", "heart pain", "crushing pain"]
    },
    difficulty_breathing: {
        label: "Difficulty Breathing",
        severity: "HIGH",
        advice: "Sit upright. Try to remain calm and take slow, steady breaths. Seek emergency medical help immediately.",
        keywords: ["breathing", "short of breath", "gasping", "cannot breathe"]
    },
    fainting: {
        label: "Sudden Dizziness or Fainting",
        severity: "HIGH",
        advice: "Lie down and elevate your legs. Do not try to get up quickly. If person is unresponsive, call for help.",
        keywords: ["faint", "passed out", "dizzy", "unconscious", "blackout"]
    },
    high_fever: {
        label: "Very High Fever",
        severity: "MODERATE",
        advice: "Rest and stay hydrated. Use a cool compress. If fever exceeds 103°F (39.4°C) or is accompanied by confusion, seek medical help.",
        keywords: ["high fever", "burning up", "very hot"]
    },
    severe_headache: {
        label: "Severe Headache",
        severity: "MODERATE",
        advice: "Rest in a dark room. Avoid bright lights and screens. If it's a 'thunderclap' headache (worst of your life), seek immediate care.",
        keywords: ["bad headache", "worst headache", "migraine", "head pain"]
    },
    persistent_vomiting: {
        label: "Persistent Vomiting",
        severity: "MODERATE",
        advice: "Small sips of water or electrolyte solution. Do not eat solid food until vomiting stops. Seek help if you cannot keep fluids down for 12+ hours.",
        keywords: ["vomiting", "throwing up", "cannot stop puking"]
    }
};

/**
 * Detects emergency symptoms from user input text.
 */
export const detectEmergency = (text) => {
    const input = text.toLowerCase();
    const detected = [];

    for (const [key, symptom] of Object.entries(EMERGENCY_SYMPTOMS)) {
        if (symptom.keywords.some(kw => input.includes(kw))) {
            detected.push({ key, ...symptom });
        }
    }

    return detected;
};

/**
 * Calculates risk level based on detected symptoms and Digital Twin lifestyle data.
 */
export const calculateEmergencyRisk = (detectedSymptoms, lifestyleData) => {
    if (detectedSymptoms.length === 0) return { level: "NORMAL", color: "#10B981" };

    let score = 0;
    
    // Base score from symptoms
    detectedSymptoms.forEach(s => {
        score += (s.severity === "HIGH" ? 50 : 25);
    });

    // Risk Multipliers from Lifestyle Data
    if (lifestyleData) {
        if (lifestyleData.stress_level > 8) score += 15; // High stress increases cardiac/anxiety risk
        if (lifestyleData.sleep_hours < 5) score += 10;  // Fatigue exacerbates symptoms
        if (lifestyleData.health_score < 40) score += 20; // Poor baseline health increases risk
    }

    if (score >= 50) return { level: "HIGH", color: "#EF4444", urgency: "IMMEDIATE" };
    if (score >= 25) return { level: "MODERATE", color: "#F59E0B", urgency: "URGENT" };
    
    return { level: "LOW", color: "#10B981", urgency: "MONITOR" };
};
