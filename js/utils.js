// js/utils.js – общие утилиты

// Безопасное получение элемента DOM
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id '${id}' not found`);
    }
    return element;
}

// Экранирование HTML
function escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m];
    });
}

// Генерация уникального ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Показ уведомления
function showNotification(message) {
    const notification = safeGetElement('notification');
    const notificationText = safeGetElement('notificationText');
    if (!notification || !notificationText) return;
    notificationText.textContent = escapeHTML(message);
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Throttle для частых событий
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Копирование текста в буфер обмена
function copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

// ================== EVENT BUS ==================
// Центральное событие — всё обновление интерфейса через него
function dispatchStateChanged(detail = {}) {
    const event = new CustomEvent('stateChanged', {
        detail: { timestamp: Date.now(), ...detail }
    });
    window.dispatchEvent(event);
}


// Экспорт в глобальную область
window.safeGetElement = safeGetElement;
window.escapeHTML = escapeHTML;
window.generateId = generateId;
window.showNotification = showNotification;
window.throttle = throttle;
window.copyToClipboard = copyToClipboard;
window.dispatchStateChanged = dispatchStateChanged;