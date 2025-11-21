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

// Обработчики сенсорных событий
function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        handleMouseDown(mouseEvent);
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        handleMouseMove(mouseEvent);
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    handleMouseUp(mouseEvent);
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
    const gridSize = scale; // Размер ячейки сетки (50 пикселей = 1 метр)
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
    zoom = Math.min(scaleX, scaleY, 1); // Ограничиваем максимальный масштаб
    
    // Центрируем
    viewOffsetX = (editorCanvas.width - width * zoom) / 2 - minX * zoom;
    viewOffsetY = (editorCanvas.height - height * zoom) / 2 - minY * zoom;
    
    zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    draw(editorCanvas, editorCanvas.getContext('2d'));
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
    zoom = Math.max(0.1, Math.min(3, zoom)); // Ограничиваем масштаб
    
    // Вычисляем новые смещения для сохранения позиции под курсором
    viewOffsetX = mouseX - worldX * zoom;
    viewOffsetY = mouseY - worldY * zoom;
    
    zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    draw(editorCanvas, editorCanvas.getContext('2d'));
}