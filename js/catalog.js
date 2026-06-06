/* =====================================================================
   NEOMAT — catalog.js
   Навигация каталога: Kategorien → Marken → Modelle
   Маршрутизация по URL: ?cat=mats  /  ?cat=mats&brand=Audi
   ===================================================================== */

/* ---------- Бренды (как на референсе) ---------- */
const BRANDS = [
  'Acura', 'Alfa Romeo', 'Arcfox', 'Audi', 'Avatr', 'Beijing',
  'Bentley', 'BMW', 'Buick', 'BYD', 'Cadillac', 'Chana',
  'Changan', 'Chery', 'Chevrolet', 'Chrysler', 'Citroën', 'Cupra',
  'Ford', 'Hyundai', 'KIA', 'Mercedes', 'Nissan', 'Porsche',
  'Skoda', 'Toyota', 'Volkswagen'
];

/* ---------- Модели по брендам ---------- */
const MODELS_BY_BRAND = {
  Audi:      [['A3 Sportback 2012–2020', 'AU12301'], ['A4 (B9) 2015–2023', 'AU15604'], ['A6 (C8) 2018–2024', 'AU18807'], ['A7 (4G7) Liftback 2010–2017', 'AU23725'], ['Q5 (FY) SUV 2017–2024', 'AU20905'], ['Q7 (4M) SUV 2015–2024', 'AU20907']],
  BMW:       [['3er (G20) 2018–2024', 'BM32001'], ['5er (G30) 2017–2023', 'BM53002'], ['X3 (G01) SUV 2017–2024', 'BMX3017'], ['X5 (G05) SUV 2018–2024', 'BMX5018']],
  Mercedes:  [['C-Klasse (W205) 2014–2021', 'MB20514'], ['E-Klasse (W213) 2016–2023', 'MB21316'], ['GLC (X253) 2015–2022', 'MBGLC15']],
  Volkswagen:[['Golf VII 2012–2019', 'VW07012'], ['Golf VIII 2019–2024', 'VW08019'], ['Passat (B8) 2014–2023', 'VWPB814'], ['Tiguan II 2016–2024', 'VWTG216']],
  Toyota:    [['Camry XV70 2017–2024', 'TOCXV70'], ['Corolla E210 2018–2024', 'TOE2108'], ['RAV4 V 2018–2024', 'TORAV45']],
  Hyundai:   [['Tucson III 2015–2020', 'HYTU315'], ['Tucson IV 2020–2024', 'HYTU420'], ['Santa Fe 2018–2024', 'HYSF018']],
  KIA:       [['Sportage IV 2015–2021', 'KISP415'], ['Ceed III 2018–2024', 'KICE318'], ['Sorento IV 2020–2024', 'KISO420']],
  Skoda:     [['Octavia III 2012–2020', 'SKOC312'], ['Octavia IV 2019–2024', 'SKOC419'], ['Kodiaq 2016–2024', 'SKKD016']],
  Porsche:   [['Macan 2014–2024', 'POMAC14'], ['Cayenne 2017–2024', 'POCAY17'], ['Panamera 2016–2024', 'POPAN16']],
  Ford:      [['Focus IV 2018–2024', 'FOFC418'], ['Kuga III 2019–2024', 'FOKG319'], ['Mondeo V 2014–2022', 'FOMD514']]
};

function modelsFor(brand) {
  if (MODELS_BY_BRAND[brand]) return MODELS_BY_BRAND[brand];
  // универсальная заглушка для брендов без отдельного списка
  const p = brand.replace(/[^A-Za-z]/g, '').substring(0, 2).toUpperCase();
  return [
    ['Sedan 2014–2020', p + '10001'],
    ['SUV 2016–2023', p + '20002'],
    ['Hatchback 2015–2022', p + '30003'],
    ['Liftback 2018–2024', p + '40004']
  ];
}

/* ---------- Параметры URL ---------- */
function param(name) { return new URLSearchParams(location.search).get(name); }

