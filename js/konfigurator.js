/* =====================================================================
   NEOMAT — konfigurator.js
   Логика конструктора ковриков: выбор бренда/модели,
   живое превью, динамический пересчёт цены
   ===================================================================== */

/* ---------- Состояние конфигурации ---------- */
const config = {
  material: "eva",
  textur: "raute",
  farbe: "#15151a", // цвет материала
  kantfarbe: "#8B1A1A", // цвет канта
  set: "voll",
  halterung: "ohne",
  fersenpolster: "ohne",
  clips: "mit",
};

/* ---------- Базовые цены по набору (€) ---------- */
const basePrice = { einzeln: 49, paar: 89, voll: 159, premium: 199 };

/* Каждый вариант набора → тип цены */
const setToPrice = {
  "vorne-rechts": "einzeln",
  "vorne-links": "einzeln",
  "hinten-rechts": "einzeln",
  "hinten-links": "einzeln",
  "vorne-paar": "paar",
  "hinten-paar": "paar",
  voll: "voll",
  premium: "premium",
};

/* Надбавки за опции (€) — по ТЗ v2 */
const ADD = {
  material: { eva: 0, ecoskin: 25 },
  halterung: { ohne: 0, "3d": 15 },
  fersenpolster: { ohne: 0, metall: 20, gummi: 15 },
  clips: { mit: 0, ohne: 0 },
};

/* Стоимость доставки по набору (€) */
const DELIVERY = { einzeln: 4.99, paar: 6.99, voll: 9.99, premium: 12.99 };

/* ---------- Данные брендов и моделей ---------- */
const BRANDS = [
  "Audi",
  "BMW",
  "Mercedes",
  "VW",
  "Toyota",
  "Hyundai",
  "KIA",
  "Skoda",
  "Porsche",
  "Ford",
];
const MODELS = {
  Audi: [
    ["A4 (B9)", "2015–2023"],
    ["A6 (C8)", "2018–2024"],
    ["A7 (4G7)", "2010–2017"],
    ["Q5 (FY)", "2017–2024"],
  ],
  BMW: [
    ["3er (G20)", "2018–2024"],
    ["5er (G30)", "2017–2023"],
    ["X3 (G01)", "2017–2024"],
  ],
  Mercedes: [
    ["C-Klasse (W205)", "2014–2021"],
    ["E-Klasse (W213)", "2016–2023"],
    ["GLC (X253)", "2015–2022"],
  ],
  VW: [
    ["Golf VII", "2012–2019"],
    ["Golf VIII", "2019–2024"],
    ["Passat (B8)", "2014–2023"],
    ["Tiguan II", "2016–2024"],
  ],
  Toyota: [
    ["Camry XV70", "2017–2024"],
    ["Corolla E210", "2018–2024"],
    ["RAV4 V", "2018–2024"],
  ],
  Hyundai: [
    ["Tucson III", "2015–2020"],
    ["Tucson IV", "2020–2024"],
    ["Santa Fe", "2018–2024"],
  ],
  KIA: [
    ["Sportage IV", "2015–2021"],
    ["Ceed III", "2018–2024"],
    ["Sorento IV", "2020–2024"],
  ],
  Skoda: [
    ["Octavia III", "2012–2020"],
    ["Octavia IV", "2019–2024"],
    ["Kodiaq", "2016–2024"],
  ],
  Porsche: [
    ["Macan", "2014–2024"],
    ["Cayenne", "2017–2024"],
    ["Panamera", "2016–2024"],
  ],
  Ford: [
    ["Focus IV", "2018–2024"],
    ["Kuga III", "2019–2024"],
    ["Mondeo V", "2014–2022"],
  ],
};

/* Палитра цветов материала по фактуре (по ТЗ v2) */
const COLORS = {
  raute: [
    "#1A1A1A",
    "#555555",
    "#8B4513",
    "#D2B48C",
    "#C9A84C",
    "#8B1A1A",
    "#000080",
    "#006400",
    "#191970",
    "#800020",
  ],
  wabe: ["#1A1A1A", "#555555", "#8B4513", "#D2B48C", "#8B1A1A", "#000080"],
  tropfen: ["#1A1A1A", "#555555", "#8B1A1A", "#006400"],
};

let selectedBrand = null;
let selectedModel = null;

