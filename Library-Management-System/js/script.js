/* ===== script.js : shared data, helpers, navbar/footer, auth, stats, home & about pages ===== */
'use strict';

/* ---------- 1. BOOK DATA (copies = total copies owned by library) ---------- */
const BOOKS = [
  {id:1,title:'Clean Code',author:'Robert C. Martin',category:'Programming',copies:3,desc:'A handbook of agile software craftsmanship with practical rules for writing readable code.'},
  {id:2,title:'The Pragmatic Programmer',author:'Andrew Hunt & David Thomas',category:'Programming',copies:2,desc:'Timeless tips and techniques that help developers think and work like true professionals.'},
  {id:3,title:'Eloquent JavaScript',author:'Marijn Haverbeke',category:'Programming',copies:0,desc:'A modern introduction to JavaScript, programming concepts and browser-based projects.'},
  {id:4,title:'Artificial Intelligence: A Modern Approach',author:'Stuart Russell & Peter Norvig',category:'Artificial Intelligence',copies:2,desc:'The standard university text covering search, logic, learning and intelligent agents.'},
  {id:5,title:'Deep Learning',author:'Goodfellow, Bengio & Courville',category:'Artificial Intelligence',copies:2,desc:'A comprehensive guide to neural networks, optimisation and modern deep learning methods.'},
  {id:6,title:'Hands-On Machine Learning',author:'Aurélien Géron',category:'Artificial Intelligence',copies:0,desc:'Build intelligent systems using Scikit-Learn, Keras and TensorFlow with real examples.'},
  {id:7,title:'Python for Data Analysis',author:'Wes McKinney',category:'Data Science',copies:3,desc:'Data wrangling and analysis using pandas, NumPy and Jupyter by the creator of pandas.'},
  {id:8,title:'Data Science from Scratch',author:'Joel Grus',category:'Data Science',copies:2,desc:'Learn the core data science algorithms by implementing them yourself in Python.'},
  {id:9,title:'Introduction to Algorithms',author:'Cormen, Leiserson, Rivest & Stein',category:'Computer Science',copies:3,desc:'The definitive reference on algorithms, data structures and complexity analysis.'},
  {id:10,title:'Operating System Concepts',author:'Silberschatz, Galvin & Gagne',category:'Computer Science',copies:2,desc:'Explains processes, memory management, file systems and security in modern operating systems.'},
  {id:11,title:'Computer Networking: A Top-Down Approach',author:'Kurose & Ross',category:'Computer Science',copies:2,desc:'Understand the Internet layer by layer, from applications down to the physical link.'},
  {id:12,title:'Discrete Mathematics and Its Applications',author:'Kenneth H. Rosen',category:'Mathematics',copies:3,desc:'Logic, sets, graphs, combinatorics and proofs explained for computer science students.'},
  {id:13,title:'Linear Algebra and Its Applications',author:'Gilbert Strang',category:'Mathematics',copies:2,desc:'An intuitive introduction to vectors, matrices and their applications in science.'},
  {id:14,title:'The Alchemist',author:'Paulo Coelho',category:'Fiction',copies:4,desc:'A beloved novel about a shepherd boy following his dream across the Egyptian desert.'},
  {id:15,title:'1984',author:'George Orwell',category:'Fiction',copies:3,desc:'A chilling dystopian classic about surveillance, truth and totalitarian control.'},
  {id:16,title:'A Brief History of Time',author:'Stephen Hawking',category:'Science and Technology',copies:2,desc:'A landmark introduction to black holes, the Big Bang and the nature of time.'},
  {id:17,title:'The Innovators',author:'Walter Isaacson',category:'Science and Technology',copies:2,desc:'The story of the people who created the computer and the Internet.'}
];
const CATEGORIES = ['Programming','Artificial Intelligence','Data Science','Computer Science','Mathematics','Fiction','Science and Technology'];

