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
let isPanning = false;
let panStartX, panStartY;

// СТЕКИ ИСТОРИИ ДЛЯ UNDO/REDO
const MAX_HISTORY = 50;
let undoStack = [];
let redoStack = [];

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
if (typeof window.isPanning === 'undefined') window.isPanning = false;

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
        paint: { square: 550, linear: 385 } // Под покраску (погонный метр = 70% от квадратного)
    },
    // Покраска
    painting: { square: 300, linear: 210 }, // Покраска в 2 слоя (погонный метр = 70% от квадратного)
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

// ============================================
// ФУНКЦИИ ИСТОРИИ (UNDO/REDO)
// ============================================

// Сохранение состояния в историю (с проверкой на дубликаты)
function pushToHistory() {
    try {
        const currentState = JSON.parse(JSON.stringify(rooms));
        
        // Проверяем, отличается ли новое состояние от последнего в стеке
        if (undoStack.length > 0) {
            const lastState = undoStack[undoStack.length - 1];
            if (JSON.stringify(lastState) === JSON.stringify(currentState)) {
                console.log('✓ State unchanged, not pushing to history');
                return;
            }
        }
        
        undoStack.push(currentState);
        if (undoStack.length > MAX_HISTORY) {
            undoStack.shift();
        }
        redoStack = [];
        updateUndoRedoButtons();
        console.log('✓ History pushed. Undo stack:', undoStack.length, 'Redo stack:', redoStack.length);
    } catch (error) {
        console.error('Error pushing to history:', error);
    }
}

// Отмена действия (Undo)
function undo() {
    try {
        if (undoStack.length === 0) {
            showNotification('Нечего отменять');
            return;
        }
        const currentState = JSON.parse(JSON.stringify(rooms));
        redoStack.push(currentState);
        const prevState = undoStack.pop();
        rooms = prevState;
        selectedRoom = null;
        selectedElementObj = null;
        if (typeof hideAllProperties === 'function') {
            hideAllProperties();
        }
        if (typeof updateElementList === 'function') {
            updateElementList();
        }
        if (typeof updateProjectSummary === 'function') {
            updateProjectSummary();
        }
        if (typeof calculateCost === 'function') {
            calculateCost();
        }
        const canvas = safeGetElement('editorCanvas');
        if (canvas) {
            draw(canvas, canvas.getContext('2d'));
        }
        updateUndoRedoButtons();
        showNotification('Отмена действия');
        console.log('✓ Undo performed. Undo stack:', undoStack.length, 'Redo stack:', redoStack.length);
    } catch (error) {
        console.error('Error in undo:', error);
        showNotification('Ошибка при отмене действия');
    }
}

// Повтор действия (Redo)
function redo() {
    try {
        if (redoStack.length === 0) {
            showNotification('Нечего повторять');
            return;
        }
        const currentState = JSON.parse(JSON.stringify(rooms));
        undoStack.push(currentState);
        const nextState = redoStack.pop();
        rooms = nextState;
        selectedRoom = null;
        selectedElementObj = null;
        if (typeof hideAllProperties === 'function') {
            hideAllProperties();
        }
        if (typeof updateElementList === 'function') {
            updateElementList();
        }
        if (typeof updateProjectSummary === 'function') {
            updateProjectSummary();
        }
        if (typeof calculateCost === 'function') {
            calculateCost();
        }
        const canvas = safeGetElement('editorCanvas');
        if (canvas) {
            draw(canvas, canvas.getContext('2d'));
        }
        updateUndoRedoButtons();
        showNotification('Повтор действия');
        console.log('✓ Redo performed. Undo stack:', undoStack.length, 'Redo stack:', redoStack.length);
    } catch (error) {
        console.error('Error in redo:', error);
        showNotification('Ошибка при повторе действия');
    }
}

// Обновление состояния кнопок Undo/Redo
function updateUndoRedoButtons() {
    const undoBtn = safeGetElement('undoBtn');
    const redoBtn = safeGetElement('redoBtn');
    if (undoBtn) {
        undoBtn.disabled = undoStack.length === 0;
    }
    if (redoBtn) {
        redoBtn.disabled = redoStack.length === 0;
    }
}

