// elements.js – ПОЛНАЯ ВЕРСИЯ С УЛУЧШЕННОЙ ОБЛАСТЬЮ ЗАХВАТА

function drawRoom(room, ctx) {
    ctx.save();
    
    if (selectedRoom && selectedRoom.id === room.id) {
        ctx.strokeStyle = '#4a6ee0';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(74, 110, 224, 0.1)';
    } else {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    }
    
    ctx.fillRect(room.x, room.y, room.width, room.height);
    ctx.strokeRect(room.x, room.y, room.width, room.height);
    
    const area = (room.width / scale * room.height / scale).toFixed(1);
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${area} м²`, room.x + room.width / 2, room.y + room.height / 2);
    
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(escapeHTML(room.name), room.x + 5, room.y + 15);
    
    const widthMeters = (room.width / scale).toFixed(1);
    const heightMeters = (room.height / scale).toFixed(1);
    ctx.fillText(`${widthMeters} x ${heightMeters} м`, room.x + 5, room.y + 30);
    
    const indicatorSize = 8;
    const indicatorY = room.y + 45;
    let indicatorX = room.x + 5;
    
    const workColors = {
        plaster: '#3498db',
        armoring: '#e67e22',
        puttyWallpaper: '#2ecc71',
        puttyPaint: '#9b59b6',
        painting: '#e74c3c'
    };
    
    if (room.plaster) {
        ctx.fillStyle = workColors.plaster;
        ctx.fillRect(indicatorX, indicatorY, indicatorSize, indicatorSize);
        indicatorX += indicatorSize + 3;
    }
    if (room.armoring) {
        ctx.fillStyle = workColors.armoring;
        ctx.fillRect(indicatorX, indicatorY, indicatorSize, indicatorSize);
        indicatorX += indicatorSize + 3;
    }
    if (room.puttyWallpaper) {
        ctx.fillStyle = workColors.puttyWallpaper;
        ctx.fillRect(indicatorX, indicatorY, indicatorSize, indicatorSize);
        indicatorX += indicatorSize + 3;
    }
    if (room.puttyPaint) {
        ctx.fillStyle = workColors.puttyPaint;
        ctx.fillRect(indicatorX, indicatorY, indicatorSize, indicatorSize);
        indicatorX += indicatorSize + 3;
    }
    if (room.painting) {
        ctx.fillStyle = workColors.painting;
        ctx.fillRect(indicatorX, indicatorY, indicatorSize, indicatorSize);
    }
    
    // Отрисовка окон
    if (room.windows && Array.isArray(room.windows)) {
        room.windows.forEach(window => drawWindow(room, window, ctx));
    }
    
    // Отрисовка дверей
    if (room.doors && Array.isArray(room.doors)) {
        room.doors.forEach(door => drawDoor(room, door, ctx));
    }
    
    ctx.restore();
}

function drawWindow(room, window, ctx) {
    ctx.save();
    
    if (selectedElementObj && selectedElementObj.id === window.id) {
        ctx.strokeStyle = '#4a6ee0';
        ctx.lineWidth = 2;
    } else {
        ctx.strokeStyle = '#4a6ee0';
        ctx.lineWidth = 1;
    }
    
    if (window.slopes === 'with_net') {
        ctx.fillStyle = 'rgba(255, 193, 7, 0.6)';
    } else if (window.slopes === 'with') {
        ctx.fillStyle = 'rgba(74, 110, 224, 0.6)';
    } else {
        ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
    }
    
    const widthPx = window.width * scale;
    const leftPx = (window.leftOffset || 0) * scale;
    const wallLength = window.wall === 'top' || window.wall === 'bottom' ? room.width : room.height;
    
    let x, y, drawWidth, drawHeight;
    
    switch (window.wall) {
        case 'top':
            x = room.x + leftPx;
            y = room.y;
            drawWidth = widthPx;
            drawHeight = 10;
            break;
        case 'right':
            x = room.x + room.width - 10;
            y = room.y + leftPx;
            drawWidth = 10;
            drawHeight = widthPx;
            break;
        case 'bottom':
            x = room.x + wallLength - leftPx - widthPx;
            y = room.y + room.height - 10;
            drawWidth = widthPx;
            drawHeight = 10;
            break;
        case 'left':
            x = room.x;
            y = room.y + wallLength - leftPx - widthPx;
            drawWidth = 10;
            drawHeight = widthPx;
            break;
    }
    
    // Проверка границ
    if (window.wall === 'top' || window.wall === 'bottom') {
        if (x < room.x) x = room.x;
        if (x + drawWidth > room.x + room.width) x = room.x + room.width - drawWidth;
    } else {
        if (y < room.y) y = room.y;
        if (y + drawHeight > room.y + room.height) y = room.y + room.height - drawHeight;
    }
    
    ctx.fillRect(x, y, drawWidth, drawHeight);
    ctx.strokeRect(x, y, drawWidth, drawHeight);
    
    if (window.slopes === 'with_net') {
        ctx.fillStyle = '#ffc107';
    } else if (window.slopes === 'with') {
        ctx.fillStyle = '#4a6ee0';
    } else {
        ctx.fillStyle = '#888';
    }
    
    ctx.beginPath();
    if (window.wall === 'top') {
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + 8, y + 2);
        ctx.lineTo(x + 2, y + 8);
    } else if (window.wall === 'right') {
        ctx.moveTo(x + drawWidth - 2, y + 2);
        ctx.lineTo(x + drawWidth - 8, y + 2);
        ctx.lineTo(x + drawWidth - 2, y + 8);
    } else if (window.wall === 'bottom') {
        ctx.moveTo(x + 2, y + drawHeight - 2);
        ctx.lineTo(x + 8, y + drawHeight - 2);
        ctx.lineTo(x + 2, y + drawHeight - 8);
    } else if (window.wall === 'left') {
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + 8, y + 2);
        ctx.lineTo(x + 2, y + 8);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function drawDoor(room, door, ctx) {
    ctx.save();
    
    if (selectedElementObj && selectedElementObj.id === door.id) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
    } else {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1;
    }
    
    if (door.slopes === 'with_net') {
        ctx.fillStyle = 'rgba(255, 193, 7, 0.6)';
    } else if (door.slopes === 'with') {
        ctx.fillStyle = 'rgba(231, 76, 60, 0.6)';
    } else {
        ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
    }
    
    const widthPx = door.width * scale;
    const leftPx = (door.leftOffset || 0) * scale;
    const wallLength = door.wall === 'top' || door.wall === 'bottom' ? room.width : room.height;
    
    let x, y, drawWidth, drawHeight;
    
    switch (door.wall) {
        case 'top':
            x = room.x + leftPx;
            y = room.y;
            drawWidth = widthPx;
            drawHeight = 10;
            break;
        case 'right':
            x = room.x + room.width - 10;
            y = room.y + leftPx;
            drawWidth = 10;
            drawHeight = widthPx;
            break;
        case 'bottom':
            x = room.x + wallLength - leftPx - widthPx;
            y = room.y + room.height - 10;
            drawWidth = widthPx;
            drawHeight = 10;
            break;
        case 'left':
            x = room.x;
            y = room.y + wallLength - leftPx - widthPx;
            drawWidth = 10;
            drawHeight = widthPx;
            break;
    }
    
    if (door.wall === 'top' || door.wall === 'bottom') {
        if (x < room.x) x = room.x;
        if (x + drawWidth > room.x + room.width) x = room.x + room.width - drawWidth;
    } else {
        if (y < room.y) y = room.y;
        if (y + drawHeight > room.y + room.height) y = room.y + room.height - drawHeight;
    }
    
    ctx.fillRect(x, y, drawWidth, drawHeight);
    ctx.strokeRect(x, y, drawWidth, drawHeight);
    
    if (door.slopes === 'with_net') {
        ctx.fillStyle = '#ffc107';
    } else if (door.slopes === 'with') {
        ctx.fillStyle = '#e74c3c';
    } else {
        ctx.fillStyle = '#888';
    }
    
    ctx.beginPath();
    if (door.wall === 'top') {
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + 8, y + 2);
        ctx.lineTo(x + 2, y + 8);
    } else if (door.wall === 'right') {
        ctx.moveTo(x + drawWidth - 2, y + 2);
        ctx.lineTo(x + drawWidth - 8, y + 2);
        ctx.lineTo(x + drawWidth - 2, y + 8);
    } else if (door.wall === 'bottom') {
        ctx.moveTo(x + 2, y + drawHeight - 2);
        ctx.lineTo(x + 8, y + drawHeight - 2);
        ctx.lineTo(x + 2, y + drawHeight - 8);
    } else if (door.wall === 'left') {
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + 8, y + 2);
        ctx.lineTo(x + 2, y + 8);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

// ================== НОВАЯ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ПРЯМОУГОЛЬНИКА ЭЛЕМЕНТА ==================
function getElementRect(room, element) {
    const widthPx = element.width * scale;
    const leftPx = (element.leftOffset || 0) * scale;
    const wallLength = element.wall === 'top' || element.wall === 'bottom' ? room.width : room.height;
    
    let x, y, rectWidth, rectHeight;
    
    switch (element.wall) {
        case 'top':
            x = room.x + leftPx;
            y = room.y;
            rectWidth = widthPx;
            rectHeight = 10;
            break;
        case 'right':
            x = room.x + room.width - 10;
            y = room.y + leftPx;
            rectWidth = 10;
            rectHeight = widthPx;
            break;
        case 'bottom':
            x = room.x + wallLength - leftPx - widthPx;
            y = room.y + room.height - 10;
            rectWidth = widthPx;
            rectHeight = 10;
            break;
        case 'left':
            x = room.x;
            y = room.y + wallLength - leftPx - widthPx;
            rectWidth = 10;
            rectHeight = widthPx;
            break;
    }
    
    return { x, y, width: rectWidth, height: rectHeight };
}

// ================== УЛУЧШЕННАЯ ПРОВЕРКА ПОПАДАНИЯ (ПО РАСШИРЕННОМУ ПРЯМОУГОЛЬНИКУ) ==================
function isPointNearElement(room, element, x, y) {
    const rect = getElementRect(room, element);
    
    // Определяем, горизонтальный элемент или вертикальный
    const isHorizontal = element.wall === 'top' || element.wall === 'bottom';
    
    // Расширяем прямоугольник: увеличиваем толщину (высоту для горизонтальных, ширину для вертикальных) на 20 пикселей
    const extra = 20; // пикселей
    
    let hitX, hitY, hitWidth, hitHeight;
    
    if (isHorizontal) {
        // Для горизонтальных (верх/низ): расширяем по вертикали
        hitX = rect.x;
        hitWidth = rect.width;
        hitY = rect.y - extra/2; // расширяем вверх и вниз
        hitHeight = rect.height + extra;
    } else {
        // Для вертикальных (лево/право): расширяем по горизонтали
        hitX = rect.x - extra/2;
        hitWidth = rect.width + extra;
        hitY = rect.y;
        hitHeight = rect.height;
    }
    
    // Проверяем, находится ли точка (x, y) внутри расширенного прямоугольника
    return x >= hitX && x <= hitX + hitWidth && y >= hitY && y <= hitY + hitHeight;
}

function getElementScreenPosition(room, element) {
    const rect = getElementRect(room, element);
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function findElementAt(x, y) {
    for (let i = rooms.length - 1; i >= 0; i--) {
        const room = rooms[i];
        
        // Проверяем окна
        if (room.windows && Array.isArray(room.windows)) {
            for (let j = room.windows.length - 1; j >= 0; j--) {
                const window = room.windows[j];
                if (isPointNearElement(room, window, x, y)) {
                    return window;
                }
            }
        }
        
        // Проверяем двери
        if (room.doors && Array.isArray(room.doors)) {
            for (let j = room.doors.length - 1; j >= 0; j--) {
                const door = room.doors[j];
                if (isPointNearElement(room, door, x, y)) {
                    return door;
                }
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

function findRoomAt(x, y) {
    for (let i = rooms.length - 1; i >= 0; i--) {
        const room = rooms[i];
        if (x >= room.x && x <= room.x + room.width &&
            y >= room.y && y <= room.y + room.height) {
            return room;
        }
    }
    return null;
}

function findNearestWall(room, x, y) {
    const distToTop = Math.abs(y - room.y);
    const distToRight = Math.abs(x - (room.x + room.width));
    const distToBottom = Math.abs(y - (room.y + room.height));
    const distToLeft = Math.abs(x - room.x);
    
    const minDist = Math.min(distToTop, distToRight, distToBottom, distToLeft);
    
    let wall, leftOffset;
    
    if (minDist === distToTop) {
        wall = 'top';
        leftOffset = (x - room.x) / scale;
    } else if (minDist === distToRight) {
        wall = 'right';
        leftOffset = (y - room.y) / scale;
    } else if (minDist === distToBottom) {
        wall = 'bottom';
        leftOffset = (room.x + room.width - x) / scale;
    } else {
        wall = 'left';
        leftOffset = (room.y + room.height - y) / scale;
    }
    
    const wallLength = wall === 'top' || wall === 'bottom' ? 
        (room.width / scale) : (room.height / scale);
    leftOffset = Math.max(0, Math.min(wallLength, leftOffset));
    
    return { wall, leftOffset };
}

function selectRoom(room) {
    selectedRoom = room;
    selectedElementObj = room;
    updatePropertiesPanel(room);
    updateElementList();
    const selectedElement = safeGetElement('selectedElement');
    if (selectedElement) {
        selectedElement.textContent = `Комната: ${escapeHTML(room.name)}`;
    }
}

function selectElement(element) {
    selectedElementObj = element;
    updatePropertiesPanel(element);
    updateElementList();
    const selectedElement = safeGetElement('selectedElement');
    if (selectedElement) {
        if (element.type === 'window') {
            selectedElement.textContent = `Окно: ${element.width}x${element.height} м`;
        } else if (element.type === 'door') {
            selectedElement.textContent = `Дверь: ${element.width}x${element.height} м`;
        }
    }
}

function addElementToRoom(type, room, wall, rawLeftOffset) {
    const wallLength = wall === 'top' || wall === 'bottom' ? 
        (room.width / scale) : (room.height / scale);
    
    const elementWidth = type === 'window' ? 1.2 : 0.9;
    const maxLeftOffset = wallLength - elementWidth;
    
    const clampedLeftOffset = Math.max(0, Math.min(maxLeftOffset, rawLeftOffset - elementWidth / 2));
    const rightOffset = wallLength - clampedLeftOffset - elementWidth;
    
    const element = {
        id: generateId(),
        type: type,
        wall: wall,
        leftOffset: clampedLeftOffset,
        rightOffset: rightOffset,
        width: elementWidth,
        height: type === 'window' ? 1.5 : 2.1,
        slopes: 'with'
    };
    
    if (type === 'window') {
        if (!room.windows) room.windows = [];
        room.windows.push(element);
        selectElement(element);
        showNotification('Окно добавлено');
    } else if (type === 'door') {
        if (!room.doors) room.doors = [];
        room.doors.push(element);
        selectElement(element);
        showNotification('Дверь добавлена');
    }
    
    if (typeof pushToHistory === 'function') pushToHistory();
    
    updateElementList();
    updateProjectSummary();
    calculateCost();
    
    const canvas = safeGetElement('editorCanvas');
    if (canvas) {
        draw(canvas, canvas.getContext('2d'));
    }
}

function updateElementOffsets(element, newLeftOffset, newWidth, room) {
    if (!element || !room) return;
    
    const wallLength = element.wall === 'top' || element.wall === 'bottom' ? 
        (room.width / scale) : (room.height / scale);
    
    const width = newWidth !== undefined ? newWidth : element.width;
    const leftOffset = Math.max(0, Math.min(wallLength - width, newLeftOffset));
    const rightOffset = wallLength - leftOffset - width;
    
    element.leftOffset = leftOffset;
    element.rightOffset = rightOffset;
    
    if (newWidth !== undefined) {
        element.width = width;
    }
}