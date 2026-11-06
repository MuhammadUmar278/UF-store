# UF Store — Setup Guide (sab free)

## 1. Firebase project banayein
1. https://console.firebase.google.com par Google account se login karein.
2. **Add project** > naam `uf-watches` > Analytics off kar sakte hain > Create.
3. Left menu **Build > Authentication > Get started > Email/Password** enable karein.
4. **Build > Firestore Database > Create database** > location `asia-south1` (ya nearest) > **Production mode**.
5. Firestore ke **Rules** tab mein `firestore.rules` ka poora text paste karein.
   Us mein `your-email@gmail.com` ki jagah apna email likhein (chhote letters), phir **Publish**.
6. **Project settings (gear icon) > Your apps > Web (`</>`)** > app register karein.
   Jo `firebaseConfig` mile, uski values `script.js` ke `CFG.firebase` mein paste karein.

## 2. script.js ki settings (file ke sab se upar CFG)
- `ADMIN_EMAIL`: wohi email jo rules mein likhi.
- `WHATSAPP`, `PAY_NUMBER`, `PAY_TITLE`: apni details.

## 3. Admin banayein
1. Website par **Sign Up** karein usi `ADMIN_EMAIL` se.
2. Email mein verification link aayega — click karein (zaroori hai).
3. Dobara login karein: header mein **Admin** button aa jayega.

## 4. Email notification (optional, free: 200 emails/month)
1. https://www.emailjs.com par account banayein.
2. **Email Services** mein Gmail connect karein (Service ID milegi).
3. **Email Templates** mein naya template banayein. To: apni email. Subject: `New Order {{order_id}}`.
   Body mein ye variables use karein: `{{order_id}} {{name}} {{phone}} {{email}} {{address}} {{items}} {{total}} {{payment}}`.
4. **Account** page se Public Key lein.
5. `script.js` ke `CFG.EMAILJS` mein publicKey, serviceId, templateId bharein.

## 5. Website online karein (free hosting)
Sab se aasan: **Netlify** (https://app.netlify.com/drop) — `uf-watches` folder (index.html, style.css, script.js, sab files ke saath) drag & drop kar dein.
Ya Firebase Hosting / Vercel / Cloudflare Pages.

Firebase Console > Authentication > **Settings > Authorized domains** mein apna naya domain add karein
(warna login us domain par kaam nahi karega).

## 6. Domain connect karein
Domain khareedne ke baad (Namecheap / GoDaddy / PKNIC `.pk`):
- Netlify > Domain management > **Add custom domain** > jo DNS records bataye, domain provider ke DNS panel mein daal dein.
- HTTPS (SSL) Netlify khud laga deta hai.

## Test checklist (domain khareedne se pehle)
- [ ] Naya customer account banao + email verify
- [ ] Admin se product add karo (photo ke saath)
- [ ] Doosre phone/browser se product nazar aaye
- [ ] Customer se order karo: admin panel mein order aaye
- [ ] Email aur WhatsApp message aaye
- [ ] Customer "My Orders" mein status dekhe
