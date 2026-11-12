/* ===== reservation.js : reservation form (reservation.html) and dashboard (my-reservations.html) ===== */
'use strict';
const LOAN_DAYS_MAX = 30;                       // maximum loan period
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
/* Unique reservation ID, e.g. LIB-LX4K2P-7Q */
const makeReservationId = () => 'LIB-' + Date.now().toString(36).toUpperCase().slice(-6) + '-' + Math.random().toString(36).slice(2, 4).toUpperCase();

/* ---------- RESERVATION FORM ---------- */
function initReservationForm(){
  const f = document.getElementById('res-form'), box = document.getElementById('res-box'), msg = document.getElementById('avail-msg');
  const sel = f.bookId, d1 = f.resDate, d2 = f.returnDate, today = todayISO();

  sel.innerHTML = '<option value="">-- Select a book --</option>' + BOOKS.map(b =>
    `<option value="${b.id}">${esc(b.title)}${availableCopies(b) ? '' : ' (Unavailable)'}</option>`).join('');
  d1.min = today; d1.value = today; d2.min = addDays(today, 1); d2.value = addDays(today, 14);

  const user = getSession();                                       // prefill for logged-in students
  if (user){ f.studentName.value = user.name; f.regNo.value = user.regNo; f.email.value = user.email; }
  const pre = new URLSearchParams(location.search).get('book'); if (pre && findBook(pre)) sel.value = pre;

  /* Live availability check */
  function checkAvail(){
    const b = findBook(sel.value); msg.className = 'avail-msg';
    if (!b) return false;
    const a = availableCopies(b);
    msg.classList.add(a > 0 ? 'ok' : 'no');
    msg.innerHTML = a > 0 ? `<i class="fa-solid fa-circle-check"></i> Available: ${a} of ${b.copies} copies in stock.`
                          : `<i class="fa-solid fa-circle-xmark"></i> Sorry, all copies of this book are currently reserved.`;
    return a > 0;
  }
  sel.addEventListener('change', checkAvail);
  d1.addEventListener('change', () => { d2.min = addDays(d1.value || today, 1); if (d2.value <= d1.value) d2.value = d2.min; });
  checkAvail();

  f.addEventListener('submit', e => {
    e.preventDefault(); let ok = true;
    ok = setError(f.studentName, f.studentName.value.trim().length >= 3 ? '' : 'Enter your full name (min 3 characters)') && ok;
    ok = setError(f.regNo, /^[A-Za-z0-9]{6,15}$/.test(f.regNo.value.trim()) ? '' : 'Registration number must be 6-15 letters/digits') && ok;
    ok = setError(f.email, !f.email.value.trim() ? 'Email is required' : emailOK(f.email.value.trim()) ? '' : 'Enter a valid email address') && ok;
    ok = setError(sel, sel.value ? '' : 'Please select a book') && ok;
    ok = setError(d1, !d1.value ? 'Reservation date is required' : d1.value < today ? 'Date cannot be in the past' : '') && ok;
    let rMsg = '';
    if (!d2.value) rMsg = 'Return date is required';
    else if (d2.value <= d1.value) rMsg = 'Return date must be after reservation date';
    else if (d2.value > addDays(d1.value, LOAN_DAYS_MAX)) rMsg = `Maximum loan period is ${LOAN_DAYS_MAX} days`;
    ok = setError(d2, rMsg) && ok;
    if (!ok) return toast('Please fix the highlighted fields', 'error');

    const book = findBook(sel.value);
    if (!checkAvail()) return toast('This book is unavailable and cannot be reserved', 'error');
    const email = f.email.value.trim().toLowerCase();
    if (getReservations().some(r => r.email === email && r.bookId === book.id && r.status === 'Active'))
      return toast('You already have an active reservation for this book', 'error');

    const r = {id: makeReservationId(), bookId: book.id, bookTitle: book.title, studentName: f.studentName.value.trim(),
      regNo: f.regNo.value.trim().toUpperCase(), email, reservationDate: d1.value, returnDate: d2.value, status: 'Active', createdAt: new Date().toISOString()};
    const list = getReservations(); list.push(r); saveReservations(list);
    toast('Book reserved successfully!', 'success');

    box.innerHTML = `<div class="success"><div class="tick"><i class="fa-solid fa-check"></i></div>
      <h2>Reservation Confirmed!</h2><p>Please collect your book from the library desk on the reservation date.</p>
      <div class="receipt">
        <div><span>Reservation ID</span><span class="res-id">${r.id}</span></div>
        <div><span>Student</span><strong>${esc(r.studentName)} (${esc(r.regNo)})</strong></div>
        <div><span>Book</span><strong>${esc(r.bookTitle)}</strong></div>
        <div><span>Reservation Date</span><strong>${fmtDate(r.reservationDate)}</strong></div>
        <div><span>Return Date</span><strong>${fmtDate(r.returnDate)}</strong></div></div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <a class="btn btn-primary" href="my-reservations.html"><i class="fa-solid fa-list"></i> My Reservations</a>
        <a class="btn btn-outline" href="reservation.html"><i class="fa-solid fa-plus"></i> Reserve Another</a>
        <button class="btn btn-outline" onclick="window.print()"><i class="fa-solid fa-print"></i> Print</button></div></div>`;
    window.scrollTo({top: 0, behavior: 'smooth'});
  });
}

