// state.js - Единое состояние приложения

window.PlanPomeshcheniy = window.PlanPomeshcheniy || {};

// Основное состояние приложения
window.PlanPomeshcheniy.State = {
    // Основные переменные
    rooms: [],
    selectedRoom: null,
    selectedElementObj: null,
    currentTool: 'select',
    
    // Параметры отображения
    scale: 50, // 1 метр = 50 пикселей
    zoom: 1,
    viewOffsetX: 0,
    viewOffsetY: 0,
    
    // Флаги состояния
    isDrawing: false,
    isDragging: false,
    isMovingElement: false,
    movingElement: null,
    isPanning: false,
    
    // Для жестов на мобильных
    isPinching: false,
    touchStartDistance: 0,
    initialTouch1: null,
    initialTouch2: null,
    
    // Счетчики
    roomCounter: 1,
    
    // Цены за работы (руб.)
    prices: {
        primer: { square: 50, linear: 35 },
        plaster: { square: 450, linear: 315 },
        corner: { linear: 150 },
        armoring: { square: 150, linear: 105 },
        putty: { 
            wallpaper: { square: 350, linear: 245 },
            paint: { square: 550, linear: 385 }
        },
        painting: { square: 300, linear: 210 },
        sanding: { square: 80, linear: 56 }
    },
    
    // DOM ссылки
    elements: {
        editorCanvas: null,
        canvasContext: null,
        cursorPosition: null,
        selectedElement: null,
        zoomLevel: null
    }
};

// Алиасы для обратной совместимости
window.rooms = window.PlanPomeshcheniy.State.rooms;
window.selectedRoom = window.PlanPomeshcheniy.State.selectedRoom;
window.selectedElementObj = window.PlanPomeshcheniy.State.selectedElementObj;
window.currentTool = window.PlanPomeshcheniy.State.currentTool;
window.scale = window.PlanPomeshcheniy.State.scale;
window.zoom = window.PlanPomeshcheniy.State.zoom;
window.viewOffsetX = window.PlanPomeshcheniy.State.viewOffsetX;
window.viewOffsetY = window.PlanPomeshcheniy.State.viewOffsetY;
window.isDrawing = window.PlanPomeshcheniy.State.isDrawing;
window.isDragging = window.PlanPomeshcheniy.State.isDragging;
window.isMovingElement = window.PlanPomeshcheniy.State.isMovingElement;
window.movingElement = window.PlanPomeshcheniy.State.movingElement;
window.isPanning = window.PlanPomeshcheniy.State.isPanning;
window.isPinching = window.PlanPomeshcheniy.State.isPinching;
window.touchStartDistance = window.PlanPomeshcheniy.State.touchStartDistance;
window.initialTouch1 = window.PlanPomeshcheniy.State.initialTouch1;
window.initialTouch2 = window.PlanPomeshcheniy.State.initialTouch2;
window.roomCounter = window.PlanPomeshcheniy.State.roomCounter;
window.prices = window.PlanPomeshcheniy.State.prices;