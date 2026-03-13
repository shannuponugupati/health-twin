import { sendTelegramAlert } from './frontend/src/utils/telegramApi.js';

const testAlert = async () => {
    console.log("Testing Telegram Alert...");
    const result = await sendTelegramAlert("🚨 TEST ALERT: This is a direct test message from the Health Twin Web Application. If you see this, the Telegram integration is working beautifully! 🚨");
    console.log("Result:", result);
};

testAlert();
