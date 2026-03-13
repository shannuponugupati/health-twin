import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import app, { db } from '../firebase';
import { useAuth } from '../App';
import { getHealthAdvice, detectSymptom, HEALTH_KNOWLEDGE } from '../utils/healthAssistantCore';
import { detectEmergency } from '../utils/emergencyDetection';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Sub-Components ───────────────────────────────────────────────────────────

const MessageBubble = ({ message, isAI }) => (
    <div style={{
        display: 'flex',
        justifyContent: isAI ? 'flex-start' : 'flex-end',
        marginBottom: '1rem',
        animation: 'fadeInUp 0.3s ease forwards',
        opacity: 0,
        transform: 'translateY(10px)',
    }}>
        <div style={{
            maxWidth: '80%',
            background: isAI ? 'rgba(10, 15, 30, 0.8)' : 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 163, 255, 0.2))',
            border: `1px solid ${isAI ? 'rgba(0, 240, 255, 0.2)' : 'rgba(0, 240, 255, 0.5)'}`,
            borderRadius: isAI ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
            padding: '1rem',
            color: 'white',
            boxShadow: isAI ? '0 4px 12px rgba(0, 240, 255, 0.05)' : '0 4px 12px rgba(0, 240, 255, 0.15)',
            position: 'relative',
            backdropFilter: 'blur(10px)'
        }}>
            {isAI && (
                <div style={{ fontSize: '1.2rem', marginBottom: '0.4rem', textShadow: '0 0 10px #00F0FF' }}>🛡️</div>
            )}
            <div style={{ fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: isAI ? 'var(--text-main)' : '#00F0FF' }}>
                {message}
            </div>
            <div style={{ 
                fontSize: '0.65rem', 
                marginTop: '0.5rem', 
                opacity: 0.6, 
                textAlign: isAI ? 'left' : 'right',
                color: 'var(--text-muted)'
            }}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
    </div>
);

const SuggestionChip = ({ icon, text, onClick }) => (
    <button 
        onClick={() => onClick(text)}
        className="glass-panel" 
        style={{
            padding: '0.6rem 1rem',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
        }}
        onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.color = 'var(--text-main)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = 'var(--text-secondary)';
        }}
    >
        <span>{icon}</span> {text}
    </button>
);

// ── Main Page ───────────────────────────────────────────────────────────────

