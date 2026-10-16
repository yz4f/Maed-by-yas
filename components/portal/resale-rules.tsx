'use client';

import { Headset, Megaphone, PackagePlus, ShieldAlert } from 'lucide-react';
import styles from './resale-rules.module.css';

type Rule = { label: string; text: string };
type RulesContent = {
  title: string;
  subtitle: string;
  sections: {
    title: string;
    eyebrow: string;
    rules: Rule[];
    penalties?: Rule[];
    ending: string[];
  }[];
  penaltiesTitle: string;
};

const arabic: RulesContent = {
  title: 'إعادة البيع',
  subtitle: 'قوانين طلب المخزون والخدمة والتنويهات المهمة لشركاء تعن. يرجى قراءتها قبل تقديم أي طلب.',
  penaltiesTitle: 'المخالفات والعقوبات',
  sections: [
    {
      title: 'طلب مخزون',
      eyebrow: 'قوانين طلب المخزون',
      rules: [
        { label: 'الحد الأقصى للطلب', text: 'يحق لك طلب 125 مفتاحًا كحد أقصى لكل طلب مخزون، ولا يُسمح بطلب مخزون جديد إلا بعد مرور 4 أيام.' },
        { label: 'إثبات انخفاض المخزون', text: 'يجب تقديم إثبات واضح بأن المخزون المتبقي وصل إلى 30% أو أقل قبل تقديم طلب جديد.' },
        { label: 'الاستخدام المسموح', text: 'المخزون مخصص للعملاء الذين قاموا بالشراء والدفع فعليًا، ويُمنع توزيع المفاتيح قبل إتمام عملية الشراء.' },
        { label: 'المسؤولية والمراقبة', text: 'أنت مسؤول بالكامل عن جميع المفاتيح المخصصة لك، وجميع عمليات التفعيل والتوزيع مسجلة وتخضع للمراقبة والمراجعة.' },
      ],
      penalties: [
        { label: 'المخالفة الأولى', text: 'يمنع إعطاء المفاتيح مجانًا أو دون مقابل، ويترتب عليها تحذير لمدة 3 أيام.' },
        { label: 'المخالفة الثانية', text: 'تحذير لمدة 7 أيام، مع إيقاف صلاحية طلب وتعبئة المخزون طوال فترة التحذير.' },
        { label: 'المخالفة الثالثة', text: 'إلغاء جميع المفاتيح وسحب المنتج نهائيًا، وإنهاء الاتفاق وعدم التعامل معك مستقبلًا.' },
      ],
      ending: [
        'يرجى الالتزام بجميع القوانين والتعليمات. استمرارك في استخدام الخدمة يعني موافقتك على هذه الشروط وتحملك المسؤولية الكاملة عن أي مخالفة.',
        'إدارة الخدمة تحتفظ بحقها في مراجعة جميع السجلات واتخاذ الإجراءات اللازمة عند رصد أي تجاوز.',
      ],
    },
    {
      title: 'طلب خدمة',
      eyebrow: 'قوانين طلب الخدمة والتواصل',
      rules: [
        { label: 'نطاق الخدمة', text: 'يقتصر طلب الخدمة على تعبئة المخزون فقط، ولا يحق لك طلب خدمات إضافية أو المطالبة بحل المشكلات من الإدارة أو الدعم الفني.' },
        { label: 'الدعم والمساعدة', text: 'جميع المعلومات والشروحات والحلول موضحة في الموقع ضمن صفحة منتجاتي ومركز المساعدة، ويرجى الرجوع إليها قبل التواصل.' },
      ],
      penalties: [
        { label: 'المخالفة الأولى', text: 'تحذير رسمي بسبب تكرار الإزعاج أو الطلبات الخارجة عن نطاق الخدمة.' },
        { label: 'المخالفة الثانية', text: 'تحذير نهائي، مع إيقاف تعبئة المخزون لمدة 7 أيام كاملة.' },
        { label: 'المخالفة الثالثة', text: 'سحب المخزون بالكامل، وإلغاء الاتفاقية وإنهاء التعامل نهائيًا.' },
      ],
      ending: [
        'يرجى احترام آلية التواصل والالتزام بنطاق الخدمة المحدد. تكرار الإزعاج أو مخالفة التعليمات يعرضك للإجراءات المذكورة أعلاه.',
        'إدارة الخدمة تحتفظ بحقها في مراجعة المخالفات واتخاذ الإجراءات اللازمة.',
      ],
    },
    {
      title: 'تنويهات',
      eyebrow: 'تنويهات مهمة',
      rules: [
        { label: 'مدة طلب المخزون', text: 'يُسمح بطلب تعبئة المخزون مرة واحدة كل 4 أيام، بحد أقصى 125 مفتاحًا لكل طلب.' },
        { label: 'شرط إعادة التعبئة', text: 'يجب تقديم إثبات واضح بأن المخزون المتبقي وصل إلى 30% أو أقل، ولن يُقبل طلب جديد قبل استيفاء الشروط وانتهاء المدة المحددة.' },
        { label: 'استخدام المفاتيح', text: 'المخزون مخصص للعملاء الذين أتموا عملية الشراء والدفع فقط، ويُمنع منح المفاتيح مجانًا أو قبل الشراء.' },
        { label: 'المراقبة', text: 'جميع المفاتيح وعمليات التفعيل والتوزيع مسجلة وتخضع للمراجعة.' },
        { label: 'نطاق الخدمة', text: 'طلبات الخدمة مخصصة لتعبئة المخزون فقط، ولا تشمل الدعم الفني أو حل المشكلات من خلال الإدارة.' },
        { label: 'الدعم والمساعدة', text: 'جميع الشروحات والحلول متوفرة في الموقع ضمن صفحة منتجاتي ومركز المساعدة.' },
        { label: 'الالتزام بالقوانين', text: 'تكرار الإزعاج أو مخالفة التعليمات يعرضك للتحذيرات وإيقاف التعبئة أو سحب المخزون وإلغاء الاتفاقية حسب درجة المخالفة.' },
      ],
      ending: [
        'يرجى قراءة جميع القوانين والالتزام بها قبل استخدام الخدمة. استمرارك في التعامل معنا يعني موافقتك على الشروط والتعليمات المذكورة.',
        'شاكرين لكم حسن تعاونكم والتزامكم.',
      ],
    },
  ],
};

