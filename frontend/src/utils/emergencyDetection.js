/**
 * Health Emergency Detection Utility
 * Identifies high-risk symptoms and calculates urgency levels.
 */

export const EMERGENCY_SYMPTOMS = {
    chest_pain: {
        label: "Severe Chest Pain",
        severity: "HIGH",
        advice: "Stop all activity. Sit or lie down in a comfortable position. If pain is crushing or spreads to arms/jaw, call emergency services immediately.",
        remedies: [
            "Chew an aspirin (325mg) if not allergic.",
            "Loosen tight clothing around neck and waist.",
            "Stay as calm as possible to reduce heart strain.",
            "Do not drive yourself to the hospital."
        ],
        keywords: ["chest pain", "tightness in chest", "heart pain", "crushing pain"]
    },
    difficulty_breathing: {
        label: "Difficulty Breathing",
        severity: "HIGH",
        advice: "Sit upright. Try to remain calm and take slow, steady breaths. Seek emergency medical help immediately.",
        remedies: [
            "Use your rescue inhaler if you have asthma/COPD.",
            "Sit in a 'tripod position' (lean forward, hands on knees).",
            "Try pursed-lip breathing (inhale nose, exhale slowly through lips).",
            "Avoid talking to save oxygen."
        ],
        keywords: ["breathing", "short of breath", "gasping", "cannot breathe"]
    },
    fainting: {
        label: "Sudden Dizziness or Fainting",
        severity: "HIGH",
        advice: "Lie down and elevate your legs. Do not try to get up quickly. If person is unresponsive, call for help.",
        remedies: [
            "Raise legs above heart level (about 12 inches).",
            "Check for breathing and pulse.",
            "Turn the person on their side if they vomit.",
            "Loosen belts, collars, or restrictive clothing."
        ],
        keywords: ["faint", "passed out", "dizzy", "unconscious", "blackout"]
    },
    high_fever: {
        label: "Very High Fever",
        severity: "MODERATE",
        advice: "Rest and stay hydrated. Use a cool compress. If fever exceeds 103°F (39.4°C) or is accompanied by confusion, seek medical help.",
        remedies: [
            "Take acetaminophen (Tylenol) or ibuprofen (Advil) as directed.",
            "Drink plenty of water or electrolyte fluids.",
            "Sponge your skin with lukewarm (not cold) water.",
            "Wear lightweight clothing."
        ],
        keywords: ["high fever", "burning up", "very hot"]
    },
    severe_headache: {
        label: "Severe Headache",
        severity: "MODERATE",
        advice: "Rest in a dark room. Avoid bright lights and screens. If it's a 'thunderclap' headache (worst of your life), seek immediate care.",
        remedies: [
            "Apply a cold or warm compress to forehead/neck.",
            "Stay hydrated and avoid caffeine.",
            "Practice gentle neck stretching if tension-related.",
            "Avoid loud noises and strong smells."
        ],
        keywords: ["bad headache", "worst headache", "migraine", "head pain"]
    },
    persistent_vomiting: {
        label: "Persistent Vomiting",
        severity: "MODERATE",
        advice: "Small sips of water or electrolyte solution. Do not eat solid food until vomiting stops. Seek help if you cannot keep fluids down for 12+ hours.",
        remedies: [
            "Wait 30-60 mins after vomiting before taking small sips of water.",
            "Try sucking on ice chips.",
            "Avoid solid food for at least 6 hours.",
            "Avoid dairy, caffeine, and spicy foods for 24 hours."
        ],
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
