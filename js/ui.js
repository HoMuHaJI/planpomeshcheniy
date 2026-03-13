// ui.js – ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ (с рабочим вводом отступов)

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
            room.windows.forEach(window => {
                if (!window) return;

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
                        <span>Окно: ${window.width}x${window.height} м (L: ${(window.leftOffset || 0).toFixed(2)}м, R: ${(window.rightOffset || 0).toFixed(2)}м)</span>
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
                if (selectedElementObj && selectedElementObj.id === door.id) {
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
                    selectedRoom = room;
                    selectElement(door);
                    const canvas = safeGetElement('editorCanvas');
                    if (canvas) {
                        draw(canvas, canvas.getContext('2d'));
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

function deleteRoom(room) {
    if (!room) return;
    if (confirm(`Удалить комнату "${room.name}"?`)) {
        pushToHistory();
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
        pushToHistory();
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
        pushToHistory();
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
    const roomProperties = safeGetElement('roomProperties');
    const doorProperties = safeGetElement('doorProperties');
    const windowProperties = safeGetElement('windowProperties');

    if (roomProperties) roomProperties.style.display = 'none';
    if (doorProperties) doorProperties.style.display = 'none';
    if (windowProperties) windowProperties.style.display = 'none';

    const selectedElement = safeGetElement('selectedElement');
    if (selectedElement) selectedElement.textContent = 'Не выбран';
}

// ================== ОБНОВЛЕННЫЕ ФУНКЦИИ ПАНЕЛЕЙ СВОЙСТВ ==================

function updatePropertiesPanel(element) {
    if (!element) {
        hideAllProperties();
        return;
    }
    hideAllProperties();

    if (element.type === 'room') {
        const roomProperties = safeGetElement('roomProperties');
        if (roomProperties) roomProperties.style.display = 'block';

        const roomName = safeGetElement('roomName');
        const roomWidth = safeGetElement('roomWidth');
        const roomHeightProp = safeGetElement('roomHeightProp');

        if (roomName) roomName.value = element.name || '';
        if (roomWidth) roomWidth.value = (element.width / scale).toFixed(1);
        if (roomHeightProp) roomHeightProp.value = (element.height / scale).toFixed(1);

        const plasterCheckbox = safeGetElement('plaster');
        const armoringCheckbox = safeGetElement('armoring');
        const puttyWallpaperCheckbox = safeGetElement('puttyWallpaper');
        const puttyPaintCheckbox = safeGetElement('puttyPaint');
        const paintingCheckbox = safeGetElement('painting');

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

        const applyRoomChangesBtn = safeGetElement('applyRoomChanges');
        if (applyRoomChangesBtn) applyRoomChangesBtn.disabled = false;

        const roomInputs = ['roomName', 'roomWidth', 'roomHeightProp'];
        roomInputs.forEach(inputId => {
            const input = safeGetElement(inputId);
            if (input) {
                input.removeEventListener('input', handleRoomInputChange);
                input.removeEventListener('change', handleRoomInputChange);
                input.addEventListener('input', handleRoomInputChange);
                input.addEventListener('change', handleRoomInputChange);
            }
        });

        function handleRoomInputChange() {
            const btn = safeGetElement('applyRoomChanges');
            if (btn) btn.disabled = false;
        }

        const checkboxes = [plasterCheckbox, armoringCheckbox, puttyWallpaperCheckbox, puttyPaintCheckbox, paintingCheckbox];
        checkboxes.forEach(checkbox => {
            if (checkbox) {
                checkbox.removeEventListener('change', handleCheckboxChange);
                checkbox.addEventListener('change', handleCheckboxChange);
            }
        });

        function handleCheckboxChange() {
            const btn = safeGetElement('applyRoomChanges');
            if (btn) btn.disabled = false;

            const color = this.checked ?
                (this.id === 'plaster' ? '#3498db' :
                 this.id === 'armoring' ? '#e67e22' :
                 this.id === 'puttyWallpaper' ? '#2ecc71' :
                 this.id === 'puttyPaint' ? '#9b59b6' :
                 '#e74c3c') : '#ccc';
            updateCheckboxColor(this.id, color);

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

        if (applyRoomChangesBtn) {
            applyRoomChangesBtn.onclick = () => {
                pushToHistory();

                const newWidth = roomWidth ? parseFloat(roomWidth.value) * scale : element.width;
                const newHeight = roomHeightProp ? parseFloat(roomHeightProp.value) * scale : element.height;

                const centerX = element.x + element.width / 2;
                const centerY = element.y + element.height / 2;

                element.name = roomName ? roomName.value : element.name;
                element.width = newWidth;
                element.height = newHeight;

                element.x = centerX - newWidth / 2;
                element.y = centerY - newHeight / 2;

                element.plaster = plasterCheckbox ? plasterCheckbox.checked : element.plaster;
                element.armoring = armoringCheckbox ? armoringCheckbox.checked : element.armoring;
                element.puttyWallpaper = puttyWallpaperCheckbox ? puttyWallpaperCheckbox.checked : element.puttyWallpaper;
                element.puttyPaint = puttyPaintCheckbox ? puttyPaintCheckbox.checked : element.puttyPaint;
                element.painting = paintingCheckbox ? paintingCheckbox.checked : element.painting;

                applyRoomChangesBtn.disabled = true;
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
            deleteRoomBtn.onclick = () => deleteRoom(element);
        }

    } else if (element.type === 'window') {
        const windowProperties = safeGetElement('windowProperties');
        if (windowProperties) windowProperties.style.display = 'block';

        const windowWidth = safeGetElement('windowWidth');
        const windowHeight = safeGetElement('windowHeight');
        const windowWall = safeGetElement('windowWall');
        const windowLeftOffset = safeGetElement('windowLeftOffset');
        const windowRightOffset = safeGetElement('windowRightOffset');
        const windowSlopes = safeGetElement('windowSlopes');

        if (windowWidth) windowWidth.value = element.width || 1.2;
        if (windowHeight) windowHeight.value = element.height || 1.5;
        if (windowWall) windowWall.value = element.wall || 'top';
        if (windowLeftOffset) windowLeftOffset.value = (element.leftOffset || 0).toFixed(2);
        if (windowRightOffset) windowRightOffset.value = (element.rightOffset || 0).toFixed(2);
        if (windowSlopes) windowSlopes.value = element.slopes || 'with';

        updateSlopesSelectColor('windowSlopes', element.slopes);

        const applyWindowChangesBtn = safeGetElement('applyWindowChanges');
        if (applyWindowChangesBtn) applyWindowChangesBtn.disabled = false;

        if (!selectedRoom) {
            console.error('selectedRoom is null in window properties');
            return;
        }

        const wallLength = element.wall === 'top' || element.wall === 'bottom' ?
            (selectedRoom.width / scale) : (selectedRoom.height / scale);

        // Устанавливаем ограничения для полей
        if (windowLeftOffset) {
            windowLeftOffset.max = (wallLength - element.width).toFixed(2);
            windowLeftOffset.min = 0;
        }
        if (windowWidth) {
            windowWidth.max = wallLength.toFixed(2);
            windowWidth.min = 0.5;
        }

        // Корректируем отступы, если они выходят за границы стены
        let left = element.leftOffset || 0;
        if (left > wallLength - element.width) {
            left = Math.max(0, wallLength - element.width);
            element.leftOffset = left;
            element.rightOffset = wallLength - left - element.width;
            if (windowLeftOffset) windowLeftOffset.value = left.toFixed(2);
            if (windowRightOffset) windowRightOffset.value = element.rightOffset.toFixed(2);
        }

        // Обработчики ввода
        const windowInputs = ['windowWidth', 'windowHeight', 'windowLeftOffset', 'windowRightOffset', 'windowSlopes'];
        windowInputs.forEach(inputId => {
            const input = safeGetElement(inputId);
            if (input) {
                input.removeEventListener('input', windowInputHandler);
                input.addEventListener('input', windowInputHandler);
            }
        });

        function windowInputHandler(e) {
            const btn = safeGetElement('applyWindowChanges');
            if (btn) {
                btn.disabled = false;
            }

            if (e.target.id === 'windowSlopes') {
                updateSlopesSelectColor('windowSlopes', e.target.value);
            }

            // Пересчёт отступов при изменении ширины или левого отступа
            if (e.target.id === 'windowWidth' || e.target.id === 'windowLeftOffset') {
                let currentLeft = parseFloat(windowLeftOffset?.value) || 0;
                let currentWidth = parseFloat(windowWidth?.value) || element.width;

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

        if (applyWindowChangesBtn) {
            applyWindowChangesBtn.onclick = () => {
                pushToHistory();

                const wallLength = element.wall === 'top' || element.wall === 'bottom' ?
                    (selectedRoom.width / scale) : (selectedRoom.height / scale);

                const newWidth = windowWidth ? parseFloat(windowWidth.value) : element.width;
                const newLeftOffset = windowLeftOffset ? parseFloat(windowLeftOffset.value) : (element.leftOffset || 0);
                const newRightOffset = wallLength - newLeftOffset - newWidth;

                element.width = Math.max(0.5, Math.min(wallLength, newWidth));
                element.leftOffset = Math.max(0, Math.min(wallLength - element.width, newLeftOffset));
                element.rightOffset = Math.max(0, newRightOffset);
                element.height = windowHeight ? parseFloat(windowHeight.value) : element.height;
                element.wall = windowWall ? windowWall.value : element.wall;
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
                if (selectedRoom) deleteWindow(selectedRoom, element);
            };
        }

    } else if (element.type === 'door') {
        const doorProperties = safeGetElement('doorProperties');
        if (doorProperties) doorProperties.style.display = 'block';

        const doorWidth = safeGetElement('doorWidth');
        const doorHeight = safeGetElement('doorHeight');
        const doorWall = safeGetElement('doorWall');
        const doorLeftOffset = safeGetElement('doorLeftOffset');
        const doorRightOffset = safeGetElement('doorRightOffset');
        const doorSlopes = safeGetElement('doorSlopes');

        if (doorWidth) doorWidth.value = element.width || 0.9;
        if (doorHeight) doorHeight.value = element.height || 2.1;
        if (doorWall) doorWall.value = element.wall || 'top';
        if (doorLeftOffset) doorLeftOffset.value = (element.leftOffset || 0).toFixed(2);
        if (doorRightOffset) doorRightOffset.value = (element.rightOffset || 0).toFixed(2);
        if (doorSlopes) doorSlopes.value = element.slopes || 'with';

        updateSlopesSelectColor('doorSlopes', element.slopes);

        const applyDoorChangesBtn = safeGetElement('applyDoorChanges');
        if (applyDoorChangesBtn) applyDoorChangesBtn.disabled = false;

        if (!selectedRoom) {
            console.error('selectedRoom is null in door properties');
            return;
        }

        const wallLength = element.wall === 'top' || element.wall === 'bottom' ?
            (selectedRoom.width / scale) : (selectedRoom.height / scale);

        if (doorLeftOffset) {
            doorLeftOffset.max = (wallLength - element.width).toFixed(2);
            doorLeftOffset.min = 0;
        }
        if (doorWidth) {
            doorWidth.max = wallLength.toFixed(2);
            doorWidth.min = 0.6;
        }

        // Корректируем отступы, если они выходят за границы стены
        let left = element.leftOffset || 0;
        if (left > wallLength - element.width) {
            left = Math.max(0, wallLength - element.width);
            element.leftOffset = left;
            element.rightOffset = wallLength - left - element.width;
            if (doorLeftOffset) doorLeftOffset.value = left.toFixed(2);
            if (doorRightOffset) doorRightOffset.value = element.rightOffset.toFixed(2);
        }

        const doorInputs = ['doorWidth', 'doorHeight', 'doorLeftOffset', 'doorRightOffset', 'doorSlopes'];
        doorInputs.forEach(inputId => {
            const input = safeGetElement(inputId);
            if (input) {
                input.removeEventListener('input', doorInputHandler);
                input.addEventListener('input', doorInputHandler);
            }
        });

        function doorInputHandler(e) {
            const btn = safeGetElement('applyDoorChanges');
            if (btn) {
                btn.disabled = false;
            }

            if (e.target.id === 'doorSlopes') {
                updateSlopesSelectColor('doorSlopes', e.target.value);
            }

            if (e.target.id === 'doorWidth' || e.target.id === 'doorLeftOffset') {
                let currentLeft = parseFloat(doorLeftOffset?.value) || 0;
                let currentWidth = parseFloat(doorWidth?.value) || element.width;

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

        if (applyDoorChangesBtn) {
            applyDoorChangesBtn.onclick = () => {
                pushToHistory();

                const wallLength = element.wall === 'top' || element.wall === 'bottom' ?
                    (selectedRoom.width / scale) : (selectedRoom.height / scale);

                const newWidth = doorWidth ? parseFloat(doorWidth.value) : element.width;
                const newLeftOffset = doorLeftOffset ? parseFloat(doorLeftOffset.value) : (element.leftOffset || 0);
                const newRightOffset = wallLength - newLeftOffset - newWidth;

                element.width = Math.max(0.6, Math.min(wallLength, newWidth));
                element.leftOffset = Math.max(0, Math.min(wallLength - element.width, newLeftOffset));
                element.rightOffset = Math.max(0, newRightOffset);
                element.height = doorHeight ? parseFloat(doorHeight.value) : element.height;
                element.wall = doorWall ? doorWall.value : element.wall;
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
                if (selectedRoom) deleteDoor(selectedRoom, element);
            };
        }
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

    navigator.clipboard.writeText(text).then(() => {
        const newWindow = window.open(maxUrl, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            alert('Ссылка не открылась автоматически. Перейдите по ссылке вручную:\n' + maxUrl);
        }
        showNotification('Смета скопирована!');
    }).catch(err => {
        console.error('Ошибка копирования: ', err);
        window.open(maxUrl, '_blank');
        showNotification('Открывается профиль в Max. Скопируйте смету вручную.');
    });
}

function copyReceiptToClipboard() {
    console.log('✓ copyReceipt clicked');
    const text = getReceiptText();
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Смета скопирована в буфер обмена!');
    }).catch(err => {
        console.error('Ошибка копирования: ', err);
        showNotification('Ошибка копирования. Попробуйте еще раз.');
    });
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
    const TELEGRAM_BOT_TOKEN = '8142957488:AAGDsEIsGdtrCX-ZyvOD7nJjaVVD3_YIFks';
    const TELEGRAM_CHAT_ID = '-1001701431569';
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

function initUI() {
    console.log('✓ initUI called');

    window.toolButtons = document.querySelectorAll('.tool-btn');
    window.cursorPosition = safeGetElement('cursorPosition');
    window.selectedElement = safeGetElement('selectedElement');
    window.zoomLevel = safeGetElement('zoomLevel');
    window.receiptContainer = safeGetElement('receiptContainer');
    window.receiptContent = safeGetElement('receiptContent');

    window.roomProperties = safeGetElement('roomProperties');
    window.doorProperties = safeGetElement('doorProperties');
    window.windowProperties = safeGetElement('windowProperties');

    window.newProjectBtn = safeGetElement('newProject');
    window.clearAllBtn = safeGetElement('clearAll');
    window.zoomInBtn = safeGetElement('zoomIn');
    window.zoomOutBtn = safeGetElement('zoomOut');
    window.centerViewBtn = safeGetElement('centerView');

    window.applyRoomChangesBtn = safeGetElement('applyRoomChanges');
    window.applyWindowChangesBtn = safeGetElement('applyWindowChanges');
    window.applyDoorChangesBtn = safeGetElement('applyDoorChanges');

    window.plasterCheckbox = safeGetElement('plaster');
    window.armoringCheckbox = safeGetElement('armoring');
    window.puttyWallpaperCheckbox = safeGetElement('puttyWallpaper');
    window.puttyPaintCheckbox = safeGetElement('puttyPaint');
    window.paintingCheckbox = safeGetElement('painting');

    initSharingButtons();
    initFeedbackModal();
    initEventListeners();
}

function initEventListeners() {
    const editorCanvas = safeGetElement('editorCanvas');
    if (!editorCanvas) return;

    if (window.toolButtons) {
        window.toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                window.toolButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTool = button.dataset.tool;

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

    const newProjectBtn = safeGetElement('newProject');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => {
            pushToHistory();
            rooms = [];
            selectedRoom = null;
            selectedElementObj = null;
            roomCounter = 1;
            hideAllProperties();
            updateElementList();
            updateProjectSummary();
            calculateCost();
            centerView(editorCanvas);
            clearHistory();
            showNotification('Новый проект создан');
        });
    }

    const clearAllBtn = safeGetElement('clearAll');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите удалить все комнаты?')) {
                pushToHistory();
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

    const zoomInBtn = safeGetElement('zoomIn');
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            zoom *= 1.2;
            zoom = Math.min(3, zoom);
            const zoomLevel = safeGetElement('zoomLevel');
            if (zoomLevel) zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
            draw(editorCanvas, editorCanvas.getContext('2d'));
        });
    }

    const zoomOutBtn = safeGetElement('zoomOut');
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            zoom /= 1.2;
            zoom = Math.max(0.1, zoom);
            const zoomLevel = safeGetElement('zoomLevel');
            if (zoomLevel) zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
            draw(editorCanvas, editorCanvas.getContext('2d'));
        });
    }

    const centerViewBtn = safeGetElement('centerView');
    if (centerViewBtn) {
        centerViewBtn.addEventListener('click', () => centerView(editorCanvas));
    }

    const ceilingHeight = safeGetElement('ceilingHeight');
    if (ceilingHeight) {
        ceilingHeight.addEventListener('change', () => {
            updateProjectSummary();
            calculateCost();
        });
    }
}

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
                // Находим комнату, в которой находится этот элемент
                for (let r of rooms) {
                    if (r.windows && r.windows.includes(element)) {
                        selectedRoom = r;
                        break;
                    }
                    if (r.doors && r.doors.includes(element)) {
                        selectedRoom = r;
                        break;
                    }
                }
                selectElement(element);
                isMovingElement = true;
                movingElement = element;
            }
        } else {
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            selectedRoom = null;
            selectedElementObj = null;
            hideAllProperties();
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
                addElementToRoom(currentTool, room, wallInfo.wall, wallInfo.leftOffset);
            }
        } else {
            showNotification('Кликните внутри комнаты для добавления элемента');
        }
    }

    draw(editorCanvas, editorCanvas.getContext('2d'));
}