/* =================================================================
   ШАГ 1 — БРЕНДЫ
   ================================================================= */
function renderBrands(filter = "") {
  const grid = document.getElementById("brandGrid");
  const q = filter.trim().toLowerCase();
  const list = BRANDS.filter((b) => b.toLowerCase().includes(q));
  grid.innerHTML = list
    .map(
      (b) => `
    <button class="brand-tile ${selectedBrand === b ? "active" : ""}" onclick="selectBrand('${b}')">
      <span class="brand-tile__logo">${b[0]}</span>
      <span class="brand-tile__name">${b}</span>
    </button>`,
    )
    .join("");
}

function selectBrand(brand) {
  selectedBrand = brand;
  selectedModel = null;
  renderBrands(document.getElementById("brandSearch").value);
  renderModels();
  document.getElementById("step2").style.display = "block";
  // спрятать конфигуратор до выбора модели
  document.getElementById("configurator").style.display = "none";
  document
    .getElementById("step2")
    .scrollIntoView({ behavior: "smooth", block: "start" });
  updateBreadcrumb();
}

/* =================================================================
   ШАГ 2 — МОДЕЛИ
   ================================================================= */
function renderModels() {
  const wrap = document.getElementById("modelGrid");
  if (!selectedBrand) {
    wrap.innerHTML = "";
    return;
  }
  wrap.innerHTML = MODELS[selectedBrand]
    .map(
      ([name, years]) => `
    <button class="model-card ${selectedModel === name ? "active" : ""}" onclick="selectModel('${name.replace(/'/g, "\\'")}', '${years}')">
      <span class="model-card__name">${name}</span>
      <span class="model-card__years">${years}</span>
    </button>`,
    )
    .join("");
}

