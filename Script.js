/* ============ SETTINGS — SETUP.md ke mutabiq bharein ============ */
const CFG = {
  firebase: {                     // Firebase console > Project settings > Your apps > Web app
    apiKey: "AIzaSyCs6xqlLRfwdcCjiX4gY_3NhdbtZXFLtSI",
    authDomain: "uf-store-d36c3.firebaseapp.com",
    projectId: "uf-store-d36c3",
    storageBucket: "uf-store-d36c3.firebasestorage.app",
    messagingSenderId: "85123845058",
    appId: "1:85123845058:web:3f256b273e2e6a63be645b"
  },
  ADMIN_EMAIL: "umerfaisal278@gmail.com",   // jis email se admin banoge (firestore.rules mein bhi same likhna)
  WHATSAPP: "923001234567",              // 92 se shuru, bina +
  PAY_NUMBER: "03001234567",             // Easypaisa / JazzCash number
  PAY_TITLE: "Account title",
  EMAILJS: { publicKey: "", serviceId: "", templateId: "" }  // optional, khali chhorain to email skip
};
/* ================================================================ */

firebase.initializeApp(CFG.firebase);
const auth = firebase.auth(), db = firebase.firestore();
if (CFG.EMAILJS.publicKey) emailjs.init({publicKey: CFG.EMAILJS.publicKey});

const $ = id => document.getElementById(id);
const op = id => $(id).classList.add('on'), cl = id => $(id).classList.remove('on');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast = t => { const e = $('toast'); e.textContent = t; e.style.display = 'block'; setTimeout(() => e.style.display = 'none', 3200) };
let products = [], cart = JSON.parse(localStorage.getItem('uf_cart') || '[]'), me = null, signup = false, adminOrders = [], unsubAdmin = null;
const isAdmin = () => me && me.email === CFG.ADMIN_EMAIL.toLowerCase() && me.emailVerified;
$('yr').textContent = new Date().getFullYear();

/* ---------- Products (live, shared) ---------- */
db.collection('products').orderBy('created', 'desc').onSnapshot(s => {
  products = s.docs.map(d => ({id: d.id, ...d.data()})); render(); if ($('mAdmin').classList.contains('on')) listProducts();
}, e => { $('grid').innerHTML = '<p>Products load nahi hue. Firebase settings check karein.</p>'; console.error(e) });

function render() {
  const q = $('q').value.toLowerCase();
  $('grid').innerHTML = products.filter(p => (p.name || '').toLowerCase().includes(q)).map(p => `
    <div class="card">${p.soldOut ? '<span class="sold">Sold out</span>' : ''}
    <div class="img" style="${p.img ? `background-image:url(${p.img})` : ''}">${p.img ? '' : '⌚'}</div>
    <div class="in"><h4>${esc(p.name)}</h4><small>${esc(p.desc)}</small>
    <div class="price">Rs. ${Number(p.price).toLocaleString()}</div>
    <button class="btn" ${p.soldOut ? 'disabled' : ''} onclick="addCart('${p.id}')">${p.soldOut ? 'Out of stock' : 'Add to Cart'}</button></div></div>`).join('') || '<p>Koi product nahi mila.</p>';
  $('cc').textContent = cart.reduce((a, c) => a + c.qty, 0);
}

/* ---------- Auth ---------- */
auth.onAuthStateChanged(u => {
  me = u ? {uid: u.uid, email: (u.email || '').toLowerCase(), name: u.displayName || u.email, emailVerified: u.emailVerified} : null;
  $('bAuth').textContent = me ? 'Logout' : 'Login / Sign Up';
  $('bOrders').style.display = me ? '' : 'none';
  $('bAdmin').style.display = isAdmin() ? '' : 'none';
  if (unsubAdmin) { unsubAdmin(); unsubAdmin = null }
  if (isAdmin()) unsubAdmin = db.collection('orders').orderBy('created', 'desc').limit(200).onSnapshot(s => {
    adminOrders = s.docs.map(d => ({id: d.id, ...d.data()}));
    $('nc').textContent = adminOrders.filter(o => o.status === 'New').length;
    if ($('mAdmin').classList.contains('on')) listOrders();
  });
});
function openAuth() { if (me) { auth.signOut(); return toast('Logout ho gaye') } op('mAuth') }
function toggleAuth() {
  signup = !signup;
  $('aT').textContent = signup ? 'Create Account' : 'Login';
  $('aN').style.display = signup ? '' : 'none';
  $('aS').textContent = signup ? 'Pehle se account hai? Login' : 'Account nahi hai? Sign Up';
}
const errMsg = c => ({'auth/configuration-not-found': 'Firebase me Authentication ON nahi hai - Build > Authentication > Get started > Email/Password Enable karein', 'auth/email-already-in-use': 'Ye email pehle se registered hai', 'auth/invalid-credential': 'Email ya password ghalat hai',
  'auth/wrong-password': 'Password ghalat hai', 'auth/user-not-found': 'Account nahi mila', 'auth/weak-password': 'Password kamzor hai (min 6)',
  'auth/invalid-email': 'Email sahi nahi', 'auth/too-many-requests': 'Bohat koshishein, thori der baad try karein'}[c] || 'Masla aaya: ' + c);
