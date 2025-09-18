// --- ⬇️ ใส่ Web app URL ที่ถูกต้องของคุณตรงนี้! ⬇️ ---
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyRO_WU54Ebtum0-xIbhEShGm3Ml1-bOtecR6ltfh_JuEkd6nTjsLX2w7LWbY_1RpcZ/exec';
// ----------------------------------------------------

window.addEventListener('DOMContentLoaded', () => {
    // --- Element Declarations ---
    const form = document.getElementById('order-form');
    const menuContainer = document.getElementById('menu-container');
    const loadingMessage = document.getElementById('loading-menu');
    const statusMessage = document.getElementById('status-message');
    const getLocationBtn = document.getElementById('get-location-btn');
    const locationStatus = document.getElementById('location-status');
    const totalPriceValue = document.getElementById('total-price-value');
    const grandTotalValue = document.getElementById('grand-total-value');
    const totalItemsCount = document.getElementById('total-items-count');
    const reviewOrderBtn = document.getElementById('review-order-btn');

    // Modal elements
    const summaryModal = document.getElementById('summary-modal');
    const customerSummary = document.getElementById('customer-summary');
    const orderSummaryList = document.getElementById('order-summary-list');
    const costSummary = document.getElementById('cost-summary');
    const editOrderBtn = document.getElementById('edit-order-btn');
    const confirmOrderBtn = document.getElementById('confirm-order-btn');
    
    let userLocation = null;
    let menuData = [];
    let currentOrderData = {};

    // --- Main Functions ---
    async function fetchMenu() {
        try {
            const response = await fetch(WEB_APP_URL);
            const result = await response.json();
            if (result.status === 'success') {
                menuData = result.data;
                renderMenu(menuData);
            } else { 
                loadingMessage.textContent = 'ไม่สามารถโหลดเมนูได้'; 
            }
        } catch (error) { 
            loadingMessage.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ'; 
        }
    }

    function renderMenu(items) {
        loadingMessage.style.display = 'none';
        menuContainer.innerHTML = '<h2>เมนูอาหาร</h2>';
        items.forEach((item) => {
            let subOptionsHTML = '';
            if (item.Options && item.Options.length > 0) {
                const options = item.Options.split(',').map(opt => opt.trim());
                subOptionsHTML += '<div class="sub-options-container">';
                options.forEach((option, optionIndex) => {
                    subOptionsHTML += `<label><input type="radio" name="option-${item.ItemID}" value="${option}" ${optionIndex === 0 ? 'checked' : ''}><span>${option}</span></label>`;
                });
                subOptionsHTML += '</div>';
            }
            const specialRequestHTML = `<div class="special-request-container"><input type="text" class="special-request-input" data-itemid="${item.ItemID}" placeholder="คำสั่งพิเศษ (เช่น ไม่ใส่ผัก)"></div>`;
            const menuItemHTML = `
                <div class="menu-item-dynamic" id="${item.ItemID}">
                    <div class="menu-item-header">
                        <img src="${item.ImageURL}" alt="${item.Name}" onerror="this.src='https://placehold.co/140x140/EFEFEF/AAAAAA?text=Image'">
                        <div class="menu-item-info">
                            <span>${item.Name}</span>
                            <small>${item.Price} บาท</small>
                        </div>
                        <div class="quantity-controls">
                            <button type="button" class="btn-minus" data-itemid="${item.ItemID}">-</button>
                            <span class="quantity-display" id="qty-${item.ItemID}">0</span>
                            <button type="button" class="btn-plus" data-itemid="${item.ItemID}">+</button>
                        </div>
                    </div>
                    ${subOptionsHTML}
                    ${specialRequestHTML}
                </div>`;
            menuContainer.innerHTML += menuItemHTML;
        });
        addQuantityButtonListeners();
    }

    function addQuantityButtonListeners() {
        document.querySelectorAll('.btn-plus').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.itemid;
                const qtySpan = document.getElementById(`qty-${itemId}`);
                let currentQty = parseInt(qtySpan.textContent);
                qtySpan.textContent = currentQty + 1;
                updateTotals();
            });
        });

        document.querySelectorAll('.btn-minus').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.itemid;
                const qtySpan = document.getElementById(`qty-${itemId}`);
                let currentQty = parseInt(qtySpan.textContent);
                if (currentQty > 0) {
                    qtySpan.textContent = currentQty - 1;
                    updateTotals();
                }
            });
        });
    }

    function updateTotals() {
        const quantityDisplays = document.querySelectorAll('.quantity-display');
        let totalPrice = 0;
        let totalItems = 0;
        quantityDisplays.forEach(span => {
            const quantity = parseInt(span.textContent, 10);
            if (quantity > 0) {
                const itemId = span.id.replace('qty-', '');
                const selectedItem = menuData.find(item => item.ItemID === itemId);
                if (selectedItem) { 
                    totalPrice += selectedItem.Price * quantity;
                    totalItems += quantity;
                }
            }
        });
        totalPriceValue.textContent = totalPrice;
        grandTotalValue.textContent = totalPrice; // Update grand total too
        totalItemsCount.textContent = totalItems;
    }

    function collectOrderData() {
        const customerName = document.getElementById('customer-name').value;
        const customerPhone = document.getElementById('customer-phone').value;
        const customerAddress = document.getElementById('customer-address').value;
        const quantityDisplays = document.querySelectorAll('.quantity-display');
        const orderDetails = [];
        let totalPrice = 0;

        quantityDisplays.forEach(span => {
            const quantity = parseInt(span.textContent, 10);
            if (quantity > 0) {
                const itemId = span.id.replace('qty-', '');
                const selectedItem = menuData.find(item => item.ItemID === itemId);
                if (selectedItem) {
                    let itemName = selectedItem.Name;
                    const selectedOption = document.querySelector(`input[name="option-${itemId}"]:checked`);
                    if (selectedOption) { itemName += ` (${selectedOption.value})`; }
                    const specialRequestInput = document.querySelector(`.special-request-input[data-itemid="${itemId}"]`);
                    const specialRequest = specialRequestInput.value.trim();
                    if (specialRequest) { itemName += ` [${specialRequest}]`; }
                    orderDetails.push({ name: itemName, qty: quantity });
                    totalPrice += selectedItem.Price * quantity;
                }
            }
        });

        const deliveryFee = 0; // Placeholder

        return {
            name: customerName, phone: customerPhone, address: customerAddress,
            orderDetailsRaw: orderDetails,
            orderDetails: orderDetails.map(item => `${item.name}: ${item.qty}`).join(', '),
            totalPrice: totalPrice,
            deliveryFee: deliveryFee,
            grandTotal: totalPrice + deliveryFee,
            latitude: userLocation ? userLocation.latitude : null, 
            longitude: userLocation ? userLocation.longitude : null
        };
    }
    
    // --- Event Listeners ---
    getLocationBtn.addEventListener('click', () => { 
        if (navigator.geolocation) {
            locationStatus.textContent = "กำลังค้นหาตำแหน่ง...";
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                    locationStatus.textContent = "✅ ได้รับตำแหน่งแล้ว!";
                    locationStatus.style.color = "green";
                },
                () => {
                    locationStatus.textContent = "⚠️ ไม่สามารถเข้าถึงตำแหน่งได้";
                    locationStatus.style.color = "red";
                }
            );
        } else {
            locationStatus.textContent = "เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง";
        }
     });

    reviewOrderBtn.addEventListener('click', () => {
        statusMessage.textContent = ''; 
        if (!form.checkValidity()) {
            statusMessage.textContent = "กรุณากรอกข้อมูลลูกค้าให้ครบถ้วน";
            statusMessage.style.color = 'red';
            form.reportValidity();
            return;
        }
        if (!userLocation) {
            statusMessage.textContent = "กรุณากดปักหมุดตำแหน่งปัจจุบันก่อน";
            statusMessage.style.color = 'red';
            return;
        }
        
        currentOrderData = collectOrderData();

        if (currentOrderData.orderDetailsRaw.length === 0) {
             statusMessage.textContent = "กรุณาเลือกอาหารอย่างน้อย 1 รายการ";
             statusMessage.style.color = 'red';
             return;
        }
        
        customerSummary.innerHTML = `<div><strong>ชื่อ:</strong> ${currentOrderData.name}</div><div><strong>โทร:</strong> ${currentOrderData.phone}</div><div><strong>ที่อยู่:</strong> ${currentOrderData.address}</div>`;
        orderSummaryList.innerHTML = currentOrderData.orderDetailsRaw.map(item => `<div>- ${item.name} (จำนวน ${item.qty})</div>`).join('');
        costSummary.innerHTML = `
            <div>ค่าอาหาร: ${currentOrderData.totalPrice} บาท</div>
            <div>ค่าส่ง: ${currentOrderData.deliveryFee} บาท</div>
            <div id="grand-total-modal">รวมทั้งสิ้น: ${currentOrderData.grandTotal} บาท</div>
        `;
        
        summaryModal.style.display = 'block';
    });

    editOrderBtn.addEventListener('click', () => {
        summaryModal.style.display = 'none';
    });

    confirmOrderBtn.addEventListener('click', () => {
        confirmOrderBtn.disabled = true;
        confirmOrderBtn.textContent = 'กำลังส่ง...';

        fetch(WEB_APP_URL, {
            method: 'POST', mode: 'no-cors',
            body: JSON.stringify(currentOrderData)
        })
        .then(() => {
            statusMessage.textContent = '✔ ได้รับออเดอร์ของคุณแล้ว! ขอบคุณครับ';
            statusMessage.style.color = 'green';
            form.reset();
            locationStatus.textContent = 'ยังไม่ได้ระบุตำแหน่ง';
            updateTotals();
            summaryModal.style.display = 'none';
        })
        .catch(error => {
            statusMessage.textContent = `เกิดข้อผิดพลาด: ${error}`;
            statusMessage.style.color = 'red';
        })
        .finally(() => {
            confirmOrderBtn.disabled = false;
            confirmOrderBtn.textContent = 'ยืนยันการสั่งซื้อ';
        });
    });

    // Initial load
    fetchMenu();
});