function selectModel(name, years) {
  selectedModel = name;
  renderModels();
  // показать конфигуратор
  document.getElementById("configurator").style.display = "grid";
  // заполнить блок 1 (информация о ТС)
  const art = makeArticle(selectedBrand, name);
  document.getElementById("vehicleTitle").textContent =
    `${selectedBrand} ${name} ${years} EU | ${art}`;
  updateBreadcrumb();
  updatePreview();
  calculatePrice();
  document
    .getElementById("configurator")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

/* Псевдо-артикул из бренда и модели */
function makeArticle(brand, model) {
  const p = brand.substring(0, 2).toUpperCase();
  let n = 0;
  for (const ch of brand + model) n = (n + ch.charCodeAt(0) * 7) % 90000;
  return p + (10000 + n);
}

/* Хлебные крошки */
function updateBreadcrumb() {
  const el = document.getElementById("bcDynamic");
  if (!el) return;
  let s = "";
  if (selectedBrand) s += ` › ${selectedBrand}`;
  if (selectedModel) s += ` › ${selectedModel}`;
  el.textContent = s;
}

/* =================================================================
   ПРЕВЬЮ КОВРИКА — фактура + цвета
   ================================================================= */
function getTextureBg(color, textur) {
  // прозрачные накладки-линии формируют фактуру поверх базового цвета
  if (textur === "raute") {
    return `repeating-linear-gradient(45deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 15px),
            repeating-linear-gradient(-45deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 15px),
            ${color}`;
  }
  if (textur === "wabe") {
    return `repeating-linear-gradient(60deg, rgba(0,0,0,0.20) 0 1px, transparent 1px 17px),
            repeating-linear-gradient(-60deg, rgba(0,0,0,0.20) 0 1px, transparent 1px 17px),
            repeating-linear-gradient(0deg, rgba(0,0,0,0.20) 0 1px, transparent 1px 17px),
            ${color}`;
  }
  // tropfen — точки
  return `radial-gradient(circle, rgba(0,0,0,0.28) 3px, transparent 4px) 0 0 / 19px 19px, ${color}`;
}

function updatePreview() {
  const mat = document.getElementById("matShape");
  const edge = document.getElementById("matEdge");
  if (!mat) return;
  mat.style.background = getTextureBg(config.farbe, config.textur);
  mat.style.borderColor = config.kantfarbe;
  if (edge) edge.style.borderColor = config.kantfarbe;
  // подпись фактуры/материала на превью
  const lbl = document.getElementById("previewMeta");
  if (lbl) {
    const en = typeof isEnglish === "function" && isEnglish();
    const texNames = {
      raute: en ? "Diamond" : "Raute",
      wabe: en ? "Honeycomb" : "Wabe",
      tropfen: en ? "Drop" : "Tropfen",
    };
    lbl.textContent = `${config.material.toUpperCase()} · ${texNames[config.textur]}`;
  }
}

/* =================================================================
   ПЕРЕСЧЁТ ЦЕНЫ
   ================================================================= */
function calculatePrice() {
  const base = basePrice[setToPrice[config.set]] || 0;
  const add =
    ADD.material[config.material] +
    ADD.halterung[config.halterung] +
    ADD.fersenpolster[config.fersenpolster] +
    ADD.clips[config.clips];
  const total = base + add;
  const delivery = DELIVERY[setToPrice[config.set]] || 0;

  const priceEl = document.getElementById("totalPrice");
  if (priceEl) priceEl.textContent = total.toFixed(0) + " €";
  const deliveryEl = document.getElementById("deliveryCost");
  if (deliveryEl) {
    const en = typeof isEnglish === "function" && isEnglish();
    deliveryEl.textContent =
      total >= 100 ? (en ? "Free" : "Kostenlos") : delivery.toFixed(2) + " €";
  }
  // подсветить активную строку в таблице доставки
  document.querySelectorAll("#deliveryTable tr[data-set]").forEach((tr) => {
    tr.classList.toggle("active", tr.dataset.set === setToPrice[config.set]);
  });
  return total;
}

/* =================================================================
   ОБРАБОТЧИКИ ВЫБОРА ОПЦИЙ
   ================================================================= */
// Универсальный выбор «кнопочной» опции (material/textur/halterung/fersenpolster/clips/set)
function pick(key, value, group) {
  config[key] = value;
  document
    .querySelectorAll(`[data-group="${group}"]`)
    .forEach((el) => el.classList.toggle("active", el.dataset.value === value));
  if (group === "textur") renderColors(); // доступные цвета зависят от фактуры
  updatePreview();
  calculatePrice();
}

// Рендер кружков цвета материала под текущую фактуру
function renderColors() {
  const wrap = document.getElementById("materialColors");
  if (!wrap) return;
  const list = COLORS[config.textur] || COLORS.raute;
  // если текущий цвет недоступен для фактуры — берём первый
  if (!list.includes(config.farbe)) config.farbe = list[0];
  wrap.innerHTML = list
    .map(
      (c) =>
        `<span class="swatch ${c === config.farbe ? "active" : ""}" style="background:${c}" onclick="pickColor('farbe','${c}',this)"></span>`,
    )
    .join("");
}

// Выбор цвета (материал/кант)
function pickColor(key, color, el) {
  config[key] = color;
  const group = el.parentElement;
  group
    .querySelectorAll(".swatch")
    .forEach((s) => s.classList.remove("active"));
  el.classList.add("active");
  updatePreview();
}

/* =================================================================
   КНОПКИ ИТОГА
   ================================================================= */
function configToCart() {
  if (!selectedModel) {
    alert(
      isEnglish()
        ? "Please select a vehicle first."
        : "Bitte zuerst ein Fahrzeug wählen.",
    );
    return;
  }
  const item = {
    name: `${selectedBrand} ${selectedModel}`,
    config: { ...config },
    price: calculatePrice(),
  };
  addToCart(item); // из main.js
}

function payNow() {
  if (!isAuthed()) {
    openAuth();
    return;
  }
  configToCart();
  window.location.href = "warenkorb.html";
}

function contactManager() {
  if (!isAuthed()) {
    openAuth();
    return;
  }
  window.location.href = "kontakt.html";
}

/* =================================================================
   ИНИЦИАЛИЗАЦИЯ
   ================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  renderBrands();
  // привязать поиск брендов
  const search = document.getElementById("brandSearch");
  if (search)
    search.addEventListener("input", (e) => renderBrands(e.target.value));
  // предвыбор бренда из каталога (?brand=Audi)
  const urlBrand = new URLSearchParams(location.search).get("brand");
  if (urlBrand && BRANDS.includes(urlBrand)) {
    selectBrand(urlBrand);
  }
  // начальное превью
  renderColors();
  updatePreview();
  calculatePrice();
});
