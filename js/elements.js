// elements.js – работа с элементами (комнаты, окна, двери)

function drawRoom(room, ctx) {
    ctx.save();

    if (window.selectedRoom && window.selectedRoom.id === room.id) {
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

    const area = (room.width / window.scale * room.height / window.scale).toFixed(1);
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${area} м²`, room.x + room.width / 2, room.y + room.height / 2);

    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(escapeHTML(room.name), room.x + 5, room.y + 15);

    const widthMeters = (room.width / window.scale).toFixed(1);
    const heightMeters = (room.height / window.scale).toFixed(1);
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

    if (room.windows && Array.isArray(room.windows)) {
        room.windows.forEach(window => drawOpening(room, window, ctx));
    }
    if (room.doors && Array.isArray(room.doors)) {
        room.doors.forEach(door => drawOpening(room, door, ctx));
    }

    ctx.restore();
}

// Универсальная функция отрисовки окон и дверей
function drawOpening(room, element, ctx) {
    ctx.save();

    const isWindow = element.type === 'window';
    const baseColor = isWindow ? '#4a6ee0' : '#e74c3c';

    if (window.selectedElementObj && window.selectedElementObj.id === element.id) {
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 2;
    } else {
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 1;
    }

    if (element.slopes === 'with_net') {
        ctx.fillStyle = 'rgba(255, 193, 7, 0.6)';
    } else if (element.slopes === 'with') {
        ctx.fillStyle = `rgba(${isWindow ? '74, 110, 224' : '231, 76, 60'}, 0.6)`;
    } else {
        ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
    }

    const widthPx = element.width * window.scale;
    const leftPx = (element.leftOffset || 0) * window.scale;
    const wallLength = element.wall === 'top' || element.wall === 'bottom' ? room.width : room.height;

    let x, y, drawWidth, drawHeight;

    switch (element.wall) {
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

    if (element.wall === 'top' || element.wall === 'bottom') {
        if (x < room.x) x = room.x;
        if (x + drawWidth > room.x + room.width) x = room.x + room.width - drawWidth;
    } else {
        if (y < room.y) y = room.y;
        if (y + drawHeight > room.y + room.height) y = room.y + room.height - drawHeight;
    }

    ctx.fillRect(x, y, drawWidth, drawHeight);
    ctx.strokeRect(x, y, drawWidth, drawHeight);

    if (element.slopes === 'with_net') {
        ctx.fillStyle = '#ffc107';
    } else if (element.slopes === 'with') {
        ctx.fillStyle = baseColor;
    } else {
        ctx.fillStyle = '#888';
    }

    ctx.beginPath();
    if (element.wall === 'top') {
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + 8, y + 2);
        ctx.lineTo(x + 2, y + 8);
    } else if (element.wall === 'right') {
        ctx.moveTo(x + drawWidth - 2, y + 2);
        ctx.lineTo(x + drawWidth - 8, y + 2);
        ctx.lineTo(x + drawWidth - 2, y + 8);
    } else if (element.wall === 'bottom') {
        ctx.moveTo(x + 2, y + drawHeight - 2);
        ctx.lineTo(x + 8, y + drawHeight - 2);
        ctx.lineTo(x + 2, y + drawHeight - 8);
    } else if (element.wall === 'left') {
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + 8, y + 2);
        ctx.lineTo(x + 2, y + 8);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function getElementRect(room, element) {
    const widthPx = element.width * window.scale;
    const leftPx = (element.leftOffset || 0) * window.scale;
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

function isPointNearElement(room, element, x, y) {
    const rect = getElementRect(room, element);
    const isHorizontal = element.wall === 'top' || element.wall === 'bottom';
    const extra = 20;

    let hitX, hitY, hitWidth, hitHeight;

    if (isHorizontal) {
        hitX = rect.x;
        hitWidth = rect.width;
        hitY = rect.y - extra / 2;
        hitHeight = rect.height + extra;
    } else {
        hitX = rect.x - extra / 2;
        hitWidth = rect.width + extra;
        hitY = rect.y;
        hitHeight = rect.height;
    }

    return x >= hitX && x <= hitX + hitWidth && y >= hitY && y <= hitY + hitHeight;
}

function getElementScreenPosition(room, element) {
    const rect = getElementRect(room, element);
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function findElementAt(x, y) {
    for (let i = window.rooms.length - 1; i >= 0; i--) {
        const room = window.rooms[i];

        if (room.windows && Array.isArray(room.windows)) {
            for (let j = room.windows.length - 1; j >= 0; j--) {
                const windowEl = room.windows[j];
                if (isPointNearElement(room, windowEl, x, y)) return windowEl;
            }
        }
        if (room.doors && Array.isArray(room.doors)) {
            for (let j = room.doors.length - 1; j >= 0; j--) {
                const door = room.doors[j];
                if (isPointNearElement(room, door, x, y)) return door;
            }
        }
        if (x >= room.x && x <= room.x + room.width &&
            y >= room.y && y <= room.y + room.height) {
            return room;
        }
    }
    return null;
}

function findRoomAt(x, y) {
    for (let i = window.rooms.length - 1; i >= 0; i--) {
        const room = window.rooms[i];
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
        leftOffset = (x - room.x) / window.scale;
    } else if (minDist === distToRight) {
        wall = 'right';
        leftOffset = (y - room.y) / window.scale;
    } else if (minDist === distToBottom) {
        wall = 'bottom';
        leftOffset = (room.x + room.width - x) / window.scale;
    } else {
        wall = 'left';
        leftOffset = (room.y + room.height - y) / window.scale;
    }

    const wallLength = wall === 'top' || wall === 'bottom' ?
        (room.width / window.scale) : (room.height / window.scale);
    leftOffset = Math.max(0, Math.min(wallLength, leftOffset));

    return { wall, leftOffset };
}

// ================== ВЫДЕЛЕНИЕ (только dispatch) ==================
function selectRoom(room) {
    window.selectedRoom = room;
    window.selectedElementObj = room;
    updatePropertiesPanel(room);
    dispatchStateChanged({ action: 'selectionChanged', type: 'room' });
}

function selectElement(element) {
    window.selectedElementObj = element;
    updatePropertiesPanel(element);
    dispatchStateChanged({ action: 'selectionChanged', type: element.type });
}

// ================== ДОБАВЛЕНИЕ ЭЛЕМЕНТА ==================
function addElementToRoom(type, room, wall, rawLeftOffset) {
    const wallLength = wall === 'top' || wall === 'bottom' ?
        (room.width / window.scale) : (room.height / window.scale);

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

    pushToHistory();
    dispatchStateChanged({ action: 'elementAdded', type: type });
}