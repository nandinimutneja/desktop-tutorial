/* ===== books.js : catalogue search, filters and sorting ===== */
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('book-grid'), info = document.getElementById('result-info');
  const q = document.getElementById('f-search'), cat = document.getElementById('f-cat'), av = document.getElementById('f-avail'), sort = document.getElementById('f-sort');
  cat.innerHTML += CATEGORIES.map(c => `<option>${c}</option>`).join('');
  q.value = new URLSearchParams(location.search).get('q') || '';   // search term from home page

  function render(){
    const term = q.value.trim().toLowerCase();
    let list = BOOKS.filter(b =>
      (!term || b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term)) &&
      (cat.value === 'all' || b.category === cat.value) &&
      (av.value === 'all' || (av.value === 'available') === (availableCopies(b) > 0)));
    list.sort((a, b) => sort.value === 'za' ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title));
    info.textContent = `Showing ${list.length} of ${BOOKS.length} books`;
    grid.innerHTML = list.length ? list.map(bookCard).join('')
      : `<div class="empty" style="grid-column:1/-1"><i class="fa-solid fa-book-open"></i><h3>No books found</h3><p>Try a different keyword or reset the filters.</p></div>`;
  }
  [q, cat, av, sort].forEach(el => el.addEventListener('input', render));
  document.getElementById('f-reset').addEventListener('click', () => { q.value = ''; cat.value = av.value = 'all'; sort.value = 'az'; render(); toast('Filters reset', 'info'); });
  render();
});
