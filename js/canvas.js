// Функции для работы с Canvas

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
    window.addEventListener('resize', () => resizeCanvas(editorCanvas));
}

// Получение координат касания относительно canvas
function getTouchCoordinates(e, editorCanvas) {
    const rect = editorCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
        clientX: touch.clientX,
        clientY: touch.clientY,
        rect: rect
    };
}

// Обработчики сенсорных событий
function handleTouchStart(e) {
    e.preventDefault();
    const editorCanvas = document.getElementById('editorCanvas');
    const { clientX, clientY, rect } = getTouchCoordinates(e, editorCanvas);
    
    // Создаем искусственное mouse событие с правильными координатами
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: clientX,
        clientY: clientY,
        bubbles: true
    });
    
    // Сохраняем rect в событии для использования в обработчике
    mouseEvent._rect = rect;
    editorCanvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const editorCanvas = document.getElementById('editorCanvas');
    const { clientX, clientY, rect } = getTouchCoordinates(e, editorCanvas);
    
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: clientX,
        clientY: clientY,
        bubbles: true
    });
    
    mouseEvent._rect = rect;
    editorCanvas.dispatchEvent(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    const editorCanvas = document.getElementById('editorCanvas');
    const mouseEvent = new MouseEvent('mouseup', {
        bubbles: true
    });
    editorCanvas.dispatchEvent(mouseEvent);
}

// Изменение размера canvas
function resizeCanvas(editorCanvas) {
    const container = editorCanvas.parentElement;
    editorCanvas.width = container.clientWidth;
    editorCanvas.height = container.clientHeight;
    draw(editorCanvas, editorCanvas.getContext('2d'));
}

// Отрисовка сетки
function drawGrid(editorCanvas, ctx) {
    const gridSize = scale;
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
    ctx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
    
    // Рисуем сетку
    drawGrid(editorCanvas, ctx);
    
    // Сохраняем контекст и применяем трансформации
    ctx.save();
    ctx.translate(viewOffsetX, viewOffsetY);
    ctx.scale(zoom, zoom);
    
    // Отрисовка комнат
    rooms.forEach(room => {
        drawRoom(room, ctx);
    });
    
    // Восстанавливаем контекст
    ctx.restore();
}

