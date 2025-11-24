// Функции для работы с Canvas

// Глобальные переменные для управления жестами
let touchStartDistance = 0;
let initialTouch1 = null;
let initialTouch2 = null;
let isPinching = false;

// Инициализация canvas
function initCanvas(editorCanvas, ctx) {
    // Сохраняем ссылку на canvas глобально
    window.editorCanvas = editorCanvas;
    window.canvasContext = ctx;
    
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
    editorCanvas.addEventListener('touchcancel', handleTouchEnd);
    
    // Обработчик изменения размера окна
    window.addEventListener('resize', () => resizeCanvas(editorCanvas));
    
    // Предотвращение контекстного меню на canvas
    editorCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Функция для безопасного получения расстояния между двумя точками
function getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// Обработчики сенсорных событий
function handleTouchStart(e) {
    try {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            // Одиночное касание - эмуляция мыши
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                bubbles: true
            });
            e.target.dispatchEvent(mouseEvent);
        } else if (e.touches.length === 2) {
            // Мультитач - начало жеста масштабирования
            isPinching = true;
            initialTouch1 = {
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            };
            initialTouch2 = {
                clientX: e.touches[1].clientX,
                clientY: e.touches[1].clientY
            };
            touchStartDistance = getTouchDistance(initialTouch1, initialTouch2);
        }
    } catch (error) {
        console.error('Ошибка в handleTouchStart:', error);
    }
}

function handleTouchMove(e) {
    try {
        e.preventDefault();
        
        if (e.touches.length === 1 && !isPinching) {
            // Одиночное перемещение - эмуляция мыши
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                bubbles: true
            });
            e.target.dispatchEvent(mouseEvent);
        } else if (e.touches.length === 2 && isPinching) {
            // Мультитач - обработка жеста масштабирования
            const touch1 = {
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            };
            const touch2 = {
                clientX: e.touches[1].clientX,
                clientY: e.touches[1].clientY
            };
            
            const currentDistance = getTouchDistance(touch1, touch2);
            const scaleChange = currentDistance / touchStartDistance;
            
            // Вычисляем центр между двумя точками
            const centerX = (touch1.clientX + touch2.clientX) / 2;
            const centerY = (touch1.clientY + touch2.clientY) / 2;
            
            // Применяем масштабирование относительно центра
            handlePinchZoom(scaleChange, centerX, centerY);
            
            touchStartDistance = currentDistance;
        }
    } catch (error) {
        console.error('Ошибка в handleTouchMove:', error);
    }
}

function handleTouchEnd(e) {
    try {
        e.preventDefault();
        
        if (e.touches.length === 0) {
            // Все касания завершены
            isPinching = false;
            initialTouch1 = null;
            initialTouch2 = null;
            const mouseEvent = new MouseEvent('mouseup', {
                bubbles: true
            });
            e.target.dispatchEvent(mouseEvent);
        } else if (e.touches.length === 1) {
            // Осталось одно касание - переключаемся в режим одиночного касания
            isPinching = false;
        }
    } catch (error) {
        console.error('Ошибка в handleTouchEnd:', error);
    }
}

// Обработка жеста масштабирования (pinch-to-zoom)
function handlePinchZoom(scaleChange, centerX, centerY) {
    const editorCanvas = window.editorCanvas;
    if (!editorCanvas) return;
    
    const rect = editorCanvas.getBoundingClientRect();
    const mouseX = centerX - rect.left;
    const mouseY = centerY - rect.top;
    
    // Вычисляем мировые координаты мыши до масштабирования
    const worldX = (mouseX - viewOffsetX) / zoom;
    const worldY = (mouseY - viewOffsetY) / zoom;
    
    // Изменяем масштаб
    const newZoom = zoom * scaleChange;
    zoom = Math.max(0.1, Math.min(3, newZoom));
    
    // Вычисляем новые смещения для сохранения позиции под центром жеста
    viewOffsetX = mouseX - worldX * zoom;
    viewOffsetY = mouseY - worldY * zoom;
    
    // Обновляем интерфейс
    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
        zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    }
    
    draw(editorCanvas, editorCanvas.getContext('2d'));
}

