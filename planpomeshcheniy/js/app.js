// Основной файл приложения - инициализация и управление состоянием

// Глобальные переменные состояния редактора
let currentTool = 'select';
let rooms = [];
let selectedRoom = null;
let selectedElementObj = null;
let isDrawing = false;
let startX, startY;
let scale = 50; // 1 метр = 50 пикселей
let roomCounter = 1;
let viewOffsetX = 0;
let viewOffsetY = 0;
let zoom = 1;
let isDragging = false;
let dragStartX, dragStartY;
let dragOffsetX, dragOffsetY;
let isMovingElement = false;
let movingElement = null;

// Цены за работы (руб.)
const prices = {
    // Стартовая штукатурка
    primer: { square: 50, linear: 35 }, // Грунтовка
    plaster: { square: 450, linear: 315 }, // Штукатурка (погонный метр = 70% от квадратного)
    corner: { linear: 150 }, // Установка уголков
    // Армирование сеткой
    armoring: { square: 150, linear: 105 }, // Армирование сеткой (погонный метр = 70% от квадратного)
    // Финишная шпаклевка
    putty: { 
        wallpaper: { square: 350, linear: 245 }, // Под обои (погонный метр = 70% от квадратного)
        paint: { square: 500, linear: 350 } // Под покраску (погонный метр = 70% от квадратного)
    },
    // Покраска
    painting: { square: 200, linear: 140 }, // Покраска в 2 слоя (погонный метр = 70% от квадратного)
    // Дополнительные работы
    sanding: { square: 80, linear: 56 } // Зашкуривание (погонный метр = 70% от квадратного)
};

// Функция экранирования HTML для защиты от XSS
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

// Показ уведомлений
function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    notificationText.textContent = escapeHTML(message);
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Проверка поддержки Canvas
    const editorCanvas = document.getElementById('editorCanvas');
    const canvasFallback = document.getElementById('canvasFallback');
    
    if (!editorCanvas || !editorCanvas.getContext) {
        canvasFallback.style.display = 'block';
        editorCanvas.style.display = 'none';
        return;
    }
    
    const ctx = editorCanvas.getContext('2d');
    
    if (!ctx) {
        canvasFallback.style.display = 'block';
        editorCanvas.style.display = 'none';
        return;
    }
    
    // Инициализация модулей
    initCanvas(editorCanvas, ctx);
    initUI();
    initEventListeners();
    
    // Обновление интерфейса
    updateElementList();
    updateProjectSummary();
    calculateCost();
    centerView(editorCanvas);
    
    // Инициализация кнопок отправки
    initSharingButtons();
});