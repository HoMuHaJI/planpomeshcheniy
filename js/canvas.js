// Функции для работы с Canvas

// Получение координат с учетом touch событий
function getCanvasCoordinates(e, editorCanvas) {
    let clientX, clientY;
    let rect;
    
    if (e._rect) {
        // Используем сохраненный rect из touch событий
        rect = e._rect;
    } else {
        // Получаем новый rect
        rect = editorCanvas.getBoundingClientRect();
    }
    
    if (e.touches && e.touches.length > 0) {
        // Touch события
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        // Mouse события
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    const state = PlanPomesheniy.getState();
    const safeZoom = state.zoom > 0 ? state.zoom : 1;
    
    const x = (clientX - rect.left - state.viewOffsetX) / safeZoom;
    const y = (clientY - rect.top - state.viewOffsetY) / safeZoom;
    
    return { x, y, clientX, clientY, rect };
}

// Инициализация canvas
function initCanvas(editorCanvas, ctx) {
    resizeCanvas(editorCanvas);
    draw(editorCanvas, ctx);
    
    // Обработчики событий мыши
    editorCanvas.addEventListener('mousedown', handleMouseDown);
    editorCanvas.addEventListener('mousemove', handleMouseMove);
    editorCanvas.addEventListener('mouseup', handleMouseUp);
    editorCanvas.addEventListener('wheel', handleWheel);
    
    // Обработчики сенсорных событий для мобильных
    editorCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    editorCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    editorCanvas.addEventListener('touchend', handleTouchEnd);
    
    // Обработчик изменения размера окна
    window.addEventListener('resize', debounce(() => resizeCanvas(editorCanvas), 250));
}

// Обработчики сенсорных событий
function handleTouchStart(e) {
    e.preventDefault();
    const editorCanvas = getElementSafe('editorCanvas');
    if (!editorCanvas) return;
    
    const touch = e.touches[0];
    const rect = editorCanvas.getBoundingClientRect();
    
    // Сохраняем rect для использования в других обработчиках
    e._rect = rect;
    
    PlanPomesheniy.setLastTouch(touch.clientX, touch.clientY);
    PlanPomesheniy.setInitialTouch(touch.clientX, touch.clientY);
    
    const { x, y } = getCanvasCoordinates(e, editorCanvas);
    
    // Создаем искусственное mouse событие с правильными координатами
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true
    });
    
    // Сохраняем rect в событии для использования в обработчике
    mouseEvent._rect = rect;
    editorCanvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const editorCanvas = getElementSafe('editorCanvas');
    if (!editorCanvas) return;
    
    const touch = e.touches[0];
    const rect = editorCanvas.getBoundingClientRect();
    e._rect = rect;
    
    PlanPomesheniy.setLastTouch(touch.clientX, touch.clientY);
    
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true
    });
    
    mouseEvent._rect = rect;
    editorCanvas.dispatchEvent(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    const editorCanvas = getElementSafe('editorCanvas');
    if (!editorCanvas) return;
    
    const state = PlanPomesheniy.getState();
    const mouseEvent = new MouseEvent('mouseup', {
        clientX: state.lastTouchX,
        clientY: state.lastTouchY,
        bubbles: true
    });
    
    // Используем последний сохраненный rect
    mouseEvent._rect = e._rect;
    editorCanvas.dispatchEvent(mouseEvent);
}

// Изменение размера canvas
function resizeCanvas(editorCanvas) {
    const container = editorCanvas.parentElement;
    if (container) {
        editorCanvas.width = container.clientWidth;
        editorCanvas.height = container.clientHeight;
        draw(editorCanvas, editorCanvas.getContext('2d'));
    }
}

// Отрисовка сетки
function drawGrid(editorCanvas, ctx) {
    const state = PlanPomesheniy.getState();
    const gridSize = state.scale;
    const gridColor = 'rgba(200, 200, 200, 0.2)';
    ctx.save();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // Вертикальные линии
    for (let x = 0; x <= editorCanvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, editorCanvas.height);
        ctx.stroke();
    }
    
    // Горизонтальные линии
    for (let y = 0; y <= editorCanvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(editorCanvas.width, y);
        ctx.stroke();
    }
    
    ctx.restore();
}

// Отрисовка сцены
function draw(editorCanvas, ctx) {
    if (!editorCanvas || !ctx) return;
    
    ctx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
    
    // Рисуем сетку
    drawGrid(editorCanvas, ctx);
    
    // Сохраняем контекст и применяем трансформации
    ctx.save();
    const state = PlanPomesheniy.getState();
    ctx.translate(state.viewOffsetX, state.viewOffsetY);
    ctx.scale(state.zoom, state.zoom);
    
    // Отрисовка комнат
    state.rooms.forEach(room => {
        drawRoom(room, ctx);
    });
    
    // Восстанавливаем контекст
    ctx.restore();
}

