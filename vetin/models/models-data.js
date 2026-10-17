// models/models-data.js — OTOMATİK ÜRETİLDİ, elle düzenlemeyin.
// Kaynak: models/model_*.json · Üretmek için: node tools/build-models-data.js
// Hazır model galerisi (models-gallery.js) verileri buradan okur; böylece sayfa
// file:// ile açıldığında da modeller yüklenebilir.
window.VETIN_MODELS = {
  "model_1": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Konsol kiriş – tekil yük",
        "en": "Cantilever – point load",
        "ar": "كمرة كابولية – حمل مركز",
        "bg": "Конзола – съсредоточена сила",
        "bn": "ক্যান্টিলিভার – বিন্দু লোড",
        "cn": "悬臂梁 – 集中荷载",
        "de": "Kragträger – Einzellast",
        "dz": "ཕྱིར་འཐོན་གདུང་མ – གནད་དོན་ཁུར་བ",
        "el": "Πρόβολος – συγκεντρωμένο φορτίο",
        "es": "Viga en voladizo – carga puntual",
        "fa": "تیر طره‌ای – بار متمرکز",
        "fr": "Console – charge ponctuelle",
        "he": "זיז – עומס מרוכז",
        "hi": "कैंटिलीवर धरन – बिंदु भार",
        "hy": "Կոնսոլ – կենտրոնացված ուժ",
        "id": "Balok kantilever – beban terpusat",
        "it": "Mensola – carico concentrato",
        "ja": "片持ちはり – 集中荷重",
        "ka": "კონსოლი – შეყურსული ძალა",
        "ko": "캔틸레버 보 – 집중하중",
        "ky": "Консолдук балка – топтолгон күч",
        "my": "ကန်တီလီဗာ ရက်မ – အမှတ်ဝန်",
        "ne": "क्यान्टिलिभर बिम – बिन्दु भार",
        "pt": "Viga em balanço – carga concentrada",
        "ro": "Consolă – forță concentrată",
        "ru": "Консоль – сосредоточенная сила",
        "sl": "Konzola – točkovna sila",
        "sq": "Tra konsol – forcë e përqendruar",
        "tg": "Консол – қувваи мутамарказ",
        "th": "คานยื่น – แรงกระทำเป็นจุด",
        "tl": "Cantilever – point load",
        "ur": "کینٹیلیور – مرکوز لوڈ",
        "uz": "Konsol – toʻplangan kuch"
      },
      "objective": {
        "tr": "Ankastre mesnette moment tepkisi oluşur; yükün ötesinde V = M = 0.",
        "en": "A moment reaction develops at the fixed end; beyond the load V = M = 0.",
        "ar": "ينشأ رد فعل عزمي عند الطرف المثبت؛ بعد الحمل V = M = 0.",
        "bg": "В запъването възниква реактивен момент; след товара V = M = 0.",
        "bn": "আবদ্ধ প্রান্তে একটি ভ্রামক প্রতিক্রিয়া সৃষ্টি হয়; লোডের পরে V = M = 0।",
        "cn": "固定端产生反力矩；荷载以外 V = M = 0。",
        "de": "An der Einspannung entsteht ein Einspannmoment; jenseits der Last ist V = M = 0.",
        "dz": "གཏན་བཟུང་རྟེན་ལུ་ སྐོར་ཤུགས་ཀྱི་ལན་ཤུགས་ཅིག་ཐོནམ་ཨིན། ཁུར་བའི་ཕར་ཁ་ V = M = 0།",
        "el": "Στην πάκτωση αναπτύσσεται ροπή αντίδρασης· πέρα από το φορτίο V = M = 0.",
        "es": "En el empotramiento aparece un momento de reacción; más allá de la carga V = M = 0.",
        "fa": "در تکیه‌گاه گیردار عکس‌العمل لنگر ایجاد می‌شود؛ پس از بار V = M = 0.",
        "fr": "Un moment de réaction apparaît à l'encastrement ; au-delà de la charge, V = M = 0.",
        "he": "בריתום נוצר מומנט ריאקציה; מעבר לעומס V = M = 0.",
        "hi": "स्थिर आधार पर आघूर्ण प्रतिक्रिया उत्पन्न होती है; भार के आगे V = M = 0।",
        "hy": "Կոշտ ամրակցումում առաջանում է մոմենտային հակազդեցություն. ուժից այն կողմ V = M = 0։",
        "id": "Reaksi momen timbul pada tumpuan jepit; di luar beban V = M = 0.",
        "it": "Nell'incastro nasce una reazione momento; oltre il carico V = M = 0.",
        "ja": "固定端にモーメント反力が生じます。荷重より先では V = M = 0。",
        "ka": "ხისტ ჩამაგრებაში წარმოიქმნება მომენტური რეაქცია; ძალის იქით V = M = 0.",
        "ko": "고정단에 모멘트 반력이 생깁니다. 하중 너머에서는 V = M = 0입니다.",
        "ky": "Катуу бекитүүдө моменттик реакция пайда болот; күчтөн ары V = M = 0.",
        "my": "ပုံသေထောက်ကန်မှုတွင် မိုမင့် တုံ့ပြန်အား ဖြစ်ပေါ်သည်။ ဝန်၏ ကျော်လွန်ရာတွင် V = M = 0။",
        "ne": "स्थिर आधारमा आघूर्ण प्रतिक्रिया उत्पन्न हुन्छ; भारभन्दा पर V = M = 0।",
        "pt": "No engaste surge uma reação de momento; além da carga V = M = 0.",
        "ro": "În încastrare apare un moment de reacțiune; dincolo de forță V = M = 0.",
        "ru": "В заделке возникает реактивный момент; за точкой приложения силы V = M = 0.",
        "sl": "V vpetju nastane reakcijski moment; za silo je V = M = 0.",
        "sq": "Në ngulitje lind një moment reaktiv; përtej ngarkesës V = M = 0.",
        "tg": "Дар маҳкамкунии сахт моменти реактивӣ пайдо мешавад; берун аз сарбор V = M = 0.",
        "th": "ที่จุดรองรับแบบยึดแน่นเกิดโมเมนต์ปฏิกิริยา ถัดจากแรงออกไป V = M = 0",
        "tl": "May reaksyong moment sa fixed support; lampas sa karga, V = M = 0.",
        "ur": "فکسڈ سہارے پر ردِعمل مومنٹ پیدا ہوتا ہے؛ لوڈ سے آگے V = M = 0۔",
        "uz": "Bikr mahkamlashda reaktiv moment hosil boʻladi; kuchdan keyin V = M = 0."
      },
      "level": "basic",
      "order": 3
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 3
    },
    "supports": [
      {
        "type": "fixed-support",
        "x": 0
      }
    ],
    "hinges": [],
    "concentratedLoads": [
      {
        "x": 1,
        "magnitude": 6,
        "angle": 1.5707963267948966
      }
    ],
    "distributedLoads": [],
    "trapezoidalLoads": [],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 6,
          "Mz": 6
        }
      ],
      "Mmax": 0,
      "Mmin": -6,
      "Vmax": 6,
      "Vmin": 0
    }
  },
  "model_2": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Basit kiriş – tekil yük",
        "en": "Simple beam – point load",
        "ar": "كمرة بسيطة – حمل مركز",
        "bg": "Проста греда – съсредоточена сила",
        "bn": "সরল বিম – বিন্দু লোড",
        "cn": "简支梁 – 集中荷载",
        "de": "Einfeldträger – Einzellast",
        "dz": "གདུང་མ་འཇམ་པ – གནད་དོན་ཁུར་བ",
        "el": "Αμφιέρειστη δοκός – συγκεντρωμένο φορτίο",
        "es": "Viga simplemente apoyada – carga puntual",
        "fa": "تیر ساده – بار متمرکز",
        "fr": "Poutre sur deux appuis – charge ponctuelle",
        "he": "קורה פשוטה – עומס מרוכז",
        "hi": "सरल धरन – बिंदु भार",
        "hy": "Պարզ հեծան – կենտրոնացված ուժ",
        "id": "Balok sederhana – beban terpusat",
        "it": "Trave semplicemente appoggiata – carico concentrato",
        "ja": "単純はり – 集中荷重",
        "ka": "მარტივი ძელი – შეყურსული ძალა",
        "ko": "단순보 – 집중하중",
        "ky": "Жөнөкөй балка – топтолгон күч",
        "my": "ရိုးရှင်းသော ရက်မ – အမှတ်ဝန်",
        "ne": "साधारण बिम – बिन्दु भार",
        "pt": "Viga simplesmente apoiada – carga concentrada",
        "ro": "Grindă simplu rezemată – forță concentrată",
        "ru": "Простая балка – сосредоточенная сила",
        "sl": "Prostoležeči nosilec – točkovna sila",
        "sq": "Tra i thjeshtë – forcë e përqendruar",
        "tg": "Тири оддӣ – қувваи мутамарказ",
        "th": "คานช่วงเดียวอย่างง่าย – แรงกระทำเป็นจุด",
        "tl": "Simpleng biga – point load",
        "ur": "سادہ بیم – مرکوز لوڈ",
        "uz": "Oddiy toʻsin – toʻplangan kuch"
      },
      "objective": {
        "tr": "Tepkileri ΣM ile bulun; tekil yük altında V sıçrar, M kırılır.",
        "en": "Find the reactions with ΣM; under a point load V jumps and M has a kink.",
        "ar": "أوجد ردود الفعل باستخدام ΣM؛ تحت الحمل المركز يقفز V وينكسر M.",
        "bg": "Намерете реакциите чрез ΣM; под съсредоточената сила V има скок, а M – чупка.",
        "bn": "ΣM দিয়ে প্রতিক্রিয়াগুলো নির্ণয় করুন; বিন্দু লোডের নিচে V লাফ দেয় এবং M-এ ভাঁজ তৈরি হয়।",
        "cn": "用 ΣM 求支座反力；集中荷载处 V 发生突变，M 出现转折。",
        "de": "Bestimmen Sie die Auflagerkräfte mit ΣM; unter einer Einzellast springt V und M hat einen Knick.",
        "dz": "ΣM གིས་ ལན་ཤུགས་ཚུ་འཚོལ། གནད་དོན་ཁུར་བའི་འོག་ལུ་ V མཆོངམ་ཨིནམ་དང་ M ལུ་ གུག་ས་ཅིག་ཡོདཔ་ཨིན།",
        "el": "Βρείτε τις αντιδράσεις με ΣM· κάτω από συγκεντρωμένο φορτίο η V παρουσιάζει άλμα και η M γωνία.",
        "es": "Halle las reacciones con ΣM; bajo una carga puntual V presenta un salto y M un quiebre.",
        "fa": "عکس‌العمل‌ها را با ΣM بیابید؛ زیر بار متمرکز V جهش دارد و M شکسته می‌شود.",
        "fr": "Déterminez les réactions avec ΣM ; sous une charge ponctuelle, V présente un saut et M un point anguleux.",
        "he": "מצאו את הריאקציות בעזרת ΣM; מתחת לעומס מרוכז יש ב-V קפיצה וב-M שבירה.",
        "hi": "ΣM से प्रतिक्रियाएँ ज्ञात करें; बिंदु भार के नीचे V में उछाल और M में मोड़ आता है।",
        "hy": "Հակազդեցությունները գտեք ΣM-ով. կենտրոնացված ուժի տակ V-ն թռիչք է կատարում, իսկ M-ը՝ բեկում։",
        "id": "Tentukan reaksi dengan ΣM; di bawah beban terpusat V melompat dan M membentuk patahan.",
        "it": "Trovare le reazioni con ΣM; sotto un carico concentrato V ha un salto e M un punto angoloso.",
        "ja": "ΣM で反力を求めます。集中荷重の位置で V は不連続に変化し、M は折れ曲がります。",
        "ka": "რეაქციები იპოვეთ ΣM-ით; შეყურსული ძალის ქვეშ V ნახტომს აკეთებს, M კი – გარდატეხას.",
        "ko": "ΣM으로 반력을 구하세요. 집중하중 아래에서 V는 급변하고 M은 꺾입니다.",
        "ky": "Реакцияларды ΣM аркылуу табыңыз; топтолгон күчтүн астында V секирет, M сынат.",
        "my": "ΣM ဖြင့် တုံ့ပြန်အားများကို ရှာပါ။ အမှတ်ဝန်အောက်တွင် V ခုန်ပြောင်းပြီး M ချိုးကွေးသည်။",
        "ne": "ΣM बाट प्रतिक्रियाहरू पत्ता लगाउनुहोस्; बिन्दु भारमुनि V उफ्रन्छ र M मा मोड आउँछ।",
        "pt": "Determine as reações com ΣM; sob uma carga concentrada V sofre um salto e M apresenta um ponto anguloso.",
        "ro": "Determinați reacțiunile cu ΣM; sub o forță concentrată V are un salt, iar M o frântură.",
        "ru": "Найдите реакции из ΣM; под сосредоточенной силой V имеет скачок, а M – излом.",
        "sl": "Reakcije določite z ΣM; pod točkovno silo V skoči, M pa ima lom.",
        "sq": "Gjeni reaksionet me ΣM; nën forcën e përqendruar V kërcen dhe M thyhet.",
        "tg": "Реаксияҳоро бо ΣM ёбед; зери қувваи мутамарказ V ҷаҳиш мекунад ва M шикаста мешавад.",
        "th": "หาแรงปฏิกิริยาด้วย ΣM ใต้แรงกระทำเป็นจุด V กระโดดและ M หักมุม",
        "tl": "Hanapin ang mga reaksyon gamit ang ΣM; sa ilalim ng point load, tumatalon ang V at may kink ang M.",
        "ur": "ردِعمل ΣM سے معلوم کریں؛ مرکوز لوڈ کے نیچے V میں چھلانگ اور M میں موڑ آتا ہے۔",
        "uz": "Reaksiyalarni ΣM orqali toping; toʻplangan kuch ostida V sakraydi, M esa sinadi."
      },
      "level": "basic",
      "order": 1
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 3
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 3
      }
    ],
    "hinges": [],
    "concentratedLoads": [
      {
        "x": 1,
        "magnitude": 6,
        "angle": 1.5707963267948966
      }
    ],
    "distributedLoads": [],
    "trapezoidalLoads": [],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 2,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 4
        },
        {
          "x": 3,
          "Fy": 2
        }
      ],
      "Mmax": 4,
      "Mmin": 0,
      "Vmax": 4,
      "Vmin": -2
    }
  },
  "model_3": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Basit kiriş – düzgün yayılı yük",
        "en": "Simple beam – uniform load",
        "ar": "كمرة بسيطة – حمل موزع بانتظام",
        "bg": "Проста греда – равномерно разпределен товар",
        "bn": "সরল বিম – সুষম বিতরণকৃত লোড",
        "cn": "简支梁 – 均布荷载",
        "de": "Einfeldträger – Gleichstreckenlast",
        "dz": "གདུང་མ་འཇམ་པ – ཆ་སྙོམས་བགོ་བཤའ་ཁུར་བ",
        "el": "Αμφιέρειστη δοκός – ομοιόμορφο φορτίο",
        "es": "Viga simplemente apoyada – carga uniforme",
        "fa": "تیر ساده – بار گسترده یکنواخت",
        "fr": "Poutre sur deux appuis – charge uniforme",
        "he": "קורה פשוטה – עומס אחיד",
        "hi": "सरल धरन – एकसमान भार",
        "hy": "Պարզ հեծան – հավասարաչափ բաշխված բեռ",
        "id": "Balok sederhana – beban merata",
        "it": "Trave semplicemente appoggiata – carico uniforme",
        "ja": "単純はり – 等分布荷重",
        "ka": "მარტივი ძელი – თანაბრად განაწილებული დატვირთვა",
        "ko": "단순보 – 등분포하중",
        "ky": "Жөнөкөй балка – бир калыпта бөлүштүрүлгөн жүк",
        "my": "ရိုးရှင်းသော ရက်မ – ညီညာစွာ ဖြန့်ဝေဝန်",
        "ne": "साधारण बिम – एकसमान भार",
        "pt": "Viga simplesmente apoiada – carga uniformemente distribuída",
        "ro": "Grindă simplu rezemată – încărcare uniform distribuită",
        "ru": "Простая балка – равномерно распределённая нагрузка",
        "sl": "Prostoležeči nosilec – enakomerna zvezna obtežba",
        "sq": "Tra i thjeshtë – ngarkesë e shpërndarë njëtrajtësisht",
        "tg": "Тири оддӣ – сарбории баробар тақсимшуда",
        "th": "คานช่วงเดียวอย่างง่าย – น้ำหนักบรรทุกแผ่สม่ำเสมอ",
        "tl": "Simpleng biga – uniform na karga",
        "ur": "سادہ بیم – یکساں پھیلا ہوا لوڈ",
        "uz": "Oddiy toʻsin – tekis taqsimlangan yuk"
      },
      "objective": {
        "tr": "V doğrusal, M paraboliktir; M_max, V = 0 olan açıklık ortasındadır.",
        "en": "V is linear and M parabolic; M_max occurs at midspan where V = 0.",
        "ar": "V خطي وM قطع مكافئ؛ تحدث M_max في منتصف البحر حيث V = 0.",
        "bg": "V е линейна, а M – парабола; M_max е в средата на отвора, където V = 0.",
        "bn": "V রৈখিক এবং M পরাবৃত্তীয়; M_max স্প্যানের মাঝখানে, যেখানে V = 0।",
        "cn": "V 为线性，M 为抛物线；M_max 位于跨中 V = 0 处。",
        "de": "V verläuft linear, M parabelförmig; M_max liegt in Feldmitte, wo V = 0.",
        "dz": "V ཐིག་ཕྲེང་དང་ M འཕེན་ཐིག་ཨིན། M_max འདི་ V = 0 ཨིན་པའི་ བར་ཐག་གི་བར་ན་ཐོནམ་ཨིན།",
        "el": "Η V είναι γραμμική και η M παραβολική· η M_max εμφανίζεται στο μέσο του ανοίγματος, όπου V = 0.",
        "es": "V es lineal y M parabólico; M_max se produce en el centro del vano, donde V = 0.",
        "fa": "V خطی و M سهموی است؛ M_max در وسط دهانه، جایی که V = 0، رخ می‌دهد.",
        "fr": "V est linéaire et M parabolique ; M_max se situe à mi-travée, où V = 0.",
        "he": "V לינארי ו-M פרבולי; M_max מתקבל באמצע המפתח, היכן ש-V = 0.",
        "hi": "V रैखिक और M परवलयिक है; M_max मध्य-विस्तार पर होता है जहाँ V = 0।",
        "hy": "V-ն գծային է, M-ը՝ պարաբոլական. M_max-ը թռիչքի մեջտեղում է, որտեղ V = 0։",
        "id": "V linear dan M parabolik; M_max terjadi di tengah bentang, tempat V = 0.",
        "it": "V è lineare e M parabolico; M_max si ha in mezzeria, dove V = 0.",
        "ja": "V は一次、M は放物線です。M_max は V = 0 となるスパン中央で生じます。",
        "ka": "V წრფივია, M – პარაბოლური; M_max მალის შუაშია, სადაც V = 0.",
        "ko": "V는 직선, M은 포물선입니다. M_max는 V = 0인 경간 중앙에서 생깁니다.",
        "ky": "V сызыктуу, M параболалык; M_max V = 0 болгон аралыктын ортосунда болот.",
        "my": "V သည် မျဉ်းဖြောင့်၊ M သည် ပါရာဘိုလာ ဖြစ်သည်။ M_max သည် V = 0 ဖြစ်သော အလယ်အလျားတွင် ဖြစ်သည်။",
        "ne": "V रेखीय र M परवलयिक हुन्छ; M_max मध्य-विस्तारमा हुन्छ जहाँ V = 0।",
        "pt": "V é linear e M é parabólico; M_max ocorre a meio vão, onde V = 0.",
        "ro": "V este liniară, iar M parabolic; M_max apare la mijlocul deschiderii, unde V = 0.",
        "ru": "V изменяется линейно, M – по параболе; M_max находится в середине пролёта, где V = 0.",
        "sl": "V je linearna, M parabolična; M_max je na sredini razpona, kjer je V = 0.",
        "sq": "V është lineare dhe M parabolik; M_max ndodh në mes të hapësirës, ku V = 0.",
        "tg": "V хаттӣ ва M параболӣ аст; M_max дар миёнаи фосила, ки дар он V = 0 аст, рух медиҳад.",
        "th": "V เป็นเชิงเส้นและ M เป็นพาราโบลา M_max เกิดที่กึ่งกลางช่วงคานซึ่ง V = 0",
        "tl": "Linear ang V at parabolic ang M; nasa gitna ng span ang M_max, kung saan V = 0.",
        "ur": "V خطی اور M مکافی ہے؛ M_max اسپین کے وسط میں ہوتا ہے جہاں V = 0۔",
        "uz": "V chiziqli, M parabolik; M_max oraliq oʻrtasida, V = 0 boʻlgan joyda yuzaga keladi."
      },
      "level": "basic",
      "order": 2
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 3
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 3
      }
    ],
    "hinges": [],
    "concentratedLoads": [],
    "distributedLoads": [
      {
        "startX": 0,
        "endX": 3,
        "magnitude": -4
      }
    ],
    "trapezoidalLoads": [],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 2,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 6
        },
        {
          "x": 3,
          "Fy": 6
        }
      ],
      "Mmax": 4.5,
      "Mmin": 0,
      "Vmax": 6,
      "Vmin": -6
    }
  },
  "model_4": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Basit kiriş – üçgen yük",
        "en": "Simple beam – triangular load",
        "ar": "كمرة بسيطة – حمل مثلثي",
        "bg": "Проста греда – триъгълен товар",
        "bn": "সরল বিম – ত্রিভুজাকার লোড",
        "cn": "简支梁 – 三角形荷载",
        "de": "Einfeldträger – Dreieckslast",
        "dz": "གདུང་མ་འཇམ་པ – གྲུ་གསུམ་ཁུར་བ",
        "el": "Αμφιέρειστη δοκός – τριγωνικό φορτίο",
        "es": "Viga simplemente apoyada – carga triangular",
        "fa": "تیر ساده – بار مثلثی",
        "fr": "Poutre sur deux appuis – charge triangulaire",
        "he": "קורה פשוטה – עומס משולשי",
        "hi": "सरल धरन – त्रिकोणीय भार",
        "hy": "Պարզ հեծան – եռանկյուն բեռ",
        "id": "Balok sederhana – beban segitiga",
        "it": "Trave semplicemente appoggiata – carico triangolare",
        "ja": "単純はり – 三角形分布荷重",
        "ka": "მარტივი ძელი – სამკუთხა დატვირთვა",
        "ko": "단순보 – 삼각형 분포하중",
        "ky": "Жөнөкөй балка – үч бурчтуу жүк",
        "my": "ရိုးရှင်းသော ရက်မ – တြိဂံဝန်",
        "ne": "साधारण बिम – त्रिकोणीय भार",
        "pt": "Viga simplesmente apoiada – carga triangular",
        "ro": "Grindă simplu rezemată – încărcare triunghiulară",
        "ru": "Простая балка – треугольная нагрузка",
        "sl": "Prostoležeči nosilec – trikotna obtežba",
        "sq": "Tra i thjeshtë – ngarkesë trekëndore",
        "tg": "Тири оддӣ – сарбории секунҷа",
        "th": "คานช่วงเดียวอย่างง่าย – น้ำหนักบรรทุกรูปสามเหลี่ยม",
        "tl": "Simpleng biga – tatsulok na karga",
        "ur": "سادہ بیم – مثلثی لوڈ",
        "uz": "Oddiy toʻsin – uchburchak yuk"
      },
      "objective": {
        "tr": "V ikinci, M üçüncü derecedir; M_max, V = 0 olan x = L/√3 noktasındadır.",
        "en": "V is quadratic and M cubic; M_max occurs where V = 0, at x = L/√3.",
        "ar": "V من الدرجة الثانية وM من الدرجة الثالثة؛ تحدث M_max حيث V = 0، عند x = L/√3.",
        "bg": "V е квадратна, а M – кубична функция; M_max е там, където V = 0, при x = L/√3.",
        "bn": "V দ্বিঘাত এবং M ত্রিঘাত; M_max ঘটে যেখানে V = 0, অর্থাৎ x = L/√3-এ।",
        "cn": "V 为二次曲线，M 为三次曲线；M_max 位于 V = 0 处，即 x = L/√3。",
        "de": "V ist quadratisch, M kubisch; M_max liegt dort, wo V = 0, bei x = L/√3.",
        "dz": "V རིམ་པ་གཉིས་པ་དང་ M རིམ་པ་གསུམ་པ་ཨིན། M_max འདི་ V = 0 ཨིན་པའི་ x = L/√3 ལུ་ཐོནམ་ཨིན།",
        "el": "Η V είναι δευτεροβάθμια και η M τριτοβάθμια· η M_max εμφανίζεται όπου V = 0, στο x = L/√3.",
        "es": "V es cuadrática y M cúbico; M_max se produce donde V = 0, en x = L/√3.",
        "fa": "V درجه دو و M درجه سه است؛ M_max در جایی که V = 0، یعنی x = L/√3، رخ می‌دهد.",
        "fr": "V est du second degré et M du troisième ; M_max se situe là où V = 0, en x = L/√3.",
        "he": "V ריבועי ו-M קובי; M_max מתקבל היכן ש-V = 0, ב-x = L/√3.",
        "hi": "V द्विघाती और M त्रिघाती है; M_max वहाँ होता है जहाँ V = 0, अर्थात x = L/√3 पर।",
        "hy": "V-ն քառակուսային է, M-ը՝ խորանարդային. M_max-ը այնտեղ է, որտեղ V = 0, այսինքն x = L/√3 կետում։",
        "id": "V kuadratik dan M kubik; M_max terjadi saat V = 0, yaitu di x = L/√3.",
        "it": "V è quadratico e M cubico; M_max si ha dove V = 0, in x = L/√3.",
        "ja": "V は二次、M は三次です。M_max は V = 0 となる x = L/√3 で生じます。",
        "ka": "V კვადრატულია, M – კუბური; M_max იქაა, სადაც V = 0, ანუ x = L/√3-ზე.",
        "ko": "V는 2차, M은 3차입니다. M_max는 V = 0인 x = L/√3에서 생깁니다.",
        "ky": "V квадраттык, M кубдук; M_max V = 0 болгон жерде, x = L/√3 чекитинде болот.",
        "my": "V သည် ဒီဂရီ ၂၊ M သည် ဒီဂရီ ၃ ဖြစ်သည်။ M_max သည် V = 0 ဖြစ်သော x = L/√3 တွင် ဖြစ်သည်။",
        "ne": "V द्विघाती र M त्रिघाती हुन्छ; M_max त्यहाँ हुन्छ जहाँ V = 0, अर्थात् x = L/√3 मा।",
        "pt": "V é quadrático e M é cúbico; M_max ocorre onde V = 0, em x = L/√3.",
        "ro": "V este de gradul doi, iar M de gradul trei; M_max apare unde V = 0, la x = L/√3.",
        "ru": "V – квадратичная, M – кубическая функция; M_max находится там, где V = 0, при x = L/√3.",
        "sl": "V je kvadratna, M kubična; M_max je tam, kjer je V = 0, pri x = L/√3.",
        "sq": "V është e shkallës së dytë dhe M e shkallës së tretë; M_max ndodh ku V = 0, në x = L/√3.",
        "tg": "V квадратӣ ва M кубӣ аст; M_max дар ҷое рух медиҳад, ки V = 0, яъне дар x = L/√3.",
        "th": "V เป็นฟังก์ชันกำลังสองและ M เป็นกำลังสาม M_max เกิดที่ V = 0 คือที่ x = L/√3",
        "tl": "Quadratic ang V at cubic ang M; nasa V = 0 ang M_max, sa x = L/√3.",
        "ur": "V دو درجی اور M سہ درجی ہے؛ M_max وہاں ہوتا ہے جہاں V = 0، یعنی x = L/√3 پر۔",
        "uz": "V kvadratik, M kubik; M_max V = 0 boʻlgan joyda, x = L/√3 da yuzaga keladi."
      },
      "level": "intermediate",
      "order": 5
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 3
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 3
      }
    ],
    "hinges": [],
    "concentratedLoads": [],
    "distributedLoads": [],
    "trapezoidalLoads": [
      {
        "startX": 0,
        "endX": 3,
        "startMagnitude": 0,
        "endMagnitude": -2
      }
    ],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 1
        },
        {
          "x": 3,
          "Fy": 2
        }
      ],
      "Mmax": 1.154701,
      "Mmin": 0,
      "Vmax": 1,
      "Vmin": -2
    }
  },
  "model_5": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Basit kiriş – tekil moment",
        "en": "Simple beam – concentrated moment",
        "ar": "كمرة بسيطة – عزم مركز",
        "bg": "Проста греда – съсредоточен момент",
        "bn": "সরল বিম – কেন্দ্রীভূত ভ্রামক",
        "cn": "简支梁 – 集中力偶",
        "de": "Einfeldträger – Einzelmoment",
        "dz": "གདུང་མ་འཇམ་པ – གནད་དོན་སྐོར་ཤུགས",
        "el": "Αμφιέρειστη δοκός – συγκεντρωμένη ροπή",
        "es": "Viga simplemente apoyada – momento concentrado",
        "fa": "تیر ساده – لنگر متمرکز",
        "fr": "Poutre sur deux appuis – moment concentré",
        "he": "קורה פשוטה – מומנט מרוכז",
        "hi": "सरल धरन – संकेंद्रित आघूर्ण",
        "hy": "Պարզ հեծան – կենտրոնացված մոմենտ",
        "id": "Balok sederhana – momen terpusat",
        "it": "Trave semplicemente appoggiata – coppia concentrata",
        "ja": "単純はり – 集中モーメント",
        "ka": "მარტივი ძელი – შეყურსული მომენტი",
        "ko": "단순보 – 집중 모멘트",
        "ky": "Жөнөкөй балка – топтолгон момент",
        "my": "ရိုးရှင်းသော ရက်မ – စုစည်းမိုမင့်",
        "ne": "साधारण बिम – केन्द्रित आघूर्ण",
        "pt": "Viga simplesmente apoiada – momento concentrado",
        "ro": "Grindă simplu rezemată – moment concentrat",
        "ru": "Простая балка – сосредоточенный момент",
        "sl": "Prostoležeči nosilec – točkovni moment",
        "sq": "Tra i thjeshtë – moment i përqendruar",
        "tg": "Тири оддӣ – моменти мутамарказ",
        "th": "คานช่วงเดียวอย่างง่าย – โมเมนต์กระทำเป็นจุด",
        "tl": "Simpleng biga – concentrated moment",
        "ur": "سادہ بیم – مرکوز مومنٹ",
        "uz": "Oddiy toʻsin – toʻplangan moment"
      },
      "objective": {
        "tr": "Kuvvet çifti V'yi değiştirmez ama M'de sıçrama yapar.",
        "en": "A couple does not change V but causes a jump in M.",
        "ar": "المزدوجة لا تغيّر V لكنها تُحدث قفزة في M.",
        "bg": "Двойката сили не променя V, но предизвиква скок в M.",
        "bn": "একটি যুগল V পরিবর্তন করে না, কিন্তু M-এ লাফ সৃষ্টি করে।",
        "cn": "力偶不改变 V，但使 M 发生突变。",
        "de": "Ein Kräftepaar ändert V nicht, bewirkt aber einen Sprung in M.",
        "dz": "ཤུགས་ཟུང་གིས་ V མི་སྒྱུར་རུང་ M ནང་ མཆོང་ཐབས་ཅིག་བཟོཝ་ཨིན།",
        "el": "Ένα ζεύγος δυνάμεων δεν μεταβάλλει τη V, αλλά προκαλεί άλμα στη M.",
        "es": "Un par no modifica V, pero produce un salto en M.",
        "fa": "زوج نیرو V را تغییر نمی‌دهد اما در M جهش ایجاد می‌کند.",
        "fr": "Un couple ne modifie pas V mais provoque un saut de M.",
        "he": "זוג כוחות אינו משנה את V אך גורם לקפיצה ב-M.",
        "hi": "बल-युग्म V को नहीं बदलता, पर M में उछाल उत्पन्न करता है।",
        "hy": "Ուժազույգը չի փոխում V-ն, բայց թռիչք է առաջացնում M-ում։",
        "id": "Kopel tidak mengubah V, tetapi menyebabkan lompatan pada M.",
        "it": "Una coppia non modifica V ma provoca un salto in M.",
        "ja": "偶力は V を変えませんが、M に不連続な変化を生じさせます。",
        "ka": "ძალთა წყვილი V-ს არ ცვლის, მაგრამ M-ში ნახტომს იწვევს.",
        "ko": "우력은 V를 바꾸지 않지만 M에 급변을 일으킵니다.",
        "ky": "Күчтөр жуби V-ны өзгөртпөйт, бирок M-де секирик пайда кылат.",
        "my": "အားစုံတွဲသည် V ကို မပြောင်းလဲစေသော်လည်း M တွင် ခုန်ပြောင်းမှု ဖြစ်စေသည်။",
        "ne": "बल-युग्मले V परिवर्तन गर्दैन, तर M मा उफ्राइ ल्याउँछ।",
        "pt": "Um binário não altera V, mas provoca um salto em M.",
        "ro": "Un cuplu nu modifică V, dar produce un salt în M.",
        "ru": "Пара сил не меняет V, но вызывает скачок в M.",
        "sl": "Dvojica sil ne spremeni V, povzroči pa skok v M.",
        "sq": "Çifti i forcave nuk e ndryshon V, por shkakton kërcim në M.",
        "tg": "Ҷуфти қувваҳо V-ро тағйир намедиҳад, аммо дар M ҷаҳиш ба вуҷуд меорад.",
        "th": "แรงคู่ควบไม่เปลี่ยนค่า V แต่ทำให้ M กระโดด",
        "tl": "Hindi binabago ng couple ang V, pero nagpapatalon ito sa M.",
        "ur": "جوڑا (کپل) V کو نہیں بدلتا لیکن M میں چھلانگ پیدا کرتا ہے۔",
        "uz": "Juft kuch V ni oʻzgartirmaydi, lekin M da sakrash hosil qiladi."
      },
      "level": "basic",
      "order": 4
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 3
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 3
      }
    ],
    "hinges": [],
    "concentratedLoads": [],
    "distributedLoads": [],
    "trapezoidalLoads": [],
    "concentratedMoments": [
      {
        "x": 1,
        "magnitude": 3
      }
    ],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": -1
        },
        {
          "x": 3,
          "Fy": 1
        }
      ],
      "Mmax": 2,
      "Mmin": -1,
      "Vmax": 0,
      "Vmin": -1
    }
  },
  "model_6": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Basit kiriş – trapez yük",
        "en": "Simple beam – trapezoidal load",
        "ar": "كمرة بسيطة – حمل شبه منحرف",
        "bg": "Проста греда – трапецовиден товар",
        "bn": "সরল বিম – ট্র্যাপিজয়েডাল লোড",
        "cn": "简支梁 – 梯形荷载",
        "de": "Einfeldträger – Trapezlast",
        "dz": "གདུང་མ་འཇམ་པ – ཊེ་རེ་པི་ཟོ་ཌལ་ཁུར་བ",
        "el": "Αμφιέρειστη δοκός – τραπεζοειδές φορτίο",
        "es": "Viga simplemente apoyada – carga trapezoidal",
        "fa": "تیر ساده – بار ذوزنقه‌ای",
        "fr": "Poutre sur deux appuis – charge trapézoïdale",
        "he": "קורה פשוטה – עומס טרפז",
        "hi": "सरल धरन – समलंबी भार",
        "hy": "Պարզ հեծան – սեղանաձև բեռ",
        "id": "Balok sederhana – beban trapesium",
        "it": "Trave semplicemente appoggiata – carico trapezoidale",
        "ja": "単純はり – 台形分布荷重",
        "ka": "მარტივი ძელი – ტრაპეციული დატვირთვა",
        "ko": "단순보 – 사다리꼴 분포하중",
        "ky": "Жөнөкөй балка – трапеция түрүндөгү жүк",
        "my": "ရိုးရှင်းသော ရက်မ – ထရပီဇွိုက် ဝန်",
        "ne": "साधारण बिम – समलम्ब भार",
        "pt": "Viga simplesmente apoiada – carga trapezoidal",
        "ro": "Grindă simplu rezemată – încărcare trapezoidală",
        "ru": "Простая балка – трапециевидная нагрузка",
        "sl": "Prostoležeči nosilec – trapezna obtežba",
        "sq": "Tra i thjeshtë – ngarkesë trapezoidale",
        "tg": "Тири оддӣ – сарбории трапетсиявӣ",
        "th": "คานช่วงเดียวอย่างง่าย – น้ำหนักบรรทุกรูปสี่เหลี่ยมคางหมู",
        "tl": "Simpleng biga – trapezoidal na karga",
        "ur": "سادہ بیم – ٹریپیزائیڈل لوڈ",
        "uz": "Oddiy toʻsin – trapetsiyasimon yuk"
      },
      "objective": {
        "tr": "Trapez yükü dikdörtgen + üçgen olarak ayırıp bileşkeleri bulun.",
        "en": "Split the trapezoid into a rectangle and a triangle to find the resultants.",
        "ar": "قسّم شبه المنحرف إلى مستطيل ومثلث لإيجاد المحصلات.",
        "bg": "Разделете трапеца на правоъгълник и триъгълник, за да намерите равнодействащите.",
        "bn": "লব্ধিগুলো নির্ণয়ের জন্য ট্র্যাপিজয়েডকে একটি আয়তক্ষেত্র ও একটি ত্রিভুজে ভাগ করুন।",
        "cn": "将梯形分解为矩形和三角形，以求合力。",
        "de": "Zerlegen Sie das Trapez in ein Rechteck und ein Dreieck, um die Resultierenden zu bestimmen.",
        "dz": "མཐུན་ཤུགས་ཚུ་འཚོལ་ནིའི་དོན་ལུ་ ཊེ་རེ་པི་ཟོཌ་འདི་ གྲུ་བཞི་ནར་མོ་དང་ གྲུ་གསུམ་ནང་ ཕྱེ།",
        "el": "Χωρίστε το τραπέζιο σε ορθογώνιο και τρίγωνο για να βρείτε τις συνισταμένες.",
        "es": "Divida el trapecio en un rectángulo y un triángulo para hallar las resultantes.",
        "fa": "ذوزنقه را به یک مستطیل و یک مثلث تقسیم کنید تا برایندها را بیابید.",
        "fr": "Décomposez le trapèze en un rectangle et un triangle pour trouver les résultantes.",
        "he": "פרקו את הטרפז למלבן ולמשולש כדי למצוא את השקולים.",
        "hi": "परिणामी बल ज्ञात करने के लिए समलंब को एक आयत और एक त्रिभुज में बाँटें।",
        "hy": "Համազորները գտնելու համար սեղանը բաժանեք ուղղանկյան և եռանկյան։",
        "id": "Bagi trapesium menjadi persegi panjang dan segitiga untuk mencari resultannya.",
        "it": "Scomporre il trapezio in un rettangolo e un triangolo per trovare le risultanti.",
        "ja": "台形を長方形と三角形に分けて合力を求めます。",
        "ka": "ტოლქმედების საპოვნელად ტრაპეცია დაყავით მართკუთხედად და სამკუთხედად.",
        "ko": "사다리꼴을 직사각형과 삼각형으로 나누어 합력을 구하세요.",
        "ky": "Тең аракеттүү күчтөрдү табуу үчүн трапецияны тик бурчтукка жана үч бурчтукка бөлүңүз.",
        "my": "ပေါင်းလဒ်အားများကို ရှာရန် ထရပီဇီယမ်ကို စတုဂံနှင့် တြိဂံအဖြစ် ခွဲပါ။",
        "ne": "परिणामी बलहरू पत्ता लगाउन समलम्बलाई एउटा आयत र एउटा त्रिभुजमा छुट्याउनुहोस्।",
        "pt": "Decomponha o trapézio num retângulo e num triângulo para obter as resultantes.",
        "ro": "Descompuneți trapezul într-un dreptunghi și un triunghi pentru a afla rezultantele.",
        "ru": "Разбейте трапецию на прямоугольник и треугольник, чтобы найти равнодействующие.",
        "sl": "Trapez razdelite na pravokotnik in trikotnik ter določite rezultante.",
        "sq": "Ndajeni trapezin në një drejtkëndësh dhe një trekëndësh për të gjetur rezultantet.",
        "tg": "Трапетсияро ба росткунҷа ва секунҷа ҷудо карда, баробартаъсиркунандаҳоро ёбед.",
        "th": "แบ่งรูปสี่เหลี่ยมคางหมูเป็นสี่เหลี่ยมผืนผ้าและสามเหลี่ยมเพื่อหาแรงลัพธ์",
        "tl": "Hatiin ang trapezoid sa isang parihaba at isang tatsulok upang makuha ang mga resultant.",
        "ur": "حاصل قوتیں معلوم کرنے کے لیے ٹریپیزائیڈ کو ایک مستطیل اور ایک مثلث میں تقسیم کریں۔",
        "uz": "Teng taʼsir etuvchilarni topish uchun trapetsiyani toʻgʻri toʻrtburchak va uchburchakka ajrating."
      },
      "level": "intermediate",
      "order": 6
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 3
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 3
      }
    ],
    "hinges": [],
    "concentratedLoads": [],
    "distributedLoads": [],
    "trapezoidalLoads": [
      {
        "startX": 0,
        "endX": 3,
        "startMagnitude": -3,
        "endMagnitude": -1
      }
    ],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 3.5
        },
        {
          "x": 3,
          "Fy": 2.5
        }
      ],
      "Mmax": 2.265414,
      "Mmin": 0,
      "Vmax": 3.5,
      "Vmin": -2.5
    }
  },
  "model_7": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Gerber kirişi – ankastre ve kayıcı",
        "en": "Gerber beam – fixed and roller",
        "ar": "كمرة جربر – ركيزة مثبتة وركيزة منزلقة",
        "bg": "Греда на Gerber – запъване и подвижна опора",
        "bn": "গারবার বিম – আবদ্ধ ও রোলার অবলম্বন",
        "cn": "Gerber 梁 – 固定支座与滚动支座",
        "de": "Gerberträger – Einspannung und Loslager",
        "dz": "Gerber གདུང་མ – གཏན་བཟུང་རྟེན་དང་འགྲིམས་རྟེན",
        "el": "Δοκός Gerber – πάκτωση και κύλιση",
        "es": "Viga Gerber – empotramiento y apoyo de rodillo",
        "fa": "تیر گربر – گیردار و غلتکی",
        "fr": "Poutre Gerber – encastrement et appui à rouleau",
        "he": "קורת גרבר – ריתום ותמיכת גלגל",
        "hi": "Gerber धरन – स्थिर और रोलर आधार",
        "hy": "Գերբերի հեծան – կոշտ ամրակցում և շարժական հոդակապ",
        "id": "Balok Gerber – jepit dan rol",
        "it": "Trave Gerber – incastro e carrello",
        "ja": "ゲルバーはり – 固定支点とローラー支点",
        "ka": "გერბერის ძელი – ხისტი ჩამაგრება და მოძრავი საყრდენი",
        "ko": "게르버보 – 고정 지점과 롤러 지점",
        "ky": "Гербер балкасы – катуу бекитүү жана жылма таяныч",
        "my": "Gerber ရက်မ – ပုံသေနှင့် လှိမ့်ထောက်ကန်မှု",
        "ne": "Gerber बिम – स्थिर र रोलर आधार",
        "pt": "Viga Gerber – engaste e apoio móvel",
        "ro": "Grindă Gerber – încastrare și reazem mobil",
        "ru": "Балка Гербера – заделка и подвижная опора",
        "sl": "Gerberjev nosilec – vpetje in premična podpora",
        "sq": "Tra Gerber – ngulitje dhe mbështetje me rula",
        "tg": "Тири Гербер – маҳкамкунии сахт ва такягоҳи ғалтакӣ",
        "th": "คานเกอร์เบอร์ – ยึดแน่นและลูกกลิ้ง",
        "tl": "Gerber na biga – fixed at roller",
        "ur": "گربر بیم – فکسڈ اور رولر",
        "uz": "Gerber toʻsini – bikr mahkamlash va rolikli tayanch"
      },
      "objective": {
        "tr": "Mafsalda M = 0 denklemini kullanın; asılı parçayı önce çözün.",
        "en": "Use M = 0 at the hinge; solve the suspended part first.",
        "ar": "استخدم M = 0 عند المفصل؛ حُلّ الجزء المعلّق أولًا.",
        "bg": "Използвайте M = 0 в шарнира; първо решете окачената част.",
        "bn": "কব্জায় M = 0 ব্যবহার করুন; প্রথমে ঝুলন্ত অংশটি সমাধান করুন।",
        "cn": "在铰处利用 M = 0；先求解附属部分。",
        "de": "Nutzen Sie M = 0 am Gelenk; lösen Sie zuerst den eingehängten Teil.",
        "dz": "ཚིག་ཁ་ལུ་ M = 0 ལག་ལེན་འཐབ། དང་པ་ འཕྱང་ཆ་འདི་ ཐག་གཅོད།",
        "el": "Χρησιμοποιήστε M = 0 στην άρθρωση· λύστε πρώτα το αναρτημένο τμήμα.",
        "es": "Use M = 0 en la rótula; resuelva primero la parte suspendida.",
        "fa": "در مفصل از M = 0 استفاده کنید؛ ابتدا بخش آویزان را حل کنید.",
        "fr": "Utilisez M = 0 à l'articulation ; résolvez d'abord la partie suspendue.",
        "he": "השתמשו ב-M = 0 במפרק; פתרו תחילה את החלק התלוי.",
        "hi": "कब्जे पर M = 0 का प्रयोग करें; पहले लटके हुए भाग को हल करें।",
        "hy": "Կիրառեք M = 0 պայմանը հոդակապում. նախ լուծեք կախված մասը։",
        "id": "Gunakan M = 0 di sendi; selesaikan bagian yang tergantung terlebih dahulu.",
        "it": "Usare M = 0 nella cerniera; risolvere prima la parte portata.",
        "ja": "ヒンジで M = 0 を用います。吊り部分を先に解きます。",
        "ka": "გამოიყენეთ M = 0 სახსარში; ჯერ ამოხსენით დაკიდებული ნაწილი.",
        "ko": "힌지에서 M = 0을 이용하세요. 매달린 부분을 먼저 푸세요.",
        "ky": "Шарнирде M = 0 шартын колдонуңуз; адегенде илинген бөлүктү чечиңиз.",
        "my": "ပတ္တာတွင် M = 0 ကို အသုံးပြုပါ။ ချိတ်ဆွဲထားသော အပိုင်းကို ဦးစွာ ဖြေရှင်းပါ။",
        "ne": "कब्जामा M = 0 प्रयोग गर्नुहोस्; पहिले झुन्डिएको भाग हल गर्नुहोस्।",
        "pt": "Use M = 0 na rótula; resolva primeiro a parte suspensa.",
        "ro": "Folosiți M = 0 în articulație; rezolvați mai întâi partea suspendată.",
        "ru": "Используйте M = 0 в шарнире; сначала рассчитайте подвесную часть.",
        "sl": "V členku uporabite M = 0; najprej rešite obešeni del.",
        "sq": "Përdorni M = 0 në nyje; zgjidhni fillimisht pjesën e varur.",
        "tg": "Дар шарнир M = 0-ро истифода баред; аввал қисми овезонро ҳал кунед.",
        "th": "ใช้ M = 0 ที่บานพับ และแก้ส่วนที่ถูกแขวนก่อน",
        "tl": "Gamitin ang M = 0 sa hinge; unahing lutasin ang nakabitin na bahagi.",
        "ur": "قبضے پر M = 0 استعمال کریں؛ پہلے معلق حصہ حل کریں۔",
        "uz": "Sharnirda M = 0 dan foydalaning; avval osma qismni yeching."
      },
      "level": "advanced",
      "order": 10
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 5
    },
    "supports": [
      {
        "type": "roller-support",
        "x": 0
      },
      {
        "type": "fixed-support",
        "x": 5
      }
    ],
    "hinges": [
      {
        "x": 3
      }
    ],
    "concentratedLoads": [
      {
        "x": 2,
        "magnitude": 2,
        "angle": 1.5707963267948966
      }
    ],
    "distributedLoads": [
      {
        "startX": 3,
        "endX": 5,
        "magnitude": -4
      }
    ],
    "trapezoidalLoads": [],
    "concentratedMoments": [
      {
        "x": 2,
        "magnitude": -1
      }
    ],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 2,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 1
        },
        {
          "x": 5,
          "Fy": 9,
          "Mz": -10
        }
      ],
      "Mmax": 2,
      "Mmin": -10,
      "Vmax": 1,
      "Vmin": -9
    }
  },
  "model_8": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Gerber kirişi – üç mesnet",
        "en": "Gerber beam – three supports",
        "ar": "كمرة جربر – ثلاث ركائز",
        "bg": "Греда на Gerber – три опори",
        "bn": "গারবার বিম – তিনটি অবলম্বন",
        "cn": "Gerber 梁 – 三个支座",
        "de": "Gerberträger – drei Lager",
        "dz": "Gerber གདུང་མ – རྟེན་གསུམ",
        "el": "Δοκός Gerber – τρεις στηρίξεις",
        "es": "Viga Gerber – tres apoyos",
        "fa": "تیر گربر – سه تکیه‌گاه",
        "fr": "Poutre Gerber – trois appuis",
        "he": "קורת גרבר – שלוש תמיכות",
        "hi": "Gerber धरन – तीन आधार",
        "hy": "Գերբերի հեծան – երեք հենարան",
        "id": "Balok Gerber – tiga tumpuan",
        "it": "Trave Gerber – tre vincoli",
        "ja": "ゲルバーはり – 3 支点",
        "ka": "გერბერის ძელი – სამი საყრდენი",
        "ko": "게르버보 – 지점 3개",
        "ky": "Гербер балкасы – үч таяныч",
        "my": "Gerber ရက်မ – ထောက်ကန်မှု သုံးခု",
        "ne": "Gerber बिम – तीन आधार",
        "pt": "Viga Gerber – três apoios",
        "ro": "Grindă Gerber – trei reazeme",
        "ru": "Балка Гербера – три опоры",
        "sl": "Gerberjev nosilec – tri podpore",
        "sq": "Tra Gerber – tre mbështetje",
        "tg": "Тири Гербер – се такягоҳ",
        "th": "คานเกอร์เบอร์ – จุดรองรับสามจุด",
        "tl": "Gerber na biga – tatlong suporta",
        "ur": "گربر بیم – تین سہارے",
        "uz": "Gerber toʻsini – uchta tayanch"
      },
      "objective": {
        "tr": "Mafsal kuvveti asılı parçadan taşıyıcı parçaya aktarılır.",
        "en": "The hinge force is transferred from the suspended part to the supporting part.",
        "ar": "تنتقل قوة المفصل من الجزء المعلّق إلى الجزء الحامل.",
        "bg": "Силата в шарнира се предава от окачената част към носещата част.",
        "bn": "কব্জার বল ঝুলন্ত অংশ থেকে বহনকারী অংশে স্থানান্তরিত হয়।",
        "cn": "铰接力由附属部分传递给基本部分。",
        "de": "Die Gelenkkraft wird vom eingehängten Teil auf den tragenden Teil übertragen.",
        "dz": "ཚིག་ཁའི་ཤུགས་འདི་ འཕྱང་ཆ་ལས་ རྟེན་ཆ་ལུ་ སྤོ་བཤུད་འབདཝ་ཨིན།",
        "el": "Η δύναμη της άρθρωσης μεταφέρεται από το αναρτημένο τμήμα στο φέρον τμήμα.",
        "es": "La fuerza de la rótula se transmite de la parte suspendida a la parte portante.",
        "fa": "نیروی مفصل از بخش آویزان به بخش باربر منتقل می‌شود.",
        "fr": "L'effort à l'articulation est transmis de la partie suspendue à la partie porteuse.",
        "he": "כוח המפרק מועבר מהחלק התלוי אל החלק הנושא.",
        "hi": "कब्जा बल लटके हुए भाग से वाहक भाग में संचरित होता है।",
        "hy": "Հոդակապի ուժը կախված մասից փոխանցվում է կրող մասին։",
        "id": "Gaya sendi diteruskan dari bagian yang tergantung ke bagian pemikul.",
        "it": "La forza nella cerniera si trasmette dalla parte portata alla parte portante.",
        "ja": "ヒンジ力は吊り部分から支持部分へ伝達されます。",
        "ka": "სახსრის ძალა დაკიდებული ნაწილიდან გადაეცემა მზიდ ნაწილს.",
        "ko": "힌지력은 매달린 부분에서 지지하는 부분으로 전달됩니다.",
        "ky": "Шарнирдеги күч илинген бөлүктөн көтөрүүчү бөлүккө берилет.",
        "my": "ပတ္တာအားသည် ချိတ်ဆွဲထားသော အပိုင်းမှ ထမ်းဆောင်သော အပိုင်းသို့ လွှဲပြောင်းသည်။",
        "ne": "कब्जा बल झुन्डिएको भागबाट वाहक भागमा सारिन्छ।",
        "pt": "A força na rótula é transmitida da parte suspensa para a parte portante.",
        "ro": "Forța din articulație se transmite de la partea suspendată la partea purtătoare.",
        "ru": "Усилие в шарнире передаётся с подвесной части на несущую.",
        "sl": "Sila v členku se prenese z obešenega dela na nosilni del.",
        "sq": "Forca e nyjës transmetohet nga pjesa e varur te pjesa mbajtëse.",
        "tg": "Қувваи шарнир аз қисми овезон ба қисми бардоранда интиқол меёбад.",
        "th": "แรงที่บานพับถ่ายจากส่วนที่ถูกแขวนไปยังส่วนที่รองรับ",
        "tl": "Naipapasa ang puwersa sa hinge mula sa nakabitin na bahagi papunta sa sumusuportang bahagi.",
        "ur": "قبضے کی قوت معلق حصے سے سہارا دینے والے حصے کو منتقل ہوتی ہے۔",
        "uz": "Sharnir kuchi osma qismdan koʻtaruvchi qismga uzatiladi."
      },
      "level": "advanced",
      "order": 11
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 5
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 5
      },
      {
        "type": "roller-support",
        "x": 3
      }
    ],
    "hinges": [
      {
        "x": 4
      }
    ],
    "concentratedLoads": [
      {
        "x": 4.5,
        "magnitude": 5,
        "angle": 1.5707963267948966
      }
    ],
    "distributedLoads": [
      {
        "startX": 2,
        "endX": 3,
        "magnitude": -4
      }
    ],
    "trapezoidalLoads": [
      {
        "startX": 0,
        "endX": 2,
        "startMagnitude": -12,
        "endMagnitude": -4
      }
    ],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 2,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 11.388889
        },
        {
          "x": 3,
          "Fy": 11.111111
        },
        {
          "x": 5,
          "Fy": 2.5
        }
      ],
      "Mmax": 6.179856,
      "Mmin": -2.5,
      "Vmax": 11.388889,
      "Vmin": -8.611111
    }
  },
  "model_9": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Gerber kirişi – yatay yük ve moment",
        "en": "Gerber beam – horizontal load and moment",
        "ar": "كمرة جربر – حمل أفقي وعزم",
        "bg": "Греда на Gerber – хоризонтален товар и момент",
        "bn": "গারবার বিম – অনুভূমিক লোড ও ভ্রামক",
        "cn": "Gerber 梁 – 水平荷载与力偶",
        "de": "Gerberträger – Horizontallast und Moment",
        "dz": "Gerber གདུང་མ – ཐད་སྙོམས་ཁུར་བ་དང་སྐོར་ཤུགས",
        "el": "Δοκός Gerber – οριζόντιο φορτίο και ροπή",
        "es": "Viga Gerber – carga horizontal y momento",
        "fa": "تیر گربر – بار افقی و لنگر",
        "fr": "Poutre Gerber – charge horizontale et moment",
        "he": "קורת גרבר – עומס אופקי ומומנט",
        "hi": "Gerber धरन – क्षैतिज भार और आघूर्ण",
        "hy": "Գերբերի հեծան – հորիզոնական ուժ և մոմենտ",
        "id": "Balok Gerber – beban horizontal dan momen",
        "it": "Trave Gerber – carico orizzontale e momento",
        "ja": "ゲルバーはり – 水平荷重とモーメント",
        "ka": "გერბერის ძელი – ჰორიზონტალური ძალა და მომენტი",
        "ko": "게르버보 – 수평하중과 모멘트",
        "ky": "Гербер балкасы – горизонталдык күч жана момент",
        "my": "Gerber ရက်မ – အလျားလိုက်ဝန်နှင့် မိုမင့်",
        "ne": "Gerber बिम – तेर्सो भार र आघूर्ण",
        "pt": "Viga Gerber – carga horizontal e momento",
        "ro": "Grindă Gerber – forță orizontală și moment",
        "ru": "Балка Гербера – горизонтальная сила и момент",
        "sl": "Gerberjev nosilec – vodoravna sila in moment",
        "sq": "Tra Gerber – ngarkesë horizontale dhe moment",
        "tg": "Тири Гербер – сарбории уфуқӣ ва момент",
        "th": "คานเกอร์เบอร์ – แรงแนวราบและโมเมนต์",
        "tl": "Gerber na biga – pahalang na karga at moment",
        "ur": "گربر بیم – افقی لوڈ اور مومنٹ",
        "uz": "Gerber toʻsini – gorizontal kuch va moment"
      },
      "objective": {
        "tr": "Yatay yük yalnızca sabit mesnede kadar N oluşturur; mesnet üzerindeki moment M'de sıçrama yapar.",
        "en": "The horizontal load creates N only up to the pinned support; the moment at the support causes a jump in M.",
        "ar": "يولّد الحمل الأفقي N حتى الركيزة المفصلية فقط؛ والعزم عند الركيزة يُحدث قفزة في M.",
        "bg": "Хоризонталният товар създава N само до неподвижната шарнирна опора; моментът над опората предизвиква скок в M.",
        "bn": "অনুভূমিক লোড কেবল কব্জা অবলম্বন পর্যন্ত N সৃষ্টি করে; অবলম্বনের উপরের ভ্রামক M-এ লাফ সৃষ্টি করে।",
        "cn": "水平荷载仅在固定铰支座以内产生 N；支座处的力偶使 M 发生突变。",
        "de": "Die Horizontallast erzeugt N nur bis zum Festlager; das Moment am Lager bewirkt einen Sprung in M.",
        "dz": "ཐད་སྙོམས་ཁུར་བ་གིས་ འཁོར་རྟེན་ཚུན་ཚོད་རྐྱངམ་ཅིག་ N བཟོཝ་ཨིན། རྟེན་གུ་ཡོད་པའི་སྐོར་ཤུགས་ཀྱིས་ M ནང་ མཆོང་ཐབས་ཅིག་བཟོཝ་ཨིན།",
        "el": "Το οριζόντιο φορτίο προκαλεί N μόνο μέχρι την άρθρωση στήριξης· η ροπή στη στήριξη προκαλεί άλμα στη M.",
        "es": "La carga horizontal produce N solo hasta el apoyo fijo; el momento sobre el apoyo produce un salto en M.",
        "fa": "بار افقی فقط تا تکیه‌گاه مفصلی N ایجاد می‌کند؛ لنگر روی تکیه‌گاه در M جهش ایجاد می‌کند.",
        "fr": "La charge horizontale ne crée N que jusqu'à l'appui fixe ; le moment sur l'appui provoque un saut de M.",
        "he": "העומס האופקי יוצר N רק עד תמיכת הציר; המומנט על התמיכה גורם לקפיצה ב-M.",
        "hi": "क्षैतिज भार केवल पिन आधार तक N उत्पन्न करता है; आधार पर लगा आघूर्ण M में उछाल उत्पन्न करता है।",
        "hy": "Հորիզոնական ուժը N է առաջացնում միայն մինչև անշարժ հոդակապային հենարանը. հենարանի վրա կիրառված մոմենտը թռիչք է առաջացնում M-ում։",
        "id": "Beban horizontal menimbulkan N hanya sampai tumpuan sendi; momen pada tumpuan menyebabkan lompatan pada M.",
        "it": "Il carico orizzontale genera N solo fino alla cerniera fissa; il momento applicato sul vincolo provoca un salto in M.",
        "ja": "水平荷重はピン支点までの区間にのみ N を生じます。支点に作用するモーメントは M に不連続な変化を生じさせます。",
        "ka": "ჰორიზონტალური ძალა N-ს იწვევს მხოლოდ უძრავ სახსრულ საყრდენამდე; საყრდენზე მოდებული მომენტი M-ში ნახტომს იწვევს.",
        "ko": "수평하중은 핀 지점까지만 N을 생성합니다. 지점에 작용하는 모멘트는 M에 급변을 일으킵니다.",
        "ky": "Горизонталдык күч N-ди кыймылсыз шарнирдик таянычка чейин гана пайда кылат; таянычтагы момент M-де секирик пайда кылат.",
        "my": "အလျားလိုက်ဝန်သည် ပင်ထောက်ကန်မှုအထိသာ N ကို ဖြစ်စေသည်။ ထောက်ကန်မှုပေါ်ရှိ မိုမင့်သည် M တွင် ခုန်ပြောင်းမှု ဖြစ်စေသည်။",
        "ne": "तेर्सो भारले पिन आधारसम्म मात्र N उत्पन्न गर्छ; आधारमा लागेको आघूर्णले M मा उफ्राइ ल्याउँछ।",
        "pt": "A carga horizontal gera N apenas até o apoio fixo; o momento no apoio provoca um salto em M.",
        "ro": "Forța orizontală produce N doar până la reazemul articulat; momentul de pe reazem produce un salt în M.",
        "ru": "Горизонтальная сила вызывает N только до шарнирно-неподвижной опоры; момент на опоре вызывает скачок в M.",
        "sl": "Vodoravna sila povzroča N le do nepremične členkaste podpore; moment na podpori povzroči skok v M.",
        "sq": "Ngarkesa horizontale krijon N vetëm deri te mbështetja me kunj; momenti mbi mbështetje shkakton kërcim në M.",
        "tg": "Сарбории уфуқӣ N-ро танҳо то такягоҳи шарнирии собит ба вуҷуд меорад; моменти болои такягоҳ дар M ҷаҳиш ба вуҷуд меорад.",
        "th": "แรงแนวราบทำให้เกิด N เฉพาะถึงจุดรองรับแบบหมุดเท่านั้น โมเมนต์ที่จุดรองรับทำให้ M กระโดด",
        "tl": "Lumilikha ang pahalang na karga ng N hanggang sa pinned support lamang; nagpapatalon sa M ang moment sa suporta.",
        "ur": "افقی لوڈ صرف پن سہارے تک N پیدا کرتا ہے؛ سہارے پر لگا مومنٹ M میں چھلانگ پیدا کرتا ہے۔",
        "uz": "Gorizontal kuch N ni faqat qoʻzgʻalmas sharnirli tayanchgacha hosil qiladi; tayanchdagi moment M da sakrash hosil qiladi."
      },
      "level": "advanced",
      "order": 12
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 6
    },
    "supports": [
      {
        "type": "roller-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 3
      },
      {
        "type": "pin-support",
        "x": 6
      }
    ],
    "hinges": [
      {
        "x": 4
      }
    ],
    "concentratedLoads": [
      {
        "x": 2,
        "magnitude": 20,
        "angle": 3.141592653589793
      }
    ],
    "distributedLoads": [],
    "trapezoidalLoads": [
      {
        "startX": 0,
        "endX": 3,
        "startMagnitude": 0,
        "endMagnitude": -12
      }
    ],
    "concentratedMoments": [
      {
        "x": 6,
        "magnitude": -10
      }
    ],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 2,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 4.333333
        },
        {
          "x": 3,
          "Fy": 18.666667
        },
        {
          "x": 6,
          "Fy": -5,
          "Fx": 20
        }
      ],
      "Mmax": 10,
      "Mmin": -5,
      "Vmax": 5,
      "Vmin": -13.666667
    }
  },
  "model_10": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "İki ankastreli, iki mafsallı kiriş",
        "en": "Two fixed ends, two hinges",
        "ar": "طرفان مثبتان ومفصلان",
        "bg": "Две запъвания, два шарнира",
        "bn": "দুটি আবদ্ধ প্রান্ত, দুটি কব্জা",
        "cn": "两端固定、两个铰",
        "de": "Zwei Einspannungen, zwei Gelenke",
        "dz": "གཏན་བཟུང་མཐའ་གཉིས་ ཚིག་ཁ་གཉིས",
        "el": "Δύο πακτώσεις, δύο αρθρώσεις",
        "es": "Dos empotramientos, dos rótulas",
        "fa": "دو انتهای گیردار، دو مفصل",
        "fr": "Deux encastrements, deux articulations",
        "he": "שני ריתומים, שני מפרקים",
        "hi": "दो स्थिर सिरे, दो कब्जे",
        "hy": "Երկու կոշտ ամրակցում, երկու հոդակապ",
        "id": "Dua ujung jepit, dua sendi",
        "it": "Due incastri, due cerniere",
        "ja": "両端固定、2 ヒンジ",
        "ka": "ორი ხისტი ჩამაგრება, ორი სახსარი",
        "ko": "양단 고정, 힌지 2개",
        "ky": "Эки катуу бекитүү, эки шарнир",
        "my": "ပုံသေအစွန်း နှစ်ခု၊ ပတ္တာ နှစ်ခု",
        "ne": "दुई स्थिर छेउ, दुई कब्जा",
        "pt": "Dois engastes, duas rótulas",
        "ro": "Două încastrări, două articulații",
        "ru": "Две заделки, два шарнира",
        "sl": "Dve vpetji, dva členka",
        "sq": "Dy ngulitje, dy nyje",
        "tg": "Ду маҳкамкунии сахт, ду шарнир",
        "th": "ปลายยึดแน่นสองปลาย บานพับสองจุด",
        "tl": "Dalawang fixed na dulo, dalawang hinge",
        "ur": "دو فکسڈ سرے، دو قبضے",
        "uz": "Ikki bikr mahkamlash, ikki sharnir"
      },
      "objective": {
        "tr": "Ortadaki parça iki mafsala oturur; her mafsalda M = 0.",
        "en": "The middle part rests on two hinges; M = 0 at each hinge.",
        "ar": "يرتكز الجزء الأوسط على مفصلين؛ M = 0 عند كل مفصل.",
        "bg": "Средната част лежи на два шарнира; M = 0 във всеки шарнир.",
        "bn": "মাঝের অংশটি দুটি কব্জার উপর বসে থাকে; প্রতিটি কব্জায় M = 0।",
        "cn": "中间部分支承在两个铰上；每个铰处 M = 0。",
        "de": "Der Mittelteil liegt auf zwei Gelenken; an jedem Gelenk ist M = 0.",
        "dz": "བར་ན་ཡོད་པའི་ཆ་འདི་ ཚིག་ཁ་གཉིས་ཀྱི་གུ་ལུ་བཞགཔ་ཨིན། ཚིག་ཁ་རེ་རེ་ལུ་ M = 0།",
        "el": "Το μεσαίο τμήμα εδράζεται σε δύο αρθρώσεις· M = 0 σε κάθε άρθρωση.",
        "es": "La parte central se apoya en dos rótulas; M = 0 en cada rótula.",
        "fa": "بخش میانی روی دو مفصل قرار دارد؛ در هر مفصل M = 0.",
        "fr": "La partie centrale repose sur deux articulations ; M = 0 à chaque articulation.",
        "he": "החלק האמצעי נשען על שני מפרקים; בכל מפרק M = 0.",
        "hi": "मध्य भाग दो कब्जों पर टिका है; प्रत्येक कब्जे पर M = 0।",
        "hy": "Միջին մասը հենվում է երկու հոդակապի վրա. յուրաքանչյուր հոդակապում M = 0։",
        "id": "Bagian tengah bertumpu pada dua sendi; M = 0 di setiap sendi.",
        "it": "La parte centrale poggia su due cerniere; M = 0 in ciascuna cerniera.",
        "ja": "中央部分は 2 つのヒンジで支えられます。各ヒンジで M = 0。",
        "ka": "შუა ნაწილი ეყრდნობა ორ სახსარს; თითოეულ სახსარში M = 0.",
        "ko": "가운데 부분은 두 힌지 위에 놓입니다. 각 힌지에서 M = 0입니다.",
        "ky": "Ортоңку бөлүк эки шарнирге таянат; ар бир шарнирде M = 0.",
        "my": "အလယ်အပိုင်းသည် ပတ္တာနှစ်ခုပေါ်တွင် တင်နေသည်။ ပတ္တာတိုင်းတွင် M = 0။",
        "ne": "बीचको भाग दुई कब्जामा अडिएको छ; प्रत्येक कब्जामा M = 0।",
        "pt": "A parte central apoia-se em duas rótulas; M = 0 em cada rótula.",
        "ro": "Partea din mijloc se sprijină pe două articulații; M = 0 în fiecare articulație.",
        "ru": "Средняя часть опирается на два шарнира; в каждом шарнире M = 0.",
        "sl": "Srednji del leži na dveh členkih; v vsakem členku je M = 0.",
        "sq": "Pjesa e mesme mbështetet mbi dy nyje; në secilën nyje M = 0.",
        "tg": "Қисми миёна ба ду шарнир такя мекунад; дар ҳар шарнир M = 0.",
        "th": "ส่วนกลางวางอยู่บนบานพับสองจุด M = 0 ที่บานพับแต่ละจุด",
        "tl": "Nakapatong ang gitnang bahagi sa dalawang hinge; M = 0 sa bawat hinge.",
        "ur": "درمیانی حصہ دو قبضوں پر ٹکا ہے؛ ہر قبضے پر M = 0۔",
        "uz": "Oʻrta qism ikki sharnirga tayanadi; har bir sharnirda M = 0."
      },
      "level": "advanced",
      "order": 13
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 4
    },
    "supports": [
      {
        "type": "fixed-support",
        "x": 0
      },
      {
        "type": "fixed-support",
        "x": 4
      }
    ],
    "hinges": [
      {
        "x": 1
      },
      {
        "x": 3
      }
    ],
    "concentratedLoads": [
      {
        "x": 1.5,
        "magnitude": 2,
        "angle": 1.5707963267948966
      },
      {
        "x": 2.5,
        "magnitude": 2,
        "angle": 1.5707963267948966
      }
    ],
    "distributedLoads": [],
    "trapezoidalLoads": [],
    "concentratedMoments": [
      {
        "x": 2,
        "magnitude": 4
      }
    ],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 0,
          "Mz": 0
        },
        {
          "x": 4,
          "Fy": 4,
          "Mz": -4
        }
      ],
      "Mmax": 3,
      "Mmin": -4,
      "Vmax": 0,
      "Vmin": -4
    }
  },
  "model_11": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Çıkmalı (konsollu) kiriş",
        "en": "Overhanging beam",
        "ar": "كمرة ذات بروز",
        "bg": "Греда с конзолен край",
        "bn": "ওভারহ্যাংযুক্ত বিম",
        "cn": "外伸梁",
        "de": "Träger mit Kragarm",
        "dz": "ཕྱིར་འཐོན་ཅན་གྱི་གདུང་མ",
        "el": "Δοκός με πρόβολο",
        "es": "Viga con voladizo",
        "fa": "تیر با طره",
        "fr": "Poutre avec porte-à-faux",
        "he": "קורה עם זיז",
        "hi": "प्रलंबित धरन",
        "hy": "Կոնսոլներով հեծան",
        "id": "Balok dengan overstek",
        "it": "Trave con sbalzo",
        "ja": "張出しはり",
        "ka": "კონსოლებიანი ძელი",
        "ko": "내민보",
        "ky": "Консолу бар балка",
        "my": "ထွက်ပေါက်ပါ ရက်မ",
        "ne": "ओभरह्याङ्ग भएको बिम",
        "pt": "Viga com balanço",
        "ro": "Grindă cu consolă",
        "ru": "Балка с консолью",
        "sl": "Nosilec s previsnim delom",
        "sq": "Tra me konsol",
        "tg": "Тир бо консол",
        "th": "คานที่มีส่วนยื่น",
        "tl": "Biga na may overhang",
        "ur": "اوورہینگ والی بیم",
        "uz": "Konsolli toʻsin"
      },
      "objective": {
        "tr": "Çıkma bölgesinde negatif moment oluşur; M = 0 olan noktayı bulun.",
        "en": "Negative moment develops over the overhang; locate the point where M = 0.",
        "ar": "ينشأ عزم سالب فوق البروز؛ حدّد النقطة التي يكون فيها M = 0.",
        "bg": "В конзолната част възниква отрицателен момент; намерете точката, където M = 0.",
        "bn": "ওভারহ্যাং অংশে ঋণাত্মক ভ্রামক সৃষ্টি হয়; যে বিন্দুতে M = 0 তা নির্ণয় করুন।",
        "cn": "外伸段产生负弯矩；求 M = 0 的位置。",
        "de": "Im Kragarm entsteht ein negatives Moment; bestimmen Sie die Stelle, an der M = 0.",
        "dz": "ཕྱིར་འཐོན་ཆ་ལུ་ སྐོར་ཤུགས་མོ་ཐོནམ་ཨིན། M = 0 ཨིན་པའི་ས་ཚིགས་འཚོལ།",
        "el": "Στον πρόβολο αναπτύσσεται αρνητική ροπή· εντοπίστε το σημείο όπου M = 0.",
        "es": "En el voladizo se desarrolla momento negativo; localice el punto donde M = 0.",
        "fa": "در ناحیه طره لنگر منفی ایجاد می‌شود؛ نقطه‌ای را که در آن M = 0 است بیابید.",
        "fr": "Un moment négatif apparaît dans le porte-à-faux ; localisez le point où M = 0.",
        "he": "בזיז נוצר מומנט שלילי; אתרו את הנקודה שבה M = 0.",
        "hi": "प्रलंबित भाग पर ऋणात्मक आघूर्ण उत्पन्न होता है; वह बिंदु ज्ञात करें जहाँ M = 0।",
        "hy": "Կոնսոլային մասում առաջանում է բացասական մոմենտ. գտեք այն կետը, որտեղ M = 0։",
        "id": "Momen negatif timbul pada daerah overstek; tentukan titik tempat M = 0.",
        "it": "Sullo sbalzo nasce un momento negativo; individuare il punto in cui M = 0.",
        "ja": "張出し部には負のモーメントが生じます。M = 0 となる点を求めます。",
        "ka": "კონსოლურ ნაწილში წარმოიქმნება უარყოფითი მომენტი; იპოვეთ წერტილი, სადაც M = 0.",
        "ko": "내민 부분에서 음의 모멘트가 생깁니다. M = 0인 점을 찾으세요.",
        "ky": "Консолдук бөлүктө терс момент пайда болот; M = 0 болгон чекитти табыңыз.",
        "my": "ထွက်ပေါက်အပိုင်းတွင် အနုတ်မိုမင့် ဖြစ်ပေါ်သည်။ M = 0 ဖြစ်သော အမှတ်ကို ရှာပါ။",
        "ne": "ओभरह्याङ्ग भागमा ऋणात्मक आघूर्ण उत्पन्न हुन्छ; M = 0 हुने बिन्दु पत्ता लगाउनुहोस्।",
        "pt": "No balanço surge momento negativo; localize o ponto onde M = 0.",
        "ro": "Pe consolă apare moment negativ; găsiți punctul în care M = 0.",
        "ru": "На консоли возникает отрицательный момент; найдите точку, где M = 0.",
        "sl": "Na previsnem delu nastane negativni moment; poiščite točko, kjer je M = 0.",
        "sq": "Në konsol lind moment negativ; gjeni pikën ku M = 0.",
        "tg": "Дар қисми консолӣ моменти манфӣ пайдо мешавад; нуқтаеро ёбед, ки дар он M = 0.",
        "th": "เกิดโมเมนต์ลบบนส่วนยื่น หาตำแหน่งที่ M = 0",
        "tl": "Nagkakaroon ng negatibong moment sa overhang; hanapin ang punto kung saan M = 0.",
        "ur": "اوورہینگ پر منفی مومنٹ پیدا ہوتا ہے؛ وہ نقطہ معلوم کریں جہاں M = 0۔",
        "uz": "Konsol qismida manfiy moment hosil boʻladi; M = 0 boʻlgan nuqtani toping."
      },
      "level": "intermediate",
      "order": 7
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 6
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 4
      }
    ],
    "hinges": [],
    "concentratedLoads": [
      {
        "x": 6,
        "magnitude": 4,
        "angle": 1.5707963267948966
      }
    ],
    "distributedLoads": [
      {
        "startX": 0,
        "endX": 6,
        "magnitude": -2
      }
    ],
    "trapezoidalLoads": [],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 1
        },
        {
          "x": 4,
          "Fy": 15
        }
      ],
      "Mmax": 0.25,
      "Mmin": -12,
      "Vmax": 8,
      "Vmin": -7
    }
  },
  "model_12": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Eğik tekil yük",
        "en": "Inclined point load",
        "ar": "حمل مركز مائل",
        "bg": "Наклонена съсредоточена сила",
        "bn": "হেলানো বিন্দু লোড",
        "cn": "斜向集中荷载",
        "de": "Schräge Einzellast",
        "dz": "གསེག་ཡོད་པའི་གནད་དོན་ཁུར་བ",
        "el": "Κεκλιμένο συγκεντρωμένο φορτίο",
        "es": "Carga puntual inclinada",
        "fa": "بار متمرکز مایل",
        "fr": "Charge ponctuelle inclinée",
        "he": "עומס מרוכז משופע",
        "hi": "तिरछा बिंदु भार",
        "hy": "Թեք կենտրոնացված ուժ",
        "id": "Beban terpusat miring",
        "it": "Carico concentrato inclinato",
        "ja": "傾斜した集中荷重",
        "ka": "დახრილი შეყურსული ძალა",
        "ko": "경사 집중하중",
        "ky": "Жантык топтолгон күч",
        "my": "စောင်းနေသော အမှတ်ဝန်",
        "ne": "तिर्छा बिन्दु भार",
        "pt": "Carga concentrada inclinada",
        "ro": "Forță concentrată înclinată",
        "ru": "Наклонная сосредоточенная сила",
        "sl": "Poševna točkovna sila",
        "sq": "Forcë e përqendruar e pjerrët",
        "tg": "Қувваи мутамаркази моил",
        "th": "แรงกระทำเป็นจุดแนวเอียง",
        "tl": "Pahilig na point load",
        "ur": "مائل مرکوز لوڈ",
        "uz": "Ogʻma toʻplangan kuch"
      },
      "objective": {
        "tr": "Yükü bileşenlerine ayırın: düşey bileşen V ve M'yi, yatay bileşen N'yi oluşturur.",
        "en": "Resolve the load into components: the vertical part creates V and M, the horizontal part creates N.",
        "ar": "حلّل الحمل إلى مركبتين: المركبة الرأسية تولّد V وM، والمركبة الأفقية تولّد N.",
        "bg": "Разложете товара на компоненти: вертикалната създава V и M, хоризонталната – N.",
        "bn": "লোডকে উপাংশে বিভাজন করুন: উল্লম্ব উপাংশ V ও M এবং অনুভূমিক উপাংশ N সৃষ্টি করে।",
        "cn": "将荷载分解为分量：竖向分量产生 V 和 M，水平分量产生 N。",
        "de": "Zerlegen Sie die Last in Komponenten: Der vertikale Anteil erzeugt V und M, der horizontale N.",
        "dz": "ཁུར་བ་འདི་ ཆ་ཤས་ནང་ཕྱེ། ཀ་ཐད་ཀྱི་ཆ་ཤས་ཀྱིས་ V དང་ M བཟོཝ་ཨིནམ་དང་ ཐད་སྙོམས་ཀྱི་ཆ་ཤས་ཀྱིས་ N བཟོཝ་ཨིན།",
        "el": "Αναλύστε το φορτίο σε συνιστώσες: η κατακόρυφη προκαλεί V και M, η οριζόντια προκαλεί N.",
        "es": "Descomponga la carga en componentes: la vertical produce V y M, la horizontal produce N.",
        "fa": "بار را به مؤلفه‌هایش تجزیه کنید: مؤلفه قائم V و M و مؤلفه افقی N ایجاد می‌کند.",
        "fr": "Décomposez la charge en composantes : la composante verticale crée V et M, la composante horizontale crée N.",
        "he": "פרקו את העומס לרכיבים: הרכיב האנכי יוצר V ו-M, והרכיב האופקי יוצר N.",
        "hi": "भार को घटकों में विभाजित करें: ऊर्ध्वाधर घटक V और M, क्षैतिज घटक N उत्पन्न करता है।",
        "hy": "Ուժը վերլուծեք բաղադրիչների. ուղղաձիգ բաղադրիչն առաջացնում է V և M, հորիզոնականը՝ N։",
        "id": "Uraikan beban menjadi komponen: komponen vertikal menimbulkan V dan M, komponen horizontal menimbulkan N.",
        "it": "Scomporre il carico nelle componenti: quella verticale genera V e M, quella orizzontale genera N.",
        "ja": "荷重を成分に分解します。鉛直成分は V と M を、水平成分は N を生じます。",
        "ka": "დაშალეთ ძალა მდგენელებად: ვერტიკალური მდგენელი იწვევს V-ს და M-ს, ჰორიზონტალური – N-ს.",
        "ko": "하중을 성분으로 분해하세요. 연직 성분은 V와 M을, 수평 성분은 N을 생성합니다.",
        "ky": "Күчтү түзүүчүлөргө ажыратыңыз: вертикалдык түзүүчү V жана M, горизонталдыгы N пайда кылат.",
        "my": "ဝန်ကို အစိတ်အပိုင်းများအဖြစ် ခွဲပါ။ ဒေါင်လိုက်အပိုင်းက V နှင့် M ကို၊ အလျားလိုက်အပိုင်းက N ကို ဖြစ်စေသည်။",
        "ne": "भारलाई घटकहरूमा छुट्याउनुहोस्: ठाडो घटकले V र M, तेर्सो घटकले N उत्पन्न गर्छ।",
        "pt": "Decomponha a carga em componentes: a vertical gera V e M, a horizontal gera N.",
        "ro": "Descompuneți forța în componente: componenta verticală produce V și M, iar cea orizontală produce N.",
        "ru": "Разложите силу на составляющие: вертикальная вызывает V и M, горизонтальная – N.",
        "sl": "Silo razstavite na komponente: navpična povzroča V in M, vodoravna pa N.",
        "sq": "Zbërtheni ngarkesën në përbërës: përbërësi vertikal krijon V dhe M, ai horizontal krijon N.",
        "tg": "Сарборро ба ташкилдиҳандаҳо ҷудо кунед: ташкилдиҳандаи амудӣ V ва M-ро, уфуқӣ N-ро ба вуҷуд меорад.",
        "th": "แตกแรงเป็นองค์ประกอบ: องค์ประกอบแนวดิ่งทำให้เกิด V และ M องค์ประกอบแนวราบทำให้เกิด N",
        "tl": "Hatiin ang karga sa mga component: ang patayong bahagi ay lumilikha ng V at M, ang pahalang na bahagi ay lumilikha ng N.",
        "ur": "لوڈ کو اجزا میں تقسیم کریں: عمودی جزو V اور M پیدا کرتا ہے، افقی جزو N پیدا کرتا ہے۔",
        "uz": "Kuchni tashkil etuvchilarga ajrating: vertikal tashkil etuvchi V va M ni, gorizontal tashkil etuvchi N ni hosil qiladi."
      },
      "level": "intermediate",
      "order": 8
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 5
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 5
      }
    ],
    "hinges": [],
    "concentratedLoads": [
      {
        "x": 2,
        "magnitude": 10,
        "angle": 1.0471975511965976
      }
    ],
    "distributedLoads": [],
    "trapezoidalLoads": [],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 5.196152,
          "Fx": -5
        },
        {
          "x": 5,
          "Fy": 3.464102
        }
      ],
      "Mmax": 10.392305,
      "Mmin": 0,
      "Vmax": 5.196152,
      "Vmin": -3.464102
    }
  },
  "model_13": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Konsol – yayılı yük ve burulma",
        "en": "Cantilever – distributed load and torque",
        "ar": "كمرة كابولية – حمل موزع وعزم التواء",
        "bg": "Конзола – разпределен товар и усукващ момент",
        "bn": "ক্যান্টিলিভার – বিতরণকৃত লোড ও মোচড় ভ্রামক",
        "cn": "悬臂梁 – 分布荷载与扭矩",
        "de": "Kragträger – Streckenlast und Torsion",
        "dz": "ཕྱིར་འཐོན་གདུང་མ – བགོ་བཤའ་ཁུར་བ་དང་བཅུ་ཤུགས",
        "el": "Πρόβολος – κατανεμημένο φορτίο και στρέψη",
        "es": "Voladizo – carga distribuida y torsión",
        "fa": "تیر طره‌ای – بار گسترده و لنگر پیچشی",
        "fr": "Console – charge répartie et torsion",
        "he": "זיז – עומס מפוזר ומומנט פיתול",
        "hi": "कैंटिलीवर – वितरित भार और मरोड़",
        "hy": "Կոնսոլ – բաշխված բեռ և ոլորում",
        "id": "Kantilever – beban merata dan torsi",
        "it": "Mensola – carico distribuito e torsione",
        "ja": "片持ちはり – 分布荷重とねじり",
        "ka": "კონსოლი – განაწილებული დატვირთვა და გრეხა",
        "ko": "캔틸레버 – 분포하중과 비틀림",
        "ky": "Консоль – бөлүштүрүлгөн жүк жана буроо",
        "my": "ကန်တီလီဗာ – ဖြန့်ဝေဝန်နှင့် လိမ်ခြင်း",
        "ne": "क्यान्टिलिभर – वितरित भार र मरोड",
        "pt": "Viga em balanço – carga distribuída e momento torsor",
        "ro": "Consolă – încărcare distribuită și moment de torsiune",
        "ru": "Консоль – распределённая нагрузка и кручение",
        "sl": "Konzola – zvezna obtežba in torzija",
        "sq": "Tra konsol – ngarkesë e shpërndarë dhe përdredhje",
        "tg": "Консол – сарбории тақсимшуда ва печиш",
        "th": "คานยื่น – น้ำหนักบรรทุกแผ่กระจายและแรงบิด",
        "tl": "Cantilever – distributed load at torque",
        "ur": "کینٹیلیور – پھیلا ہوا لوڈ اور مروڑ",
        "uz": "Konsol – taqsimlangan yuk va buralish"
      },
      "objective": {
        "tr": "Ankastre mesnette düşey kuvvet, eğilme ve burulma tepkileri birlikte oluşur.",
        "en": "The fixed support develops vertical, bending and torsional reactions together.",
        "ar": "تنشأ عند الركيزة المثبتة ردود فعل رأسية وانحنائية والتوائية معًا.",
        "bg": "В запъването едновременно възникват вертикална, огъваща и усукваща реакция.",
        "bn": "আবদ্ধ অবলম্বনে উল্লম্ব, নমন ও মোচড় প্রতিক্রিয়া একসঙ্গে সৃষ্টি হয়।",
        "cn": "固定支座同时产生竖向、弯曲和扭转反力。",
        "de": "An der Einspannung entstehen gleichzeitig eine vertikale Auflagerkraft, ein Einspannmoment und ein Torsionsmoment.",
        "dz": "གཏན་བཟུང་རྟེན་ལུ་ ཀ་ཐད་ཤུགས་དང་ གུག་ཤུགས་ བཅུ་ཤུགས་ཀྱི་ལན་ཤུགས་ཚུ་ མཉམ་སྦེ་ཐོནམ་ཨིན།",
        "el": "Στην πάκτωση αναπτύσσονται ταυτόχρονα κατακόρυφη, καμπτική και στρεπτική αντίδραση.",
        "es": "En el empotramiento se desarrollan a la vez reacciones vertical, de flexión y de torsión.",
        "fa": "در تکیه‌گاه گیردار عکس‌العمل‌های قائم، خمشی و پیچشی هم‌زمان ایجاد می‌شوند.",
        "fr": "L'encastrement développe simultanément des réactions verticale, de flexion et de torsion.",
        "he": "בריתום נוצרות בו-זמנית ריאקציה אנכית, מומנט כפיפה ומומנט פיתול.",
        "hi": "स्थिर आधार पर ऊर्ध्वाधर, बंकन और मरोड़ प्रतिक्रियाएँ एक साथ उत्पन्न होती हैं।",
        "hy": "Կոշտ ամրակցումում միաժամանակ առաջանում են ուղղաձիգ, ծռող և ոլորող հակազդեցություններ։",
        "id": "Pada tumpuan jepit timbul reaksi vertikal, lentur, dan torsi secara bersamaan.",
        "it": "Nell'incastro nascono insieme reazioni verticale, flettente e torcente.",
        "ja": "固定支点には鉛直、曲げ、ねじりの反力が同時に生じます。",
        "ka": "ხისტ ჩამაგრებაში ერთდროულად წარმოიქმნება ვერტიკალური, მღუნავი და მგრეხი რეაქციები.",
        "ko": "고정 지점에는 연직, 휨, 비틀림 반력이 함께 생깁니다.",
        "ky": "Катуу бекитүүдө вертикалдык, ийүүчү жана буроочу реакциялар бирге пайда болот.",
        "my": "ပုံသေထောက်ကန်မှုတွင် ဒေါင်လိုက်၊ ကွေးခြင်းနှင့် လိမ်ခြင်း တုံ့ပြန်အားများ အတူတကွ ဖြစ်ပေါ်သည်။",
        "ne": "स्थिर आधारमा ठाडो, बंकन र मरोड प्रतिक्रियाहरू एकसाथ उत्पन्न हुन्छन्।",
        "pt": "No engaste surgem simultaneamente reações vertical, de flexão e de torção.",
        "ro": "În încastrare apar simultan reacțiuni verticală, de încovoiere și de torsiune.",
        "ru": "В заделке одновременно возникают вертикальная реакция, изгибающий и крутящий реактивные моменты.",
        "sl": "V vpetju hkrati nastanejo navpična, upogibna in torzijska reakcija.",
        "sq": "Në ngulitje lindin njëkohësisht reaksione vertikal, përkulës dhe përdredhës.",
        "tg": "Дар маҳкамкунии сахт реаксияҳои амудӣ, хамкунанда ва печонанда якҷоя пайдо мешаванд.",
        "th": "ที่จุดรองรับแบบยึดแน่นเกิดแรงปฏิกิริยาแนวดิ่ง โมเมนต์ดัด และโมเมนต์บิดพร้อมกัน",
        "tl": "Sabay-sabay na nagkakaroon ng patayo, bending at torsional na reaksyon sa fixed support.",
        "ur": "فکسڈ سہارے پر عمودی، خمشی اور مروڑی ردِعمل ایک ساتھ پیدا ہوتے ہیں۔",
        "uz": "Bikr mahkamlashda vertikal, eguvchi va burovchi reaksiyalar birgalikda hosil boʻladi."
      },
      "level": "intermediate",
      "order": 9
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 3
    },
    "supports": [
      {
        "type": "fixed-support",
        "x": 0
      }
    ],
    "hinges": [],
    "concentratedLoads": [],
    "distributedLoads": [
      {
        "startX": 0,
        "endX": 3,
        "magnitude": -3
      }
    ],
    "trapezoidalLoads": [],
    "concentratedMoments": [],
    "torsionMoments": [
      {
        "x": 3,
        "magnitude": 4
      }
    ],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 9,
          "Mz": 13.5
        }
      ],
      "Mmax": 0,
      "Mmin": -13.5,
      "Vmax": 9,
      "Vmin": 0
    }
  },
  "model_14": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Neden çözülmüyor? – hiperstatik kiriş",
        "en": "Why can't it be solved? – indeterminate beam",
        "ar": "لماذا لا يمكن حلها؟ – كمرة غير محددة استاتيكيًا",
        "bg": "Защо не може да се реши? – статически неопределима греда",
        "bn": "কেন সমাধান করা যায় না? – স্থিতিগতভাবে অনির্ণেয় বিম",
        "cn": "为什么无法求解？ – 超静定梁",
        "de": "Warum nicht lösbar? – statisch unbestimmter Träger",
        "dz": "ག་ཅི་སྦེ་ཐག་གཅོད་མ་ཚུགས? – ཆ་སྙོམས་ཀྱིས་ཐག་གཅོད་མ་ཚུགས་པའི་གདུང་མ",
        "el": "Γιατί δεν επιλύεται; – υπερστατική δοκός",
        "es": "¿Por qué no se puede resolver? – viga hiperestática",
        "fa": "چرا حل نمی‌شود؟ – تیر نامعین",
        "fr": "Pourquoi est-ce insoluble ? – poutre hyperstatique",
        "he": "למה אי אפשר לפתור? – קורה בלתי מסוימת סטטית",
        "hi": "हल क्यों नहीं होता? – स्थैतिकतः अनिर्धार्य धरन",
        "hy": "Ինչո՞ւ չի լուծվում – ստատիկորեն անորոշելի հեծան",
        "id": "Mengapa tidak dapat diselesaikan? – balok statis tak tentu",
        "it": "Perché non si risolve? – trave iperstatica",
        "ja": "なぜ解けないのか？ – 不静定はり",
        "ka": "რატომ არ იხსნება? – სტატიკურად ურკვევი ძელი",
        "ko": "왜 풀리지 않을까? – 부정정보",
        "ky": "Эмне үчүн чечилбейт? – статикалык аныкталбаган балка",
        "my": "ဘာကြောင့် မဖြေရှင်းနိုင်သလဲ။ – စတက်တစ်အရ ဆုံးဖြတ်မရသော ရက်မ",
        "ne": "किन हल हुँदैन? – स्थैतिक रूपमा अनिर्धार्य बिम",
        "pt": "Por que não se resolve? – viga hiperestática",
        "ro": "De ce nu se poate rezolva? – grindă static nedeterminată",
        "ru": "Почему не решается? – статически неопределимая балка",
        "sl": "Zakaj ni rešljiv? – statično nedoločen nosilec",
        "sq": "Pse nuk zgjidhet? – tra statikisht i papërcaktuar",
        "tg": "Чаро ҳал намешавад? – тири аз ҷиҳати статикӣ номуайян",
        "th": "ทำไมจึงแก้ไม่ได้? – คานอินดีเทอร์มิเนตเชิงสถิต",
        "tl": "Bakit hindi ito malutas? – indeterminate na biga",
        "ur": "یہ حل کیوں نہیں ہوتی؟ – سٹیٹیکلی غیر معین بیم",
        "uz": "Nega yechilmaydi? – statik noaniq toʻsin"
      },
      "objective": {
        "tr": "Bilinmeyen sayısı (4) denge denklemlerinden (3) fazla: sistem 1. derece hiperstatiktir.",
        "en": "There are more unknowns (4) than equilibrium equations (3): the beam is indeterminate to degree 1.",
        "ar": "عدد المجاهيل (4) أكبر من عدد معادلات الاتزان (3): الكمرة غير محددة استاتيكيًا من الدرجة 1.",
        "bg": "Неизвестните (4) са повече от уравненията за равновесие (3): гредата е еднократно статически неопределима.",
        "bn": "অজানা রাশি (4) সাম্যাবস্থার সমীকরণের (3) চেয়ে বেশি: বিমটি 1 মাত্রায় স্থিতিগতভাবে অনির্ণেয়।",
        "cn": "未知量数 (4) 多于平衡方程数 (3)：该梁为一次超静定。",
        "de": "Es gibt mehr Unbekannte (4) als Gleichgewichtsbedingungen (3): Der Träger ist einfach statisch unbestimmt.",
        "dz": "མ་ཤེས་པའི་གྲངས་ (4) འདི་ ཆ་སྙོམས་ཀྱི་མཉམ་རྟགས་ (3) ལས་ལྷགཔ་ཨིན། གདུང་མ་འདི་ རིམ་པ་ 1 གི་ཆ་སྙོམས་ཀྱིས་ཐག་གཅོད་མ་ཚུགས་པ་ཨིན།",
        "el": "Οι άγνωστοι (4) είναι περισσότεροι από τις εξισώσεις ισορροπίας (3): η δοκός είναι μία φορά υπερστατική.",
        "es": "Hay más incógnitas (4) que ecuaciones de equilibrio (3): la viga es hiperestática de grado 1.",
        "fa": "تعداد مجهولات (4) از معادلات تعادل (3) بیشتر است: تیر یک درجه نامعین استاتیکی است.",
        "fr": "Il y a plus d'inconnues (4) que d'équations d'équilibre (3) : la poutre est hyperstatique de degré 1.",
        "he": "מספר הנעלמים (4) גדול ממספר משוואות שיווי המשקל (3): הקורה בלתי מסוימת סטטית מדרגה 1.",
        "hi": "अज्ञात (4) संतुलन समीकरणों (3) से अधिक हैं: धरन 1 घात से स्थैतिकतः अनिर्धार्य है।",
        "hy": "Անհայտները (4) ավելի շատ են, քան հավասարակշռության հավասարումները (3). հեծանը 1 անգամ ստատիկորեն անորոշելի է։",
        "id": "Jumlah bilangan tak diketahui (4) lebih banyak daripada persamaan keseimbangan (3): balok statis tak tentu berderajat 1.",
        "it": "Le incognite (4) sono più delle equazioni di equilibrio (3): la trave è una volta iperstatica.",
        "ja": "未知数 (4) がつり合い式 (3) より多いため、はりは 1 次不静定です。",
        "ka": "უცნობები (4) მეტია წონასწორობის განტოლებებზე (3): ძელი ერთხელ სტატიკურად ურკვევია.",
        "ko": "미지수(4)가 평형방정식(3)보다 많습니다. 보는 1차 부정정입니다.",
        "ky": "Белгисиздер (4) тең салмактуулук теңдемелеринен (3) көп: балка 1 даражада статикалык аныкталбаган.",
        "my": "မသိကိန်းများ (4) သည် ညီမျှခြင်းအခြေအနေ ညီမျှခြင်းများ (3) ထက် ပိုများသည်။ ရက်မသည် ဒီဂရီ 1 စတက်တစ်အရ ဆုံးဖြတ်မရပါ။",
        "ne": "अज्ञातहरू (4) सन्तुलन समीकरणहरू (3) भन्दा बढी छन्: बिम 1 डिग्रीले स्थैतिक रूपमा अनिर्धार्य छ।",
        "pt": "Há mais incógnitas (4) do que equações de equilíbrio (3): a viga é hiperestática de grau 1.",
        "ro": "Există mai multe necunoscute (4) decât ecuații de echilibru (3): grinda este o dată static nedeterminată.",
        "ru": "Неизвестных (4) больше, чем уравнений равновесия (3): балка один раз статически неопределима.",
        "sl": "Neznank (4) je več kot ravnotežnih enačb (3): nosilec je enkrat statično nedoločen.",
        "sq": "Të panjohurat (4) janë më shumë se ekuacionet e ekuilibrit (3): trau është një herë statikisht i papërcaktuar.",
        "tg": "Номаълумҳо (4) аз муодилаҳои мувозинат (3) зиёданд: тир як маротиба аз ҷиҳати статикӣ номуайян аст.",
        "th": "ตัวไม่ทราบค่า (4) มีมากกว่าสมการสมดุล (3): คานเป็นอินดีเทอร์มิเนตเชิงสถิตขั้นที่ 1",
        "tl": "Mas marami ang hindi alam (4) kaysa sa mga equation ng equilibrium (3): statically indeterminate ang biga sa degree 1.",
        "ur": "نامعلوم (4) توازن کی مساواتوں (3) سے زیادہ ہیں: بیم پہلے درجے کی سٹیٹیکلی غیر معین ہے۔",
        "uz": "Nomaʼlumlar (4) muvozanat tenglamalaridan (3) koʻp: toʻsin bir marta statik noaniq."
      },
      "level": "advanced",
      "order": 14,
      "expectSolvable": false
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 5
    },
    "supports": [
      {
        "type": "fixed-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 5
      }
    ],
    "hinges": [],
    "concentratedLoads": [],
    "distributedLoads": [
      {
        "startX": 0,
        "endX": 5,
        "magnitude": -2
      }
    ],
    "trapezoidalLoads": [],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "status": "hyperstatic",
      "degree": 1
    }
  }
};
