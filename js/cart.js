/* =====================================================================
   NEOMAT — cart.js
   Логика корзины: add / remove / qty / total + localStorage
   Хранилище: localStorage 'neomat_cart'
   ===================================================================== */

const CART_KEY = 'neomat_cart';

/* ---------- Базовое хранилище ---------- */
function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch (e) { return []; }
}
function getCart() { return loadCart(); }                 // alias
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

/* ---------- Словари для человекочитаемых подписей ---------- */
const LABELS = {
  material: { eva: 'EVA', ecoskin: 'ECOSKIN' },
  textur:   { raute: 'Raute', wabe: 'Wabe', tropfen: 'Tropfen' },
  set: {
    'vorne-rechts': 'Vorderer rechts', 'vorne-links': 'Vorderer links',
    'vorne-paar': 'Vorderes Paar', 'hinten-rechts': 'Hinterer rechts',
    'hinten-links': 'Hinterer links', 'hinten-paar': 'Hinteres Paar',
    'voll': 'Vollständiges Set', 'premium': 'Premium-Set'
  },
  clips: { mit: 'Mit Clips', ohne: 'Ohne Clips' },
  halterung: { ohne: 'Ohne Halterung', '3d': '3D-Halterung' },
  fersenpolster: { ohne: 'Ohne', metall: 'Metall', gummi: 'Gummi' }
};
function lab(group, key) {
  return (LABELS[group] && LABELS[group][key]) || key || '';
}

/* ---------- Добавление ---------- */
function addToCart(raw) {
  const cart = loadCart();
  const item = Object.assign({
    id: 'NM-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    name: 'Produkt',
    material: '', textur: '', farbe: '#1A1A1A', kantfarbe: '#8B1A1A',
    set: '', clips: '', halterung: '', fersenpolster: '',
    lieferung: 'Kostenlos', price: 0, qty: 1, image: ''
  }, raw || {});

  // если пришёл объект config (из конфигуратора) — разложить параметры
  if (raw && raw.config) {
    const c = raw.config;
    item.material      = lab('material', c.material);
    item.textur        = lab('textur', c.textur);
    item.farbe         = c.farbe;
    item.kantfarbe     = c.kantfarbe;
    item.set           = lab('set', c.set);
    item.clips         = lab('clips', c.clips);
    item.halterung     = lab('halterung', c.halterung);
    item.fersenpolster = lab('fersenpolster', c.fersenpolster);
    item.lieferung     = (item.price >= 100) ? 'Kostenlos' : 'Berechnet';
    delete item.config;
  }

  cart.push(item);
  saveCart(cart);
  showCartToast(item.name);
}

/* ---------- Удаление / количество / очистка ---------- */
function removeFromCart(id) {
  saveCart(loadCart().filter(i => i.id !== id));
  if (typeof renderWarenkorb === 'function') renderWarenkorb();
}
function updateQty(id, delta) {
  const cart = loadCart();
  const it = cart.find(i => i.id === id);
  if (!it) return;
  it.qty = Math.max(1, (it.qty || 1) + delta);
  saveCart(cart);
  if (typeof renderWarenkorb === 'function') renderWarenkorb();
}
function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
  if (typeof renderWarenkorb === 'function') renderWarenkorb();
}

/* ---------- Суммы ---------- */
function getCartTotal() {
  return loadCart().reduce((s, i) => s + (i.price * (i.qty || 1)), 0);
}
function getCartCount() {
  return loadCart().reduce((s, i) => s + (i.qty || 1), 0);
}

/* ---------- Бейдж в шапке ---------- */
function updateCartBadge() {
  document.querySelectorAll('#cartBadge, .cart-badge').forEach(b => {
    b.textContent = getCartCount();
  });
}

/* ---------- Мини-тост «добавлено» ---------- */
function showCartToast(name) {
  const en = (typeof isEnglish === 'function') && isEnglish();
  let t = document.getElementById('cartToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'cartToast';
    t.className = 'cart-toast';
    document.body.appendChild(t);
  }
  t.textContent = (en ? '✓ Added to cart: ' : '✓ Zum Warenkorb: ') + (name || '');
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* =================================================================
   ОТРИСОВКА КОРЗИНЫ (страница warenkorb.html)
   ================================================================= */
function renderWarenkorb() {
  const wrap = document.getElementById('cartItems');
  if (!wrap) return; // не на странице корзины
  const en = (typeof isEnglish === 'function') && isEnglish();
  const cart = loadCart();

  const empty = document.getElementById('cartEmpty');
  const filled = document.getElementById('cartFilled');

  if (!cart.length) {
    if (empty) empty.style.display = 'block';
    if (filled) filled.style.display = 'none';
    return;
  }
  if (empty) empty.style.display = 'none';
  if (filled) filled.style.display = 'block';

  wrap.innerHTML = cart.map(it => {
    const specs = [it.material, it.textur, it.set, it.clips]
      .filter(Boolean).join(' · ');
    const liefer = en ? (it.lieferung === 'Kostenlos' ? 'Free' : it.lieferung) : it.lieferung;
    return `
      <div class="cart-row">
        <div class="cart-row__preview" style="background:${it.farbe};border-color:${it.kantfarbe}"></div>
        <div class="cart-row__info">
          <div class="cart-row__name">${it.name}</div>
          <div class="cart-row__specs">${specs}</div>
          <div class="cart-row__colors">
            <span class="dot" style="background:${it.farbe}" title="Material"></span>
            <span class="dot" style="background:${it.kantfarbe}" title="Kant"></span>
            <span class="cart-row__liefer">${en ? 'Delivery' : 'Lieferung'}: ${liefer}</span>
          </div>
        </div>
        <div class="cart-row__right">
          <div class="cart-row__price">${(it.price * (it.qty || 1)).toFixed(0)} €</div>
          <div class="qty">
            <button class="qty__btn" onclick="updateQty('${it.id}', -1)" aria-label="−">−</button>
            <span class="qty__val">${it.qty || 1}</span>
            <button class="qty__btn" onclick="updateQty('${it.id}', 1)" aria-label="+">+</button>
            <button class="qty__del" onclick="removeFromCart('${it.id}')" aria-label="Entfernen">🗑</button>
          </div>
        </div>
      </div>`;
  }).join('');

  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = getCartTotal().toFixed(0) + ' €';
}

/* инициализация бейджа/страницы */
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderWarenkorb();
});
