// canvas.js – функции для работы с Canvas и обработчики мыши

function initCanvas(editorCanvas, ctx) {
    window.editorCanvas = editorCanvas;
    window.canvasContext = ctx;

    resizeCanvas(editorCanvas);
    draw(editorCanvas, ctx);

    editorCanvas.addEventListener('mousedown', handleMouseDown);
    editorCanvas.addEventListener('mousemove', handleMouseMove);
    editorCanvas.addEventListener('mouseup', handleMouseUp);
    editorCanvas.addEventListener('wheel', handleWheel);

    window.addEventListener('resize', () => resizeCanvas(editorCanvas));

    editorCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Инициализация поддержки touch (если функция определена)
    if (typeof initTouchSupport === 'function') initTouchSupport();
}

function resizeCanvas(editorCanvas) {
    const container = editorCanvas.parentElement;
    if (!container) return;

    const previousWidth = editorCanvas.width;
    const previousHeight = editorCanvas.height;

    editorCanvas.width = container.clientWidth;
    editorCanvas.height = container.clientHeight;

    if (previousWidth > 0 && previousHeight > 0) {
        const scaleX = editorCanvas.width / previousWidth;
        const scaleY = editorCanvas.height / previousHeight;
        window.viewOffsetX *= scaleX;
        window.viewOffsetY *= scaleY;
    }

    draw(editorCanvas, editorCanvas.getContext('2d'));
}

function drawGrid(editorCanvas, ctx) {
    const gridSize = window.scale;
    const gridColor = 'rgba(200, 200, 200, 0.2)';
    const minorGridColor = 'rgba(200, 200, 200, 0.1)';

    ctx.save();

    ctx.strokeStyle = minorGridColor;
    ctx.lineWidth = 0.5;
    const minorGridSize = 10;

    for (let x = 0; x <= editorCanvas.width; x += minorGridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, editorCanvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= editorCanvas.height; y += minorGridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(editorCanvas.width, y);
        ctx.stroke();
    }

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    for (let x = 0; x <= editorCanvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, editorCanvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= editorCanvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(editorCanvas.width, y);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';

    for (let x = gridSize * 2; x < editorCanvas.width; x += gridSize * 2) {
        ctx.fillText(`${x / window.scale}m`, x, 15);
    }
    for (let y = gridSize * 2; y < editorCanvas.height; y += gridSize * 2) {
        ctx.fillText(`${y / window.scale}m`, 15, y);
    }

    ctx.restore();
}

function draw(editorCanvas, ctx) {
    if (!editorCanvas || !ctx) return;

    ctx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);

    drawGrid(editorCanvas, ctx);

    ctx.save();
    ctx.translate(window.viewOffsetX, window.viewOffsetY);
    ctx.scale(window.zoom, window.zoom);

    if (window.rooms && window.rooms.length > 0) {
        window.rooms.forEach(room => {
            if (room && typeof drawRoom === 'function') drawRoom(room, ctx);
        });
    } else {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Используйте инструмент "Комната" для создания помещений', editorCanvas.width / 2, editorCanvas.height / 2);
        ctx.restore();
    }

    ctx.restore();
}

function centerView(editorCanvas) {
    if (!editorCanvas) return;

    if (!window.rooms || window.rooms.length === 0) {
        window.viewOffsetX = editorCanvas.width / 2;
        window.viewOffsetY = editorCanvas.height / 2;
        window.zoom = 1;

        const zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) zoomLevel.textContent = `${Math.round(window.zoom * 100)}%`;

        draw(editorCanvas, editorCanvas.getContext('2d'));
        return;
    }

    try {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let hasValidRooms = false;

        window.rooms.forEach(room => {
            if (room && typeof room.x === 'number' && typeof room.y === 'number' &&
                typeof room.width === 'number' && typeof room.height === 'number') {
                minX = Math.min(minX, room.x);
                minY = Math.min(minY, room.y);
                maxX = Math.max(maxX, room.x + room.width);
                maxY = Math.max(maxY, room.y + room.height);
                hasValidRooms = true;
            }
        });

        if (!hasValidRooms) return;

        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const width = maxX - minX;
        const height = maxY - minY;

        const scaleX = editorCanvas.width / width;
        const scaleY = editorCanvas.height / height;
        window.zoom = Math.min(scaleX, scaleY, 1);
        window.zoom = Math.max(0.1, Math.min(3, window.zoom));

        window.viewOffsetX = (editorCanvas.width - width * window.zoom) / 2 - minX * window.zoom;
        window.viewOffsetY = (editorCanvas.height - height * window.zoom) / 2 - minY * window.zoom;

        const zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) zoomLevel.textContent = `${Math.round(window.zoom * 100)}%`;

        draw(editorCanvas, editorCanvas.getContext('2d'));
    } catch (error) {
        console.error('Error in centerView:', error);
    }
}

