/* =====================================================================
   NEOMAT — slider.js
   Карусель «Unsere Arbeiten» (без библиотек)
   ===================================================================== */

let slideIndex = 0;
let slideCount = 0;
let sliderTimer = null;

/* Построение точек-навигации по числу слайдов */
function buildDots() {
  const track = document.getElementById("sliderTrack");
  const dots = document.getElementById("sliderDots");
  if (!track || !dots) return;

  slideCount = track.children.length;
  dots.innerHTML = "";
  for (let i = 0; i < slideCount; i++) {
    const b = document.createElement("button");
    if (i === 0) b.classList.add("active");
    b.setAttribute("aria-label", "Slide " + (i + 1));
    b.addEventListener("click", () => goToSlide(i));
    dots.appendChild(b);
  }
  startAutoplay();
}

/* Отрисовка текущего положения трека и активной точки */
function renderSlider() {
  const track = document.getElementById("sliderTrack");
  if (!track) return;
  track.style.transform = `translateX(-${slideIndex * 100}%)`;
  document
    .querySelectorAll("#sliderDots button")
    .forEach((d, i) => d.classList.toggle("active", i === slideIndex));
}

/* Сдвиг на dir (+1 / -1) с зацикливанием */
function moveSlider(dir) {
  if (!slideCount) return;
  slideIndex = (slideIndex + dir + slideCount) % slideCount;
  renderSlider();
}

/* Переход на конкретный слайд */
function goToSlide(i) {
  slideIndex = i;
  renderSlider();
  restartAutoplay();
}

/* Авто-прокрутка каждые 6 секунд */
function startAutoplay() {
  if (slideCount > 1) sliderTimer = setInterval(() => moveSlider(1), 6000);
}
function restartAutoplay() {
  clearInterval(sliderTimer);
  startAutoplay();
}