// Изменение размера canvas
function resizeCanvas(editorCanvas) {
    const container = editorCanvas.parentElement;
    if (!container) return;
    
    // Сохраняем предыдущие размеры
    const previousWidth = editorCanvas.width;
    const previousHeight = editorCanvas.height;
    
    // Устанавливаем новые размеры
    editorCanvas.width = container.clientWidth;
    editorCanvas.height = container.clientHeight;
    
    // Корректируем смещение для сохранения видимой области
    if (previousWidth > 0 && previousHeight > 0) {
        const scaleX = editorCanvas.width / previousWidth;
        const scaleY = editorCanvas.height / previousHeight;
        viewOffsetX *= scaleX;
        viewOffsetY *= scaleY;
    }
    
    draw(editorCanvas, editorCanvas.getContext('2d'));
}

// Отрисовка сетки
function drawGrid(editorCanvas, ctx) {
    const gridSize = scale;
    const gridColor = 'rgba(200, 200, 200, 0.2)';
    const minorGridColor = 'rgba(200, 200, 200, 0.1)';
    
    ctx.save();
    
    // Мелкая сетка (каждые 10 пикселей)
    ctx.strokeStyle = minorGridColor;
    ctx.lineWidth = 0.5;
    const minorGridSize = 10;
    
    // Вертикальные линии мелкой сетки
    for (let x = 0; x <= editorCanvas.width; x += minorGridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, editorCanvas.height);
        ctx.stroke();
    }
    
    // Горизонтальные линии мелкой сетки
    for (let y = 0; y <= editorCanvas.height; y += minorGridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(editorCanvas.width, y);
        ctx.stroke();
    }
    
    // Основная сетка (1 метр = 50 пикселей)
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    
    // Вертикальные линии основной сетки
    for (let x = 0; x <= editorCanvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, editorCanvas.height);
        ctx.stroke();
    }
    
    // Горизонтальные линии основной сетки
    for (let y = 0; y <= editorCanvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(editorCanvas.width, y);
        ctx.stroke();
    }
    
    // Подписи к сетке (каждые 2 метра)
    ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    for (let x = gridSize * 2; x < editorCanvas.width; x += gridSize * 2) {
        ctx.fillText(`${x / scale}m`, x, 15);
    }
    
    for (let y = gridSize * 2; y < editorCanvas.height; y += gridSize * 2) {
        ctx.fillText(`${y / scale}m`, 15, y);
    }
    
    ctx.restore();
}

// Отрисовка сцены
function draw(editorCanvas, ctx) {
    if (!editorCanvas || !ctx) return;
    
    // Очищаем canvas
    ctx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
    
    // Рисуем фон
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);
    
    // Рисуем сетку
    drawGrid(editorCanvas, ctx);
    
    // Сохраняем контекст и применяем трансформации
    ctx.save();
    ctx.translate(viewOffsetX, viewOffsetY);
    ctx.scale(zoom, zoom);
    
    // Отрисовка комнат
    if (rooms && rooms.length > 0) {
        rooms.forEach(room => {
            if (room && typeof drawRoom === 'function') {
                drawRoom(room, ctx);
            }
        });
    } else {
        // Отображение подсказки, если комнат нет
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Сбрасываем трансформации
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Используйте инструмент "Комната" для создания помещений', editorCanvas.width / 2, editorCanvas.height / 2);
        ctx.restore();
    }
    
    // Восстанавливаем контекст
    ctx.restore();
    
    // Отладочная информация (только в режиме разработки)
    if (window.DEBUG_MODE) {
        drawDebugInfo(editorCanvas, ctx);
    }
}

// Отладочная информация
function drawDebugInfo(editorCanvas, ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    const debugInfo = [
        `Zoom: ${zoom.toFixed(2)}`,
        `Offset: (${viewOffsetX.toFixed(0)}, ${viewOffsetY.toFixed(0)})`,
        `Rooms: ${rooms ? rooms.length : 0}`,
        `Tool: ${currentTool}`,
        `Scale: 1m = ${scale}px`
    ];
    
    debugInfo.forEach((info, index) => {
        ctx.fillText(info, 10, 20 + index * 15);
    });
    
    ctx.restore();
}

