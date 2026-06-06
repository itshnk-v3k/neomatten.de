/* =====================================================================
   NEOMAT — konfigurator.js
   Логика конструктора ковриков: выбор бренда/модели,
   живое превью, динамический пересчёт цены
   ===================================================================== */

/* ---------- Состояние конфигурации ---------- */
const config = {
  material: 'eva',
  textur: 'raute',
  farbe: '#15151a',     // цвет материала
  kantfarbe: '#8B1A1A', // цвет канта
  set: 'voll',
  halterung: 'ohne',
  fersenpolster: 'ohne',
  clips: 'mit'
};

/* ---------- Базовые цены по набору (€) ---------- */
const basePrice = { einzeln: 49, paar: 89, voll: 159, premium: 199 };

/* Каждый вариант набора → тип цены */
const setToPrice = {
  'vorne-rechts': 'einzeln', 'vorne-links': 'einzeln',
  'hinten-rechts': 'einzeln', 'hinten-links': 'einzeln',
  'vorne-paar': 'paar', 'hinten-paar': 'paar',
  'voll': 'voll', 'premium': 'premium'
};

/* Надбавки за опции (€) — по ТЗ v2 */
const ADD = {
  material: { eva: 0, ecoskin: 25 },
  halterung: { ohne: 0, '3d': 15 },
  fersenpolster: { ohne: 0, metall: 20, gummi: 15 },
  clips: { mit: 0, ohne: 0 }
};

/* Стоимость доставки по набору (€) */
const DELIVERY = { einzeln: 4.99, paar: 6.99, voll: 9.99, premium: 12.99 };

/* ---------- Все бренды (синхронизировано с catalog.js) ---------- */
const BRANDS = [
  'Acura', 'Alfa Romeo', 'Arcfox', 'Audi', 'Avatr', 'Beijing',
  'Bentley', 'BMW', 'Buick', 'BYD', 'Cadillac', 'Chana',
  'Changan', 'Chery', 'Chevrolet', 'Chrysler', 'Citroën', 'Cupra',
  'Ford', 'Hyundai', 'KIA', 'Mercedes', 'Nissan', 'Porsche',
  'Skoda', 'Toyota', 'Volkswagen'
];

