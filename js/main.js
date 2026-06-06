/* =====================================================================
   NEOMAT — main.js
   Общая логика: язык, мобильное меню, попапы, корзина,
   FAQ-аккордеон, scroll-анимации, инициализация
   ===================================================================== */

/* =================================================================
   ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА (DE / EN)
   ================================================================= */
function switchLang(lang) {
  const isEn = lang === 'en';
  document.body.classList.toggle('lang-en', isEn);
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-de]').forEach(el => {
    el.textContent = isEn ? el.dataset.en : el.dataset.de;
  });
  const de = document.getElementById('langDe');
  const en = document.getElementById('langEn');
  if (de && en) {
    de.classList.toggle('active', !isEn);
    en.classList.toggle('active', isEn);
  }
  localStorage.setItem('neomat_lang', lang);
}

/* Текущий язык — утилита для alert-ов и динамики */
function isEnglish() { return document.body.classList.contains('lang-en'); }

/* =================================================================
   МОБИЛЬНОЕ МЕНЮ
   ================================================================= */
function toggleMenu() {
  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobileMenu');
  if (burger) burger.classList.toggle('open');
  if (menu) menu.classList.toggle('open');
}

/* =================================================================
   АВТОРИЗАЦИЯ + ПОПАП СКИДКИ — вынесены в js/auth.js
   (openAuth/closeAuth/switchAuthTab/handleAuth/isAuthed/
    refreshAuthUI/openDiscount/closeDiscount определены там)
   ================================================================= */

/* =================================================================
   ИНФО-ПОПАП (ℹ️) — материал / клипсы и т.п.
   ================================================================= */
function openInfo(titleDe, titleEn, textDe, textEn) {
  let pop = document.getElementById('infoPop');
  if (!pop) {
    pop = document.createElement('div');
    pop.id = 'infoPop';
    pop.className = 'info-pop';
    pop.innerHTML = `
      <div class="info-pop__card">
        <button class="popup-close" aria-label="Schließen">✕</button>
        <h3 id="infoPopTitle"></h3>
        <p id="infoPopText"></p>
      </div>`;
    document.body.appendChild(pop);
    pop.addEventListener('click', e => { if (e.target === pop) pop.classList.remove('open'); });
    pop.querySelector('.popup-close').addEventListener('click', () => pop.classList.remove('open'));
  }
  const t = document.getElementById('infoPopTitle');
  const x = document.getElementById('infoPopText');
  t.dataset.de = titleDe; t.dataset.en = titleEn;
  x.dataset.de = textDe;  x.dataset.en = textEn;
  t.textContent = isEnglish() ? titleEn : titleDe;
  x.textContent = isEnglish() ? textEn : textDe;
  pop.classList.add('open');
}

/* Закрытие любых попапов по клику на оверлей и по Esc */
function bindPopupDismiss() {
  document.querySelectorAll('.popup-overlay, .popup-discount').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.popup-overlay.open, .popup-discount.open, .info-pop.open')
        .forEach(p => p.classList.remove('open'));
    }
  });
}

/* =================================================================
   КОРЗИНА — логика вынесена в js/cart.js
   (getCart/saveCart/addToCart/updateCartBadge определены там)
   ================================================================= */

/* =================================================================
   ФОРМА КОНСУЛЬТАЦИИ / КОНТАКТ (имитация отправки)
   ================================================================= */
function submitConsult(e) {
  e.preventDefault();
  alert(isEnglish()
    ? 'Thank you! We will contact you within 30 minutes.'
    : 'Danke! Wir melden uns innerhalb von 30 Minuten.');
  e.target.reset();
  return false;
}

/* =================================================================
   FAQ — аккордеон (данные DE / EN)
   ================================================================= */
