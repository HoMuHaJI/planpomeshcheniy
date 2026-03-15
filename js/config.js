// js/config.js — СЕКРЕТНЫЕ НАСТРОЙКИ
// НИКОГДА не коммить этот файл в публичный репозиторий!
// Добавь его в .gitignore

window.TELEGRAM_CONFIG = {
    BOT_TOKEN: '8142957488:AAGDsEIsGdtrCX-ZyvOD7nJjaVVD3_YIFks',
    CHAT_ID: '-1001701431569'
};

// Экспорт для удобства
window.getTelegramConfig = function() {
    return {
        token: window.TELEGRAM_CONFIG.BOT_TOKEN,
        chatId: window.TELEGRAM_CONFIG.CHAT_ID
    };
};