/* ---------- Модели по брендам ---------- */
const MODELS_BY_BRAND = {
  Acura:      [['ILX Sedan', '2012–2022'], ['MDX (YD3) SUV', '2013–2016'], ['RDX (TB4)', '2018–2024']],
  'Alfa Romeo':[['Giulia (952)', '2016–2024'], ['Stelvio (949)', '2017–2024']],
  Arcfox:     [['Alpha-S', '2021–2024'], ['Alpha-T', '2020–2024']],
  Audi:       [['A3 Sportback', '2012–2020'], ['A4 (B9)', '2015–2023'], ['A6 (C8)', '2018–2024'],
               ['A7 (4G7) Liftback', '2010–2017'], ['Q5 (FY)', '2017–2024'], ['Q7 (4M)', '2015–2024']],
  Avatr:      [['Avatr 11', '2022–2024'], ['Avatr 12', '2023–2024']],
  Beijing:    [['X3', '2018–2024'], ['X7', '2020–2024']],
  Bentley:    [['Bentayga', '2016–2024'], ['Continental GT', '2018–2024']],
  BMW:        [['3er (G20)', '2018–2024'], ['5er (G30)', '2017–2023'],
               ['X3 (G01)', '2017–2024'], ['X5 (G05)', '2018–2024'], ['X1 (U11)', '2022–2024']],
  Buick:      [['Enclave', '2017–2024'], ['Envision', '2020–2024']],
  BYD:        [['Han', '2020–2024'], ['Tang', '2018–2024'], ['Seal', '2022–2024']],
  Cadillac:   [['Escalade', '2020–2024'], ['CT5', '2019–2024']],
  Chana:      [['Alsvin', '2020–2024'], ['CS55', '2017–2024']],
  Changan:    [['CS75 Plus', '2019–2024'], ['UNI-T', '2020–2024']],
  Chery:      [['Tiggo 7 Pro', '2020–2024'], ['Tiggo 8 Pro', '2021–2024']],
  Chevrolet:  [['Equinox', '2017–2024'], ['Traverse', '2018–2024'], ['Malibu', '2016–2023']],
  Chrysler:   [['300 (LX2)', '2011–2023'], ['Pacifica', '2017–2024']],
  'Citroën':  [['C3 Aircross', '2017–2024'], ['C5 Aircross', '2018–2024']],
  Cupra:      [['Formentor', '2020–2024'], ['Ateca', '2016–2024']],
  Ford:       [['Focus IV', '2018–2024'], ['Kuga III', '2019–2024'], ['Mondeo V', '2014–2022'],
               ['Puma', '2019–2024'], ['Explorer', '2020–2024']],
  Hyundai:    [['Tucson III', '2015–2020'], ['Tucson IV', '2020–2024'],
               ['Santa Fe IV', '2018–2024'], ['Elantra', '2020–2024']],
  KIA:        [['Sportage IV', '2015–2021'], ['Sportage V (NQ5)', '2021–2024'],
               ['Ceed III', '2018–2024'], ['Sorento IV', '2020–2024'], ['EV6', '2021–2024']],
  Mercedes:   [['C-Klasse (W205)', '2014–2021'], ['C-Klasse (W206)', '2021–2024'],
               ['E-Klasse (W213)', '2016–2023'], ['GLC (X253)', '2015–2022'],
               ['GLC (X254)', '2022–2024'], ['GLE (V167)', '2019–2024']],
  Nissan:     [['Qashqai (J12)', '2021–2024'], ['X-Trail (T33)', '2021–2024'], ['Leaf (ZE1)', '2017–2024']],
  Porsche:    [['Macan', '2014–2024'], ['Cayenne', '2017–2024'], ['Panamera', '2016–2024'],
               ['Taycan', '2019–2024']],
  Skoda:      [['Octavia III', '2012–2020'], ['Octavia IV', '2019–2024'],
               ['Kodiaq', '2016–2024'], ['Karoq', '2017–2024']],
  Toyota:     [['Camry XV70', '2017–2024'], ['Corolla E210', '2018–2024'],
               ['RAV4 V', '2018–2024'], ['Highlander XU70', '2019–2024']],
  Volkswagen: [['Golf VII', '2012–2019'], ['Golf VIII', '2019–2024'],
               ['Passat (B8)', '2014–2023'], ['Tiguan II', '2016–2024'], ['Touareg III', '2018–2024']]
};

/* ---------- Функция получения моделей по бренду ---------- */
function modelsFor(brand) {
  // Прямой поиск
  if (MODELS_BY_BRAND[brand]) return MODELS_BY_BRAND[brand];
  // Поиск без учёта регистра
  const key = Object.keys(MODELS_BY_BRAND).find(k =>
    k.toLowerCase() === brand.toLowerCase()
  );
  if (key) return MODELS_BY_BRAND[key];
  // Заглушка для брендов без данных
  const p = brand.replace(/[^A-Za-z]/g, '').substring(0, 2).toUpperCase();
  return [
    ['Sedan ' + p, '2018–2024'],
    ['SUV ' + p, '2019–2024'],
    ['Hatchback ' + p, '2016–2023']
  ];
}

/* MODELS — alias для совместимости со старым кодом */
const MODELS = MODELS_BY_BRAND;

/* Палитра цветов материала по фактуре (по ТЗ v2) */
const COLORS = {
  raute:   ['#1A1A1A', '#555555', '#8B4513', '#D2B48C', '#C9A84C', '#8B1A1A', '#000080', '#006400', '#191970', '#800020'],
  wabe:    ['#1A1A1A', '#555555', '#8B4513', '#D2B48C', '#8B1A1A', '#000080'],
  tropfen: ['#1A1A1A', '#555555', '#8B1A1A', '#006400']
};

let selectedBrand = null;
let selectedModel = null;

/* =================================================================
   ШАГ 1 — БРЕНДЫ
   ================================================================= */