/* ---------- Рендер брендов ---------- */
function brandTile(name) {
  const initials = name.replace(/[^A-Za-zА-Яа-я ]/g, '').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  return `
    <a href="katalog.html?cat=mats&brand=${encodeURIComponent(name)}" class="brand-card">
      <span class="brand-card__logo">${initials}</span>
      <span class="brand-card__name">${name}</span>
    </a>`;
}
function renderBrands(list) {
  const grid = document.getElementById('brandsGrid');
  if (!grid) return;
  const en = (typeof isEnglish === 'function') && isEnglish();
  if (!list.length) {
    grid.innerHTML = `<div class="catalog-empty">${en ? 'No brands found.' : 'Keine Marken gefunden.'}</div>`;
    return;
  }
  grid.innerHTML = list.map(brandTile).join('');
}
function filterBrands(q) {
  const v = (q || '').toLowerCase().trim();
  renderBrands(BRANDS.filter(b => b.toLowerCase().includes(v)));
}

/* ---------- Рендер моделей ---------- */
let CURRENT_MODELS = [];
function modelCard(m, brand, idx) {
  const [name, art] = m;
  return `
    <a href="konfigurator.html?id=${art}&brand=${encodeURIComponent(brand)}" class="model-card">
      <img src="https://picsum.photos/240/160?random=${(100 + idx)}" alt="${name}">
      <p>${brand} ${name}</p>
      <span class="article">${art}</span>
    </a>`;
}
function renderModels(list, brand) {
  const grid = document.getElementById('modelsGrid');
  if (!grid) return;
  const en = (typeof isEnglish === 'function') && isEnglish();
  if (!list.length) {
    grid.innerHTML = `<div class="catalog-empty">${en ? 'No models found.' : 'Keine Modelle gefunden.'}</div>`;
    return;
  }
  grid.innerHTML = list.map((m, i) => modelCard(m, brand, i)).join('');
}
function filterModels() {
  const brand = param('brand');
  const modelSel = (document.getElementById('modelFilter') || {}).value || '';
  const yearSel = (document.getElementById('yearFilter') || {}).value || '';
  let list = CURRENT_MODELS.slice();
  if (modelSel) list = list.filter(m => m[0].toLowerCase().includes(modelSel.toLowerCase()));
  if (yearSel)  list = list.filter(m => m[0].includes(yearSel));
  renderModels(list, brand);
}
function clearFilters() {
  const mf = document.getElementById('modelFilter'); if (mf) mf.value = '';
  const yf = document.getElementById('yearFilter');  if (yf) yf.value = '';
  renderModels(CURRENT_MODELS, param('brand'));
}

/* ---------- Маршрутизация представлений ---------- */
function initCatalog() {
  const vCats = document.getElementById('viewCategories');
  const vBrands = document.getElementById('viewBrands');
  const vModels = document.getElementById('viewModels');
  if (!vCats && !vBrands && !vModels) return; // не на каталоге

  const cat = param('cat');
  const brand = param('brand');

  const show = (el) => { if (el) el.style.display = 'block'; };
  const hide = (el) => { if (el) el.style.display = 'none'; };
  hide(vCats); hide(vBrands); hide(vModels);

  if (cat === 'mats' && brand) {
    // Модели выбранного бренда
    show(vModels);
    document.getElementById('modelsBrandTitle').textContent = brand;
    const bc = document.getElementById('bcModels');
    if (bc) bc.textContent = brand;
    CURRENT_MODELS = modelsFor(brand);
    // заполнить фильтр моделей
    const mf = document.getElementById('modelFilter');
    if (mf) {
      mf.innerHTML = '<option value="">' + ((typeof isEnglish==='function'&&isEnglish())?'Select model':'Modell auswählen') + '</option>'
        + [...new Set(CURRENT_MODELS.map(m => m[0].split(' ')[0]))].map(n => `<option>${n}</option>`).join('');
    }
    // годы
    const yf = document.getElementById('yearFilter');
    if (yf) {
      let years = '';
      for (let y = 2024; y >= 2005; y--) years += `<option>${y}</option>`;
      yf.innerHTML = '<option value="">' + ((typeof isEnglish==='function'&&isEnglish())?'Select year':'Baujahr auswählen') + '</option>' + years;
    }
    renderModels(CURRENT_MODELS, brand);
  } else if (cat === 'mats') {
    // Сетка брендов
    show(vBrands);
    renderBrands(BRANDS);
  } else {
    // Категории
    show(vCats);
  }
}

document.addEventListener('DOMContentLoaded', initCatalog);
