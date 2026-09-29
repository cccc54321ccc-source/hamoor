import { CITIES_DATA, SALARIES, LICENSES, SECTOR_FINANCIALS, detectSector, getCityBrief, getSectorBrief, getFinancialBrief, getCompetitorsByBudget } from "../data.js";

export const runtime = 'nodejs';
export const maxDuration = 60;

function numWithCommas(n){
  const s = String(Math.round(Number(n)||0));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export async function POST(req) {
  // شبكة أمان: لو تجاوز التحليل 55 ثانية نرجّع رد JSON واضح بدل ما يقطعه Vercel
  const timeoutResponse = new Promise(resolve =>
    setTimeout(() => resolve(Response.json(
      { error: "التحليل أخذ وقتاً أطول من المتوقع - حاول مرة أخرى" },
      { status: 504 }
    )), 55000)
  );
  return Promise.race([handleAnalyze(req), timeoutResponse]);
}

async function handleAnalyze(req) {
  try {
    console.log("═══ ROUTE VERSION MARKER: HAMOOR-FIX-2026-09-29-V6 (parallel-providers+no-audit) ═══");
    const { idea, sector: userSector, city, budget, extras } = await req.json();
    console.log("Request:", { idea, userSector, city, budget, extras });

    if (!idea || !city || !budget) {
      return Response.json({ error: "البيانات ناقصة" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "مفتاح API غير موجود" }, { status: 500 });
    }

    const budgetNum = parseInt(budget);
    const cityName = city.split(" - ")[0].trim();
    const neighborhood = city.includes(" - حي ") ? city.split(" - حي ")[1].trim() : null;

    const sector = userSector ? userSector : detectSector(idea);

    const cityBrief = getCityBrief(cityName) || cityName;
    const sectorBrief = getSectorBrief(sector);
    const financialBrief = getFinancialBrief(sector);
    const suggestedCompetitors = getCompetitorsByBudget(sector, budgetNum);

    // ═══ معلومات إضافية من المستخدم ═══
    let extraInfo = "";
    if (extras) {
      const lines = [];
      if (extras.area) lines.push(`مساحة المحل: ${extras.area} متر مربع`);
      if (extras.actual_rent) lines.push(`الإيجار السنوي الفعلي (أكّده المستخدم): ${numWithCommas(parseInt(extras.actual_rent))} ريال — استخدم هذا الرقم كما هو في التحليل المالي`);
      if (extras.staff_count) lines.push(`عدد الموظفين المتوقع: ${extras.staff_count}`);
      if (extras.shop_state) lines.push(`حالة المحل: ${extras.shop_state}`);
      if (extras.experience) lines.push(`خبرة صاحب المشروع في هذا المجال: ${extras.experience}`);
      if (lines.length) extraInfo = "\n\nمعلومات إضافية مهمة قدّمها صاحب المشروع (استخدمها لرفع دقة التحليل):\n" + lines.join("\n");
    }

    // ═══ معطيات المشروع المشتركة ═══
    const projectContext = `المشروع: ${idea}
القطاع: ${sector}
المدينة: ${cityName}${neighborhood ? `\nالحي: ${neighborhood}` : ''}
الميزانية: ${numWithCommas(budgetNum)} ريال

${cityBrief}

${sectorBrief}

${financialBrief}

الرواتب التقريبية (محدّثة لـ 2026): موظف سعودي ${SALARIES.emp_saudi}؛ مهن التسويق والمبيعات السعودية: ${SALARIES.emp_marketing_saudi}؛ مهن هندسية سعودية: ${SALARIES.eng_saudi}؛ تقني/مبرمج سعودي: ${SALARIES.emp_tech_saudi}؛ خبرة عربية ${SALARIES.exp_arab}؛ عمالة آسيوية ${SALARIES.worker_asian}
التراخيص والرسوم الحكومية: ${LICENSES.commercial_register}؛ ${LICENSES.municipal_license}؛ ${LICENSES.chamber_of_commerce}؛ ${LICENSES.ecommerce_note}${suggestedCompetitors.length ? `\n\nمنافسون حقيقيون مناسبون لحجم هذا المشروع (استخدم هذه الأسماء في تحليل المنافسين): ${suggestedCompetitors.join("، ")}` : ''}${extraInfo}`;

    // ═══ تعليمات الأسلوب ═══
    const styleGuide = `أسلوب الكتابة: اكتب كأنك مستشار خبير تجلس مع صاحب المشروع وتنصحه بصدق. لغة عربية طبيعية وإنسانية، خاطبه مباشرة ("مشروعك"، "ميزانيتك"، "أنصحك"). تجنّب العبارات الآلية. اشرح "لماذا" وراء كل رقم. لا مجاملة - كن صادقاً وواقعياً.`;

    // ═══ محرّك التكييف الذكي حسب نوع المشروع ═══
    const adaptEngine = `التكييف الذكي: حدّد طبيعة المشروع أولاً (موقع فيزيائي، خدمة، رقمي/أونلاين، منتج، فكرة ابتكارية) وكيّف التحليل:
- مشروع رقمي بلا موقع: لا إيجار ولا ديكور؛ استخدم تكاليف تطوير واستضافة وتراخيص رقمية. البنود غير المنطبقة = 0.
- خدمة: احسب بالعملاء الشهريين أو عدد العقود، ومتوسط الفاتورة قد يكون قيمة عقد أو اشتراك.
- مشروع منزلي/صغير: قلّل التكاليف، لا تفرض تكاليف محل كامل.
- فكرة ابتكارية: حلّلها بمنطقها الخاص، اذكر الفرصة والغموض بصراحة.
- المنافسون لمشروع غير تقليدي: اذكر البدائل أو الحلول القريبة.
البنود غير المنطبقة = 0 مع شرح في الملاحظات.`;

    // ═══ تعليمات البحث ═══
    const searchInstructions = `استخدم معرفتك العميقة بالسوق السعودي ومعطيات المشروع المعطاة لك. اعتمد على الأرقام في المعطيات كأساس، وعدّلها بدقة حسب المدينة والحي والمعلومات الإضافية التي قدّمها صاحب المشروع.`;

    const baseRules = `لغة: عربية فصحى فقط، ممنوع أي حرف من لغة أخرى. أرقام عادية.

قواعد الدقة:
- البحث الحقيقي أولوية مطلقة: إذا توفّرت "نتائج البحث الحقيقي من الإنترنت" أسفل هذا الـ prompt، فهي مصدرك الأساسي. استخرج منها الأرقام والأسماء والحقائق وادمجها في تحليلك. لا تتجاهلها وتعتمد على ذاكرتك.
- المنافسون: استخدم الأسماء التي ظهرت في البحث أولاً، ثم القائمة المعطاة. ممنوع أسماء وهمية أو عامة. حلّل كل منافس بقوة وثغرة محددة.
- التكاليف: إذا ظهرت أرقام في البحث، استخدمها. إذا تعارضت مع توقعك، البحث أحدث وأدق.
- في recommendations اذكر صراحة "حسب البحث..." عند الاعتماد على معلومة من البحث.
- أرقام واقعية معدّلة حسب حجم المدينة والحي. المجاميع تتطابق (مجموع البنود = الإجمالي).
- تحقق رياضي إلزامي قبل إرجاع JSON: (1) اجمع بنود التأسيس يدوياً وتأكد = total. (2) اجمع البنود الشهرية وتأكد = total. (3) نقطة التعادل = التأسيس ÷ (إيراد الاستقرار - الشهرية)، احسبها وتأكد النتيجة منطقية. (4) الربح السنوي = (متوسط الإيراد الشهري - الشهرية) × 12. إن وجدت تعارضاً صحّح الأرقام قبل الإخراج.
- ميزانية أقل من الحد الأدنى للتأسيس = score تحت 35 + توضيح كم ينقص.
- المنافسون: استخدم القائمة المعطاة في المعطيات (مختارة لحجم المشروع). حلّل قوة وثغرة كل واحد. لو ما أُعطيت قائمة، اذكر شركات وسلاسل سعودية حقيقية. ممنوع أسماء وهمية أو أوصاف عامة.
- نقطة التعادل = إجمالي التأسيس ÷ (الإيراد عند الاستقرار - التكلفة الشهرية). ROI = (صافي الربح السنوي ÷ رأس المال) × 100.
- اتساق مالي صارم: لو الميزانية ≥ إجمالي التأسيس فهي كافية. لا تقل "غير كافية" إلا لو فعلاً أقل.
- الميزانية الفائضة عامل قوة: لو ميزانية صاحب المشروع تتجاوز إجمالي التأسيس بنسبة كبيرة (50%+ فائض)، اعتبر ذلك عامل قوة يدعم المشروع، لأنه يعطيه مرونة مالية لمواجهة التحديات والتوسع. ارفع النقاط (score) بناءً على ذلك. مشروع بميزانية تعادل ضعف التأسيس مع فكرة منطقية وسوق نشط يستحق 70-85 نقطة (لا يستحق 50-60).
- واقعية الإيرادات والربح (قاعدة صارمة): مشروع جديد لم يبدأ بعد لا يحقق إيرادات قصوى من السنة الأولى. التدرّج الواقعي للسنة الأولى: شهر 1 = 20-30٪ من الإيراد المتوقع عند الاستقرار، شهر 3 = 40-50٪، شهر 6 = 60-75٪، شهر 12 = 85-100٪. الربح السنوي الأول = متوسط الإيراد الشهري الفعلي × 12 - التكاليف السنوية، وعادة يكون متواضعاً أو سالباً بسبب فترة النمو. ROI صحي للسنة الأولى عادة 15-50٪؛ ROI فوق 100٪ مشكوك فيه ويحتاج تبرير قوي؛ ROI فوق 200٪ خطأ شبه مؤكد، راجع افتراضات الإيرادات.
- لا تبالغ في الربح: لازم يكون منطقياً مع نقطة التعادل. تعادل 10 شهور = ربح سنة أولى بسيط لا ضخم.
- KPIs: مؤشرات تشغيلية واقعية قابلة للقياس (عملاء، متوسط طلب، تكلفة اكتساب، نسبة تكرار، إشغال). ممنوع نسب مزيّفة مثل "جودة 95%" لمشروع ما بدأ.
- equipment_breakdown: 3-5 بنود فرعية لـ"المعدات والأثاث" تناسب المشروع (مطعم: معدات مطبخ، ثلاجات، طاولات؛ صالون: كراسي وأجهزة، مرايا؛ تقني: أجهزة وخوادم). مجموعها = قيمة equipment.
- الأحياء حقيقية من ${cityName}.
- تحليل المواقع: إذا كان المشروع لا يحتاج موقعاً فيزيائياً (تطبيق، خدمة أونلاين، متجر إلكتروني، خدمة عن بُعد)، اضبط is_physical_location = false واترك locations بـ null أو قيم فارغة. لا تخترع "أفضل حي" لمشروع رقمي - هذا لا معنى له.`;

    // ═══ الاستدعاء الأول: التحليل الأساسي ═══
    const promptCore = `أنت خبير استثماري سعودي بخبرة 30 سنة في دراسات الجدوى الميدانية. حلّل هذا المشروع بصرامة وواقعية تامة كدراسة جدوى حقيقية مبنية على بحث فعلي.

${projectContext}

${searchInstructions}

${styleGuide}

${adaptEngine}

${baseRules}

بعد بحثك، أرجع النتيجة بصيغة JSON فقط (بدون أي نص قبله أو بعده، بدون علامات markdown):

{
  "score": <0-100 واقعي>,
  "decision": "<قرار صريح 6-10 كلمات>",
  "decision_type": "<positive أو negative>",
  "summary": "<ملخص 5-6 أسطر بأسلوب إنساني مباشر: هل ميزانيتك تكفي؟ كم تحتاج فعلياً؟ ما يقلقني؟ ما الذي يحدد نجاحك؟>",
  "market_demand": "<منخفض/متوسط/عالي/عالي جداً>",
  "competition": "<منخفضة/متوسطة/عالية/عالية جداً>",
  "cost_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "risk_level": "<منخفض/متوسط/عالي/عالي جداً>",
  "market_analysis": {
    "market_size": "<حجم السوق لـ ${cityName} بأرقام وتقدير قيمته>",
    "target_audience": "<وصف تفصيلي للجمهور: من هم، أعمارهم، دخلهم، سلوكهم>",
    "buying_patterns": "<أنماط الشراء: متى يشترون، كم مرة، كم ينفقون>",
    "seasonality": "<الموسمية: أشهر الذروة وأشهر الركود ولماذا>",
    "expected_market_share": "<النسبة الواقعية مع تبرير>",
    "growth_potential": "<النمو على 5 سنوات مع تبرير>",
    "demand_drivers": ["<عامل يرفع الطلب>", "<عامل آخر>", "<عامل ثالث>"],
    "market_gaps": ["<فجوة في السوق تقدر تستغلها>", "<فجوة أخرى>"],
    "competitors": [
      {"name": "<اسم سلسلة حقيقية ظهرت في البحث>", "market_position": "<موقعها في السوق: رائدة/قوية/متوسطة>", "strength": "<أبرز قوة محددة>", "weakness": "<ثغرة محددة تقدر تستغلها>", "price_range": "<فئة أسعارها>"},
      {"name": "<اسم سلسلة حقيقية ثانية>", "market_position": "<موقعها>", "strength": "<قوة محددة>", "weakness": "<ثغرة محددة>", "price_range": "<فئة الأسعار>"},
      {"name": "<اسم سلسلة حقيقية ثالثة>", "market_position": "<موقعها>", "strength": "<قوة محددة>", "weakness": "<ثغرة محددة>", "price_range": "<فئة الأسعار>"}
    ]
  },
  "financial_analysis": {
    "setup_costs": {"rent_deposit": 0, "renovation": 0, "equipment": 0, "licenses": 0, "initial_inventory": 0, "marketing_launch": 0, "working_capital": 0, "total": 0},
    "setup_costs_notes": "<شرح من سطرين: ما أكبر بند ولماذا، وأين يمكن توفير التكاليف>",
    "equipment_breakdown": [
      {"item": "<اسم بند فرعي من بند المعدات والأثاث، مناسب لنوع هذا المشروع تحديداً>", "cost": 0},
      {"item": "<بند فرعي آخر>", "cost": 0},
      {"item": "<بند فرعي آخر>", "cost": 0},
      {"item": "<بند فرعي آخر>", "cost": 0}
    ],
    "monthly_costs": {"rent": 0, "salaries": 0, "utilities": 0, "materials": 0, "marketing": 0, "maintenance": 0, "other": 0, "total": 0},
    "monthly_costs_notes": "<شرح من سطرين: أثقل بند شهري وكيف تتحكم فيه>",
    "salary_breakdown": [
      {"role": "<مسمى وظيفي>", "count": <عدد>, "monthly_each": <راتب الواحد>},
      {"role": "<مسمى وظيفي>", "count": <عدد>, "monthly_each": <راتب الواحد>}
    ],
    "revenue_projection": {"month_1": 0, "month_3": 0, "month_6": 0, "month_12": 0, "year_2_monthly": 0, "year_3_monthly": 0},
    "revenue_notes": "<شرح من سطرين: كيف ينمو الدخل ولماذا، وما الافتراض الأساسي>",
    "break_even_months": 0,
    "roi_percentage": 0,
    "annual_profit_year1": 0,
    "annual_profit_year3": 0,
    "daily_target": {"customers_per_day": <عدد العملاء المطلوب يومياً للربح>, "average_ticket": <متوسط فاتورة العميل>}
  },
  "swot": {
    "strengths": ["<قوة 1>", "<قوة 2>", "<قوة 3>", "<قوة 4>"],
    "weaknesses": ["<ضعف 1>", "<ضعف 2>", "<ضعف 3>"],
    "opportunities": ["<فرصة 1>", "<فرصة 2>", "<فرصة 3>"],
    "threats": ["<تهديد 1>", "<تهديد 2>", "<تهديد 3>"]
  },
  "recommendations": [
    {"title": "<عنوان التوصية>", "detail": "<شرح عملي من سطرين كيف تنفّذها ولماذا مهمة>", "priority": "<عالية/متوسطة>"},
    {"title": "<عنوان>", "detail": "<شرح عملي>", "priority": "<الأولوية>"},
    {"title": "<عنوان>", "detail": "<شرح عملي>", "priority": "<الأولوية>"},
    {"title": "<عنوان>", "detail": "<شرح عملي>", "priority": "<الأولوية>"},
    {"title": "<عنوان>", "detail": "<شرح عملي>", "priority": "<الأولوية>"}
  ],
  "kpis": [
    {"name": "<مؤشر تشغيلي قابل للقياس فعلياً>", "target": "<قيمة رقمية واقعية>", "description": "<لماذا هذا المؤشر مهم وكيف يُقاس>"},
    {"name": "<مؤشر تشغيلي>", "target": "<قيمة واقعية>", "description": "<شرح>"},
    {"name": "<مؤشر تشغيلي>", "target": "<قيمة واقعية>", "description": "<شرح>"},
    {"name": "<مؤشر تشغيلي>", "target": "<قيمة واقعية>", "description": "<شرح>"}
  ],
  "risk_analysis": [
    {"risk": "<مخاطرة>", "description": "<شرح تفصيلي للمخاطرة وكيف تظهر>", "probability": "<منخفض/متوسط/عالي>", "impact": "<طفيف/متوسط/شديد>", "mitigation": "<خطة عملية ملموسة لتفادي المخاطرة>", "warning_signs": "<علامات مبكرة تنذر بهذه المخاطرة>"},
    {"risk": "<مخاطرة>", "description": "<شرح تفصيلي>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة عملية>", "warning_signs": "<علامات مبكرة>"},
    {"risk": "<مخاطرة>", "description": "<شرح تفصيلي>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة عملية>", "warning_signs": "<علامات مبكرة>"},
    {"risk": "<مخاطرة>", "description": "<شرح تفصيلي>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة عملية>", "warning_signs": "<علامات مبكرة>"},
    {"risk": "<مخاطرة>", "description": "<شرح تفصيلي>", "probability": "<قيمة>", "impact": "<قيمة>", "mitigation": "<خطة عملية>", "warning_signs": "<علامات مبكرة>"}
  ],
  "is_physical_location": <true إذا المشروع يحتاج موقع فيزيائي (محل، مطعم، صالون...) | false إذا أونلاين أو خدمة عن بُعد أو تطبيق>,
  "locations": {
    "best": {"name": "<حي حقيقي في ${cityName}>", "score": <0-100>, "reason": "<شرح>"},
    "worst": {"name": "<حي حقيقي>", "score": <0-100>, "reason": "<شرح>"}
  },
}`;

    // ═══ الاستدعاء الثاني: الخطة والتفاصيل ═══
    const promptPlan = `أنت خبير استثماري سعودي تكمل دراسة جدوى لهذا المشروع. ركّز على الخطة التنفيذية والتفاصيل العملية، مبنية على بحث فعلي.

${projectContext}

اعتمد على معرفتك بالتراخيص والتصاريح المطلوبة لهذا النوع من المشاريع في السعودية وجهات إصدارها، وأسعار السوق للمنتجات والخدمات المشابهة.

${styleGuide}

${adaptEngine}

قواعد:
- الخطة التنفيذية: 3 مراحل واقعية (1-30، 31-60، 61-90 يوم)، كل مرحلة مهام عملية ملموسة.
- التسعير: 4 منتجات/خدمات رئيسية، لكل واحد سعر بيع وتكلفة وهامش ربح، أسعار واقعية مبنية على بحثك.
- العميل المثالي: صفه بدقة (العمر، الدخل، السلوك، أين تجده).
- التراخيص: التصاريح الفعلية الحديثة المطلوبة في السعودية مع جهة الإصدار، من بحثك.
- التميّز: 3 طرق عملية ملموسة للتميّز عن المنافسين.
- اكتب بالعربية فقط.

أرجع النتيجة بصيغة JSON فقط (بدون أي نص قبله أو بعده، بدون علامات markdown):

{
  "action_plan": [
    {"phase": "اليوم 1-30", "title": "<عنوان المرحلة>", "tasks": ["<مهمة>", "<مهمة>", "<مهمة>", "<مهمة>"]},
    {"phase": "اليوم 31-60", "title": "<عنوان المرحلة>", "tasks": ["<مهمة>", "<مهمة>", "<مهمة>", "<مهمة>"]},
    {"phase": "اليوم 61-90", "title": "<عنوان المرحلة>", "tasks": ["<مهمة>", "<مهمة>", "<مهمة>", "<مهمة>"]}
  ],
  "pricing": {
    "items": [
      {"name": "<منتج/خدمة>", "price": "<سعر البيع بالريال>", "cost": "<التكلفة بالريال>", "margin": "<هامش الربح %>"},
      {"name": "<منتج/خدمة>", "price": "<سعر>", "cost": "<تكلفة>", "margin": "<هامش %>"},
      {"name": "<منتج/خدمة>", "price": "<سعر>", "cost": "<تكلفة>", "margin": "<هامش %>"},
      {"name": "<منتج/خدمة>", "price": "<سعر>", "cost": "<تكلفة>", "margin": "<هامش %>"}
    ],
    "note": "<ملاحظة عن استراتيجية التسعير بأسلوب إنساني>"
  },
  "break_even_detail": {
    "months": <عدد الأشهر>,
    "explanation": "<شرح إنساني مبسّط: متى يبدأ المشروع يغطّي تكاليفه ولماذا>"
  },
  "ideal_customer": {
    "age_group": "<الفئة العمرية>",
    "income_level": "<مستوى الدخل>",
    "behavior": "<نمط الحياة والسلوك الشرائي>",
    "where_to_reach": "<أين تجده وكيف توصل له تسويقياً>"
  },
  "licenses_needed": [
    {"name": "<اسم الترخيص>", "issuer": "<جهة الإصدار>"},
    {"name": "<اسم الترخيص>", "issuer": "<جهة الإصدار>"},
    {"name": "<اسم الترخيص>", "issuer": "<جهة الإصدار>"}
  ],
  "differentiation": [
    "<طريقة عملية للتميّز>",
    "<طريقة عملية للتميّز>",
    "<طريقة عملية للتميّز>"
  ]
}`;

    // ═══ مهلة كل مزوّد ذكاء اصطناعي (ثواني × 1000) ═══
    const AI_TIMEOUT_MS = 38000;

    // ═══ دالة مساعدة: إرسال طلب JSON مع مهلة وإمكانية الإلغاء ═══
    async function postJSON(name, url, headers, body, ms, outerSignal) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), ms);
      const onAbort = () => ctrl.abort();
      if (outerSignal) {
        if (outerSignal.aborted) ctrl.abort();
        else outerSignal.addEventListener("abort", onAbort, { once: true });
      }
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(body),
          signal: ctrl.signal
        });
        if (!response.ok) {
          const errText = await response.text();
          console.error(name + " Error:", response.status, errText.substring(0, 200));
          throw new Error(name + "_FAIL_" + response.status);
        }
        return await response.json();
      } finally {
        clearTimeout(timer);
        if (outerSignal) outerSignal.removeEventListener("abort", onAbort);
      }
    }

    // ═══ Gemini ═══
    async function callGemini(userPrompt, signal) {
      const model = "gemini-flash-latest";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const data = await postJSON("GEMINI", url, {}, {
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 8000, responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 } }
      }, AI_TIMEOUT_MS, signal);
      const cand = data.candidates?.[0];
      const text = cand?.content?.parts?.map(p => p.text || "").join("") || "";
      if (!text) throw new Error("GEMINI_FAIL_EMPTY");
      const parsed = extractJSON(text);
      if (!parsed) {
        console.error("Gemini parse failed. finishReason=" + cand?.finishReason + " textLength=" + text.length);
        throw new Error("GEMINI_FAIL_PARSE");
      }
      return parsed;
    }

    // ═══ أي مزوّد بصيغة OpenAI (Cerebras / Groq / Z.ai) ═══
    async function callChat(name, url, key, model, userPrompt, signal) {
      if (!key) throw new Error(name + "_NO_KEY");
      const data = await postJSON(name, url, { "Authorization": `Bearer ${key}` }, {
        model,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.35,
        max_tokens: 8000,
        response_format: { type: "json_object" }
      }, AI_TIMEOUT_MS, signal);
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error(name + "_FAIL_EMPTY");
      const parsed = extractJSON(text);
      if (!parsed) throw new Error(name + "_FAIL_PARSE");
      return parsed;
    }

    // ═══ دالة البحث الحي عبر Linkup ═══
    async function searchLinkup(query) {
      const linkupKey = process.env.LINKUP_API_KEY;
      if (!linkupKey) return null;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      try {
        const response = await fetch("https://api.linkup.so/v1/search", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${linkupKey}` },
          body: JSON.stringify({
            q: query,
            depth: "deep",
            outputType: "searchResults",
            includeImages: false
          }),
          signal: ctrl.signal
        });
        clearTimeout(timer);
        if (!response.ok) {
          console.error("Linkup Error:", response.status);
          return null;
        }
        const data = await response.json();
        const results = data.results || [];
        console.log("Linkup query '" + query.substring(0, 50) + "': " + results.length + " results");
        return results.slice(0, 5).map(r => ({
          title: (r.name || r.title || "").substring(0, 100),
          snippet: (r.content || r.snippet || "").substring(0, 350),
          url: r.url || ""
        }));
      } catch (e) {
        clearTimeout(timer);
        console.error("Linkup exception:", e.message);
        return null;
      }
    }

    // ═══ دالة البحث الحي عبر Tavily — بديل/رديف مجاني لـLinkup (1000 استعلام مجاني شهرياً، بدون بطاقة) ═══
    async function searchTavily(query) {
      const tavilyKey = process.env.TAVILY_API_KEY;
      if (!tavilyKey) return null;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      try {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          // نرسل المفتاح بالطريقتين (body + header) لتفادي أي فرق بتوثيق Tavily الحالي
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tavilyKey}` },
          body: JSON.stringify({
            api_key: tavilyKey,
            query,
            search_depth: "basic", // 1 كريدت فقط لكل استعلام — يحافظ على الحصة المجانية
            max_results: 5,
            include_answer: false
          }),
          signal: ctrl.signal
        });
        clearTimeout(timer);
        if (!response.ok) {
          console.error("Tavily Error:", response.status);
          return null;
        }
        const data = await response.json();
        const results = data.results || [];
        console.log("Tavily query '" + query.substring(0, 50) + "': " + results.length + " results");
        return results.slice(0, 5).map(r => ({
          title: (r.title || "").substring(0, 100),
          snippet: (r.content || "").substring(0, 350),
          url: r.url || ""
        }));
      } catch (e) {
        clearTimeout(timer);
        console.error("Tavily exception:", e.message);
        return null;
      }
    }

    // ═══ تدمج نتائج Linkup وTavily معاً لكل استعلام — تعمل بالتوازي، ولا تفشل الاثنتين إلا لو فشل المزوّدان معاً ═══
    async function searchCombined(query) {
      const [linkupResults, tavilyResults] = await Promise.all([
        searchLinkup(query),
        searchTavily(query)
      ]);
      const combined = [...(linkupResults || []), ...(tavilyResults || [])];
      if (combined.length === 0) return null;
      // إزالة التكرار حسب الرابط
      const seen = new Set();
      const deduped = combined.filter(r => {
        if (!r.url || seen.has(r.url)) return false;
        seen.add(r.url);
        return true;
      });
      // ترتيب النتائج المدمجة: التي تحتوي أرقاماً مالية أولاً (الأكثر فائدة للتحليل)
      const numScore = (t) => {
        const txt = (t.snippet || "") + (t.title || "");
        let s = 0;
        if (/\d{2,}/.test(txt)) s += 2;
        if (/(ريال|ألف|مليون|تكلفة|سعر|إيجار|رأس مال|٪|%)/.test(txt)) s += 3;
        if (/(2025|2026)/.test(txt)) s += 1;
        return s;
      };
      deduped.sort((a, b) => numScore(b) - numScore(a));
      return deduped.slice(0, 6);
    }

    // ═══ المرحلة 1: أسئلة بحث جاهزة (بدون استدعاء ذكاء اصطناعي لتوفير الوقت) ═══
    async function generateResearchQueries(idea, sector, city, budget) {
      const shortIdea = String(idea).substring(0, 80);
      return [
        `تكلفة تأسيس ${shortIdea} ${city} 2026 ريال سعودي`,
        `${sector} ${city} السعودية منافسين أسماء حقيقية`,
        `${shortIdea} السوق السعودي حجم الطلب 2026`,
        `تراخيص ${sector} السعودية الشروط 2026`
      ];
    }

    // ═══ المرحلة 2: بحث عميق متوازي لكل سؤال ═══
    async function deepResearch(queries) {
      console.log("Starting deep research on " + queries.length + " queries...");
      const searches = await Promise.all(queries.map(q => searchCombined(q)));
      const validResults = [];
      searches.forEach((results, i) => {
        if (results && results.length > 0) {
          validResults.push({ query: queries[i], results });
        }
      });
      console.log("Deep research: " + validResults.length + "/" + queries.length + " queries returned data");
      return validResults;
    }

    // ═══ المرحلة 3: تجميع نتائج البحث في سياق منظم ═══
    function buildResearchContext(researchData) {
      if (!researchData || researchData.length === 0) {
        return { context: "", hasData: false };
      }
      let context = "\n\n═══════ نتائج البحث الحقيقي من الإنترنت ═══════\n";
      context += "هذه معلومات فعلية تم البحث عنها قبل دقائق. اعتمد عليها كمصدر أساسي في التحليل.\n";
      researchData.forEach((item, i) => {
        context += `\n--- بحث ${i+1}: ${item.query} ---\n`;
        item.results.forEach(r => {
          if (r.snippet) {
            context += `• ${r.snippet}\n`;
          }
        });
      });
      context += "\n══════════════════════════════════════\n";
      context += "تعليمات استخدام البحث:\n";
      context += "- استخرج الأرقام والأسماء الحقيقية من البحث وادمجها في تحليلك\n";
      context += "- المنافسون: استخدم الأسماء التي ظهرت في البحث\n";
      context += "- التكاليف والأسعار: استخدم الأرقام من البحث إن وُجدت\n";
      context += "- إذا تعارضت بياناتك الداخلية مع البحث، البحث أحدث وأدق\n";
      context += "- اذكر في recommendations إذا كنت اعتمدت على معلومة من البحث\n\n";

      // حد أقصى لطول السياق
      if (context.length > 8000) {
        context = context.substring(0, 8000) + "\n... [اقتُطعت بقية النتائج لحجم النص]\n";
        console.log("Research context truncated to 8000 chars");
      }
      return { context, hasData: true, dataPoints: researchData.length };
    }

    // ═══ استدعاء ذكي: نشغّل كل المزوّدين معاً ونأخذ أول رد صحيح، ونلغي الباقي ═══
    async function callAI(userPrompt) {
      const winner = new AbortController();
      const attempts = [
        callGemini(userPrompt, winner.signal),
        callChat("CEREBRAS", "https://api.cerebras.ai/v1/chat/completions", process.env.CEREBRAS_API_KEY, "gpt-oss-120b", userPrompt, winner.signal),
        callChat("GROQ", "https://api.groq.com/openai/v1/chat/completions", process.env.GROQ_API_KEY, "openai/gpt-oss-120b", userPrompt, winner.signal),
        callChat("ZAI", "https://api.z.ai/api/paas/v4/chat/completions", process.env.ZAI_API_KEY, "glm-4.5-flash", userPrompt, winner.signal)
      ];
      try {
        const result = await Promise.any(attempts);
        winner.abort();
        return result;
      } catch (e) {
        winner.abort();
        const errs = (e.errors || []).map(x => x.message).filter(m => !m.includes("NO_KEY"));
        console.error("All providers failed:", errs.join(" | "));
        throw new Error("ALL_PROVIDERS_FAILED: " + (errs[0] || e.message));
      }
    }

    console.log("═══ بدء التحليل بالبحث الحقيقي ═══");

    // المرحلة 1: توليد أسئلة بحث ذكية
    const researchQueries = await generateResearchQueries(idea, userSector, city, budgetNum);

    // المرحلة 2: بحث عميق
    const researchData = await deepResearch(researchQueries);

    // المرحلة 3: تجميع السياق
    const { context: searchContext, hasData, dataPoints } = buildResearchContext(researchData);
    if (hasData) {
      console.log("Research-driven analysis: " + dataPoints + " research points + " + searchContext.length + " chars");
    } else {
      console.log("WARNING: No research data, falling back to AI knowledge");
    }

    // حقن نتائج البحث الحي في الـ prompts
    const enrichedPromptCore = promptCore + searchContext;
    const enrichedPromptPlan = promptPlan + searchContext;

    const [coreData, planData] = await Promise.all([
      callAI(enrichedPromptCore),
      callAI(enrichedPromptPlan)
    ]);

    let merged = { ...coreData, ...planData };

    merged._budget = budgetNum;
    merged._sector = sector;
    const validated = validateFinancials(merged);
    delete validated._budget;
    delete validated._sector;

    console.log("Analysis complete");
    return Response.json(validated);

  } catch (error) {
    console.error("Server Error:", error.message);
    // ترجمة الأخطاء التقنية لرسائل واضحة
    let userMsg = "حدث خطأ في التحليل، حاول مرة أخرى";
    const msg = error.message || "";
    if (msg.includes("FAIL_PARSE")) {
      userMsg = "تعذّر تحليل المشروع - حاول مرة أخرى بعد لحظات";
    } else if (msg.includes("FAIL_EMPTY")) {
      userMsg = "لم يصل رد كامل من المحلّل - حاول مرة أخرى";
    } else if (msg.includes("aborted") || msg.includes("timeout")) {
      userMsg = "التحليل أخذ وقتاً أطول من المتوقع - حاول مرة أخرى";
    } else if (msg.includes("429") || msg.includes("rate")) {
      userMsg = "الخدمة مزدحمة الآن - حاول بعد دقيقة";
    } else if (msg.includes("ALL_PROVIDERS_FAILED")) {
      userMsg = "الخدمة مشغولة الآن - حاول مرة أخرى بعد لحظات";
    } else if (msg.includes("NO_KEY")) {
      userMsg = "إعدادات الخدمة غير مكتملة - اتصل بالدعم";
    }
    return Response.json({ error: userMsg, debug: msg }, { status: 500 });
  }
}

