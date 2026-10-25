# دليل نشر متجر لُقطة — Deploy Guide

دليل خطوة بخطوة لنشر الموقع بالكامل: **الواجهة على Cloudflare Pages** + **الـ API على Render** + **البريد عبر Resend**.
تنبيه: لا تشارك أي مفاتيح (API Keys) في المحادثات أو المستودع — تُضبط فقط في لوحات التحكم.

---

## الخطوة 1 — نشر الواجهة الأمامية على Cloudflare Pages

1. ادخل على [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**.
2. اختر مستودع `nasserrajah/loqta` (فرع `main`).
3. الإعدادات:
   - **Project root / Root directory:** `frontend_loqta`
   - **Framework preset:** `Vite` (أو None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. قبل أول بناء، افتح **Settings → Environment variables** وأضف (للإنتاج و preview معًا):

   | الاسم | القيمة |
   |---|---|
   | `VITE_API_BASE_URL` | `https://loqta-feto.onrender.com/api/v1` |

   > المتغير يُقرأ وقت البناء — لو تغيّر لاحقًا يجب إعادة النشر (Redeploy).
5. اضغط **Save and Deploy**. بعد الدقيقة ستحصل على رابط مثل `https://loqta-XXXX.pages.dev` — **احفظه**، ستحتاجه في الخطوتين 2 و3.
6. تحقّق بعد النشر:
   - الصفحة الرئيسية تعمل وتظهر منتجات 3D.
   - تحديث أي صفحة داخلية (مثل `/products`) لا يعطي 404 — ملف `_redirects` موجود ومسؤول عن ذلك.

---

## الخطوة 2 — ضبط متغيرات الـ API على Render

ادخل على [dashboard.render.com](https://dashboard.render.com) → خدمة الـ API → **Environment**، وتأكد من:

| الاسم | القيمة | ملاحظة |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:5181,http://localhost:5182,https://YOUR-PAGES-URL.pages.dev` | **أضف رابط Cloudflare** بدون شرطة مائلة في النهاية. الكود يرفض `*` في الإنتاج |
| `APP_URL` | `https://YOUR-PAGES-URL.pages.dev` | يُستخدم لبناء روابط إعادة تعيين كلمة المرور |
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
6. (اختياري — تحسين مشاركة الروابط) بعد معرفة النطاق النهائي، حدّث في `frontend_loqta/index.html` وسمَي `og:url`/`og:image` إلى رابط مطلق مثل `https://loqta-store.com/og-image.png` وأعد النشر.

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
1) Cloudflare Pages:  repo=loqta, root=frontend_loqta, build=npm run build, out=dist
   env: VITE_API_BASE_URL=https://loqta-feto.onrender.com/api/v1
2) Render env:        CORS_ORIGINS += https://<pages-url>   (بدون / بالنهاية)
                      APP_URL=https://<pages-url>
                      EMAIL_FROM=Loqta <onboarding@resend.dev>
                      RESEND_API_KEY=<مفتاح جديد بعد تدوير القديم>
                      ثم Manual Deploy
3) Resend:            تدوير المفتاح + توثيق دومين + DNS (SPF/DKIM) + تحديث EMAIL_FROM
4) UptimeRobot:       ping /api/v1/health كل 10 دقائق
5) اختبر قائمة التحقق أعلاه
```
