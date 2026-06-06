/* =====================================================================
   NEOMAT — auth.js
   Авторизация, личный кабинет, история заказов
   Хранилище: localStorage 'neomat_user'
   ===================================================================== */

const USER_KEY = 'neomat_user';

/* ---------- Пользователь ---------- */
function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); }
  catch (e) { return null; }
}
function saveUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
function isAuthed() { return !!getUser(); }

/* ---------- Попап авторизации ---------- */
let authMode = 'login';
function openAuth() {
  const p = document.getElementById('authPopup');
  if (p) p.classList.add('open');
}
function closeAuth() {
  const p = document.getElementById('authPopup');
  if (p) p.classList.remove('open');
}
function switchAuthTab(mode) {
  authMode = mode;
  const isReg = mode === 'register';
  const tl = document.getElementById('tabLogin');
  const tr = document.getElementById('tabRegister');
  const nf = document.getElementById('nameField');
  const submit = document.getElementById('authSubmit');
  if (tl) tl.classList.toggle('active', !isReg);
  if (tr) tr.classList.toggle('active', isReg);
  if (nf) nf.style.display = isReg ? 'block' : 'none';
  if (submit) {
    submit.dataset.de = isReg ? 'Registrieren' : 'Anmelden';
    submit.dataset.en = isReg ? 'Register' : 'Login';
    submit.textContent = (typeof isEnglish === 'function' && isEnglish())
      ? submit.dataset.en : submit.dataset.de;
  }
}

/* Обработка отправки формы (логин/регистрация) */
function handleAuth(e) {
  e.preventDefault();
  const form = e.target;
  const name = (form.querySelector('#authName') || {}).value || 'Kunde';
  const email = (form.querySelector('#authEmail') || {}).value || '';
  const pass = (form.querySelector('#authPass') || {}).value || '';

  if (authMode === 'register') {
    register(name, email, pass);
  } else {
    login(email, pass);
  }
  closeAuth();
  refreshAuthUI();
  return false;
}

/* Регистрация — создаёт пользователя и показывает попап скидки (1 раз) */
function register(name, email, password) {
  const user = { name, email, password: btoa(password || ''), orders: [], addresses: [] };
  saveUser(user);
  if (!localStorage.getItem('neomat_discount_shown')) {
    localStorage.setItem('neomat_discount_shown', 'true');
    setTimeout(openDiscount, 350);
  }
  refreshAuthUI();
}

/* Логин — для прототипа создаёт/восстанавливает пользователя */
function login(email, password) {
  let user = getUser();
  if (!user) user = { name: 'Kunde', email, password: btoa(password || ''), orders: [], addresses: [] };
  else user.email = email || user.email;
  saveUser(user);
  refreshAuthUI();
}

/* Выход */
function logout() {
  localStorage.removeItem(USER_KEY);
  refreshAuthUI();
  if (location.pathname.endsWith('konto.html')) location.href = 'index.html';
}

/* Клик по иконке аккаунта в шапке */
function accountAction() {
  if (isAuthed()) window.location.href = 'konto.html';
  else openAuth();
}

/* ---------- Гейтинг действий, требующих входа ---------- */
function checkAuth(action) {
  if (!isAuthed()) { openAuth(); return false; }
  if (action === 'pay') { placeOrder(); }
  if (action === 'manager') { window.location.href = 'kontakt.html'; }
  return true;
}

/* Подсветка/блокировка элементов .requires-auth + UI кнопки аккаунта */
function refreshAuthUI() {
  const authed = isAuthed();
  document.querySelectorAll('.requires-auth').forEach(btn =>
    btn.classList.toggle('is-locked', !authed));
  // иконка аккаунта: ведёт в кабинет если вошёл
  document.querySelectorAll('#authBtn').forEach(btn => {
    btn.title = authed ? 'Konto' : 'Anmelden';
  });
}

/* ---------- Попап «10% скидка» ---------- */
function openDiscount() {
  const p = document.getElementById('discountPopup');
  if (p) p.classList.add('open');
}
function closeDiscount() {
  const p = document.getElementById('discountPopup');
  if (p) p.classList.remove('open');
}

/* =================================================================
   ЗАКАЗЫ
   ================================================================= */
function generateOrderId() {
  return 'NM-' + new Date().getFullYear() + '-' +
    String(Date.now()).slice(-6);
}