function renderBrands(filter = '') {
  const wrap = document.getElementById('brandsList');
  if (!wrap) return;
  const q = filter.trim().toLowerCase();
  const list = BRANDS.filter(b => b.toLowerCase().includes(q));
  wrap.innerHTML = list.map(b => {
    const initials = b.replace(/[^A-Za-z]/g,'').substring(0,2).toUpperCase() || b[0].toUpperCase();
    const isActive = selectedBrand === b;
    return `
    <button class="brand-row ${isActive ? 'open' : ''}" data-brand="${b}" onclick="toggleBrandAccordion(this,'${b}')">
      <span class="brand-row__logo">${initials}</span>
      <span class="brand-row__name">${b}</span>
      <span class="brand-row__arrow" style="transform:${isActive?'rotate(90deg)':'none'};transition:transform .25s">→</span>
    </button>`;
  }).join('');
  // если уже выбран бренд — сразу раскрыть accordion
  if (selectedBrand) {
    const activeRow = wrap.querySelector(`[data-brand="${selectedBrand}"]`);
    if (activeRow && !activeRow.nextElementSibling?.classList.contains('brand-models')) {
      _openAccordion(activeRow, selectedBrand, false);
    }
  }
}

/* Раскрытие/закрытие аккордеона бренда */
function toggleBrandAccordion(row, brand) {
  const isOpen = row.classList.contains('open');
  // закрыть все открытые
  document.querySelectorAll('.brand-row.open').forEach(r => {
    r.classList.remove('open');
    r.querySelector('.brand-row__arrow').style.transform = 'none';
    if (r.nextElementSibling?.classList.contains('brand-models'))
      r.nextElementSibling.remove();
  });
  if (!isOpen) {
    selectedBrand = brand;
    row.classList.add('open');
    row.querySelector('.brand-row__arrow').style.transform = 'rotate(90deg)';
    _openAccordion(row, brand, true);
    updateBreadcrumb();
  } else {
    selectedBrand = null;
    selectedModel = null;
    document.getElementById('configurator').style.display = 'none';
    const banner = document.getElementById('selectedCarBanner');
    if (banner) banner.classList.remove('visible');
    updateBreadcrumb();
  }
}

