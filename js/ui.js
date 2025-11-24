// Функции для работы с пользовательским интерфейсом

// Глобальные переменные для DOM элементов
let roomProperties, doorProperties, windowProperties;
let applyRoomChangesBtn, applyWindowChangesBtn, applyDoorChangesBtn;
let plasterCheckbox, armoringCheckbox, puttyWallpaperCheckbox, puttyPaintCheckbox, paintingCheckbox;

// Обновление списка элементов
function updateElementList() {
    const elementList = getElementSafe('elementList');
    if (!elementList) return;
    
    const state = PlanPomesheniy.getState();
    
    elementList.innerHTML = '';
    
    if (state.rooms.length === 0) {
        elementList.innerHTML = '<div class="element-item">Нет элементов</div>';
        return;
    }
    
    state.rooms.forEach(room => {
        const item = document.createElement('div');
        item.className = 'element-item';
        if (state.selectedRoom && state.selectedRoom.id === room.id) {
            item.classList.add('selected');
        }
        item.innerHTML = `
            <span>${escapeHTML(room.name)} (${(room.width / state.scale).toFixed(1)}x${(room.height / state.scale).toFixed(1)} м)</span>
            <button class="delete-btn" data-id="${room.id}" data-type="room"><i class="fas fa-trash"></i></button>
        `;
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn') || e.target.parentElement?.classList.contains('delete-btn')) return;
            selectRoom(room);
            const editorCanvas = getElementSafe('editorCanvas');
            if (editorCanvas) {
                draw(editorCanvas, editorCanvas.getContext('2d'));
            }
            if (window.innerWidth <= 576) {
                showMobilePanel('properties');
            }
        });
        
        const deleteBtn = item.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteRoom(room);
        });
        
        elementList.appendChild(item);
        
        // Добавляем окна комнаты
        room.windows.forEach(window => {
            const windowItem = document.createElement('div');
            windowItem.className = 'element-item';
            if (state.selectedElementObj && state.selectedElementObj.id === window.id) {
                windowItem.classList.add('selected');
            }
            windowItem.innerHTML = `
                <span style="margin-left: 20px;">Окно: ${window.width}x${window.height} м (${escapeHTML(window.wall)})</span>
                <button class="delete-btn" data-id="${window.id}" data-type="window"><i class="fas fa-trash"></i></button>
            `;
            windowItem.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-btn') || e.target.parentElement?.classList.contains('delete-btn')) return;
                PlanPomesheniy.setSelectedRoom(room);
                selectElement(window);
                const editorCanvas = getElementSafe('editorCanvas');
                if (editorCanvas) {
                    draw(editorCanvas, editorCanvas.getContext('2d'));
                }
                if (window.innerWidth <= 576) {
                    showMobilePanel('properties');
                }
            });
            
            const deleteBtn = windowItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteWindow(room, window);
            });
            
            elementList.appendChild(windowItem);
        });
        
        // Добавляем двери комнаты
        room.doors.forEach(door => {
            const doorItem = document.createElement('div');
            doorItem.className = 'element-item';
            if (state.selectedElementObj && state.selectedElementObj.id === door.id) {
                doorItem.classList.add('selected');
            }
            doorItem.innerHTML = `
                <span style="margin-left: 20px;">Дверь: ${door.width}x${door.height} м (${escapeHTML(door.wall)})</span>
                <button class="delete-btn" data-id="${door.id}" data-type="door"><i class="fas fa-trash"></i></button>
            `;
            doorItem.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-btn') || e.target.parentElement?.classList.contains('delete-btn')) return;
                PlanPomesheniy.setSelectedRoom(room);
                selectElement(door);
                const editorCanvas = getElementSafe('editorCanvas');
                if (editorCanvas) {
                    draw(editorCanvas, editorCanvas.getContext('2d'));
                }
                if (window.innerWidth <= 576) {
                    showMobilePanel('properties');
                }
            });
            
            const deleteBtn = doorItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteDoor(room, door);
            });
            
            elementList.appendChild(doorItem);
        });
    });
}

// Функции удаления элементов
function deleteRoom(room) {
    if (confirm(`Удалить комнату "${room.name}"?`)) {
        PlanPomesheniy.removeRoom(room.id);
        const state = PlanPomesheniy.getState();
        if (state.selectedRoom && state.selectedRoom.id === room.id) {
            PlanPomesheniy.setSelectedRoom(null);
            PlanPomesheniy.setSelectedElementObj(null);
            hideAllProperties();
        }
        updateElementList();
        updateProjectSummary();
        calculateCost();
        const editorCanvas = getElementSafe('editorCanvas');
        if (editorCanvas) {
            centerView(editorCanvas);
        }
        showNotification('Комната удалена');
    }
}

function deleteWindow(room, window) {
    if (confirm('Удалить окно?')) {
        room.windows = room.windows.filter(w => w.id !== window.id);
        const state = PlanPomesheniy.getState();
        if (state.selectedElementObj && state.selectedElementObj.id === window.id) {
            PlanPomesheniy.setSelectedElementObj(null);
            hideAllProperties();
        }
        updateElementList();
        updateProjectSummary();
        calculateCost();
        const editorCanvas = getElementSafe('editorCanvas');
        if (editorCanvas) {
            draw(editorCanvas, editorCanvas.getContext('2d'));
        }
        showNotification('Окно удалено');
    }
}

function deleteDoor(room, door) {
    if (confirm('Удалить дверь?')) {
        room.doors = room.doors.filter(d => d.id !== door.id);
        const state = PlanPomesheniy.getState();
        if (state.selectedElementObj && state.selectedElementObj.id === door.id) {
            PlanPomesheniy.setSelectedElementObj(null);
            hideAllProperties();
        }
        updateElementList();
        updateProjectSummary();
        calculateCost();
        const editorCanvas = getElementSafe('editorCanvas');
        if (editorCanvas) {
            draw(editorCanvas, editorCanvas.getContext('2d'));
        }
        showNotification('Дверь удалена');
    }
}

// Обновление сводки проекта
function updateProjectSummary() {
    const state = PlanPomesheniy.getState();
    
    let windowsCount = 0;
    let doorsCount = 0;
    let totalArea = 0;
    
    state.rooms.forEach(room => {
        windowsCount += room.windows.length;
        doorsCount += room.doors.length;
        
        const perimeter = ((room.width / state.scale) + (room.height / state.scale)) * 2;
        const ceilingHeightInput = getElementSafe('ceilingHeight');
        const ceilingHeight = ceilingHeightInput ? parseFloat(ceilingHeightInput.value) : 2.5;
        const wallsArea = perimeter * ceilingHeight;
        
        // Вычитаем площади окон и дверей
        let windowsArea = 0;
        let doorsArea = 0;
        
        room.windows.forEach(window => {
            windowsArea += window.width * window.height;
        });
        
        room.doors.forEach(door => {
            doorsArea += door.width * door.height;
        });
        
        totalArea += wallsArea - windowsArea - doorsArea;
    });
    
    const roomsCountElem = getElementSafe('roomsCount');
    const windowsCountElem = getElementSafe('windowsCount');
    const doorsCountElem = getElementSafe('doorsCount');
    const totalAreaElem = getElementSafe('totalArea');
    
    if (roomsCountElem) roomsCountElem.textContent = state.rooms.length;
    if (windowsCountElem) windowsCountElem.textContent = windowsCount;
    if (doorsCountElem) doorsCountElem.textContent = doorsCount;
    if (totalAreaElem) totalAreaElem.textContent = `${totalArea.toFixed(1)} м²`;
}