const english: RulesContent = {
  title: 'Resale rules',
  subtitle: 'Stock requests, service requests and important notices for T3N partners. Please read before submitting a request.',
  penaltiesTitle: 'Violations and penalties',
  sections: [
    {
      title: 'Stock request', eyebrow: 'Stock request rules',
      rules: [
        { label: 'Maximum request', text: 'You may request up to 125 keys per stock request. A new request is allowed only after 4 days.' },
        { label: 'Low stock proof', text: 'Provide clear proof that remaining stock is 30% or less before making another request.' },
        { label: 'Permitted use', text: 'Stock is for customers who have completed payment. Do not distribute keys before purchase.' },
        { label: 'Responsibility and monitoring', text: 'You are fully responsible for all assigned keys. Activations and distribution are logged, monitored and reviewed.' },
      ],
      penalties: [
        { label: 'First violation', text: 'Giving keys away for free or without payment is prohibited and results in a 3-day warning.' },
        { label: 'Second violation', text: 'A 7-day warning, during which stock requests and refills are suspended.' },
        { label: 'Third violation', text: 'All keys are cancelled, the product is permanently withdrawn, and the agreement and future business end.' },
      ],
      ending: ['Please follow all rules. Continued use means acceptance of these terms and full responsibility for violations.', 'Management may review all records and take appropriate action when a violation is found.'],
    },
    {
      title: 'Service request', eyebrow: 'Service and contact rules',
      rules: [
        { label: 'Service scope', text: 'Service requests are limited to stock refills. Additional services or help with problems from management or technical support cannot be requested.' },
        { label: 'Help and support', text: 'Information, guides and solutions are available in My Products and the Help Center. Check them before contacting us.' },
      ],
      penalties: [
        { label: 'First violation', text: 'An official warning for repeated disturbance or out-of-scope requests.' },
        { label: 'Second violation', text: 'A final warning and suspension of stock refills for 7 full days.' },
        { label: 'Third violation', text: 'All stock is withdrawn, the agreement is cancelled and business ends permanently.' },
      ],
      ending: ['Respect the contact process and service scope. Repeated disturbance or disregard for these rules leads to the penalties above.', 'Management may review violations and take appropriate action.'],
    },
    {
      title: 'Notices', eyebrow: 'Important notices',
      rules: [
        { label: 'Stock request interval', text: 'One refill request is allowed every 4 days, with a maximum of 125 keys per request.' },
        { label: 'Refill condition', text: 'Provide clear proof that stock has reached 30% or less. No new request is accepted before all conditions and the waiting period are met.' },
        { label: 'Key use', text: 'Stock is only for customers who have purchased and paid. Free keys or distribution before payment are prohibited.' },
        { label: 'Monitoring', text: 'All keys, activations and distributions are recorded and subject to review.' },
        { label: 'Service scope', text: 'Service requests cover stock refills only, not technical support or problem solving through management.' },
        { label: 'Help and support', text: 'Guides and solutions are available in My Products and the Help Center.' },
        { label: 'Following the rules', text: 'Repeated disturbance or violations may lead to warnings, refill suspension, stock withdrawal or agreement cancellation according to severity.' },
      ],
      ending: ['Read and follow all rules before using the service. Continuing to work with us means accepting these terms and instructions.', 'Thank you for your cooperation.'],
    },
  ],
};

const icons = [PackagePlus, Headset, Megaphone];

export function ResaleRules({ lang, isDark }: { lang: 'ar' | 'en'; isDark: boolean }) {
  const content = lang === 'ar' ? arabic : english;

  return (
    <section className={styles.page} data-theme={isDark ? 'dark' : 'light'} data-allow-copy data-allow-context-menu aria-label={content.title}>
      <div className={styles.intro}>
        <div>
          <span className={styles.kicker}>{lang === 'ar' ? 'سياسة شركاء تعن' : 'T3N partner policy'}</span>
          <h2>{content.title}</h2>
          <p>{content.subtitle}</p>
        </div>
      </div>
      <div className={styles.grid}>
        {content.sections.map((section, index) => {
          const Icon = icons[index];
          return (
            <article className={styles.card} key={section.title}>
              <div className={styles.cardHeader}>
                <span className={styles.icon}><Icon size={20} strokeWidth={1.8} /></span>
                <span className={styles.cardNumber} dir="ltr">0{index + 1}</span>
                <span className={styles.eyebrow}>{section.eyebrow}</span>
                <h3>{section.title}</h3>
              </div>
              <ol className={styles.rules}>
                {section.rules.map((rule, ruleIndex) => (
                  <li key={rule.label}>
                    <span className={styles.ruleNumber}>{String(ruleIndex + 1).padStart(2, '0')}</span>
                    <p><strong>{rule.label}:</strong> {rule.text}</p>
                  </li>
                ))}
              </ol>
              {section.penalties && (
                <div className={styles.penalties}>
                  <h4><ShieldAlert size={16} />{content.penaltiesTitle}</h4>
                  <ul>
                    {section.penalties.map((rule) => <li key={rule.label}><strong>{rule.label}:</strong> {rule.text}</li>)}
                  </ul>
                </div>
              )}
              <div className={styles.ending}>
                {section.ending.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