const HealthAssistant = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello! I'm your AI Health Assistant. How are you feeling today? You can describe any symptoms or ask for wellness tips.",
            isAI: true
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [lifestyleData, setLifestyleData] = useState(null);

    useEffect(() => {
        const fetchLifestyle = async () => {
            if (!user) return;
            const snap = await getDoc(doc(db, 'lifestyleData', user.uid));
            if (snap.exists()) setLifestyleData(snap.data());
        };
        fetchLifestyle();
    }, [user]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const handleSend = async (text) => {
        if (!text.trim()) return;

        const userMsg = { id: Date.now(), text, isAI: false };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsThinking(true);

        try {
            // Emergency detection always takes priority
            const emergencyHits = detectEmergency(text);
            if (emergencyHits.length > 0) {
                const s = emergencyHits[0];
                let responseText = `🚨 URGENT: EMERGENCY SYMPTOM DETECTED\n\n`;
                responseText += `Identified serious symptom: ${s.label}.\n\n`;
                responseText += `⚠️ Urgent Advice: ${s.advice}\n\n`;
                responseText += `What you should do now:\n• Stop all physical exertion.\n• Call emergency services (e.g., 911) if pain is severe.\n• Click "Report Emergency" on your Dashboard to alert contacts.\n\n`;
                responseText += `--- \n*Please prioritize your safety. Seek medical help now.*`;
                setMessages(prev => [...prev, { id: Date.now() + 1, text: responseText, isAI: true }]);
                return;
            }

            // Try Gemini first; gracefully fall back to local knowledge base on failure
            let responseText = "";
            let geminiFailed = false;
            try {
                const apiKey = import.meta.env.VITE_GEMINI_API_KEY || app.options.apiKey;
                if (!apiKey) throw new Error("API Key not found");
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

                const symptomKey = detectSymptom(text);
                const localKnowledge = symptomKey ? HEALTH_KNOWLEDGE[symptomKey] : null;
                const knowledgeHint = localKnowledge
                    ? `\nLocal health data hint for "${symptomKey}": Causes: ${localKnowledge.causes}. Suggestions: ${localKnowledge.suggestions.join(', ')}.`
                    : '';

                const prompt = `You are a futuristic AI Health Assistant in a Cyberpunk Digital Twin app called "HEALTH TWIN". 
You can answer ANY question the user asks - health, fitness, diet, science, coding, general conversation, etc.
User's lifestyle data: ${JSON.stringify(lifestyleData || {})}.${knowledgeHint}
User's question: "${text}"

Your response must:
- Be helpful, empathetic, and detailed
- Use emojis to structure sections
- Use plain text only, NO markdown asterisks or pound signs for formatting
- Feel futuristic and high-tech in tone
- End with a short AI disclaimer only if the topic is medical`;

                const result = await model.generateContent(prompt);
                responseText = result.response.text();
            } catch (geminiError) {
                console.warn("Gemini unavailable, using local fallback:", geminiError.message);
                geminiFailed = true;
                // Fallback to local knowledge base
                const symptomKey = detectSymptom(text);
                if (symptomKey) {
                    const advice = getHealthAdvice(text, lifestyleData);
                    responseText = `${advice.icon} ${advice.title} Guidance\n\n`;
                    if (advice.personalizedNote) responseText += `💡 Personalized Insight:\n${advice.personalizedNote}\n\n`;
                    responseText += `🔍 Potential Causes:\n${advice.causes}\n\n`;
                    responseText += `🏡 Home Remedies:\n${advice.suggestions.map(s => `• ${s}`).join('\n')}\n\n`;
                    responseText += `🛡️ Prevention:\n${advice.preventive}\n\n`;
                    responseText += `⚡ Note: AI cloud engine is temporarily at capacity. Showing local health database response.\n⚠️ If symptoms persist, consult a healthcare professional.`;
                } else {
                    const lower = text.toLowerCase().trim();
                    // Conversational fallback for common greetings and general queries
                    if (lower.match(/^(hi|hello|hey|howdy|yo|sup|greetings)/)) {
                        responseText = `👋 Hello! I'm your AI Health Twin Assistant, always online and ready to help!\n\n🛡️ I can assist you with:\n• Health questions (symptoms, remedies, wellness tips)\n• Diet and nutrition advice\n• Fitness and exercise guidance\n• General questions on any topic\n\nThe cloud AI engine is temporarily at capacity right now, so ask me a health-related question and I'll pull from my built-in health database!\n\nHow can I help you today?`;
                    } else if (lower.match(/how are you|how r u|how do you do/)) {
                        responseText = `🤖 I'm running at optimal capacity! All systems are online.\n\nThough the cloud AI engine is temporarily at its limit, I'm still here to help with health questions, symptoms, wellness tips, and more.\n\nHow are YOU feeling today? Tell me your symptoms and I'll get you sorted! 💪`;
                    } else if (lower.match(/what can you do|what do you do|help|capabilities/)) {
                        responseText = `🛡️ HEALTH TWIN AI — Capabilities\n\n🔬 Symptom Analysis - Describe any symptom\n💊 Home Remedies - Natural wellness tips\n🥗 Diet & Nutrition - Food and eating advice\n🏃 Fitness Guidance - Exercise recommendations\n🚨 Emergency Detection - Identifies urgent symptoms\n🌐 General Knowledge - Science, tech, and more\n\nJust type anything and I'll do my best to help! The cloud AI is temporarily at capacity but the health database is always available.`;
                    } else if (lower.match(/thank|thanks|ty|thank you/)) {
                        responseText = `🙏 You're welcome! Stay healthy and take care of yourself.\n\nFeel free to ask me anything anytime — I'm always here! 💪`;
                    } else if (lower.match(/bye|goodbye|see you|take care/)) {
                        responseText = `👋 Goodbye! Stay healthy and hydrated!\n\nRemember:\n• Drink enough water 💧\n• Get 7-8 hours of sleep 🌙\n• Move your body daily 🏃\n• Take breaks from screens 👁️\n\nCome back anytime you need health guidance! 🛡️`;
                    } else {
                        const isQuota = geminiError.message?.includes('429') || geminiError.message?.includes('quota');
                        responseText = isQuota
                            ? `⚡ Cloud Intelligence Engine at Capacity\n\nThe Gemini AI cloud engine has hit its free-tier limit for now. Please try again in a few minutes.\n\nWhile you wait, I can answer health questions from my built-in database! Try:\n• Headache  • Stress  • Fatigue\n• Poor Sleep  • Indigestion  • Dehydration\n• Fever  • Immunity  • Hydration`
                            : `⚠️ Unable to connect: ${geminiError.message}`;
                    }
                }
            }
            setMessages(prev => [...prev, { id: Date.now() + 1, text: responseText, isAI: true }]);

        } catch (error) {
            console.error("Assistant Error:", error);
            setMessages(prev => [...prev, { 
                id: Date.now() + 1, 
                text: `⚠️ System Error: ${error.message || 'Unable to connect to the AI model.'}`, 
                isAI: true 
            }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend(inputValue);
    };

    const commonSymptoms = [
        { icon: '🤕', label: 'Headache' },
        { icon: '😰', label: 'Stress' },
        { icon: '😴', label: 'Fatigue' },
        { icon: '🤢', label: 'Indigestion' },
        { icon: '🌙', label: 'Poor Sleep' },
        { icon: '🛡️', label: 'Boost Immunity' }
    ];

    return (
        <div className="container animate-fade-in" style={{ 
            height: 'calc(100vh - 120px)', 
            display: 'flex', 
            flexDirection: 'column',
            paddingTop: '1.5rem',
            paddingBottom: '2rem',
        }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button 
                    onClick={() => navigate('/dashboard')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                    ←
                </button>
                <div style={{ fontSize: '2rem' }}>🛡️</div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>AI Health Assistant</h2>
                    <span style={{ fontSize: '0.8rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
                        Always Active • AI Guide
                    </span>
                </div>
            </div>

            {/* Chat Body */}
            <div className="glass-panel" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                position: 'relative',
                borderRadius: '24px',
            }}>
                {/* Background Decor */}
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(0, 240, 255, 0.05) 0%, transparent 70%)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    width: '100%',
                    height: '40%',
                    background: 'linear-gradient(to top, rgba(0, 240, 255, 0.02) 0%, transparent 100%)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }}></div>

                {/* Messages Container */}
                <div 
                    ref={scrollRef}
                    style={{ 
                        flex: 1, 
                        overflowY: 'auto', 
                        padding: '1.5rem',
                        scrollbarWidth: 'none',
                        zIndex: 1
                    }}>
                    {messages.map(msg => (
                        <MessageBubble key={msg.id} message={msg.text} isAI={msg.isAI} />
                    ))}
                    {isThinking && (
                        <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', animation: 'fadeIn 0.3s' }}>
                            <div className="processing-orb" style={{ width: '8px', height: '8px' }}></div>
                            <div className="processing-orb" style={{ width: '8px', height: '8px', animationDelay: '0.2s' }}></div>
                            <div className="processing-orb" style={{ width: '8px', height: '8px', animationDelay: '0.4s' }}></div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div style={{ 
                    padding: '1.25rem', 
                    background: 'rgba(255,255,255,0.02)', 
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    zIndex: 1
                }}>
                    {/* Suggested Chips */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '0.6rem', 
                        overflowX: 'auto', 
                        paddingBottom: '1rem',
                        scrollbarWidth: 'none'
                    }}>
                        {commonSymptoms.map((s, i) => (
                            <SuggestionChip 
                                key={i} 
                                icon={s.icon} 
                                text={s.label} 
                                onClick={(val) => handleSend(`Talk about ${val}`)} 
                            />
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <input 
                            type="text"
                            placeholder="Describe symptoms or ask a health question (e.g., Guidance on improving sleep)..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            style={{
                                flex: 1,
                                background: 'rgba(10, 15, 30, 0.5)',
                                border: '1px solid rgba(0, 240, 255, 0.3)',
                                borderRadius: '12px',
                                padding: '0.85rem 1.25rem',
                                color: '#00F0FF',
                                outline: 'none',
                                fontSize: '0.95rem',
                                boxShadow: 'inset 0 0 10px rgba(0, 240, 255, 0.05)'
                            }}
                        />
                        <button 
                            className="btn btn-primary"
                            onClick={() => handleSend(inputValue)}
                            style={{ 
                                borderRadius: '12px', 
                                width: '48px', 
                                height: '48px', 
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'var(--gradient-primary)',
                                border: '1px solid #00F0FF'
                            }}
                        >
                            🚀
                        </button>
                    </div>
                </div>
            </div>

            {/* Safety Disclaimer static footer */}
            <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)', 
                textAlign: 'center', 
                marginTop: '1rem',
                lineHeight: 1.5
            }}>
                This assistant provides general guidance based on wellness patterns. <br/>
                It is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
        </div>
    );
};

export default HealthAssistant;
