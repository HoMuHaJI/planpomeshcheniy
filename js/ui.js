// Функции для работы с пользовательским интерфейсом

// Обновление списка элементов
function updateElementList() {
    const elementList = document.getElementById('elementList');
    elementList.innerHTML = '';
    
    if (rooms.length === 0) {
        elementList.innerHTML = '<div class="element-item">Нет элементов</div>';
        return;
    }
    
    rooms.forEach(room => {
        const item = document.createElement('div');
        item.className = 'element-item';
        if (selectedRoom && selectedRoom.id === room.id) {
            item.classList.add('selected');
        }
        item.innerHTML = `
            <span>${escapeHTML(room.name)} (${(room.width / scale).toFixed(1)}x${(room.height / scale).toFixed(1)} м)</span>
            <button class="delete-btn" data-id="${room.id}" data-type="room"><i class="fas fa-trash"></i></button>
        `;
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn') || e.target.parentElement?.classList.contains('delete-btn')) return;
            selectRoom(room);
            draw(document.getElementById('editorCanvas'), document.getElementById('editorCanvas').getContext('2d'));
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
            if (selectedElementObj && selectedElementObj.id === window.id) {
                windowItem.classList.add('selected');
            }
            windowItem.innerHTML = `
                <span style="margin-left: 20px;">Окно: ${window.width}x${window.height} м (${escapeHTML(window.wall)})</span>
                <button class="delete-btn" data-id="${window.id}" data-type="window"><i class="fas fa-trash"></i></button>
            `;
            windowItem.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-btn') || e.target.parentElement?.classList.contains('delete-btn')) return;
                selectedRoom = room;
                selectElement(window);
                draw(document.getElementById('editorCanvas'), document.getElementById('editorCanvas').getContext('2d'));
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
            if (selectedElementObj && selectedElementObj.id === door.id) {
                doorItem.classList.add('selected');
            }
            doorItem.innerHTML = `
                <span style="margin-left: 20px;">Дверь: ${door.width}x${door.height} м (${escapeHTML(door.wall)})</span>
                <button class="delete-btn" data-id="${door.id}" data-type="door"><i class="fas fa-trash"></i></button>
            `;
            doorItem.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-btn') || e.target.parentElement?.classList.contains('delete-btn')) return;
                selectedRoom = room;
                selectElement(door);
                draw(document.getElementById('editorCanvas'), document.getElementById('editorCanvas').getContext('2d'));
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
        rooms = rooms.filter(r => r.id !== room.id);
        if (selectedRoom && selectedRoom.id === room.id) {
            selectedRoom = null;
            selectedElementObj = null;
            hideAllProperties();
        }
        updateElementList();
        updateProjectSummary();
        calculateCost();
        centerView(editorCanvas);
        showNotification('Комната удалена');
    }
}

function deleteWindow(room, window) {
    if (confirm('Удалить окно?')) {
        room.windows = room.windows.filter(w => w.id !== window.id);
        if (selectedElementObj && selectedElementObj.id === window.id) {
            selectedElementObj = null;
            hideAllProperties();
        }
        updateElementList();
        updateProjectSummary();
        calculateCost();
        draw(document.getElementById('editorCanvas'), document.getElementById('editorCanvas').getContext('2d'));
        showNotification('Окно удалено');
    }
}

function deleteDoor(room, door) {
    if (confirm('Удалить дверь?')) {
        room.doors = room.doors.filter(d => d.id !== door.id);
        if (selectedElementObj && selectedElementObj.id === door.id) {
            selectedElementObj = null;
            hideAllProperties();
        }
        updateElementList();
        updateProjectSummary();
        calculateCost();
        draw(document.getElementById('editorCanvas'), document.getElementById('editorCanvas').getContext('2d'));
        showNotification('Дверь удалена');
    }
}

// Обновление сводки проекта
function updateProjectSummary() {
    let windowsCount = 0;
    let doorsCount = 0;
    let totalArea = 0;
    
    rooms.forEach(room => {
        windowsCount += room.windows.length;
        doorsCount += room.doors.length;
        
        const perimeter = ((room.width / scale) + (room.height / scale)) * 2;
        const ceilingHeight = parseFloat(document.getElementById('ceilingHeight').value);
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
    
    document.getElementById('roomsCount').textContent = rooms.length;
    document.getElementById('windowsCount').textContent = windowsCount;
    document.getElementById('doorsCount').textContent = doorsCount;
    document.getElementById('totalArea').textContent = `${totalArea.toFixed(1)} м²`;
}

// Обновление панели свойств в зависимости от выбранного элемента
function updatePropertiesPanel(element) {
    hideAllProperties();
    
    if (element.type === 'room') {
        roomProperties.style.display = 'block';
        document.getElementById('roomName').value = element.name;
        document.getElementById('roomWidth').value = (element.width / scale).toFixed(1);
        document.getElementById('roomHeightProp').value = (element.height / scale).toFixed(1);
        
        // Установка чекбоксов отделки
        plasterCheckbox.checked = element.plaster;
        armoringCheckbox.checked = element.armoring;
        puttyWallpaperCheckbox.checked = element.puttyWallpaper;
        puttyPaintCheckbox.checked = element.puttyPaint;
        paintingCheckbox.checked = element.painting;
        
        // Управление состоянием чекбокса покраски при загрузке
        if (element.puttyWallpaper) {
            paintingCheckbox.disabled = true;
        } else if (element.puttyPaint) {
            paintingCheckbox.disabled = false;
        } else {
            paintingCheckbox.disabled = true;
        }
        
        // Сброс состояния кнопки
        applyRoomChangesBtn.disabled = false; // Изменено: всегда активна
        
        // Обработчики изменений
        const roomInputs = ['roomName', 'roomWidth', 'roomHeightProp'];
        roomInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            // Удаляем старые обработчики
            input.removeEventListener('input', handleRoomInputChange);
            input.removeEventListener('change', handleRoomInputChange);
            // Добавляем новые
            input.addEventListener('input', handleRoomInputChange);
            input.addEventListener('change', handleRoomInputChange);
        });
        
        function handleRoomInputChange() {
            applyRoomChangesBtn.disabled = false;
        }
        
        // Обработчики чекбоксов
        const checkboxes = [plasterCheckbox, armoringCheckbox, puttyWallpaperCheckbox, puttyPaintCheckbox, paintingCheckbox];
        checkboxes.forEach(checkbox => {
            checkbox.removeEventListener('change', handleCheckboxChange);
            checkbox.addEventListener('change', handleCheckboxChange);
        });
        
        function handleCheckboxChange() {
            applyRoomChangesBtn.disabled = false;
            
            // Взаимное исключение для шпаклевки
            if (this === puttyWallpaperCheckbox && this.checked) {
                puttyPaintCheckbox.checked = false;
                paintingCheckbox.checked = false;
                paintingCheckbox.disabled = true;
            } else if (this === puttyPaintCheckbox && this.checked) {
                puttyWallpaperCheckbox.checked = false;
                paintingCheckbox.disabled = false;
            } else if (this === puttyWallpaperCheckbox && !this.checked) {
                paintingCheckbox.disabled = false;
            } else if (this === puttyPaintCheckbox && !this.checked) {
                paintingCheckbox.checked = false;
                paintingCheckbox.disabled = true;
            }
            
            // Если сняли штукатурку, снимаем и армирование
            if (this === plasterCheckbox && !this.checked) {
                armoringCheckbox.checked = false;
                puttyWallpaperCheckbox.checked = false;
                puttyPaintCheckbox.checked = false;
                paintingCheckbox.checked = false;
                paintingCheckbox.disabled = true;
            }
            
            // Если выбрана шпаклевка под обои, снимаем покраску
            if (this === puttyWallpaperCheckbox && this.checked) {
                paintingCheckbox.checked = false;
            }
        }
        
        // Обработчик кнопки применения изменений
        applyRoomChangesBtn.onclick = () => {
            const newWidth = parseFloat(document.getElementById('roomWidth').value) * scale;
            const newHeight = parseFloat(document.getElementById('roomHeightProp').value) * scale;
            
            // Сохраняем центр комнаты для плавного изменения размера
            const centerX = element.x + element.width / 2;
            const centerY = element.y + element.height / 2;
            
            element.name = document.getElementById('roomName').value;
            element.width = newWidth;
            element.height = newHeight;
            
            // Обновляем позицию для сохранения центра
            element.x = centerX - newWidth / 2;
            element.y = centerY - newHeight / 2;
            
            element.plaster = plasterCheckbox.checked;
            element.armoring = armoringCheckbox.checked;
            element.puttyWallpaper = puttyWallpaperCheckbox.checked;
            element.puttyPaint = puttyPaintCheckbox.checked;
            element.painting = paintingCheckbox.checked;
            
            applyRoomChangesBtn.disabled = true;
            updateElementList();
            updateProjectSummary();
            calculateCost();
            draw(document.getElementById('editorCanvas'), document.getElementById('editorCanvas').getContext('2d'));
            showNotification('Изменения применены');
        };
        
        document.getElementById('deleteRoom').onclick = () => {
            deleteRoom(element);
        };
    } else if (element.type === 'window') {
        windowProperties.style.display = 'block';
        document.getElementById('windowWidth').value = element.width;
        document.getElementById('windowHeight').value = element.height;
        document.getElementById('windowWall').value = element.wall;
        document.getElementById('windowPosition').value = element.position;
        document.getElementById('windowPositionValue').textContent = `${element.position}%`;
        document.getElementById('windowSlopes').value = element.slopes;
        
        // Сброс состояния кнопки
        applyWindowChangesBtn.disabled = true;
        
        // Обработчики изменений
        const windowInputs = ['windowWidth', 'windowHeight', 'windowWall', 'windowPosition', 'windowSlopes'];
        windowInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            input.removeEventListener('input', windowInputHandler);
            input.addEventListener('input', windowInputHandler);
        });
        
        function windowInputHandler(e) {
            applyWindowChangesBtn.disabled = false;
            if (e.target.id === 'windowPosition') {
                document.getElementById('windowPositionValue').textContent = `${document.getElementById('windowPosition').value}%`;
            }
        }
        
        applyWindowChangesBtn.onclick = () => {
            element.width = parseFloat(document.getElementById('windowWidth').value);
            element.height = parseFloat(document.getElementById('windowHeight').value);
            element.wall = document.getElementById('windowWall').value;
            element.position = parseInt(document.getElementById('windowPosition').value);
            element.slopes = document.getElementById('windowSlopes').value;
            
            applyWindowChangesBtn.disabled = true;
            updateElementList();
            updateProjectSummary();
            calculateCost();
            draw(document.getElementById('editorCanvas'), document.getElementById('editorCanvas').getContext('2d'));
            showNotification('Изменения применены');
        };
        
        document.getElementById('deleteWindow').onclick = () => {
            if (selectedRoom) {
                deleteWindow(selectedRoom, element);
            }
        };
    } else if (element.type === 'door') {
        doorProperties.style.display = 'block';
        document.getElementById('doorWidth').value = element.width;
        document.getElementById('doorHeight').value = element.height;
        document.getElementById('doorWall').value = element.wall;
        document.getElementById('doorPosition').value = element.position;
        document.getElementById('doorPositionValue').textContent = `${element.position}%`;
        document.getElementById('doorSlopes').value = element.slopes;
        
        // Сброс состояния кнопки
        applyDoorChangesBtn.disabled = true;
        
        // Обработчики изменений
        const doorInputs = ['doorWidth', 'doorHeight', 'doorWall', 'doorPosition', 'doorSlopes'];
        doorInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            input.removeEventListener('input', doorInputHandler);
            input.addEventListener('input', doorInputHandler);
        });
        
        function doorInputHandler(e) {
            applyDoorChangesBtn.disabled = false;
            if (e.target.id === 'doorPosition') {
                document.getElementById('doorPositionValue').textContent = `${document.getElementById('doorPosition').value}%`;
            }
        }
        
        applyDoorChangesBtn.onclick = () => {
            element.width = parseFloat(document.getElementById('doorWidth').value);
            element.height = parseFloat(document.getElementById('doorHeight').value);
            element.wall = document.getElementById('doorWall').value;
            element.position = parseInt(document.getElementById('doorPosition').value);
            element.slopes = document.getElementById('doorSlopes').value;
            
            applyDoorChangesBtn.disabled = true;
            updateElementList();
            updateProjectSummary();
            calculateCost();
            draw(document.getElementById('editorCanvas'), document.getElementById('editorCanvas').getContext('2d'));
            showNotification('Изменения применены');
        };
        
        document.getElementById('deleteDoor').onclick = () => {
            if (selectedRoom) {
                deleteDoor(selectedRoom, element);
            }
        };
    }
    
    selectedElement.textContent = `${element.type === 'room' ? 'Комната' : element.type === 'window' ? 'Окно' : 'Дверь'}: ${escapeHTML(element.name || '')}`;
}

