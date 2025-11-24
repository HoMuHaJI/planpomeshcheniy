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
window.editorCanvas = null;

// Добавить проверку инициализации глобальных переменных
if (typeof window.rooms === 'undefined') window.rooms = [];
if (typeof window.selectedRoom === 'undefined') window.selectedRoom = null;
if (typeof window.selectedElementObj === 'undefined') window.selectedElementObj = null;
if (typeof window.currentTool === 'undefined') window.currentTool = 'select';
if (typeof window.isDrawing === 'undefined') window.isDrawing = false;
if (typeof window.isDragging === 'undefined') window.isDragging = false;
if (typeof window.isMovingElement === 'undefined') window.isMovingElement = false;
if (typeof window.movingElement === 'undefined') window.movingElement = null;

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

// Вспомогательные функции для безопасной работы с DOM
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id '${id}' not found`);
    }
    return element;
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

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
    const notification = safeGetElement('notification');
    const notificationText = safeGetElement('notificationText');
    
    if (!notification || !notificationText) return;
    
    notificationText.textContent = escapeHTML(message);
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Функция для получения canvas контекста с обработкой ошибок
function getCanvasContext(editorCanvas) {
    try {
        if (!editorCanvas || !editorCanvas.getContext) {
            return null;
        }
        return editorCanvas.getContext('2d');
    } catch (error) {
        console.error('Error getting canvas context:', error);
        return null;
    }
}

// Инициализация приложения
function initializeApp() {
    try {
        // Проверка поддержки Canvas
        const editorCanvas = safeGetElement('editorCanvas');
        const canvasFallback = safeGetElement('canvasFallback');
        
        if (!editorCanvas) {
            if (canvasFallback) {
                canvasFallback.style.display = 'block';
            }
            showNotification('Ошибка инициализации редактора');
            return;
        }
        
        const ctx = getCanvasContext(editorCanvas);
        
        if (!ctx) {
            if (canvasFallback) {
                canvasFallback.style.display = 'block';
            }
            editorCanvas.style.display = 'none';
            showNotification('Браузер не поддерживает Canvas');
            return;
        }
        
        // Сохраняем ссылку на canvas глобально
        window.editorCanvas = editorCanvas;
        
        // Инициализация модулей с проверкой их существования
        if (typeof initCanvas === 'function') {
            initCanvas(editorCanvas, ctx);
        } else {
            console.error('initCanvas function not found');
        }
        
        if (typeof initUI === 'function') {
            initUI();
        } else {
            console.error('initUI function not found');
        }
        
        if (typeof initEventListeners === 'function') {
            initEventListeners();
        } else {
            console.error('initEventListeners function not found');
        }
        
        // Обновление интерфейса
        if (typeof updateElementList === 'function') {
            updateElementList();
        }
        
        if (typeof updateProjectSummary === 'function') {
            updateProjectSummary();
        }
        
        if (typeof calculateCost === 'function') {
            calculateCost();
        }
        
        if (typeof centerView === 'function') {
            centerView(editorCanvas);
        }
        
        // Инициализация кнопок отправки
        if (typeof initSharingButtons === 'function') {
            initSharingButtons();
        }
        
        // Инициализация мобильного интерфейса с задержкой для гарантии загрузки DOM
        setTimeout(() => {
            if (window.innerWidth <= 576 && typeof initMobileUI === 'function') {
                console.log('Initializing mobile UI...');
                initMobileUI();
            }
        }, 100);
        
        console.log('App initialized successfully');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Ошибка загрузки приложения');
    }
}

// Обработчик изменения размера окна с throttle
const throttledResize = throttle(function() {
    const editorCanvas = window.editorCanvas;
    if (editorCanvas && typeof resizeCanvas === 'function') {
        resizeCanvas(editorCanvas);
    }
    
    // Переинициализация мобильного интерфейса при изменении размера
    setTimeout(() => {
        if (window.innerWidth <= 576 && typeof initMobileUI === 'function') {
            console.log('Reinitializing mobile UI on resize...');
            initMobileUI();
        } else {
            // Скрываем мобильные элементы на десктопе
            const mobileToolsContainer = document.querySelector('.mobile-tools-container');
            const fabContainer = safeGetElement('fabContainer');
            if (mobileToolsContainer) mobileToolsContainer.style.display = 'none';
            if (fabContainer) fabContainer.style.display = 'none';
        }
    }, 100);
}, 250);

// Глобальные функции для доступа из других модулей
window.getEditorState = function() {
    return {
        currentTool,
        rooms,
        selectedRoom,
        selectedElementObj,
        scale,
        zoom,
        viewOffsetX,
        viewOffsetY
    };
};

window.setEditorState = function(newState) {
    if (newState.currentTool !== undefined) currentTool = newState.currentTool;
    if (newState.rooms !== undefined) rooms = newState.rooms;
    if (newState.selectedRoom !== undefined) selectedRoom = newState.selectedRoom;
    if (newState.selectedElementObj !== undefined) selectedElementObj = newState.selectedElementObj;
    if (newState.scale !== undefined) scale = newState.scale;
    if (newState.zoom !== undefined) zoom = newState.zoom;
    if (newState.viewOffsetX !== undefined) viewOffsetX = newState.viewOffsetX;
    if (newState.viewOffsetY !== undefined) viewOffsetY = newState.viewOffsetY;
};

// Экспорт функций для использования в других модулях
window.safeGetElement = safeGetElement;
window.showNotification = showNotification;
window.escapeHTML = escapeHTML;
window.generateId = generateId;

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем обработчик изменения размера окна
    window.addEventListener('resize', throttledResize);
    
    // Запускаем инициализацию
    initializeApp();
});

// Обработчик ошибок для отлова непредвиденных ошибок
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('Произошла непредвиденная ошибка');
});

// Предотвращение выхода из страницы с несохраненными изменениями
window.addEventListener('beforeunload', function(e) {
    if (rooms.length > 0) {
        const confirmationMessage = 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?';
        e.returnValue = confirmationMessage;
        return confirmationMessage;
    }
});