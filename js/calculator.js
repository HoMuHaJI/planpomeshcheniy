// calculator.js – расчёт стоимости и формирование детальной сметы

// ============================================
// ЕДИНАЯ ФУНКЦИЯ ВОЗВРАТА ДАННЫХ ДЛЯ СМЕТЫ (с детализацией)
// ============================================
function generateReceiptData() {
    const ceilingHeightInput = safeGetElement('ceilingHeight');
    const ceilingHeight = ceilingHeightInput ? parseFloat(ceilingHeightInput.value) || 2.5 : 2.5;
    const roomsData = [];

    if (!window.rooms || window.rooms.length === 0) {
        return { rooms: [], totalCost: 0 };
    }

    window.rooms.forEach(room => {
        if (!room || !room.width || !room.height) return;

        const perimeter = ((room.width / window.scale) + (room.height / window.scale)) * 2;
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
        const items = []; // детальные строки для этой комнаты

        // Стартовая штукатурка
        if (room.plaster) {
            items.push({
                type: 'plaster',
                sub: 'Грунтовка стен',
                quantity: netWallsArea,
                unit: 'м²',
                price: window.prices.primer.square,
                cost: netWallsArea * window.prices.primer.square
            });
            items.push({
                type: 'plaster',
                sub: 'Штукатурка стен 0.5 см',
                quantity: netWallsArea,
                unit: 'м²',
                price: window.prices.plaster.square,
                cost: netWallsArea * window.prices.plaster.square
            });
            if (slopesLinear > 0) {
                items.push({
                    type: 'plaster',
                    sub: 'Грунтовка откосов',
                    quantity: slopesLinear,
                    unit: 'мп',
                    price: window.prices.primer.linear,
                    cost: slopesLinear * window.prices.primer.linear
                });
                items.push({
                    type: 'plaster',
                    sub: 'Штукатурка откосов',
                    quantity: slopesLinear,
                    unit: 'мп',
                    price: window.prices.plaster.linear,
                    cost: slopesLinear * window.prices.plaster.linear
                });
                items.push({
                    type: 'plaster',
                    sub: 'Установка уголков',
                    quantity: slopesLinear,
                    unit: 'мп',
                    price: window.prices.corner.linear,
                    cost: slopesLinear * window.prices.corner.linear
                });
            }
        }

        // Армирование сеткой
        if (room.armoring) {
            items.push({
                type: 'armoring',
                sub: 'Армирование стен',
                quantity: netWallsArea,
                unit: 'м²',
                price: window.prices.armoring.square,
                cost: netWallsArea * window.prices.armoring.square
            });
            if (slopesLinearWithNet > 0) {
                items.push({
                    type: 'armoring',
                    sub: 'Армирование откосов',
                    quantity: slopesLinearWithNet,
                    unit: 'мп',
                    price: window.prices.armoring.linear,
                    cost: slopesLinearWithNet * window.prices.armoring.linear
                });
            }
        }

        // Финишная шпаклевка
        if (room.puttyWallpaper || room.puttyPaint) {
            const puttyType = room.puttyWallpaper ? 'wallpaper' : 'paint';
            const puttyName = room.puttyWallpaper ? 'под обои' : 'под покраску';
            const puttyPrice = window.prices.putty[puttyType];
            items.push({
                type: 'putty',
                sub: `Шпаклевка стен ${puttyName}`,
                quantity: netWallsArea,
                unit: 'м²',
                price: puttyPrice.square,
                cost: netWallsArea * puttyPrice.square
            });
            items.push({
                type: 'putty',
                sub: 'Зашкуривание стен',
                quantity: netWallsArea,
                unit: 'м²',
                price: window.prices.sanding.square,
                cost: netWallsArea * window.prices.sanding.square
            });
            if (slopesLinear > 0) {
                items.push({
                    type: 'putty',
                    sub: `Шпаклевка откосов ${puttyName}`,
                    quantity: slopesLinear,
                    unit: 'мп',
                    price: puttyPrice.linear,
                    cost: slopesLinear * puttyPrice.linear
                });
                items.push({
                    type: 'putty',
                    sub: 'Зашкуривание откосов',
                    quantity: slopesLinear,
                    unit: 'мп',
                    price: window.prices.sanding.linear,
                    cost: slopesLinear * window.prices.sanding.linear
                });
            }
        }

        // Покраска
        if (room.painting) {
            items.push({
                type: 'painting',
                sub: 'Грунтовка перед покраской',
                quantity: netWallsArea,
                unit: 'м²',
                price: window.prices.primer.square,
                cost: netWallsArea * window.prices.primer.square
            });
            items.push({
                type: 'painting',
                sub: 'Покраска стен 2 слоя',
                quantity: netWallsArea,
                unit: 'м²',
                price: window.prices.painting.square,
                cost: netWallsArea * window.prices.painting.square
            });
            if (slopesLinear > 0) {
                items.push({
                    type: 'painting',
                    sub: 'Грунтовка откосов перед покраской',
                    quantity: slopesLinear,
                    unit: 'мп',
                    price: window.prices.primer.linear,
                    cost: slopesLinear * window.prices.primer.linear
                });
                items.push({
                    type: 'painting',
                    sub: 'Покраска откосов 2 слоя',
                    quantity: slopesLinear,
                    unit: 'мп',
                    price: window.prices.painting.linear,
                    cost: slopesLinear * window.prices.painting.linear
                });
            }
        }

        // Считаем общую стоимость комнаты
        const roomCost = items.reduce((sum, item) => sum + item.cost, 0);

        roomsData.push({
            name: room.name,
            width: room.width / window.scale,
            height: room.height / window.scale,
            cost: roomCost,
            items: items
        });
    });

    const totalCost = roomsData.reduce((sum, room) => sum + room.cost, 0);
    return { rooms: roomsData, totalCost };
}

