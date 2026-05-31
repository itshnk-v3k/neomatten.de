/* =====================================================================
   NEOMAT — before-after.js
   Интерактивный слайдер «Vorher / Nachher» с перетаскиваемым разделителем
   ===================================================================== */
(function () {
  function initBeforeAfter() {
    const slider = document.getElementById('baSlider');
    if (!slider) return; // не на главной

    const divider = document.getElementById('baDivider');
    const afterEl = slider.querySelector('.ba-after');
    if (!divider || !afterEl) return;

    let dragging = false;

    function setPos(clientX) {
      const rect = slider.getBoundingClientRect();
      let x = ((clientX - rect.left) / rect.width) * 100;
      x = Math.max(5, Math.min(95, x));
      divider.style.left = x + '%';
      afterEl.style.clipPath = `inset(0 0 0 ${x}%)`;
    }

    // мышь
    divider.addEventListener('mousedown', (e) => { dragging = true; e.preventDefault(); });
    document.addEventListener('mouseup', () => { dragging = false; });
    document.addEventListener('mousemove', (e) => { if (dragging) setPos(e.clientX); });

    // клик по контейнеру — переместить разделитель
    slider.addEventListener('click', (e) => {
      if (e.target.closest('.ba-handle')) return;
      setPos(e.clientX);
    });

    // тач
    divider.addEventListener('touchstart', () => { dragging = true; }, { passive: true });
    document.addEventListener('touchend', () => { dragging = false; });
    slider.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) setPos(e.touches[0].clientX);
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', initBeforeAfter);
})();