// Центрирование вида на всех комнатах
function centerView(editorCanvas) {
    if (rooms.length === 0) {
        viewOffsetX = 0;
        viewOffsetY = 0;
        zoom = 1;
        zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
        draw(editorCanvas, editorCanvas.getContext('2d'));
        return;
    }
    
    // Находим границы всех комнат
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    rooms.forEach(room => {
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
    zoom = Math.min(scaleX, scaleY, 1);
    
    // Центрируем
    viewOffsetX = (editorCanvas.width - width * zoom) / 2 - minX * zoom;
    viewOffsetY = (editorCanvas.height - height * zoom) / 2 - minY * zoom;
    
    zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    draw(editorCanvas, editorCanvas.getContext('2d'));
}

// Получение координат мыши с учетом трансформаций
function getMouseCoordinates(e, editorCanvas) {
    // Используем сохраненный rect из touch событий или получаем новый
    const rect = e._rect || editorCanvas.getBoundingClientRect();
    const safeZoom = zoom > 0 ? zoom : 1;
    const x = (e.clientX - rect.left - viewOffsetX) / safeZoom;
    const y = (e.clientY - rect.top - viewOffsetY) / safeZoom;
    return { x, y, rect };
}

// Обработка колесика мыши для масштабирования
function handleWheel(e) {
    e.preventDefault();
    const editorCanvas = document.getElementById('editorCanvas');
    const rect = editorCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomIntensity = 0.1;
    const wheel = e.deltaY < 0 ? 1 : -1;
    
    // Вычисляем мировые координаты мыши до масштабирования
    const worldX = (mouseX - viewOffsetX) / zoom;
    const worldY = (mouseY - viewOffsetY) / zoom;
    
    // Изменяем масштаб
    zoom *= Math.exp(wheel * zoomIntensity);
    zoom = Math.max(0.1, Math.min(3, zoom));
    
    // Вычисляем новые смещения для сохранения позиции под курсором
    viewOffsetX = mouseX - worldX * zoom;
    viewOffsetY = mouseY - worldY * zoom;
    
    zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    draw(editorCanvas, editorCanvas.getContext('2d'));
}

// Обработка нажатия мыши
function handleMouseDown(e) {
    const editorCanvas = document.getElementById('editorCanvas');
    const { x, y, rect } = getMouseCoordinates(e, editorCanvas);
    
    // Сохраняем rect для использования в move/up событиях
    e._rect = rect;
    
    if (currentTool === 'select') {
        const element = findElementAt(x, y);
        if (element) {
            if (element.type === 'room') {
                selectRoom(element);
                isDragging = true;
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                dragOffsetX = x - element.x;
                dragOffsetY = y - element.y;
            } else if (element.type === 'window' || element.type === 'door') {
                selectElement(element);
                isMovingElement = true;
                movingElement = element;
            }
        } else {
            selectedRoom = null;
            selectedElementObj = null;
            hideAllProperties();
        }
    } else if (currentTool === 'room') {
        isDrawing = true;
        startX = x;
        startY = y;
    } else if (currentTool === 'window' || currentTool === 'door') {
        const room = findRoomAt(x, y);
        if (room) {
            selectRoom(room);
            const wallInfo = findNearestWall(room, x, y);
            if (wallInfo) {
                addElementToRoom(currentTool, room, wallInfo.wall, wallInfo.position);
            }
        } else {
            showNotification('Кликните внутри комнаты для добавления элемента');
        }
    }
    
    draw(editorCanvas, editorCanvas.getContext('2d'));
}

// Обработка перемещения мыши
function handleMouseMove(e) {
    const editorCanvas = document.getElementById('editorCanvas');
    const { x, y, rect } = getMouseCoordinates(e, editorCanvas);
    
    // Сохраняем rect для использования в up событиях
    e._rect = rect;
    
    // Обновление позиции курсора
    if (cursorPosition) {
        cursorPosition.textContent = `X: ${(x / scale).toFixed(2)}, Y: ${(y / scale).toFixed(2)}`;
    }
    
    // Перемещение комнаты
    if (isDragging && selectedRoom) {
        const newX = x - dragOffsetX;
        const newY = y - dragOffsetY;
        selectedRoom.x = newX;
        selectedRoom.y = newY;
        draw(editorCanvas, editorCanvas.getContext('2d'));
    }
    
    // Перемещение элемента по стене
    if (isMovingElement && movingElement && selectedRoom) {
        const wallInfo = findNearestWall(selectedRoom, x, y);
        if (wallInfo && wallInfo.wall === movingElement.wall) {
            const elementWidth = movingElement.width * scale;
            let roomDimension;
            if (movingElement.wall === 'top' || movingElement.wall === 'bottom') {
                roomDimension = selectedRoom.width;
            } else {
                roomDimension = selectedRoom.height;
            }
            const maxPosition = 100 - (elementWidth / roomDimension * 100);
            const clampedPosition = Math.max(0, Math.min(maxPosition, wallInfo.position));
            movingElement.position = clampedPosition;
            updatePropertiesPanel(movingElement);
            draw(editorCanvas, editorCanvas.getContext('2d'));
        }
    }
    
    // Отрисовка временной комнаты при рисовании
    if (isDrawing && currentTool === 'room') {
        draw(editorCanvas, editorCanvas.getContext('2d'));
        const ctx = editorCanvas.getContext('2d');
        ctx.save();
        ctx.translate(viewOffsetX, viewOffsetY);
        ctx.scale(zoom, zoom);
        ctx.strokeStyle = '#4a6ee0';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(startX, startY, x - startX, y - startY);
        ctx.setLineDash([]);
        ctx.restore();
    }
}

function handleMouseUp(e) {
    const editorCanvas = document.getElementById('editorCanvas');
    const { x, y } = getMouseCoordinates(e, editorCanvas);
    
    if (isDragging) {
        isDragging = false;
    }
    
    if (isMovingElement) {
        isMovingElement = false;
        movingElement = null;
    }
    
    if (!isDrawing) return;
    
    if (currentTool === 'room') {
        const width = Math.abs(x - startX);
        const height = Math.abs(y - startY);
        
        // Минимальный размер комнаты - 1x1 метр (50x50 пикселей)
        if (width > 50 && height > 50) {
            const roomX = Math.min(startX, x);
            const roomY = Math.min(startY, y);
            
            // Ограничиваем максимальный размер комнаты
            const maxSize = 20 * scale; // 20 метров
            const finalWidth = Math.min(width, maxSize);
            const finalHeight = Math.min(height, maxSize);
            
            const room = {
                id: generateId(),
                type: 'room',
                x: roomX,
                y: roomY,
                width: finalWidth,
                height: finalHeight,
                name: `Комната ${roomCounter}`,
                plaster: true,
                armoring: false,
                puttyWallpaper: false,
                puttyPaint: false,
                painting: false,
                windows: [],
                doors: []
            };
            rooms.push(room);
            roomCounter++;
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
    
    isDrawing = false;
    draw(editorCanvas, editorCanvas.getContext('2d'));
}