// Очистка истории (при новом проекте)
function clearHistory() {
    undoStack = [];
    redoStack = [];
    updateUndoRedoButtons();
    console.log('✓ History cleared');
}

// ============================================
// ФУНКЦИИ СОХРАНЕНИЯ И ЗАГРУЗКИ ПРОЕКТА
// ============================================

// Сохранение проекта
function saveProject() {
    try {
        if (!rooms || rooms.length === 0) {
            showNotification('Нет данных для сохранения');
            return;
        }
        const projectData = {
            rooms: rooms,
            roomCounter: roomCounter,
            ceilingHeight: safeGetElement('ceilingHeight')?.value || 2.5,
            savedAt: new Date().toISOString(),
            version: '1.0'
        };
        const dataStr = JSON.stringify(projectData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `planpomeshcheniy_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showNotification('Проект успешно сохранен');
        console.log('✓ Project saved');
    } catch (error) {
        console.error('Error saving project:', error);
        showNotification('Ошибка при сохранении проекта');
    }
}

// Валидация загруженных данных
function validateProjectData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.rooms)) return false;
    // Можно добавить более глубокую проверку, но пока так
    return true;
}

// Загрузка проекта
function loadProject(file) {
    try {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const projectData = JSON.parse(e.target.result);
                if (!validateProjectData(projectData)) {
                    throw new Error('Неверный формат файла');
                }
                pushToHistory();
                rooms = projectData.rooms;
                roomCounter = projectData.roomCounter || 1;
                const ceilingHeightInput = safeGetElement('ceilingHeight');
                if (ceilingHeightInput && projectData.ceilingHeight) {
                    ceilingHeightInput.value = projectData.ceilingHeight;
                }
                selectedRoom = null;
                selectedElementObj = null;
                if (typeof hideAllProperties === 'function') {
                    hideAllProperties();
                }
                if (typeof updateElementList === 'function') {
                    updateElementList();
                }
                if (typeof updateProjectSummary === 'function') {
                    updateProjectSummary();
                }
                if (typeof calculateCost === 'function') {
                    calculateCost();
                }
                const canvas = safeGetElement('editorCanvas');
                if (canvas) {
                    centerView(canvas);
                }
                showNotification('Проект успешно загружен');
                console.log('✓ Project loaded');
            } catch (error) {
                console.error('Error parsing project file:', error);
                showNotification('Ошибка при чтении файла проекта');
            }
        };
        reader.onerror = function() {
            showNotification('Ошибка при чтении файла');
        };
        reader.readAsText(file);
    } catch (error) {
        console.error('Error loading project:', error);
        showNotification('Ошибка при загрузке проекта');
    }
}

// ================== ДЕМОНСТРАЦИОННЫЙ ПРОЕКТ ==================
// Встроенные данные демо-проекта (из предоставленного JSON)
const demoProjectData = {
  "rooms": [
    {
      "id": "mmosihuk30ah0x71mpy",
      "type": "room",
      "x": -266.33388702610637,
      "y": -206.25641658020774,
      "width": 200,
      "height": 225,
      "name": "Санузел",
      "plaster": false,
      "armoring": false,
      "puttyWallpaper": false,
      "puttyPaint": false,
      "painting": false,
      "windows": [],
      "doors": []
    },
    {
      "id": "mmosiwssduxtlom5rm",
      "type": "room",
      "x": -60.052774487686804,
      "y": -381.73349025139316,
      "width": 275,
      "height": 400,
      "name": "Спальня 1",
      "plaster": true,
      "armoring": true,
      "puttyWallpaper": false,
      "puttyPaint": true,
      "painting": true,
      "windows": [
        {
          "id": "mmosyb3cxrcvjgyxcp",
          "type": "window",
          "wall": "right",
          "leftOffset": 3.43,
          "rightOffset": 3.37,
          "width": 1.2,
          "height": 1.5,
          "slopes": "with_net"
        }
      ],
      "doors": []
    },
    {
      "id": "mmosjayr2xhqk2rjwnm",
      "type": "room",
      "x": -666.6122195477046,
      "y": -513.2921311236539,
      "width": 600,
      "height": 300,
      "name": "Зал",
      "plaster": true,
      "armoring": true,
      "puttyWallpaper": false,
      "puttyPaint": true,
      "painting": true,
      "windows": [
        {
          "id": "mmosxzq8acw2ufsjbmn",
          "type": "window",
          "wall": "left",
          "leftOffset": 2.48,
          "rightOffset": 2.3200000000000003,
          "width": 1.2,
          "height": 1.5,
          "slopes": "with_net"
        },
        {
          "id": "mmosy2oosaxm31vuwq",
          "type": "window",
          "wall": "top",
          "leftOffset": 2,
          "rightOffset": 7.1000000000000005,
          "width": 1.2,
          "height": 1.5,
          "slopes": "with_net"
        },
        {
          "id": "mmosy3s80bc1grr2jx1o",
          "type": "window",
          "wall": "top",
          "leftOffset": 6.38,
          "rightOffset": 2.7200000000000006,
          "width": 1.2,
          "height": 1.5,
          "slopes": "with_net"
        }
      ],
      "doors": [
        {
          "id": "mmoszf353x80kk1wtae",
          "type": "door",
          "wall": "right",
          "leftOffset": 3.9591802177879756,
          "rightOffset": 1.1408197822120245,
          "width": 0.9,
          "height": 2.1,
          "slopes": "none"
        },
        {
          "id": "mmoszg2hxlt3w7tu1vf",
          "type": "door",
          "wall": "right",
          "leftOffset": 0.5413619946822621,
          "rightOffset": 4.258638005317738,
          "width": 1.2,
          "height": 2.1,
          "slopes": "with_net"
        }
      ]
    },
    {
      "id": "mmosjzffdrkm3su5tz8",
      "type": "room",
      "x": -580.8060123497432,
      "y": -206.96859775116158,
      "width": 200,
      "height": 380,
      "name": "Спальня 2",
      "plaster": true,
      "armoring": true,
      "puttyWallpaper": false,
      "puttyPaint": true,
      "painting": true,
      "windows": [
        {
          "id": "mmosyfcxuyzknc0fof",
          "type": "window",
          "wall": "left",
          "leftOffset": 2.8,
          "rightOffset": 3.5999999999999996,
          "width": 1.2,
          "height": 1.5,
          "slopes": "with_net"
        }
      ],
      "doors": []
    },
    {
      "id": "mmoskcibyv0i3l488r",
      "type": "room",
      "x": -375.3273762861264,
      "y": 24.755427827625127,
      "width": 590,
      "height": 150,
      "name": "Коридор",
      "plaster": true,
      "armoring": true,
      "puttyWallpaper": false,
      "puttyPaint": true,
      "painting": true,
      "windows": [
        {
          "id": "mmosygtd1obr0fdrw48",
          "type": "window",
          "wall": "bottom",
          "leftOffset": 8.57,
          "rightOffset": 2.0300000000000002,
          "width": 1.2,
          "height": 1.5,
          "slopes": "with_net"
        },
        {
          "id": "mmosyhw830lud0nm6oy",
          "type": "window",
          "wall": "bottom",
          "leftOffset": 3.08,
          "rightOffset": 7.5200000000000005,
          "width": 1.2,
          "height": 1.5,
          "slopes": "with_net"
        }
      ],
      "doors": [
        {
          "id": "mmosypw0hlg17rqufl",
          "type": "door",
          "wall": "right",
          "leftOffset": 0.8867873957168104,
          "rightOffset": 1.2132126042831897,
          "width": 0.9,
          "height": 2.1,
          "slopes": "with"
        },
        {
          "id": "mmosz4kgjfoglnx71lq",
          "type": "door",
          "wall": "top",
          "leftOffset": 0,
          "rightOffset": 9.8,
          "width": 2,
          "height": 2.7,
          "slopes": "none"
        }
      ]
    },
    {
      "id": "mmoskrvfs5qixyfuo5b",
      "type": "room",
      "x": -59.751567682455686,
      "y": -638.0072034919835,
      "width": 275,
      "height": 250,
      "name": "Кухня",
      "plaster": true,
      "armoring": true,
      "puttyWallpaper": false,
      "puttyPaint": true,
      "painting": true,
      "windows": [
        {
          "id": "mmosy5ooyv0kjgc1gem",
          "type": "window",
          "wall": "top",
          "leftOffset": 2.2,
          "rightOffset": 2.0999999999999996,
          "width": 1.2,
          "height": 1.5,
          "slopes": "with_net"
        },
        {
          "id": "mmosy6zc0ei3ei8ksy9k",
          "type": "window",
          "wall": "right",
          "leftOffset": 2.1,
          "rightOffset": 1.7,
          "width": 1.2,
          "height": 1.5,
          "slopes": "with_net"
        }
      ],
      "doors": []
    },
    {
      "id": "mmosryvc62sfnhl4e84",
      "type": "room",
      "x": -374.86585758437576,
      "y": -206.56221034983304,
      "width": 100,
      "height": 225,
      "name": "Коридор",
      "plaster": true,
      "armoring": true,
      "puttyWallpaper": false,
      "puttyPaint": true,
      "painting": true,
      "windows": [],
      "doors": [
        {
          "id": "mmosz080b6brx5eiqgl",
          "type": "door",
          "wall": "left",
          "leftOffset": 2.35,
          "rightOffset": 1.25,
          "width": 0.9,
          "height": 2.1,
          "slopes": "none"
        },
        {
          "id": "mmosz1hsjxvohptcpk",
          "type": "door",
          "wall": "top",
          "leftOffset": 0.6042873503577152,
          "rightOffset": 0.4957126496422849,
          "width": 0.9,
          "height": 2.1,
          "slopes": "none"
        },
        {
          "id": "mmosz3n4n5lwu45cvd",
          "type": "door",
          "wall": "right",
          "leftOffset": 2.84,
          "rightOffset": 0.7600000000000001,
          "width": 0.9,
          "height": 2.1,
          "slopes": "none"
        }
      ]
    }
  ],
  "roomCounter": 8,
  "ceilingHeight": "2.7",
  "savedAt": "2026-03-13T11:24:07.033Z",
  "version": "1.0"
};

// Функция загрузки демо-проекта
function loadDemoProject() {
    // Сохраняем текущее состояние в историю перед загрузкой демо
    pushToHistory();
    
    rooms = demoProjectData.rooms;
    roomCounter = demoProjectData.roomCounter || 1;
    const ceilingHeightInput = safeGetElement('ceilingHeight');
    if (ceilingHeightInput && demoProjectData.ceilingHeight) {
        ceilingHeightInput.value = demoProjectData.ceilingHeight;
    }
    selectedRoom = null;
    selectedElementObj = null;
    
    if (typeof hideAllProperties === 'function') {
        hideAllProperties();
    }
    if (typeof updateElementList === 'function') {
        updateElementList();
    }
    if (typeof updateProjectSummary === 'function') {
        updateProjectSummary();
    }
    if (typeof calculateCost === 'function') {
        calculateCost();
    }
    const canvas = safeGetElement('editorCanvas');
    if (canvas) {
        centerView(canvas);
    }
    // Очищаем историю, чтобы демо-проект был начальным состоянием
    clearHistory();
    // Добавляем текущее состояние как первое в историю
    pushToHistory();
    
    showNotification('Демо-проект загружен');
    console.log('✓ Demo project loaded');
}

// ============================================
// КЛАВИАТУРНЫЕ КОМАНДЫ
// ============================================

// Инициализация обработчиков клавиатуры
function initKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement.tagName === 'INPUT' || 
                               activeElement.tagName === 'TEXTAREA' || 
                               activeElement.tagName === 'SELECT';
        
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undo();
            return;
        }
        
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            redo();
            return;
        }
        
        if (e.key === 'Delete' || e.key === 'Del') {
            if (isInputFocused) return;
            if (selectedElementObj) {
                if (selectedElementObj.type === 'room') {
                    if (typeof deleteRoom === 'function') {
                        deleteRoom(selectedElementObj);
                    }
                } else if (selectedElementObj.type === 'window' && selectedRoom) {
                    if (typeof deleteWindow === 'function') {
                        deleteWindow(selectedRoom, selectedElementObj);
                    }
                } else if (selectedElementObj.type === 'door' && selectedRoom) {
                    if (typeof deleteDoor === 'function') {
                        deleteDoor(selectedRoom, selectedElementObj);
                    }
                }
            }
            return;
        }
        
        if (e.key === 'Enter') {
            if (activeElement && activeElement.id && !isInputFocused) {
                const applyRoomChangesBtn = safeGetElement('applyRoomChanges');
                const applyWindowChangesBtn = safeGetElement('applyWindowChanges');
                const applyDoorChangesBtn = safeGetElement('applyDoorChanges');
                if (activeElement.id.startsWith('room') && applyRoomChangesBtn && !applyRoomChangesBtn.disabled) {
                    e.preventDefault();
                    applyRoomChangesBtn.click();
                } else if (activeElement.id.startsWith('window') && applyWindowChangesBtn && !applyWindowChangesBtn.disabled) {
                    e.preventDefault();
                    applyWindowChangesBtn.click();
                } else if (activeElement.id.startsWith('door') && applyDoorChangesBtn && !applyDoorChangesBtn.disabled) {
                    e.preventDefault();
                    applyDoorChangesBtn.click();
                } else if (activeElement.id === 'ceilingHeight') {
                    e.preventDefault();
                    if (typeof updateProjectSummary === 'function') {
                        updateProjectSummary();
                    }
                    if (typeof calculateCost === 'function') {
                        calculateCost();
                    }
                    showNotification('Параметры обновлены');
                }
            }
            return;
        }
        
        if (e.key === 'Escape') {
            if (!isInputFocused) {
                selectedRoom = null;
                selectedElementObj = null;
                if (typeof hideAllProperties === 'function') {
                    hideAllProperties();
                }
                if (typeof updateElementList === 'function') {
                    updateElementList();
                }
                const canvas = safeGetElement('editorCanvas');
                if (canvas) {
                    draw(canvas, canvas.getContext('2d'));
                }
                showNotification('Выделение снято');
            }
            return;
        }
    });
}

// Инициализация кнопок Undo/Redo
function initHistoryButtons() {
    const undoBtn = safeGetElement('undoBtn');
    const redoBtn = safeGetElement('redoBtn');
    if (undoBtn) {
        undoBtn.addEventListener('click', undo);
    }
    if (redoBtn) {
        redoBtn.addEventListener('click', redo);
    }
}

// Инициализация кнопок сохранения/загрузки
function initProjectButtons() {
    const saveProjectBtn = safeGetElement('saveProjectBtn');
    const loadProjectBtn = safeGetElement('loadProjectBtn');
    const loadProjectInput = safeGetElement('loadProjectInput');
    if (saveProjectBtn) {
        saveProjectBtn.addEventListener('click', saveProject);
    }
    if (loadProjectBtn) {
        loadProjectBtn.addEventListener('click', () => {
            if (loadProjectInput) {
                loadProjectInput.click();
            }
        });
    }
    if (loadProjectInput) {
        loadProjectInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                loadProject(e.target.files[0]);
                e.target.value = '';
            }
        });
    }
}

// Инициализация кнопки "Вверх"
function initScrollToTop() {
    const scrollToTopBtn = safeGetElement('scrollToTopBtn');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        });
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Инициализация приложения
function initializeApp() {
    try {
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
        window.editorCanvas = editorCanvas;
        
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
        if (typeof initHistoryButtons === 'function') {
            initHistoryButtons();
        }
        if (typeof initProjectButtons === 'function') {
            initProjectButtons();
        }
        if (typeof initScrollToTop === 'function') {
            initScrollToTop();
        }
        if (typeof initKeyboardHandlers === 'function') {
            initKeyboardHandlers();
        }
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
        if (typeof initSharingButtons === 'function') {
            initSharingButtons();
        }
        updateUndoRedoButtons();
        
        // Загружаем демо-проект после полной инициализации
        setTimeout(() => {
            loadDemoProject();
        }, 100); // небольшая задержка для гарантии, что все элементы DOM готовы
        
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
        viewOffsetY,
        isPanning
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
    if (newState.isPanning !== undefined) isPanning = newState.isPanning;
};

// Экспорт функций для использования в других модулях
window.safeGetElement = safeGetElement;
window.showNotification = showNotification;
window.escapeHTML = escapeHTML;
window.generateId = generateId;
window.pushToHistory = pushToHistory;
window.undo = undo;
window.redo = redo;
window.clearHistory = clearHistory;
window.updateUndoRedoButtons = updateUndoRedoButtons;
window.saveProject = saveProject;
window.loadProject = loadProject;

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    window.addEventListener('resize', throttledResize);
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