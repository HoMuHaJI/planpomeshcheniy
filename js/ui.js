// Функции для работы с пользовательским интерфейсом

// Обновление списка элементов
function updateElementList() {
    const elementList = safeGetElement('elementList');
    if (!elementList) return;
    
    elementList.innerHTML = '';
    
    if (!rooms || rooms.length === 0) {
        elementList.innerHTML = '<div class="element-item">Нет элементов</div>';
        return;
    }
    
    rooms.forEach(room => {
        if (!room) return;
        
        const item = document.createElement('div');
        item.className = 'element-item';
        if (selectedRoom && selectedRoom.id === room.id) {
            item.classList.add('selected');
        }
        
        // Создаем строку с иконками выбранных работ
        let worksHtml = '';
        if (room.plaster) worksHtml += '<span class="work-indicator" style="background-color: #3498db;" title="Стартовая штукатурка"></span>';
        if (room.armoring) worksHtml += '<span class="work-indicator" style="background-color: #e67e22;" title="Армирование сеткой"></span>';
        if (room.puttyWallpaper) worksHtml += '<span class="work-indicator" style="background-color: #2ecc71;" title="Шпаклевка под обои"></span>';
        if (room.puttyPaint) worksHtml += '<span class="work-indicator" style="background-color: #9b59b6;" title="Шпаклевка под покраску"></span>';
        if (room.painting) worksHtml += '<span class="work-indicator" style="background-color: #e74c3c;" title="Покраска"></span>';
        
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>${escapeHTML(room.name || 'Комната')} (${(room.width / scale).toFixed(1)}x${(room.height / scale).toFixed(1)} м)</span>
                <div class="work-indicators">${worksHtml}</div>
            </div>
            <button class="delete-btn" data-id="${room.id}" data-type="room"><i class="fas fa-trash"></i></button>
        `;
        
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn') || e.target.parentElement?.classList.contains('delete-btn')) return;
            selectRoom(room);
            const canvas = safeGetElement('editorCanvas');
            if (canvas) {
                draw(canvas, canvas.getContext('2d'));
            }
            if (window.innerWidth <= 576) {
                showMobilePanel('properties');
            }
        });
        
        const deleteBtn = item.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteRoom(room);
            });
        }
        
        elementList.appendChild(item);
        
        // Добавляем окна комнаты
        if (room.windows && Array.isArray(room.windows)) {
            room.windows.forEach(window => {
                if (!window) return;
                
                // Определяем цвет индикатора откосов
                let slopesColor = '#888';
                let slopesText = 'Без откосов';
                if (window.slopes === 'with') {
                    slopesColor = '#4a6ee0';
                    slopesText = 'С откосами';
                } else if (window.slopes === 'with_net') {
                    slopesColor = '#ffc107';
                    slopesText = 'С откосами и сеткой';
                }
                
                const windowItem = document.createElement('div');
                windowItem.className = 'element-item';
                if (selectedElementObj && selectedElementObj.id === window.id) {
                    windowItem.classList.add('selected');
                }
                windowItem.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; margin-left: 20px;">
                        <span>Окно: ${window.width}x${window.height} м</span>
                        <span class="slopes-indicator" style="background-color: ${slopesColor};" title="${slopesText}"></span>
                    </div>
                    <button class="delete-btn" data-id="${window.id}" data-type="window"><i class="fas fa-trash"></i></button>
                `;
                windowItem.addEventListener('click', (e) => {
                    if (e.target.classList.contains('delete-btn') || e.target.parentElement?.classList.contains('delete-btn')) return;
                    selectedRoom = room;
                    selectElement(window);
                    const canvas = safeGetElement('editorCanvas');
                    if (canvas) {
                        draw(canvas, canvas.getContext('2d'));
                    }
                    if (window.innerWidth <= 576) {
                        showMobilePanel('properties');
                    }
                });
                
                const deleteBtn = windowItem.querySelector('.delete-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        deleteWindow(room, window);
                    });
                }
                
                elementList.appendChild(windowItem);
            });
        }
        
        // Добавляем двери комнаты
        if (room.doors && Array.isArray(room.doors)) {
            room.doors.forEach(door => {
                if (!door) return;
                
                // Определяем цвет индикатора откосов
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
                if (selectedElementObj && selectedElementObj.id === door.id) {
                    doorItem.classList.add('selected');
                }
                doorItem.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; margin-left: 20px;">
                        <span>Дверь: ${door.width}x${door.height} м</span>
                        <span class="slopes-indicator" style="background-color: ${slopesColor};" title="${slopesText}"></span>
                    </div>
                    <button class="delete-btn" data-id="${door.id}" data-type="door"><i class="fas fa-trash"></i></button>
                `;
                doorItem.addEventListener('click', (e) => {
                    if (e.target.classList.contains('delete-btn') || e.target.parentElement?.classList.contains('delete-btn')) return;
                    selectedRoom = room;
                    selectElement(door);
                    const canvas = safeGetElement('editorCanvas');
                    if (canvas) {
                        draw(canvas, canvas.getContext('2d'));
                    }
                    if (window.innerWidth <= 576) {
                        showMobilePanel('properties');
                    }
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

// Функции удаления элементов
function deleteRoom(room) {
    if (!room) return;
    
    if (confirm(`Удалить комнату "${room.name}"?`)) {
        rooms = rooms.filter(r => r && r.id !== room.id);
        if (selectedRoom && selectedRoom.id === room.id) {
            selectedRoom = null;
            selectedElementObj = null;
            hideAllProperties();
        }
        updateElementList();
        updateProjectSummary();
        calculateCost();
        const canvas = safeGetElement('editorCanvas');
        if (canvas) {
            centerView(canvas);
        }
        showNotification('Комната удалена');
    }
}

function deleteWindow(room, window) {
    if (!room || !window) return;
    
    if (confirm('Удалить окно?')) {
        room.windows = room.windows.filter(w => w && w.id !== window.id);
        if (selectedElementObj && selectedElementObj.id === window.id) {
            selectedElementObj = null;
            hideAllProperties();
        }
        updateElementList();
        updateProjectSummary();
        calculateCost();
        const canvas = safeGetElement('editorCanvas');
        if (canvas) {
            draw(canvas, canvas.getContext('2d'));
        }
        showNotification('Окно удалено');
    }
}

function deleteDoor(room, door) {
    if (!room || !door) return;
    
    if (confirm('Удалить дверь?')) {
        room.doors = room.doors.filter(d => d && d.id !== door.id);
        if (selectedElementObj && selectedElementObj.id === door.id) {
            selectedElementObj = null;
            hideAllProperties();
        }
        updateElementList();
        updateProjectSummary();
        calculateCost();
        const canvas = safeGetElement('editorCanvas');
        if (canvas) {
            draw(canvas, canvas.getContext('2d'));
        }
        showNotification('Дверь удалена');
    }
}

// Обновление сводки проекта
function updateProjectSummary() {
    let windowsCount = 0;
    let doorsCount = 0;
    let totalArea = 0;
    
    if (rooms && Array.isArray(rooms)) {
        rooms.forEach(room => {
            if (!room) return;
            
            if (room.windows && Array.isArray(room.windows)) {
                windowsCount += room.windows.length;
            }
            if (room.doors && Array.isArray(room.doors)) {
                doorsCount += room.doors.length;
            }
            
            const perimeter = ((room.width / scale) + (room.height / scale)) * 2;
            const ceilingHeightInput = safeGetElement('ceilingHeight');
            const ceilingHeight = ceilingHeightInput ? parseFloat(ceilingHeightInput.value) || 2.5 : 2.5;
            const wallsArea = perimeter * ceilingHeight;
            
            // Вычитаем площади окон и дверей
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
    
    if (roomsCountElem) roomsCountElem.textContent = rooms ? rooms.length : 0;
    if (windowsCountElem) windowsCountElem.textContent = windowsCount;
    if (doorsCountElem) doorsCountElem.textContent = doorsCount;
    if (totalAreaElem) totalAreaElem.textContent = `${totalArea.toFixed(1)} м²`;
}

// Обновление панели свойств в зависимости от выбранного элемента
function updatePropertiesPanel(element) {
    if (!element) {
        hideAllProperties();
        return;
    }
    
    hideAllProperties();
    
    if (element.type === 'room') {
        if (roomProperties) roomProperties.style.display = 'block';
        
        const roomName = safeGetElement('roomName');
        const roomWidth = safeGetElement('roomWidth');
        const roomHeightProp = safeGetElement('roomHeightProp');
        
        if (roomName) roomName.value = element.name || '';
        if (roomWidth) roomWidth.value = (element.width / scale).toFixed(1);
        if (roomHeightProp) roomHeightProp.value = (element.height / scale).toFixed(1);
        
        // Установка чекбоксов отделки с цветными индикаторами
        if (plasterCheckbox) {
            plasterCheckbox.checked = !!element.plaster;
            updateCheckboxColor('plaster', element.plaster ? '#3498db' : '#ccc');
        }
        if (armoringCheckbox) {
            armoringCheckbox.checked = !!element.armoring;
            updateCheckboxColor('armoring', element.armoring ? '#e67e22' : '#ccc');
        }
        if (puttyWallpaperCheckbox) {
            puttyWallpaperCheckbox.checked = !!element.puttyWallpaper;
            updateCheckboxColor('puttyWallpaper', element.puttyWallpaper ? '#2ecc71' : '#ccc');
        }
        if (puttyPaintCheckbox) {
            puttyPaintCheckbox.checked = !!element.puttyPaint;
            updateCheckboxColor('puttyPaint', element.puttyPaint ? '#9b59b6' : '#ccc');
        }
        if (paintingCheckbox) {
            paintingCheckbox.checked = !!element.painting;
            paintingCheckbox.disabled = !!element.puttyWallpaper;
            updateCheckboxColor('painting', element.painting ? '#e74c3c' : '#ccc');
        }
        
        // Сброс состояния кнопки
        if (applyRoomChangesBtn) applyRoomChangesBtn.disabled = false;
        
        // Обработчики изменений
        const roomInputs = ['roomName', 'roomWidth', 'roomHeightProp'];
        roomInputs.forEach(inputId => {
            const input = safeGetElement(inputId);
            if (input) {
                // Удаляем старые обработчики
                input.removeEventListener('input', handleRoomInputChange);
                input.removeEventListener('change', handleRoomInputChange);
                // Добавляем новые
                input.addEventListener('input', handleRoomInputChange);
                input.addEventListener('change', handleRoomInputChange);
            }
        });
        
        function handleRoomInputChange() {
            if (applyRoomChangesBtn) {
                applyRoomChangesBtn.disabled = false;
            }
        }
        
        // Обработчики чекбоксов
        const checkboxes = [plasterCheckbox, armoringCheckbox, puttyWallpaperCheckbox, puttyPaintCheckbox, paintingCheckbox];
        checkboxes.forEach(checkbox => {
            if (checkbox) {
                checkbox.removeEventListener('change', handleCheckboxChange);
                checkbox.addEventListener('change', handleCheckboxChange);
            }
        });
        
        function handleCheckboxChange() {
            if (applyRoomChangesBtn) {
                applyRoomChangesBtn.disabled = false;
            }
            
            // Обновляем цвет чекбокса
            const color = this.checked ? 
                (this.id === 'plaster' ? '#3498db' :
                 this.id === 'armoring' ? '#e67e22' :
                 this.id === 'puttyWallpaper' ? '#2ecc71' :
                 this.id === 'puttyPaint' ? '#9b59b6' :
                 '#e74c3c') : '#ccc';
            updateCheckboxColor(this.id, color);
            
            // Взаимное исключение для шпаклевки
            if (this === puttyWallpaperCheckbox && this.checked) {
                if (puttyPaintCheckbox) {
                    puttyPaintCheckbox.checked = false;
                    updateCheckboxColor('puttyPaint', '#ccc');
                }
                if (paintingCheckbox) {
                    paintingCheckbox.checked = false;
                    paintingCheckbox.disabled = true;
                    updateCheckboxColor('painting', '#ccc');
                }
            } else if (this === puttyPaintCheckbox && this.checked) {
                if (puttyWallpaperCheckbox) {
                    puttyWallpaperCheckbox.checked = false;
                    updateCheckboxColor('puttyWallpaper', '#ccc');
                }
                if (paintingCheckbox) paintingCheckbox.disabled = false;
            } else if (this === puttyWallpaperCheckbox && !this.checked) {
                if (paintingCheckbox) paintingCheckbox.disabled = false;
            } else if (this === puttyPaintCheckbox && !this.checked) {
                if (paintingCheckbox) {
                    paintingCheckbox.checked = false;
                    paintingCheckbox.disabled = true;
                    updateCheckboxColor('painting', '#ccc');
                }
            }
            
            // Если сняли штукатурку, снимаем и армирование
            if (this === plasterCheckbox && !this.checked) {
                if (armoringCheckbox) {
                    armoringCheckbox.checked = false;
                    updateCheckboxColor('armoring', '#ccc');
                }
                if (puttyWallpaperCheckbox) {
                    puttyWallpaperCheckbox.checked = false;
                    updateCheckboxColor('puttyWallpaper', '#ccc');
                }
                if (puttyPaintCheckbox) {
                    puttyPaintCheckbox.checked = false;
                    updateCheckboxColor('puttyPaint', '#ccc');
                }
                if (paintingCheckbox) {
                    paintingCheckbox.checked = false;
                    paintingCheckbox.disabled = true;
                    updateCheckboxColor('painting', '#ccc');
                }
            }
        }
        
        // Обработчик кнопки применения изменений
        if (applyRoomChangesBtn) {
            applyRoomChangesBtn.onclick = () => {
                const newWidth = roomWidth ? parseFloat(roomWidth.value) * scale : element.width;
                const newHeight = roomHeightProp ? parseFloat(roomHeightProp.value) * scale : element.height;
                
                // Сохраняем центр комнаты для плавного изменения размера
                const centerX = element.x + element.width / 2;
                const centerY = element.y + element.height / 2;
                
                element.name = roomName ? roomName.value : element.name;
                element.width = newWidth;
                element.height = newHeight;
                
                // Обновляем позицию для сохранения центра
                element.x = centerX - newWidth / 2;
                element.y = centerY - newHeight / 2;
                
                element.plaster = plasterCheckbox ? plasterCheckbox.checked : element.plaster;
                element.armoring = armoringCheckbox ? armoringCheckbox.checked : element.armoring;
                element.puttyWallpaper = puttyWallpaperCheckbox ? puttyWallpaperCheckbox.checked : element.puttyWallpaper;
                element.puttyPaint = puttyPaintCheckbox ? puttyPaintCheckbox.checked : element.puttyPaint;
                element.painting = paintingCheckbox ? paintingCheckbox.checked : element.painting;
                
                if (applyRoomChangesBtn) applyRoomChangesBtn.disabled = true;
                updateElementList();
                updateProjectSummary();
                calculateCost();
                const canvas = safeGetElement('editorCanvas');
                if (canvas) {
                    draw(canvas, canvas.getContext('2d'));
                }
                showNotification('Изменения применены');
            };
        }
        
        const deleteRoomBtn = safeGetElement('deleteRoom');
        if (deleteRoomBtn) {
            deleteRoomBtn.onclick = () => {
                deleteRoom(element);
            };
        }
    } else if (element.type === 'window') {
        if (windowProperties) windowProperties.style.display = 'block';
        
        const windowWidth = safeGetElement('windowWidth');
        const windowHeight = safeGetElement('windowHeight');
        const windowWall = safeGetElement('windowWall');
        const windowPosition = safeGetElement('windowPosition');
        const windowPositionValue = safeGetElement('windowPositionValue');
        const windowSlopes = safeGetElement('windowSlopes');
        
        if (windowWidth) windowWidth.value = element.width || 1.2;
        if (windowHeight) windowHeight.value = element.height || 1.5;
        if (windowWall) windowWall.value = element.wall || 'top';
        if (windowPosition) windowPosition.value = element.position || 50;
        if (windowPositionValue) windowPositionValue.textContent = `${element.position || 50}%`;
        if (windowSlopes) windowSlopes.value = element.slopes || 'with';
        
        // Обновляем цвет селекта откосов
        updateSlopesSelectColor('windowSlopes', element.slopes);
        
        // Сброс состояния кнопки
        if (applyWindowChangesBtn) applyWindowChangesBtn.disabled = true;
        
        // Обработчики изменений
        const windowInputs = ['windowWidth', 'windowHeight', 'windowWall', 'windowPosition', 'windowSlopes'];
        windowInputs.forEach(inputId => {
            const input = safeGetElement(inputId);
            if (input) {
                input.removeEventListener('input', windowInputHandler);
                input.addEventListener('input', windowInputHandler);
            }
        });
        
        function windowInputHandler(e) {
            if (applyWindowChangesBtn) {
                applyWindowChangesBtn.disabled = false;
            }
            if (e.target.id === 'windowPosition' && windowPositionValue) {
                windowPositionValue.textContent = `${e.target.value}%`;
            }
            if (e.target.id === 'windowSlopes') {
                updateSlopesSelectColor('windowSlopes', e.target.value);
            }
        }
        
        if (applyWindowChangesBtn) {
            applyWindowChangesBtn.onclick = () => {
                element.width = windowWidth ? parseFloat(windowWidth.value) : element.width;
                element.height = windowHeight ? parseFloat(windowHeight.value) : element.height;
                element.wall = windowWall ? windowWall.value : element.wall;
                element.position = windowPosition ? parseInt(windowPosition.value) : element.position;
                element.slopes = windowSlopes ? windowSlopes.value : element.slopes;
                
                applyWindowChangesBtn.disabled = true;
                updateElementList();
                updateProjectSummary();
                calculateCost();
                const canvas = safeGetElement('editorCanvas');
                if (canvas) {
                    draw(canvas, canvas.getContext('2d'));
                }
                showNotification('Изменения применены');
            };
        }
        
        const deleteWindowBtn = safeGetElement('deleteWindow');
        if (deleteWindowBtn) {
            deleteWindowBtn.onclick = () => {
                if (selectedRoom) {
                    deleteWindow(selectedRoom, element);
                }
            };
        }
    } else if (element.type === 'door') {
        if (doorProperties) doorProperties.style.display = 'block';
        
        const doorWidth = safeGetElement('doorWidth');
        const doorHeight = safeGetElement('doorHeight');
        const doorWall = safeGetElement('doorWall');
        const doorPosition = safeGetElement('doorPosition');
        const doorPositionValue = safeGetElement('doorPositionValue');
        const doorSlopes = safeGetElement('doorSlopes');
        
        if (doorWidth) doorWidth.value = element.width || 0.9;
        if (doorHeight) doorHeight.value = element.height || 2.1;
        if (doorWall) doorWall.value = element.wall || 'top';
        if (doorPosition) doorPosition.value = element.position || 50;
        if (doorPositionValue) doorPositionValue.textContent = `${element.position || 50}%`;
        if (doorSlopes) doorSlopes.value = element.slopes || 'with';
        
        // Обновляем цвет селекта откосов
        updateSlopesSelectColor('doorSlopes', element.slopes);
        
        // Сброс состояния кнопки
        if (applyDoorChangesBtn) applyDoorChangesBtn.disabled = true;
        
        // Обработчики изменений
        const doorInputs = ['doorWidth', 'doorHeight', 'doorWall', 'doorPosition', 'doorSlopes'];
        doorInputs.forEach(inputId => {
            const input = safeGetElement(inputId);
            if (input) {
                input.removeEventListener('input', doorInputHandler);
                input.addEventListener('input', doorInputHandler);
            }
        });
        
        function doorInputHandler(e) {
            if (applyDoorChangesBtn) {
                applyDoorChangesBtn.disabled = false;
            }
            if (e.target.id === 'doorPosition' && doorPositionValue) {
                doorPositionValue.textContent = `${e.target.value}%`;
            }
            if (e.target.id === 'doorSlopes') {
                updateSlopesSelectColor('doorSlopes', e.target.value);
            }
        }
        
        if (applyDoorChangesBtn) {
            applyDoorChangesBtn.onclick = () => {
                element.width = doorWidth ? parseFloat(doorWidth.value) : element.width;
                element.height = doorHeight ? parseFloat(doorHeight.value) : element.height;
                element.wall = doorWall ? doorWall.value : element.wall;
                element.position = doorPosition ? parseInt(doorPosition.value) : element.position;
                element.slopes = doorSlopes ? doorSlopes.value : element.slopes;
                
                applyDoorChangesBtn.disabled = true;
                updateElementList();
                updateProjectSummary();
                calculateCost();
                const canvas = safeGetElement('editorCanvas');
                if (canvas) {
                    draw(canvas, canvas.getContext('2d'));
                }
                showNotification('Изменения применены');
            };
        }
        
        const deleteDoorBtn = safeGetElement('deleteDoor');
        if (deleteDoorBtn) {
            deleteDoorBtn.onclick = () => {
                if (selectedRoom) {
                    deleteDoor(selectedRoom, element);
                }
            };
        }
    }
    
    if (selectedElement) {
        selectedElement.textContent = `${element.type === 'room' ? 'Комната' : element.type === 'window' ? 'Окно' : 'Дверь'}: ${escapeHTML(element.name || '')}`;
    }
}

// Обновление цвета чекбокса
function updateCheckboxColor(checkboxId, color) {
    const checkbox = safeGetElement(checkboxId);
    if (checkbox) {
        checkbox.style.accentColor = color;
    }
}

// Обновление цвета селекта откосов
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

// Скрытие всех панелей свойств
function hideAllProperties() {
    if (roomProperties) roomProperties.style.display = 'none';
    if (doorProperties) doorProperties.style.display = 'none';
    if (windowProperties) windowProperties.style.display = 'none';
    if (selectedElement) selectedElement.textContent = 'Не выбран';
}

// Функции для отправки сметы
function initSharingButtons() {
    const sendWhatsAppBtn = safeGetElement('sendWhatsApp');
    const copyReceiptBtn = safeGetElement('copyReceipt');
    const printReceiptBtn = safeGetElement('printReceipt');
    const feedbackBtn = safeGetElement('feedbackBtn');
    const headerFeedbackBtn = safeGetElement('headerFeedbackBtn'); // Новая кнопка в шапке
    
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
    
    if (headerFeedbackBtn) {
        headerFeedbackBtn.addEventListener('click', openFeedbackModal);
    }
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
    const overlay = safeGetElement('mobilePanelOverlay');
    const panel = safeGetElement('mobilePanel');
    const panelContent = safeGetElement('mobilePanelContent');
    const panelTitle = safeGetElement('mobilePanelTitle');
    
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
            if (selectedElementObj) {
                if (selectedElementObj.type === 'room') {
                    panelContent.innerHTML = `
                        <div class="property-group">
                            <h3><i class="fas fa-door-open"></i> Свойства комнаты</h3>
                            <div class="form-group">
                                <label for="mobileRoomName">Название:</label>
                                <input type="text" id="mobileRoomName" value="${escapeHTML(selectedElementObj.name || '')}">
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
                                <input type="number" id="mobileWindowWidth" min="0.5" max="3.0" step="0.1" value="${selectedElementObj.width || 1.2}">
                            </div>
                            <div class="form-group">
                                <label for="mobileWindowHeight">Высота (м):</label>
                                <input type="number" id="mobileWindowHeight" min="0.5" max="3.0" step="0.1" value="${selectedElementObj.height || 1.5}">
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
                                <input type="number" id="mobileDoorWidth" min="0.5" max="2.0" step="0.1" value="${selectedElementObj.width || 0.9}">
                            </div>
                            <div class="form-group">
                                <label for="mobileDoorHeight">Высота (м):</label>
                                <input type="number" id="mobileDoorHeight" min="1.5" max="3.0" step="0.1" value="${selectedElementObj.height || 2.1}">
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
            const summaryContent = document.querySelector('.properties-panel .panel-content');
            if (summaryContent) {
                panelContent.innerHTML = summaryContent.innerHTML;
            }
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
    const overlay = safeGetElement('mobilePanelOverlay');
    const panel = safeGetElement('mobilePanel');
    
    if (overlay) overlay.style.display = 'none';
    if (panel) panel.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Инициализация событий мобильной панели
function initMobilePanelEvents() {
    // Обработчики для комнаты
    const mobileApplyRoomChanges = safeGetElement('mobileApplyRoomChanges');
    if (mobileApplyRoomChanges && selectedElementObj && selectedElementObj.type === 'room') {
        mobileApplyRoomChanges.onclick = () => {
            const newName = safeGetElement('mobileRoomName')?.value || selectedElementObj.name;
            const mobileRoomWidth = safeGetElement('mobileRoomWidth');
            const mobileRoomHeight = safeGetElement('mobileRoomHeight');
            
            const newWidth = mobileRoomWidth ? parseFloat(mobileRoomWidth.value) * scale : selectedElementObj.width;
            const newHeight = mobileRoomHeight ? parseFloat(mobileRoomHeight.value) * scale : selectedElementObj.height;
            
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
            selectedElementObj.plaster = safeGetElement('mobilePlaster')?.checked || false;
            selectedElementObj.armoring = safeGetElement('mobileArmoring')?.checked || false;
            selectedElementObj.puttyWallpaper = safeGetElement('mobilePuttyWallpaper')?.checked || false;
            selectedElementObj.puttyPaint = safeGetElement('mobilePuttyPaint')?.checked || false;
            selectedElementObj.painting = safeGetElement('mobilePainting')?.checked || false;
            
            updateElementList();
            updateProjectSummary();
            calculateCost();
            const canvas = safeGetElement('editorCanvas');
            if (canvas) {
                draw(canvas, canvas.getContext('2d'));
            }
            closeMobilePanel();
            showNotification('Изменения применены');
        };
    }
    
    // Обработчики для окна
    const mobileApplyWindowChanges = safeGetElement('mobileApplyWindowChanges');
    if (mobileApplyWindowChanges && selectedElementObj && selectedElementObj.type === 'window') {
        mobileApplyWindowChanges.onclick = () => {
            const mobileWindowWidth = safeGetElement('mobileWindowWidth');
            const mobileWindowHeight = safeGetElement('mobileWindowHeight');
            const mobileWindowSlopes = safeGetElement('mobileWindowSlopes');
            
            selectedElementObj.width = mobileWindowWidth ? parseFloat(mobileWindowWidth.value) : selectedElementObj.width;
            selectedElementObj.height = mobileWindowHeight ? parseFloat(mobileWindowHeight.value) : selectedElementObj.height;
            selectedElementObj.slopes = mobileWindowSlopes ? mobileWindowSlopes.value : selectedElementObj.slopes;
            
            updateElementList();
            updateProjectSummary();
            calculateCost();
            const canvas = safeGetElement('editorCanvas');
            if (canvas) {
                draw(canvas, canvas.getContext('2d'));
            }
            closeMobilePanel();
            showNotification('Изменения применены');
        };
    }
    
    // Обработчики для двери
    const mobileApplyDoorChanges = safeGetElement('mobileApplyDoorChanges');
    if (mobileApplyDoorChanges && selectedElementObj && selectedElementObj.type === 'door') {
        mobileApplyDoorChanges.onclick = () => {
            const mobileDoorWidth = safeGetElement('mobileDoorWidth');
            const mobileDoorHeight = safeGetElement('mobileDoorHeight');
            const mobileDoorSlopes = safeGetElement('mobileDoorSlopes');
            
            selectedElementObj.width = mobileDoorWidth ? parseFloat(mobileDoorWidth.value) : selectedElementObj.width;
            selectedElementObj.height = mobileDoorHeight ? parseFloat(mobileDoorHeight.value) : selectedElementObj.height;
            selectedElementObj.slopes = mobileDoorSlopes ? mobileDoorSlopes.value : selectedElementObj.slopes;
            
            updateElementList();
            updateProjectSummary();
            calculateCost();
            const canvas = safeGetElement('editorCanvas');
            if (canvas) {
                draw(canvas, canvas.getContext('2d'));
            }
            closeMobilePanel();
            showNotification('Изменения применены');
        };
    }
    
    // Обработчики удаления
    const mobileDeleteRoom = safeGetElement('mobileDeleteRoom');
    if (mobileDeleteRoom) {
        mobileDeleteRoom.onclick = () => {
            if (selectedElementObj && selectedElementObj.type === 'room') {
                deleteRoom(selectedElementObj);
                closeMobilePanel();
            }
        };
    }
    
    const mobileDeleteWindow = safeGetElement('mobileDeleteWindow');
    if (mobileDeleteWindow) {
        mobileDeleteWindow.onclick = () => {
            if (selectedElementObj && selectedElementObj.type === 'window' && selectedRoom) {
                deleteWindow(selectedRoom, selectedElementObj);
                closeMobilePanel();
            }
        };
    }
    
    const mobileDeleteDoor = safeGetElement('mobileDeleteDoor');
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
                
                const editorCanvas = safeGetElement('editorCanvas');
                if (editorCanvas) {
                    if (currentTool === 'select') {
                        editorCanvas.style.cursor = 'move';
                    } else if (currentTool === 'room') {
                        editorCanvas.style.cursor = 'crosshair';
                    } else if (currentTool === 'window' || currentTool === 'door') {
                        editorCanvas.style.cursor = 'cell';
                    }
                }
                
                closeMobilePanel();
                showNotification(`Инструмент: ${tool === 'select' ? 'Выбор' : tool === 'room' ? 'Комната' : tool === 'window' ? 'Окно' : 'Дверь'}`);
            }
        });
    });
}

