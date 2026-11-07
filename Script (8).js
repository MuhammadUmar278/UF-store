/* UF Store Pakistan - Professional Version */
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
const auth = firebase.auth(), db = firebase.firestore();
if (CFG.EMAILJS.publicKey) emailjs.init({publicKey: CFG.EMAILJS.publicKey});

const $ = id => document.getElementById(id);
const op = id => $(id).classList.add('on'), cl = id => $(id).classList.remove('on');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast = t => { const e = $('toast'); e.textContent = t; e.style.display = 'block'; setTimeout(() => e.style.display = 'none', 4000) };
let products = [], cart = JSON.parse(localStorage.getItem('uf_cart') || '[]'), me = null, signup = false, adminOrders = [], unsubAdmin = null;
const isAdmin = () => me && me.email === CFG.ADMIN_EMAIL.toLowerCase() && me.emailVerified;
$('yr').textContent = new Date().getFullYear();
const firstImg = p => (p.imgs && p.imgs[0]) || p.img || '';
const imgCount = p => (p.imgs && p.imgs.length) || (p.img ? 1 : 0);
const notifyAdmin = (title, body) => {
  // Browser notification for admin (if allowed)
  try { if (isAdmin() && 'Notification' in window && Notification.permission === 'granted') new Notification(title, {body}); } catch {}
  try { if (isAdmin()) { const a = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'); a.play().catch(()=>{}); } } catch {}
};

/* ---------- Products ---------- */
db.collection('products').orderBy('created', 'desc').limit(100).onSnapshot(s => {
  products = s.docs.map(d => ({id: d.id, ...d.data()})); render(); if ($('mAdmin').classList.contains('on')) listProducts();
}, e => { $('grid').innerHTML = '<p>Products could not be loaded. Please check your Firebase settings.</p>'; console.error(e) });

function render() {
  const q = $('q').value.toLowerCase();
  let list = products.filter(p => (p.name || '').toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q));
  const sort = $('sortSel') ? $('sortSel').value : 'new';
  if (sort === 'low') list = [...list].sort((a,b) => a.price - b.price);
  if (sort === 'high') list = [...list].sort((a,b) => b.price - a.price);
  $('pCount').textContent = list.length + ' products available';
  $('grid').innerHTML = list.map(p => {
    const fi = firstImg(p), n = imgCount(p);
    return `<div class="card">${p.soldOut ? '<span class="sold">Sold Out</span>' : ''}${n > 1 ? `<span class="pics">${n} Photos</span>` : ''}
    <div class="img" onclick="openProduct('${p.id}')" style="${fi ? `background-image:url(${fi})` : ''}">${fi ? '' : '⌚'}</div>
    <div class="in"><h4 onclick="openProduct('${p.id}')">${esc(p.name)}</h4><small>${esc((p.desc || '').slice(0, 80))}${(p.desc || '').length > 80 ? '...' : ''}</small>
    <div class="price">Rs. ${Number(p.price).toLocaleString()}</div>
    <button class="btn" onclick="openProduct('${p.id}')">View Details</button>
    <button class="btn s" style="margin-top:6px" ${p.soldOut ? 'disabled' : ''} onclick="addCart('${p.id}')">${p.soldOut ? 'Out of Stock' : 'Add to Cart'}</button></div></div>`
  }).join('') || '<p>No products found.</p>';
  $('cc').textContent = cart.reduce((a, c) => a + c.qty, 0);
}
let curP = null, curImg = 0;
function openProduct(id) { curP = products.find(x => x.id === id); if (!curP) return; curImg = 0; showProduct(); }
function showProduct() {
  const p = curP, imgs = (p.imgs && p.imgs.length ? p.imgs : (p.img ? [p.img] : []));
  $('pdImg').src = imgs[curImg] || ''; $('pdImg').style.display = imgs.length ? '' : 'none';
  $('pdThumbs').innerHTML = imgs.map((im,i) => `<img src="${im}" onclick="curImg=${i};showProduct()" style="width:64px;height:64px;object-fit:cover;border-radius:8px;cursor:pointer;border:${i===curImg?'2px solid #f85606':'1px solid #ddd'}">`).join('');
  $('pdName').textContent = p.name || ''; $('pdPrice').textContent = 'Rs. ' + Number(p.price).toLocaleString();
  $('pdDesc').textContent = p.desc || 'No description available for this product.';
  $('pdAdd').disabled = !!p.soldOut; $('pdAdd').textContent = p.soldOut ? 'Out of Stock' : 'Add to Cart';
  op('mProduct');
}

/* ---------- Auth ---------- */
auth.onAuthStateChanged(u => {
  me = u ? {uid: u.uid, email: (u.email || '').toLowerCase(), name: u.displayName || u.email, emailVerified: u.emailVerified} : null;
  $('bAuth').textContent = me ? 'Logout' : 'Login / Sign Up';
  $('bOrders').style.display = me ? '' : 'none';
  $('bAdmin').style.display = isAdmin() ? '' : 'none';
  if (unsubAdmin) { unsubAdmin(); unsubAdmin = null; }
  if (isAdmin()) {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(()=>{});
    unsubAdmin = db.collection('orders').orderBy('created', 'desc').limit(200).onSnapshot(s => {
      const before = adminOrders.length;
      adminOrders = s.docs.map(d => ({id: d.id, ...d.data()}));
      const n = adminOrders.filter(o => o.status === 'New').length;
      $('nc').textContent = n; const nc2 = $('nc2'); if (nc2) nc2.textContent = n;
      if (adminOrders.length > before && before > 0) { toast('New order received! Check Admin Panel.'); notifyAdmin('New Order - UF Store', 'A new order has arrived. Open Admin Panel to view it.'); }
      if ($('mAdmin').classList.contains('on')) listOrders();
    });
  }
});
function openAuth() { if (me) { auth.signOut(); return toast('You have been logged out.') } op('mAuth') }
function toggleAuth() { signup = !signup; $('aT').textContent = signup ? 'Create Your Account' : 'Welcome Back'; $('aN').style.display = signup ? '' : 'none'; $('aS').textContent = signup ? 'Already have an account? Login' : "Don't have an account? Create one"; }
const errMsg = c => ({'auth/configuration-not-found': 'Authentication is not enabled in Firebase. Please enable Email/Password in Firebase Authentication.', 'auth/email-already-in-use': 'This email is already registered. Please login instead.', 'auth/invalid-credential': 'Email or password is incorrect.', 'auth/wrong-password': 'Password is incorrect.', 'auth/user-not-found': 'Account not found.', 'auth/weak-password': 'Password is too weak (minimum 6 characters).', 'auth/invalid-email': 'Please enter a valid email address.', 'auth/too-many-requests': 'Too many attempts. Please try again after some time.', 'auth/unauthorized-domain': 'This domain is not allowed in Firebase. Please add this domain in Firebase > Authentication > Settings > Authorized domains.'}[c] || 'An error occurred: ' + c);
async function doAuth() {
  const email = $('aE').value.trim(), pass = $('aP').value, name = $('aN').value.trim();
  try {
    if (signup) {
      if (!name) return toast('Please enter your full name.');
      const c = await auth.createUserWithEmailAndPassword(email, pass);
      await c.user.updateProfile({displayName: name});
      try { await db.collection('users').doc(c.user.uid).set({name, email: email.toLowerCase(), created: firebase.firestore.FieldValue.serverTimestamp()}); } catch (e) { console.warn(e); }
      try { await c.user.sendEmailVerification(); } catch {}
      toast('Account created! A verification link has been sent to your email. Please check Inbox and Spam.');
    } else {
      const c = await auth.signInWithEmailAndPassword(email, pass);
      if (!c.user.emailVerified) { try { await c.user.sendEmailVerification(); } catch {} toast('Email is not verified. Verification link sent again. Please check Inbox and Spam.'); }
      else toast('Welcome back!');
    }
    cl('mAuth');
  } catch (e) { toast(errMsg(e.code)) }
}
async function resendVerify() {
  const email = $('aE').value.trim(), pass = $('aP').value;
  if (!email || !pass) return toast('Please enter your email and password first, then click this link.');
  try { const c = await auth.signInWithEmailAndPassword(email, pass); await c.user.sendEmailVerification(); toast('Verification link sent again. Please check Inbox and Spam.'); } catch (e) { toast(errMsg(e.code)) }
}
async function resetPass() {
  const email = $('aE').value.trim(); if (!email) return toast('Please enter your email first.');
  try { await auth.sendPasswordResetEmail(email); toast('Password reset link has been sent to your email.') } catch (e) { toast(errMsg(e.code)) }
}

/* ---------- Cart & Orders ---------- */
const saveCart = () => localStorage.setItem('uf_cart', JSON.stringify(cart));
function addCart(id) { const c = cart.find(c => c.id === id); c ? c.qty++ : cart.push({id, qty: 1}); saveCart(); render(); toast('Added to cart') }
function payChg() { const v = $('cPay').value; $('payBox').style.display = v === 'COD' ? 'none' : ''; $('payInfo').textContent = `Please send advance payment via ${v} to ${CFG.PAY_NUMBER} (${CFG.PAY_TITLE}) and enter the Transaction ID below.`; }
function openCart() {
  const items = cartItems(), total = items.reduce((a, c) => a + c.p.price * c.qty, 0);
  $('cartL').innerHTML = items.map(c => `<div class="row"><span>${esc(c.p.name)}<br><small>Rs. ${c.p.price} x ${c.qty}</small></span><span><button class="btn s" style="width:auto" onclick="chg('${c.id}',-1)">-</button> <button class="btn s" style="width:auto" onclick="chg('${c.id}',1)">+</button></span></div>`).join('') + (items.length ? `<h4 style="margin-top:10px">Total: Rs. ${total.toLocaleString()}</h4>` : '<p>Your cart is empty.</p>');
  $('co').style.display = items.length ? '' : 'none';
  if (me && !$('cN').value) $('cN').value = me.name === me.email ? '' : me.name;
  op('mCart');
}
const cartItems = () => cart.map(c => ({...c, p: products.find(p => p.id === c.id)})).filter(c => c.p && !c.p.soldOut);
function chg(id, d) { const c = cart.find(c => c.id === id); c.qty += d; cart = cart.filter(c => c.qty > 0); saveCart(); render(); openCart() }

async function placeOrder() {
  if (!me) { cl('mCart'); toast('Please login or create an account to place an order.'); return openAuth() }
  if (!me.emailVerified) { try { await auth.currentUser.sendEmailVerification() } catch {} return toast('Please verify your email first. Verification link has been sent again.'); }
  const name = $('cN').value.trim(), phone = $('cPh').value.trim(), city = $('cCity').value.trim(), addr = $('cA').value.trim(), pay = $('cPay').value, tid = $('cTid').value.trim();
  if (!name || !/^(\+92|0)?3\d{9}$/.test(phone.replace(/[\s-]/g, ''))) return toast('Please enter a valid name and phone number (03xx-xxxxxxx).');
  if (!city || !addr) return toast('Please enter your city and complete address.');
  if (pay !== 'COD' && !tid) return toast('Please enter the Transaction ID.');
  const items = cartItems().map(c => ({name: c.p.name, price: c.p.price, qty: c.qty}));
  if (!items.length) return toast('Your cart is empty.');
  const total = items.reduce((a, i) => a + i.price * i.qty, 0);
  const oid = 'UF' + Date.now().toString().slice(-7);
  $('btnOrder').disabled = true;
  try { await db.collection('orders').doc(oid).set({uid: me.uid, email: me.email, name, phone, city, addr, pay, tid: tid || '', items, total, status: 'New', created: firebase.firestore.FieldValue.serverTimestamp()}); }
  catch (e) { $('btnOrder').disabled = false; return toast('Order could not be saved. Please try again.') }
  $('btnOrder').disabled = false;
  const text = items.map(i => `- ${i.name} x ${i.qty} = Rs.${i.price * i.qty}`).join('\n');
  // --- EMAIL NOTIFICATION TO ADMIN (auto) ---
  if (CFG.EMAILJS.publicKey) {
    emailjs.send(CFG.EMAILJS.serviceId, CFG.EMAILJS.templateId, {to_email: CFG.NOTIFY_EMAIL, to_name: 'UF Store Admin', from_name: 'UF Store Website', order_id: oid, name, phone, email: me.email, address: `${addr}, ${city}`, items: text, total, payment: pay + (tid ? ' TID: ' + tid : '')})
    .then(() => console.log('Admin email sent'))
    .catch(e => { console.error('EmailJS failed:', e); toast('Order placed. Email notification failed - please check EmailJS template: To Email must be umerfaisal278@gmail.com and Gmail service must be connected.'); });
  }
  cart = []; saveCart(); render(); cl('mCart');
  const msg = `New Order ${oid} - UF Store\nName: ${name}\nPhone: ${phone}\nAddress: ${addr}, ${city}\n\n${text}\n\nTotal: Rs.${total}\nPayment: ${pay}${tid ? ' (TID ' + tid + ')' : ''}`;
  // --- WHATSAPP NOTIFICATION: auto-open, customer only presses Send ---
  window.open(`https://wa.me/${CFG.WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  toast(`Order ${oid} placed successfully! WhatsApp opened - just press Send. Admin has also been notified by email.`);
}
async function openMyOrders() {
  op('mMy'); $('myL').innerHTML = 'Loading...';
  try {
    const s = await db.collection('orders').where('uid', '==', me.uid).get();
    const list = s.docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => (b.created?.seconds || 0) - (a.created?.seconds || 0));
    $('myL').innerHTML = list.map(o => `<div class="row"><span><b>${o.id}</b> <small>${o.created ? o.created.toDate().toLocaleString() : ''}</small><br>${o.items.map(i => esc(i.name) + ' x' + i.qty).join(', ')}<br><b>Rs. ${o.total}</b></span><span class="st">${esc(o.status)}</span></div>`).join('') || '<p>You have no orders yet.</p>';
  } catch (e) { $('myL').textContent = 'Orders could not be loaded.' }
}

/* ---------- Admin ---------- */
function openAdmin() { if (!isAdmin()) return; tab('p'); op('mAdmin') }
function tab(t) { $('tP').style.display = t === 'p' ? '' : 'none'; $('tO').style.display = t === 'o' ? '' : 'none'; t === 'p' ? listProducts() : listOrders() }
function listProducts() {
  $('pL').innerHTML = products.map(p => `<div class="row"><span>${esc(p.name)} - Rs.${p.price} <small>(${imgCount(p)} photos)</small> ${p.soldOut ? '<small>(Sold Out)</small>' : ''}</span><span style="display:flex;gap:6px">
    <button class="btn s" style="width:auto" onclick="toggleSold('${p.id}',${!p.soldOut})">${p.soldOut ? 'In Stock' : 'Sold Out'}</button>
    <button class="btn s" style="width:auto" onclick="editProduct('${p.id}')">Edit</button>
    <button class="btn r" style="width:auto" onclick="delP('${p.id}')">Delete</button></span></div>`).join('');
}
const toggleSold = (id, v) => db.collection('products').doc(id).update({soldOut: v}).catch(() => toast('Permission denied.'));
function delP(id) { if (confirm('Are you sure you want to delete this product?')) db.collection('products').doc(id).delete().catch(() => toast('Permission denied.')) }

/* --- Add Product: up to 8 photos --- */
const compressOne = f => new Promise(res => {
  const r = new FileReader();
  r.onload = e => { const im = new Image(); im.onload = () => { const s = Math.min(1, 800 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .68)); }; im.src = e.target.result; };
  r.readAsDataURL(f);
});
async function addProduct() {
  const name = $('pN').value.trim(), price = +$('pPr').value, desc = $('pD').value.trim(), files = [...$('pI').files].slice(0, 8);
  if (!name || !price) return toast('Product name and price are required.');
  if (!desc) return toast('Please write a full description for the customer.');
  if (files.length > 8) return toast('Maximum 8 photos allowed.');
  $('btnAdd').disabled = true; toast('Compressing photos, please wait...');
  const imgs = await Promise.all(files.map(compressOne));
  try { await db.collection('products').add({name, price, desc, imgs, img: imgs[0] || '', soldOut: false, created: firebase.firestore.FieldValue.serverTimestamp()}); ['pN','pPr','pD','pI'].forEach(i => $(i).value = ''); toast(`Product added successfully (${imgs.length} photos).`); }
  catch (e) { toast('Product could not be added: ' + e.code) }
  $('btnAdd').disabled = false;
}

/* --- Edit Product: price / description / photos --- */
let editId = null, editImgs = [];
function editProduct(id) {
  const p = products.find(x => x.id === id); if (!p) return;
  editId = id; editImgs = [...(p.imgs && p.imgs.length ? p.imgs : (p.img ? [p.img] : []))];
  $('eN').value = p.name || ''; $('ePr').value = p.price || ''; $('eD').value = p.desc || ''; $('eI').value = '';
  renderEditThumbs(); op('mEdit');
}
function renderEditThumbs() {
  $('eThumbs').innerHTML = editImgs.map((im,i) => `<div style="position:relative"><img src="${im}" style="width:70px;height:70px;object-fit:cover;border-radius:8px"><span onclick="editImgs.splice(${i},1);renderEditThumbs()" style="position:absolute;top:-6px;right:-6px;background:#c00;color:#fff;border-radius:50%;width:20px;height:20px;text-align:center;cursor:pointer;font-size:13px">x</span></div>`).join('') || '<p class="muted">No photos yet.</p>';
}
async function saveEdit() {
  if (!editId) return;
  const name = $('eN').value.trim(), price = +$('ePr').value, desc = $('eD').value.trim(), files = [...$('eI').files];
  if (!name || !price) return toast('Product name and price are required.');
  if (!desc) return toast('Please write a full description.');
  if (editImgs.length + files.length > 8) return toast('Maximum 8 photos allowed in total.');
  $('btnSaveEdit').disabled = true; toast('Saving changes...');
  const newImgs = await Promise.all(files.map(compressOne));
  const all = [...editImgs, ...newImgs];
  try { await db.collection('products').doc(editId).update({name, price, desc, imgs: all, img: all[0] || ''}); toast('Product updated successfully.'); cl('mEdit'); }
  catch (e) { toast('Update failed: ' + e.code) }
  $('btnSaveEdit').disabled = false;
}

function listOrders() {
  $('tO').innerHTML = adminOrders.map(o => `<div class="row" style="align-items:flex-start"><span><b>${o.id}</b> <small>${o.created ? o.created.toDate().toLocaleString() : ''}</small><br>${esc(o.name)} &bull; <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a> &bull; ${esc(o.email)}<br>${esc(o.addr)}, ${esc(o.city)}<br>${o.items.map(i => esc(i.name) + ' x' + i.qty).join(', ')}<br><b>Rs. ${o.total}</b> &bull; ${esc(o.pay)} ${o.tid ? '(TID: ' + esc(o.tid) + ')' : ''}</span><select style="width:auto" onchange="setSt('${o.id}',this.value)">${['New','Confirmed','Shipped','Delivered','Cancelled'].map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></div>`).join('') || '<p>No orders yet.</p>';
}
const setSt = (id, s) => db.collection('orders').doc(id).update({status: s}).catch(() => toast('Permission denied.'));
render();