async function doAuth() {
  const email = $('aE').value.trim(), pass = $('aP').value, name = $('aN').value.trim();
  try {
    if (signup) {
      if (!name) return toast('Naam likhein');
      const c = await auth.createUserWithEmailAndPassword(email, pass);
      await c.user.updateProfile({displayName: name});
      try { await db.collection('users').doc(c.user.uid).set({name, email: email.toLowerCase(), created: firebase.firestore.FieldValue.serverTimestamp()}); } catch (e) { console.warn('users save failed (Rules check karein):', e); }
      try { await c.user.sendEmailVerification(); } catch (e) { console.warn('verification email failed:', e); }
      toast('Account ban gaya! Email verify karne ka link bhej diya gaya hai (spam bhi check karein).');
    } else {
      const c = await auth.signInWithEmailAndPassword(email, pass);
      if (!c.user.emailVerified) { try { await c.user.sendEmailVerification(); } catch {} toast('Email verify nahi hai - verification link dobara bhej diya hai, Gmail + Spam check karein.'); }
      else toast('Welcome!');
    }
    cl('mAuth');
  } catch (e) { toast(errMsg(e.code)) }
}
async function resendVerify() {
  const email = $('aE').value.trim(), pass = $('aP').value;
  if (!email || !pass) return toast('Pehle email aur password likhein, phir ye dabayein');
  try { const c = await auth.signInWithEmailAndPassword(email, pass); await c.user.sendEmailVerification(); toast('Verification link dobara bhej diya - Gmail + Spam check karein'); } catch (e) { toast(errMsg(e.code)) }
}
async function resetPass() {
  const email = $('aE').value.trim(); if (!email) return toast('Pehle email likhein');
  try { await auth.sendPasswordResetEmail(email); toast('Password reset link email par bhej diya') } catch (e) { toast(errMsg(e.code)) }
}

/* ---------- Cart & Orders ---------- */
const saveCart = () => localStorage.setItem('uf_cart', JSON.stringify(cart));
function addCart(id) { const c = cart.find(c => c.id === id); c ? c.qty++ : cart.push({id, qty: 1}); saveCart(); render(); toast('Cart mein add ho gaya') }
function payChg() {
  const v = $('cPay').value; $('payBox').style.display = v === 'COD' ? 'none' : '';
  $('payInfo').textContent = `${v} par advance bhejein: ${CFG.PAY_NUMBER} (${CFG.PAY_TITLE}) aur neeche Transaction ID likhein.`;
}
function openCart() {
  const items = cartItems(), total = items.reduce((a, c) => a + c.p.price * c.qty, 0);
  $('cartL').innerHTML = items.map(c => `<div class="row"><span>${esc(c.p.name)}<br><small>Rs. ${c.p.price} × ${c.qty}</small></span>
    <span><button class="btn s" style="width:auto" onclick="chg('${c.id}',-1)">−</button> <button class="btn s" style="width:auto" onclick="chg('${c.id}',1)">+</button></span></div>`).join('')
    + (items.length ? `<h4 style="margin-top:10px">Total: Rs. ${total.toLocaleString()}</h4>` : '<p>Cart khali hai.</p>');
  $('co').style.display = items.length ? '' : 'none';
  if (me && !$('cN').value) $('cN').value = me.name === me.email ? '' : me.name;
  op('mCart');
}
const cartItems = () => cart.map(c => ({...c, p: products.find(p => p.id === c.id)})).filter(c => c.p && !c.p.soldOut);
function chg(id, d) { const c = cart.find(c => c.id === id); c.qty += d; cart = cart.filter(c => c.qty > 0); saveCart(); render(); openCart() }