/* Оформление заказа из корзины */
function placeOrder() {
  if (!isAuthed()) { openAuth(); return; }
  const items = (typeof loadCart === 'function') ? loadCart() : [];
  const total = (typeof getCartTotal === 'function') ? getCartTotal() : 0;
  if (!items.length) {
    alert((typeof isEnglish === 'function' && isEnglish())
      ? 'Your cart is empty.' : 'Ihr Warenkorb ist leer.');
    return;
  }
  const order = {
    id: generateOrderId(),
    date: new Date().toLocaleDateString('de-DE'),
    status: 'In Bearbeitung',
    items: items,
    total: total,
    delivery: total >= 100 ? 'Kostenlos' : 'Berechnet'
  };
  const user = getUser();
  user.orders = user.orders || [];
  user.orders.unshift(order);
  saveUser(user);
  if (typeof clearCart === 'function') clearCart();
  window.location.href = 'konto.html#orders';
}

/* Перевод статуса заказа */
const ORDER_STATUS = {
  'In Bearbeitung': { de: 'In Bearbeitung', en: 'Processing', icon: '🟡' },
  'In Produktion':  { de: 'In Produktion',  en: 'In production', icon: '🔵' },
  'Versendet':      { de: 'Versendet',      en: 'Shipped', icon: '🟢' },
  'Geliefert':      { de: 'Geliefert',      en: 'Delivered', icon: '✅' }
};

/* =================================================================
   ЛИЧНЫЙ КАБИНЕТ (konto.html)
   ================================================================= */
function kontoShowSection(id, el) {
  document.querySelectorAll('.konto-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.konto-nav__item').forEach(n => n.classList.remove('active'));
  const sec = document.getElementById('sec-' + id);
  if (sec) sec.classList.add('active');
  if (el) el.classList.add('active');
}

function initKonto() {
  const guard = document.getElementById('kontoGuard');
  const panel = document.getElementById('kontoPanel');
  if (!guard && !panel) return; // не на странице кабинета

  if (!isAuthed()) {
    if (guard) guard.style.display = 'block';
    if (panel) panel.style.display = 'none';
    return;
  }
  if (guard) guard.style.display = 'none';
  if (panel) panel.style.display = 'grid';

  const user = getUser();
  const en = (typeof isEnglish === 'function') && isEnglish();

  // данные профиля
  const fName = document.getElementById('profName');
  const fEmail = document.getElementById('profEmail');
  if (fName) fName.value = user.name || '';
  if (fEmail) fEmail.value = user.email || '';
  const fPhone = document.getElementById('profPhone');
  const fAddr = document.getElementById('profAddr');
  if (fPhone) fPhone.value = user.phone || '';
  if (fAddr) fAddr.value = user.address || '';

  // история заказов
  renderOrders();

  // открыть нужную секцию по хэшу (#orders)
  if (location.hash === '#orders') {
    const navOrders = document.querySelector('.konto-nav__item[data-sec="orders"]');
    kontoShowSection('orders', navOrders);
  }
}

function saveProfile(e) {
  if (e) e.preventDefault();
  const user = getUser();
  if (!user) return false;
  user.name = (document.getElementById('profName') || {}).value || user.name;
  user.email = (document.getElementById('profEmail') || {}).value || user.email;
  user.phone = (document.getElementById('profPhone') || {}).value || '';
  user.address = (document.getElementById('profAddr') || {}).value || '';
  saveUser(user);
  const en = (typeof isEnglish === 'function') && isEnglish();
  alert(en ? 'Saved.' : 'Gespeichert.');
  return false;
}

function renderOrders() {
  const wrap = document.getElementById('ordersList');
  if (!wrap) return;
  const en = (typeof isEnglish === 'function') && isEnglish();
  const user = getUser();
  const orders = (user && user.orders) || [];

  if (!orders.length) {
    wrap.innerHTML = `<p class="konto-empty">${en ? 'No orders yet.' : 'Noch keine Bestellungen.'}</p>`;
    return;
  }
  wrap.innerHTML = orders.map(o => {
    const st = ORDER_STATUS[o.status] || { icon: '•', de: o.status, en: o.status };
    const count = (o.items || []).reduce((s, i) => s + (i.qty || 1), 0);
    return `
      <div class="order-card">
        <div class="order-card__head">
          <span class="order-card__id">${o.id}</span>
          <span class="order-card__status">${st.icon} ${en ? st.en : st.de}</span>
        </div>
        <div class="order-card__meta">
          <span>${o.date}</span>
          <span>${count} ${en ? 'item(s)' : 'Artikel'}</span>
          <span>${en ? 'Delivery' : 'Lieferung'}: ${o.delivery}</span>
        </div>
        <div class="order-card__total">${(o.total || 0).toFixed(0)} €</div>
      </div>`;
  }).join('');
}

/* инициализация */
document.addEventListener('DOMContentLoaded', () => {
  refreshAuthUI();
  initKonto();
});