// Инициализация мобильного интерфейса
function initMobileUI() {
    console.log('Инициализация мобильного интерфейса');
    
    // Показываем мобильные элементы
    const mobileToolsContainer = document.querySelector('.mobile-tools-container');
    const fabContainer = safeGetElement('fabContainer');
    
    if (mobileToolsContainer) {
        mobileToolsContainer.style.display = 'block';
    }
    
    if (fabContainer) {
        fabContainer.style.display = 'flex';
    }
    
    // Инициализация обработчиков мобильного интерфейса
    initMobileEventHandlers();
    
    // Синхронизация высоты потолков
    const ceilingHeight = safeGetElement('ceilingHeight');
    const mobileCeilingHeight = safeGetElement('mobileCeilingHeight');
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
        button.addEventListener('click', () => {
            const tool = button.dataset.tool;
            if (tool) {
                mobileToolButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTool = tool;
                
                const editorCanvas = safeGetElement('editorCanvas');
                if (editorCanvas) {
                    if (currentTool === 'select') {
                        editorCanvas.style.cursor = 'move';
                    } else if (currentTool === 'room') {
                        editorCanvas.style.cursor = 'crosshair';
                    } else if (currentTool === 'window' || currentTool === 'door') {
                        editorCanvas.style.cursor = 'cell';
                    }
                }
                
                showNotification(`Инструмент: ${tool === 'select' ? 'Выбор' : tool === 'room' ? 'Комната' : tool === 'window' ? 'Окно' : 'Дверь'}`);
            }
        });
    });
    
    // Обработчики для мобильных кнопок управления
    const mobileNewProject = safeGetElement('mobileNewProject');
    const mobileClearAll = safeGetElement('mobileClearAll');
    const mobileZoomIn = safeGetElement('mobileZoomIn');
    const mobileZoomOut = safeGetElement('mobileZoomOut');
    const mobileCenterView = safeGetElement('mobileCenterView');
    
    if (mobileNewProject) {
        mobileNewProject.addEventListener('click', () => {
            rooms = [];
            selectedRoom = null;
            selectedElementObj = null;
            roomCounter = 1;
            hideAllProperties();
            updateElementList();
            updateProjectSummary();
            calculateCost();
            const canvas = safeGetElement('editorCanvas');
            if (canvas) {
                centerView(canvas);
            }
            showNotification('Новый проект создан');
        });
    }
    
    if (mobileClearAll) {
        mobileClearAll.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите удалить все комнаты?')) {
                rooms = [];
                selectedRoom = null;
                selectedElementObj = null;
                roomCounter = 1;
                hideAllProperties();
                updateElementList();
                updateProjectSummary();
                calculateCost();
                const canvas = safeGetElement('editorCanvas');
                if (canvas) {
                    centerView(canvas);
                }
                showNotification('Все комнаты удалены');
            }
        });
    }
    
    if (mobileZoomIn) {
        mobileZoomIn.addEventListener('click', () => {
            zoom *= 1.2;
            zoom = Math.min(3, zoom);
            if (zoomLevel) {
                zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
            }
            const canvas = safeGetElement('editorCanvas');
            if (canvas) {
                draw(canvas, canvas.getContext('2d'));
            }
        });
    }
    
    if (mobileZoomOut) {
        mobileZoomOut.addEventListener('click', () => {
            zoom /= 1.2;
            zoom = Math.max(0.1, zoom);
            if (zoomLevel) {
                zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
            }
            const canvas = safeGetElement('editorCanvas');
            if (canvas) {
                draw(canvas, canvas.getContext('2d'));
            }
        });
    }
    
    if (mobileCenterView) {
        mobileCenterView.addEventListener('click', () => {
            const canvas = safeGetElement('editorCanvas');
            if (canvas) {
                centerView(canvas);
            }
        });
    }
    
    // Обработчик изменения высоты потолков в мобильной версии
    const mobileCeilingHeight = safeGetElement('mobileCeilingHeight');
    if (mobileCeilingHeight) {
        mobileCeilingHeight.addEventListener('change', function() {
            const ceilingHeight = safeGetElement('ceilingHeight');
            if (ceilingHeight) {
                ceilingHeight.value = this.value;
            }
            updateProjectSummary();
            calculateCost();
        });
    }
    
    // Синхронизация значений высоты потолков
    const ceilingHeight = safeGetElement('ceilingHeight');
    if (ceilingHeight) {
        ceilingHeight.addEventListener('change', function() {
            const mobileCeilingHeight = safeGetElement('mobileCeilingHeight');
            if (mobileCeilingHeight) {
                mobileCeilingHeight.value = this.value;
            }
        });
    }
    
    // Обработчики для плавающих кнопок
    const fabProperties = safeGetElement('fabProperties');
    const fabSummary = safeGetElement('fabSummary');
    const fabReceipt = safeGetElement('fabReceipt');
    const fabTop = safeGetElement('fabTop');
    
    if (fabProperties) {
        fabProperties.addEventListener('click', () => {
            showMobilePanel('properties');
        });
    }
    
    if (fabSummary) {
        fabSummary.addEventListener('click', () => {
            showMobilePanel('summary');
        });
    }
    
    if (fabReceipt) {
        fabReceipt.addEventListener('click', () => {
            const receiptContainer = safeGetElement('receiptContainer');
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
    const overlay = safeGetElement('mobilePanelOverlay');
    const mobilePanel = safeGetElement('mobilePanel');
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

// Инициализация пользовательского интерфейса
function initUI() {
    console.log('Инициализация UI');
    
    // Получение ссылок на DOM элементы
    window.toolButtons = document.querySelectorAll('.tool-btn');
    window.cursorPosition = safeGetElement('cursorPosition');
    window.selectedElement = safeGetElement('selectedElement');
    window.zoomLevel = safeGetElement('zoomLevel');
    window.receiptContainer = safeGetElement('receiptContainer');
    window.receiptContent = safeGetElement('receiptContent');
    
    // Панели свойств
    window.roomProperties = safeGetElement('roomProperties');
    window.doorProperties = safeGetElement('doorProperties');
    window.windowProperties = safeGetElement('windowProperties');
    window.costEstimate = safeGetElement('costEstimate');
    
    // Кнопки управления
    window.newProjectBtn = safeGetElement('newProject');
    window.clearAllBtn = safeGetElement('clearAll');
    window.zoomInBtn = safeGetElement('zoomIn');
    window.zoomOutBtn = safeGetElement('zoomOut');
    window.centerViewBtn = safeGetElement('centerView');
    
    // Кнопки применения изменений
    window.applyRoomChangesBtn = safeGetElement('applyRoomChanges');
    window.applyWindowChangesBtn = safeGetElement('applyWindowChanges');
    window.applyDoorChangesBtn = safeGetElement('applyDoorChanges');
    
    // Элементы управления окнами и дверями
    window.windowPositionSlider = safeGetElement('windowPosition');
    window.windowPositionValue = safeGetElement('windowPositionValue');
    window.doorPositionSlider = safeGetElement('doorPosition');
    window.doorPositionValue = safeGetElement('doorPositionValue');
    
    // Чекбоксы отделки
    window.plasterCheckbox = safeGetElement('plaster');
    window.armoringCheckbox = safeGetElement('armoring');
    window.puttyWallpaperCheckbox = safeGetElement('puttyWallpaper');
    window.puttyPaintCheckbox = safeGetElement('puttyPaint');
    window.paintingCheckbox = safeGetElement('painting');
    
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
            const fabContainer = safeGetElement('fabContainer');
            if (mobileToolsContainer) mobileToolsContainer.style.display = 'none';
            if (fabContainer) fabContainer.style.display = 'none';
        }
    });
}