// Обновление панели свойств в зависимости от выбранного элемента
function updatePropertiesPanel(element) {
    hideAllProperties();
    
    if (!element) return;
    
    if (element.type === 'room') {
        if (roomProperties) roomProperties.style.display = 'block';
        const roomName = getElementSafe('roomName');
        const roomWidth = getElementSafe('roomWidth');
        const roomHeightProp = getElementSafe('roomHeightProp');
        
        if (roomName) roomName.value = element.name;
        if (roomWidth) roomWidth.value = (element.width / state.scale).toFixed(1);
        if (roomHeightProp) roomHeightProp.value = (element.height / state.scale).toFixed(1);
        
        // Установка чекбоксов отделки
        if (plasterCheckbox) plasterCheckbox.checked = element.plaster;
        if (armoringCheckbox) armoringCheckbox.checked = element.armoring;
        if (puttyWallpaperCheckbox) puttyWallpaperCheckbox.checked = element.puttyWallpaper;
        if (puttyPaintCheckbox) puttyPaintCheckbox.checked = element.puttyPaint;
        if (paintingCheckbox) paintingCheckbox.checked = element.painting;
        
        // Управление состоянием чекбокса покраски при загрузке
        if (paintingCheckbox) {
            if (element.puttyWallpaper) {
                paintingCheckbox.disabled = true;
            } else if (element.puttyPaint) {
                paintingCheckbox.disabled = false;
            } else {
                paintingCheckbox.disabled = true;
            }
        }
        
        // Сброс состояния кнопки
        if (applyRoomChangesBtn) applyRoomChangesBtn.disabled = false;
        
    } else if (element.type === 'window') {
        if (windowProperties) windowProperties.style.display = 'block';
        const windowWidth = getElementSafe('windowWidth');
        const windowHeight = getElementSafe('windowHeight');
        const windowWall = getElementSafe('windowWall');
        const windowPosition = getElementSafe('windowPosition');
        const windowPositionValue = getElementSafe('windowPositionValue');
        const windowSlopes = getElementSafe('windowSlopes');
        
        if (windowWidth) windowWidth.value = element.width;
        if (windowHeight) windowHeight.value = element.height;
        if (windowWall) windowWall.value = element.wall;
        if (windowPosition) windowPosition.value = element.position;
        if (windowPositionValue) windowPositionValue.textContent = `${element.position}%`;
        if (windowSlopes) windowSlopes.value = element.slopes;
        
        // Сброс состояния кнопки
        if (applyWindowChangesBtn) applyWindowChangesBtn.disabled = true;
        
    } else if (element.type === 'door') {
        if (doorProperties) doorProperties.style.display = 'block';
        const doorWidth = getElementSafe('doorWidth');
        const doorHeight = getElementSafe('doorHeight');
        const doorWall = getElementSafe('doorWall');
        const doorPosition = getElementSafe('doorPosition');
        const doorPositionValue = getElementSafe('doorPositionValue');
        const doorSlopes = getElementSafe('doorSlopes');
        
        if (doorWidth) doorWidth.value = element.width;
        if (doorHeight) doorHeight.value = element.height;
        if (doorWall) doorWall.value = element.wall;
        if (doorPosition) doorPosition.value = element.position;
        if (doorPositionValue) doorPositionValue.textContent = `${element.position}%`;
        if (doorSlopes) doorSlopes.value = element.slopes;
        
        // Сброс состояния кнопки
        if (applyDoorChangesBtn) applyDoorChangesBtn.disabled = true;
    }
    
    const selectedElement = getElementSafe('selectedElement');
    if (selectedElement) {
        selectedElement.textContent = `${element.type === 'room' ? 'Комната' : element.type === 'window' ? 'Окно' : 'Дверь'}: ${escapeHTML(element.name || '')}`;
    }
}

// Скрытие всех панелей свойств
function hideAllProperties() {
    if (roomProperties) roomProperties.style.display = 'none';
    if (doorProperties) doorProperties.style.display = 'none';
    if (windowProperties) windowProperties.style.display = 'none';
    
    const selectedElement = getElementSafe('selectedElement');
    if (selectedElement) {
        selectedElement.textContent = 'Не выбран';
    }
}

// Функции для отправки сметы
function initSharingButtons() {
    const sendWhatsAppBtn = getElementSafe('sendWhatsApp');
    const copyReceiptBtn = getElementSafe('copyReceipt');
    const printReceiptBtn = getElementSafe('printReceipt');
    const feedbackBtn = getElementSafe('feedbackBtn');
    
    if (sendWhatsAppBtn) {
        sendWhatsAppBtn.addEventListener('click', shareToWhatsApp);
    }
    
    if (copyReceiptBtn) {
        copyReceiptBtn.addEventListener('click', copyReceiptToClipboard);
    }
    
    if (printReceiptBtn) {
        printReceiptBtn.addEventListener('click', printReceipt);
    }
    
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', openFeedbackModal);
    }
}

