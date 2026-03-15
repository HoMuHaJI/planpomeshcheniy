// ui.js – пользовательский интерфейс (панели свойств, кнопки, списки)

// Глобальные ссылки на элементы (инициализируются в initUI)
let roomProperties, doorProperties, windowProperties;
let applyRoomChangesBtn, applyWindowChangesBtn, applyDoorChangesBtn;
let plasterCheckbox, armoringCheckbox, puttyWallpaperCheckbox, puttyPaintCheckbox, paintingCheckbox;
let windowWidth, windowHeight, windowWall, windowLeftOffset, windowRightOffset, windowSlopes;
let doorWidth, doorHeight, doorWall, doorLeftOffset, doorRightOffset, doorSlopes;
let roomName, roomWidth, roomHeightProp;

// ================== ОБНОВЛЕНИЕ СПИСКА ЭЛЕМЕНТОВ ==================
function updateElementList() {
    const elementList = safeGetElement('elementList');
    if (!elementList) return;
    elementList.innerHTML = '';

    if (!window.rooms || window.rooms.length === 0) {
        elementList.innerHTML = '<div class="element-item">Нет элементов</div>';
        return;
    }

    window.rooms.forEach(room => {
        if (!room) return;

        const item = document.createElement('div');
        item.className = 'element-item';
        if (window.selectedRoom && window.selectedRoom.id === room.id) {
            item.classList.add('selected');
        }

        let worksHtml = '';
        if (room.plaster) worksHtml += '<span class="work-indicator" style="background-color: #3498db;" title="Стартовая штукатурка"></span>';
        if (room.armoring) worksHtml += '<span class="work-indicator" style="background-color: #e67e22;" title="Армирование сеткой"></span>';
        if (room.puttyWallpaper) worksHtml += '<span class="work-indicator" style="background-color: #2ecc71;" title="Шпаклевка под обои"></span>';
        if (room.puttyPaint) worksHtml += '<span class="work-indicator" style="background-color: #9b59b6;" title="Шпаклевка под покраску"></span>';
        if (room.painting) worksHtml += '<span class="work-indicator" style="background-color: #e74c3c;" title="Покраска"></span>';

        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>${escapeHTML(room.name || 'Комната')} (${(room.width / window.scale).toFixed(1)}x${(room.height / window.scale).toFixed(1)} м)</span>
                <div class="work-indicators">${worksHtml}</div>
            </div>
            <button class="delete-btn" data-id="${room.id}" data-type="room"><i class="fas fa-trash"></i></button>
        `;

        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn') || e.target.parentElement?.classList.contains('delete-btn')) return;
            selectRoom(room);
        });

        const deleteBtn = item.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteRoom(room);
            });
        }

        elementList.appendChild(item);

        // Окна
        if (room.windows && Array.isArray(room.windows)) {
            room.windows.forEach(windowEl => {
                if (!windowEl) return;

                let slopesColor = '#888';
                let slopesText = 'Без откосов';
                if (windowEl.slopes === 'with') {
                    slopesColor = '#4a6ee0';
                    slopesText = 'С откосами';
                } else if (windowEl.slopes === 'with_net') {
                    slopesColor = '#ffc107';
                    slopesText = 'С откосами и сеткой';
                }

                const windowItem = document.createElement('div');
                windowItem.className = 'element-item';
                if (window.selectedElementObj && window.selectedElementObj.id === windowEl.id) {
                    windowItem.classList.add('selected');
                }
                windowItem.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; margin-left: 20px;">
                        <span>Окно: ${windowEl.width}x${windowEl.height} м (L: ${(windowEl.leftOffset || 0).toFixed(2)}м, R: ${(windowEl.rightOffset || 0).toFixed(2)}м)</span>
                        <span class="slopes-indicator" style="background-color: ${slopesColor};" title="${slopesText}"></span>
                    </div>
                    <button class="delete-btn" data-id="${windowEl.id}" data-type="window"><i class="fas fa-trash"></i></button>
                `;
                windowItem.addEventListener('click', (e) => {
                    if (e.target.classList.contains('delete-btn') || e.target.parentElement?.classList.contains('delete-btn')) return;
                    selectElement(windowEl);
                });

                const deleteBtn = windowItem.querySelector('.delete-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        deleteWindow(room, windowEl);
                    });
                }

                elementList.appendChild(windowItem);
            });
        }

        // Двери
        if (room.doors && Array.isArray(room.doors)) {
            room.doors.forEach(door => {
                if (!door) return;

                let slopesColor = '#888';
                let slopesText = 'Без откосов';
                if (door.slopes === 'with') {
                    slopesColor = '#e74c3c';
                    slopesText = 'С откосами';
                } else if (door.slopes === 'with_net') {
                    slopesColor = '#ffc107';
                    slopesText = 'С откосами и сеткой';
                }

                const doorItem = document.createElement('div');
                doorItem.className = 'element-item';
                if (window.selectedElementObj && window.selectedElementObj.id === door.id) {
                    doorItem.classList.add('selected');
                }
                doorItem.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; margin-left: 20px;">
                        <span>Дверь: ${door.width}x${door.height} м (L: ${(door.leftOffset || 0).toFixed(2)}м, R: ${(door.rightOffset || 0).toFixed(2)}м)</span>
                        <span class="slopes-indicator" style="background-color: ${slopesColor};" title="${slopesText}"></span>
                    </div>
                    <button class="delete-btn" data-id="${door.id}" data-type="door"><i class="fas fa-trash"></i></button>
                `;
                doorItem.addEventListener('click', (e) => {
                    if (e.target.classList.contains('delete-btn') || e.target.parentElement?.classList.contains('delete-btn')) return;
                    selectElement(door);
                });

                const deleteBtn = doorItem.querySelector('.delete-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        deleteDoor(room, door);
                    });
                }

                elementList.appendChild(doorItem);
            });
        }
    });
}

// ================== ФУНКЦИИ УДАЛЕНИЯ (только dispatch) ==================
function deleteRoom(room) {
    if (!room) return;
    if (confirm(`Удалить комнату "${room.name}"?`)) {
        pushToHistory();
        window.rooms = window.rooms.filter(r => r && r.id !== room.id);
        if (window.selectedRoom && window.selectedRoom.id === room.id) {
            window.selectedRoom = null;
            window.selectedElementObj = null;
            hideAllProperties();
        }
        dispatchStateChanged({ action: 'elementDeleted', type: 'room' });
        showNotification('Комната удалена');
    }
}

function deleteWindow(room, windowEl) {
    if (!room || !windowEl) return;
    if (confirm('Удалить окно?')) {
        pushToHistory();
        room.windows = room.windows.filter(w => w && w.id !== windowEl.id);
        if (window.selectedElementObj && window.selectedElementObj.id === windowEl.id) {
            window.selectedElementObj = null;
            hideAllProperties();
        }
        dispatchStateChanged({ action: 'elementDeleted', type: 'window' });
        showNotification('Окно удалено');
    }
}

function deleteDoor(room, door) {
    if (!room || !door) return;
    if (confirm('Удалить дверь?')) {
        pushToHistory();
        room.doors = room.doors.filter(d => d && d.id !== door.id);
        if (window.selectedElementObj && window.selectedElementObj.id === door.id) {
            window.selectedElementObj = null;
            hideAllProperties();
        }
        dispatchStateChanged({ action: 'elementDeleted', type: 'door' });
        showNotification('Дверь удалена');
    }
}

// ================== СВОДКА ПРОЕКТА ==================
function updateProjectSummary() {
    let windowsCount = 0;
    let doorsCount = 0;
    let totalArea = 0;

    if (window.rooms && Array.isArray(window.rooms)) {
        window.rooms.forEach(room => {
            if (!room) return;

            if (room.windows && Array.isArray(room.windows)) {
                windowsCount += room.windows.length;
            }
            if (room.doors && Array.isArray(room.doors)) {
                doorsCount += room.doors.length;
            }

            const perimeter = ((room.width / window.scale) + (room.height / window.scale)) * 2;
            const ceilingHeightInput = safeGetElement('ceilingHeight');
            const ceilingHeight = ceilingHeightInput ? parseFloat(ceilingHeightInput.value) || 2.5 : 2.5;
            const wallsArea = perimeter * ceilingHeight;

            let windowsArea = 0;
            let doorsArea = 0;

            if (room.windows && Array.isArray(room.windows)) {
                room.windows.forEach(window => {
                    if (window && window.width && window.height) {
                        windowsArea += window.width * window.height;
                    }
                });
            }

            if (room.doors && Array.isArray(room.doors)) {
                room.doors.forEach(door => {
                    if (door && door.width && door.height) {
                        doorsArea += door.width * door.height;
                    }
                });
            }

            totalArea += Math.max(0, wallsArea - windowsArea - doorsArea);
        });
    }

    const roomsCountElem = safeGetElement('roomsCount');
    const windowsCountElem = safeGetElement('windowsCount');
    const doorsCountElem = safeGetElement('doorsCount');
    const totalAreaElem = safeGetElement('totalArea');

    if (roomsCountElem) roomsCountElem.textContent = window.rooms ? window.rooms.length : 0;
    if (windowsCountElem) windowsCountElem.textContent = windowsCount;
    if (doorsCountElem) doorsCountElem.textContent = doorsCount;
    if (totalAreaElem) totalAreaElem.textContent = `${totalArea.toFixed(1)} м²`;
}

// ================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ UI ==================
function updateCheckboxColor(checkboxId, color) {
    const checkbox = safeGetElement(checkboxId);
    if (checkbox) {
        checkbox.style.accentColor = color;
    }
}

function updateSlopesSelectColor(selectId, value) {
    const select = safeGetElement(selectId);
    if (!select) return;
    let color = '#888';
    if (selectId === 'windowSlopes') {
        color = value === 'with' ? '#4a6ee0' : value === 'with_net' ? '#ffc107' : '#888';
    } else if (selectId === 'doorSlopes') {
        color = value === 'with' ? '#e74c3c' : value === 'with_net' ? '#ffc107' : '#888';
    }
    select.style.borderColor = color;
    select.style.color = color;
}

function hideAllProperties() {
    if (roomProperties) roomProperties.style.display = 'none';
    if (doorProperties) doorProperties.style.display = 'none';
    if (windowProperties) windowProperties.style.display = 'none';
    const selectedElement = safeGetElement('selectedElement');
    if (selectedElement) selectedElement.textContent = 'Не выбран';
}

// ================== ОБРАБОТЧИКИ ПОЛЕЙ ВВОДА ==================
function windowInputHandler(e) {
    if (applyWindowChangesBtn) applyWindowChangesBtn.disabled = false;
    if (e.target.id === 'windowSlopes') {
        updateSlopesSelectColor('windowSlopes', e.target.value);
    }
    if (e.target.id === 'windowWidth' || e.target.id === 'windowLeftOffset') {
        if (!window.selectedRoom || !window.selectedElementObj) return;
        const wallLength = window.selectedElementObj.wall === 'top' || window.selectedElementObj.wall === 'bottom' ?
            (window.selectedRoom.width / window.scale) : (window.selectedRoom.height / window.scale);
        let currentLeft = parseFloat(windowLeftOffset?.value) || 0;
        let currentWidth = parseFloat(windowWidth?.value) || window.selectedElementObj.width;
        if (e.target.id === 'windowLeftOffset') {
            currentLeft = Math.max(0, Math.min(wallLength - currentWidth, currentLeft));
            windowLeftOffset.value = currentLeft.toFixed(2);
            const newRight = wallLength - currentLeft - currentWidth;
            if (windowRightOffset) windowRightOffset.value = Math.max(0, newRight).toFixed(2);
        } else if (e.target.id === 'windowWidth') {
            currentWidth = Math.max(0.5, Math.min(wallLength, currentWidth));
            windowWidth.value = currentWidth.toFixed(2);
            const newRight = wallLength - currentLeft - currentWidth;
            if (windowRightOffset) windowRightOffset.value = Math.max(0, newRight).toFixed(2);
        }
    }
}

function doorInputHandler(e) {
    if (applyDoorChangesBtn) applyDoorChangesBtn.disabled = false;
    if (e.target.id === 'doorSlopes') {
        updateSlopesSelectColor('doorSlopes', e.target.value);
    }
    if (e.target.id === 'doorWidth' || e.target.id === 'doorLeftOffset') {
        if (!window.selectedRoom || !window.selectedElementObj) return;
        const wallLength = window.selectedElementObj.wall === 'top' || window.selectedElementObj.wall === 'bottom' ?
            (window.selectedRoom.width / window.scale) : (window.selectedRoom.height / window.scale);
        let currentLeft = parseFloat(doorLeftOffset?.value) || 0;
        let currentWidth = parseFloat(doorWidth?.value) || window.selectedElementObj.width;
        if (e.target.id === 'doorLeftOffset') {
            currentLeft = Math.max(0, Math.min(wallLength - currentWidth, currentLeft));
            doorLeftOffset.value = currentLeft.toFixed(2);
            const newRight = wallLength - currentLeft - currentWidth;
            if (doorRightOffset) doorRightOffset.value = Math.max(0, newRight).toFixed(2);
        } else if (e.target.id === 'doorWidth') {
            currentWidth = Math.max(0.6, Math.min(wallLength, currentWidth));
            doorWidth.value = currentWidth.toFixed(2);
            const newRight = wallLength - currentLeft - currentWidth;
            if (doorRightOffset) doorRightOffset.value = Math.max(0, newRight).toFixed(2);
        }
    }
}

function roomInputHandler(e) {
    if (applyRoomChangesBtn) applyRoomChangesBtn.disabled = false;
}

function roomCheckboxHandler(e) {
    if (applyRoomChangesBtn) applyRoomChangesBtn.disabled = false;
    const color = this.checked ?
        (this.id === 'plaster' ? '#3498db' :
         this.id === 'armoring' ? '#e67e22' :
         this.id === 'puttyWallpaper' ? '#2ecc71' :
         this.id === 'puttyPaint' ? '#9b59b6' :
         '#e74c3c') : '#ccc';
    updateCheckboxColor(this.id, color);
    // Логика взаимного исключения
    if (this === puttyWallpaperCheckbox && this.checked) {
        if (puttyPaintCheckbox) { puttyPaintCheckbox.checked = false; updateCheckboxColor('puttyPaint', '#ccc'); }
        if (paintingCheckbox) { paintingCheckbox.checked = false; paintingCheckbox.disabled = true; updateCheckboxColor('painting', '#ccc'); }
    } else if (this === puttyPaintCheckbox && this.checked) {
        if (puttyWallpaperCheckbox) { puttyWallpaperCheckbox.checked = false; updateCheckboxColor('puttyWallpaper', '#ccc'); }
        if (paintingCheckbox) paintingCheckbox.disabled = false;
    } else if (this === puttyWallpaperCheckbox && !this.checked) {
        if (paintingCheckbox) paintingCheckbox.disabled = false;
    } else if (this === puttyPaintCheckbox && !this.checked) {
        if (paintingCheckbox) { paintingCheckbox.checked = false; paintingCheckbox.disabled = true; updateCheckboxColor('painting', '#ccc'); }
    }
    if (this === plasterCheckbox && !this.checked) {
        if (armoringCheckbox) { armoringCheckbox.checked = false; updateCheckboxColor('armoring', '#ccc'); }
        if (puttyWallpaperCheckbox) { puttyWallpaperCheckbox.checked = false; updateCheckboxColor('puttyWallpaper', '#ccc'); }
        if (puttyPaintCheckbox) { puttyPaintCheckbox.checked = false; updateCheckboxColor('puttyPaint', '#ccc'); }
        if (paintingCheckbox) { paintingCheckbox.checked = false; paintingCheckbox.disabled = true; updateCheckboxColor('painting', '#ccc'); }
    }
}

// ================== ОБНОВЛЕНИЕ ПАНЕЛИ СВОЙСТВ ==================
function updatePropertiesPanel(element) {
    if (!element) {
        hideAllProperties();
        return;
    }
    hideAllProperties();

    if (element.type === 'room') {
        roomProperties.style.display = 'block';
        roomName.value = element.name || '';
        roomWidth.value = (element.width / window.scale).toFixed(1);
        roomHeightProp.value = (element.height / window.scale).toFixed(1);

        plasterCheckbox.checked = !!element.plaster;
        updateCheckboxColor('plaster', element.plaster ? '#3498db' : '#ccc');
        armoringCheckbox.checked = !!element.armoring;
        updateCheckboxColor('armoring', element.armoring ? '#e67e22' : '#ccc');
        puttyWallpaperCheckbox.checked = !!element.puttyWallpaper;
        updateCheckboxColor('puttyWallpaper', element.puttyWallpaper ? '#2ecc71' : '#ccc');
        puttyPaintCheckbox.checked = !!element.puttyPaint;
        updateCheckboxColor('puttyPaint', element.puttyPaint ? '#9b59b6' : '#ccc');
        paintingCheckbox.checked = !!element.painting;
        paintingCheckbox.disabled = !!element.puttyWallpaper;
        updateCheckboxColor('painting', element.painting ? '#e74c3c' : '#ccc');

        applyRoomChangesBtn.disabled = false;
    } else if (element.type === 'window') {
        windowProperties.style.display = 'block';

        windowWidth.value = element.width || 1.2;
        windowHeight.value = element.height || 1.5;
        windowWall.value = element.wall || 'top';
        windowLeftOffset.value = (element.leftOffset || 0).toFixed(2);
        windowRightOffset.value = (element.rightOffset || 0).toFixed(2);
        windowSlopes.value = element.slopes || 'with';

        updateSlopesSelectColor('windowSlopes', element.slopes);

        if (!window.selectedRoom) return;
        const wallLength = element.wall === 'top' || element.wall === 'bottom' ?
            (window.selectedRoom.width / window.scale) : (window.selectedRoom.height / window.scale);

        let left = element.leftOffset || 0;
        if (left > wallLength - element.width) {
            left = Math.max(0, wallLength - element.width);
            element.leftOffset = left;
            element.rightOffset = wallLength - left - element.width;
            windowLeftOffset.value = left.toFixed(2);
            windowRightOffset.value = element.rightOffset.toFixed(2);
        }

        windowLeftOffset.max = (wallLength - element.width).toFixed(2);
        windowLeftOffset.min = 0;
        windowWidth.max = wallLength.toFixed(2);
        windowWidth.min = 0.5;
        applyWindowChangesBtn.disabled = false;
    } else if (element.type === 'door') {
        doorProperties.style.display = 'block';

        doorWidth.value = element.width || 0.9;
        doorHeight.value = element.height || 2.1;
        doorWall.value = element.wall || 'top';
        doorLeftOffset.value = (element.leftOffset || 0).toFixed(2);
        doorRightOffset.value = (element.rightOffset || 0).toFixed(2);
        doorSlopes.value = element.slopes || 'with';

        updateSlopesSelectColor('doorSlopes', element.slopes);

        if (!window.selectedRoom) return;
        const wallLength = element.wall === 'top' || element.wall === 'bottom' ?
            (window.selectedRoom.width / window.scale) : (window.selectedRoom.height / window.scale);

        let left = element.leftOffset || 0;
        if (left > wallLength - element.width) {
            left = Math.max(0, wallLength - element.width);
            element.leftOffset = left;
            element.rightOffset = wallLength - left - element.width;
            doorLeftOffset.value = left.toFixed(2);
            doorRightOffset.value = element.rightOffset.toFixed(2);
        }

        doorLeftOffset.max = (wallLength - element.width).toFixed(2);
        doorLeftOffset.min = 0;
        doorWidth.max = wallLength.toFixed(2);
        doorWidth.min = 0.6;
        applyDoorChangesBtn.disabled = false;
    }

    const selectedElement = safeGetElement('selectedElement');
    if (selectedElement) {
        selectedElement.textContent = `${element.type === 'room' ? 'Комната' : element.type === 'window' ? 'Окно' : 'Дверь'}: ${escapeHTML(element.name || '')}`;
    }
}

// ================== ФУНКЦИИ ДЛЯ ОТПРАВКИ СМЕТЫ ==================
function initSharingButtons() {
    console.log('✓ initSharingButtons called');

    const sendMaxBtn = safeGetElement('sendMax');
    const copyReceiptBtn = safeGetElement('copyReceipt');
    const printReceiptBtn = safeGetElement('printReceipt');
    const feedbackBtn = safeGetElement('feedbackBtn');
    const headerFeedbackBtn = safeGetElement('headerFeedbackBtn');

    if (sendMaxBtn) {
        sendMaxBtn.addEventListener('click', shareToMax);
        console.log('✓ sendMax button handler attached');
    }

    if (copyReceiptBtn) {
        copyReceiptBtn.addEventListener('click', copyReceiptToClipboard);
        console.log('✓ copyReceipt button handler attached');
    }

    if (printReceiptBtn) {
        printReceiptBtn.addEventListener('click', printReceipt);
        console.log('✓ printReceipt button handler attached');
    }

    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openFeedbackModal();
            console.log('✓ feedbackBtn handler attached');
        });
    }

    if (headerFeedbackBtn) {
        headerFeedbackBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openFeedbackModal();
            console.log('✓ headerFeedbackBtn handler attached');
        });
    }
}

function shareToMax() {
    console.log('✓ sendMax clicked');
    const text = getReceiptText();
    const maxUrl = 'https://max.ru/u/f9LHodD0cOI0eQdcNzuPqeBgkFcnHu8HCOxVa6GeAo44-4XFtTYE5GFpREc';

    copyToClipboard(text);
    const newWindow = window.open(maxUrl, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        alert('Ссылка не открылась автоматически. Перейдите по ссылке вручную:\n' + maxUrl);
    }
    showNotification('Смета скопирована!');
}

function copyReceiptToClipboard() {
    console.log('✓ copyReceipt clicked');
    const text = getReceiptText();
    copyToClipboard(text);
    showNotification('Смета скопирована в буфер обмена!');
}

function printReceipt() {
    console.log('✓ printReceipt clicked');
    window.print();
    showNotification('Подготовка к печати сметы');
}

function openFeedbackModal() {
    console.log('✓ openFeedbackModal called');
    const modal = safeGetElement('feedbackModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeFeedbackModal() {
    const modal = safeGetElement('feedbackModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

async function submitFeedbackForm(formData) {
    const config = window.getTelegramConfig();           // ← берём из config.js
    const TELEGRAM_BOT_TOKEN = config.token;
    const TELEGRAM_CHAT_ID = config.chatId;

    const receiptText = getReceiptText();

    const message = `
📋 НОВАЯ ЗАЯВКА НА КОНСУЛЬТАЦИЮ
👤 Клиент: ${formData.clientName}
📞 Контакты: ${formData.clientContact}
🏠 Тип помещения: ${formData.propertyType}
📏 Площадь: ${formData.totalArea || 'Не указана'} м²
💬 Дополнительная информация:
${formData.additionalInfo || 'Не указана'}
━━━━━━━━━━━━━━━━━━━━
${receiptText}
`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        const result = await response.json();
        if (!result.ok) {
            const responsePlain = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message.replace(/\*/g, ''),
                    parse_mode: null
                })
            });
            const resultPlain = await responsePlain.json();
            return resultPlain.ok;
        }
        return result.ok;
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        return false;
    }
}

function initFeedbackModal() {
    const modal = safeGetElement('feedbackModal');
    const closeBtn = document.querySelector('.close-modal');
    const feedbackForm = safeGetElement('feedbackForm');

    if (!modal || !closeBtn || !feedbackForm) {
        console.error('❌ Modal elements not found');
        return;
    }

    closeBtn.addEventListener('click', closeFeedbackModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeFeedbackModal();
        }
    });

    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            clientName: safeGetElement('clientName')?.value || '',
            clientContact: safeGetElement('clientContact')?.value || '',
            propertyType: safeGetElement('propertyType')?.value || '',
            totalArea: safeGetElement('totalAreaInput')?.value || '',
            additionalInfo: safeGetElement('additionalInfo')?.value || ''
        };

        const submitBtn = feedbackForm.querySelector('.btn-submit');
        const originalText = submitBtn ? submitBtn.innerHTML : '';

        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            submitBtn.disabled = true;
        }

        try {
            const success = await submitFeedbackForm(formData);
            if (success) {
                showNotification('Заявка успешно отправлена!');
                closeFeedbackModal();
                feedbackForm.reset();
            } else {
                throw new Error('Ошибка отправки');
            }
        } catch (error) {
            console.error('Ошибка отправки формы:', error);
            showNotification('Ошибка отправки заявки.');
        } finally {
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    });
}

// ================== ИНИЦИАЛИЗАЦИЯ UI ==================
function initUI() {
    console.log('✓ initUI called');

    window.toolButtons = document.querySelectorAll('.tool-btn');
    window.cursorPosition = safeGetElement('cursorPosition');
    window.selectedElement = safeGetElement('selectedElement');
    window.zoomLevel = safeGetElement('zoomLevel');
    window.receiptContainer = safeGetElement('receiptContainer');
    window.receiptContent = safeGetElement('receiptContent');

    roomProperties = safeGetElement('roomProperties');
    doorProperties = safeGetElement('doorProperties');
    windowProperties = safeGetElement('windowProperties');

    window.newProjectBtn = safeGetElement('newProject');
    window.clearAllBtn = safeGetElement('clearAll');
    window.zoomInBtn = safeGetElement('zoomIn');
    window.zoomOutBtn = safeGetElement('zoomOut');
    window.centerViewBtn = safeGetElement('centerView');

    applyRoomChangesBtn = safeGetElement('applyRoomChanges');
    applyWindowChangesBtn = safeGetElement('applyWindowChanges');
    applyDoorChangesBtn = safeGetElement('applyDoorChanges');

    // Элементы комнаты
    roomName = safeGetElement('roomName');
    roomWidth = safeGetElement('roomWidth');
    roomHeightProp = safeGetElement('roomHeightProp');
    plasterCheckbox = safeGetElement('plaster');
    armoringCheckbox = safeGetElement('armoring');
    puttyWallpaperCheckbox = safeGetElement('puttyWallpaper');
    puttyPaintCheckbox = safeGetElement('puttyPaint');
    paintingCheckbox = safeGetElement('painting');

    // Элементы окна
    windowWidth = safeGetElement('windowWidth');
    windowHeight = safeGetElement('windowHeight');
    windowWall = safeGetElement('windowWall');
    windowLeftOffset = safeGetElement('windowLeftOffset');
    windowRightOffset = safeGetElement('windowRightOffset');
    windowSlopes = safeGetElement('windowSlopes');

    // Элементы двери
    doorWidth = safeGetElement('doorWidth');
    doorHeight = safeGetElement('doorHeight');
    doorWall = safeGetElement('doorWall');
    doorLeftOffset = safeGetElement('doorLeftOffset');
    doorRightOffset = safeGetElement('doorRightOffset');
    doorSlopes = safeGetElement('doorSlopes');

    // Назначаем постоянные обработчики (один раз)
    if (windowWidth) windowWidth.addEventListener('input', windowInputHandler);
    if (windowLeftOffset) windowLeftOffset.addEventListener('input', windowInputHandler);
    if (windowSlopes) windowSlopes.addEventListener('input', windowInputHandler);
    if (doorWidth) doorWidth.addEventListener('input', doorInputHandler);
    if (doorLeftOffset) doorLeftOffset.addEventListener('input', doorInputHandler);
    if (doorSlopes) doorSlopes.addEventListener('input', doorInputHandler);
    if (roomName) roomName.addEventListener('input', roomInputHandler);
    if (roomWidth) roomWidth.addEventListener('input', roomInputHandler);
    if (roomHeightProp) roomHeightProp.addEventListener('input', roomInputHandler);
    if (plasterCheckbox) plasterCheckbox.addEventListener('change', roomCheckboxHandler);
    if (armoringCheckbox) armoringCheckbox.addEventListener('change', roomCheckboxHandler);
    if (puttyWallpaperCheckbox) puttyWallpaperCheckbox.addEventListener('change', roomCheckboxHandler);
    if (puttyPaintCheckbox) puttyPaintCheckbox.addEventListener('change', roomCheckboxHandler);
    if (paintingCheckbox) paintingCheckbox.addEventListener('change', roomCheckboxHandler);

    // Кнопки "Применить" (теперь используют Event Bus)
    if (applyRoomChangesBtn) {
        applyRoomChangesBtn.addEventListener('click', () => {
            if (!window.selectedRoom) return;
            pushToHistory();
            const newWidth = roomWidth ? parseFloat(roomWidth.value) * window.scale : window.selectedRoom.width;
            const newHeight = roomHeightProp ? parseFloat(roomHeightProp.value) * window.scale : window.selectedRoom.height;
            const centerX = window.selectedRoom.x + window.selectedRoom.width / 2;
            const centerY = window.selectedRoom.y + window.selectedRoom.height / 2;
            window.selectedRoom.name = roomName ? roomName.value : window.selectedRoom.name;
            window.selectedRoom.width = newWidth;
            window.selectedRoom.height = newHeight;
            window.selectedRoom.x = centerX - newWidth / 2;
            window.selectedRoom.y = centerY - newHeight / 2;
            window.selectedRoom.plaster = plasterCheckbox ? plasterCheckbox.checked : window.selectedRoom.plaster;
            window.selectedRoom.armoring = armoringCheckbox ? armoringCheckbox.checked : window.selectedRoom.armoring;
            window.selectedRoom.puttyWallpaper = puttyWallpaperCheckbox ? puttyWallpaperCheckbox.checked : window.selectedRoom.puttyWallpaper;
            window.selectedRoom.puttyPaint = puttyPaintCheckbox ? puttyPaintCheckbox.checked : window.selectedRoom.puttyPaint;
            window.selectedRoom.painting = paintingCheckbox ? paintingCheckbox.checked : window.selectedRoom.painting;
            applyRoomChangesBtn.disabled = true;
            dispatchStateChanged({ action: 'propertiesApplied', type: 'room' });
            showNotification('Изменения применены');
        });
    }

    if (applyWindowChangesBtn) {
        applyWindowChangesBtn.addEventListener('click', () => {
            if (!window.selectedRoom || !window.selectedElementObj) return;
            pushToHistory();
            const wallLength = window.selectedElementObj.wall === 'top' || window.selectedElementObj.wall === 'bottom' ?
                (window.selectedRoom.width / window.scale) : (window.selectedRoom.height / window.scale);
            const newWidth = windowWidth ? parseFloat(windowWidth.value) : window.selectedElementObj.width;
            const newLeftOffset = windowLeftOffset ? parseFloat(windowLeftOffset.value) : (window.selectedElementObj.leftOffset || 0);
            window.selectedElementObj.width = Math.max(0.5, Math.min(wallLength, newWidth));
            window.selectedElementObj.leftOffset = Math.max(0, Math.min(wallLength - window.selectedElementObj.width, newLeftOffset));
            window.selectedElementObj.rightOffset = wallLength - window.selectedElementObj.leftOffset - window.selectedElementObj.width;
            window.selectedElementObj.height = windowHeight ? parseFloat(windowHeight.value) : window.selectedElementObj.height;
            window.selectedElementObj.wall = windowWall ? windowWall.value : window.selectedElementObj.wall;
            window.selectedElementObj.slopes = windowSlopes ? windowSlopes.value : window.selectedElementObj.slopes;
            applyWindowChangesBtn.disabled = true;
            dispatchStateChanged({ action: 'propertiesApplied', type: 'window' });
            showNotification('Изменения применены');
        });
    }

    if (applyDoorChangesBtn) {
        applyDoorChangesBtn.addEventListener('click', () => {
            if (!window.selectedRoom || !window.selectedElementObj) return;
            pushToHistory();
            const wallLength = window.selectedElementObj.wall === 'top' || window.selectedElementObj.wall === 'bottom' ?
                (window.selectedRoom.width / window.scale) : (window.selectedRoom.height / window.scale);
            const newWidth = doorWidth ? parseFloat(doorWidth.value) : window.selectedElementObj.width;
            const newLeftOffset = doorLeftOffset ? parseFloat(doorLeftOffset.value) : (window.selectedElementObj.leftOffset || 0);
            window.selectedElementObj.width = Math.max(0.6, Math.min(wallLength, newWidth));
            window.selectedElementObj.leftOffset = Math.max(0, Math.min(wallLength - window.selectedElementObj.width, newLeftOffset));
            window.selectedElementObj.rightOffset = wallLength - window.selectedElementObj.leftOffset - window.selectedElementObj.width;
            window.selectedElementObj.height = doorHeight ? parseFloat(doorHeight.value) : window.selectedElementObj.height;
            window.selectedElementObj.wall = doorWall ? doorWall.value : window.selectedElementObj.wall;
            window.selectedElementObj.slopes = doorSlopes ? doorSlopes.value : window.selectedElementObj.slopes;
            applyDoorChangesBtn.disabled = true;
            dispatchStateChanged({ action: 'propertiesApplied', type: 'door' });
            showNotification('Изменения применены');
        });
    }

    // Кнопки удаления
    const deleteRoomBtn = safeGetElement('deleteRoom');
    if (deleteRoomBtn) deleteRoomBtn.addEventListener('click', () => { if (window.selectedRoom) deleteRoom(window.selectedRoom); });
    const deleteWindowBtn = safeGetElement('deleteWindow');
    if (deleteWindowBtn) deleteWindowBtn.addEventListener('click', () => { if (window.selectedRoom && window.selectedElementObj) deleteWindow(window.selectedRoom, window.selectedElementObj); });
    const deleteDoorBtn = safeGetElement('deleteDoor');
    if (deleteDoorBtn) deleteDoorBtn.addEventListener('click', () => { if (window.selectedRoom && window.selectedElementObj) deleteDoor(window.selectedRoom, window.selectedElementObj); });

    initSharingButtons();
    initFeedbackModal();
    initEventListeners();

    // ================== EVENT BUS (единственный обработчик) ==================
    window.addEventListener('stateChanged', () => {
        updateElementList();
        updateProjectSummary();
        calculateCost();

        const canvas = safeGetElement('editorCanvas');
        if (canvas && typeof draw === 'function') {
            draw(canvas, canvas.getContext('2d'));
        }
    });
}

// ================== ОБРАБОТЧИКИ СОБЫТИЙ (КНОПКИ ИНТЕРФЕЙСА) ==================
function initEventListeners() {
    const editorCanvas = safeGetElement('editorCanvas');
    if (!editorCanvas) return;

    if (window.toolButtons) {
        window.toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                window.toolButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                window.currentTool = button.dataset.tool;

                if (window.currentTool === 'select') {
                    editorCanvas.style.cursor = 'move';
                } else if (window.currentTool === 'room') {
                    editorCanvas.style.cursor = 'crosshair';
                } else if (window.currentTool === 'window' || window.currentTool === 'door') {
                    editorCanvas.style.cursor = 'cell';
                }
            });
        });
    }

    const newProjectBtn = safeGetElement('newProject');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => {
            pushToHistory();
            window.rooms = [];
            window.selectedRoom = null;
            window.selectedElementObj = null;
            window.roomCounter = 1;
            hideAllProperties();
            clearHistory();
            dispatchStateChanged({ action: 'newProject' });
            const canvas = safeGetElement('editorCanvas');
            if (canvas && typeof centerView === 'function') centerView(canvas);
            showNotification('Новый проект создан');
        });
    }

    const clearAllBtn = safeGetElement('clearAll');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите удалить все комнаты?')) {
                pushToHistory();
                window.rooms = [];
                window.selectedRoom = null;
                window.selectedElementObj = null;
                window.roomCounter = 1;
                hideAllProperties();
                dispatchStateChanged({ action: 'clearAll' });
                const canvas = safeGetElement('editorCanvas');
                if (canvas && typeof centerView === 'function') centerView(canvas);
                showNotification('Все комнаты удалены');
            }
        });
    }

    const zoomInBtn = safeGetElement('zoomIn');
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            window.zoom *= 1.2;
            window.zoom = Math.min(3, window.zoom);
            const zoomLevel = safeGetElement('zoomLevel');
            if (zoomLevel) zoomLevel.textContent = `${Math.round(window.zoom * 100)}%`;
            const canvas = safeGetElement('editorCanvas');
            if (canvas && typeof draw === 'function') draw(canvas, canvas.getContext('2d'));
        });
    }

    const zoomOutBtn = safeGetElement('zoomOut');
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            window.zoom /= 1.2;
            window.zoom = Math.max(0.1, window.zoom);
            const zoomLevel = safeGetElement('zoomLevel');
            if (zoomLevel) zoomLevel.textContent = `${Math.round(window.zoom * 100)}%`;
            const canvas = safeGetElement('editorCanvas');
            if (canvas && typeof draw === 'function') draw(canvas, canvas.getContext('2d'));
        });
    }

    const centerViewBtn = safeGetElement('centerView');
    if (centerViewBtn) {
        centerViewBtn.addEventListener('click', () => {
            const canvas = safeGetElement('editorCanvas');
            if (canvas && typeof centerView === 'function') centerView(canvas);
        });
    }

    const ceilingHeight = safeGetElement('ceilingHeight');
    if (ceilingHeight) {
        ceilingHeight.addEventListener('change', () => {
            updateProjectSummary();
            calculateCost();
        });
    }
}