// Функции для расчета стоимости

function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id '${id}' not found`);
    }
    return element;
}

function calculateCost() {
    try {
        const ceilingHeightInput = safeGetElement('ceilingHeight');
        if (!ceilingHeightInput) return;
        
        const ceilingHeight = parseFloat(ceilingHeightInput.value) || 2.5;
        let totalCost = 0;
        
        if (!rooms || rooms.length === 0) {
            const receiptContainer = safeGetElement('receiptContainer');
            if (receiptContainer) receiptContainer.style.display = 'none';
            
            const receiptActions = safeGetElement('receiptActions');
            if (receiptActions) receiptActions.style.display = 'none';
            
            const receiptContent = safeGetElement('receiptContent');
            if (receiptContent) {
                receiptContent.innerHTML = '<div class="receipt-section-header">Нет данных для расчета</div><div style="text-align:center; padding:20px;">Добавьте комнаты, чтобы увидеть смету.</div>';
            }
        } else {
            let projectTotalCost = 0;
            let receiptHTML = '';
            
            receiptHTML += `
                <div class="receipt-line" style="text-align: center; font-weight: bold;">
                    <div>СМЕТА РАБОТ</div>
                </div>
                <div class="receipt-line" style="text-align: center;">
                    <div>Дата: ${new Date().toLocaleDateString()}</div>
                </div>
                <div class="receipt-line" style="text-align: center; font-size: 0.9em;">
                    <div>Расчет для г. Симферополь</div>
                </div>
                <div class="receipt-line" style="border-bottom: 2px dashed #000; margin-bottom: 15px;"></div>
            `;
            
            rooms.forEach(room => {
                if (!room || !room.width || !room.height) return;
                
                const perimeter = ((room.width / scale) + (room.height / scale)) * 2;
                const wallsArea = perimeter * ceilingHeight;
                
                let windowsArea = 0;
                let doorsArea = 0;
                let slopesLinear = 0;
                let slopesLinearWithNet = 0;
                
                if (room.windows && Array.isArray(room.windows)) {
                    room.windows.forEach(window => {
                        if (!window || !window.width || !window.height) return;
                        windowsArea += window.width * window.height;
                        if (window.slopes === 'with') {
                            slopesLinear += (window.width + window.height * 2);
                        } else if (window.slopes === 'with_net') {
                            slopesLinear += (window.width + window.height * 2);
                            slopesLinearWithNet += (window.width + window.height * 2);
                        }
                    });
                }
                
                if (room.doors && Array.isArray(room.doors)) {
                    room.doors.forEach(door => {
                        if (!door || !door.width || !door.height) return;
                        doorsArea += door.width * door.height;
                        if (door.slopes === 'with') {
                            slopesLinear += (door.width + door.height * 2);
                        } else if (door.slopes === 'with_net') {
                            slopesLinear += (door.width + door.height * 2);
                            slopesLinearWithNet += (door.width + door.height * 2);
                        }
                    });
                }
                
                const netWallsArea = Math.max(0, wallsArea - windowsArea - doorsArea);
                
                let roomCost = 0;
                
                receiptHTML += `
                    <div class="receipt-room-header">
                        ${escapeHTML(room.name || 'Комната')} (${(room.width / scale).toFixed(1)}x${(room.height / scale).toFixed(1)} м)
                    </div>
                `;
                
                // Стартовая штукатурка
                if (room.plaster) {
                    let plasterCost = 0;
                    receiptHTML += `
                        <div class="receipt-section">
                            <div class="receipt-section-header">СТАРТОВАЯ ШТУКАТУРКА</div>
                    `;
                    
                    const primerWallsCost = netWallsArea * prices.primer.square;
                    plasterCost += primerWallsCost;
                    receiptHTML += `
                        <div class="receipt-work-line">
                            <div class="receipt-work-details">
                                <div class="receipt-work-name">Грунтовка стен (${prices.primer.square} руб/м²)</div>
                                <div class="receipt-work-calculation">${netWallsArea.toFixed(1)} м² × ${prices.primer.square} руб</div>
                                <div class="receipt-work-cost">${primerWallsCost.toFixed(2)} руб</div>
                            </div>
                        </div>
                        <div class="receipt-divider"></div>
                    `;
                    
                    const plasterWallsCost = netWallsArea * prices.plaster.square;
                    plasterCost += plasterWallsCost;
                    receiptHTML += `
                        <div class="receipt-work-line">
                            <div class="receipt-work-details">
                                <div class="receipt-work-name">Штукатурка стен 0.5 см (${prices.plaster.square} руб/м²)</div>
                                <div class="receipt-work-calculation">${netWallsArea.toFixed(1)} м² × ${prices.plaster.square} руб</div>
                                <div class="receipt-work-cost">${plasterWallsCost.toFixed(2)} руб</div>
                            </div>
                        </div>
                        <div class="receipt-divider"></div>
                    `;
                    
                    if (slopesLinear > 0) {
                        const primerSlopesCost = slopesLinear * prices.primer.linear;
                        plasterCost += primerSlopesCost;
                        receiptHTML += `
                            <div class="receipt-work-line">
                                <div class="receipt-work-details">
                                    <div class="receipt-work-name">Грунтовка откосов (${prices.primer.linear} руб/мп)</div>
                                    <div class="receipt-work-calculation">${slopesLinear.toFixed(1)} мп × ${prices.primer.linear} руб</div>
                                    <div class="receipt-work-cost">${primerSlopesCost.toFixed(2)} руб</div>
                                </div>
                            </div>
                            <div class="receipt-divider"></div>
                        `;
                        
                        const plasterSlopesCost = slopesLinear * prices.plaster.linear;
                        plasterCost += plasterSlopesCost;
                        receiptHTML += `
                            <div class="receipt-work-line">
                                <div class="receipt-work-details">
                                    <div class="receipt-work-name">Штукатурка откосов (${prices.plaster.linear} руб/мп)</div>
                                    <div class="receipt-work-calculation">${slopesLinear.toFixed(1)} мп × ${prices.plaster.linear} руб</div>
                                    <div class="receipt-work-cost">${plasterSlopesCost.toFixed(2)} руб</div>
                                </div>
                            </div>
                            <div class="receipt-divider"></div>
                        `;
                        
                        const cornerCost = slopesLinear * prices.corner.linear;
                        plasterCost += cornerCost;
                        receiptHTML += `
                            <div class="receipt-work-line">
                                <div class="receipt-work-details">
                                    <div class="receipt-work-name">Установка уголков (${prices.corner.linear} руб/мп)</div>
                                    <div class="receipt-work-calculation">${slopesLinear.toFixed(1)} мп × ${prices.corner.linear} руб</div>
                                    <div class="receipt-work-cost">${cornerCost.toFixed(2)} руб</div>
                                </div>
                            </div>
                            <div class="receipt-divider"></div>
                        `;
                    }
                    
                    receiptHTML += `
                        <div class="receipt-subtotal">
                            <div>Итого по штукатурке:</div>
                            <div>${plasterCost.toFixed(2)} руб</div>
                        </div>
                    </div>
                    `;
                    roomCost += plasterCost;
                }
                
                // Армирование сеткой
                if (room.armoring) {
                    let armoringCost = 0;
                    receiptHTML += `
                        <div class="receipt-section">
                            <div class="receipt-section-header">АРМИРОВАНИЕ СЕТКОЙ</div>
                    `;
                    
                    const armoringWallsCost = netWallsArea * prices.armoring.square;
                    armoringCost += armoringWallsCost;
                    receiptHTML += `
                        <div class="receipt-work-line">
                            <div class="receipt-work-details">
                                <div class="receipt-work-name">Армирование стен (${prices.armoring.square} руб/м²)</div>
                                <div class="receipt-work-calculation">${netWallsArea.toFixed(1)} м² × ${prices.armoring.square} руб</div>
                                <div class="receipt-work-cost">${armoringWallsCost.toFixed(2)} руб</div>
                            </div>
                        </div>
                        <div class="receipt-divider"></div>
                    `;
                    
                    if (slopesLinearWithNet > 0) {
                        const armoringSlopesCost = slopesLinearWithNet * prices.armoring.linear;
                        armoringCost += armoringSlopesCost;
                        receiptHTML += `
                            <div class="receipt-work-line">
                                <div class="receipt-work-details">
                                    <div class="receipt-work-name">Армирование откосов (${prices.armoring.linear} руб/мп)</div>
                                    <div class="receipt-work-calculation">${slopesLinearWithNet.toFixed(1)} мп × ${prices.armoring.linear} руб</div>
                                    <div class="receipt-work-cost">${armoringSlopesCost.toFixed(2)} руб</div>
                                </div>
                            </div>
                            <div class="receipt-divider"></div>
                        `;
                    }
                    
                    receiptHTML += `
                        <div class="receipt-subtotal">
                            <div>Итого по армированию:</div>
                            <div>${armoringCost.toFixed(2)} руб</div>
                        </div>
                    </div>
                    `;
                    roomCost += armoringCost;
                }
                
                // Финишная шпаклевка
                if (room.puttyWallpaper || room.puttyPaint) {
                    let puttyCost = 0;
                    const puttyType = room.puttyWallpaper ? 'wallpaper' : 'paint';
                    const puttyName = room.puttyWallpaper ? 'под обои' : 'под покраску';
                    const puttyPrice = prices.putty[puttyType];
                    
                    receiptHTML += `
                        <div class="receipt-section">
                            <div class="receipt-section-header">ФИНИШНАЯ ШПАКЛЕВКА ${puttyName.toUpperCase()}</div>
                    `;
                    
                    const puttyWallsCost = netWallsArea * puttyPrice.square;
                    puttyCost += puttyWallsCost;
                    receiptHTML += `
                        <div class="receipt-work-line">
                            <div class="receipt-work-details">
                                <div class="receipt-work-name">Шпаклевка стен (${puttyPrice.square} руб/м²)</div>
                                <div class="receipt-work-calculation">${netWallsArea.toFixed(1)} м² × ${puttyPrice.square} руб</div>
                                <div class="receipt-work-cost">${puttyWallsCost.toFixed(2)} руб</div>
                            </div>
                        </div>
                        <div class="receipt-divider"></div>
                    `;
                    
                    if (slopesLinear > 0) {
                        const puttySlopesCost = slopesLinear * puttyPrice.linear;
                        puttyCost += puttySlopesCost;
                        receiptHTML += `
                            <div class="receipt-work-line">
                                <div class="receipt-work-details">
                                    <div class="receipt-work-name">Шпаклевка откосов (${puttyPrice.linear} руб/мп)</div>
                                    <div class="receipt-work-calculation">${slopesLinear.toFixed(1)} мп × ${puttyPrice.linear} руб</div>
                                    <div class="receipt-work-cost">${puttySlopesCost.toFixed(2)} руб</div>
                                </div>
                            </div>
                            <div class="receipt-divider"></div>
                        `;
                    }
                    
                    const sandingWallsCost = netWallsArea * prices.sanding.square;
                    puttyCost += sandingWallsCost;
                    receiptHTML += `
                        <div class="receipt-work-line">
                            <div class="receipt-work-details">
                                <div class="receipt-work-name">Зашкуривание стен (${prices.sanding.square} руб/м²)</div>
                                <div class="receipt-work-calculation">${netWallsArea.toFixed(1)} м² × ${prices.sanding.square} руб</div>
                                <div class="receipt-work-cost">${sandingWallsCost.toFixed(2)} руб</div>
                            </div>
                        </div>
                        <div class="receipt-divider"></div>
                    `;
                    
                    if (slopesLinear > 0) {
                        const sandingSlopesCost = slopesLinear * prices.sanding.linear;
                        puttyCost += sandingSlopesCost;
                        receiptHTML += `
                            <div class="receipt-work-line">
                                <div class="receipt-work-details">
                                    <div class="receipt-work-name">Зашкуривание откосов (${prices.sanding.linear} руб/мп)</div>
                                    <div class="receipt-work-calculation">${slopesLinear.toFixed(1)} мп × ${prices.sanding.linear} руб</div>
                                    <div class="receipt-work-cost">${sandingSlopesCost.toFixed(2)} руб</div>
                                </div>
                            </div>
                            <div class="receipt-divider"></div>
                        `;
                    }
                    
                    receiptHTML += `
                        <div class="receipt-subtotal">
                            <div>Итого по шпаклевке:</div>
                            <div>${puttyCost.toFixed(2)} руб</div>
                        </div>
                    </div>
                    `;
                    roomCost += puttyCost;
                }
                
                // Покраска
                if (room.painting) {
                    let paintingCost = 0;
                    receiptHTML += `
                        <div class="receipt-section">
                            <div class="receipt-section-header">ПОКРАСКА В 2 СЛОЯ</div>
                    `;
                    
                    const paintingPrimerCost = netWallsArea * prices.primer.square;
                    paintingCost += paintingPrimerCost;
                    receiptHTML += `
                        <div class="receipt-work-line">
                            <div class="receipt-work-details">
                                <div class="receipt-work-name">Грунтовка перед покраской (${prices.primer.square} руб/м²)</div>
                                <div class="receipt-work-calculation">${netWallsArea.toFixed(1)} м² × ${prices.primer.square} руб</div>
                                <div class="receipt-work-cost">${paintingPrimerCost.toFixed(2)} руб</div>
                            </div>
                        </div>
                        <div class="receipt-divider"></div>
                    `;
                    
                    if (slopesLinear > 0) {
                        const paintingPrimerSlopesCost = slopesLinear * prices.primer.linear;
                        paintingCost += paintingPrimerSlopesCost;
                        receiptHTML += `
                            <div class="receipt-work-line">
                                <div class="receipt-work-details">
                                    <div class="receipt-work-name">Грунтовка откосов перед покраской (${prices.primer.linear} руб/мп)</div>
                                    <div class="receipt-work-calculation">${slopesLinear.toFixed(1)} мп × ${prices.primer.linear} руб</div>
                                    <div class="receipt-work-cost">${paintingPrimerSlopesCost.toFixed(2)} руб</div>
                                </div>
                            </div>
                            <div class="receipt-divider"></div>
                        `;
                    }
                    
                    const paintingWallsCost = netWallsArea * prices.painting.square;
                    paintingCost += paintingWallsCost;
                    receiptHTML += `
                        <div class="receipt-work-line">
                            <div class="receipt-work-details">
                                <div class="receipt-work-name">Покраска стен 2 слоя (${prices.painting.square} руб/м²)</div>
                                <div class="receipt-work-calculation">${netWallsArea.toFixed(1)} м² × ${prices.painting.square} руб</div>
                                <div class="receipt-work-cost">${paintingWallsCost.toFixed(2)} руб</div>
                            </div>
                        </div>
                        <div class="receipt-divider"></div>
                    `;
                    
                    if (slopesLinear > 0) {
                        const paintingSlopesCost = slopesLinear * prices.painting.linear;
                        paintingCost += paintingSlopesCost;
                        receiptHTML += `
                            <div class="receipt-work-line">
                                <div class="receipt-work-details">
                                    <div class="receipt-work-name">Покраска откосов 2 слоя (${prices.painting.linear} руб/мп)</div>
                                    <div class="receipt-work-calculation">${slopesLinear.toFixed(1)} мп × ${prices.painting.linear} руб</div>
                                    <div class="receipt-work-cost">${paintingSlopesCost.toFixed(2)} руб</div>
                                </div>
                            </div>
                            <div class="receipt-divider"></div>
                        `;
                    }
                    
                    receiptHTML += `
                        <div class="receipt-subtotal">
                            <div>Итого по покраске:</div>
                            <div>${paintingCost.toFixed(2)} руб</div>
                        </div>
                    </div>
                    `;
                    roomCost += paintingCost;
                }
                
                receiptHTML += `
                    <div class="receipt-line" style="border-top: 2px dashed #000; margin-top: 10px; padding-top: 10px;">
                        <div style="font-weight: bold;">ИТОГО ПО КОМНАТЕ:</div>
                        <div style="font-weight: bold;">${roomCost.toFixed(2)} руб</div>
                    </div>
                    <div class="receipt-line" style="border-bottom: 2px dashed #000; margin-bottom: 20px;"></div>
                `;
                
                totalCost += roomCost;
            });
            
            projectTotalCost = totalCost;
            
            receiptHTML += `
                <div class="receipt-total">
                    <div>ОБЩАЯ СТОИМОСТЬ РАБОТ</div>
                    <div style="font-size: 1.5rem; margin-top: 10px;">${projectTotalCost.toFixed(2)} руб</div>
                </div>
                <div class="receipt-footer">
                    <div>Спасибо за использование нашего конструктора!</div>
                    <div>Расчет действителен на ${new Date().toLocaleDateString()} для г. Симферополь</div>
                </div>
            `;
            
            const receiptContent = safeGetElement('receiptContent');
            const receiptContainer = safeGetElement('receiptContainer');
            if (receiptContent) receiptContent.innerHTML = receiptHTML;
            if (receiptContainer) receiptContainer.style.display = 'block';
            
            const receiptActions = safeGetElement('receiptActions');
            if (receiptActions) receiptActions.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error calculating cost:', error);
        showNotification('Ошибка расчета стоимости');
    }
}

function getReceiptText() {
    try {
        let text = `🧾 СМЕТА РАБОТ\n`;
        text += `📅 ${new Date().toLocaleDateString()}\n`;
        text += `📍 Расчет для г. Симферополь\n\n`;
        
        let totalCost = 0;
        
        if (!rooms || rooms.length === 0) {
            text += `Нет данных для расчета\n\n`;
            return text;
        }
        
        rooms.forEach(room => {
            if (!room) return;
            
            const roomArea = (room.width / scale * room.height / scale).toFixed(1);
            text += `🏠 ${escapeHTML(room.name || 'Комната')} (${(room.width / scale).toFixed(1)}×${(room.height / scale).toFixed(1)} м)\n`;
            text += `📐 Площадь: ${roomArea} м²\n`;
            text += `━━━━━━━━━━━━━━━━━━━━\n`;
            
            const ceilingHeightInput = safeGetElement('ceilingHeight');
            const ceilingHeight = ceilingHeightInput ? parseFloat(ceilingHeightInput.value) || 2.5 : 2.5;
            const perimeter = ((room.width / scale) + (room.height / scale)) * 2;
            const wallsArea = perimeter * ceilingHeight;
            
            let windowsArea = 0;
            let doorsArea = 0;
            let slopesLinear = 0;
            let slopesLinearWithNet = 0;
            
            if (room.windows && Array.isArray(room.windows)) {
                room.windows.forEach(window => {
                    if (!window) return;
                    windowsArea += window.width * window.height;
                    if (window.slopes === 'with') {
                        slopesLinear += (window.width + window.height * 2);
                    } else if (window.slopes === 'with_net') {
                        slopesLinear += (window.width + window.height * 2);
                        slopesLinearWithNet += (window.width + window.height * 2);
                    }
                });
            }
            
            if (room.doors && Array.isArray(room.doors)) {
                room.doors.forEach(door => {
                    if (!door) return;
                    doorsArea += door.width * door.height;
                    if (door.slopes === 'with') {
                        slopesLinear += (door.width + door.height * 2);
                    } else if (door.slopes === 'with_net') {
                        slopesLinear += (door.width + door.height * 2);
                        slopesLinearWithNet += (door.width + door.height * 2);
                    }
                });
            }
            
            const netWallsArea = Math.max(0, wallsArea - windowsArea - doorsArea);
            let roomCost = 0;
            
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
        
        const roomsCount = safeGetElement('roomsCount');
        const windowsCount = safeGetElement('windowsCount');
        const doorsCount = safeGetElement('doorsCount');
        const totalArea = safeGetElement('totalArea');
        const ceilingHeightInput = safeGetElement('ceilingHeight');
        
        text += `• Комнат: ${roomsCount ? roomsCount.textContent : '0'}\n`;
        text += `• Окон: ${windowsCount ? windowsCount.textContent : '0'}\n`;
        text += `• Дверей: ${doorsCount ? doorsCount.textContent : '0'}\n`;
        text += `• Общая площадь стен: ${totalArea ? totalArea.textContent : '0 м²'}\n`;
        text += `• Высота потолков: ${ceilingHeightInput ? ceilingHeightInput.value : '2.5'} м\n\n`;
        
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
    } catch (error) {
        console.error('Error generating receipt text:', error);
        return 'Ошибка формирования сметы. Пожалуйста, попробуйте еще раз.';
    }
}