document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://look-njzu.onrender.com';

    let customers = [];
    let foods = [];
    let activeClientOrders = [];
    
    let activeClientId = localStorage.getItem('activeClientId') ? Number(localStorage.getItem('activeClientId')) : null; 

    const customersListEl = document.querySelector('.customers-list');
    const userAddForm = document.getElementById('userAdd');
    const usernameInput = document.getElementById('usernameInput');
    const telephoneInput = document.getElementById('telephoneInput');
    const clientIdEl = document.getElementById('clientId');
    const userHeaderEl = document.getElementById('userHeader');
    const ordersListEl = document.querySelector('.orders-list');
    const foodsForm = document.getElementById('foodsForm');
    const foodsSelect = document.getElementById('foodsSelect');
    const foodsCountInput = document.getElementById('foodsCount');

    async function getUsers() {
        try {
            const res = await fetch(`${API_URL}/users`);
            const result = await res.json();
            customers = result.data || [];
            
            if (customers.length > 0) {
                const exists = customers.some(c => Number(c.userId) === Number(activeClientId));
                if (!activeClientId || !exists) {
                    activeClientId = customers[0].userId;
                }
            }
            
            if (activeClientId) {
                localStorage.setItem('activeClientId', activeClientId);
            }

            renderCustomers();
            if (activeClientId) {
                await loadActiveClientOrders(activeClientId);
            }
        } catch (error) {
            console.error("Mijozlarni olishda xatolik:", error);
        }
    }

    async function getFoods() {
        try {
            const res = await fetch(`${API_URL}/foods`);
            const result = await res.json();
            foods = result.data || result || [];
            renderFoodsSelect();
        } catch (error) {
            console.error("Taomlarni olishda xatolik:", error);
        }
    }

    async function loadActiveClientOrders(userId) {
        try {
            const res = await fetch(`${API_URL}/orders/${userId}`);
            const result = await res.json();
            activeClientOrders = result.data || result || [];
            renderActiveCustomer();
        } catch (error) {
            console.error("Buyurtmalarni olishda xatolik:", error);
            activeClientOrders = [];
            renderActiveCustomer();
        }
    }

    function renderFoodsSelect() {
        foodsSelect.innerHTML = foods.map(food => `
            <option value="${food.foodId}">${food.food_name}</option>
        `).join('');
    }

    function renderCustomers() {
        customersListEl.innerHTML = customers.map(customer => `
            <li class="customer-item ${Number(customer.userId) === Number(activeClientId) ? 'active' : ''}" data-id="${customer.userId}" style="cursor: pointer;">
                <span class="customer-name">${customer.username}</span>
                <a class="customer-phone" href="tel:${customer.telephone}">${customer.telephone}</a>
            </li>
        `).join('');
    }

    function renderActiveCustomer() {
        const activeCustomer = customers.find(c => Number(c.userId) === Number(activeClientId));
        if (!activeCustomer) {
            clientIdEl.textContent = "";
            userHeaderEl.textContent = "Mijoz tanlanmagan";
            ordersListEl.innerHTML = "";
            return;
        }

        clientIdEl.textContent = activeCustomer.userId;
        userHeaderEl.textContent = activeCustomer.username;

        ordersListEl.innerHTML = activeClientOrders.map(order => {
            const food = order.foods?.[0] || foods.find(f => Number(f.foodId) === Number(order.foodId));
            
            const imgPath = food?.food_img || food?.img || food?.image;
            const imgUrl = imgPath ? `${API_URL}${imgPath.startsWith('/') ? '' : '/'}${imgPath}` : '';
            const foodName = food?.food_name || food?.name || 'Taom';

            return `
                <li class="order-item">
                    <img src="${imgUrl}" alt="${foodName}">
                    <div>
                        <span class="order-name">${foodName}</span>
                        <span class="order-count">${order.count} ta</span>
                    </div>
                </li>
            `;
        }).join('');
    }

    userAddForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const telephone = telephoneInput.value.trim();

        if (!username || !telephone) return;

        try {
            const res = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, telephone })
            });

            if (res.ok) {
                usernameInput.value = '';
                telephoneInput.value = '';
                await getUsers();
            } else {
                const errText = await res.text();
                console.error("Mijoz qo'shishda xatolik:", errText);
            }
        } catch (error) {
            console.error("Tarmoq xatoligi:", error);
        }
    });

    customersListEl.addEventListener('click', async (e) => {
        const item = e.target.closest('.customer-item');
        if (!item) return;

        activeClientId = Number(item.getAttribute('data-id'));
        localStorage.setItem('activeClientId', activeClientId);
        
        renderCustomers();
        await loadActiveClientOrders(activeClientId);
    });

    foodsForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!activeClientId) {
            alert("Iltimos, avval chap tarafdan mijozni tanlang!");
            return;
        }

        const foodId = Number(foodsSelect.value);
        const count = Number(foodsCountInput.value);

        if (!count || count <= 0) {
            alert("Iltimos, taom sonini kiriting!");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: activeClientId,
                    foodId: foodId,
                    count: count
                })
            });

            const result = await res.json();
            console.log("Buyurtma natijasi:", result);

            if (res.ok) {
                foodsCountInput.value = '';
                await loadActiveClientOrders(activeClientId);
                console.log("Buyurtma muvaffaqiyatli qo'shildi!");
            } else {
                console.error("Buyurtma berishda xatolik:", result);
            }
        } catch (error) {
            console.error("Tarmoq xatoligi:", error);
        }
    });

    async function init() {
        await getFoods();
        await getUsers();
    }

    init();
});