// app.js – инициализация, история, сохранение/загрузка

const MAX_HISTORY = 50;
let undoStack = [];
let redoStack = [];

window.editorCanvas = null;

// ============================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С CANVAS (контекст)
// ============================================
function getCanvasContext(editorCanvas) {
    try {
        if (!editorCanvas || !editorCanvas.getContext) return null;
        return editorCanvas.getContext('2d');
    } catch (error) {
        console.error('Error getting canvas context:', error);
        return null;
    }
}

// ============================================
// ИСТОРИЯ (UNDO/REDO)
// ============================================
function pushToHistory() {
    try {
        const ceilingHeightInput = safeGetElement('ceilingHeight');
        const ceilingHeight = ceilingHeightInput ? parseFloat(ceilingHeightInput.value) : 2.5;
        const currentState = {
            rooms: JSON.parse(JSON.stringify(window.rooms)),
            ceilingHeight: ceilingHeight,
            zoom: window.zoom,
            viewOffsetX: window.viewOffsetX,
            viewOffsetY: window.viewOffsetY,
            roomCounter: window.roomCounter
        };

        if (undoStack.length > 0) {
            const lastState = undoStack[undoStack.length - 1];
            if (JSON.stringify(lastState) === JSON.stringify(currentState)) {
                console.log('✓ State unchanged, not pushing to history');
                return;
            }
        }

        undoStack.push(currentState);
        if (undoStack.length > MAX_HISTORY) undoStack.shift();
        redoStack = [];
        updateUndoRedoButtons();
        console.log('✓ History pushed. Undo stack:', undoStack.length, 'Redo stack:', redoStack.length);
    } catch (error) {
        console.error('Error pushing to history:', error);
    }
}

function undo() {
    try {
        if (undoStack.length === 0) {
            showNotification('Нечего отменять');
            return;
        }
        const currentState = {
            rooms: JSON.parse(JSON.stringify(window.rooms)),
            ceilingHeight: parseFloat(safeGetElement('ceilingHeight')?.value || 2.5),
            zoom: window.zoom,
            viewOffsetX: window.viewOffsetX,
            viewOffsetY: window.viewOffsetY,
            roomCounter: window.roomCounter
        };
        redoStack.push(currentState);
        const prevState = undoStack.pop();

        window.rooms = prevState.rooms;
        if (safeGetElement('ceilingHeight')) {
            safeGetElement('ceilingHeight').value = prevState.ceilingHeight;
        }
        window.zoom = prevState.zoom;
        window.viewOffsetX = prevState.viewOffsetX;
        window.viewOffsetY = prevState.viewOffsetY;
        window.roomCounter = prevState.roomCounter;

        window.selectedRoom = null;
        window.selectedElementObj = null;

        dispatchStateChanged({ action: 'undo' });

        updateUndoRedoButtons();
        showNotification('Отмена действия');
        console.log('✓ Undo performed. Undo stack:', undoStack.length, 'Redo stack:', redoStack.length);
    } catch (error) {
        console.error('Error in undo:', error);
        showNotification('Ошибка при отмене действия');
    }
}

function redo() {
    try {
        if (redoStack.length === 0) {
            showNotification('Нечего повторять');
            return;
        }
        const currentState = {
            rooms: JSON.parse(JSON.stringify(window.rooms)),
            ceilingHeight: parseFloat(safeGetElement('ceilingHeight')?.value || 2.5),
            zoom: window.zoom,
            viewOffsetX: window.viewOffsetX,
            viewOffsetY: window.viewOffsetY,
            roomCounter: window.roomCounter
        };
        undoStack.push(currentState);
        const nextState = redoStack.pop();

        window.rooms = nextState.rooms;
        if (safeGetElement('ceilingHeight')) {
            safeGetElement('ceilingHeight').value = nextState.ceilingHeight;
        }
        window.zoom = nextState.zoom;
        window.viewOffsetX = nextState.viewOffsetX;
        window.viewOffsetY = nextState.viewOffsetY;
        window.roomCounter = nextState.roomCounter;

        window.selectedRoom = null;
        window.selectedElementObj = null;

        dispatchStateChanged({ action: 'redo' });

        updateUndoRedoButtons();
        showNotification('Повтор действия');
        console.log('✓ Redo performed. Undo stack:', undoStack.length, 'Redo stack:', redoStack.length);
    } catch (error) {
        console.error('Error in redo:', error);
        showNotification('Ошибка при повторе действия');
    }
}