// Функция для получения текстового представления сметы
function getReceiptText() {
    const state = PlanPomesheniy.getState();
    const prices = PlanPomesheniy.getPrices();
    
    let text = `🧾 СМЕТА РАБОТ\n`;
    text += `📅 ${new Date().toLocaleDateString()}\n`;
    text += `📍 Расчет для г. Симферополь\n\n`;
    
    let totalCost = 0;
    
    const ceilingHeightInput = getElementSafe('ceilingHeight');
    const ceilingHeight = ceilingHeightInput ? parseFloat(ceilingHeightInput.value) : 2.5;
    
    state.rooms.forEach(room => {
        const roomArea = (room.width / state.scale * room.height / state.scale).toFixed(1);
        text += `🏠 ${escapeHTML(room.name)} (${(room.width / state.scale).toFixed(1)}×${(room.height / state.scale).toFixed(1)} м)\n`;
        text += `📐 Площадь: ${roomArea} м²\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        
        const perimeter = ((room.width / state.scale) + (room.height / state.scale)) * 2;
        const wallsArea = perimeter * ceilingHeight;
        
        let windowsArea = 0;
        let doorsArea = 0;
        let slopesLinear = 0;
        let slopesLinearWithNet = 0;
        
        room.windows.forEach(window => {
            windowsArea += window.width * window.height;
            if (window.slopes === 'with') {
                slopesLinear += (window.width + window.height * 2);
            } else if (window.slopes === 'with_net') {
                slopesLinear += (window.width + window.height * 2);
                slopesLinearWithNet += (window.width + window.height * 2);
            }
        });
        
        room.doors.forEach(door => {
            doorsArea += door.width * door.height;
            if (door.slopes === 'with') {
                slopesLinear += (door.width + door.height * 2);
            } else if (door.slopes === 'with_net') {
                slopesLinear += (door.width + door.height * 2);
                slopesLinearWithNet += (door.width + door.height * 2);
            }
        });
        
        const netWallsArea = wallsArea - windowsArea - doorsArea;
        let roomCost = 0;
        
        // Стартовая штукатурка
        if (room.plaster) {
            text += `СТАРТОВАЯ ШТУКАТУРКА:\n`;
            let plasterCost = 0;
            
            const primerWallsCost = netWallsArea * prices.primer.square;
            plasterCost += primerWallsCost;
            text += `├ Грунтовка стен: ${netWallsArea.toFixed(1)} м² × ${prices.primer.square} руб = ${primerWallsCost.toFixed(2)} руб\n`;
            
            const plasterWallsCost = netWallsArea * prices.plaster.square;
            plasterCost += plasterWallsCost;
            text += `├ Штукатурка стен: ${netWallsArea.toFixed(1)} м² × ${prices.plaster.square} руб = ${plasterWallsCost.toFixed(2)} руб\n`;
            
            if (slopesLinear > 0) {
                const primerSlopesCost = slopesLinear * prices.primer.linear;
                plasterCost += primerSlopesCost;
                text += `├ Грунтовка откосов: ${slopesLinear.toFixed(1)} мп × ${prices.primer.linear} руб = ${primerSlopesCost.toFixed(2)} руб\n`;
                
                const plasterSlopesCost = slopesLinear * prices.plaster.linear;
                plasterCost += plasterSlopesCost;
                text += `├ Штукатурка откосов: ${slopesLinear.toFixed(1)} мп × ${prices.plaster.linear} руб = ${plasterSlopesCost.toFixed(2)} руб\n`;
                
                const cornerCost = slopesLinear * prices.corner.linear;
                plasterCost += cornerCost;
                text += `└ Установка уголков: ${slopesLinear.toFixed(1)} мп × ${prices.corner.linear} руб = ${cornerCost.toFixed(2)} руб\n`;
            }
            
            text += `Итого по штукатурке: ${plasterCost.toFixed(2)} руб\n\n`;
            roomCost += plasterCost;
        }
        
        // Армирование сеткой
        if (room.armoring) {
            text += `АРМИРОВАНИЕ СЕТКОЙ:\n`;
            let armoringCost = 0;
            
            const armoringWallsCost = netWallsArea * prices.armoring.square;
            armoringCost += armoringWallsCost;
            text += `├ Армирование стен: ${netWallsArea.toFixed(1)} м² × ${prices.armoring.square} руб = ${armoringWallsCost.toFixed(2)} руб\n`;
            
            if (slopesLinearWithNet > 0) {
                const armoringSlopesCost = slopesLinearWithNet * prices.armoring.linear;
                armoringCost += armoringSlopesCost;
                text += `└ Армирование откосов: ${slopesLinearWithNet.toFixed(1)} мп × ${prices.armoring.linear} руб = ${armoringSlopesCost.toFixed(2)} руб\n`;
            }
            
            text += `Итого по армированию: ${armoringCost.toFixed(2)} руб\n\n`;
            roomCost += armoringCost;
        }
        
        // Финишная шпаклевка
        if (room.puttyWallpaper || room.puttyPaint) {
            const puttyType = room.puttyWallpaper ? 'wallpaper' : 'paint';
            const puttyName = room.puttyWallpaper ? 'под обои' : 'под покраску';
            const puttyPrice = prices.putty[puttyType];
            
            text += `ФИНИШНАЯ ШПАКЛЕВКА ${puttyName.toUpperCase()}:\n`;
            let puttyCost = 0;
            
            const puttyWallsCost = netWallsArea * puttyPrice.square;
            puttyCost += puttyWallsCost;
            text += `├ Шпаклевка стен: ${netWallsArea.toFixed(1)} м² × ${puttyPrice.square} руб = ${puttyWallsCost.toFixed(2)} руб\n`;
            
            const sandingWallsCost = netWallsArea * prices.sanding.square;
            puttyCost += sandingWallsCost;
            text += `├ Зашкуривание стен: ${netWallsArea.toFixed(1)} м² × ${prices.sanding.square} руб = ${sandingWallsCost.toFixed(2)} руб\n`;
            
            if (slopesLinear > 0) {
                const puttySlopesCost = slopesLinear * puttyPrice.linear;
                puttyCost += puttySlopesCost;
                text += `├ Шпаклевка откосов: ${slopesLinear.toFixed(1)} мп × ${puttyPrice.linear} руб = ${puttySlopesCost.toFixed(2)} руб\n`;
                
                const sandingSlopesCost = slopesLinear * prices.sanding.linear;
                puttyCost += sandingSlopesCost;
                text += `└ Зашкуривание откосов: ${slopesLinear.toFixed(1)} мп × ${prices.sanding.linear} руб = ${sandingSlopesCost.toFixed(2)} руб\n`;
            }
            
            text += `Итого по шпаклевке: ${puttyCost.toFixed(2)} руб\n\n`;
            roomCost += puttyCost;
        }
        
        // Покраска
        if (room.painting) {
            text += `ПОКРАСКА В 2 СЛОЯ:\n`;
            let paintingCost = 0;
            
            const paintingPrimerCost = netWallsArea * prices.primer.square;
            paintingCost += paintingPrimerCost;
            text += `├ Грунтовка перед покраской: ${netWallsArea.toFixed(1)} м² × ${prices.primer.square} руб = ${paintingPrimerCost.toFixed(2)} руб\n`;
            
            const paintingWallsCost = netWallsArea * prices.painting.square;
            paintingCost += paintingWallsCost;
            text += `├ Покраска стен: ${netWallsArea.toFixed(1)} м² × ${prices.painting.square} руб = ${paintingWallsCost.toFixed(2)} руб\n`;
            
            if (slopesLinear > 0) {
                const paintingPrimerSlopesCost = slopesLinear * prices.primer.linear;
                paintingCost += paintingPrimerSlopesCost;
                text += `├ Грунтовка откосов: ${slopesLinear.toFixed(1)} мп × ${prices.primer.linear} руб = ${paintingPrimerSlopesCost.toFixed(2)} руб\n`;
                
                const paintingSlopesCost = slopesLinear * prices.painting.linear;
                paintingCost += paintingSlopesCost;
                text += `└ Покраска откосов: ${slopesLinear.toFixed(1)} мп × ${prices.painting.linear} руб = ${paintingSlopesCost.toFixed(2)} руб\n`;
            }
            
            text += `Итого по покраске: ${paintingCost.toFixed(2)} руб\n\n`;
            roomCost += paintingCost;
        }
        
        text += `💰 ИТОГО ПО КОМНАТЕ: ${roomCost.toFixed(2)} руб\n\n`;
        totalCost += roomCost;
    });
    
    text += `════════════════════════════\n`;
    text += `💵 ОБЩАЯ СТОИМОСТЬ РАБОТ: ${totalCost.toFixed(2)} руб\n`;
    text += `════════════════════════════\n\n`;
    
    text += `Общая информация:\n`;
    text += `• Комнат: ${state.rooms.length}\n`;
    
    let windowsCount = 0;
    let doorsCount = 0;
    state.rooms.forEach(room => {
        windowsCount += room.windows.length;
        doorsCount += room.doors.length;
    });
    
    text += `• Окон: ${windowsCount}\n`;
    text += `• Дверей: ${doorsCount}\n`;
    text += `• Высота потолков: ${ceilingHeight} м\n\n`;
    
    text += `Детализация сметы:\n`;
    text += `• Штукатурка: ${prices.plaster.square} руб/м²\n`;
    text += `• Армирование сеткой: ${prices.armoring.square} руб/м²\n`;
    text += `• Шпаклевка под обои: ${prices.putty.wallpaper.square} руб/м²\n`;
    text += `• Шпаклевка под покраску: ${prices.putty.paint.square} руб/м²\n`;
    text += `• Покраска: ${prices.painting.square} руб/м²\n\n`;
    
    text += `ПланПомещений - конструктор и расчет стоимости ремонта\n`;
    text += `Симферополь\n`;
    text += `Расчет действителен на ${new Date().toLocaleDateString()}\n\n`;
    text += `ВНИМАНИЕ: Данная смета является информационной. Итоговая стоимость может отличаться в зависимости от конкретных условий работ.`;
    
    return text;
}

// Функция для отправки в WhatsApp
function shareToWhatsApp() {
    const text = getReceiptText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    showNotification('Открывается WhatsApp для отправки сметы');
}

// Функция для копирования сметы в буфер обмена
function copyReceiptToClipboard() {
    const text = getReceiptText();
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Смета скопирована в буфер обмена!');
    }).catch(err => {
        console.error('Ошибка копирования: ', err);
        showNotification('Ошибка копирования. Попробуйте еще раз.');
    });
}

// Функция для печати сметы
function printReceipt() {
    window.print();
    showNotification('Подготовка к печати сметы');
}

// Функции для модального окна обратной связи
function openFeedbackModal() {
    const modal = getElementSafe('feedbackModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeFeedbackModal() {
    const modal = getElementSafe('feedbackModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Функция для отправки формы обратной связи
async function submitFeedbackForm(formData) {
    // В реальном приложении используйте серверный endpoint
    // Это временное решение для демонстрации
    
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
        // Временное решение - в реальном приложении замените на вызов вашего серверного API
        console.log('Заявка на консультацию:', message);
        
        // Имитация успешной отправки
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
        
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        return false;
    }
}

// Инициализация пользовательского интерфейса
function initUI() {
    console.log('Инициализация UI');
    
    // Получение ссылок на DOM элементы
    window.toolButtons = document.querySelectorAll('.tool-btn');
    window.cursorPosition = getElementSafe('cursorPosition');
    window.selectedElement = getElementSafe('selectedElement');
    window.zoomLevel = getElementSafe('zoomLevel');
    window.receiptContainer = getElementSafe('receiptContainer');
    window.receiptContent = getElementSafe('receiptContent');
    
    // Панели свойств
    roomProperties = getElementSafe('roomProperties');
    doorProperties = getElementSafe('doorProperties');
    windowProperties = getElementSafe('windowProperties');
    
    // Кнопки управления
    window.newProjectBtn = getElementSafe('newProject');
    window.clearAllBtn = getElementSafe('clearAll');
    window.zoomInBtn = getElementSafe('zoomIn');
    window.zoomOutBtn = getElementSafe('zoomOut');
    window.centerViewBtn = getElementSafe('centerView');
    
    // Кнопки применения изменений
    applyRoomChangesBtn = getElementSafe('applyRoomChanges');
    applyWindowChangesBtn = getElementSafe('applyWindowChanges');
    applyDoorChangesBtn = getElementSafe('applyDoorChanges');
    
    // Элементы управления окнами и дверями
    window.windowPositionSlider = getElementSafe('windowPosition');
    window.windowPositionValue = getElementSafe('windowPositionValue');
    window.doorPositionSlider = getElementSafe('doorPosition');
    window.doorPositionValue = getElementSafe('doorPositionValue');
    
    // Чекбоксы отделки
    plasterCheckbox = getElementSafe('plaster');
    armoringCheckbox = getElementSafe('armoring');
    puttyWallpaperCheckbox = getElementSafe('puttyWallpaper');
    puttyPaintCheckbox = getElementSafe('puttyPaint');
    paintingCheckbox = getElementSafe('painting');
    
    // Инициализация кнопок отправки
    initSharingButtons();
    
    // Инициализация модального окна обратной связи
    initFeedbackModal();
    
    // Инициализация мобильного интерфейса
    if (window.innerWidth <= 576) {
        initMobileUI();
    }
}

// Инициализация модального окна обратной связи
function initFeedbackModal() {
    const modal = getElementSafe('feedbackModal');
    const closeBtn = document.querySelector('.close-modal');
    const feedbackForm = getElementSafe('feedbackForm');
    
    if (!modal || !closeBtn || !feedbackForm) return;
    
    // Закрытие модального окна
    closeBtn.addEventListener('click', closeFeedbackModal);
    
    // Закрытие при клике вне модального окна
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeFeedbackModal();
        }
    });
    
    // Обработка отправки формы
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            clientName: document.getElementById('clientName').value,
            clientContact: document.getElementById('clientContact').value,
            propertyType: document.getElementById('propertyType').value,
            totalArea: document.getElementById('totalAreaInput').value,
            additionalInfo: document.getElementById('additionalInfo').value
        };
        
        const submitBtn = feedbackForm.querySelector('.btn-submit');
        const originalText = submitBtn.innerHTML;
        
        // Показываем индикатор загрузки
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        submitBtn.disabled = true;
        
        try {
            const success = await submitFeedbackForm(formData);
            
            if (success) {
                showNotification('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.');
                closeFeedbackModal();
                feedbackForm.reset();
            } else {
                throw new Error('Ошибка отправки');
            }
        } catch (error) {
            showNotification('Ошибка отправки заявки. Пожалуйста, попробуйте еще раз.');
        } finally {
            // Восстанавливаем кнопку
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Инициализация обработчиков событий
function initEventListeners() {
    const editorCanvas = getElementSafe('editorCanvas');
    
    if (!editorCanvas) return;
    
    // Обработчики инструментов
    if (toolButtons) {
        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                toolButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const tool = button.dataset.tool;
                if (tool) {
                    PlanPomesheniy.setTool(tool);
                }
                
                // Изменение курсора
                if (tool === 'select') {
                    editorCanvas.style.cursor = 'move';
                } else if (tool === 'room') {
                    editorCanvas.style.cursor = 'crosshair';
                } else if (tool === 'window' || tool === 'door') {
                    editorCanvas.style.cursor = 'cell';
                }
            });
        });
    }
    
    // Обработчик кнопки нового проекта
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => {
            const state = PlanPomesheniy.getState();
            if (state.rooms.length > 0 && !confirm('Вы уверены, что хотите создать новый проект? Все несохраненные данные будут потеряны.')) {
                return;
            }
            PlanPomesheniy.clearRooms();
            PlanPomesheniy.setSelectedRoom(null);
            PlanPomesheniy.setSelectedElementObj(null);
            PlanPomesheniy.resetRoomCounter();
            hideAllProperties();
            updateElementList();
            updateProjectSummary();
            calculateCost();
            centerView(editorCanvas);
            showNotification('Новый проект создан');
        });
    }
    
    // Обработчик кнопки очистки
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            const state = PlanPomesheniy.getState();
            if (state.rooms.length === 0) {
                showNotification('Нет комнат для удаления');
                return;
            }
            
            if (confirm('Вы уверены, что хотите удалить все комнаты?')) {
                PlanPomesheniy.clearRooms();
                PlanPomesheniy.setSelectedRoom(null);
                PlanPomesheniy.setSelectedElementObj(null);
                PlanPomesheniy.resetRoomCounter();
                hideAllProperties();
                updateElementList();
                updateProjectSummary();
                calculateCost();
                centerView(editorCanvas);
                showNotification('Все комнаты удалены');
            }
        });
    }
    
    // Обработчики кнопок масштабирования
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            const state = PlanPomesheniy.getState();
            const newZoom = state.zoom * 1.2;
            PlanPomesheniy.setZoom(Math.min(3, newZoom));
            if (zoomLevel) zoomLevel.textContent = `${Math.round(state.zoom * 100)}%`;
            draw(editorCanvas, editorCanvas.getContext('2d'));
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            const state = PlanPomesheniy.getState();
            const newZoom = state.zoom / 1.2;
            PlanPomesheniy.setZoom(Math.max(0.1, newZoom));
            if (zoomLevel) zoomLevel.textContent = `${Math.round(state.zoom * 100)}%`;
            draw(editorCanvas, editorCanvas.getContext('2d'));
        });
    }
    
    // Обработчик кнопки центрирования
    if (centerViewBtn) {
        centerViewBtn.addEventListener('click', () => centerView(editorCanvas));
    }
    
    // Обработчик изменения высоты потолков
    const ceilingHeight = getElementSafe('ceilingHeight');
    if (ceilingHeight) {
        ceilingHeight.addEventListener('change', () => {
            updateProjectSummary();
            calculateCost();
        });
    }
}

// Инициализация мобильного интерфейса
function initMobileUI() {
    console.log('Инициализация мобильного интерфейса');
    
    // Показываем мобильные элементы
    const mobileToolsContainer = document.querySelector('.mobile-tools-container');
    const fabContainer = getElementSafe('fabContainer');
    
    if (mobileToolsContainer) {
        mobileToolsContainer.style.display = 'block';
    }
    
    if (fabContainer) {
        fabContainer.style.display = 'flex';
    }
    
    // Инициализация обработчиков мобильного интерфейса
    initMobileEventHandlers();
    
    // Синхронизация высоты потолков
    const ceilingHeight = getElementSafe('ceilingHeight');
    const mobileCeilingHeight = getElementSafe('mobileCeilingHeight');
    if (ceilingHeight && mobileCeilingHeight) {
        mobileCeilingHeight.value = ceilingHeight.value;
    }
}

// Инициализация обработчиков мобильного интерфейса
function initMobileEventHandlers() {
    console.log('Инициализация мобильных обработчиков');
    
    // Обработчики для мобильных кнопок инструментов
    const mobileToolButtons = document.querySelectorAll('.mobile-tool-btn');
    mobileToolButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tool = this.dataset.tool;
            if (tool) {
                mobileToolButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                PlanPomesheniy.setTool(tool);
                
                const editorCanvas = getElementSafe('editorCanvas');
                if (editorCanvas) {
                    if (tool === 'select') {
                        editorCanvas.style.cursor = 'move';
                    } else if (tool === 'room') {
                        editorCanvas.style.cursor = 'crosshair';
                    } else if (tool === 'window' || tool === 'door') {
                        editorCanvas.style.cursor = 'cell';
                    }
                }
                
                showNotification(`Инструмент: ${tool === 'select' ? 'Выбор' : tool === 'room' ? 'Комната' : tool === 'window' ? 'Окно' : 'Дверь'}`);
            }
        });
    });
    
    // Обработчики для мобильных кнопок управления
    const mobileNewProject = getElementSafe('mobileNewProject');
    const mobileClearAll = getElementSafe('mobileClearAll');
    const mobileZoomIn = getElementSafe('mobileZoomIn');
    const mobileZoomOut = getElementSafe('mobileZoomOut');
    const mobileCenterView = getElementSafe('mobileCenterView');
    
    if (mobileNewProject) {
        mobileNewProject.addEventListener('click', () => {
            const state = PlanPomesheniy.getState();
            if (state.rooms.length > 0 && !confirm('Вы уверены, что хотите создать новый проект? Все несохраненные данные будут потеряны.')) {
                return;
            }
            PlanPomesheniy.clearRooms();
            PlanPomesheniy.setSelectedRoom(null);
            PlanPomesheniy.setSelectedElementObj(null);
            PlanPomesheniy.resetRoomCounter();
            hideAllProperties();
            updateElementList();
            updateProjectSummary();
            calculateCost();
            const editorCanvas = getElementSafe('editorCanvas');
            if (editorCanvas) {
                centerView(editorCanvas);
            }
            showNotification('Новый проект создан');
        });
    }
    
    if (mobileClearAll) {
        mobileClearAll.addEventListener('click', () => {
            const state = PlanPomesheniy.getState();
            if (state.rooms.length === 0) {
                showNotification('Нет комнат для удаления');
                return;
            }
            
            if (confirm('Вы уверены, что хотите удалить все комнаты?')) {
                PlanPomesheniy.clearRooms();
                PlanPomesheniy.setSelectedRoom(null);
                PlanPomesheniy.setSelectedElementObj(null);
                PlanPomesheniy.resetRoomCounter();
                hideAllProperties();
                updateElementList();
                updateProjectSummary();
                calculateCost();
                const editorCanvas = getElementSafe('editorCanvas');
                if (editorCanvas) {
                    centerView(editorCanvas);
                }
                showNotification('Все комнаты удалены');
            }
        });
    }
    
    if (mobileZoomIn) {
        mobileZoomIn.addEventListener('click', () => {
            const state = PlanPomesheniy.getState();
            const newZoom = state.zoom * 1.2;
            PlanPomesheniy.setZoom(Math.min(3, newZoom));
            const zoomLevel = getElementSafe('zoomLevel');
            if (zoomLevel) zoomLevel.textContent = `${Math.round(state.zoom * 100)}%`;
            const editorCanvas = getElementSafe('editorCanvas');
            if (editorCanvas) {
                draw(editorCanvas, editorCanvas.getContext('2d'));
            }
        });
    }
    
    if (mobileZoomOut) {
        mobileZoomOut.addEventListener('click', () => {
            const state = PlanPomesheniy.getState();
            const newZoom = state.zoom / 1.2;
            PlanPomesheniy.setZoom(Math.max(0.1, newZoom));
            const zoomLevel = getElementSafe('zoomLevel');
            if (zoomLevel) zoomLevel.textContent = `${Math.round(state.zoom * 100)}%`;
            const editorCanvas = getElementSafe('editorCanvas');
            if (editorCanvas) {
                draw(editorCanvas, editorCanvas.getContext('2d'));
            }
        });
    }
    
    if (mobileCenterView) {
        mobileCenterView.addEventListener('click', () => {
            const editorCanvas = getElementSafe('editorCanvas');
            if (editorCanvas) {
                centerView(editorCanvas);
            }
        });
    }
    
    // Обработчик изменения высоты потолков в мобильной версии
    const mobileCeilingHeight = getElementSafe('mobileCeilingHeight');
    if (mobileCeilingHeight) {
        mobileCeilingHeight.addEventListener('change', function() {
            const ceilingHeight = getElementSafe('ceilingHeight');
            if (ceilingHeight) {
                ceilingHeight.value = this.value;
            }
            updateProjectSummary();
            calculateCost();
        });
    }
    
    // Синхронизация значений высоты потолков
    const ceilingHeight = getElementSafe('ceilingHeight');
    if (ceilingHeight) {
        ceilingHeight.addEventListener('change', function() {
            const mobileCeilingHeight = getElementSafe('mobileCeilingHeight');
            if (mobileCeilingHeight) {
                mobileCeilingHeight.value = this.value;
            }
        });
    }
    
    // Обработчики для плавающих кнопок
    const fabProperties = getElementSafe('fabProperties');
    const fabSummary = getElementSafe('fabSummary');
    const fabReceipt = getElementSafe('fabReceipt');
    const fabTop = getElementSafe('fabTop');
    
    if (fabProperties) {
        fabProperties.addEventListener('click', () => {
            const state = PlanPomesheniy.getState();
            if (state.selectedElementObj) {
                showMobilePanel('properties');
            } else {
                showNotification('Выберите элемент для просмотра свойств');
            }
        });
    }
    
    if (fabSummary) {
        fabSummary.addEventListener('click', () => {
            showMobilePanel('summary');
        });
    }
    
    if (fabReceipt) {
        fabReceipt.addEventListener('click', () => {
            const receiptContainer = getElementSafe('receiptContainer');
            if (receiptContainer) {
                receiptContainer.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    if (fabTop) {
        fabTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Обработчики для мобильной панели
    const overlay = getElementSafe('mobilePanelOverlay');
    const mobilePanel = getElementSafe('mobilePanel');
    const closeButton = mobilePanel ? mobilePanel.querySelector('.close-mobile-panel') : null;
    
    if (overlay) {
        overlay.addEventListener('click', closeMobilePanel);
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', closeMobilePanel);
    }
    
    // Предотвращаем закрытие при клике на саму панель
    if (mobilePanel) {
        mobilePanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

// Показ мобильной панели
function showMobilePanel(panelType) {
    const overlay = getElementSafe('mobilePanelOverlay');
    const panel = getElementSafe('mobilePanel');
    const panelContent = getElementSafe('mobilePanelContent');
    const panelTitle = getElementSafe('mobilePanelTitle');
    
    if (!overlay || !panel || !panelContent || !panelTitle) {
        console.error('Мобильные элементы не найдены');
        return;
    }
    
    // Заполняем контент в зависимости от типа панели
    switch(panelType) {
        case 'tools':
            panelTitle.innerHTML = '<i class="fas fa-tools"></i> Инструменты';
            // Копируем содержимое из десктопной панели инструментов
            const toolsContent = document.querySelector('.tools-panel .panel-content');
            if (toolsContent) {
                panelContent.innerHTML = toolsContent.innerHTML;
            }
            break;
            
        case 'properties':
            panelTitle.innerHTML = '<i class="fas fa-cog"></i> Свойства';
            const state = PlanPomesheniy.getState();
            if (state.selectedElementObj) {
                if (state.selectedElementObj.type === 'room') {
                    panelContent.innerHTML = `
                        <div class="property-group">
                            <h3><i class="fas fa-door-open"></i> Свойства комнаты</h3>
                            <div class="form-group">
                                <label for="mobileRoomName">Название:</label>
                                <input type="text" id="mobileRoomName" value="${escapeHTML(state.selectedElementObj.name)}">
                            </div>
                            <div class="form-group">
                                <label for="mobileRoomWidth">Ширина (м):</label>
                                <input type="number" id="mobileRoomWidth" min="1.0" max="20.0" step="0.1" value="${(state.selectedElementObj.width / state.scale).toFixed(1)}">
                            </div>
                            <div class="form-group">
                                <label for="mobileRoomHeight">Длина (м):</label>
                                <input type="number" id="mobileRoomHeight" min="1.0" max="20.0" step="0.1" value="${(state.selectedElementObj.height / state.scale).toFixed(1)}">
                            </div>
                            <div class="form-group">
                                <label>Отделка стен:</label>
                                <div class="checkbox-group">
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="mobilePlaster" ${state.selectedElementObj.plaster ? 'checked' : ''}>
                                        <label for="mobilePlaster">Стартовая штукатурка</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="mobileArmoring" ${state.selectedElementObj.armoring ? 'checked' : ''}>
                                        <label for="mobileArmoring">Армирование сеткой</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="mobilePuttyWallpaper" ${state.selectedElementObj.puttyWallpaper ? 'checked' : ''}>
                                        <label for="mobilePuttyWallpaper">Шпаклевка (под обои)</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="mobilePuttyPaint" ${state.selectedElementObj.puttyPaint ? 'checked' : ''}>
                                        <label for="mobilePuttyPaint">Шпаклевка (под покраску)</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="mobilePainting" ${state.selectedElementObj.painting ? 'checked' : ''} ${state.selectedElementObj.puttyWallpaper ? 'disabled' : ''}>
                                        <label for="mobilePainting">Покраска</label>
                                    </div>
                                </div>
                            </div>
                            <button id="mobileApplyRoomChanges" class="btn-primary"><i class="fas fa-check"></i> Применить изменения</button>
                            <div class="divider"></div>
                            <button class="btn-danger" id="mobileDeleteRoom"><i class="fas fa-trash"></i> Удалить комнату</button>
                        </div>
                    `;
                } else if (state.selectedElementObj.type === 'window') {
                    panelContent.innerHTML = `
                        <div class="property-group">
                            <h3><i class="fas fa-square"></i> Свойства окна</h3>
                            <div class="form-group">
                                <label for="mobileWindowWidth">Ширина (м):</label>
                                <input type="number" id="mobileWindowWidth" min="0.5" max="3.0" step="0.1" value="${state.selectedElementObj.width}">
                            </div>
                            <div class="form-group">
                                <label for="mobileWindowHeight">Высота (м):</label>
                                <input type="number" id="mobileWindowHeight" min="0.5" max="3.0" step="0.1" value="${state.selectedElementObj.height}">
                            </div>
                            <div class="form-group">
                                <label for="mobileWindowSlopes">Откосы:</label>
                                <select id="mobileWindowSlopes">
                                    <option value="with" ${state.selectedElementObj.slopes === 'with' ? 'selected' : ''}>С откосами</option>
                                    <option value="with_net" ${state.selectedElementObj.slopes === 'with_net' ? 'selected' : ''}>С откосами и сеткой</option>
                                    <option value="without" ${state.selectedElementObj.slopes === 'without' ? 'selected' : ''}>Без откосов</option>
                                </select>
                            </div>
                            <button id="mobileApplyWindowChanges" class="btn-primary"><i class="fas fa-check"></i> Применить изменения</button>
                            <div class="divider"></div>
                            <button class="btn-danger" id="mobileDeleteWindow"><i class="fas fa-trash"></i> Удалить окно</button>
                        </div>
                    `;
                } else if (state.selectedElementObj.type === 'door') {
                    panelContent.innerHTML = `
                        <div class="property-group">
                            <h3><i class="fas fa-door-open"></i> Свойства двери</h3>
                            <div class="form-group">
                                <label for="mobileDoorWidth">Ширина (м):</label>
                                <input type="number" id="mobileDoorWidth" min="0.5" max="2.0" step="0.1" value="${state.selectedElementObj.width}">
                            </div>
                            <div class="form-group">
                                <label for="mobileDoorHeight">Высота (м):</label>
                                <input type="number" id="mobileDoorHeight" min="1.5" max="3.0" step="0.1" value="${state.selectedElementObj.height}">
                            </div>
                            <div class="form-group">
                                <label for="mobileDoorSlopes">Откосы:</label>
                                <select id="mobileDoorSlopes">
                                    <option value="with" ${state.selectedElementObj.slopes === 'with' ? 'selected' : ''}>С откосами</option>
                                    <option value="with_net" ${state.selectedElementObj.slopes === 'with_net' ? 'selected' : ''}>С откосами и сеткой</option>
                                    <option value="without" ${state.selectedElementObj.slopes === 'without' ? 'selected' : ''}>Без откосов</option>
                                </select>
                            </div>
                            <button id="mobileApplyDoorChanges" class="btn-primary"><i class="fas fa-check"></i> Применить изменения</button>
                            <div class="divider"></div>
                            <button class="btn-danger" id="mobileDeleteDoor"><i class="fas fa-trash"></i> Удалить дверь</button>
                        </div>
                    `;
                }
            } else {
                panelContent.innerHTML = '<p>Выберите элемент для редактирования свойств</p>';
            }
            break;
            
        case 'summary':
            panelTitle.innerHTML = '<i class="fas fa-chart-pie"></i> Сводка проекта';
            
            // Создаем содержимое сводки проекта
            let summaryHTML = `
                <div class="property-group">
                    <h3><i class="fas fa-chart-pie"></i> Сводка проекта</h3>
                    <div class="summary" id="mobileProjectSummary">
                        <div class="summary-item">
                            <span>Комнат:</span>
                            <span id="mobileRoomsCount">${document.getElementById('roomsCount') ? document.getElementById('roomsCount').textContent : '0'}</span>
                        </div>
                        <div class="summary-item">
                            <span>Окон:</span>
                            <span id="mobileWindowsCount">${document.getElementById('windowsCount') ? document.getElementById('windowsCount').textContent : '0'}</span>
                        </div>
                        <div class="summary-item">
                            <span>Дверей:</span>
                            <span id="mobileDoorsCount">${document.getElementById('doorsCount') ? document.getElementById('doorsCount').textContent : '0'}</span>
                        </div>
                        <div class="summary-item">
                            <span>Общая площадь стен:</span>
                            <span id="mobileTotalArea">${document.getElementById('totalArea') ? document.getElementById('totalArea').textContent : '0 м²'}</span>
                        </div>
                    </div>
                </div>
                <div class="property-group">
                    <h3><i class="fas fa-calculator"></i> Смета работ</h3>
                    <div id="mobileEstimateResults">
            `;
            
            // Копируем содержимое сметы из десктопной версии
            const estimateResults = document.getElementById('estimateResults');
            if (estimateResults) {
                summaryHTML += estimateResults.innerHTML;
            } else {
                summaryHTML += '<div class="summary-item">Добавьте комнаты для расчета стоимости</div>';
            }
            
            summaryHTML += `
                    </div>
                </div>
            `;
            
            panelContent.innerHTML = summaryHTML;
            break;
    }
    
    // Показываем панель
    overlay.style.display = 'block';
    panel.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Переинициализируем обработчики событий для элементов внутри панели
    initMobilePanelEvents();
}

// Закрытие мобильной панели
function closeMobilePanel() {
    const overlay = getElementSafe('mobilePanelOverlay');
    const panel = getElementSafe('mobilePanel');
    
    if (overlay) overlay.style.display = 'none';
    if (panel) panel.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Инициализация событий мобильной панели
function initMobilePanelEvents() {
    // Обработчики для комнаты
    const mobileApplyRoomChanges = getElementSafe('mobileApplyRoomChanges');
    const state = PlanPomesheniy.getState();
    
    if (mobileApplyRoomChanges && state.selectedElementObj && state.selectedElementObj.type === 'room') {
        mobileApplyRoomChanges.onclick = () => {
            const mobileRoomName = getElementSafe('mobileRoomName');
            const mobileRoomWidth = getElementSafe('mobileRoomWidth');
            const mobileRoomHeight = getElementSafe('mobileRoomHeight');
            const mobilePlaster = getElementSafe('mobilePlaster');
            const mobileArmoring = getElementSafe('mobileArmoring');
            const mobilePuttyWallpaper = getElementSafe('mobilePuttyWallpaper');
            const mobilePuttyPaint = getElementSafe('mobilePuttyPaint');
            const mobilePainting = getElementSafe('mobilePainting');
            
            if (mobileRoomName && mobileRoomWidth && mobileRoomHeight) {
                const newName = mobileRoomName.value;
                const newWidth = parseFloat(mobileRoomWidth.value) * state.scale;
                const newHeight = parseFloat(mobileRoomHeight.value) * state.scale;
                
                // Сохраняем центр комнаты для плавного изменения размера
                const centerX = state.selectedElementObj.x + state.selectedElementObj.width / 2;
                const centerY = state.selectedElementObj.y + state.selectedElementObj.height / 2;
                
                state.selectedElementObj.name = newName;
                state.selectedElementObj.width = newWidth;
                state.selectedElementObj.height = newHeight;
                
                // Обновляем позицию для сохранения центра
                state.selectedElementObj.x = centerX - newWidth / 2;
                state.selectedElementObj.y = centerY - newHeight / 2;
                
                // Обновляем чекбоксы
                if (mobilePlaster) state.selectedElementObj.plaster = mobilePlaster.checked;
                if (mobileArmoring) state.selectedElementObj.armoring = mobileArmoring.checked;
                if (mobilePuttyWallpaper) state.selectedElementObj.puttyWallpaper = mobilePuttyWallpaper.checked;
                if (mobilePuttyPaint) state.selectedElementObj.puttyPaint = mobilePuttyPaint.checked;
                if (mobilePainting) state.selectedElementObj.painting = mobilePainting.checked;
                
                updateElementList();
                updateProjectSummary();
                calculateCost();
                const editorCanvas = getElementSafe('editorCanvas');
                if (editorCanvas) {
                    draw(editorCanvas, editorCanvas.getContext('2d'));
                }
                closeMobilePanel();
                showNotification('Изменения применены');
            }
        };
    }
    
    // Обработчики для окна
    const mobileApplyWindowChanges = getElementSafe('mobileApplyWindowChanges');
    if (mobileApplyWindowChanges && state.selectedElementObj && state.selectedElementObj.type === 'window') {
        mobileApplyWindowChanges.onclick = () => {
            const mobileWindowWidth = getElementSafe('mobileWindowWidth');
            const mobileWindowHeight = getElementSafe('mobileWindowHeight');
            const mobileWindowSlopes = getElementSafe('mobileWindowSlopes');
            
            if (mobileWindowWidth && mobileWindowHeight && mobileWindowSlopes) {
                state.selectedElementObj.width = parseFloat(mobileWindowWidth.value);
                state.selectedElementObj.height = parseFloat(mobileWindowHeight.value);
                state.selectedElementObj.slopes = mobileWindowSlopes.value;
                
                updateElementList();
                updateProjectSummary();
                calculateCost();
                const editorCanvas = getElementSafe('editorCanvas');
                if (editorCanvas) {
                    draw(editorCanvas, editorCanvas.getContext('2d'));
                }
                closeMobilePanel();
                showNotification('Изменения применены');
            }
        };
    }
    
    // Обработчики для двери
    const mobileApplyDoorChanges = getElementSafe('mobileApplyDoorChanges');
    if (mobileApplyDoorChanges && state.selectedElementObj && state.selectedElementObj.type === 'door') {
        mobileApplyDoorChanges.onclick = () => {
            const mobileDoorWidth = getElementSafe('mobileDoorWidth');
            const mobileDoorHeight = getElementSafe('mobileDoorHeight');
            const mobileDoorSlopes = getElementSafe('mobileDoorSlopes');
            
            if (mobileDoorWidth && mobileDoorHeight && mobileDoorSlopes) {
                state.selectedElementObj.width = parseFloat(mobileDoorWidth.value);
                state.selectedElementObj.height = parseFloat(mobileDoorHeight.value);
                state.selectedElementObj.slopes = mobileDoorSlopes.value;
                
                updateElementList();
                updateProjectSummary();
                calculateCost();
                const editorCanvas = getElementSafe('editorCanvas');
                if (editorCanvas) {
                    draw(editorCanvas, editorCanvas.getContext('2d'));
                }
                closeMobilePanel();
                showNotification('Изменения применены');
            }
        };
    }
    
    // Обработчики удаления
    const mobileDeleteRoom = getElementSafe('mobileDeleteRoom');
    if (mobileDeleteRoom) {
        mobileDeleteRoom.onclick = () => {
            if (state.selectedElementObj && state.selectedElementObj.type === 'room') {
                deleteRoom(state.selectedElementObj);
                closeMobilePanel();
            }
        };
    }
    
    const mobileDeleteWindow = getElementSafe('mobileDeleteWindow');
    if (mobileDeleteWindow) {
        mobileDeleteWindow.onclick = () => {
            if (state.selectedElementObj && state.selectedElementObj.type === 'window' && state.selectedRoom) {
                deleteWindow(state.selectedRoom, state.selectedElementObj);
                closeMobilePanel();
            }
        };
    }
    
    const mobileDeleteDoor = getElementSafe('mobileDeleteDoor');
    if (mobileDeleteDoor) {
        mobileDeleteDoor.onclick = () => {
            if (state.selectedElementObj && state.selectedElementObj.type === 'door' && state.selectedRoom) {
                deleteDoor(state.selectedRoom, state.selectedElementObj);
                closeMobilePanel();
            }
        };
    }
    
    // Обработчики для инструментов в мобильной панели
    const toolButtons = document.querySelectorAll('#mobilePanelContent .tool-btn');
    toolButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tool = this.dataset.tool;
            if (tool) {
                // Снимаем активный класс со всех кнопок
                toolButtons.forEach(btn => btn.classList.remove('active'));
                // Добавляем активный класс текущей кнопке
                this.classList.add('active');
                PlanPomesheniy.setTool(tool);
                
                const editorCanvas = getElementSafe('editorCanvas');
                if (editorCanvas) {
                    if (tool === 'select') {
                        editorCanvas.style.cursor = 'move';
                    } else if (tool === 'room') {
                        editorCanvas.style.cursor = 'crosshair';
                    } else if (tool === 'window' || tool === 'door') {
                        editorCanvas.style.cursor = 'cell';
                    }
                }
                
                closeMobilePanel();
                showNotification(`Инструмент: ${tool === 'select' ? 'Выбор' : tool === 'room' ? 'Комната' : tool === 'window' ? 'Окно' : 'Дверь'}`);
            }
        });
    });
}