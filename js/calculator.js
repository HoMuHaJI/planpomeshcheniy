// Функции для расчета стоимости

// Расчет стоимости работ и формирование кассового чека
function calculateCost() {
    const state = PlanPomesheniy.getState();
    const prices = PlanPomesheniy.getPrices();
    
    const ceilingHeightInput = getElementSafe('ceilingHeight');
    const ceilingHeight = ceilingHeightInput ? parseFloat(ceilingHeightInput.value) : 2.5;
    
    let totalCost = 0;
    let estimateHTML = '';
    
    const receiptContainer = getElementSafe('receiptContainer');
    const receiptContent = getElementSafe('receiptContent');
    const estimateResults = getElementSafe('estimateResults');
    
    if (state.rooms.length === 0) {
        estimateHTML = '<div class="summary-item">Добавьте комнаты для расчета стоимости</div>';
        if (receiptContainer) {
            receiptContainer.style.display = 'none';
        }
        
        // Скрываем кнопки отправки, если нет комнат
        const receiptActions = getElementSafe('receiptActions');
        if (receiptActions) {
            receiptActions.style.display = 'none';
        }
    } else {
        let projectTotalCost = 0;
        let receiptHTML = '';
        
        // Заголовок чека
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
        
        state.rooms.forEach(room => {
            const perimeter = ((room.width / state.scale) + (room.height / state.scale)) * 2;
            const wallsArea = perimeter * ceilingHeight;
            
            // Вычитаем площади окон и дверей
            let windowsArea = 0;
            let doorsArea = 0;
            let slopesLinear = 0;
            let slopesLinearWithNet = 0;
            
            room.windows.forEach(window => {
                windowsArea += window.width * window.height;
                if (window.slopes === 'with') {
                    // Для окон: 3 стороны (две боковые и верхняя)
                    slopesLinear += (window.width + window.height * 2);
                } else if (window.slopes === 'with_net') {
                    // Для окон с сеткой: 3 стороны (две боковые и верхняя)
                    slopesLinear += (window.width + window.height * 2);
                    slopesLinearWithNet += (window.width + window.height * 2);
                }
            });
            
            room.doors.forEach(door => {
                doorsArea += door.width * door.height;
                if (door.slopes === 'with') {
                    // Для дверей: 3 стороны (две боковые и верхняя)
                    slopesLinear += (door.width + door.height * 2);
                } else if (door.slopes === 'with_net') {
                    // Для дверей с сеткой: 3 стороны (две боковые и верхняя)
                    slopesLinear += (door.width + door.height * 2);
                    slopesLinearWithNet += (door.width + door.height * 2);
                }
            });
            
            const netWallsArea = wallsArea - windowsArea - doorsArea;
            
            // Расчет стоимости для комнаты
            let roomCost = 0;
            
            // Добавляем заголовок комнаты в чек
            receiptHTML += `
                <div class="receipt-room-header">
                    ${escapeHTML(room.name)} (${(room.width / state.scale).toFixed(1)}x${(room.height / state.scale).toFixed(1)} м)
                </div>
            `;
            
            // Стартовая штукатурка
            if (room.plaster) {
                let plasterCost = 0;
                receiptHTML += `
                    <div class="receipt-section">
                        <div class="receipt-section-header">СТАРТОВАЯ ШТУКАТУРКА</div>
                `;
                
                // Грунтовка стен
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
                
                // Штукатурка стен
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
                
                // Работы по откосам (только если есть окна/двери с откосами)
                if (slopesLinear > 0) {
                    // Грунтовка откосов
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
                    
                    // Штукатурка откосов
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
                    
                    // Установка уголков
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
                
                // Армирование стен
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
                
                // Армирование откосов (только с сеткой)
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
                
                // Шпаклевка стен
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
                
                // Работы по откосам (только если есть окна/двери с откосами)
                if (slopesLinear > 0) {
                    // Шпаклевка откосов
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
                
                // Зашкуривание стен
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
                
                // Зашкуривание откосов (только если есть окна/двери с откосами)
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
                
                // Грунтовка перед покраской
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
                
                // Грунтовка откосов перед покраской (только если есть окна/двери с откосами)
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
                
                // Покраска стен
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
                
                // Покраска откосов (только если есть окна/двери с откосами)
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
            
            // Итог по комнате
            receiptHTML += `
                <div class="receipt-line" style="border-top: 2px dashed #000; margin-top: 10px; padding-top: 10px;">
                    <div style="font-weight: bold;">ИТОГО ПО КОМНАТЕ:</div>
                    <div style="font-weight: bold;">${roomCost.toFixed(2)} руб</div>
                </div>
                <div class="receipt-line" style="border-bottom: 2px dashed #000; margin-bottom: 20px;"></div>
            `;
            
            totalCost += roomCost;
            
            estimateHTML += `
                <div class="summary-item">
                    <span>${escapeHTML(room.name)}:</span>
                    <span>${roomCost.toFixed(2)} руб.</span>
                </div>
            `;
        });
        
        projectTotalCost = totalCost;
        
        // Итоговая стоимость в чеке
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
        
        if (receiptContent) {
            receiptContent.innerHTML = receiptHTML;
        }
        if (receiptContainer) {
            receiptContainer.style.display = 'block';
        }
        
        // Показываем кнопки отправки
        showSharingButtons();
    }
    
    if (estimateResults) {
        estimateResults.innerHTML = estimateHTML;
    }
}

// Функция для показа кнопок отправки
function showSharingButtons() {
    const state = PlanPomesheniy.getState();
    const receiptActions = getElementSafe('receiptActions');
    if (receiptActions && state.rooms.length > 0) {
        receiptActions.style.display = 'block';
    }
}