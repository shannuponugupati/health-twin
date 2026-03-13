/**
 * Utility function to send Telegram alert messages.
 * Uses the Telegram Bot API.
 */

export const sendTelegramAlert = async (text) => {
    // The Telegram API endpoint requires the 'bot' prefix before the token
    const url = 'https://api.telegram.org/bot8622101634:AAFypN3YbX8jMNmDH5Ww_msZrqFFlsMQleY/sendMessage';
    const chatId = '7047474113';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
            }),
        });

        const data = await response.json();
        
        if (data.ok) {
            console.log('Telegram alert sent successfully:', data);
            return { success: true, response: data };
        } else {
            console.error('Failed to send Telegram alert:', data.description);
            return { success: false, error: data.description };
        }
    } catch (error) {
        console.error('Error sending Telegram alert:', error);
        return { success: false, error: error.message };
    }
};
