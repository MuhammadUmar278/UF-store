/* UF Store Karachi - Fast version: small thumbnails in the list, full photos load only when a product is opened */
const CFG = {
  firebase: {
    apiKey: "AIzaSyCs6xqlLRfwdcCjiX4gY_3NhdbtZXFLtSI",
    authDomain: "uf-store-d36c3.firebaseapp.com",
    projectId: "uf-store-d36c3",
    storageBucket: "uf-store-d36c3.firebasestorage.app",
    messagingSenderId: "85123845058",
    appId: "1:85123845058:web:3f256b273e2e6a63be645b"
  },
  ADMIN_EMAIL: "umerfaisal278@gmail.com",
  WHATSAPP: "923360896919",
  PAY_NUMBER: "03360896919",
  PAY_TITLE: "UF Store",
  EMAILJS: { publicKey: "dekLOVGTjCsH3wpJC", serviceId: "service_yq924f6", templateId: "template_52wptzx" },
  NOTIFY_EMAIL: "umerfaisal278@gmail.com"
};
firebase.initializeApp(CFG.firebase);
const auth = firebase.auth(), db = firebase.firestore(), FV = firebase.firestore.FieldValue;
db.enablePersistence({synchronizeTabs: true}).catch(() => {}); /* cached products show instantly on repeat visits */
if (CFG.EMAILJS.publicKey) emailjs.init({publicKey: CFG.EMAILJS.publicKey});

const $ = id => document.getElementById(id);
const fmt = n => Number(n || 0).toLocaleString('en-PK');
const syncLock = () => { document.body.style.overflow = document.querySelector('.modal.on') ? 'hidden' : ''; };
const op = id => { $(id).classList.add('on'); syncLock() }, cl = id => { $(id).classList.remove('on'); if (id === 'mProduct') { const v = $('pdVid'); v.innerHTML = ''; v.dataset.src = '' } syncLock() };
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal.on').forEach(m => cl(m.id)) });
document.addEventListener('click', e => { if (e.target.classList && e.target.classList.contains('modal')) cl(e.target.id) });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let tt; const toast = t => { const e = $('toast'); e.textContent = t; e.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => e.classList.remove('on'), 4200) };
let dt; const dq = () => { clearTimeout(dt); dt = setTimeout(() => render(true), 180) };