function handleMouseMove(e) {
    const editorCanvas = safeGetElement('editorCanvas');
    if (!editorCanvas) return;
    const rect = editorCanvas.getBoundingClientRect();
    const safeZoom = zoom > 0 ? zoom : 1;
    const x = (e.clientX - rect.left - viewOffsetX) / safeZoom;
    const y = (e.clientY - rect.top - viewOffsetY) / safeZoom;

    const cursorPosition = safeGetElement('cursorPosition');
    if (cursorPosition) {
        cursorPosition.textContent = `X: ${(x / scale).toFixed(2)}, Y: ${(y / scale).toFixed(2)}`;
    }

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

    if (isDragging && selectedRoom) {
        const newX = x - dragOffsetX;
        const newY = y - dragOffsetY;
        selectedRoom.x = newX;
        selectedRoom.y = newY;
        draw(editorCanvas, editorCanvas.getContext('2d'));
    }

    if (isMovingElement && movingElement && selectedRoom) {
        const wallInfo = findNearestWall(selectedRoom, x, y);
        if (wallInfo && wallInfo.wall === movingElement.wall) {
            const wallLength = wallInfo.wall === 'top' || wallInfo.wall === 'bottom' ?
                (selectedRoom.width / scale) : (selectedRoom.height / scale);
            const maxLeftOffset = wallLength - movingElement.width;
            const clampedLeftOffset = Math.max(0, Math.min(maxLeftOffset, wallInfo.leftOffset));

            // Проверяем, изменилась ли позиция
            if (Math.abs(movingElement.leftOffset - clampedLeftOffset) > 0.001) {
                movingElement.leftOffset = clampedLeftOffset;
                movingElement.rightOffset = wallLength - clampedLeftOffset - movingElement.width;
                updatePropertiesPanel(movingElement);
                draw(editorCanvas, editorCanvas.getContext('2d'));
            }
        }
    }

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
    const editorCanvas = safeGetElement('editorCanvas');
    if (!editorCanvas) return;

    if (isPanning) {
        isPanning = false;
        editorCanvas.style.cursor = 'move';
    }

    if (isDragging) {
        isDragging = false;
        pushToHistory();
    }

    if (isMovingElement) {
        isMovingElement = false;
        pushToHistory();
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

        if (width > 50 && height > 50) {
            const roomX = Math.min(startX, x);
            const roomY = Math.min(startY, y);

            pushToHistory();

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

            updateElementList();
            updateProjectSummary();
            calculateCost();
            centerView(editorCanvas);
        } else {
            showNotification('Слишком маленькая комната. Минимальный размер: 1x1 метр');
        }
    }

    isDrawing = false;
    draw(editorCanvas, editorCanvas.getContext('2d'));
}