function updateUndoRedoButtons() {
    const undoBtn = safeGetElement('undoBtn');
    const redoBtn = safeGetElement('redoBtn');
    if (undoBtn) undoBtn.disabled = undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

function clearHistory() {
    undoStack = [];
    redoStack = [];
    updateUndoRedoButtons();
    console.log('✓ History cleared');
}

// ============================================
// СОХРАНЕНИЕ / ЗАГРУЗКА
// ============================================
function saveProject() {
    try {
        if (!window.rooms || window.rooms.length === 0) {
            showNotification('Нет данных для сохранения');
            return;
        }
        const projectData = {
            rooms: window.rooms,
            roomCounter: window.roomCounter,
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

function validateProjectData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.rooms)) return false;
    return true;
}

function loadProject(file) {
    try {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const projectData = JSON.parse(e.target.result);
                if (!validateProjectData(projectData)) throw new Error('Неверный формат файла');
                pushToHistory();
                window.rooms = projectData.rooms;
                window.roomCounter = projectData.roomCounter || 1;
                const ceilingHeightInput = safeGetElement('ceilingHeight');
                if (ceilingHeightInput && projectData.ceilingHeight) {
                    ceilingHeightInput.value = projectData.ceilingHeight;
                }
                window.selectedRoom = null;
                window.selectedElementObj = null;

                dispatchStateChanged({ action: 'projectLoaded' });

                showNotification('Проект успешно загружен');
                console.log('✓ Project loaded');
            } catch (error) {
                console.error('Error parsing project file:', error);
                showNotification('Ошибка при чтении файла проекта');
            }
        };
        reader.onerror = () => showNotification('Ошибка при чтении файла');
        reader.readAsText(file);
    } catch (error) {
        console.error('Error loading project:', error);
        showNotification('Ошибка при загрузке проекта');
    }
}

// ============================================
// ДЕМО-ПРОЕКТ (встроенный)
// ============================================
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

function loadDemoProject() {
    pushToHistory();
    window.rooms = demoProjectData.rooms;
    window.roomCounter = demoProjectData.roomCounter || 1;
    const ceilingHeightInput = safeGetElement('ceilingHeight');
    if (ceilingHeightInput && demoProjectData.ceilingHeight) {
        ceilingHeightInput.value = demoProjectData.ceilingHeight;
    }
    window.selectedRoom = null;
    window.selectedElementObj = null;
    hideAllProperties();

    dispatchStateChanged({ action: 'demoLoaded' });

    requestAnimationFrame(() => {
        const canvas = safeGetElement('editorCanvas');
        if (canvas && typeof centerView === 'function') {
            centerView(canvas);
        }
    });

    clearHistory();
    pushToHistory();
    showNotification('Демо-проект загружен');
    console.log('✓ Demo project loaded');
}

// ============================================
// КЛАВИАТУРНЫЕ КОМАНДЫ (исправлено для любой раскладки)
// ============================================
function initKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement.tagName === 'INPUT' ||
                               activeElement.tagName === 'TEXTAREA' ||
                               activeElement.tagName === 'SELECT';

        // ===== ГЛОБАЛЬНЫЕ КОМБИНАЦИИ (всегда работают, даже в полях ввода, но с Ctrl) =====
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveProject();
            return;
        }
        // Используем e.code для Ctrl+Z / Ctrl+Y, чтобы они работали в любой раскладке
        if (e.ctrlKey && e.code === 'KeyZ') {
            e.preventDefault();
            undo();
            return;
        }
        if (e.ctrlKey && e.code === 'KeyY') {
            e.preventDefault();
            redo();
            return;
        }
        if (e.ctrlKey && e.code === 'KeyN') {
            e.preventDefault();
            const newProjectBtn = safeGetElement('newProject');
            if (newProjectBtn) newProjectBtn.click();
            return;
        }

        // Если фокус в поле ввода – дальше не обрабатываем одиночные клавиши
        if (isInputFocused) return;

        // ===== ОДИНОЧНЫЕ КЛАВИШИ (используем e.code для незавимости от раскладки) =====
        // Удаление выбранного элемента
        if (e.code === 'Delete') {
            if (window.selectedElementObj) {
                if (window.selectedElementObj.type === 'room') {
                    if (typeof deleteRoom === 'function') deleteRoom(window.selectedElementObj);
                } else if (window.selectedElementObj.type === 'window' && window.selectedRoom) {
                    if (typeof deleteWindow === 'function') deleteWindow(window.selectedRoom, window.selectedElementObj);
                } else if (window.selectedElementObj.type === 'door' && window.selectedRoom) {
                    if (typeof deleteDoor === 'function') deleteDoor(window.selectedRoom, window.selectedElementObj);
                }
            }
            return;
        }

        // Escape – снять выделение
        if (e.code === 'Escape') {
            window.selectedRoom = null;
            window.selectedElementObj = null;
            if (typeof hideAllProperties === 'function') hideAllProperties();
            updateElementList();
            const canvas = safeGetElement('editorCanvas');
            if (canvas && typeof draw === 'function') draw(canvas, canvas.getContext('2d'));
            showNotification('Выделение снято');
            return;
        }

        // Переключение инструментов (физические клавиши V, R, W, D)
        switch (e.code) {
            case 'KeyV':
                e.preventDefault();
                document.querySelector('.tool-btn[data-tool="select"]')?.click();
                break;
            case 'KeyR':
                e.preventDefault();
                document.querySelector('.tool-btn[data-tool="room"]')?.click();
                break;
            case 'KeyW':
                e.preventDefault();
                document.querySelector('.tool-btn[data-tool="window"]')?.click();
                break;
            case 'KeyD':
                e.preventDefault();
                document.querySelector('.tool-btn[data-tool="door"]')?.click();
                break;
        }

        // Enter – если активно поле ввода свойств, применить изменения
        if (e.key === 'Enter') {
            if (activeElement && activeElement.id) {
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
                    if (typeof updateProjectSummary === 'function') updateProjectSummary();
                    if (typeof calculateCost === 'function') calculateCost();
                    showNotification('Параметры обновлены');
                }
            }
        }
    });
}