// Инициализация модального окна обратной связи
function initFeedbackModal() {
    const modal = safeGetElement('feedbackModal');
    const closeBtn = document.querySelector('.close-modal');
    const feedbackForm = safeGetElement('feedbackForm');
    
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
            clientName: safeGetElement('clientName')?.value || '',
            clientContact: safeGetElement('clientContact')?.value || '',
            propertyType: safeGetElement('propertyType')?.value || '',
            totalArea: safeGetElement('totalAreaInput')?.value || '',
            additionalInfo: safeGetElement('additionalInfo')?.value || ''
        };
        
        const submitBtn = feedbackForm.querySelector('.btn-submit');
        const originalText = submitBtn ? submitBtn.innerHTML : '';
        
        // Показываем индикатор загрузки
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            submitBtn.disabled = true;
        }
        
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
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    });
}

// Инициализация обработчиков событий
function initEventListeners() {
    const editorCanvas = safeGetElement('editorCanvas');
    
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
            if (zoomLevel) {
                zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
            }
            draw(editorCanvas, editorCanvas.getContext('2d'));
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            zoom /= 1.2;
            zoom = Math.max(0.1, zoom);
            if (zoomLevel) {
                zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
            }
            draw(editorCanvas, editorCanvas.getContext('2d'));
        });
    }
    
    // Обработчик кнопки центрирования
    if (centerViewBtn) {
        centerViewBtn.addEventListener('click', () => centerView(editorCanvas));
    }
    
    // Обработчик изменения высоты потолков
    const ceilingHeight = safeGetElement('ceilingHeight');
    if (ceilingHeight) {
        ceilingHeight.addEventListener('change', () => {
            updateProjectSummary();
            calculateCost();
        });
    }
}