function handleWheel(e) {
    e.preventDefault();

    const editorCanvas = window.editorCanvas;
    if (!editorCanvas) return;

    const rect = editorCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomIntensity = 0.001;
    const delta = -Math.sign(e.deltaY) * Math.min(1, Math.abs(e.deltaY));

    const worldX = (mouseX - window.viewOffsetX) / window.zoom;
    const worldY = (mouseY - window.viewOffsetY) / window.zoom;

    const zoomFactor = 1 + delta * zoomIntensity * 50;
    const newZoom = window.zoom * zoomFactor;

    window.zoom = Math.max(0.1, Math.min(3, newZoom));

    window.viewOffsetX = mouseX - worldX * window.zoom;
    window.viewOffsetY = mouseY - worldY * window.zoom;

    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) zoomLevel.textContent = `${Math.round(window.zoom * 100)}%`;

    draw(editorCanvas, editorCanvas.getContext('2d'));
}

function resetView() {
    const editorCanvas = window.editorCanvas;
    if (editorCanvas) centerView(editorCanvas);
}

function setZoom(newZoom, focusX = null, focusY = null) {
    const editorCanvas = window.editorCanvas;
    if (!editorCanvas) return;

    const oldZoom = window.zoom;
    window.zoom = Math.max(0.1, Math.min(3, newZoom));

    if (focusX !== null && focusY !== null) {
        const worldX = (focusX - window.viewOffsetX) / oldZoom;
        const worldY = (focusY - window.viewOffsetY) / oldZoom;
        window.viewOffsetX = focusX - worldX * window.zoom;
        window.viewOffsetY = focusY - worldY * window.zoom;
    }

    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) zoomLevel.textContent = `${Math.round(window.zoom * 100)}%`;

    draw(editorCanvas, editorCanvas.getContext('2d'));
}

function panTo(x, y, animate = false) {
    const editorCanvas = window.editorCanvas;
    if (!editorCanvas) return;

    if (animate) {
        const startX = window.viewOffsetX;
        const startY = window.viewOffsetY;
        const duration = 500;
        const startTime = performance.now();

        function animatePan(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            window.viewOffsetX = startX + (x - startX) * easeProgress;
            window.viewOffsetY = startY + (y - startY) * easeProgress;

            draw(editorCanvas, editorCanvas.getContext('2d'));

            if (progress < 1) requestAnimationFrame(animatePan);
        }

        requestAnimationFrame(animatePan);
    } else {
        window.viewOffsetX = x;
        window.viewOffsetY = y;
        draw(editorCanvas, editorCanvas.getContext('2d'));
    }
}

// ================== ОБРАБОТЧИКИ МЫШИ ==================

function handleMouseDown(e) {
    const editorCanvas = window.editorCanvas;
    if (!editorCanvas) return;
    const rect = editorCanvas.getBoundingClientRect();
    const safeZoom = window.zoom > 0 ? window.zoom : 1;
    const x = (e.clientX - rect.left - window.viewOffsetX) / safeZoom;
    const y = (e.clientY - rect.top - window.viewOffsetY) / safeZoom;

    if (window.currentTool === 'select') {
        const element = findElementAt(x, y);
        if (element) {
            if (element.type === 'room') {
                selectRoom(element);
                window.isDragging = true;
                window.dragStartX = e.clientX;
                window.dragStartY = e.clientY;
                window.dragOffsetX = x - element.x;
                window.dragOffsetY = y - element.y;
            } else if (element.type === 'window' || element.type === 'door') {
                for (let r of window.rooms) {
                    if (r.windows && r.windows.includes(element)) {
                        window.selectedRoom = r;
                        break;
                    }
                    if (r.doors && r.doors.includes(element)) {
                        window.selectedRoom = r;
                        break;
                    }
                }
                selectElement(element);
                window.isMovingElement = true;
                window.movingElement = element;
            }
        } else {
            window.isPanning = true;
            window.panStartX = e.clientX;
            window.panStartY = e.clientY;
            window.selectedRoom = null;
            window.selectedElementObj = null;
            hideAllProperties();
            editorCanvas.style.cursor = 'grabbing';
        }
    } else if (window.currentTool === 'room') {
        window.isDrawing = true;
        window.startX = x;
        window.startY = y;
    } else if (window.currentTool === 'window' || window.currentTool === 'door') {
        const room = findRoomAt(x, y);
        if (room) {
            selectRoom(room);
            const wallInfo = findNearestWall(room, x, y);
            if (wallInfo) {
                addElementToRoom(window.currentTool, room, wallInfo.wall, wallInfo.leftOffset);
            }
        } else {
            showNotification('Кликните внутри комнаты для добавления элемента');
        }
    }

    draw(editorCanvas, editorCanvas.getContext('2d'));
}

