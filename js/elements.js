// Функции для работы с элементами (комнаты, окна, двери)

// Отрисовка комнаты
function drawRoom(room, ctx) {
    const state = PlanPomesheniy.getState();
    
    ctx.save();
    
    // Выделение выбранной комнаты
    if (state.selectedRoom && state.selectedRoom.id === room.id) {
        ctx.strokeStyle = '#4a6ee0';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(74, 110, 224, 0.1)';
    } else {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    }
    
    // Отрисовка комнаты
    ctx.fillRect(room.x, room.y, room.width, room.height);
    ctx.strokeRect(room.x, room.y, room.width, room.height);
    
    // Площадь комнаты в центре
    const area = (room.width / state.scale * room.height / state.scale).toFixed(1);
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${area} м²`, room.x + room.width / 2, room.y + room.height / 2);
    
    // Название комнаты
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(escapeHTML(room.name), room.x + 5, room.y + 15);
    
    // Размеры комнаты
    const widthMeters = (room.width / state.scale).toFixed(1);
    const heightMeters = (room.height / state.scale).toFixed(1);
    ctx.fillText(`${widthMeters} x ${heightMeters} м`, room.x + 5, room.y + 30);
    
    // Отрисовка окон
    room.windows.forEach(window => {
        drawWindow(room, window, ctx);
    });
    
    // Отрисовка дверей
    room.doors.forEach(door => {
        drawDoor(room, door, ctx);
    });
    
    ctx.restore();
}

// Отрисовка окна
function drawWindow(room, window, ctx) {
    const state = PlanPomesheniy.getState();
    const position = window.position / 100;
    const width = window.width * state.scale;
    const height = window.height * state.scale;
    
    ctx.save();
    
    // Выделение выбранного окна
    if (state.selectedElementObj && state.selectedElementObj.id === window.id) {
        ctx.strokeStyle = '#4a6ee0';
        ctx.lineWidth = 2;
    } else {
        ctx.strokeStyle = '#4a6ee0';
        ctx.lineWidth = 1;
    }
    
    // Разный цвет для разных типов откосов
    if (window.slopes === 'with_net') {
        ctx.fillStyle = 'rgba(255, 193, 7, 0.4)'; // Желтый для откосов с сеткой
    } else {
        ctx.fillStyle = 'rgba(74, 110, 224, 0.3)'; // Синий для обычных откосов
    }
    
    let x, y, drawWidth, drawHeight;
    
    switch (window.wall) {
        case 'top':
            x = room.x + room.width * position - width / 2;
            y = room.y;
            drawWidth = width;
            drawHeight = 10;
            break;
        case 'right':
            x = room.x + room.width - 10;
            y = room.y + room.height * position - width / 2;
            drawWidth = 10;
            drawHeight = width;
            break;
        case 'bottom':
            x = room.x + room.width * position - width / 2;
            y = room.y + room.height - 10;
            drawWidth = width;
            drawHeight = 10;
            break;
        case 'left':
            x = room.x;
            y = room.y + room.height * position - width / 2;
            drawWidth = 10;
            drawHeight = width;
            break;
    }
    
    // Проверяем, не выходит ли окно за границы комнаты
    if (window.wall === 'top' || window.wall === 'bottom') {
        if (x < room.x) x = room.x;
        if (x + drawWidth > room.x + room.width) x = room.x + room.width - drawWidth;
    } else {
        if (y < room.y) y = room.y;
        if (y + drawHeight > room.y + room.height) y = room.y + room.height - drawHeight;
    }
    
    ctx.fillRect(x, y, drawWidth, drawHeight);
    ctx.strokeRect(x, y, drawWidth, drawHeight);
    
    ctx.restore();
}

// Отрисовка двери
function drawDoor(room, door, ctx) {
    const state = PlanPomesheniy.getState();
    const position = door.position / 100;
    const width = door.width * state.scale;
    const height = door.height * state.scale;
    
    ctx.save();
    
    // Выделение выбранной двери
    if (state.selectedElementObj && state.selectedElementObj.id === door.id) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
    } else {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1;
    }
    
    // Разный цвет для разных типов откосов
    if (door.slopes === 'with_net') {
        ctx.fillStyle = 'rgba(255, 193, 7, 0.4)'; // Желтый для откосов с сеткой
    } else {
        ctx.fillStyle = 'rgba(231, 76, 60, 0.3)'; // Красный для обычных откосов
    }
    
    let x, y, drawWidth, drawHeight;
    
    switch (door.wall) {
        case 'top':
            x = room.x + room.width * position - width / 2;
            y = room.y;
            drawWidth = width;
            drawHeight = 10;
            break;
        case 'right':
            x = room.x + room.width - 10;
            y = room.y + room.height * position - width / 2;
            drawWidth = 10;
            drawHeight = width;
            break;
        case 'bottom':
            x = room.x + room.width * position - width / 2;
            y = room.y + room.height - 10;
            drawWidth = width;
            drawHeight = 10;
            break;
        case 'left':
            x = room.x;
            y = room.y + room.height * position - width / 2;
            drawWidth = 10;
            drawHeight = width;
            break;
    }
    
    // Проверяем, не выходит ли дверь за границы комнаты
    if (door.wall === 'top' || door.wall === 'bottom') {
        if (x < room.x) x = room.x;
        if (x + drawWidth > room.x + room.width) x = room.x + room.width - drawWidth;
    } else {
        if (y < room.y) y = room.y;
        if (y + drawHeight > room.y + room.height) y = room.y + room.height - drawHeight;
    }
    
    ctx.fillRect(x, y, drawWidth, drawHeight);
    ctx.strokeRect(x, y, drawWidth, drawHeight);
    
    ctx.restore();
}

// Поиск элемента по координатам
function findElementAt(x, y) {
    const state = PlanPomesheniy.getState();
    
    // Сначала проверяем окна и двери
    for (let i = state.rooms.length - 1; i >= 0; i--) {
        const room = state.rooms[i];
        
        // Проверяем окна
        for (let j = room.windows.length - 1; j >= 0; j--) {
            const window = room.windows[j];
            if (isPointNearElement(room, window, x, y)) {
                return window;
            }
        }
        
        // Проверяем двери
        for (let j = room.doors.length - 1; j >= 0; j--) {
            const door = room.doors[j];
            if (isPointNearElement(room, door, x, y)) {
                return door;
            }
        }
        
        // Проверяем комнату
        if (x >= room.x && x <= room.x + room.width &&
            y >= room.y && y <= room.y + room.height) {
            return room;
        }
    }
    
    return null;
}

// Проверка, находится ли точка рядом с элементом
function isPointNearElement(room, element, x, y) {
    const threshold = 10; // пикселей
    const pos = getElementScreenPosition(room, element);
    if (!pos) return false;
    
    const dx = x - pos.x;
    const dy = y - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < threshold;
}

// Получение экранных координат элемента
function getElementScreenPosition(room, element) {
    const state = PlanPomesheniy.getState();
    const wall = element.wall;
    const position = element.position / 100;
    const width = element.width * state.scale;
    const height = element.height * state.scale;
    
    let x, y;
    
    switch (wall) {
        case 'top':
            x = room.x + room.width * position;
            y = room.y;
            break;
        case 'right':
            x = room.x + room.width;
            y = room.y + room.height * position;
            break;
        case 'bottom':
            x = room.x + room.width * position;
            y = room.y + room.height;
            break;
        case 'left':
            x = room.x;
            y = room.y + room.height * position;
            break;
    }
    
    return { x, y };
}

// Поиск комнаты по координатам
function findRoomAt(x, y) {
    const state = PlanPomesheniy.getState();
    
    for (let i = state.rooms.length - 1; i >= 0; i--) {
        const room = state.rooms[i];
        if (x >= room.x && x <= room.x + room.width &&
            y >= room.y && y <= room.y + room.height) {
            return room;
        }
    }
    
    return null;
}

// Поиск ближайшей стены к точке
function findNearestWall(room, x, y) {
    // Вычисляем расстояния до каждой стены
    const distToTop = Math.abs(y - room.y);
    const distToRight = Math.abs(x - (room.x + room.width));
    const distToBottom = Math.abs(y - (room.y + room.height));
    const distToLeft = Math.abs(x - room.x);
    
    // Находим минимальное расстояние
    const minDist = Math.min(distToTop, distToRight, distToBottom, distToLeft);
    
    let wall, position;
    
    // Определяем, к какой стене ближе всего
    if (minDist === distToTop) {
        wall = 'top';
        position = ((x - room.x) / room.width) * 100;
    } else if (minDist === distToRight) {
        wall = 'right';
        position = ((y - room.y) / room.height) * 100;
    } else if (minDist === distToBottom) {
        wall = 'bottom';
        position = ((x - room.x) / room.width) * 100;
    } else {
        wall = 'left';
        position = ((y - room.y) / room.height) * 100;
    }
    
    // Ограничиваем позицию в пределах 0-100%
    position = Math.max(0, Math.min(100, position));
    
    return { wall, position };
}

// Выбор комнаты
function selectRoom(room) {
    PlanPomesheniy.setSelectedRoom(room);
    PlanPomesheniy.setSelectedElementObj(room);
    updatePropertiesPanel(room);
    updateElementList();
    const selectedElement = getElementSafe('selectedElement');
    if (selectedElement) {
        selectedElement.textContent = `Комната: ${escapeHTML(room.name)}`;
    }
}

// Выбор элемента
function selectElement(element) {
    PlanPomesheniy.setSelectedElementObj(element);
    updatePropertiesPanel(element);
    updateElementList();
    
    const selectedElement = getElementSafe('selectedElement');
    if (selectedElement) {
        if (element.type === 'window') {
            selectedElement.textContent = `Окно: ${element.width}x${element.height} м`;
        } else if (element.type === 'door') {
            selectedElement.textContent = `Дверь: ${element.width}x${element.height} м`;
        }
    }
}

// Добавление элемента в комнату
function addElementToRoom(type, room, wall, position) {
    const state = PlanPomesheniy.getState();
    
    // Ограничиваем позицию, чтобы элемент не выходил за границы стены
    const elementWidth = (type === 'window' ? 1.2 : 0.9) * state.scale;
    let roomDimension;
    
    if (wall === 'top' || wall === 'bottom') {
        roomDimension = room.width;
    } else {
        roomDimension = room.height;
    }
    
    const maxPosition = 100 - (elementWidth / roomDimension * 100);
    const clampedPosition = Math.max(0, Math.min(maxPosition, position));
    
    const element = {
        id: generateId(),
        type: type,
        wall: wall,
        position: clampedPosition,
        width: type === 'window' ? 1.2 : 0.9, // метры
        height: type === 'window' ? 1.5 : 2.1, // метры
        slopes: 'with'
    };
    
    if (type === 'window') {
        room.windows.push(element);
        selectElement(element);
        showNotification('Окно добавлено');
    } else if (type === 'door') {
        room.doors.push(element);
        selectElement(element);
        showNotification('Дверь добавлена');
    }
    
    updateElementList();
    updateProjectSummary();
    calculateCost();
    const editorCanvas = getElementSafe('editorCanvas');
    if (editorCanvas) {
        draw(editorCanvas, editorCanvas.getContext('2d'));
    }
}