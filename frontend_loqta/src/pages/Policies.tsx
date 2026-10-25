import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShieldCheck, ScrollText, RefreshCcw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

type Section = 'privacy' | 'terms' | 'returns';

type Block = { heading: { en: string; ar: string }; body: { en: string; ar: string }[] };

const SECTIONS: Record<Section, { title: { en: string; ar: string }; icon: typeof ShieldCheck; blocks: Block[] }> = {
  privacy: {
    title: { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
    icon: ShieldCheck,
    blocks: [
      {
        heading: { en: 'What we collect', ar: 'ما نجمعه من بيانات' },
        body: [
          {
            en: 'When you create an account or place an order, we collect your name, email address, phone number and order details. We do not collect any data beyond what is needed to run the store.',
            ar: 'عند إنشاء حساب أو إتمام طلب، نجمع الاسم والبريد الإلكتروني ورقم الجوال وتفاصيل الطلب فقط. لا نجمع أي بيانات تتجاوز ما يلزم لتشغيل المتجر.',
          },
        ],
      },
      {
        heading: { en: 'How we use your data', ar: 'كيف نستخدم بياناتك' },
        body: [
          {
            en: 'To create and secure your account, process orders, send password-reset emails you request, and improve the browsing experience. We never sell your data to anyone.',
            ar: 'لإنشاء حسابك وتأمينه، ومعالجة الطلبات، وإرسال رسائل استعادة كلمة المرور عند طلبك، وتحسين تجربة التصفح. نحن لا نبيع بياناتك لأي جهة إطلاقًا.',
          },
        ],
      },
      {
        heading: { en: '3D models and browsing', ar: 'المجسّمات ثلاثية الأبعاد والتصفح' },
        body: [
          {
            en: 'All 3D product models are served from our own servers. Viewing them does not share your device information with third parties.',
            ar: 'جميع المجسّمات ثلاثية الأبعاد تُقدَّم من سيرفراتنا الخاصة، ومشاهدتها لا تشارك أي معلومات عن جهازك مع أطراف خارجية.',
          },
        ],
      },
      {
        heading: { en: 'Data sharing', ar: 'مشاركة البيانات' },
        body: [
          {
            en: 'We share data only with the service providers required to operate the store (such as the email delivery service), and only the minimum they need. Your password is stored encrypted and is never readable by anyone — including us.',
            ar: 'لا نشارك بياناتك إلا مع مقدّمي الخدمة اللازمين لتشغيل المتجر (مثل خدمة إرسال البريد)، وبالحد الأدنى الذي يحتاجونه فقط. كلمة المرور مخزّنة بصيغة مشفّرة غير قابلة للقراءة من أي طرف — بما في ذلك نحن.',
          },
        ],
      },
      {
        heading: { en: 'Your rights', ar: 'حقوقك' },
        body: [
          {
            en: 'You can update your information anytime from your profile page, and you can request a copy of your data or its deletion by contacting us through the channels announced in the store.',
            ar: 'يمكنك تحديث معلوماتك في أي وقت من صفحة ملفك الشخصي، ويمكنك طلب نسخة من بياناتك أو حذفها عبر التواصل معنا من خلال الوسائل المعلنة في المتجر.',
          },
        ],
      },
      {
        heading: { en: 'Policy updates', ar: 'تحديث السياسة' },
        body: [
          {
            en: 'If this policy changes, we will publish the new version on this page with an updated date. Significant changes will be announced inside the store.',
            ar: 'إذا تغيّرت هذه السياسة سننشر النسخة الجديدة في هذه الصفحة مع تحديث التاريخ، وسيتم الإعلان عن التغييرات المهمة داخل المتجر.',
          },
        ],
      },
    ],
  },
  terms: {
    title: { en: 'Terms & Conditions', ar: 'الشروط والأحكام' },
    icon: ScrollText,
    blocks: [
      {
        heading: { en: 'Using the store', ar: 'استخدام المتجر' },
        body: [
          {
            en: 'By using Loqta you agree to these terms. You are responsible for keeping your account credentials safe and for the accuracy of the information you provide.',
            ar: 'باستخدامك لُقطة فإنك توافق على هذه الشروط. أنت مسؤول عن الحفاظ على بيانات دخولك وعن دقة المعلومات التي تقدّمها.',
          },
        ],
      },
      {
        heading: { en: 'Products and prices', ar: 'المنتجات والأسعار' },
        body: [
          {
            en: 'We do our best to display products, prices and availability accurately. If a pricing or specification error appears, we will correct it and contact you before processing an affected order.',
            ar: 'نبذل جهدًا لعرض المنتجات والأسعار والتوفر بدقة. في حال ظهور خطأ في سعر أو مواصفات، سنصححه وسنتواصل معك قبل تنفيذ الطلب المتأثر.',
          },
          {
            en: 'Note: some catalog data shown during the launch period is demonstration data clearly marked inside the store, and it will be replaced with live data as products go on sale.',
            ar: 'ملاحظة: بعض بيانات الكتالوج المعروضة في فترة الإطلاق بيانات تجريبية مُعلَّمة بوضوح داخل المتجر، وستُستبدل ببيانات فعلية مع بدء البيع.',
          },
        ],
      },
      {
        heading: { en: 'Orders', ar: 'الطلبات' },
        body: [
          {
            en: 'An order is confirmed after you receive our confirmation. You may cancel an order before it ships by contacting us. Orders that cannot be fulfilled will be fully cancelled with any paid amounts returned.',
            ar: 'يُعتمد الطلب بعد وصول التأكيد مننا. يمكنك إلغاء الطلب قبل شحنه عبر التواصل معنا. الطلبات التي يتعذر تنفيذها تُلغى بالكامل مع إرجاع أي مبالغ مدفوعة.',
          },
        ],
      },
      {
        heading: { en: 'Intellectual property', ar: 'الملكية الفكرية' },
        body: [
          {
            en: 'The store name, design, 3D models and product images are the property of Loqta or their respective owners, and may not be copied or reused commercially without permission.',
            ar: 'اسم المتجر وتصميمه والمجسّمات ثلاثية الأبعاد وصور المنتجات ملك للُقطة أو لأصحابها، ولا يجوز نسخها أو إعادة استخدامها تجاريًا دون إذن.',
          },
        ],
      },
      {
        heading: { en: 'Liability', ar: 'المسؤولية' },
        body: [
          {
            en: 'Loqta is not liable for indirect damages arising from use of the store. Nothing in these terms limits your statutory consumer rights under the applicable laws.',
            ar: 'لا تتحمل لُقطة مسؤولية الأضرار غير المباشرة الناتجة عن استخدام المتجر. ولا يقلّل أي نص في هذه الشروط من حقوقك القانونية كمستهلك بموجب الأنظمة المعمول بها.',
          },
        ],
      },
      {
        heading: { en: 'Applicable law', ar: 'القانون المعمول به' },
        body: [
          {
            en: 'These terms are governed by the laws and consumer-protection regulations applicable in the Kingdom of Saudi Arabia.',
            ar: 'تخضع هذه الشروط للأنظمة ولوائح حماية المستهلك المعمول بها في المملكة العربية السعودية.',
          },
        ],
      },
    ],
  },
  returns: {
    title: { en: 'Returns & Exchange', ar: 'سياسة الاستبدال والإرجاع' },
    icon: RefreshCcw,
    blocks: [
      {
        heading: { en: 'Return window', ar: 'مدة الإرجاع' },
        body: [
          {
            en: 'You may request a return or exchange within 7 days of receiving the order, provided the product is unused, in its original packaging, and complete with all accessories.',
            ar: 'يمكنك طلب الإرجاع أو الاستبدال خلال 7 أيام من استلام الطلب، بشرط أن يكون المنتج غير مستخدم وبغلافه الأصلي ومكتمل الملحقات.',
          },
        ],
      },
      {
        heading: { en: 'Defective on arrival', ar: 'المنتج المعيب عند الاستلام' },
        body: [
          {
            en: 'If the product arrives damaged or does not match the description, contact us immediately and we will replace it at our expense — you will not pay any return shipping.',
            ar: 'إذا وصل المنتج تالفًا أو غير مطابق للوصف، تواصل معنا فورًا وسنستبدله على نفقتنا ولن تدفع أي رسوم شحن للإرجاع.',
          },
        ],
      },
      {
        heading: { en: 'What cannot be returned', ar: 'ما لا يقبل الإرجاع' },
        body: [
          {
            en: 'Products damaged by misuse, missing original accessories or packaging, and items explicitly marked as non-returnable on their product page.',
            ar: 'المنتجات التالفة بسبب سوء الاستخدام، أو التي نقصت ملحقاتها أو غلافها الأصلي، وما هو مُعلَّم صراحةً على صفحة المنتج بأنه غير قابل للإرجاع.',
          },
        ],
      },
      {
        heading: { en: 'How to request', ar: 'كيف تطلب الإرجاع' },
        body: [
          {
            en: 'Contact us through the channels announced in the store with your order number and the reason for the return. We will confirm the request and arrange the pickup or drop-off.',
            ar: 'تواصل معنا عبر الوسائل المعلنة في المتجر مع ذكر رقم الطلب وسبب الإرجاع. سنؤكد الطلب ونرتّب عملية الاستلام أو التسليم.',
          },
        ],
      },
      {
        heading: { en: 'Refunds', ar: 'استرداد المبالغ' },
        body: [
          {
            en: 'Once the returned product passes inspection, the amount is refunded to the original payment method within 7–14 business days. Original shipping fees are non-refundable unless the return was our fault.',
            ar: 'بعد فحص المنتج المُرجَع واعتماده، تُعاد المبالغ لوسيلة الدفع الأصلية خلال 7 إلى 14 يوم عمل. رسوم الشحن الأصلية غير مستردة إلا إذا كان الإرجاع بسبب منّا.',
          },
        ],
      },
    ],
  },
};

const TABS: { id: Section; labelKey: 'privacyPolicy' | 'termsOfService' | 'returnPolicy' }[] = [
  { id: 'privacy', labelKey: 'privacyPolicy' },
  { id: 'terms', labelKey: 'termsOfService' },
  { id: 'returns', labelKey: 'returnPolicy' },
];

function isSection(value: string | undefined): value is Section {
  return value === 'privacy' || value === 'terms' || value === 'returns';
}

export function Policies() {
  const { t, language } = useAppStore();
  const { section } = useParams<{ section?: string }>();
  const active: Section = isSection(section) ? section : 'privacy';
  const data = SECTIONS[active];
  const pick = (v: { en: string; ar: string }) => (language === 'ar' ? v.ar : v.en);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [active]);

  const Icon = data.icon;

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{t('policiesTitle')}</h1>
      <p className="text-xs text-gray-400 mb-6">{t('policiesLastUpdated')}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            to={`/policies/${tab.id}`}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              tab.id === active
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            {t(tab.labelKey)}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-gray-900">{pick(data.title)}</h2>
        </div>

        <div className="space-y-8">
          {data.blocks.map((block, i) => (
            <section key={i}>
              <h3 className="font-bold text-gray-900 mb-2">{pick(block.heading)}</h3>
              {block.body.map((p, j) => (
                <p key={j} className="text-sm md:text-base text-gray-600 leading-relaxed mb-2">
                  {pick(p)}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
