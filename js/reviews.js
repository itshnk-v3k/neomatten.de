/* =====================================================================
   NEOMAT — reviews.js
   Отзывы: рендер, добавление, хранение в localStorage
   ===================================================================== */

const REVIEWS_KEY = 'neomat_reviews';
let selectedRating = 5;
let reviewPhotoBase64 = null;

/* Демо-отзывы по умолчанию (показываются если нет своих) */
const DEFAULT_REVIEWS = [
  { name: 'Markus S.', text: 'Perfekte Passform, hochwertige Qualität! Die Matten sitzen genau und lassen sich sehr leicht reinigen.', rating: 5, date: '12.05.2024', photo: null },
  { name: 'Birgit R.', text: 'Sehr schöne Matten, passen hervorragend ins Auto. Schnelle Lieferung und toller Kundenservice.', rating: 5, date: '03.05.2024', photo: null },
  { name: 'Thomas M.', text: 'Gutes Preis-Leistungs-Verhältnis. Material ist robust und wie beschrieben. Gerne wieder!', rating: 4, date: '28.04.2024', photo: null }
];

function loadReviews() {
  try { return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || DEFAULT_REVIEWS; }
  catch (e) { return DEFAULT_REVIEWS; }
}

function renderReviews() {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;
  const en = (typeof isEnglish === 'function') && isEnglish();
  const reviews = loadReviews();
  if (!reviews.length) {
    grid.innerHTML = `<p style="color:var(--color-text-muted); grid-column:1/-1">${en ? 'No reviews yet.' : 'Noch keine Bewertungen.'}</p>`;
    return;
  }
  grid.innerHTML = reviews.slice(0, 6).map(r => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    return `
      <div class="review-card">
        <div class="review-card__head">
          <span class="review-card__name">${r.name}</span>
          <span class="review-card__date">${r.date}</span>
        </div>
        <div class="review-card__stars">${stars}</div>
        <p class="review-card__text">${r.text}</p>
        ${r.photo ? `<img class="review-card__photo" src="${r.photo}" alt="Foto">` : ''}
      </div>`;
  }).join('');
}

/* Попап добавления */
function showAddReviewPopup() {
  const popup = document.getElementById('reviewPopup');
  if (popup) { popup.classList.add('open'); selectedRating = 5; reviewPhotoBase64 = null; updateStars(5); }
  else { alert('Bewertungsfunktion wird geladen...'); }
}

function updateStars(val) {
  document.querySelectorAll('#starRating span').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.val) <= val);
  });
  selectedRating = val;
}

function previewReviewPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    reviewPhotoBase64 = e.target.result;
    const preview = document.getElementById('reviewPhotoPreview');
    if (preview) { preview.src = reviewPhotoBase64; preview.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}

function submitReview() {
  const name = (document.getElementById('reviewName') || {}).value || '';
  const text = (document.getElementById('reviewText') || {}).value || '';
  if (!name.trim() || !text.trim()) {
    alert((typeof isEnglish === 'function' && isEnglish()) ? 'Please enter name and text.' : 'Bitte Name und Text eingeben.');
    return;
  }
  const review = {
    name: name.trim(), text: text.trim(), rating: selectedRating,
    date: new Date().toLocaleDateString('de-DE'), photo: reviewPhotoBase64 || null
  };
  const reviews = loadReviews();
  reviews.unshift(review);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  renderReviews();
  const popup = document.getElementById('reviewPopup');
  if (popup) popup.classList.remove('open');
  // сброс формы
  if (document.getElementById('reviewName')) document.getElementById('reviewName').value = '';
  if (document.getElementById('reviewText')) document.getElementById('reviewText').value = '';
  const prev = document.getElementById('reviewPhotoPreview');
  if (prev) { prev.style.display = 'none'; prev.src = ''; }
  reviewPhotoBase64 = null;
}

/* Инициализация: звёзды + рендер */
document.addEventListener('DOMContentLoaded', () => {
  renderReviews();
  document.querySelectorAll('#starRating span').forEach(s =>
    s.addEventListener('click', () => updateStars(parseInt(s.dataset.val))));
});
