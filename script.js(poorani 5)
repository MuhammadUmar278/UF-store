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
const op = id => { $(id).classList.add('on'); syncLock() }, cl = id => { $(id).classList.remove('on'); syncLock() };
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
  const fi = thumbOf(p), n = imgCount(p);
  return `<article class="card" style="animation-delay:${Math.min(i, 12) * 30}ms">${p.soldOut ? '<span class="sold">Sold Out</span>' : ''}${n > 1 ? `<span class="pics">📷 ${n}</span>` : ''}
  <div class="img" onclick="openProduct('${p.id}')">${fi ? `<img src="${esc(fi)}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : '🛍️'}</div>
  <div class="in"><h4 onclick="openProduct('${p.id}')">${esc(p.name)}</h4><small>${esc((p.desc || '').slice(0, 70))}${(p.desc || '').length > 70 ? '...' : ''}</small>
  <div class="price">Rs. ${fmt(p.price)}</div>
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
  if (sort === 'low') list = [...list].sort((a, b) => a.price - b.price);
  if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price);
  $('pCount').textContent = list.length + (list.length === 1 ? ' product' : ' products') + ' available';
  $('grid').innerHTML = list.slice(0, shown).map(card).join('') +
    (list.length > shown ? '<button class="btn s more" onclick="shown+=24;render()">Show more</button>' : '') ||
    `<div class="empty"><b>🔍</b>${products.length ? 'No products match your search.' : 'No products yet. Please check back soon!'}</div>`;
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
  const p = curP, imgs = curImgs;
  $('pdImg').src = imgs[curImg] || ''; $('pdImg').style.display = imgs.length ? '' : 'none'; $('pdImg').alt = p.name || '';
  $('pdThumbs').innerHTML = imgs.length > 1 ? imgs.map((im, i) => `<img src="${esc(im)}" class="${i === curImg ? 'on' : ''}" alt="" onclick="curImg=${i};showProduct()">`).join('') : '';
  $('pdName').textContent = p.name || ''; $('pdPrice').textContent = 'Rs. ' + fmt(p.price);
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
}
function payChg() { const v = $('cPay').value; $('payBox').style.display = v === 'COD' ? 'none' : ''; $('payInfo').textContent = `Please send advance payment via ${v} to ${CFG.PAY_NUMBER} (${CFG.PAY_TITLE}) and enter the Transaction ID below.` }
function openCart() {
  const items = cartItems(), total = items.reduce((a, c) => a + c.p.price * c.qty, 0);
  $('cartL').innerHTML = items.map(c => `<div class="row">${thumbOf(c.p) ? `<img class="ci" src="${esc(thumbOf(c.p))}" alt="">` : ''}<span style="flex:1"><b>${esc(c.p.name)}</b><br><small class="muted">Rs. ${fmt(c.p.price)} x ${c.qty} = Rs. ${fmt(c.p.price * c.qty)}</small></span><span class="qty"><button onclick="chg('${c.id}',-1)">−</button><b>${c.qty}</b><button onclick="chg('${c.id}',1)">+</button></span></div>`).join('') + (items.length ? `<h4 style="margin:12px 0 0">Total: Rs. ${fmt(total)}</h4>` : '<p class="muted" style="text-align:center;padding:30px 0">Your cart is empty.</p>');
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
  const items = cartItems().map(c => ({name: c.p.name, price: c.p.price, qty: c.qty}));
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
function tab(t) { $('tP').style.display = t === 'p' ? '' : 'none'; $('tO').style.display = t === 'o' ? '' : 'none'; t === 'p' ? listProducts() : listOrders() }
function listProducts() {
  $('pL').innerHTML = products.map(p => `<div class="row"><span>${esc(p.name)} - Rs.${fmt(p.price)} <small>(${imgCount(p)} photos${p.imgs && p.imgs.length ? ', old format' : ''})</small> ${p.soldOut ? '<small>(Sold Out)</small>' : ''}</span><span style="display:flex;gap:6px">
    <button class="btn s" style="width:auto" onclick="toggleSold('${p.id}',${!p.soldOut})">${p.soldOut ? 'In Stock' : 'Sold Out'}</button>
    <button class="btn s" style="width:auto" onclick="editProduct('${p.id}')">Edit</button>
    <button class="btn r" style="width:auto" onclick="delP('${p.id}')">Delete</button></span></div>`).join('');
}
const toggleSold = (id, v) => db.collection('products').doc(id).update({soldOut: v}).catch(() => toast('Permission denied.'));
async function delP(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
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
  const col = db.collection('products').doc(id).collection('photos'), old = await col.get(), b = db.batch();
  old.docs.forEach(d => b.delete(d.ref));
  imgs.forEach((d, i) => b.set(col.doc(String(i).padStart(2, '0')), {i, d}));
  await b.commit(); delete photoCache[id];
}
async function addProduct() {
  const name = $('pN').value.trim(), price = +$('pPr').value, desc = $('pD').value.trim(), files = [...$('pI').files].slice(0, 8);
  if (!name || !price) return toast('Product name and price are required.');
  if (!desc) return toast('Please write a full description for the customer.');
  $('btnAdd').disabled = true; toast('Compressing photos, please wait...');
  try {
    const imgs = (await Promise.all(files.map(f => shrink(f, 900, .7)))).filter(Boolean);
    const thumb = imgs.length ? await shrink(imgs[0], 420, .6) : '';
    const ref = await db.collection('products').add({name, price, desc, thumb: thumb || '', n: imgs.length, soldOut: false, created: FV.serverTimestamp()});
    if (imgs.length) { try { await savePhotos(ref.id, imgs) } catch (e) { await ref.delete().catch(() => {}); throw e } }
    ['pN', 'pPr', 'pD', 'pI'].forEach(i => $(i).value = ''); toast(`Product added successfully (${imgs.length} photos).`);
  } catch (e) { toast(permMsg(e) || 'Product could not be added: ' + (e.code || e.message)) }
  $('btnAdd').disabled = false;
}
let editId = null, editImgs = [];
async function editProduct(id) {
  const p = products.find(x => x.id === id); if (!p) return;
  editId = id; editImgs = []; $('eN').value = p.name || ''; $('ePr').value = p.price || ''; $('eD').value = p.desc || ''; $('eI').value = '';
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
  const name = $('eN').value.trim(), price = +$('ePr').value, desc = $('eD').value.trim(), files = [...$('eI').files];
  if (!name || !price) return toast('Product name and price are required.');
  if (!desc) return toast('Please write a full description.');
  if (editImgs.length + files.length > 8) return toast('Maximum 8 photos allowed in total.');
  $('btnSaveEdit').disabled = true; toast('Saving changes...');
  try {
    const newImgs = (await Promise.all(files.map(f => shrink(f, 900, .7)))).filter(Boolean), all = [...editImgs, ...newImgs];
    const thumb = all.length ? await shrink(all[0], 420, .6) : '';
    await savePhotos(editId, all);
    await db.collection('products').doc(editId).update({name, price, desc, thumb: thumb || '', n: all.length, imgs: FV.delete(), img: FV.delete()});
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
updCart();
