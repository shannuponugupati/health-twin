/**
 * AI Health Assistant Knowledge Base
 * Maps symptoms and health topics to Causes, Suggestions, and Preventive Tips.
 */

export const HEALTH_KNOWLEDGE = {
    headache: {
        icon: '🤕',
        title: 'Headache',
        causes: 'Common reasons include dehydration, stress, poor sleep, or excessive screen time.',
        suggestions: [
            'Drink a glass of water immediately.',
            'Take a 15-minute break from all screens.',
            'Rest in a quiet, dark room.',
            'Gently massage your temples.'
        ],
        preventive: 'Stay hydrated, maintain a regular sleep schedule, and use blue light filters on devices.',
        relatedLifestyleKeys: ['water_intake', 'sleep_hours', 'screen_time', 'stress_level']
    },
    fever: {
        icon: '🤒',
        title: 'Fever',
        causes: 'Usually caused by the body fighting an infection (viral or bacterial).',
        suggestions: [
            'Drink plenty of fluids (water, juice, broth).',
            'Get plenty of rest.',
            'Use a cool damp cloth on your forehead.',
            'Wear lightweight clothing.'
        ],
        preventive: 'Maintain good hygiene, wash hands frequently, and keep your immune system strong with a healthy diet.',
        relatedLifestyleKeys: ['diet_quality']
    },
    stress: {
        icon: '😰',
        title: 'Stress & Anxiety',
        causes: 'Work pressure, lack of relaxation, poor work-life balance, or lack of sleep.',
        suggestions: [
            'Practice deep breathing (4-7-8 technique).',
            'Go for a 10-minute walk in nature.',
            'Try guided meditation or yoga.',
            'Write down your thoughts in a journal.'
        ],
        preventive: 'Schedule daily "down-time", prioritize tasks, and regular physical activity.',
        relatedLifestyleKeys: ['stress_level', 'physical_activity', 'sleep_quality']
    },
    fatigue: {
        icon: '😴',
        title: 'Fatigue & Low Energy',
        causes: 'Inadequate sleep, poor diet, dehydration, or lack of physical activity.',
        suggestions: [
            'Try to get 7-9 hours of quality sleep.',
            'Check if you have been drinking enough water.',
            'Eat a protein-rich snack for sustained energy.',
            'Take a short 20-minute power nap.'
        ],
        preventive: 'Regular exercise, balanced meals, and consistent sleep patterns.',
        relatedLifestyleKeys: ['energy_level', 'sleep_hours', 'diet_quality', 'water_intake']
    },
    indigestion: {
        icon: '🤢',
        title: 'Indigestion / Bloating',
        causes: 'Eating too fast, spicy or oily foods, or overeating.',
        suggestions: [
            'Sip warm ginger tea.',
            'Go for a light walk.',
            'Avoid lying down immediately after eating.',
            'Apply a warm compress to the abdomen.'
        ],
        preventive: 'Eat slowly, chew well, and avoid heavy meals late at night.',
        relatedLifestyleKeys: ['fast_food', 'diet_quality']
    },
    sleep: {
        icon: '🌙',
        title: 'Poor Sleep',
        causes: 'Blue light exposure before bed, caffeine late in the day, or an irregular schedule.',
        suggestions: [
            'Stop using screens 1 hour before bed.',
            'Keep your bedroom cool and dark.',
            'Try reading a physical book or listening to calm music.',
            'Avoid heavy meals near bedtime.'
        ],
        preventive: 'Stick to the same wake-up and sleep times even on weekends.',
        relatedLifestyleKeys: ['sleep_hours', 'sleep_quality', 'screen_time']
    },
    hydration: {
        icon: '💧',
        title: 'Dehydration',
        causes: 'Not drinking enough water, excessive sweating, or too much caffeine.',
        suggestions: [
            'Drink small sips of water throughout the next hour.',
            'Eat hydrating fruits like watermelon or cucumber.',
            'Limit coffee and soda intake.'
        ],
        preventive: 'Carry a water bottle and set reminders to drink every hour.',
        relatedLifestyleKeys: ['water_intake']
    },
    immunity: {
        icon: '🛡️',
        title: 'Boosting Immunity',
        causes: 'Vitamin deficiencies, lack of sleep, or chronic stress.',
        suggestions: [
            'Include Vitamin C-rich foods (Citrus, Bell peppers).',
            'Ensure you are getting at least 7 hours of sleep.',
            'Add garlic and ginger to your meals.',
            'Stay active with moderate exercise.'
        ],
        preventive: 'Maintain a colorful, diverse diet and manage stress effectively.',
        relatedLifestyleKeys: ['diet_quality', 'sleep_hours', 'stress_level']
    }
};

/**
 * Normalizes user input and tries to match keywords from the knowledge base.
 */
export const detectSymptom = (input) => {
    const text = input.toLowerCase();
    
    if (text.includes('headache') || text.includes('head pain')) return 'headache';
    if (text.includes('fever') || text.includes('temperature') || text.includes('hot')) return 'fever';
    if (text.includes('stress') || text.includes('anxious') || text.includes('tension')) return 'stress';
    if (text.includes('tired') || text.includes('fatigue') || text.includes('energy') || text.includes('exhausted')) return 'fatigue';
    if (text.includes('stomach') || text.includes('digestion') || text.includes('bloat') || text.includes('indigestion')) return 'indigestion';
    if (text.includes('sleep') || text.includes('insomnia')) return 'sleep';
    if (text.includes('water') || text.includes('thirst') || text.includes('dehydration') || text.includes('dry')) return 'hydration';
    if (text.includes('immunity') || text.includes('sick') || text.includes('cold') || text.includes('flu')) return 'immunity';
    
    return null;
};

/**
 * Generates a personalized response based on detected symptom and user's lifestyle data.
 */
export const getHealthAdvice = (userInput, lifestyleData = {}) => {
    const symptomKey = detectSymptom(userInput);
    
    if (!symptomKey) {
        return {
            content: "I'm here to help with common health concerns. You can ask about headaches, stress, sleep, digestion, or immunity!",
            isGeneric: true
        };
    }

    const info = HEALTH_KNOWLEDGE[symptomKey];
    let personalizedNote = "";

    // Personalized analysis using Digital Twin data
    if (lifestyleData) {
        if (symptomKey === 'headache' && lifestyleData.screen_time > 6) {
            personalizedNote = `Your digital twin shows you have high daily screen time (${lifestyleData.screen_time}h). This is likely a major contributor to your headaches.`;
        } else if (symptomKey === 'fatigue' && lifestyleData.sleep_hours < 6) {
            personalizedNote = `Your profile indicates you sleep less than 6 hours per night. Increasing your sleep duration could significantly boost your energy levels.`;
        } else if (symptomKey === 'stress' && lifestyleData.stress_level > 7) {
            personalizedNote = `Your health score reflects a very high stress level. Prioritizing these relaxation techniques is crucial for your well-being.`;
        } else if (symptomKey === 'hydration' && lifestyleData.water_intake < 3) {
            personalizedNote = `According to your logs, you drink about ${lifestyleData.water_intake}L of water. Aiming for at least 3-4L would help prevent these symptoms.`;
        } else if (symptomKey === 'sleep' && lifestyleData.sleep_quality < 5) {
            personalizedNote = `You mentioned having poor sleep quality in your assessment. Let's work on these habits to improve your rest.`;
        } else if (symptomKey === 'indigestion' && lifestyleData.fast_food > 5) {
            personalizedNote = `Your data shows frequent fast food consumption. Reducing this and following the tips below should help your digestion.`;
        }
    }

    return {
        ...info,
        personalizedNote,
        symptomKey
    };
};