let products = [], loaded = false, shown = 24, cart = [], me = null, signup = false, adminOrders = [], unsubAdmin = null;
try { cart = JSON.parse(localStorage.getItem('uf_cart') || '[]') } catch {}
const isAdmin = () => me && me.email === CFG.ADMIN_EMAIL.toLowerCase() && me.emailVerified;
$('yr').textContent = new Date().getFullYear();
const thumbOf = p => p.thumb || (p.imgs && p.imgs[0]) || p.img || '';
const imgCount = p => p.n ?? ((p.imgs && p.imgs.length) || (p.img ? 1 : 0));
/* Sale, video & small helpers */
const saleOn = p => +p.sale > 0 && +p.sale < +p.price && (!p.saleEnd || p.saleEnd > Date.now());
const pr = p => saleOn(p) ? +p.sale : +p.price; /* price the customer actually pays */
const off = p => Math.round((1 - p.sale / p.price) * 100);
const priceHTML = p => saleOn(p) ? `<span class="now">Rs. ${fmt(p.sale)}</span><s>Rs. ${fmt(p.price)}</s>` : `Rs. ${fmt(p.price)}`;
const p2 = n => String(n).padStart(2, '0');
const toLocalInput = ms => { if (!ms) return ''; const d = new Date(ms - new Date(ms).getTimezoneOffset() * 6e4); return d.toISOString().slice(0, 16) };
function vidInfo(u) {
  u = (u || '').trim(); if (!/^https?:\/\//i.test(u)) return null;
  let m;
  if ((m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/))) return {t: 'frame', src: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?rel=0&playsinline=1'};
  if ((m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/))) return {t: 'frame', src: 'https://drive.google.com/file/d/' + m[1] + '/preview'};
  if (/(?:facebook\.com|fb\.watch)\//i.test(u)) return {t: 'frame', src: 'https://www.facebook.com/plugins/video.php?show_text=false&href=' + encodeURIComponent(u)};
  if (/\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(u)) return {t: 'file', src: u};
  return null;
}
const vidHTML = v => v.t === 'file'
  ? `<video src="${esc(v.src)}" controls playsinline preload="metadata"></video>`
  : `<iframe src="${esc(v.src)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" title="Product video"></iframe>`;
function readExtras(v, sl, se, price) {
  const video = $(v).value.trim(), sale = +$(sl).value || 0, saleEnd = sale && $(se).value ? new Date($(se).value).getTime() : 0;
  if (video && !vidInfo(video)) return {err: 'Video link not supported. Use a YouTube, Facebook, Google Drive or direct .mp4 link (starting with https://).'};
  if (sale && sale >= price) return {err: 'Sale price must be lower than the regular price.'};
  if (saleEnd && saleEnd <= Date.now()) return {err: 'Sale end time must be in the future. Clear the date or pick a later time.'};
  return {video, sale, saleEnd};
}
const DELIVERY_NOT_AVAILABLE_MSG = 'Sorry, delivery is currently available only in Karachi. Please enter Karachi as your city to continue.';

document.addEventListener('input', e => {
  if (!e.target || e.target.id !== 'cCity') return;
  const v = e.target.value.trim(), w = $('cityWarn');
  if (v && !/karachi/i.test(v)) { w.style.display = 'block'; w.textContent = '⚠ ' + DELIVERY_NOT_AVAILABLE_MSG } else w.style.display = 'none';
});

/* Products */
db.collection('products').orderBy('created', 'desc').limit(60).onSnapshot(s => {
  products = s.docs.map(d => ({id: d.id, ...d.data()})); loaded = true; render();
  if ($('mAdmin').classList.contains('on')) listProducts();
}, e => {
  loaded = true; console.error(e);
  $('grid').innerHTML = '<div class="empty"><b>⚠️</b>Products could not be loaded.<br><br><button class="btn" style="max-width:200px" onclick="location.reload()">Try again</button></div>';
});

function card(p, i) {
  const fi = thumbOf(p), n = imgCount(p), bits = [];
  if (n > 1) bits.push('📷 ' + n); if (p.video || p.vn) bits.push('▶ Video');
  return `<article class="card rv" style="--d:${(i % 6) * 70}ms">${p.soldOut ? '<span class="sold">Sold Out</span>' : saleOn(p) ? `<span class="off">-${off(p)}%</span>` : ''}${bits.length ? `<span class="pics">${bits.join(' &nbsp; ')}</span>` : ''}
  <div class="img" onclick="openProduct('${p.id}')">${fi ? `<img src="${esc(fi)}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : '🛍️'}</div>
  <div class="in"><h4 onclick="openProduct('${p.id}')">${esc(p.name)}</h4><small>${esc((p.desc || '').slice(0, 70))}${(p.desc || '').length > 70 ? '...' : ''}</small>
  <div class="price">${priceHTML(p)}</div>
  <div class="acts"><button class="btn s" onclick="openProduct('${p.id}')">Details</button>
  <button class="btn" ${p.soldOut ? 'disabled' : ''} onclick="addCart('${p.id}')">${p.soldOut ? 'Out of Stock' : '+ Add to Cart'}</button></div></div></article>`;
}
function render(reset) {
  updCart();
  if (!loaded) return; /* skeleton cards stay visible until real data arrives - no more false "No product found" */
  if (reset === true) shown = 24;
  const q = $('q').value.trim().toLowerCase();
  let list = products.filter(p => (p.name || '').toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q));
  const sort = $('sortSel').value;
  if (sort === 'low') list = [...list].sort((a, b) => pr(a) - pr(b));
  if (sort === 'high') list = [...list].sort((a, b) => pr(b) - pr(a));
  $('pCount').textContent = list.length + (list.length === 1 ? ' product' : ' products') + ' available';
  $('grid').innerHTML = list.slice(0, shown).map(card).join('') +
    (list.length > shown ? '<button class="btn s more" onclick="shown+=24;render()">Show more</button>' : '') ||
    `<div class="empty"><b>🔍</b>${products.length ? 'No products match your search.' : 'No products yet. Please check back soon!'}</div>`;
  renderSale(); reveal();
}
function updCart() { $('cc').textContent = (loaded ? cartItems() : cart).reduce((a, c) => a + c.qty, 0) }

let curP = null, curImg = 0, curImgs = [];
const photoCache = {};
async function openProduct(id) {
  curP = products.find(x => x.id === id); if (!curP) return; curImg = 0;
  if (curP.imgs && curP.imgs.length) curImgs = curP.imgs;
  else if (photoCache[id]) curImgs = photoCache[id];
  else { curImgs = thumbOf(curP) ? [thumbOf(curP)] : []; }
  showProduct();
  if (!(curP.imgs && curP.imgs.length) && !photoCache[id] && imgCount(curP) > 0) {
    try {
      const s = await db.collection('products').doc(id).collection('photos').orderBy('i').get();
      const a = s.docs.map(d => d.data().d);
      if (a.length) { photoCache[id] = a; if (curP && curP.id === id) { curImgs = a; showProduct() } }
    } catch (e) { console.warn('Photos could not be loaded', e) }
  }
}
function showProduct() {
  const p = curP, imgs = curImgs, vi0 = p.video ? vidInfo(p.video) : null, up = p.vn > 0, vi = up ? (vidCache[p.id] ? {t: 'file', src: vidCache[p.id]} : {t: 'wait'}) : vi0, onVid = !!vi && curImg === -1, pv = $('pdVid');
  $('pdImg').src = imgs[curImg] || ''; $('pdImg').style.display = (!onVid && imgs.length) ? '' : 'none'; $('pdImg').alt = p.name || '';
  pv.style.display = onVid ? '' : 'none';
  if (onVid) {
    if (vi.t === 'wait') { pv.innerHTML = '<div class="vload">⏳ Loading video...</div>'; pv.dataset.src = ''; loadVid(p) }
    else if (pv.dataset.src !== vi.src) { pv.innerHTML = vidHTML(vi); pv.dataset.src = vi.src }
  } else { pv.innerHTML = ''; pv.dataset.src = '' }
  $('pdThumbs').innerHTML = (imgs.length > 1 || vi) ? imgs.map((im, i) => `<img src="${esc(im)}" class="${i === curImg ? 'on' : ''}" alt="" onclick="curImg=${i};showProduct()">`).join('') + (vi ? `<div class="vth ${onVid ? 'on' : ''}" onclick="curImg=-1;showProduct()" title="Watch video">▶</div>` : '') : '';
  $('pdName').textContent = p.name || ''; $('pdPrice').innerHTML = priceHTML(p) + (saleOn(p) ? ` <span class="off inl">-${off(p)}%</span>` : '');
  $('pdDesc').textContent = p.desc || 'No description available for this product.';
  $('pdAdd').disabled = !!p.soldOut; $('pdAdd').textContent = p.soldOut ? 'Out of Stock' : 'Add to Cart';
  $('pdWa').href = `https://wa.me/${CFG.WHATSAPP}?text=${encodeURIComponent('Hi, I want to ask about: ' + (p.name || ''))}`;
  op('mProduct');
}

/* Auth */
auth.onAuthStateChanged(u => {
  me = u ? {uid: u.uid, email: (u.email || '').toLowerCase(), name: u.displayName || u.email, emailVerified: u.emailVerified} : null;
  $('bAuth').textContent = me ? 'Logout' : 'Login / Sign Up';
  $('bOrders').style.display = me ? '' : 'none';
  $('bAdmin').style.display = isAdmin() ? '' : 'none';
  if (unsubAdmin) { unsubAdmin(); unsubAdmin = null }
  if (isAdmin()) {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
    let first = true;
    unsubAdmin = db.collection('orders').orderBy('created', 'desc').limit(200).onSnapshot(s => {
      const before = adminOrders.length;
      adminOrders = s.docs.map(d => ({id: d.id, ...d.data()}));
      const n = adminOrders.filter(o => o.status === 'New').length;
      $('nc').textContent = n; $('nc2').textContent = n;
      if (!first && adminOrders.length > before) { toast('New order received! Please check Admin Panel.'); try { if ('Notification' in window && Notification.permission === 'granted') new Notification('New Order - UF Store', {body: 'A new order has arrived.'}) } catch {} }
      first = false;
      if ($('mAdmin').classList.contains('on')) listOrders();
    });
  }
});
function openAuth() { if (me) { auth.signOut(); return toast('You have been logged out.') } op('mAuth') }
function toggleAuth() { signup = !signup; $('aT').textContent = signup ? 'Create Your Account' : 'Welcome Back'; $('aN').style.display = signup ? '' : 'none'; $('aS').textContent = signup ? 'Already have an account? Login' : "Don't have an account? Create one" }
const errMsg = c => ({'auth/configuration-not-found': 'Authentication is not enabled in Firebase. Please enable Email/Password in Firebase Authentication.', 'auth/email-already-in-use': 'This email is already registered. Please login instead.', 'auth/invalid-credential': 'Email or password is incorrect.', 'auth/wrong-password': 'Password is incorrect.', 'auth/user-not-found': 'Account not found.', 'auth/weak-password': 'Password is too weak (minimum 6 characters).', 'auth/invalid-email': 'Please enter a valid email address.', 'auth/too-many-requests': 'Too many attempts. Please try again after some time.', 'auth/unauthorized-domain': 'This domain is not allowed in Firebase. Please add this domain in Firebase > Authentication > Settings > Authorized domains.', 'auth/network-request-failed': 'Network error. Please check your internet connection.'}[c] || 'An error occurred: ' + c);
async function doAuth() {
  const email = $('aE').value.trim(), pass = $('aP').value, name = $('aN').value.trim();
  if (!email || !pass) return toast('Please enter your email and password.');
  try {
    if (signup) {
      if (!name) return toast('Please enter your full name.');
      const c = await auth.createUserWithEmailAndPassword(email, pass);
      await c.user.updateProfile({displayName: name});
      try { await db.collection('users').doc(c.user.uid).set({name, email: email.toLowerCase(), created: FV.serverTimestamp()}) } catch (e) { console.warn(e) }
      try { await c.user.sendEmailVerification() } catch {}
      toast('Account created! A verification link has been sent to your email. Please check Inbox and Spam.');
    } else {
      const c = await auth.signInWithEmailAndPassword(email, pass);
      if (!c.user.emailVerified) { try { await c.user.sendEmailVerification() } catch {} toast('Email is not verified. Verification link sent again. Please check Inbox and Spam.') }
      else toast('Welcome back!');
    }
    cl('mAuth');
  } catch (e) { toast(errMsg(e.code)) }
}
async function resendVerify() {
  const email = $('aE').value.trim(), pass = $('aP').value;
  if (!email || !pass) return toast('Please enter your email and password first.');
  try { const c = await auth.signInWithEmailAndPassword(email, pass); await c.user.sendEmailVerification(); toast('Verification link sent again. Please check Inbox and Spam.') } catch (e) { toast(errMsg(e.code)) }
}
async function resetPass() {
  const email = $('aE').value.trim(); if (!email) return toast('Please enter your email first.');
  try { await auth.sendPasswordResetEmail(email); toast('Password reset link has been sent to your email.') } catch (e) { toast(errMsg(e.code)) }
}

/* Cart & Orders */
const saveCart = () => { try { localStorage.setItem('uf_cart', JSON.stringify(cart)) } catch {} };
const cartItems = () => cart.map(c => ({...c, p: products.find(p => p.id === c.id)})).filter(c => c.p && !c.p.soldOut);
function addCart(id) {
  const p = products.find(x => x.id === id); if (!p || p.soldOut) return;
  const c = cart.find(c => c.id === id); c ? c.qty++ : cart.push({id, qty: 1}); saveCart(); updCart(); toast('Added to cart ✔');
  const b = $('cc'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
}
function payChg() { const v = $('cPay').value; $('payBox').style.display = v === 'COD' ? 'none' : ''; $('payInfo').textContent = `Please send advance payment via ${v} to ${CFG.PAY_NUMBER} (${CFG.PAY_TITLE}) and enter the Transaction ID below.` }
function openCart() {
  const items = cartItems(), total = items.reduce((a, c) => a + pr(c.p) * c.qty, 0);
  $('cartL').innerHTML = items.map(c => `<div class="row">${thumbOf(c.p) ? `<img class="ci" src="${esc(thumbOf(c.p))}" alt="">` : ''}<span style="flex:1"><b>${esc(c.p.name)}</b><br><small class="muted">Rs. ${fmt(pr(c.p))} x ${c.qty} = Rs. ${fmt(pr(c.p) * c.qty)}</small></span><span class="qty"><button onclick="chg('${c.id}',-1)">−</button><b>${c.qty}</b><button onclick="chg('${c.id}',1)">+</button></span></div>`).join('') + (items.length ? `<h4 style="margin:12px 0 0">Total: Rs. ${fmt(total)}</h4>` : '<p class="muted" style="text-align:center;padding:30px 0">Your cart is empty.</p>');
  $('co').style.display = items.length ? '' : 'none';
  try { const s = JSON.parse(localStorage.getItem('uf_ship') || '{}'); if (!$('cPh').value && s.phone) $('cPh').value = s.phone; if (!$('cA').value && s.addr) $('cA').value = s.addr; if (!$('cN').value && s.name) $('cN').value = s.name } catch {}
  if (me && !$('cN').value) $('cN').value = me.name === me.email ? '' : me.name;
  payChg(); op('mCart');
}
function chg(id, d) { const c = cart.find(c => c.id === id); if (!c) return; c.qty += d; cart = cart.filter(c => c.qty > 0); saveCart(); updCart(); openCart() }

async function placeOrder() {
  if (!me) { cl('mCart'); toast('Please login or create an account to place an order.'); return openAuth() }
  if (!me.emailVerified) { try { await auth.currentUser.sendEmailVerification() } catch {} return toast('Please verify your email first. Verification link has been sent again.') }
  const name = $('cN').value.trim(), phone = $('cPh').value.trim(), city = $('cCity').value.trim(), addr = $('cA').value.trim(), pay = $('cPay').value, tid = $('cTid').value.trim();
  if (!name || !/^(\+92|0)?3\d{9}$/.test(phone.replace(/[\s-]/g, ''))) return toast('Please enter a valid name and phone number (03xx-xxxxxxx).');
  if (!city || !addr) return toast('Please enter your area and complete address in Karachi.');
  if (!/karachi/i.test(city)) return toast(DELIVERY_NOT_AVAILABLE_MSG);
  if (pay !== 'COD' && !tid) return toast('Please enter the Transaction ID.');
  const items = cartItems().map(c => ({name: c.p.name, price: pr(c.p), qty: c.qty}));
  if (!items.length) return toast('Your cart is empty.');
  const total = items.reduce((a, i) => a + i.price * i.qty, 0);
  const oid = 'UF' + Date.now().toString().slice(-6) + Math.floor(10 + Math.random() * 90);
  const btn = $('btnOrder'); btn.disabled = true; btn.textContent = 'Placing order...';
  try { await db.collection('orders').doc(oid).set({uid: me.uid, email: me.email, name, phone, city, addr, pay, tid: tid || '', items, total, status: 'New', created: FV.serverTimestamp()}) }
  catch (e) { return toast('Order could not be saved. Please try again.') }
  finally { btn.disabled = false; btn.textContent = 'Place Order' }
  try { localStorage.setItem('uf_ship', JSON.stringify({name, phone, addr})) } catch {}
  const text = items.map(i => `- ${i.name} x ${i.qty} = Rs.${i.price * i.qty}`).join('\n');
  if (CFG.EMAILJS.publicKey) {
    emailjs.send(CFG.EMAILJS.serviceId, CFG.EMAILJS.templateId, {to_email: CFG.NOTIFY_EMAIL, to_name: 'UF Store Admin', from_name: 'UF Store Website', order_id: oid, name, phone, email: me.email, address: `${addr}, ${city}`, items: text, total, payment: pay + (tid ? ' TID: ' + tid : '')})
      .catch(e => console.error('EmailJS failed:', e));
  }
  cart = []; saveCart(); render(); cl('mCart'); $('cA').value = ''; $('cTid').value = '';
  const msg = `New Order ${oid} - UF Store Karachi\nName: ${name}\nPhone: ${phone}\nAddress: ${addr}, ${city}\n\n${text}\n\nTotal: Rs.${total}\nPayment: ${pay}${tid ? ' (TID ' + tid + ')' : ''}`;
  window.open(`https://wa.me/${CFG.WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  toast(`Order ${oid} placed successfully! WhatsApp opened - just press Send.`);
}
async function openMyOrders() {
  op('mMy'); $('myL').innerHTML = '<p class="muted">Loading...</p>';
  try {
    const s = await db.collection('orders').where('uid', '==', me.uid).get();
    const list = s.docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => (b.created?.seconds || 0) - (a.created?.seconds || 0));
    $('myL').innerHTML = list.map(o => `<div class="row"><span><b>${esc(o.id)}</b> <small>${o.created ? o.created.toDate().toLocaleString() : ''}</small><br>${o.items.map(i => esc(i.name) + ' x' + i.qty).join(', ')}<br><b>Rs. ${fmt(o.total)}</b></span><span class="st">${esc(o.status)}</span></div>`).join('') || '<p class="muted">You have no orders yet.</p>';
  } catch (e) { $('myL').textContent = 'Orders could not be loaded.' }
}

/* Admin */
function openAdmin() { if (!isAdmin()) return; tab('p'); op('mAdmin') }
function tab(t) { $('tP').style.display = t === 'p' ? '' : 'none'; $('tO').style.display = t === 'o' ? '' : 'none'; $('tS').style.display = t === 's' ? '' : 'none'; t === 'p' ? listProducts() : t === 's' ? listPosts() : listOrders() }
function listProducts() {
  $('pL').innerHTML = products.map(p => `<div class="row"><span>${esc(p.name)} - Rs.${fmt(p.price)} <small>(${imgCount(p)} photos${p.imgs && p.imgs.length ? ', old format' : ''})</small> ${p.soldOut ? '<small>(Sold Out)</small>' : ''}${saleOn(p) ? `<small>(🔥 Sale Rs.${fmt(p.sale)})</small>` : ''}${p.video || p.vn ? '<small>(🎬 video)</small>' : ''}</span><span style="display:flex;gap:6px">
    <button class="btn s" style="width:auto" onclick="toggleSold('${p.id}',${!p.soldOut})">${p.soldOut ? 'In Stock' : 'Sold Out'}</button>
    <button class="btn s" style="width:auto" onclick="editProduct('${p.id}')">Edit</button>
    <button class="btn r" style="width:auto" onclick="delP('${p.id}')">Delete</button></span></div>`).join('');
}
const toggleSold = (id, v) => db.collection('products').doc(id).update({soldOut: v}).catch(() => toast('Permission denied.'));
async function delP(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    const pv0 = products.find(x => x.id === id); if (pv0 && pv0.vn) await delVid(id, pv0.vn);
    const s = await db.collection('products').doc(id).collection('photos').get();
    const b = db.batch(); s.docs.forEach(d => b.delete(d.ref)); await b.commit();
    await db.collection('products').doc(id).delete(); delete photoCache[id];
  } catch { toast('Permission denied.') }
}
const permMsg = e => e && e.code === 'permission-denied' ? 'Permission denied: login with the admin email, verify it, and publish Firestore rules for products and products/{id}/photos.' : '';
const toImg = f => new Promise(res => {
  const go = src => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src };
  if (typeof f === 'string') return go(f);
  const r = new FileReader(); r.onerror = () => res(null); r.onload = e => go(e.target.result); r.readAsDataURL(f);
});
async function shrink(f, max, q) {
  const im = await toImg(f); if (!im) return null;
  const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
  c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
  c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', q);
}
async function savePhotos(id, imgs) {
  const col = db.collection('products').doc(id).collection('photos'), old = await col.get(), ops = [];
  old.docs.forEach(d => ops.push(b => b.delete(d.ref)));
  imgs.forEach((d, i) => ops.push(b => b.set(col.doc(String(i).padStart(3, '0')), {i, d})));
  for (let i = 0; i < ops.length; i += 12) { const b = db.batch(); ops.slice(i, i + 12).forEach(f => f(b)); await b.commit() }
  delete photoCache[id];
}
async function addProduct() {
  const name = $('pN').value.trim(), price = +$('pPr').value, desc = $('pD').value.trim(), files = [...$('pI').files], vf = $('pVf').files[0];
  if (!name || !price) return toast('Product name and price are required.');
  if (!desc) return toast('Please write a full description for the customer.');
  const ex = readExtras('pV', 'pSl', 'pSe', price); if (ex.err) return toast(ex.err);
  const {video, sale, saleEnd} = ex;
  const vErr = vidCheck(vf); if (vErr) return toast(vErr);
  $('btnAdd').disabled = true; toast('Compressing photos, please wait...');
  try {
    const imgs = await shrinkAll(files);
    const thumb = imgs.length ? await shrink(imgs[0], 420, .6) : '';
    const ref = await db.collection('products').add({name, price, desc, video, sale, saleEnd, thumb: thumb || '', n: imgs.length, soldOut: false, created: FV.serverTimestamp()});
    if (imgs.length) { try { await savePhotos(ref.id, imgs) } catch (e) { await ref.delete().catch(() => {}); throw e } }
    let vmsg = '';
    if (vf) { try { await ref.update(await saveVideo(ref.id, vf)) } catch (e) { console.error(e); await delVid(ref.id, Math.ceil(vf.size * 1.37 / VCH) + 1).catch(() => {}); vmsg = e.code === 'permission-denied' ? ' Video was NOT saved: add the vchunks rule in Firestore.' : ' Video could not be uploaded.' } }
    ['pN', 'pPr', 'pD', 'pI', 'pV', 'pSl', 'pSe', 'pVf'].forEach(i => $(i).value = ''); toast(`Product added successfully (${imgs.length} photos${vf && !vmsg ? ' + video' : ''}).${vmsg}`);
  } catch (e) { toast(permMsg(e) || 'Product could not be added: ' + (e.code || e.message)) }
  $('btnAdd').disabled = false;
}
let editId = null, editImgs = [];
async function editProduct(id) {
  const p = products.find(x => x.id === id); if (!p) return;
  editId = id; editImgs = []; $('eN').value = p.name || ''; $('ePr').value = p.price || ''; $('eD').value = p.desc || ''; $('eI').value = ''; const live = p.sale && (!p.saleEnd || p.saleEnd > Date.now()); $('eV').value = p.video || ''; $('eVf').value = ''; $('eVdel').checked = false; $('eSl').value = live ? p.sale : ''; $('eSe').value = live ? toLocalInput(p.saleEnd) : '';
  $('eThumbs').innerHTML = '<p class="muted">Loading photos...</p>'; op('mEdit');
  if (p.imgs && p.imgs.length) editImgs = [...p.imgs];
  else if (photoCache[id]) editImgs = [...photoCache[id]];
  else if (imgCount(p) > 0) { try { const s = await db.collection('products').doc(id).collection('photos').orderBy('i').get(); editImgs = s.docs.map(d => d.data().d) } catch { editImgs = p.img ? [p.img] : [] } }
  if (editId === id) renderEditThumbs();
}
function renderEditThumbs() {
  $('eThumbs').innerHTML = editImgs.map((im, i) => `<div style="position:relative"><img src="${esc(im)}" alt="" style="width:70px;height:70px;object-fit:cover;border-radius:10px"><span onclick="editImgs.splice(${i},1);renderEditThumbs()" style="position:absolute;top:-6px;right:-6px;background:#c00;color:#fff;border-radius:50%;width:20px;height:20px;text-align:center;cursor:pointer;font-size:13px">x</span></div>`).join('') || '<p class="muted">No photos yet.</p>';
}
async function saveEdit() {
  if (!editId) return;
  const name = $('eN').value.trim(), price = +$('ePr').value, desc = $('eD').value.trim(), files = [...$('eI').files], vf = $('eVf').files[0];
  if (!name || !price) return toast('Product name and price are required.');
  if (!desc) return toast('Please write a full description.');
  const ex = readExtras('eV', 'eSl', 'eSe', price); if (ex.err) return toast(ex.err);
  const {video, sale, saleEnd} = ex;
  const vErr = vidCheck(vf); if (vErr) return toast(vErr);
  $('btnSaveEdit').disabled = true; toast('Saving changes...');
  try {
    const newImgs = await shrinkAll(files), all = [...editImgs, ...newImgs];
    const thumb = all.length ? await shrink(all[0], 420, .6) : '';
    await savePhotos(editId, all);
    const old = (products.find(x => x.id === editId) || {}).vn || 0; let vupd = {};
    if (vf) { const v = await saveVideo(editId, vf); if (old > v.vn) await delVid(editId, old, v.vn); vupd = v }
    else if ($('eVdel').checked && old) { await delVid(editId, old); vupd = {vn: 0, vt: ''} }
    delete vidCache[editId];
    await db.collection('products').doc(editId).update({name, price, desc, video, sale, saleEnd, thumb: thumb || '', n: all.length, imgs: FV.delete(), img: FV.delete(), ...vupd});
    toast('Product updated successfully.'); cl('mEdit');
  } catch (e) { toast(permMsg(e) || 'Update failed: ' + (e.code || e.message)) }
  $('btnSaveEdit').disabled = false;
}
/* One-time: move heavy photos of old products out of the main product document so the store loads fast */
async function migrate() {
  const old = products.filter(p => p.imgs && p.imgs.length);
  if (!old.length) return toast('All products are already optimized ✔');
  if (!confirm(old.length + ' old products will be optimized. Continue?')) return;
  toast('Optimizing... please wait'); let ok = 0;
  for (const p of old) {
    try {
      const thumb = await shrink(p.imgs[0], 420, .6);
      await savePhotos(p.id, p.imgs);
      await db.collection('products').doc(p.id).update({thumb: thumb || '', n: p.imgs.length, imgs: FV.delete(), img: FV.delete()}); ok++;
    } catch (e) { console.error(e) }
  }
  toast(`${ok}/${old.length} products optimized. Store is now faster!`);
}
function listOrders() {
  $('tO').innerHTML = adminOrders.map(o => `<div class="row" style="align-items:flex-start"><span><b>${esc(o.id)}</b> <small>${o.created ? o.created.toDate().toLocaleString() : ''}</small><br>${esc(o.name)} &bull; <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a> &bull; ${esc(o.email)}<br>${esc(o.addr)}, ${esc(o.city)}<br>${o.items.map(i => esc(i.name) + ' x' + i.qty).join(', ')}<br><b>Rs. ${fmt(o.total)}</b> &bull; ${esc(o.pay)} ${o.tid ? '(TID: ' + esc(o.tid) + ')' : ''}</span><select style="width:auto" onchange="setSt('${o.id}',this.value)">${['New', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></div>`).join('') || '<p class="muted">No orders yet.</p>';
}
const setSt = (id, s) => db.collection('orders').doc(id).update({status: s}).catch(() => toast('Permission denied.'));
/* Sale strip under the header */
let saleSig = '', saleKey = '';
function renderSale() {
  const list = products.filter(p => saleOn(p) && !p.soldOut).sort((a, b) => off(b) - off(a)), sec = $('saleSec');
  saleSig = products.filter(saleOn).map(p => p.id).join();
  $('navSale').style.display = list.length ? '' : 'none';
  if (!list.length) { sec.style.display = 'none'; saleKey = ''; return }
  sec.style.display = '';
  const key = list.map(p => [p.id, p.sale, p.price, p.name, thumbOf(p).length].join('|')).join('~');
  if (key !== saleKey) { /* rebuild only when something changed, so the strip does not jump while searching */
    saleKey = key;
    $('saleR').innerHTML = list.map(p => `<div class="sc" onclick="openProduct('${p.id}')"><span class="off">-${off(p)}%</span><div class="im">${thumbOf(p) ? `<img src="${esc(thumbOf(p))}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : '🛍️'}</div><div class="si"><h5>${esc(p.name)}</h5><div class="price">${priceHTML(p)}</div></div></div>`).join('');
  }
  tickSale();
}
function tickSale() {
  const ends = products.filter(p => saleOn(p) && !p.soldOut && p.saleEnd).map(p => p.saleEnd), cd = $('cd');
  if (!ends.length) { cd.style.display = 'none'; $('saleSub').textContent = 'Limited time deals'; return }
  const t = Math.max(0, Math.min(...ends) - Date.now()), d = Math.floor(t / 864e5);
  cd.style.display = ''; $('saleSub').textContent = 'Grab it before time runs out';
  $('cdD').style.display = d ? '' : 'none'; $('cdD').textContent = d + 'd';
  $('cdH').textContent = p2(Math.floor(t % 864e5 / 36e5)); $('cdM').textContent = p2(Math.floor(t % 36e5 / 6e4)); $('cdS').textContent = p2(Math.floor(t % 6e4 / 1e3));
}
const saleScroll = d => $('saleR').scrollBy({left: d * 360, behavior: 'smooth'});
setInterval(() => {
  if (!loaded) return;
  if (products.filter(saleOn).map(p => p.id).join() !== saleSig) render(); /* a sale just ended: refresh prices everywhere */
  else if ($('saleSec').style.display !== 'none') tickSale();
}, 1000);

/* Gallery video upload (stored in small pieces in Firestore, so no paid plan is needed) + unlimited photos */
const MAXVID = 15 * 1024 * 1024, VCH = 700000, vidCache = {}, vidBusy = {};
const vcId = (id, i) => id + '_' + String(i).padStart(3, '0');
const readB64 = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = () => rej(r.error); r.readAsDataURL(f) });
async function saveVideo(id, f) {
  const b64 = await readB64(f), n = Math.ceil(b64.length / VCH);
  for (let i = 0; i < n; i += 6) {
    const b = db.batch();
    for (let j = i; j < Math.min(n, i + 6); j++) b.set(db.collection('vchunks').doc(vcId(id, j)), {pid: id, i: j, d: b64.slice(j * VCH, (j + 1) * VCH)});
    await b.commit(); toast(`Uploading video... ${Math.min(100, Math.round((i + 6) / n * 100))}%`);
  }
  return {vn: n, vt: f.type || 'video/mp4'};
}
async function delVid(id, to, from = 0) {
  for (let i = from; i < to; i += 20) { const b = db.batch(); for (let j = i; j < Math.min(to, i + 20); j++) b.delete(db.collection('vchunks').doc(vcId(id, j))); await b.commit() }
}
async function loadVid(p) { /* video is fetched only when the customer taps the video thumbnail */
  if (vidBusy[p.id]) return; vidBusy[p.id] = 1;
  try {
    const docs = await Promise.all(Array.from({length: p.vn}, (_, i) => db.collection('vchunks').doc(vcId(p.id, i)).get()));
    const parts = docs.map(d => { const bin = atob(d.data().d), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u });
    vidCache[p.id] = URL.createObjectURL(new Blob(parts, {type: p.vt || 'video/mp4'}));
  } catch (e) { console.warn('Video could not be loaded', e) }
  vidBusy[p.id] = 0;
  if (curP && curP.id === p.id && curImg === -1) { if (vidCache[p.id]) showProduct(); else $('pdVid').innerHTML = '<div class="vload">Video could not be loaded. Please try again.</div>' }
}
async function shrinkAll(files) {
  const out = [];
  for (let i = 0; i < files.length; i++) { if (files.length > 3) toast(`Compressing photos ${i + 1}/${files.length}...`); const r = await shrink(files[i], 900, .7); if (r) out.push(r) }
  return out;
}
const vidCheck = f => f && (!/^video\//.test(f.type) ? 'Please choose a video file.' : f.size > MAXVID ? 'Video is too large (max 15 MB). Trim it or send it through WhatsApp/compress first, or paste a YouTube link instead.' : '');

/* Admin-only posts: pinned posts show first, right under the header */
let posts = [], postKey = '';
const postSort = (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.created?.seconds ?? 9e9) - (a.created?.seconds ?? 9e9);
db.collection('posts').orderBy('created', 'desc').limit(30).onSnapshot(s => {
  posts = s.docs.map(d => ({id: d.id, ...d.data()})).sort(postSort); renderPosts();
  if ($('mAdmin').classList.contains('on') && $('tS').style.display !== 'none') listPosts();
}, e => console.warn('Posts could not be loaded', e));
function renderPosts() {
  const sec = $('postSec'), list = posts.slice(0, 5);
  if (!list.length) { sec.style.display = 'none'; sec.innerHTML = ''; postKey = ''; return }
  sec.style.display = '';
  const key = list.map(p => [p.id, p.title, p.text, p.pinned, (p.img || '').length, p.video].join('|')).join('~');
  if (key === postKey) return; postKey = key;
  sec.innerHTML = list.map((p, i) => `<article class="post rv${p.pinned ? ' pin' : ''}" style="--d:${i * 80}ms">
    ${p.img ? `<div class="pimg"><img src="${esc(p.img)}" alt="${esc(p.title)}" decoding="async"></div>` : ''}
    <div class="pb"><span class="ptag">${p.pinned ? '📌 Pinned' : '📢 Update'}</span><h3>${esc(p.title)}</h3>
    ${p.text ? `<p>${esc(p.text)}</p>` : ''}
    ${vidInfo(p.video) ? `<div class="pv" id="pv_${p.id}"><button class="btn" onclick="playPost('${p.id}')">▶ Watch video</button></div>` : ''}
    <small class="muted">${p.created ? p.created.toDate().toLocaleDateString() : ''}</small></div></article>`).join('');
  reveal();
}
function playPost(id) { /* video loads only on click, so the store opens fast */
  const p = posts.find(x => x.id === id), v = p && vidInfo(p.video), el = $('pv_' + id); if (!v || !el) return;
  const h = vidHTML(v);
  el.innerHTML = v.t === 'file' ? h.replace('<video ', '<video autoplay ') : h.replace('playsinline=1', 'playsinline=1&amp;autoplay=1');
  el.classList.add('on');
}
function listPosts() {
  $('sL').innerHTML = posts.map(p => `<div class="row"><span>${p.pinned ? '📌 ' : ''}<b>${esc(p.title)}</b>${p.img ? ' <small>(photo)</small>' : ''}${p.video ? ' <small>(🎬 video)</small>' : ''}</span><span style="display:flex;gap:6px"><button class="btn s" style="width:auto" onclick="togglePin('${p.id}',${!p.pinned})">${p.pinned ? 'Unpin' : 'Pin to top'}</button><button class="btn r" style="width:auto" onclick="delPost('${p.id}')">Delete</button></span></div>`).join('') || '<p class="muted">No posts yet.</p>';
}
const postErr = e => e && e.code === 'permission-denied' ? 'Permission denied: publish the Firestore rule for the posts collection (admin-only write) and login with the verified admin email.' : '';
async function addPost() {
  if (!isAdmin()) return toast('Only the admin can post.');
  const title = $('sT').value.trim(), text = $('sX').value.trim(), video = $('sV').value.trim(), f = $('sI').files[0], pinned = $('sPin').checked;
  if (!title) return toast('Please write a post title.');
  if (video && !vidInfo(video)) return toast('Video link not supported. Use a YouTube, Facebook, Google Drive or direct .mp4 link (starting with https://).');
  $('btnPost').disabled = true; toast('Publishing post...');
  try {
    const img = f ? await shrink(f, 900, .7) : '';
    await db.collection('posts').add({title, text, video, img: img || '', pinned, created: FV.serverTimestamp()});
    ['sT', 'sX', 'sV', 'sI'].forEach(i => $(i).value = ''); toast(pinned ? 'Post published and pinned to the top.' : 'Post published.');
  } catch (e) { toast(postErr(e) || 'Post could not be published: ' + (e.code || e.message)) }
  $('btnPost').disabled = false;
}
const togglePin = (id, v) => db.collection('posts').doc(id).update({pinned: v}).catch(e => toast(postErr(e) || 'Could not update the post.'));
async function delPost(id) { if (!confirm('Delete this post?')) return; try { await db.collection('posts').doc(id).delete() } catch (e) { toast(postErr(e) || 'Could not delete the post.') } }

/* Scroll-reveal animation */
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), {threshold: .12, rootMargin: '0px 0px -40px 0px'}) : null;
function reveal() { document.querySelectorAll('.rv:not(.in)').forEach(el => io ? io.observe(el) : el.classList.add('in')) }
reveal();

/* Scroll progress bar, header shrink, back-to-top, hero parallax */
let raf = 0;
function onScroll() {
  const y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
  $('prog').style.width = (h > 0 ? y / h * 100 : 0) + '%';
  document.querySelector('header').classList.toggle('sm', y > 40);
  $('toTop').classList.toggle('on', y > 700);
  if (y < 900) $('hero').style.setProperty('--py', (y * .12) + 'px');
}
window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onScroll() }) }, {passive: true});
onScroll();
updCart();