function handleMouseMove(e) {
    const editorCanvas = window.editorCanvas;
    if (!editorCanvas) return;
    const rect = editorCanvas.getBoundingClientRect();
    const safeZoom = window.zoom > 0 ? window.zoom : 1;
    const x = (e.clientX - rect.left - window.viewOffsetX) / safeZoom;
    const y = (e.clientY - rect.top - window.viewOffsetY) / safeZoom;

    const cursorPosition = safeGetElement('cursorPosition');
    if (cursorPosition) {
        cursorPosition.textContent = `X: ${(x / window.scale).toFixed(2)}, Y: ${(y / window.scale).toFixed(2)}`;
    }

    if (window.isPanning) {
        const dx = e.clientX - window.panStartX;
        const dy = e.clientY - window.panStartY;
        window.viewOffsetX += dx;
        window.viewOffsetY += dy;
        window.panStartX = e.clientX;
        window.panStartY = e.clientY;
        draw(editorCanvas, editorCanvas.getContext('2d'));
        return;
    }

    if (window.isDragging && window.selectedRoom) {
        const newX = x - window.dragOffsetX;
        const newY = y - window.dragOffsetY;
        window.selectedRoom.x = newX;
        window.selectedRoom.y = newY;
        draw(editorCanvas, editorCanvas.getContext('2d'));
    }

    if (window.isMovingElement && window.movingElement && window.selectedRoom) {
        const wallInfo = findNearestWall(window.selectedRoom, x, y);
        if (wallInfo && wallInfo.wall === window.movingElement.wall) {
            const wallLength = wallInfo.wall === 'top' || wallInfo.wall === 'bottom' ?
                (window.selectedRoom.width / window.scale) : (window.selectedRoom.height / window.scale);
            const maxLeftOffset = wallLength - window.movingElement.width;
            const clampedLeftOffset = Math.max(0, Math.min(maxLeftOffset, wallInfo.leftOffset));

            if (Math.abs(window.movingElement.leftOffset - clampedLeftOffset) > 0.001) {
                window.movingElement.leftOffset = clampedLeftOffset;
                window.movingElement.rightOffset = wallLength - clampedLeftOffset - window.movingElement.width;
                updatePropertiesPanel(window.movingElement);
                draw(editorCanvas, editorCanvas.getContext('2d'));
            }
        }
    }

    if (window.isDrawing && window.currentTool === 'room') {
        draw(editorCanvas, editorCanvas.getContext('2d'));
        const ctx = editorCanvas.getContext('2d');
        ctx.save();
        ctx.translate(window.viewOffsetX, window.viewOffsetY);
        ctx.scale(window.zoom, window.zoom);
        ctx.strokeStyle = '#4a6ee0';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(window.startX, window.startY, x - window.startX, y - window.startY);
        ctx.setLineDash([]);
        ctx.restore();
    }
}

function handleMouseUp(e) {
    const editorCanvas = window.editorCanvas;
    if (!editorCanvas) return;

    if (window.isPanning) {
        window.isPanning = false;
        editorCanvas.style.cursor = 'move';
    }

    if (window.isDragging) {
        window.isDragging = false;
        pushToHistory();
        dispatchStateChanged({ action: 'roomMoved' });
    }

    if (window.isMovingElement) {
        window.isMovingElement = false;
        pushToHistory();
        dispatchStateChanged({ action: 'elementMoved' });
        window.movingElement = null;
    }

    if (!window.isDrawing) return;

    const rect = editorCanvas.getBoundingClientRect();
    const safeZoom = window.zoom > 0 ? window.zoom : 1;
    const x = (e.clientX - rect.left - window.viewOffsetX) / safeZoom;
    const y = (e.clientY - rect.top - window.viewOffsetY) / safeZoom;

    if (window.currentTool === 'room') {
        const width = Math.abs(x - window.startX);
        const height = Math.abs(y - window.startY);

        if (width > 50 && height > 50) {
            const roomX = Math.min(window.startX, x);
            const roomY = Math.min(window.startY, y);

            pushToHistory();

            const room = {
                id: generateId(),
                type: 'room',
                x: roomX,
                y: roomY,
                width: width,
                height: height,
                name: `Комната ${window.roomCounter}`,
                plaster: true,
                armoring: false,
                puttyWallpaper: false,
                puttyPaint: false,
                painting: false,
                windows: [],
                doors: []
            };
            window.rooms.push(room);
            window.roomCounter++;
            selectRoom(room);
            showNotification('Комната добавлена');

            dispatchStateChanged({ action: 'roomCreated' });
            centerView(editorCanvas);
        } else {
            showNotification('Слишком маленькая комната. Минимальный размер: 1x1 метр');
        }
    }

    window.isDrawing = false;
    draw(editorCanvas, editorCanvas.getContext('2d'));
}

window.canvasFunctions = {
    resetView,
    setZoom,
    panTo,
    centerView: () => centerView(window.editorCanvas)
};