// js/touch.js — поддержка тач-экранов
let lastTap = 0;

function initTouchSupport() {
    const canvas = safeGetElement('editorCanvas');
    if (!canvas) return;
    
    // Убираем браузерный зум при таче
    canvas.style.touchAction = 'none';

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Двойное касание для центрирования
    canvas.addEventListener('touchstart', handleDoubleTap);
}

function getTouchPos(e) {
    const rect = e.target.getBoundingClientRect();
    const touch = e.touches[0];
    return {
        x: (touch.clientX - rect.left - window.viewOffsetX) / window.zoom,
        y: (touch.clientY - rect.top - window.viewOffsetY) / window.zoom
    };
}

function handleTouchStart(e) {
    e.preventDefault();
    const pos = getTouchPos(e);
    
    if (e.touches.length === 1) {
        // Один палец — имитируем мышь
        const fakeEvent = { 
            clientX: e.touches[0].clientX, 
            clientY: e.touches[0].clientY,
            preventDefault: () => {}
        };
        handleMouseDown(fakeEvent);
    } else if (e.touches.length === 2) {
        // Два пальца — pinch/pan
        window.isPinching = true;
        window.touchStartDistance = getTouchDistance(e);
        window.panStartX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        window.panStartY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 1 && !window.isPinching) {
        const fakeEvent = { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
        handleMouseMove(fakeEvent);
    } else if (e.touches.length === 2 && window.isPinching) {
        handlePinchZoom(e);
    }
}

function handleTouchEnd(e) {
    if (window.isPinching) {
        window.isPinching = false;
    } else {
        const fakeEvent = { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
        handleMouseUp(fakeEvent);
    }
}

function getTouchDistance(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function handlePinchZoom(e) {
    const currentDistance = getTouchDistance(e);
    const scaleFactor = currentDistance / window.touchStartDistance;
    const newZoom = window.zoom * scaleFactor;
    window.zoom = Math.max(0.1, Math.min(5, newZoom));

    // Центрируем зум между пальцами
    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

    window.viewOffsetX = centerX - (centerX - window.viewOffsetX) * scaleFactor;
    window.viewOffsetY = centerY - (centerY - window.viewOffsetY) * scaleFactor;

    window.touchStartDistance = currentDistance;

    const zoomLevel = safeGetElement('zoomLevel');
    if (zoomLevel) zoomLevel.textContent = `${Math.round(window.zoom * 100)}%`;

    draw(window.editorCanvas, window.editorCanvas.getContext('2d'));
}

function handleDoubleTap(e) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 300 && tapLength > 0) {
        e.preventDefault();
        centerView(window.editorCanvas);
    }
    
    lastTap = currentTime;
}

// Экспорт
window.initTouchSupport = initTouchSupport;