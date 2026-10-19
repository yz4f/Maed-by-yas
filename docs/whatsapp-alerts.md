# تنبيهات الموقع عبر واتساب

يرسل الموقع تنبيهًا لصاحب الموقع عند كل حدث يُحفظ في سجل الإدارة، مثل تسجيل عضو جديد وطلب رستات وتفعيل مفتاح، وكذلك عند الدخول والخروج. الرسالة تتضمن نوع الحدث واسم صاحبه فقط؛ المفاتيح وعناوين IP ونصوص محادثات الدعم تبقى في سجل الإدارة.

## تفعيل الإرسال عبر Infobip على Railway

عنوان `eerqxq.api.infobip.com` الذي قدمته هو عنوان API الخاص بحسابك، وليس وسيلة مصادقة. التكامل مع Infobip يدعم الموقع مباشرة دون استضافة PHP إضافية.

1. في [لوحة Infobip](https://portal.infobip.com/)، افتح `Channels and Numbers > Channels > WhatsApp` وسجّل رقم الإرسال التجاري. عند ربط رقم يعمل في تطبيق WhatsApp Business، اختر طريقة الربط المناسبة من لوحة Infobip قبل أي نقل للحساب.
2. أنشئ قالبًا معتمدًا باللغة العربية ومتغيرين بالترتيب التالي: `تعن: {{1}}` و`بواسطة: {{2}}`. أنشئ مفتاح API بصلاحية `whatsapp:message:send`.
3. أضف المتغيرات إلى خدمة الموقع في Railway:

   - `WHATSAPP_PROVIDER=infobip`
   - `INFOBIP_BASE_URL=eerqxq.api.infobip.com`
   - `INFOBIP_API_KEY`: مفتاح API؛ احفظه في Railway فقط.
   - `INFOBIP_WHATSAPP_SENDER`: رقم الإرسال المسجل في Infobip بصيغة دولية.
   - `WHATSAPP_ALERT_TO`: رقم استقبال التنبيهات بصيغة دولية.
   - `WHATSAPP_TEMPLATE_NAME`: اسم القالب المعتمد.
   - `WHATSAPP_TEMPLATE_LANGUAGE=ar`
   - `WHATSAPP_ALERTS_ENABLED=1` بعد إكمال الإعداد.

4. أعد نشر الخدمة وجرّب تسجيل دخول جديدًا. قبول Infobip للطلب لا يثبت وصول الرسالة؛ تحقق من سجل التسليم في لوحة Infobip.

المراجع: [عنوان API](https://www.infobip.com/docs/essentials/api-essentials/base-url)، [تسجيل مرسل واتساب](https://www.infobip.com/docs/whatsapp/get-started/embedded-signup)، [إرسال قالب واتساب](https://www.infobip.com/docs/tutorials/send-whatsapp-template-messages).

## بديل: إرسال مباشر عبر Meta Cloud API

1. ابدأ من [مركز مطوري WhatsApp الرسمي لدى Meta](https://whatsappbusiness.com/developers/developer-hub/) وسجّل الدخول بحساب Meta، ثم أنشئ تطبيق WhatsApp Business Platform. إنشاء حساب Postman وحده لا ينشئ حساب Meta ولا يمنح الموقع صلاحية الإرسال. إذا كان رقم الإرسال يعمل بالفعل في تطبيق WhatsApp Business، تحقّق من مسار ربط الرقم الحالي قبل إجراء أي نقل أو إزالة للحساب من التطبيق.
2. بعد ربط رقم الإرسال، استخرج `Phone Number ID` ورمز وصول صالحًا من إعدادات WhatsApp في لوحة تطبيق Meta. رقم الهاتف الظاهر للناس ليس هو `Phone Number ID`. يجب أن يكون رقم الاستقبال مشاركًا في تلقي التنبيهات.
3. أنشئ قالب رسالة باسم تختاره ولغة `ar` بمتغيرين في نصه، بهذا الترتيب، وانتظر موافقة Meta عليه:

   `تعن: {{1}}`  
   `بواسطة: {{2}}`  
   `راجع سجل الإدارة للتفاصيل.`

4. أضف متغيرات الخدمة التالية في Railway، ولا تحفظ القيم الحقيقية في المستودع:

   - `WHATSAPP_ALERT_TO`: رقم الاستقبال بصيغة `+9665XXXXXXXX` أو `05XXXXXXXX`.
   - `WHATSAPP_ACCESS_TOKEN`: رمز الوصول من Meta.
   - `WHATSAPP_PHONE_NUMBER_ID`: معرّف رقم الإرسال في Meta.
   - `WHATSAPP_GRAPH_API_VERSION`: نسخة Graph API المدعومة في حسابك، مثل `vXX.X`.
   - `WHATSAPP_TEMPLATE_NAME`: اسم القالب المعتمد.
   - `WHATSAPP_TEMPLATE_LANGUAGE`: رمز لغة القالب، مثل `ar`.
   - `WHATSAPP_ALERTS_ENABLED`: القيمة `1` بعد إكمال الإعداد.

5. أعد نشر الموقع وجرّب دخول حساب، ثم تأكد من استلام الرسالة عبر واتساب. تعطيل الإرسال يكون بضبط `WHATSAPP_ALERTS_ENABLED=0`.

قد تترتب رسوم على رسائل القالب حسب تسعير Meta. نبضات حضور المستخدم وفتح الصفحات ليست أحداثًا في السجل ولا ترسل تنبيهًا.

المراجع: [وثائق Meta Cloud API](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api)، [سياسة رسائل WhatsApp Business](https://business.whatsapp.com/policy/).