// ============================================
// ФОРМИРОВАНИЕ HTML-СМЕТЫ (для экрана)
// ============================================
function calculateCost() {
    try {
        const data = generateReceiptData();
        const receiptContainer = safeGetElement('receiptContainer');
        const receiptActions = safeGetElement('receiptActions');
        const receiptContent = safeGetElement('receiptContent');

        if (data.rooms.length === 0) {
            if (receiptContainer) receiptContainer.style.display = 'none';
            if (receiptActions) receiptActions.style.display = 'none';
            if (receiptContent) {
                receiptContent.innerHTML = '<div class="receipt-section-header">Нет данных для расчета</div><div style="text-align:center; padding:20px;">Добавьте комнаты, чтобы увидеть смету.</div>';
            }
            return;
        }

        let receiptHTML = `
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

        data.rooms.forEach(room => {
            receiptHTML += `
                <div class="receipt-room-header">
                    ${escapeHTML(room.name)} (${room.width.toFixed(1)}x${room.height.toFixed(1)} м)
                </div>
            `;

            // Группируем элементы по типу для заголовков (как в оригинале)
            const plasterItems = room.items.filter(i => i.type === 'plaster');
            const armoringItems = room.items.filter(i => i.type === 'armoring');
            const puttyItems = room.items.filter(i => i.type === 'putty');
            const paintingItems = room.items.filter(i => i.type === 'painting');

            if (plasterItems.length > 0) {
                receiptHTML += `<div class="receipt-section"><div class="receipt-section-header">СТАРТОВАЯ ШТУКАТУРКА</div>`;
                plasterItems.forEach(item => {
                    receiptHTML += `
                        <div class="receipt-work-line">
                            <div class="receipt-work-details">
                                <div class="receipt-work-name">${item.sub} (${item.price} руб/${item.unit})</div>
                                <div class="receipt-work-calculation">${item.quantity.toFixed(1)} ${item.unit} × ${item.price} руб</div>
                                <div class="receipt-work-cost">${item.cost.toFixed(2)} руб</div>
                            </div>
                        </div>
                        <div class="receipt-divider"></div>
                    `;
                });
                const plasterTotal = plasterItems.reduce((sum, i) => sum + i.cost, 0);
                receiptHTML += `
                        <div class="receipt-subtotal">
                            <div>Итого по штукатурке:</div>
                            <div>${plasterTotal.toFixed(2)} руб</div>
                        </div>
                    </div>
                `;
            }

            if (armoringItems.length > 0) {
                receiptHTML += `<div class="receipt-section"><div class="receipt-section-header">АРМИРОВАНИЕ СЕТКОЙ</div>`;
                armoringItems.forEach(item => {
                    receiptHTML += `
                        <div class="receipt-work-line">
                            <div class="receipt-work-details">
                                <div class="receipt-work-name">${item.sub} (${item.price} руб/${item.unit})</div>
                                <div class="receipt-work-calculation">${item.quantity.toFixed(1)} ${item.unit} × ${item.price} руб</div>
                                <div class="receipt-work-cost">${item.cost.toFixed(2)} руб</div>
                            </div>
                        </div>
                        <div class="receipt-divider"></div>
                    `;
                });
                const armoringTotal = armoringItems.reduce((sum, i) => sum + i.cost, 0);
                receiptHTML += `
                        <div class="receipt-subtotal">
                            <div>Итого по армированию:</div>
                            <div>${armoringTotal.toFixed(2)} руб</div>
                        </div>
                    </div>
                `;
            }

            if (puttyItems.length > 0) {
                const puttyName = room.items.some(i => i.sub.includes('под обои')) ? 'под обои' : 'под покраску';
                receiptHTML += `<div class="receipt-section"><div class="receipt-section-header">ФИНИШНАЯ ШПАКЛЕВКА ${puttyName.toUpperCase()}</div>`;
                puttyItems.forEach(item => {
                    receiptHTML += `
                        <div class="receipt-work-line">
                            <div class="receipt-work-details">
                                <div class="receipt-work-name">${item.sub} (${item.price} руб/${item.unit})</div>
                                <div class="receipt-work-calculation">${item.quantity.toFixed(1)} ${item.unit} × ${item.price} руб</div>
                                <div class="receipt-work-cost">${item.cost.toFixed(2)} руб</div>
                            </div>
                        </div>
                        <div class="receipt-divider"></div>
                    `;
                });
                const puttyTotal = puttyItems.reduce((sum, i) => sum + i.cost, 0);
                receiptHTML += `
                        <div class="receipt-subtotal">
                            <div>Итого по шпаклевке:</div>
                            <div>${puttyTotal.toFixed(2)} руб</div>
                        </div>
                    </div>
                `;
            }

            if (paintingItems.length > 0) {
                receiptHTML += `<div class="receipt-section"><div class="receipt-section-header">ПОКРАСКА В 2 СЛОЯ</div>`;
                paintingItems.forEach(item => {
                    receiptHTML += `
                        <div class="receipt-work-line">
                            <div class="receipt-work-details">
                                <div class="receipt-work-name">${item.sub} (${item.price} руб/${item.unit})</div>
                                <div class="receipt-work-calculation">${item.quantity.toFixed(1)} ${item.unit} × ${item.price} руб</div>
                                <div class="receipt-work-cost">${item.cost.toFixed(2)} руб</div>
                            </div>
                        </div>
                        <div class="receipt-divider"></div>
                    `;
                });
                const paintingTotal = paintingItems.reduce((sum, i) => sum + i.cost, 0);
                receiptHTML += `
                        <div class="receipt-subtotal">
                            <div>Итого по покраске:</div>
                            <div>${paintingTotal.toFixed(2)} руб</div>
                        </div>
                    </div>
                `;
            }

            receiptHTML += `
                <div class="receipt-line" style="border-top: 2px dashed #000; margin-top: 10px; padding-top: 10px;">
                    <div style="font-weight: bold;">ИТОГО ПО КОМНАТЕ:</div>
                    <div style="font-weight: bold;">${room.cost.toFixed(2)} руб</div>
                </div>
                <div class="receipt-line" style="border-bottom: 2px dashed #000; margin-bottom: 20px;"></div>
            `;
        });

        receiptHTML += `
            <div class="receipt-total">
                <div>ОБЩАЯ СТОИМОСТЬ РАБОТ</div>
                <div style="font-size: 1.5rem; margin-top: 10px;">${data.totalCost.toFixed(2)} руб</div>
            </div>
            <div class="receipt-footer">
                <div>Спасибо за использование нашего конструктора!</div>
                <div>Расчет действителен на ${new Date().toLocaleDateString()} для г. Симферополь</div>
            </div>
        `;

        if (receiptContent) receiptContent.innerHTML = receiptHTML;
        if (receiptContainer) receiptContainer.style.display = 'block';
        if (receiptActions) receiptActions.style.display = 'block';

    } catch (error) {
        console.error('Error calculating cost:', error);
        showNotification('Ошибка расчета стоимости');
    }
}

// ============================================
// ФОРМИРОВАНИЕ ТЕКСТОВОЙ СМЕТЫ (для буфера / Max)
// ============================================
function getReceiptText() {
    try {
        const data = generateReceiptData();
        let text = `🧾 СМЕТА РАБОТ\n`;
        text += `📅 ${new Date().toLocaleDateString()}\n`;
        text += `📍 Расчет для г. Симферополь\n\n`;

        if (data.rooms.length === 0) {
            text += `Нет данных для расчета\n\n`;
            return text;
        }

        data.rooms.forEach(room => {
            text += `🏠 ${escapeHTML(room.name)} (${room.width.toFixed(1)}×${room.height.toFixed(1)} м)\n`;
            text += `━━━━━━━━━━━━━━━━━━━━\n`;

            const plasterItems = room.items.filter(i => i.type === 'plaster');
            const armoringItems = room.items.filter(i => i.type === 'armoring');
            const puttyItems = room.items.filter(i => i.type === 'putty');
            const paintingItems = room.items.filter(i => i.type === 'painting');

            if (plasterItems.length > 0) {
                text += `СТАРТОВАЯ ШТУКАТУРКА:\n`;
                plasterItems.forEach(item => {
                    text += `├ ${item.sub}: ${item.quantity.toFixed(1)} ${item.unit} × ${item.price} руб = ${item.cost.toFixed(2)} руб\n`;
                });
                const plasterTotal = plasterItems.reduce((sum, i) => sum + i.cost, 0);
                text += `└ Итого по штукатурке: ${plasterTotal.toFixed(2)} руб\n\n`;
            }

            if (armoringItems.length > 0) {
                text += `АРМИРОВАНИЕ СЕТКОЙ:\n`;
                armoringItems.forEach(item => {
                    text += `├ ${item.sub}: ${item.quantity.toFixed(1)} ${item.unit} × ${item.price} руб = ${item.cost.toFixed(2)} руб\n`;
                });
                const armoringTotal = armoringItems.reduce((sum, i) => sum + i.cost, 0);
                text += `└ Итого по армированию: ${armoringTotal.toFixed(2)} руб\n\n`;
            }

            if (puttyItems.length > 0) {
                const puttyName = room.items.some(i => i.sub.includes('под обои')) ? 'под обои' : 'под покраску';
                text += `ФИНИШНАЯ ШПАКЛЕВКА ${puttyName.toUpperCase()}:\n`;
                puttyItems.forEach(item => {
                    text += `├ ${item.sub}: ${item.quantity.toFixed(1)} ${item.unit} × ${item.price} руб = ${item.cost.toFixed(2)} руб\n`;
                });
                const puttyTotal = puttyItems.reduce((sum, i) => sum + i.cost, 0);
                text += `└ Итого по шпаклевке: ${puttyTotal.toFixed(2)} руб\n\n`;
            }

            if (paintingItems.length > 0) {
                text += `ПОКРАСКА В 2 СЛОЯ:\n`;
                paintingItems.forEach(item => {
                    text += `├ ${item.sub}: ${item.quantity.toFixed(1)} ${item.unit} × ${item.price} руб = ${item.cost.toFixed(2)} руб\n`;
                });
                const paintingTotal = paintingItems.reduce((sum, i) => sum + i.cost, 0);
                text += `└ Итого по покраске: ${paintingTotal.toFixed(2)} руб\n\n`;
            }

            text += `💰 ИТОГО ПО КОМНАТЕ: ${room.cost.toFixed(2)} руб\n\n`;
        });

        text += `════════════════════════════\n`;
        text += `💵 ОБЩАЯ СТОИМОСТЬ РАБОТ: ${data.totalCost.toFixed(2)} руб\n`;
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
        text += `• Штукатурка: ${window.prices.plaster.square} руб/м²\n`;
        text += `• Армирование сеткой: ${window.prices.armoring.square} руб/м²\n`;
        text += `• Шпаклевка под обои: ${window.prices.putty.wallpaper.square} руб/м²\n`;
        text += `• Шпаклевка под покраску: ${window.prices.putty.paint.square} руб/м²\n`;
        text += `• Покраска: ${window.prices.painting.square} руб/м²\n\n`;

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