// Скрытие всех панелей свойств
function hideAllProperties() {
    roomProperties.style.display = 'none';
    doorProperties.style.display = 'none';
    windowProperties.style.display = 'none';
    selectedElement.textContent = 'Не выбран';
}

// Функции для отправки сметы
function initSharingButtons() {
    const sendWhatsAppBtn = document.getElementById('sendWhatsApp');
    const copyReceiptBtn = document.getElementById('copyReceipt');
    const printReceiptBtn = document.getElementById('printReceipt');
    const feedbackBtn = document.getElementById('feedbackBtn');
    
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
    let text = `🧾 СМЕТА РАБОТ\n`;
    text += `📅 ${new Date().toLocaleDateString()}\n`;
    text += `📍 Расчет для г. Симферополь\n\n`;
    
    let totalCost = 0;
    
    rooms.forEach(room => {
        const roomArea = (room.width / scale * room.height / scale).toFixed(1);
        text += `🏠 ${escapeHTML(room.name)} (${(room.width / scale).toFixed(1)}×${(room.height / scale).toFixed(1)} м)\n`;
        text += `📐 Площадь: ${roomArea} м²\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        
        const ceilingHeight = parseFloat(document.getElementById('ceilingHeight').value);
        const perimeter = ((room.width / scale) + (room.height / scale)) * 2;
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
    text += `• Комнат: ${document.getElementById('roomsCount').textContent}\n`;
    text += `• Окон: ${document.getElementById('windowsCount').textContent}\n`;
    text += `• Дверей: ${document.getElementById('doorsCount').textContent}\n`;
    text += `• Общая площадь стен: ${document.getElementById('totalArea').textContent}\n`;
    text += `• Высота потолков: ${document.getElementById('ceilingHeight').value} м\n\n`;
    
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

// Функция для печати смета
function printReceipt() {
    window.print();
    showNotification('Подготовка к печати сметы');
}

// Функции для модального окна обратной связи
function openFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Функция для отправки формы обратной связи
async function submitFeedbackForm(formData) {
    const TELEGRAM_BOT_TOKEN = '8142957488:AAGDsEIsGdtrCX-ZyvOD7nJjaVVD3_YIFks';
    const TELEGRAM_CHAT_ID = '-1001701431569';
    
    const receiptText = getReceiptText();
    
    const message = `
📋 *НОВАЯ ЗАЯВКА НА КОНСУЛЬТАЦИЮ*

👤 *Клиент:* ${formData.clientName}
📞 *Контакты:* ${formData.clientContact}
🏠 *Тип помещения:* ${formData.propertyType}
📏 *Площадь:* ${formData.totalArea || 'Не указана'} м²

💬 *Дополнительная информация:*
${formData.additionalInfo || 'Не указана'}

━━━━━━━━━━━━━━━━━━━━
${receiptText}
    `;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        
        const result = await response.json();
        
        if (!result.ok) {
            console.error('Ошибка Telegram API:', result);
            const responsePlain = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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

// Показ мобильной панели
function showMobilePanel(panelType) {
    const overlay = document.getElementById('mobilePanelOverlay');
    const panel = document.getElementById('mobilePanel');
    const panelContent = document.getElementById('mobilePanelContent');
    const panelTitle = document.getElementById('mobilePanelTitle');
    
    if (!overlay || !panel || !panelContent) {
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
            if (selectedElementObj) {
                if (selectedElementObj.type === 'room') {
                    panelContent.innerHTML = `
                        <div class="property-group">
                            <h3><i class="fas fa-door-open"></i> Свойства комнаты</h3>
                            <div class="form-group">
                                <label for="mobileRoomName">Название:</label>
                                <input type="text" id="mobileRoomName" value="${escapeHTML(selectedElementObj.name)}">
                            </div>
                            <div class="form-group">
                                <label for="mobileRoomWidth">Ширина (м):</label>
                                <input type="number" id="mobileRoomWidth" min="1.0" max="20.0" step="0.1" value="${(selectedElementObj.width / scale).toFixed(1)}">
                            </div>
                            <div class="form-group">
                                <label for="mobileRoomHeight">Длина (м):</label>
                                <input type="number" id="mobileRoomHeight" min="1.0" max="20.0" step="0.1" value="${(selectedElementObj.height / scale).toFixed(1)}">
                            </div>
                            <div class="form-group">
                                <label>Отделка стен:</label>
                                <div class="checkbox-group">
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="mobilePlaster" ${selectedElementObj.plaster ? 'checked' : ''}>
                                        <label for="mobilePlaster">Стартовая штукатурка</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="mobileArmoring" ${selectedElementObj.armoring ? 'checked' : ''}>
                                        <label for="mobileArmoring">Армирование сеткой</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="mobilePuttyWallpaper" ${selectedElementObj.puttyWallpaper ? 'checked' : ''}>
                                        <label for="mobilePuttyWallpaper">Шпаклевка (под обои)</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="mobilePuttyPaint" ${selectedElementObj.puttyPaint ? 'checked' : ''}>
                                        <label for="mobilePuttyPaint">Шпаклевка (под покраску)</label>
                                    </div>
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="mobilePainting" ${selectedElementObj.painting ? 'checked' : ''} ${selectedElementObj.puttyWallpaper ? 'disabled' : ''}>
                                        <label for="mobilePainting">Покраска</label>
                                    </div>
                                </div>
                            </div>
                            <button id="mobileApplyRoomChanges" class="btn-primary"><i class="fas fa-check"></i> Применить изменения</button>
                            <div class="divider"></div>
                            <button class="btn-danger" id="mobileDeleteRoom"><i class="fas fa-trash"></i> Удалить комнату</button>
                        </div>
                    `;
                } else if (selectedElementObj.type === 'window') {
                    panelContent.innerHTML = `
                        <div class="property-group">
                            <h3><i class="fas fa-square"></i> Свойства окна</h3>
                            <div class="form-group">
                                <label for="mobileWindowWidth">Ширина (м):</label>
                                <input type="number" id="mobileWindowWidth" min="0.5" max="3.0" step="0.1" value="${selectedElementObj.width}">
                            </div>
                            <div class="form-group">
                                <label for="mobileWindowHeight">Высота (м):</label>
                                <input type="number" id="mobileWindowHeight" min="0.5" max="3.0" step="0.1" value="${selectedElementObj.height}">
                            </div>
                            <div class="form-group">
                                <label for="mobileWindowSlopes">Откосы:</label>
                                <select id="mobileWindowSlopes">
                                    <option value="with" ${selectedElementObj.slopes === 'with' ? 'selected' : ''}>С откосами</option>
                                    <option value="with_net" ${selectedElementObj.slopes === 'with_net' ? 'selected' : ''}>С откосами и сеткой</option>
                                    <option value="without" ${selectedElementObj.slopes === 'without' ? 'selected' : ''}>Без откосов</option>
                                </select>
                            </div>
                            <button id="mobileApplyWindowChanges" class="btn-primary"><i class="fas fa-check"></i> Применить изменения</button>
                            <div class="divider"></div>
                            <button class="btn-danger" id="mobileDeleteWindow"><i class="fas fa-trash"></i> Удалить окно</button>
                        </div>
                    `;
                } else if (selectedElementObj.type === 'door') {
                    panelContent.innerHTML = `
                        <div class="property-group">
                            <h3><i class="fas fa-door-open"></i> Свойства двери</h3>
                            <div class="form-group">
                                <label for="mobileDoorWidth">Ширина (м):</label>
                                <input type="number" id="mobileDoorWidth" min="0.5" max="2.0" step="0.1" value="${selectedElementObj.width}">
                            </div>
                            <div class="form-group">
                                <label for="mobileDoorHeight">Высота (м):</label>
                                <input type="number" id="mobileDoorHeight" min="1.5" max="3.0" step="0.1" value="${selectedElementObj.height}">
                            </div>
                            <div class="form-group">
                                <label for="mobileDoorSlopes">Откосы:</label>
                                <select id="mobileDoorSlopes">
                                    <option value="with" ${selectedElementObj.slopes === 'with' ? 'selected' : ''}>С откосами</option>
                                    <option value="with_net" ${selectedElementObj.slopes === 'with_net' ? 'selected' : ''}>С откосами и сеткой</option>
                                    <option value="without" ${selectedElementObj.slopes === 'without' ? 'selected' : ''}>Без откосов</option>
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
                            <span id="mobileRoomsCount">${document.getElementById('roomsCount').textContent}</span>
                        </div>
                        <div class="summary-item">
                            <span>Окон:</span>
                            <span id="mobileWindowsCount">${document.getElementById('windowsCount').textContent}</span>
                        </div>
                        <div class="summary-item">
                            <span>Дверей:</span>
                            <span id="mobileDoorsCount">${document.getElementById('doorsCount').textContent}</span>
                        </div>
                        <div class="summary-item">
                            <span>Общая площадь стен:</span>
                            <span id="mobileTotalArea">${document.getElementById('totalArea').textContent}</span>
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
    const overlay = document.getElementById('mobilePanelOverlay');
    const panel = document.getElementById('mobilePanel');
    
    overlay.style.display = 'none';
    panel.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Инициализация событий мобильной панели
function initMobilePanelEvents() {
    // Обработчики для чекбоксов отделки в мобильной версии
    const mobilePlaster = document.getElementById('mobilePlaster');
    const mobileArmoring = document.getElementById('mobileArmoring');
    const mobilePuttyWallpaper = document.getElementById('mobilePuttyWallpaper');
    const mobilePuttyPaint = document.getElementById('mobilePuttyPaint');
    const mobilePainting = document.getElementById('mobilePainting');

    if (mobilePuttyWallpaper && mobilePuttyPaint && mobilePainting) {
        mobilePuttyWallpaper.addEventListener('change', function() {
            if (this.checked) {
                mobilePuttyPaint.checked = false;
                mobilePainting.checked = false;
                mobilePainting.disabled = true;
            } else {
                mobilePainting.disabled = false;
            }
        });
        
        mobilePuttyPaint.addEventListener('change', function() {
            if (this.checked) {
                mobilePuttyWallpaper.checked = false;
                mobilePainting.disabled = false;
            } else {
                mobilePainting.checked = false;
                mobilePainting.disabled = true;
            }
        });
        
        mobilePlaster.addEventListener('change', function() {
            if (!this.checked) {
                mobileArmoring.checked = false;
                mobilePuttyWallpaper.checked = false;
                mobilePuttyPaint.checked = false;
                mobilePainting.checked = false;
                mobilePainting.disabled = true;
            }
        });
    }

    // Обработчики для чекбоксов отделки в мобильной панели
    const mobileCheckboxes = document.querySelectorAll('#mobilePanelContent input[type="checkbox"]');
    mobileCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (selectedElementObj && selectedElementObj.type === 'room') {
                // Обновляем свойства комнаты
                selectedElementObj.plaster = document.getElementById('plaster')?.checked || false;
                selectedElementObj.armoring = document.getElementById('armoring')?.checked || false;
                selectedElementObj.puttyWallpaper = document.getElementById('puttyWallpaper')?.checked || false;
                selectedElementObj.puttyPaint = document.getElementById('puttyPaint')?.checked || false;
                selectedElementObj.painting = document.getElementById('painting')?.checked || false;
                
                // Обновляем расчет стоимости
                updateProjectSummary();
                calculateCost();
                showNotification('Изменения применены');
            }
        });
    });

    // Обработчики для инструментов в мобильной панели
    const toolButtons = document.querySelectorAll('#mobilePanelContent .tool-btn');
    toolButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tool = button.dataset.tool;
            if (tool) {
                toolButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTool = tool;
                
                const editorCanvas = document.getElementById('editorCanvas');
                if (currentTool === 'select') {
                    editorCanvas.style.cursor = 'move';
                } else if (currentTool === 'room') {
                    editorCanvas.style.cursor = 'crosshair';
                } else if (currentTool === 'window' || currentTool === 'door') {
                    editorCanvas.style.cursor = 'cell';
                }
                
                // Закрываем панель после выбора инструмента
                closeMobilePanel();
            }
        });
    });
    
    // Обработчики для кнопок в мобильной панели
    const applyButtons = document.querySelectorAll('#mobilePanelContent #applyRoomChanges, #mobilePanelContent #applyWindowChanges, #mobilePanelContent #applyDoorChanges');
    applyButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeMobilePanel();
        });
    });
    
    // Обработчики для удаления элементов в мобильной панели
    const deleteButtons = document.querySelectorAll('#mobilePanelContent .btn-danger');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (selectedElementObj) {
                if (selectedElementObj.type === 'room') {
                    deleteRoom(selectedElementObj);
                } else if (selectedElementObj.type === 'window') {
                    if (selectedRoom) {
                        deleteWindow(selectedRoom, selectedElementObj);
                    }
                } else if (selectedElementObj.type === 'door') {
                    if (selectedRoom) {
                        deleteDoor(selectedRoom, selectedElementObj);
                    }
                }
                closeMobilePanel();
            }
        });
    });
}