/* ---------- 2. LOCALSTORAGE HELPERS ---------- */
const LS = {
  get(k, d){ try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch { return d; } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
};
const getUsers = () => LS.get('lib_users', []);
const getSession = () => LS.get('lib_session', null);
const getReservations = () => LS.get('lib_reservations', []);
const saveReservations = list => LS.set('lib_reservations', list);

/* Today's date as YYYY-MM-DD in local time */
function todayISO(){ const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }

/* Auto-update status: Active reservations whose return date has passed become Completed */
function refreshStatuses(){
  const t = todayISO(), list = getReservations(); let changed = false;
  list.forEach(r => { if (r.status === 'Active' && r.returnDate < t){ r.status = 'Completed'; changed = true; } });
  if (changed) saveReservations(list);
  return list;
}
/* Availability is derived from copies minus ACTIVE reservations, so booking/cancelling updates it automatically */
const activeCount = id => getReservations().filter(r => r.bookId === id && r.status === 'Active').length;
const availableCopies = b => Math.max(0, b.copies - activeCount(b.id));
const findBook = id => BOOKS.find(b => b.id === Number(id));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = iso => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
const emailOK = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

/* ---------- 3. UI HELPERS: toast, modal, confirm, field errors ---------- */
function toast(msg, type = 'info'){
  let box = document.getElementById('toast-box');
  if (!box){ box = document.createElement('div'); box.id = 'toast-box'; document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; box.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
function openModal(html){
  closeModal();
  const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal-bg';
  bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><button class="close" aria-label="Close">&times;</button>${html}</div>`;
  bg.addEventListener('click', e => { if (e.target === bg || e.target.classList.contains('close')) closeModal(); });
  document.body.appendChild(bg);
  return bg;
}
function closeModal(){ document.getElementById('modal-bg')?.remove(); }
/* Promise-based confirmation dialog */
function confirmDialog(message){
  return new Promise(resolve => {
    const bg = openModal(`<h3>Please confirm</h3><p style="margin-top:10px">${message}</p>
      <div class="modal-actions"><button class="btn btn-outline" id="c-no">No, keep it</button><button class="btn btn-danger" id="c-yes">Yes, cancel it</button></div>`);
    bg.querySelector('#c-no').onclick = () => { closeModal(); resolve(false); };
    bg.querySelector('#c-yes').onclick = () => { closeModal(); resolve(true); };
    bg.addEventListener('click', e => { if (e.target === bg) resolve(false); });
  });
}
/* Show/clear an error under an input; returns true when valid */
function setError(input, msg){
  const f = input.closest('.field'); f.classList.toggle('invalid', !!msg);
  f.querySelector('.error').textContent = msg || ''; return !msg;
}

/* ---------- 4. BOOK CARD + DETAILS MODAL (used on home and catalogue) ---------- */
function bookCard(b){
  const a = availableCopies(b), ok = a > 0;
  return `<article class="book-card">
    <div class="cover"><img src="images/covers/${b.id}.svg" alt="Cover of ${esc(b.title)}" loading="lazy">
      <span class="badge ${ok ? 'ok' : 'no'}">${ok ? 'Available' : 'Unavailable'}</span></div>
    <div class="book-body"><span class="cat">${esc(b.category)}</span><h3>${esc(b.title)}</h3>
      <p class="author">by ${esc(b.author)}</p><p class="desc">${esc(b.desc)}</p>
      <p class="copies">${ok ? a + ' of ' + b.copies + ' copies available' : 'All copies currently issued'}</p>
      <div class="actions"><button class="btn btn-outline" data-details="${b.id}">View Details</button>
      ${ok ? `<a class="btn btn-primary" href="reservation.html?book=${b.id}">Reserve Now</a>` : `<button class="btn btn-disabled" disabled>Unavailable</button>`}</div></div></article>`;
}
function showDetails(id){
  const b = findBook(id), a = availableCopies(b), ok = a > 0;
  openModal(`<div class="modal-book"><img src="images/covers/${b.id}.svg" alt="Cover of ${esc(b.title)}">
    <div><span class="cat">${esc(b.category)}</span><h2 style="font-size:1.5rem">${esc(b.title)}</h2><p class="author">by ${esc(b.author)}</p>
    <p style="margin:12px 0">${esc(b.desc)}</p><span class="status ${ok ? 'Active' : 'Cancelled'}">${ok ? a + ' / ' + b.copies + ' copies available' : 'Currently unavailable'}</span></div></div>
    <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">Close</button>
    ${ok ? `<a class="btn btn-primary" href="reservation.html?book=${b.id}">Reserve This Book</a>` : ''}</div>`);
}
document.addEventListener('click', e => { const d = e.target.closest('[data-details]'); if (d) showDetails(d.dataset.details); });

/* ---------- 5. NAVBAR + FOOTER (injected so every page stays consistent) ---------- */
function buildLayout(){
  const page = document.body.dataset.page, user = getSession();
  const link = (href, key, label) => `<a href="${href}" class="${page === key ? 'active' : ''}">${label}</a>`;
  document.getElementById('site-header').innerHTML = `<div class="container nav-inner">
    <a class="brand" href="index.html"><img src="images/logo.svg" alt="Library logo"><span>LPU CENTRAL LIBRARY</span></a>
    <button class="nav-toggle" aria-label="Toggle menu"><i class="fa-solid fa-bars"></i></button>
    <nav id="nav-links" aria-label="Main navigation">${link('index.html','home','Home')}${link('books.html','books','Browse Books')}
    ${link('my-reservations.html','mine','My Reservations')}${link('about.html','about','About Us')}
    ${user ? `<span class="user-chip"><i class="fa-solid fa-user"></i> ${esc(user.name.split(' ')[0])}</span><a href="#" id="logout-btn" class="cta">Logout</a>`
           : `<a href="login.html" class="cta ${page === 'login' ? 'active' : ''}">Login / Register</a>`}</nav></div>`;
  document.getElementById('site-footer').innerHTML = `<div class="container"><div class="footer-grid">
    <div><h4>LPU CENTRAL LIBRARY</h4><p>Your gateway to knowledge. Browse, reserve and enjoy thousands of books from anywhere on campus.</p></div>
    <div><h4>Quick Links</h4><ul><li><a href="index.html">Home</a></li><li><a href="books.html">Browse Books</a></li><li><a href="reservation.html">Reserve a Book</a></li><li><a href="my-reservations.html">My Reservations</a></li><li><a href="about.html">About Us</a></li></ul></div>
    <div><h4>Contact</h4><ul><li><i class="fa-solid fa-location-dot"></i> Lovely Professional university,Phagwara,Punjab</li><li><i class="fa-solid fa-phone"></i> +91 925 123 4567</li><li><i class="fa-solid fa-envelope"></i> library@lpu.edu</li></ul></div>
    <div><h4>Follow Us</h4><div class="socials"><a href="#" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a><a href="#" aria-label="Twitter"><i class="fa-brands fa-x-twitter"></i></a><a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a><a href="#" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a></div></div>
    </div><div class="copyright">&copy; ${new Date().getFullYear()} LPU CENTRAL LIBRARY. All rights reserved. | B.Tech CSE CA1 Project</div></div>`;
  document.querySelector('.nav-toggle').onclick = () => document.getElementById('nav-links').classList.toggle('open');
  document.getElementById('logout-btn')?.addEventListener('click', e => {
    e.preventDefault(); localStorage.removeItem('lib_session'); toast('Logged out successfully', 'success'); setTimeout(() => location.href = 'index.html', 800);
  });
  document.querySelectorAll('.socials a[href="#"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); toast('Demo link: social page not available', 'info'); }));
}

/* ---------- 6. DASHBOARD STATISTICS (home page) ---------- */
function updateStats(){
  const res = getReservations();
  const vals = {
    books: BOOKS.reduce((s, b) => s + b.copies, 0),
    available: BOOKS.reduce((s, b) => s + availableCopies(b), 0),
    students: 1200 + getUsers().length,
    reservations: res.length
  };
  document.querySelectorAll('[data-stat]').forEach(el => {
    const target = vals[el.dataset.stat]; let n = 0; const step = Math.max(1, Math.ceil(target / 40));
    const t = setInterval(() => { n = Math.min(target, n + step); el.textContent = n.toLocaleString(); if (n >= target) clearInterval(t); }, 25);
  });
}

/* ---------- 7. HOME PAGE ---------- */
function initHome(){
  document.getElementById('featured-grid').innerHTML = [1,4,7,9,14,16].map(id => bookCard(findBook(id))).join('');
  document.getElementById('home-search').addEventListener('submit', e => {
    e.preventDefault(); const q = document.getElementById('home-q').value.trim();
    location.href = 'books.html' + (q ? '?q=' + encodeURIComponent(q) : '');
  });
  updateStats();
}

/* ---------- 8. LOGIN / REGISTER PAGE (demo only - passwords stored in plain text) ---------- */
function initLogin(){
  const tabs = document.querySelectorAll('.auth-tabs button'), lf = document.getElementById('login-form'), rf = document.getElementById('register-form');
  const show = which => { tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === which)); lf.classList.toggle('hidden', which !== 'login'); rf.classList.toggle('hidden', which !== 'register'); };
  tabs.forEach(t => t.onclick = () => show(t.dataset.tab));
  if (location.hash === '#register') show('register');

  lf.addEventListener('submit', e => {
    e.preventDefault();
    const email = lf.email, pass = lf.password; let ok = true;
    ok = setError(email, emailOK(email.value.trim()) ? '' : 'Enter a valid email address') && ok;
    ok = setError(pass, pass.value ? '' : 'Password is required') && ok;
    if (!ok) return toast('Please fix the highlighted fields', 'error');
    const user = getUsers().find(u => u.email === email.value.trim().toLowerCase() && u.password === pass.value);
    if (!user) return toast('Invalid email or password', 'error');
    LS.set('lib_session', {name: user.name, regNo: user.regNo, email: user.email});
    toast('Login successful! Redirecting...', 'success'); setTimeout(() => location.href = 'index.html', 1200);
  });

  rf.addEventListener('submit', e => {
    e.preventDefault();
    const f = rf; let ok = true;
    ok = setError(f.fullName, f.fullName.value.trim().length >= 3 ? '' : 'Enter your full name (min 3 characters)') && ok;
    ok = setError(f.regNo, /^[A-Za-z0-9]{6,15}$/.test(f.regNo.value.trim()) ? '' : 'Registration number must be 6-15 letters/digits') && ok;
    ok = setError(f.email, emailOK(f.email.value.trim()) ? '' : 'Enter a valid email address') && ok;
    ok = setError(f.password, f.password.value.length >= 6 ? '' : 'Password must be at least 6 characters') && ok;
    ok = setError(f.confirm, f.confirm.value === f.password.value && f.confirm.value ? '' : 'Passwords do not match') && ok;
    if (!ok) return toast('Please fix the highlighted fields', 'error');
    const users = getUsers(), email = f.email.value.trim().toLowerCase();
    if (users.some(u => u.email === email)) return toast('An account with this email already exists', 'error');
    users.push({name: f.fullName.value.trim(), regNo: f.regNo.value.trim().toUpperCase(), email, password: f.password.value});
    LS.set('lib_users', users); f.reset();
    toast('Registration successful! Please log in.', 'success'); show('login'); lf.email.value = email;
  });
}

/* ---------- 9. ABOUT PAGE: feedback form ---------- */
function initAbout(){
  const f = document.getElementById('feedback-form');
  f.addEventListener('submit', e => {
    e.preventDefault(); let ok = true;
    ok = setError(f.fullName, f.fullName.value.trim().length >= 3 ? '' : 'Please enter your name') && ok;
    ok = setError(f.email, emailOK(f.email.value.trim()) ? '' : 'Enter a valid email address') && ok;
    ok = setError(f.rating, f.rating.value ? '' : 'Please choose a rating') && ok;
    ok = setError(f.message, f.message.value.trim().length >= 10 ? '' : 'Message must be at least 10 characters') && ok;
    if (!ok) return toast('Please fix the highlighted fields', 'error');
    const list = LS.get('lib_feedback', []);
    list.push({name: f.fullName.value.trim(), email: f.email.value.trim(), rating: f.rating.value, message: f.message.value.trim(), date: todayISO()});
    LS.set('lib_feedback', list); f.reset(); toast('Thank you! Your feedback has been submitted.', 'success');
  });
}

/* ---------- 10. BOOT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  refreshStatuses(); buildLayout();
  const p = document.body.dataset.page;
  if (p === 'home') initHome();
  if (p === 'login') initLogin();
  if (p === 'about') initAbout();
});