// ═══ استخراج JSON من نص قد يحتوي على زوائد ═══
function extractJSON(text) {
  // محاولة 1: تحليل مباشر
  try { return JSON.parse(text); } catch (e) {}

  // محاولة 2: إزالة علامات markdown
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(cleaned); } catch (e) {}

  // محاولة 3: استخراج أول كتلة { ... } متوازنة
  const start = cleaned.indexOf("{");
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') inStr = !inStr;
    if (inStr) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        const block = cleaned.substring(start, i + 1);
        try { return JSON.parse(block); } catch (e) { return null; }
      }
    }
  }
  return null;
}

// ═══ طبقة التحقق الرياضي — تفرض تطابق كل الأرقام ═══
function validateFinancials(result) {
  try {
    const fa = result.financial_analysis;
    if (!fa) return result;

    // 0) فحص العقلانية مقابل نطاقات القطاع المعروفة (للمشاريع الفيزيائية فقط)
    // المشاريع الرقمية تكاليفها مختلفة جذرياً عن نطاقات القطاعات التقليدية
    const sectorRanges = result._sector ? SECTOR_FINANCIALS[result._sector] : null;
    if (sectorRanges && result.is_physical_location !== false && fa.setup_costs) {
      const aiTotal = (fa.setup_costs.rent_deposit||0)+(fa.setup_costs.renovation||0)+(fa.setup_costs.equipment||0)+(fa.setup_costs.licenses||0)+(fa.setup_costs.initial_inventory||0)+(fa.setup_costs.marketing_launch||0)+(fa.setup_costs.working_capital||0);
      const min = sectorRanges.setup_total?.min || 0;
      const max = sectorRanges.setup_total?.max || Infinity;
      // لو AI طلع رقماً أقل من نصف الحد الأدنى أو أكثر من ضعف الأقصى = انحراف صارخ
      if (aiTotal > 0 && (aiTotal < min * 0.5 || aiTotal > max * 2)) {
        const target = aiTotal < min * 0.5 ? min : max;
        const ratio = target / aiTotal;
        ["rent_deposit","renovation","equipment","licenses","initial_inventory","marketing_launch","working_capital"].forEach(k => {
          if (typeof fa.setup_costs[k] === "number") fa.setup_costs[k] = Math.round(fa.setup_costs[k] * ratio);
        });
        result._sanity_note = "تم تعديل تكاليف التأسيس لتتوافق مع نطاقات القطاع المعروفة في السوق السعودي";
      }
    }

    // 1) تصحيح مجموع تكاليف التأسيس
    if (fa.setup_costs) {
      const sc = fa.setup_costs;
      sc.total = (sc.rent_deposit||0) + (sc.renovation||0) + (sc.equipment||0) +
                 (sc.licenses||0) + (sc.initial_inventory||0) + (sc.marketing_launch||0) +
                 (sc.working_capital||0);
    }

    // 1ب) مطابقة تفصيل المعدات مع بند equipment
    if (Array.isArray(result.equipment_breakdown) && result.equipment_breakdown.length && fa.setup_costs) {
      const breakdownSum = result.equipment_breakdown.reduce((s, x) => s + (x.cost || 0), 0);
      const equipmentValue = fa.setup_costs.equipment || 0;
      if (breakdownSum > 0 && equipmentValue > 0 && breakdownSum !== equipmentValue) {
        // نعدّل البنود الفرعية بنسبة بحيث يتطابق مجموعها مع بند equipment
        const ratio = equipmentValue / breakdownSum;
        result.equipment_breakdown.forEach(x => { x.cost = Math.round((x.cost || 0) * ratio); });
      }
    }

    // 2) تصحيح مجموع التكاليف الشهرية
    if (fa.monthly_costs) {
      const mc = fa.monthly_costs;
      mc.total = (mc.rent||0) + (mc.salaries||0) + (mc.utilities||0) +
                 (mc.materials||0) + (mc.marketing||0) + (mc.maintenance||0) +
                 (mc.other||0);
    }

    const setupTotal = fa.setup_costs?.total || 0;
    const monthlyTotal = fa.monthly_costs?.total || 0;
    const rp = fa.revenue_projection || {};
    const rev1 = rp.month_1 || 0, rev3 = rp.month_3 || 0;
    const rev6 = rp.month_6 || 0, rev12 = rp.month_12 || 0;
    const rev24 = rp.year_2_monthly || rev12;
    const rev36 = rp.year_3_monthly || rev24;

    if (monthlyTotal > 0) {
      // 3) متوسط الإيراد الشهري للسنة الأولى (تدرّج واقعي)
      const avgRevY1 = (rev1*2 + rev3*3 + rev6*3 + rev12*4) / 12;
      // 4) صافي الربح السنوي = (متوسط الإيراد - التكاليف) × 12 — رقم واحد محسوب
      fa.annual_profit_year1 = Math.round((avgRevY1 - monthlyTotal) * 12);
      const avgRevY3 = (rev24 + rev36) / 2;
      fa.annual_profit_year3 = Math.round((avgRevY3 - monthlyTotal) * 12);

      // 5) نقطة التعادل = التأسيس ÷ صافي الربح الشهري عند الاستقرار — رقم واحد
      const stableMonthlyProfit = rev12 - monthlyTotal;
      if (stableMonthlyProfit > 0 && setupTotal > 0) {
        let be = Math.ceil(setupTotal / stableMonthlyProfit);
        if (be < 1) be = 1;
        if (be > 120) be = 120;
        fa.break_even_months = be;
        // فرض نفس الرقم على break_even_detail (يمنع التناقض بين الاستدعاءين)
        if (result.break_even_detail) {
          result.break_even_detail.months = be;
        }
      } else {
        // المشروع لا يربح شهرياً = لا توجد نقطة تعادل واقعية
        fa.break_even_months = 0;
        if (result.break_even_detail) result.break_even_detail.months = 0;
      }

      // 6) ROI = (صافي ربح السنة الأولى ÷ رأس المال) × 100 — محسوب
      if (setupTotal > 0) {
        fa.roi_percentage = Math.round((fa.annual_profit_year1 / setupTotal) * 100);

        // 6ب) لو ROI مبالغ (> 150%) ومتوسط الإيرادات أكبر من 2x الإيراد المستقر، نصحّح
        // السبب: الإيرادات الأولية كانت غير واقعية (مشروع جديد ما يحقق إيراد مستقر من الشهر الأول)
        if (fa.roi_percentage > 150 && rev12 > 0) {
          const expectedAvgRatio = avgRevY1 / rev12;
          // التدرّج الواقعي: المتوسط لازم يكون 55-70% من إيراد الشهر 12، مو 90%+
          if (expectedAvgRatio > 0.75) {
            // إعادة تدرّج الإيرادات بشكل واقعي
            const newRev1 = Math.round(rev12 * 0.25);
            const newRev3 = Math.round(rev12 * 0.45);
            const newRev6 = Math.round(rev12 * 0.70);
            rp.month_1 = newRev1;
            rp.month_3 = newRev3;
            rp.month_6 = newRev6;
            // إعادة حساب المتوسط والربح والـ ROI
            const newAvgY1 = (newRev1*2 + newRev3*3 + newRev6*3 + rev12*4) / 12;
            fa.annual_profit_year1 = Math.round((newAvgY1 - monthlyTotal) * 12);
            fa.roi_percentage = Math.round((fa.annual_profit_year1 / setupTotal) * 100);
          }
        }
      }
    }

    // 7) فحص منطق "الميزانية كافية / غير كافية" — يعتمد على الأرقام فقط
    const budget = result._budget || 0;
    if (budget > 0 && setupTotal > 0) {
      const enough = budget >= setupTotal;

      // كلمات تدل على أن النص يزعم عدم كفاية الميزانية
      const claimsInsufficient = (txt) => txt && (
        txt.includes("لا تكفي") || txt.includes("غير كافية") ||
        txt.includes("لا تغطي") || txt.includes("أقل من") ||
        txt.includes("إضافية") || txt.includes("عجز") || txt.includes("ينقص")
      );

      if (enough) {
        // الميزانية تكفي فعلياً — نصحّح أي زعم بعكس ذلك
        const surplus = budget - setupTotal;
        const wrongDecision = claimsInsufficient(result.decision);
        const wrongSummary = claimsInsufficient(result.summary);

        if (wrongDecision) {
          result.decision = "ميزانيتك كافية لتأسيس المشروع";
          if (result.decision_type === "negative") result.decision_type = "positive";
        }
        if (wrongSummary || wrongDecision) {
          // نعيد كتابة بداية الملخص بالأرقام الصحيحة
          result.summary = "ميزانيتك البالغة " + numWithCommas(budget) +
            " ريال تكفي لتغطية تكلفة التأسيس المقدّرة بـ " + numWithCommas(setupTotal) +
            " ريال، مع فائض قدره " + numWithCommas(surplus) +
            " ريال يمكن استخدامه كرأس مال احتياطي يقوّي وضع مشروعك.";
        }
        // مكافأة الميزانية الفائضة — الفائض الكبير عامل قوة حقيقي يرفع النقاط
        const surplusRatio = surplus / setupTotal; // نسبة الفائض إلى التأسيس
        const currentScore = result.score || 50;
        let scoreBonus = 0;
        if (surplusRatio >= 1.5) scoreBonus = 20;       // فائض 150%+ (ميزانية 2.5x التأسيس)
        else if (surplusRatio >= 1.0) scoreBonus = 15;  // فائض 100% (ميزانية 2x التأسيس)
        else if (surplusRatio >= 0.5) scoreBonus = 10;  // فائض 50%
        else if (surplusRatio >= 0.25) scoreBonus = 6;  // فائض 25%
        else if (surplusRatio > 0) scoreBonus = 3;      // فائض بسيط

        // نطبق المكافأة بحد أقصى 90 (نترك مجال للمشاريع الممتازة)
        const newScore = Math.min(90, currentScore + scoreBonus);
        if (newScore > currentScore) {
          result.score = newScore;
        }
      } else {
        // الميزانية فعلاً لا تكفي — نتأكد أن الملخص يوضّح العجز الصحيح
        const shortage = setupTotal - budget;
        result.summary = "ميزانيتك البالغة " + numWithCommas(budget) +
          " ريال لا تكفي لتغطية تكلفة التأسيس المقدّرة بـ " + numWithCommas(setupTotal) +
          " ريال؛ تحتاج إلى " + numWithCommas(shortage) +
          " ريال إضافية. " + (result.summary || "");
      }
    }

    return result;
  } catch (e) {
    console.error("Validation error:", e.message);
    return result;
  }
}