// Инициализация мобильного интерфейса
function initMobileUI() {
    console.log('Инициализация мобильного интерфейса');
    
    // Показываем мобильные элементы
    const mobileToolsContainer = document.querySelector('.mobile-tools-container');
    const fabContainer = document.getElementById('fabContainer');
    const mobilePanelOverlay = document.getElementById('mobilePanelOverlay');
    const mobilePanel = document.getElementById('mobilePanel');
    
    if (mobileToolsContainer) {
        mobileToolsContainer.style.display = 'block';
    }
    
    if (fabContainer) {
        fabContainer.style.display = 'flex';
    }
    
    // Инициализация обработчиков мобильного интерфейса
    initMobileEventHandlers();
    
    // Синхронизация высоты потолков
    const ceilingHeight = document.getElementById('ceilingHeight');
    const mobileCeilingHeight = document.getElementById('mobileCeilingHeight');
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
                currentTool = tool;
                
                const editorCanvas = document.getElementById('editorCanvas');
                if (currentTool === 'select') {
                    editorCanvas.style.cursor = 'move';
                } else if (currentTool === 'room') {
                    editorCanvas.style.cursor = 'crosshair';
                } else if (currentTool === 'window' || currentTool === 'door') {
                    editorCanvas.style.cursor = 'cell';
                }
                
                showNotification(`Инструмент: ${tool === 'select' ? 'Выбор' : tool === 'room' ? 'Комната' : tool === 'window' ? 'Окно' : 'Дверь'}`);
            }
        });
    });
    
    // Обработчики для мобильных кнопок управления
    const mobileNewProject = document.getElementById('mobileNewProject');
    const mobileClearAll = document.getElementById('mobileClearAll');
    const mobileZoomIn = document.getElementById('mobileZoomIn');
    const mobileZoomOut = document.getElementById('mobileZoomOut');
    const mobileCenterView = document.getElementById('mobileCenterView');
    
    if (mobileNewProject) {
        mobileNewProject.addEventListener('click', () => {
            if (rooms.length > 0 && !confirm('Вы уверены, что хотите создать новый проект? Все несохраненные данные будут потеряны.')) {
                return;
            }
            rooms = [];
            selectedRoom = null;
            selectedElementObj = null;
            roomCounter = 1;
            hideAllProperties();
            updateElementList();
            updateProjectSummary();
            calculateCost();
            centerView(editorCanvas);
            showNotification('Новый проект создан');
        });
    }
    
    if (mobileClearAll) {
        mobileClearAll.addEventListener('click', () => {
            if (rooms.length === 0) {
                showNotification('Нет комнат для удаления');
                return;
            }
            
            if (confirm('Вы уверены, что хотите удалить все комнаты?')) {
                rooms = [];
                selectedRoom = null;
                selectedElementObj = null;
                roomCounter = 1;
                hideAllProperties();
                updateElementList();
                updateProjectSummary();
                calculateCost();
                centerView(editorCanvas);
                showNotification('Все комнаты удалены');
            }
        });
    }
    
    if (mobileZoomIn) {
        mobileZoomIn.addEventListener('click', () => {
            zoom *= 1.2;
            zoom = Math.min(3, zoom);
            if (zoomLevel) zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
            draw(editorCanvas, editorCanvas.getContext('2d'));
        });
    }
    
    if (mobileZoomOut) {
        mobileZoomOut.addEventListener('click', () => {
            zoom /= 1.2;
            zoom = Math.max(0.1, zoom);
            if (zoomLevel) zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
            draw(editorCanvas, editorCanvas.getContext('2d'));
        });
    }
    
    if (mobileCenterView) {
        mobileCenterView.addEventListener('click', () => centerView(editorCanvas));
    }
    
    // Обработчик изменения высоты потолков в мобильной версии
    const mobileCeilingHeight = document.getElementById('mobileCeilingHeight');
    if (mobileCeilingHeight) {
        mobileCeilingHeight.addEventListener('change', function() {
            document.getElementById('ceilingHeight').value = this.value;
            updateProjectSummary();
            calculateCost();
        });
    }
    
    // Синхронизация значений высоты потолков
    const ceilingHeight = document.getElementById('ceilingHeight');
    if (ceilingHeight) {
        ceilingHeight.addEventListener('change', function() {
            const mobileCeilingHeight = document.getElementById('mobileCeilingHeight');
            if (mobileCeilingHeight) {
                mobileCeilingHeight.value = this.value;
            }
        });
    }
    
    // Обработчики для плавающих кнопок
    const fabProperties = document.getElementById('fabProperties');
    const fabSummary = document.getElementById('fabSummary');
    const fabReceipt = document.getElementById('fabReceipt');
    const fabTop = document.getElementById('fabTop');
    
    if (fabProperties) {
        fabProperties.addEventListener('click', () => {
            if (selectedElementObj) {
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
            document.getElementById('receiptContainer').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    if (fabTop) {
        fabTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Обработчики для мобильной панели
    const overlay = document.getElementById('mobilePanelOverlay');
    const mobilePanel = document.getElementById('mobilePanel');
    const closeButton = mobilePanel.querySelector('.close-mobile-panel');
    
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

function initMobilePanelEvents() {
    // Обработчики для комнаты
    const mobileApplyRoomChanges = document.getElementById('mobileApplyRoomChanges');
    if (mobileApplyRoomChanges && selectedElementObj && selectedElementObj.type === 'room') {
        mobileApplyRoomChanges.onclick = () => {
            const newName = document.getElementById('mobileRoomName').value;
            const newWidth = parseFloat(document.getElementById('mobileRoomWidth').value) * scale;
            const newHeight = parseFloat(document.getElementById('mobileRoomHeight').value) * scale;
            
            // Сохраняем центр комнаты для плавного изменения размера
            const centerX = selectedElementObj.x + selectedElementObj.width / 2;
            const centerY = selectedElementObj.y + selectedElementObj.height / 2;
            
            selectedElementObj.name = newName;
            selectedElementObj.width = newWidth;
            selectedElementObj.height = newHeight;
            
            // Обновляем позицию для сохранения центра
            selectedElementObj.x = centerX - newWidth / 2;
            selectedElementObj.y = centerY - newHeight / 2;
            
            // Обновляем чекбоксы
            selectedElementObj.plaster = document.getElementById('mobilePlaster').checked;
            selectedElementObj.armoring = document.getElementById('mobileArmoring').checked;
            selectedElementObj.puttyWallpaper = document.getElementById('mobilePuttyWallpaper').checked;
            selectedElementObj.puttyPaint = document.getElementById('mobilePuttyPaint').checked;
            selectedElementObj.painting = document.getElementById('mobilePainting').checked;
            
            updateElementList();
            updateProjectSummary();
            calculateCost();
            draw(document.getElementById('editorCanvas'), document.getElementById('editorCanvas').getContext('2d'));
            closeMobilePanel();
            showNotification('Изменения применены');
        };
    }
    
    // Обработчики для окна
    const mobileApplyWindowChanges = document.getElementById('mobileApplyWindowChanges');
    if (mobileApplyWindowChanges && selectedElementObj && selectedElementObj.type === 'window') {
        mobileApplyWindowChanges.onclick = () => {
            selectedElementObj.width = parseFloat(document.getElementById('mobileWindowWidth').value);
            selectedElementObj.height = parseFloat(document.getElementById('mobileWindowHeight').value);
            selectedElementObj.slopes = document.getElementById('mobileWindowSlopes').value;
            
            updateElementList();
            updateProjectSummary();
            calculateCost();
            draw(document.getElementById('editorCanvas'), document.getElementById('editorCanvas').getContext('2d'));
            closeMobilePanel();
            showNotification('Изменения применены');
        };
    }
    
    // Обработчики для двери
    const mobileApplyDoorChanges = document.getElementById('mobileApplyDoorChanges');
    if (mobileApplyDoorChanges && selectedElementObj && selectedElementObj.type === 'door') {
        mobileApplyDoorChanges.onclick = () => {
            selectedElementObj.width = parseFloat(document.getElementById('mobileDoorWidth').value);
            selectedElementObj.height = parseFloat(document.getElementById('mobileDoorHeight').value);
            selectedElementObj.slopes = document.getElementById('mobileDoorSlopes').value;
            
            updateElementList();
            updateProjectSummary();
            calculateCost();
            draw(document.getElementById('editorCanvas'), document.getElementById('editorCanvas').getContext('2d'));
            closeMobilePanel();
            showNotification('Изменения применены');
        };
    }
    
    // Обработчики удаления
    const mobileDeleteRoom = document.getElementById('mobileDeleteRoom');
    if (mobileDeleteRoom) {
        mobileDeleteRoom.onclick = () => {
            if (selectedElementObj && selectedElementObj.type === 'room') {
                deleteRoom(selectedElementObj);
                closeMobilePanel();
            }
        };
    }
    
    const mobileDeleteWindow = document.getElementById('mobileDeleteWindow');
    if (mobileDeleteWindow) {
        mobileDeleteWindow.onclick = () => {
            if (selectedElementObj && selectedElementObj.type === 'window' && selectedRoom) {
                deleteWindow(selectedRoom, selectedElementObj);
                closeMobilePanel();
            }
        };
    }
    
    const mobileDeleteDoor = document.getElementById('mobileDeleteDoor');
    if (mobileDeleteDoor) {
        mobileDeleteDoor.onclick = () => {
            if (selectedElementObj && selectedElementObj.type === 'door' && selectedRoom) {
                deleteDoor(selectedRoom, selectedElementObj);
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
                currentTool = tool;
                
                const editorCanvas = document.getElementById('editorCanvas');
                if (currentTool === 'select') {
                    editorCanvas.style.cursor = 'move';
                } else if (currentTool === 'room') {
                    editorCanvas.style.cursor = 'crosshair';
                } else if (currentTool === 'window' || currentTool === 'door') {
                    editorCanvas.style.cursor = 'cell';
                }
                
                closeMobilePanel();
                showNotification(`Инструмент: ${tool === 'select' ? 'Выбор' : tool === 'room' ? 'Комната' : tool === 'window' ? 'Окно' : 'Дверь'}`);
            }
        });
    });
}

// Инициализация пользовательского интерфейса
function initUI() {
    console.log('Инициализация UI');
    
    // Получение ссылок на DOM элементы
    window.toolButtons = document.querySelectorAll('.tool-btn');
    window.cursorPosition = document.getElementById('cursorPosition');
    window.selectedElement = document.getElementById('selectedElement');
    window.zoomLevel = document.getElementById('zoomLevel');
    window.receiptContainer = document.getElementById('receiptContainer');
    window.receiptContent = document.getElementById('receiptContent');
    
    // Панели свойств
    window.roomProperties = document.getElementById('roomProperties');
    window.doorProperties = document.getElementById('doorProperties');
    window.windowProperties = document.getElementById('windowProperties');
    window.costEstimate = document.getElementById('costEstimate');
    
    // Кнопки управления
    window.newProjectBtn = document.getElementById('newProject');
    window.clearAllBtn = document.getElementById('clearAll');
    window.zoomInBtn = document.getElementById('zoomIn');
    window.zoomOutBtn = document.getElementById('zoomOut');
    window.centerViewBtn = document.getElementById('centerView');
    
    // Кнопки применения изменений
    window.applyRoomChangesBtn = document.getElementById('applyRoomChanges');
    window.applyWindowChangesBtn = document.getElementById('applyWindowChanges');
    window.applyDoorChangesBtn = document.getElementById('applyDoorChanges');
    
    // Элементы управления окнами и дверями
    window.windowPositionSlider = document.getElementById('windowPosition');
    window.windowPositionValue = document.getElementById('windowPositionValue');
    window.doorPositionSlider = document.getElementById('doorPosition');
    window.doorPositionValue = document.getElementById('doorPositionValue');
    
    // Чекбоксы отделки
    window.plasterCheckbox = document.getElementById('plaster');
    window.armoringCheckbox = document.getElementById('armoring');
    window.puttyWallpaperCheckbox = document.getElementById('puttyWallpaper');
    window.puttyPaintCheckbox = document.getElementById('puttyPaint');
    window.paintingCheckbox = document.getElementById('painting');
    
    // Инициализация кнопок отправки
    initSharingButtons();
    
    // Инициализация модального окна обратной связи
    initFeedbackModal();
    
    // Инициализация мобильного интерфейса
    if (window.innerWidth <= 576) {
        initMobileUI();
    }
    
    // Обработчик изменения размера окна
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 576) {
            initMobileUI();
        } else {
            // Скрываем мобильные элементы на десктопе
            const mobileToolsContainer = document.querySelector('.mobile-tools-container');
            const fabContainer = document.getElementById('fabContainer');
            if (mobileToolsContainer) mobileToolsContainer.style.display = 'none';
            if (fabContainer) fabContainer.style.display = 'none';
        }
    });
}

