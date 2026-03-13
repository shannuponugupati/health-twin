const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

async function testKey() {
    const envContent = fs.readFileSync(path.join(__dirname, 'frontend', '.env'), 'utf8');
    const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
    const apiKey = match ? match[1].trim() : null;

    if (!apiKey) {
        console.log("No API Key found in .env");
        return;
    }

    console.log("Testing Key ending in:", apiKey.slice(-4));
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("Attempting to list models...");
        // ListModels might not be available in standard SDK easily, let's just try to generate content with multiple model names
        const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"];
        
        for (const m of modelsToTest) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("Hi");
                console.log(`Model ${m}: SUCCESS`);
                console.log("Response:", result.response.text().substring(0, 50));
            } catch (err) {
                console.log(`Model ${m}: FAILED - ${err.message}`);
            }
        }
    } catch (e) {
        console.log("General Error:", e.message);
    }
}

testKey();
