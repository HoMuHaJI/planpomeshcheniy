// Основной файл приложения - инициализация и управление состоянием

// Главный модуль приложения
const PlanPomesheniy = (function() {
    // Глобальные переменные состояния редактора
    const state = {
        currentTool: 'select',
        rooms: [],
        selectedRoom: null,
        selectedElementObj: null,
        isDrawing: false,
        startX: 0, startY: 0,
        scale: 50, // 1 метр = 50 пикселей
        roomCounter: 1,
        viewOffsetX: 0, viewOffsetY: 0,
        zoom: 1,
        isDragging: false,
        dragStartX: 0, dragStartY: 0,
        dragOffsetX: 0, dragOffsetY: 0,
        isMovingElement: false,
        movingElement: null,
        lastTouchX: 0, lastTouchY: 0,
        initialTouchX: 0, initialTouchY: 0
    };

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

    // Публичные методы
    return {
        getState: () => state,
        getPrices: () => prices,
        setTool: (tool) => { state.currentTool = tool; },
        addRoom: (room) => { state.rooms.push(room); },
        removeRoom: (roomId) => { 
            state.rooms = state.rooms.filter(r => r.id !== roomId); 
        },
        setSelectedRoom: (room) => { state.selectedRoom = room; },
        setSelectedElementObj: (element) => { state.selectedElementObj = element; },
        setDrawing: (drawing) => { state.isDrawing = drawing; },
        setStartCoords: (x, y) => { state.startX = x; state.startY = y; },
        setRoomCounter: (counter) => { state.roomCounter = counter; },
        setViewOffset: (x, y) => { state.viewOffsetX = x; state.viewOffsetY = y; },
        setZoom: (newZoom) => { state.zoom = newZoom; },
        setDragging: (dragging) => { state.isDragging = dragging; },
        setDragStart: (x, y) => { state.dragStartX = x; state.dragStartY = y; },
        setDragOffset: (x, y) => { state.dragOffsetX = x; state.dragOffsetY = y; },
        setMovingElement: (moving) => { state.isMovingElement = moving; },
        setMovingElementObj: (element) => { state.movingElement = element; },
        setLastTouch: (x, y) => { state.lastTouchX = x; state.lastTouchY = y; },
        setInitialTouch: (x, y) => { state.initialTouchX = x; state.initialTouchY = y; },
        incrementRoomCounter: () => { state.roomCounter++; },
        updateRoom: (roomId, updates) => {
            const room = state.rooms.find(r => r.id === roomId);
            if (room) {
                Object.assign(room, updates);
            }
        },
        clearRooms: () => { state.rooms = []; },
        resetRoomCounter: () => { state.roomCounter = 1; }
    };
})();

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
    if (notification && notificationText) {
        notificationText.textContent = escapeHTML(message);
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Безопасное получение DOM элемента
function getElementSafe(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Элемент с id "${id}" не найден`);
    }
    return element;
}

// Дебаунс для оптимизации производительности
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Проверка поддержки Canvas
    const editorCanvas = getElementSafe('editorCanvas');
    const canvasFallback = getElementSafe('canvasFallback');
    
    if (!editorCanvas || !editorCanvas.getContext) {
        if (canvasFallback) {
            canvasFallback.style.display = 'block';
        }
        if (editorCanvas) {
            editorCanvas.style.display = 'none';
        }
        return;
    }
    
    const ctx = editorCanvas.getContext('2d');
    
    if (!ctx) {
        if (canvasFallback) {
            canvasFallback.style.display = 'block';
        }
        if (editorCanvas) {
            editorCanvas.style.display = 'none';
        }
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
    
    // Инициализация мобильного интерфейса
    if (window.innerWidth <= 576) {
        initMobileUI();
    }
    
    // Обработчик изменения размера окна с дебаунсом
    window.addEventListener('resize', debounce(() => {
        if (window.innerWidth <= 576) {
            initMobileUI();
        } else {
            // Скрываем мобильные элементы на десктопе
            const mobileToolsContainer = document.querySelector('.mobile-tools-container');
            const fabContainer = getElementSafe('fabContainer');
            if (mobileToolsContainer) mobileToolsContainer.style.display = 'none';
            if (fabContainer) fabContainer.style.display = 'none';
        }
        resizeCanvas(editorCanvas);
    }, 250));
});