async function placeOrder() {
  if (!me) { cl('mCart'); toast('Order ke liye pehle account banayein / login karein'); return openAuth() }
  if (!me.emailVerified) {
    try { await auth.currentUser.sendEmailVerification() } catch {}
    return toast('Pehle apna email verify karein (link aap ko bhej diya hai), phir order karein.');
  }
  const name = $('cN').value.trim(), phone = $('cPh').value.trim(), city = $('cCity').value.trim(), addr = $('cA').value.trim(), pay = $('cPay').value, tid = $('cTid').value.trim();
  if (!name || !/^(\+92|0)?3\d{9}$/.test(phone.replace(/[\s-]/g, ''))) return toast('Sahi naam aur phone number likhein (03xx...)');
  if (!city || !addr) return toast('City aur address likhein');
  if (pay !== 'COD' && !tid) return toast('Transaction ID likhein');
  const items = cartItems().map(c => ({name: c.p.name, price: c.p.price, qty: c.qty}));
  if (!items.length) return toast('Cart khali hai');
  const total = items.reduce((a, i) => a + i.price * i.qty, 0);
  const oid = 'UF' + Date.now().toString().slice(-7);
  $('btnOrder').disabled = true;
  try {
    await db.collection('orders').doc(oid).set({uid: me.uid, email: me.email, name, phone, city, addr, pay, tid: tid || '', items, total, status: 'New', created: firebase.firestore.FieldValue.serverTimestamp()});
  } catch (e) { $('btnOrder').disabled = false; return toast('Order save nahi hua, dobara try karein') }
  $('btnOrder').disabled = false;
  const text = items.map(i => `• ${i.name} × ${i.qty} = Rs.${i.price * i.qty}`).join('\n');
  if (CFG.EMAILJS.publicKey) emailjs.send(CFG.EMAILJS.serviceId, CFG.EMAILJS.templateId, {order_id: oid, name, phone, email: me.email, address: `${addr}, ${city}`, items: text, total, payment: pay + (tid ? ' TID: ' + tid : '')}).catch(console.error);
  cart = []; saveCart(); render(); cl('mCart');
  const msg = `🛒 New Order ${oid} — UF Store\nName: ${name}\nPhone: ${phone}\nAddress: ${addr}, ${city}\n\n${text}\n\nTotal: Rs.${total}\nPayment: ${pay}${tid ? ' (TID ' + tid + ')' : ''}`;
  if (confirm(`Order ${oid} place ho gaya ✅\n\nTezi se confirm karwane ke liye WhatsApp par bhejna chahenge?`)) window.open(`https://wa.me/${CFG.WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
}
async function openMyOrders() {
  op('mMy'); $('myL').innerHTML = 'Loading...';
  try {
    const s = await db.collection('orders').where('uid', '==', me.uid).get();
    const list = s.docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => (b.created?.seconds || 0) - (a.created?.seconds || 0));
    $('myL').innerHTML = list.map(o => `<div class="row"><span><b>${o.id}</b> <small>${o.created ? o.created.toDate().toLocaleString() : ''}</small><br>
      ${o.items.map(i => esc(i.name) + ' ×' + i.qty).join(', ')}<br><b>Rs. ${o.total}</b></span><span class="st">${esc(o.status)}</span></div>`).join('') || '<p>Abhi koi order nahi.</p>';
  } catch (e) { $('myL').textContent = 'Orders load nahi hue.' }
}

/* ---------- Admin ---------- */
function openAdmin() { if (!isAdmin()) return; tab('p'); op('mAdmin') }
function tab(t) { $('tP').style.display = t === 'p' ? '' : 'none'; $('tO').style.display = t === 'o' ? '' : 'none'; t === 'p' ? listProducts() : listOrders() }
function listProducts() {
  $('pL').innerHTML = products.map(p => `<div class="row"><span>${esc(p.name)} — Rs.${p.price} ${p.soldOut ? '<small>(sold out)</small>' : ''}</span><span>
    <button class="btn s" style="width:auto" onclick="toggleSold('${p.id}',${!p.soldOut})">${p.soldOut ? 'In stock' : 'Sold out'}</button>
    <button class="btn r" style="width:auto" onclick="delP('${p.id}')">Delete</button></span></div>`).join('');
}
const toggleSold = (id, v) => db.collection('products').doc(id).update({soldOut: v}).catch(() => toast('Permission denied'));
function delP(id) { if (confirm('Delete karein?')) db.collection('products').doc(id).delete().catch(() => toast('Permission denied')) }
function addProduct() {
  const name = $('pN').value.trim(), price = +$('pPr').value, desc = $('pD').value.trim(), f = $('pI').files[0];
  if (!name || !price) return toast('Naam aur price zaroori hai');
  const save = async img => {
    try {
      await db.collection('products').add({name, price, desc, img, soldOut: false, created: firebase.firestore.FieldValue.serverTimestamp()});
      ['pN', 'pPr', 'pD', 'pI'].forEach(i => $(i).value = ''); toast('Product add ho gayi ✅');
    } catch (e) { toast('Add nahi hui: ' + e.code) }
    $('btnAdd').disabled = false;
  };
  $('btnAdd').disabled = true;
  if (!f) return save('');
  const r = new FileReader();
  r.onload = e => {
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, 500 / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      save(c.toDataURL('image/jpeg', .72));
    };
    im.src = e.target.result;
  };
  r.readAsDataURL(f);
}
function listOrders() {
  $('tO').innerHTML = adminOrders.map(o => `<div class="row" style="align-items:flex-start"><span><b>${o.id}</b> <small>${o.created ? o.created.toDate().toLocaleString() : ''}</small><br>
    ${esc(o.name)} • <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a> • ${esc(o.email)}<br>${esc(o.addr)}, ${esc(o.city)}<br>
    ${o.items.map(i => esc(i.name) + ' ×' + i.qty).join(', ')}<br><b>Rs. ${o.total}</b> • ${esc(o.pay)} ${o.tid ? '(TID: ' + esc(o.tid) + ')' : ''}</span>
    <select style="width:auto" onchange="setSt('${o.id}',this.value)">${['New', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></div>`).join('') || '<p>Abhi koi order nahi.</p>';
}
const setSt = (id, s) => db.collection('orders').doc(id).update({status: s}).catch(() => toast('Permission denied'));
render();