function initHistoryButtons() {
    const undoBtn = safeGetElement('undoBtn');
    const redoBtn = safeGetElement('redoBtn');
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (redoBtn) redoBtn.addEventListener('click', redo);
}

function initProjectButtons() {
    const saveProjectBtn = safeGetElement('saveProjectBtn');
    const loadProjectBtn = safeGetElement('loadProjectBtn');
    const loadProjectInput = safeGetElement('loadProjectInput');
    if (saveProjectBtn) saveProjectBtn.addEventListener('click', saveProject);
    if (loadProjectBtn) loadProjectBtn.addEventListener('click', () => {
        if (loadProjectInput) loadProjectInput.click();
    });
    if (loadProjectInput) {
        loadProjectInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                loadProject(e.target.files[0]);
                e.target.value = '';
            }
        });
    }
}

function initScrollToTop() {
    const scrollToTopBtn = safeGetElement('scrollToTopBtn');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) scrollToTopBtn.classList.add('show');
            else scrollToTopBtn.classList.remove('show');
        });
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
function initializeApp() {
    try {
        const editorCanvas = safeGetElement('editorCanvas');
        const canvasFallback = safeGetElement('canvasFallback');
        if (!editorCanvas) {
            if (canvasFallback) canvasFallback.style.display = 'block';
            showNotification('Ошибка инициализации редактора');
            return;
        }
        const ctx = getCanvasContext(editorCanvas);
        if (!ctx) {
            if (canvasFallback) canvasFallback.style.display = 'block';
            editorCanvas.style.display = 'none';
            showNotification('Браузер не поддерживает Canvas');
            return;
        }
        window.editorCanvas = editorCanvas;

        if (typeof initCanvas === 'function') initCanvas(editorCanvas, ctx);
        else console.error('initCanvas function not found');

        if (typeof initUI === 'function') initUI();
        else console.error('initUI function not found');

        if (typeof initEventListeners === 'function') initEventListeners();
        else console.error('initEventListeners function not found');

        if (typeof initHistoryButtons === 'function') initHistoryButtons();
        if (typeof initProjectButtons === 'function') initProjectButtons();
        if (typeof initScrollToTop === 'function') initScrollToTop();
        if (typeof initKeyboardHandlers === 'function') initKeyboardHandlers();

        // Первоначальная отрисовка
        dispatchStateChanged({ action: 'appInitialized' });

        updateUndoRedoButtons();

        setTimeout(() => loadDemoProject(), 100);
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Ошибка загрузки приложения');
    }
}

const throttledResize = throttle(function() {
    const editorCanvas = window.editorCanvas;
    if (editorCanvas && typeof resizeCanvas === 'function') resizeCanvas(editorCanvas);
}, 250);

window.getEditorState = function() {
    return {
        currentTool: window.currentTool,
        rooms: window.rooms,
        selectedRoom: window.selectedRoom,
        selectedElementObj: window.selectedElementObj,
        scale: window.scale,
        zoom: window.zoom,
        viewOffsetX: window.viewOffsetX,
        viewOffsetY: window.viewOffsetY,
        isPanning: window.isPanning
    };
};

window.setEditorState = function(newState) {
    if (newState.currentTool !== undefined) window.currentTool = newState.currentTool;
    if (newState.rooms !== undefined) window.rooms = newState.rooms;
    if (newState.selectedRoom !== undefined) window.selectedRoom = newState.selectedRoom;
    if (newState.selectedElementObj !== undefined) window.selectedElementObj = newState.selectedElementObj;
    if (newState.scale !== undefined) window.scale = newState.scale;
    if (newState.zoom !== undefined) window.zoom = newState.zoom;
    if (newState.viewOffsetX !== undefined) window.viewOffsetX = newState.viewOffsetX;
    if (newState.viewOffsetY !== undefined) window.viewOffsetY = newState.viewOffsetY;
    if (newState.isPanning !== undefined) window.isPanning = newState.isPanning;
};

// Экспорт
window.pushToHistory = pushToHistory;
window.undo = undo;
window.redo = redo;
window.clearHistory = clearHistory;
window.updateUndoRedoButtons = updateUndoRedoButtons;
window.saveProject = saveProject;
window.loadProject = loadProject;

document.addEventListener('DOMContentLoaded', function() {
    window.addEventListener('resize', throttledResize);
    initializeApp();
});

window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('Произошла непредвиденная ошибка');
});

window.addEventListener('beforeunload', function(e) {
    if (window.rooms.length > 0) {
        const msg = 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?';
        e.returnValue = msg;
        return msg;
    }
});