// Обработка нажатия мыши
function handleMouseDown(e) {
    const editorCanvas = safeGetElement('editorCanvas');
    if (!editorCanvas) return;
    
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
            // НОВОЕ: Если не кликнули на элемент, начинаем панорамирование (перемещение всего проекта)
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            selectedRoom = null;
            selectedElementObj = null;
            hideAllProperties();
            
            // Меняем курсор на перемещение
            editorCanvas.style.cursor = 'grabbing';
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
    const editorCanvas = safeGetElement('editorCanvas');
    if (!editorCanvas) return;
    
    const rect = editorCanvas.getBoundingClientRect();
    const safeZoom = zoom > 0 ? zoom : 1;
    const x = (e.clientX - rect.left - viewOffsetX) / safeZoom;
    const y = (e.clientY - rect.top - viewOffsetY) / safeZoom;
    
    // Обновление позиции курсора
    if (cursorPosition) {
        cursorPosition.textContent = `X: ${(x / scale).toFixed(2)}, Y: ${(y / scale).toFixed(2)}`;
    }
    
    // НОВОЕ: Панорамирование всего проекта
    if (isPanning) {
        const dx = e.clientX - panStartX;
        const dy = e.clientY - panStartY;
        
        viewOffsetX += dx;
        viewOffsetY += dy;
        
        panStartX = e.clientX;
        panStartY = e.clientY;
        
        draw(editorCanvas, editorCanvas.getContext('2d'));
        return;
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
    const editorCanvas = safeGetElement('editorCanvas');
    if (!editorCanvas) return;
    
    // НОВОЕ: Завершаем панорамирование
    if (isPanning) {
        isPanning = false;
        editorCanvas.style.cursor = 'move';
    }
    
    if (isDragging) {
        isDragging = false;
    }
    
    if (isMovingElement) {
        isMovingElement = false;
        movingElement = null;
    }
    
    if (!isDrawing) return;
    
    const rect = editorCanvas.getBoundingClientRect();
    const safeZoom = zoom > 0 ? zoom : 1;
    const x = (e.clientX - rect.left - viewOffsetX) / safeZoom;
    const y = (e.clientY - rect.top - viewOffsetY) / safeZoom;
    
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