// Инициализация модального окна обратной связи
function initFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    const closeBtn = document.querySelector('.close-modal');
    const feedbackForm = document.getElementById('feedbackForm');
    
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
    const editorCanvas = document.getElementById('editorCanvas');
    
    if (!editorCanvas) return;
    
    // Обработчики инструментов
    if (toolButtons) {
        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                toolButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTool = button.dataset.tool;
                
                // Изменение курсора
                if (currentTool === 'select') {
                    editorCanvas.style.cursor = 'move';
                } else if (currentTool === 'room') {
                    editorCanvas.style.cursor = 'crosshair';
                } else if (currentTool === 'window' || currentTool === 'door') {
                    editorCanvas.style.cursor = 'cell';
                }
            });
        });
    }
    
    // Обработчик кнопки нового проекта
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => {
            rooms = [];
            selectedRoom = null;
            selectedElementObj = null;
            roomCounter = 1;
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
            if (confirm('Вы уверены, что хотите удалить все комнаты?')) {
                rooms = [];
                selectedRoom = null;
                selectedElementObj = null;
                roomCounter = 1;
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
            zoom *= 1.2;
            zoom = Math.min(3, zoom);
            zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
            draw(editorCanvas, editorCanvas.getContext('2d'));
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            zoom /= 1.2;
            zoom = Math.max(0.1, zoom);
            zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
            draw(editorCanvas, editorCanvas.getContext('2d'));
        });
    }
    
    // Обработчик кнопки центрирования
    if (centerViewBtn) {
        centerViewBtn.addEventListener('click', () => centerView(editorCanvas));
    }
    
    // Обработчик изменения высоты потолков
    const ceilingHeight = document.getElementById('ceilingHeight');
    if (ceilingHeight) {
        ceilingHeight.addEventListener('change', () => {
            updateProjectSummary();
            calculateCost();
        });
    }
}

// Обработка нажатия мыши
function handleMouseDown(e) {
    const editorCanvas = document.getElementById('editorCanvas');
    const rect = editorCanvas.getBoundingClientRect();
    const safeZoom = zoom > 0 ? zoom : 1;
    const x = (e.clientX - rect.left - viewOffsetX) / safeZoom;
    const y = (e.clientY - rect.top - viewOffsetY) / safeZoom;
    
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
    const rect = editorCanvas.getBoundingClientRect();
    const safeZoom = zoom > 0 ? zoom : 1;
    const x = (e.clientX - rect.left - viewOffsetX) / safeZoom;
    const y = (e.clientY - rect.top - viewOffsetY) / safeZoom;
    
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

// Обработка отпускания мыши
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
            
            const room = {
                id: generateId(),
                type: 'room',
                x: roomX,
                y: roomY,
                width: width,
                height: height,
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