/* ---------- MY RESERVATIONS DASHBOARD ---------- */
function initDashboard(){
  const user = getSession(); let filter = 'All';
  const mine = () => refreshStatuses().filter(r => !user || r.email === user.email).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function render(){
    const all = mine(), list = filter === 'All' ? all : all.filter(r => r.status === filter);
    const latest = all[0];
    const who = user || (latest ? {name: latest.studentName, regNo: latest.regNo, email: latest.email} : null);
    document.getElementById('student-info').innerHTML = who
      ? `<div class="avatar">${esc(who.name[0].toUpperCase())}</div><div><h3>${esc(who.name)}</h3><p class="author">Reg No: ${esc(who.regNo)} &nbsp;|&nbsp; ${esc(who.email)}</p>${user ? '' : '<p class="author">Showing all reservations made on this device.</p>'}</div>`
      : `<div class="avatar"><i class="fa-solid fa-user"></i></div><div><h3>Guest Student</h3><p class="author">Log in or make a reservation to see your details here.</p></div><a href="login.html" class="btn btn-primary">Login</a>`;
    document.getElementById('d-total').textContent = all.length;
    document.getElementById('d-active').textContent = all.filter(r => r.status === 'Active').length;
    document.getElementById('d-done').textContent = all.filter(r => r.status === 'Completed').length;
    document.getElementById('d-cancel').textContent = all.filter(r => r.status === 'Cancelled').length;

    document.getElementById('res-list').innerHTML = list.length ? list.map(r => `
      <article class="res-card"><img src="images/covers/${r.bookId}.svg" alt="">
        <div><h3>${esc(r.bookTitle)}</h3>
          <div class="meta"><span><i class="fa-solid fa-hashtag"></i> <span class="res-id">${r.id}</span></span>
          <span><i class="fa-regular fa-calendar"></i> Reserved: ${fmtDate(r.reservationDate)}</span>
          <span><i class="fa-solid fa-rotate-left"></i> Return by: ${fmtDate(r.returnDate)}</span></div>
          <div style="margin-top:8px"><span class="status ${r.status}">${r.status}</span></div></div>
        ${r.status === 'Active' ? `<button class="btn btn-danger" data-cancel="${r.id}"><i class="fa-solid fa-xmark"></i> Cancel</button>` : ''}</article>`).join('')
      : `<div class="empty"><i class="fa-solid fa-bookmark"></i><h3>No reservations here</h3><p>Browse the catalogue to reserve your first book.</p><br><a class="btn btn-primary" href="books.html">Browse Books</a></div>`;
  }

  document.getElementById('res-list').addEventListener('click', async e => {
    const b = e.target.closest('[data-cancel]'); if (!b) return;
    if (!await confirmDialog('Are you sure you want to cancel this reservation? The book will become available to others.')) return;
    const list = getReservations(), r = list.find(x => x.id === b.dataset.cancel);
    if (r){ r.status = 'Cancelled'; saveReservations(list); toast('Reservation cancelled', 'success'); render(); }
  });
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); t.classList.add('active'); filter = t.dataset.filter; render();
  });
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  const p = document.body.dataset.page;
  if (p === 'reservation') initReservationForm();
  if (p === 'mine') initDashboard();
});