function _openAccordion(row, brand, scroll) {
  const models = modelsFor(brand);
  const modelsEl = document.createElement('div');
  modelsEl.className = 'brand-models';
  modelsEl.innerHTML = models.map(([name, years]) => `
    <button class="brand-model-card ${selectedModel === name ? 'active' : ''}"
            onclick="selectModel('${name.replace(/'/g,"\\'")}','${years}')">
      <div class="model-name">${name}</div>
      <div class="model-years">${years}</div>
    </button>`).join('');
  row.insertAdjacentElement('afterend', modelsEl);
  if (scroll) modelsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function selectBrand(brand) {
  // При вызове из URL-параметра ?brand=
  selectedBrand = brand;
  selectedModel = null;
  renderBrands('');
  updateBreadcrumb();
}

/* =================================================================
   ШАГ 2 — МОДЕЛИ (legacy — показывает в #modelGrid если step2 виден)
   ================================================================= */
function renderModels() {
  const wrap = document.getElementById('modelGrid');
  if (!wrap || !selectedBrand) { if (wrap) wrap.innerHTML = ''; return; }
  const list = modelsFor(selectedBrand);
  if (!list.length) { wrap.innerHTML = '<p style="padding:16px;color:#888">Keine Modelle verfügbar</p>'; return; }
  wrap.innerHTML = list.map(([name, years]) => `
    <button class="model-card ${selectedModel === name ? 'active' : ''}" onclick="selectModel('${name.replace(/'/g, "\\'")}', '${years}')">
      <span class="model-card__name">${name}</span>
      <span class="model-card__years">${years}</span>
    </button>`).join('');
}

function selectModel(name, years) {
  selectedModel = name;
  // обновить активное состояние в accordion
  document.querySelectorAll('.brand-model-card').forEach(c => c.classList.remove('active'));
  event && event.target && event.target.classList.add('active');
  // обновить баннер выбранной машины
  const banner = document.getElementById('selectedCarBanner');
  if (banner) {
    document.getElementById('selectedBrandLbl').textContent = selectedBrand;
    document.getElementById('selectedModelLbl').textContent = `${selectedBrand} ${name}`;
    document.getElementById('selectedYearLbl').textContent = years;
    banner.classList.add('visible');
  }
  // показать конфигуратор
  document.getElementById('configurator').style.display = 'grid';
  // заполнить блок 1 (информация о ТС)
  const art = makeArticle(selectedBrand, name);
  document.getElementById('vehicleTitle').textContent = `${selectedBrand} ${name} ${years} EU | ${art}`;
  updateBreadcrumb();
  updatePreview();
  calculatePrice();
  document.getElementById('configurator').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Псевдо-артикул из бренда и модели */
function makeArticle(brand, model) {
  const p = (brand.substring(0, 2)).toUpperCase();
  let n = 0;
  for (const ch of brand + model) n = (n + ch.charCodeAt(0) * 7) % 90000;
  return p + (10000 + n);
}

/* Хлебные крошки */
function updateBreadcrumb() {
  const el = document.getElementById('bcDynamic');
  if (!el) return;
  let s = '';
  if (selectedBrand) s += ` › ${selectedBrand}`;
  if (selectedModel) s += ` › ${selectedModel}`;
  el.textContent = s;
}

/* =================================================================
   ПРЕВЬЮ КОВРИКА — фактура + цвета
   ================================================================= */
function getTextureBg(color, textur) {
  // прозрачные накладки-линии формируют фактуру поверх базового цвета
  if (textur === 'raute') {
    return `repeating-linear-gradient(45deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 15px),
            repeating-linear-gradient(-45deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 15px),
            ${color}`;
  }
  if (textur === 'wabe') {
    return `repeating-linear-gradient(60deg, rgba(0,0,0,0.20) 0 1px, transparent 1px 17px),
            repeating-linear-gradient(-60deg, rgba(0,0,0,0.20) 0 1px, transparent 1px 17px),
            repeating-linear-gradient(0deg, rgba(0,0,0,0.20) 0 1px, transparent 1px 17px),
            ${color}`;
  }
  // tropfen — точки
  return `radial-gradient(circle, rgba(0,0,0,0.28) 3px, transparent 4px) 0 0 / 19px 19px, ${color}`;
}

function updatePreview() {
  const mat = document.getElementById('matShape');
  const edge = document.getElementById('matEdge');
  if (!mat) return;
  mat.style.background = getTextureBg(config.farbe, config.textur);
  mat.style.borderColor = config.kantfarbe;
  if (edge) edge.style.borderColor = config.kantfarbe;
  // подпись фактуры/материала на превью
  const lbl = document.getElementById('previewMeta');
  if (lbl) {
    const en = (typeof isEnglish === 'function') && isEnglish();
    const texNames = { raute: en ? 'Diamond' : 'Raute', wabe: en ? 'Honeycomb' : 'Wabe', tropfen: en ? 'Drop' : 'Tropfen' };
    lbl.textContent = `${config.material.toUpperCase()} · ${texNames[config.textur]}`;
  }
}

/* =================================================================
   ПЕРЕСЧЁТ ЦЕНЫ
   ================================================================= */
function calculatePrice() {
  const base = basePrice[setToPrice[config.set]] || 0;
  const add = ADD.material[config.material]
            + ADD.halterung[config.halterung]
            + ADD.fersenpolster[config.fersenpolster]
            + ADD.clips[config.clips];
  const total = base + add;
  const delivery = DELIVERY[setToPrice[config.set]] || 0;

  const priceEl = document.getElementById('totalPrice');
  if (priceEl) priceEl.textContent = total.toFixed(0) + ' €';
  const deliveryEl = document.getElementById('deliveryCost');
  if (deliveryEl) {
    const en = (typeof isEnglish === 'function') && isEnglish();
    deliveryEl.textContent = total >= 100
      ? (en ? 'Free' : 'Kostenlos')
      : delivery.toFixed(2) + ' €';
  }
  // подсветить активную строку в таблице доставки
  document.querySelectorAll('#deliveryTable tr[data-set]').forEach(tr => {
    tr.classList.toggle('active', tr.dataset.set === setToPrice[config.set]);
  });
  return total;
}

/* =================================================================
   ОБРАБОТЧИКИ ВЫБОРА ОПЦИЙ
   ================================================================= */
// Универсальный выбор «кнопочной» опции (material/textur/halterung/fersenpolster/clips/set)
function pick(key, value, group) {
  config[key] = value;
  document.querySelectorAll(`[data-group="${group}"]`).forEach(el =>
    el.classList.toggle('active', el.dataset.value === value));
  if (group === 'textur') renderColors();   // доступные цвета зависят от фактуры
  if (group === 'set') highlightZones(value); // подсветка зон на схеме салона
  updatePreview();
  calculatePrice();
}

// Подсветка зон на SVG-схеме салона авто (включая багажник)
function highlightZones(setType) {
  const zones = { fl: false, fr: false, rl: false, rr: false, trunk: false };
  if (setType === 'vorne-rechts')  zones.fl = true;
  if (setType === 'vorne-links')   zones.fr = true;
  if (setType === 'vorne-paar')    { zones.fl = true; zones.fr = true; }
  if (setType === 'hinten-rechts') zones.rr = true;
  if (setType === 'hinten-links')  zones.rl = true;
  if (setType === 'hinten-paar')   { zones.rl = true; zones.rr = true; }
  if (setType === 'voll')    { zones.fl = true; zones.fr = true; zones.rl = true; zones.rr = true; }
  if (setType === 'premium') { zones.fl = true; zones.fr = true; zones.rl = true; zones.rr = true; zones.trunk = true; }
  Object.keys(zones).forEach(z => {
    const el = document.getElementById('zone-' + z);
    const lbl = document.getElementById('lbl-' + z);
    if (el) {
      el.style.fill = zones[z] ? '#8B1A1A' : '#E8E8E8';
      el.style.stroke = zones[z] ? '#6B0F0F' : '#C0C0C0';
    }
    if (lbl) lbl.style.fill = zones[z] ? '#fff' : '#666';
  });
}

// Рендер кружков цвета материала под текущую фактуру
function renderColors() {
  const wrap = document.getElementById('materialColors');
  if (!wrap) return;
  const list = COLORS[config.textur] || COLORS.raute;
  // если текущий цвет недоступен для фактуры — берём первый
  if (!list.includes(config.farbe)) config.farbe = list[0];
  wrap.innerHTML = list.map(c =>
    `<span class="swatch ${c === config.farbe ? 'active' : ''}" style="background:${c}" onclick="pickColor('farbe','${c}',this)"></span>`
  ).join('');
}

// Выбор цвета (материал/кант)
function pickColor(key, color, el) {
  config[key] = color;
  const group = el.parentElement;
  group.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  updatePreview();
}

/* =================================================================
   КНОПКИ ИТОГА
   ================================================================= */
function configToCart() {
  if (!selectedModel) {
    alert(isEnglish() ? 'Please select a vehicle first.' : 'Bitte zuerst ein Fahrzeug wählen.');
    return;
  }
  const additionalInfo = (document.getElementById('additionalInfo') || {}).value || '';
  const item = {
    name: `${selectedBrand} ${selectedModel}`,
    config: { ...config },
    additionalInfo,
    price: calculatePrice()
  };
  addToCart(item);
}

function payNow() {
  if (!isAuthed()) { openAuth(); return; }
  configToCart();
  window.location.href = 'warenkorb.html';
}

function contactManager() {
  if (!isAuthed()) { openAuth(); return; }
  window.location.href = 'kontakt.html';
}

/* =================================================================
   ИНИЦИАЛИЗАЦИЯ
   ================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  renderBrands();
  // привязать поиск брендов
  const search = document.getElementById('brandSearch');
  if (search) search.addEventListener('input', e => renderBrands(e.target.value));
  // предвыбор бренда из каталога (?brand=Audi)
  const urlBrand = new URLSearchParams(location.search).get('brand');
  if (urlBrand && BRANDS.includes(urlBrand)) {
    selectBrand(urlBrand);
  }
  // начальное превью
  renderColors();
  updatePreview();
  calculatePrice();
});