// Центрирование вида на всех комнатах
function centerView(editorCanvas) {
    if (!editorCanvas) return;
    
    const state = PlanPomesheniy.getState();
    if (state.rooms.length === 0) {
        PlanPomesheniy.setViewOffset(0, 0);
        PlanPomesheniy.setZoom(1);
        const zoomLevel = getElementSafe('zoomLevel');
        if (zoomLevel) zoomLevel.textContent = `${Math.round(state.zoom * 100)}%`;
        draw(editorCanvas, editorCanvas.getContext('2d'));
        return;
    }
    
    // Находим границы всех комнат
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    state.rooms.forEach(room => {
        minX = Math.min(minX, room.x);
        minY = Math.min(minY, room.y);
        maxX = Math.max(maxX, room.x + room.width);
        maxY = Math.max(maxY, room.y + room.height);
    });
    
    // Добавляем отступы
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Вычисляем масштаб для вмещения всех комнат
    const scaleX = editorCanvas.width / width;
    const scaleY = editorCanvas.height / height;
    const newZoom = Math.min(scaleX, scaleY, 1);
    PlanPomesheniy.setZoom(newZoom);
    
    // Центрируем
    const newOffsetX = (editorCanvas.width - width * newZoom) / 2 - minX * newZoom;
    const newOffsetY = (editorCanvas.height - height * newZoom) / 2 - minY * newZoom;
    PlanPomesheniy.setViewOffset(newOffsetX, newOffsetY);
    
    const zoomLevel = getElementSafe('zoomLevel');
    if (zoomLevel) zoomLevel.textContent = `${Math.round(newZoom * 100)}%`;
    draw(editorCanvas, editorCanvas.getContext('2d'));
}

// Обработка колесика мыши для масштабирования
function handleWheel(e) {
    e.preventDefault();
    const editorCanvas = getElementSafe('editorCanvas');
    if (!editorCanvas) return;
    
    const rect = editorCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomIntensity = 0.1;
    const wheel = e.deltaY < 0 ? 1 : -1;
    
    const state = PlanPomesheniy.getState();
    
    // Вычисляем мировые координаты мыши до масштабирования
    const worldX = (mouseX - state.viewOffsetX) / state.zoom;
    const worldY = (mouseY - state.viewOffsetY) / state.zoom;
    
    // Изменяем масштаб
    const newZoom = state.zoom * Math.exp(wheel * zoomIntensity);
    PlanPomesheniy.setZoom(Math.max(0.1, Math.min(3, newZoom)));
    
    // Вычисляем новые смещения для сохранения позиции под курсором
    PlanPomesheniy.setViewOffset(
        mouseX - worldX * state.zoom,
        mouseY - worldY * state.zoom
    );
    
    const zoomLevel = getElementSafe('zoomLevel');
    if (zoomLevel) zoomLevel.textContent = `${Math.round(state.zoom * 100)}%`;
    draw(editorCanvas, editorCanvas.getContext('2d'));
}

// Обработка нажатия мыши
function handleMouseDown(e) {
    const editorCanvas = getElementSafe('editorCanvas');
    if (!editorCanvas) return;
    
    const { x, y } = getCanvasCoordinates(e, editorCanvas);
    const state = PlanPomesheniy.getState();
    
    if (state.currentTool === 'select') {
        const element = findElementAt(x, y);
        if (element) {
            if (element.type === 'room') {
                selectRoom(element);
                PlanPomesheniy.setDragging(true);
                PlanPomesheniy.setDragStart(e.clientX, e.clientY);
                PlanPomesheniy.setDragOffset(x - element.x, y - element.y);
            } else if (element.type === 'window' || element.type === 'door') {
                selectElement(element);
                PlanPomesheniy.setMovingElement(true);
                PlanPomesheniy.setMovingElementObj(element);
            }
        } else {
            PlanPomesheniy.setSelectedRoom(null);
            PlanPomesheniy.setSelectedElementObj(null);
            hideAllProperties();
        }
    } else if (state.currentTool === 'room') {
        PlanPomesheniy.setDrawing(true);
        PlanPomesheniy.setStartCoords(x, y);
    } else if (state.currentTool === 'window' || state.currentTool === 'door') {
        const room = findRoomAt(x, y);
        if (room) {
            selectRoom(room);
            const wallInfo = findNearestWall(room, x, y);
            if (wallInfo) {
                addElementToRoom(state.currentTool, room, wallInfo.wall, wallInfo.position);
            }
        } else {
            showNotification('Кликните внутри комнаты для добавления элемента');
        }
    }
    
    draw(editorCanvas, editorCanvas.getContext('2d'));
}

