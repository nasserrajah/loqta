# دليل نشر متجر لُقطة — Deploy Guide

دليل خطوة بخطوة لنشر الموقع بالكامل: **الواجهة على Vercel** + **الـ API على Render** + **البريد عبر Resend**.
تنبيه: لا تشارك أي مفاتيح (API Keys) في المحادثات أو المستودع — تُضبط فقط في لوحات التحكم.

---

## الخطوة 1 — نشر الواجهة الأمامية على Vercel ✅ (تمت)

النطاق الحالي: **https://loqta-store-virid.vercel.app/**

ما هو منجز تلقائيًا مع المستودع:
- ملف `frontend_loqta/vercel.json` يعيد توجيه أي مسار داخلي إلى `index.html` (بدونه الروابط مثل `/products` ورابط إعادة تعيين كلمة المرور من الإيميل ترجع 404 — Vercel لا يقرأ ملف `_redirects` الخاص بـ Cloudflare).
- وسوم المشاركة (`og:image` وغيرها) مضبوطة على النطاق أعلاه. إذا غيّرت النطاق لاحقًا (دومين مخصص) حدّث `og:url` و`og:image` في `frontend_loqta/index.html`.

خطوات لو احتجت إعادة النشر أو نشر نسخة جديدة:
1. [vercel.com](https://vercel.com) → **Add New → Project** → استورد `nasserrajah/loqta`.
2. **Root Directory:** `frontend_loqta` — إطار العمل يُكتشف تلقائيًا (Vite).
3. في **Environment Variables** أضف (اختياري — يوجد افتراضي صحيح في الكود):
   - `VITE_API_BASE_URL` = `https://loqta-feto.onrender.com/api/v1`
4. **Deploy** — وكل push جديد على `main` يُنشر تلقائيًا.

> بديل: Cloudflare Pages — في هذه الحالة احذف `vercel.json` وأبقِ `public/_redirects` (الموجود مسبقًا).

---

## الخطوة 2 — ضبط متغيرات الـ API على Render

ادخل على [dashboard.render.com](https://dashboard.render.com) → خدمة الـ API → **Environment**، وتأكد من:

| الاسم | القيمة | ملاحظة |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:5181,http://localhost:5182,https://loqta-store-virid.vercel.app` | **أضف رابط Vercel** بدون شرطة مائلة في النهاية. الكود يرفض `*` في الإنتاج |
| `APP_URL` | `https://loqta-store-virid.vercel.app` | يُستخدم لبناء روابط إعادة تعيين كلمة المرور |
| `EMAIL_FROM` | `Loqta <onboarding@resend.dev>` | مرسل البريد. بدّله لاحقًا بدومين موثّق (الخطوة 3) |
| `RESEND_API_KEY` | المفتاح الجديد | **دوّر المفتاح القديم** (انكشف سابقًا) من [resend.com/api-keys](https://resend.com/api-keys) |

ثم **Manual Deploy → Deploy latest commit** وانتظر until "Live".

> إذا أخطأت في `CORS_ORIGINS` سترى في المتصفح أخطاء CORS وجميع الطلبات تفشل — أعد التحقق من الرابط حرفيًا.

---

## الخطوة 3 — البريد لعملاء حقيقيين (توثيق دومين في Resend)

بـ `onboarding@resend.dev` تستطيع الإرسال **لبريدك أنت فقط**. لإرسال رسائل (استعادة كلمة المرور، تأكيد الطلبات) لأي عميل:

1. تملك دومين (مثل `loqta-store.com`) — من أي مسجّل دومينات.
2. [resend.com/domains](https://resend.com/domains) → **Add Domain** → أدخل دومينك.
3. أضف سجلات DNS التي تعطيك Resend عند مسجّل الدومين (SPF + DKIM عادة) وانتظر التحقق ✔.
4. حدّث في Render:
   - `EMAIL_FROM=Loqta <noreply@loqta-store.com>`
5. (اختياري لكن مهم للهوية) اربط الدومين بالواجهة:
   - Cloudflare Pages → **Custom domains** → أضف `www.loqta-store.com` واتبع تعليمات DNS.
   - بعدها حدّث `CORS_ORIGINS` و`APP_URL` في Render بالدومين الجديد وأعد النشر.
6. (اختياري — تحسين مشاركة الروابط) وسوم المشاركة مضبوطة حاليًا على `https://loqta-store-virid.vercel.app` في `frontend_loqta/index.html` — حدّثها فقط إذا غيّرت النطاق.

---

## الخطوة 4 — قائمة التحقق بعد النشر

اختبرها بالدومين النهائي:

- [ ] الصفحة الرئيسية: المنتجات + المجسّمات 3D + قسم الخصومات يعمل.
- [ ] إنشاء حساب جديد → تسجيل خروج → تسجيل دخول.
- [ ] **نسيت كلمة المرور**: يصل بريد فيه **الرمز كاملًا** → صفحة إعادة التعيين → الصق الرمز → كلمة مرور جديدة → دخول ناجح. (تأكد أن رابط البريد يشير للدومين النهائي — هذا ما يضبطه `APP_URL`).
- [ ] العربية/الإنجليزية تعملان مع RTL/LTR، وكل الرسائل مترجمة.
- [ ] إضافة للسلة والمفضلة والتبديل بين اللغات.
- [ ] لا أخطاء CORS في Console المتصفح.

---

## الخطوة 5 — إبقاء الـ API مستيقظًا (مجاني)

خطة Render المجانية تنام بعد 15 دقيقة خمول وأول طلب بعدها يأخذ ~40 ثانية:

- سجّل في [uptimerobot.com](https://uptimerobot.com) (مجاني) → Monitor من نوع HTTP(s) → الرابط: `https://loqta-feto.onrender.com/api/v1/health` → كل 10 دقائق.

أو رقّ الخدمة إلى خطة مدفوعة (~$7/شهر) للاستجابة الفورية.

---

## ملخص سريع (للصق في الملاحظات)

```
1) Vercel (تمت):       https://loqta-store-virid.vercel.app
                       root=frontend_loqta, vercel.json يتكفل بالراوتر
2) Render env:         CORS_ORIGINS += https://loqta-store-virid.vercel.app   (بدون / بالنهاية)
                       APP_URL=https://loqta-store-virid.vercel.app
                       EMAIL_FROM=Loqta <onboarding@resend.dev>
                       RESEND_API_KEY=<مفتاح جديد بعد تدوير القديم>
                       ثم Manual Deploy
3) Resend:             تدوير المفتاح + توثيق دومين + DNS (SPF/DKIM) + تحديث EMAIL_FROM
4) UptimeRobot:        ping /api/v1/health كل 10 دقائق
5) اختبر قائمة التحقق أعلاه
```