// Центрирование вида на всех комнатах
function centerView(editorCanvas) {
    if (!editorCanvas) return;
    
    if (!rooms || rooms.length === 0) {
        // Если комнат нет, центрируем по умолчанию
        viewOffsetX = editorCanvas.width / 2;
        viewOffsetY = editorCanvas.height / 2;
        zoom = 1;
        
        const zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
        }
        
        draw(editorCanvas, editorCanvas.getContext('2d'));
        return;
    }
    
    try {
        // Находим границы всех комнат
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let hasValidRooms = false;
        
        rooms.forEach(room => {
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
        
        // Ограничиваем минимальный и максимальный масштаб
        zoom = Math.max(0.1, Math.min(3, zoom));
        
        // Центрируем
        viewOffsetX = (editorCanvas.width - width * zoom) / 2 - minX * zoom;
        viewOffsetY = (editorCanvas.height - height * zoom) / 2 - minY * zoom;
        
        // Обновляем интерфейс
        const zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
        }
        
        draw(editorCanvas, editorCanvas.getContext('2d'));
    } catch (error) {
        console.error('Error in centerView:', error);
    }
}

// Обработка колесика мыши для масштабирования
function handleWheel(e) {
    e.preventDefault();
    
    const editorCanvas = window.editorCanvas;
    if (!editorCanvas) return;
    
    const rect = editorCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomIntensity = 0.001;
    const delta = -Math.sign(e.deltaY) * Math.min(1, Math.abs(e.deltaY));
    
    // Вычисляем мировые координаты мыши до масштабирования
    const worldX = (mouseX - viewOffsetX) / zoom;
    const worldY = (mouseY - viewOffsetY) / zoom;
    
    // Изменяем масштаб с плавностью
    const zoomFactor = 1 + delta * zoomIntensity * 50;
    const newZoom = zoom * zoomFactor;
    
    // Ограничиваем масштаб
    zoom = Math.max(0.1, Math.min(3, newZoom));
    
    // Вычисляем новые смещения для сохранения позиции под курсором
    viewOffsetX = mouseX - worldX * zoom;
    viewOffsetY = mouseY - worldY * zoom;
    
    // Обновляем интерфейс
    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
        zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    }
    
    draw(editorCanvas, editorCanvas.getContext('2d'));
}

// Функция для сброса вида
function resetView() {
    const editorCanvas = window.editorCanvas;
    if (editorCanvas) {
        centerView(editorCanvas);
    }
}

// Функция для установки конкретного масштаба
function setZoom(newZoom, focusX = null, focusY = null) {
    const editorCanvas = window.editorCanvas;
    if (!editorCanvas) return;
    
    const oldZoom = zoom;
    zoom = Math.max(0.1, Math.min(3, newZoom));
    
    if (focusX !== null && focusY !== null) {
        // Масштабирование относительно конкретной точки
        const worldX = (focusX - viewOffsetX) / oldZoom;
        const worldY = (focusY - viewOffsetY) / oldZoom;
        viewOffsetX = focusX - worldX * zoom;
        viewOffsetY = focusY - worldY * zoom;
    }
    
    // Обновляем интерфейс
    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
        zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    }
    
    draw(editorCanvas, editorCanvas.getContext('2d'));
}

// Функция для панорамирования к определенной точке
function panTo(x, y, animate = false) {
    const editorCanvas = window.editorCanvas;
    if (!editorCanvas) return;
    
    if (animate) {
        // Анимированное перемещение (простая реализация)
        const startX = viewOffsetX;
        const startY = viewOffsetY;
        const duration = 500; // мс
        const startTime = performance.now();
        
        function animatePan(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Используем ease-out функцию для плавности
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            viewOffsetX = startX + (x - startX) * easeProgress;
            viewOffsetY = startY + (y - startY) * easeProgress;
            
            draw(editorCanvas, editorCanvas.getContext('2d'));
            
            if (progress < 1) {
                requestAnimationFrame(animatePan);
            }
        }
        
        requestAnimationFrame(animatePan);
    } else {
        // Мгновенное перемещение
        viewOffsetX = x;
        viewOffsetY = y;
        draw(editorCanvas, editorCanvas.getContext('2d'));
    }
}

// Экспорт функций для глобального использования
window.canvasFunctions = {
    resetView,
    setZoom,
    panTo,
    centerView: () => centerView(window.editorCanvas)
};