const faqData = [
  { de: ['Wie lange ist die Garantie auf die Matten?', 'Auf das Material gewähren wir 1 Jahr garantierte Lebensdauer.'],
    en: ['How long is the warranty?', 'We provide a guaranteed lifespan of 1 year on the material.'] },
  { de: ['Was tun, wenn die Matten nicht passen?', 'Innerhalb von 14 Tagen ist ein Umtausch bei Nichtübereinstimmung möglich.'],
    en: ['What if the mats don\'t fit?', 'An exchange is possible within 14 days in case of mismatch.'] },
  { de: ['Wie lange halten die Matten?', 'Bei normaler Nutzung viele Jahre — das Material ist äußerst langlebig.'],
    en: ['How long do the mats last?', 'Many years under normal use — the material is extremely durable.'] },
  { de: ['Wie werden die Matten befestigt?', 'Mit Original-Clips und einem zusätzlichen Klettsystem.'],
    en: ['How are the mats attached?', 'With original clips and an additional hook-and-loop system.'] },
  { de: ['Riechen die Matten?', 'Nein. Das zertifizierte EVA-Material ist geruchsneutral.'],
    en: ['Do the mats have an odour?', 'No. The certified EVA material is odour-neutral.'] },
  { de: ['Ist EVA-Material hypoallergen?', 'Ja, EVA ist hypoallergen und für Innenräume unbedenklich.'],
    en: ['Is EVA hypoallergenic?', 'Yes, EVA is hypoallergenic and safe for interiors.'] },
  { de: ['Wie widerstandsfähig ist das Material?', 'Sehr — es widersteht ±50 °C, Feuchtigkeit und Abrieb.'],
    en: ['How durable is the material?', 'Very — it resists ±50 °C, moisture and abrasion.'] }
];

function renderFaq() {
  const list = document.getElementById('faqList');
  if (!list) return;
  const en = isEnglish();
  list.innerHTML = faqData.map((item, i) => `
    <div class="faq-item" data-index="${i}">
      <button class="faq-q" onclick="toggleFaq(${i})">
        <span data-de="${item.de[0]}" data-en="${item.en[0]}">${en ? item.en[0] : item.de[0]}</span>
        <span class="faq-q__icon">+</span>
      </button>
      <div class="faq-a">
        <p data-de="${item.de[1]}" data-en="${item.en[1]}">${en ? item.en[1] : item.de[1]}</p>
      </div>
    </div>`).join('');
}

function toggleFaq(i) {
  const item = document.querySelector(`.faq-item[data-index="${i}"]`);
  const answer = item.querySelector('.faq-a');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(el => {
    el.classList.remove('open');
    el.querySelector('.faq-a').style.maxHeight = null;
  });
  if (!isOpen) {
    item.classList.add('open');
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }
}

/* =================================================================
   SCROLL-АНИМАЦИИ (IntersectionObserver)
   ================================================================= */
function initScrollAnimations() {
  const els = document.querySelectorAll('.fade-in-up');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach((el, i) => {
    el.style.transitionDelay = (i % 6) * 0.06 + 's';
    observer.observe(el);
  });
}

/* =================================================================
   ИНИЦИАЛИЗАЦИЯ
   ================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof renderFaq === 'function') renderFaq();
  if (typeof buildDots === 'function') buildDots();   // из slider.js
  updateCartBadge();
  refreshAuthUI();
  bindPopupDismiss();
  initScrollAnimations();

  // восстановить выбранный язык
  if (localStorage.getItem('neomat_lang') === 'en') switchLang('en');
});

/* =================================================================
   ЖИВОЙ СЧЁТЧИК ЗАКАЗОВ / ДАТЫ ДОСТАВКИ
   Меняется каждый день автоматически (детерминированно по дате)
   ================================================================= */
function updateLiveCounter() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const orders = 4 + (seed % 9);    // 4–12 заказов в день
  document.querySelectorAll('#ordersCount').forEach(el => el.textContent = orders);

  const delivery = new Date(today);
  delivery.setDate(today.getDate() + 5);  // мин. 5 дней: 2–3 произв. + 2–4 доставка
  const dateStr = delivery.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
  document.querySelectorAll('#deliveryDate').forEach(el => el.textContent = dateStr);
}
document.addEventListener('DOMContentLoaded', updateLiveCounter);

/* =================================================================
   АККОРДЕОН (для страницы конфигуратора и EVA-material)
   ================================================================= */
function toggleAccordion(btn) {
  const content = btn.nextElementSibling;
  const isOpen = btn.classList.contains('open');
  // закрыть все в том же аккордеоне
  const parent = btn.closest('.material-accordion') || btn.closest('.faq-accordion');
  if (parent) {
    parent.querySelectorAll('.accordion-btn.open').forEach(b => {
      b.classList.remove('open');
      b.nextElementSibling.style.maxHeight = null;
    });
  }
  if (!isOpen) {
    btn.classList.add('open');
    content.style.maxHeight = content.scrollHeight + 'px';
  }
}