// Обработка перемещения мыши
function handleMouseMove(e) {
    const editorCanvas = getElementSafe('editorCanvas');
    if (!editorCanvas) return;
    
    const { x, y } = getCanvasCoordinates(e, editorCanvas);
    const state = PlanPomesheniy.getState();
    
    // Обновление позиции курсора
    const cursorPosition = getElementSafe('cursorPosition');
    if (cursorPosition) {
        cursorPosition.textContent = `X: ${(x / state.scale).toFixed(2)}, Y: ${(y / state.scale).toFixed(2)}`;
    }
    
    // Перемещение комнаты
    if (state.isDragging && state.selectedRoom) {
        const newX = x - state.dragOffsetX;
        const newY = y - state.dragOffsetY;
        state.selectedRoom.x = newX;
        state.selectedRoom.y = newY;
        draw(editorCanvas, editorCanvas.getContext('2d'));
    }
    
    // Перемещение элемента по стене
    if (state.isMovingElement && state.movingElement && state.selectedRoom) {
        const wallInfo = findNearestWall(state.selectedRoom, x, y);
        if (wallInfo && wallInfo.wall === state.movingElement.wall) {
            const elementWidth = state.movingElement.width * state.scale;
            let roomDimension;
            if (state.movingElement.wall === 'top' || state.movingElement.wall === 'bottom') {
                roomDimension = state.selectedRoom.width;
            } else {
                roomDimension = state.selectedRoom.height;
            }
            const maxPosition = 100 - (elementWidth / roomDimension * 100);
            const clampedPosition = Math.max(0, Math.min(maxPosition, wallInfo.position));
            state.movingElement.position = clampedPosition;
            updatePropertiesPanel(state.movingElement);
            draw(editorCanvas, editorCanvas.getContext('2d'));
        }
    }
    
    // Отрисовка временной комнаты при рисовании
    if (state.isDrawing && state.currentTool === 'room') {
        draw(editorCanvas, editorCanvas.getContext('2d'));
        const ctx = editorCanvas.getContext('2d');
        ctx.save();
        ctx.translate(state.viewOffsetX, state.viewOffsetY);
        ctx.scale(state.zoom, state.zoom);
        ctx.strokeStyle = '#4a6ee0';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(state.startX, state.startY, x - state.startX, y - state.startY);
        ctx.setLineDash([]);
        ctx.restore();
    }
}

function handleMouseUp(e) {
    const editorCanvas = getElementSafe('editorCanvas');
    if (!editorCanvas) return;
    
    const { x, y } = getCanvasCoordinates(e, editorCanvas);
    const state = PlanPomesheniy.getState();
    
    if (state.isDragging) {
        PlanPomesheniy.setDragging(false);
    }
    
    if (state.isMovingElement) {
        PlanPomesheniy.setMovingElement(false);
        PlanPomesheniy.setMovingElementObj(null);
    }
    
    if (!state.isDrawing) return;
    
    if (state.currentTool === 'room') {
        const width = Math.abs(x - state.startX);
        const height = Math.abs(y - state.startY);
        
        // Минимальный размер комнаты - 1x1 метр (50x50 пикселей)
        if (width > 50 && height > 50) {
            const roomX = Math.min(state.startX, x);
            const roomY = Math.min(state.startY, y);
            
            // Ограничиваем максимальный размер комнаты
            const maxSize = 20 * state.scale;
            const finalWidth = Math.min(width, maxSize);
            const finalHeight = Math.min(height, maxSize);
            
            const room = {
                id: generateId(),
                type: 'room',
                x: roomX,
                y: roomY,
                width: finalWidth,
                height: finalHeight,
                name: `Комната ${state.roomCounter}`,
                plaster: true,
                armoring: false,
                puttyWallpaper: false,
                puttyPaint: false,
                painting: false,
                windows: [],
                doors: []
            };
            PlanPomesheniy.addRoom(room);
            PlanPomesheniy.incrementRoomCounter();
            selectRoom(room);
            showNotification('Комната добавлена');
            
            // Обновляем интерфейс
            updateElementList();
            updateProjectSummary();
            calculateCost();
            
            // Центрируем вид на новой комнате
            centerView(editorCanvas);
        } else {
            showNotification('Слишком маленькая комната. Минимальный размер: 1x1 метр');
        }
    }
    
    PlanPomesheniy.setDrawing(false);
    draw(editorCanvas, editorCanvas.getContext('2d'));
}