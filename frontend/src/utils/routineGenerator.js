/**
 * routineGenerator.js
 * Generates a personalized daily routine and diet plan based on user's lifestyle data.
 */

/**
 * Parse a time string like "06:30" into total minutes from midnight.
 */
const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

/**
 * Add minutes to a time string and return new time string.
 */
const addMinutes = (timeStr, mins) => {
    let total = toMinutes(timeStr) + mins;
    total = ((total % 1440) + 1440) % 1440; // wrap around midnight
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Format time string to 12-hour format with AM/PM.
 */
export const formatTime12 = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

/**
 * Generate the daily routine schedule based on user's lifestyle preferences.
 * @param {object} ls - Lifestyle data from Firestore
 * @returns {Array} - Array of routine events with time, label, icon, description, smsMessage
 */
export const generateRoutine = (ls) => {
    const wake = ls.wake_time || '06:00';
    const sleep = ls.sleep_time || '22:30';
    const exPref = ls.exercise_preference || 'morning';

    const routine = [];

    // Wake up
    routine.push({
        key: 'wake',
        time: wake,
        label: 'Wake Up',
        icon: '☀️',
        color: '#F59E0B',
        description: 'Start your day with a positive mindset. Take 3 deep breaths.',
        smsMessage: `Good morning! ☀️ It's time to wake up and start your healthy day. Rise and shine!`,
        enabled: true,
    });

    // Drink water
    routine.push({
        key: 'water_morning',
        time: addMinutes(wake, 10),
        label: 'Drink Water',
        icon: '💧',
        color: '#0EA5E9',
        description: 'Drink a full glass of water to kickstart your metabolism.',
        smsMessage: `💧 Reminder: Drink a glass of water to stay hydrated and energized.`,
        enabled: true,
    });

    // Morning stretching / yoga
    routine.push({
        key: 'stretch',
        time: addMinutes(wake, 20),
        label: 'Stretch / Yoga',
        icon: '🧘',
        color: '#8B5CF6',
        description: '10–15 minutes of light stretching or yoga to wake up your muscles.',
        smsMessage: `🧘 Time for your morning stretch or yoga. Your body will thank you!`,
        enabled: true,
    });

    // Exercise - morning or evening based on preference
    const morningExercise = exPref === 'morning' || exPref === 'flexible';
    if (morningExercise) {
        routine.push({
            key: 'exercise',
            time: addMinutes(wake, 45),
            label: 'Exercise / Walk',
            icon: '🏃',
            color: '#10B981',
            description: '30 minutes of moderate exercise — jogging, walking, gym, or yoga.',
            smsMessage: `🏃 Time for your morning exercise! Even a 30-minute walk makes a huge difference.`,
            enabled: true,
        });
    }

    // Breakfast
    routine.push({
        key: 'breakfast',
        time: addMinutes(wake, 90),
        label: 'Healthy Breakfast',
        icon: '🍳',
        color: '#F97316',
        description: 'Have a nutritious breakfast within 90 minutes of waking up.',
        smsMessage: `🍳 Breakfast reminder! Don't skip your morning meal — it fuels your whole day.`,
        enabled: true,
    });

    // Mid-morning snack
    routine.push({
        key: 'snack_morning',
        time: addMinutes(wake, 270), // ~4.5 hours after wake
        label: 'Fruits / Nuts Snack',
        icon: '🍎',
        color: '#EF4444',
        description: 'Eat a handful of fruits, nuts, or yogurt to maintain energy levels.',
        smsMessage: `🍎 It's snack time! Grab some fruits or nuts to keep your energy up.`,
        enabled: true,
    });

    // Lunch
    routine.push({
        key: 'lunch',
        time: addMinutes(wake, 390), // ~6.5 hours after wake
        label: 'Lunch',
        icon: '🥗',
        color: '#22C55E',
        description: 'Have a balanced lunch with grains, vegetables, and protein.',
        smsMessage: `🥗 Lunch time! Eat a balanced meal with grains, veggies, and protein.`,
        enabled: true,
    });

    // Afternoon water
    routine.push({
        key: 'water_afternoon',
        time: addMinutes(wake, 480), // 8 hours after wake
        label: 'Drink Water',
        icon: '💧',
        color: '#0EA5E9',
        description: 'Stay hydrated — drink at least 2 glasses of water.',
        smsMessage: `💧 Stay hydrated! Time to drink some water and refresh yourself.`,
        enabled: true,
    });

    // Evening exercise (if not morning)
    if (!morningExercise) {
        routine.push({
            key: 'exercise',
            time: addMinutes(wake, 570), // ~9.5 hours after wake (~5:30 PM for 8 AM wake)
            label: 'Exercise / Evening Walk',
            icon: '🏃',
            color: '#10B981',
            description: '30–45 minutes of exercise or an evening walk in fresh air.',
            smsMessage: `🏃 Time for your evening exercise or walk. Get moving for better health!`,
            enabled: true,
        });
    } else {
        // Afternoon tea break
        routine.push({
            key: 'evening_snack',
            time: addMinutes(wake, 570),
            label: 'Evening Snack',
            icon: '☕',
            color: '#D97706',
            description: 'Light snack — herbal tea, nuts, or a small fruit.',
            smsMessage: `☕ Evening snack reminder. Keep it light — fruit, nuts, or herbal tea.`,
            enabled: true,
        });
    }

    // Dinner
    routine.push({
        key: 'dinner',
        time: addMinutes(toMinutes(sleep) > toMinutes(wake) ? sleep : '22:30', -180), // ~3 hours before sleep
        label: 'Light Dinner',
        icon: '🍜',
        color: '#A78BFA',
        description: 'Have a light dinner — soup, vegetables, or salad is ideal.',
        smsMessage: `🍜 Dinner time! Keep it light and nutritious. Avoid heavy meals before sleep.`,
        enabled: true,
    });

    // Relax / reduce screen time
    routine.push({
        key: 'relax',
        time: addMinutes(sleep, -60),
        label: 'Relax & Unwind',
        icon: '🌙',
        color: '#6366F1',
        description: 'Reduce screen time. Read a book, meditate, or do light breathing exercises.',
        smsMessage: `🌙 Wind down time! Reduce screen time and relax your mind for better sleep.`,
        enabled: true,
    });

    // Sleep
    routine.push({
        key: 'sleep',
        time: sleep,
        label: 'Sleep',
        icon: '😴',
        color: '#64748B',
        description: 'Aim for 7–8 hours of quality sleep. Keep your room cool and dark.',
        smsMessage: `😴 Bedtime reminder! Prepare for sleep now. A good night's rest is essential for health.`,
        enabled: true,
    });

    // Sort by time
    routine.sort((a, b) => toMinutes(a.time) - toMinutes(b.time));

    return routine;
};

/**
 * Generate personalized diet plan based on diet preference.
 * @param {string} dietPref - 'vegetarian' | 'non-vegetarian' | 'vegan'
 * @returns {object} - Diet plan for each meal
 */
export const generateDietPlan = (dietPref) => {
    const plans = {
        vegetarian: {
            breakfast: {
                items: ['Oats with milk and fruits', 'Whole grain toast with peanut butter', 'Fresh banana or apple', 'A glass of warm milk or herbal tea'],
                tips: 'Include protein-rich options like eggs or dairy to start your day strong.'
            },
            midMorning: {
                items: ['Mixed nuts (almonds, walnuts, cashews)', 'Fresh seasonal fruits', 'Low-fat yogurt'],
                tips: 'Keep portions small to maintain stable blood sugar levels.'
            },
            lunch: {
                items: ['Brown rice or whole wheat roti', 'Dal (lentils) or paneer dish', 'Mixed vegetable curry', 'Fresh salad with cucumber and tomato', 'A glass of buttermilk'],
                tips: 'Ensure a good balance of carbs, protein, and fiber in your lunch.'
            },
            eveningSnack: {
                items: ['Roasted chickpeas or sprouts', 'A fruit or smoothie', 'Herbal tea or green tea'],
                tips: 'Light snacks prevent overeating at dinner.'
            },
            dinner: {
                items: ['Vegetable soup or dal soup', 'Multigrain flatbread', 'Steamed or stir-fried vegetables', 'Green salad'],
                tips: 'Keep dinner light and eat at least 2–3 hours before sleeping.'
            }
        },
        'non-vegetarian': {
            breakfast: {
                items: ['Boiled eggs (2) or omelette with vegetables', 'Whole grain bread or oats', 'Fresh fruit juice or banana', 'A glass of water or green tea'],
                tips: 'Protein-rich breakfast with eggs sets the tone for an energetic day.'
            },
            midMorning: {
                items: ['Mixed nuts', 'Fresh fruits', 'Low-fat yogurt or cottage cheese'],
                tips: 'Keep it light before your main meals.'
            },
            lunch: {
                items: ['Brown rice or whole wheat roti', 'Grilled chicken, fish, or lean meat', 'Mixed vegetables or salad', 'Lentil soup (dal)', 'Cucumber raita'],
                tips: 'Include lean protein like chicken or fish for muscle repair and satiety.'
            },
            eveningSnack: {
                items: ['Boiled egg or protein shake', 'A fruit or handful of nuts', 'Herbal tea'],
                tips: 'A post-workout snack should combine protein and simple carbs.'
            },
            dinner: {
                items: ['Grilled or baked fish', 'Steamed vegetables', 'A small bowl of soup', 'Light salad with olive oil dressing'],
                tips: 'Avoid fried or heavy meats at dinner. Opt for grilled or baked options.'
            }
        },
        vegan: {
            breakfast: {
                items: ['Overnight oats with almond milk and chia seeds', 'Sliced banana and mixed berries', 'Avocado toast on whole grain bread', 'A cup of green tea or black coffee'],
                tips: 'Chia seeds and flaxseeds are excellent sources of omega-3 for vegans.'
            },
            midMorning: {
                items: ['A handful of nuts and seeds', 'Fresh seasonal fruits', 'Coconut yogurt or oat smoothie'],
                tips: 'Nuts provide healthy fats to keep you energized until lunch.'
            },
            lunch: {
                items: ['Brown rice or quinoa', 'Chickpea or lentil-based curry', 'Roasted vegetables', 'Fresh salad with lemon dressing', 'A glass of plant-based milk or lemon water'],
                tips: 'Combine grains and legumes for a complete amino acid profile.'
            },
            eveningSnack: {
                items: ['Roasted chickpeas or edamame', 'Fresh fruit or plant-based smoothie', 'Herbal or chamomile tea'],
                tips: 'Plant-based protein snacks help bridge the gap between meals.'
            },
            dinner: {
                items: ['Vegetable and tofu stir-fry', 'Lentil or miso soup', 'Steamed greens (spinach, broccoli)', 'A small portion of quinoa or brown rice'],
                tips: 'Tofu, tempeh, or legumes at dinner ensure you meet daily protein needs.'
            }
        }
    };

    return plans[dietPref] || plans['vegetarian'];
};
