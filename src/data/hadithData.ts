export interface HadithQuiz {
  question: string;
  options: string[];
  answerIdx: number;
  explanationEn: string;
  explanationUr: string;
}

export interface HadithItem {
  id: string;
  titleEn: string;
  titleUr: string;
  category: "manners" | "kindness" | "cleanliness" | "truth" | "quran" | "character";
  categoryLabelEn: string;
  categoryLabelUr: string;
  arabicText: string;
  transliteration?: string;
  translationEn: string;
  translationUr: string;
  sourceEn: string;
  sourceUr: string;
  moralLessonEn: string;
  moralLessonUr: string;
  practicalExampleEn: string;
  practicalExampleUr: string;
  quiz: HadithQuiz;
  iconEmoji: string;
}

export const HADITH_ITEMS: HadithItem[] = [
  {
    id: "hadith_smile",
    titleEn: "1. Smiling is Charity (Sadaqah)",
    titleUr: "۱. مسکرانا صدقہ ہے",
    category: "manners",
    categoryLabelEn: "Good Manners",
    categoryLabelUr: "حسنِ اخلاق",
    arabicText: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
    transliteration: "Tabassumuka fii wajhi akhiika laka sadaqah",
    translationEn: "Your smiling in the face of your brother is charity for you.",
    translationUr: "تمہارا اپنے بھائی کے سامنے مسکرانا تمہارے لیے صدقہ ہے۔",
    sourceEn: "Sunan al-Tirmidhi #1956 (Sahih)",
    sourceUr: "سنن ترمذی (۱۹۵۶ - صحیح)",
    moralLessonEn: "You don't need money to give charity! Sharing a warm, friendly smile spreads happiness and earns rewards from Allah.",
    moralLessonUr: "صدقہ دینے کے لیے پیسے ہونا ضروری نہیں! اپنے بہن بھائیوں اور دوستوں کو دیکھ کر مسکرانا بھی بہترین صدقہ ہے۔",
    practicalExampleEn: "When you see your classmate or sibling in the morning, greet them with a big bright smile instead of a grumpy face!",
    practicalExampleUr: "صبح سکول یا گھر میں جب اپنے بھائی، بہن یا دوست سے ملیں تو ایک پیاری مسکراہٹ کے ساتھ السلام علیکم کہیں۔",
    quiz: {
      question: "What did Prophet Muhammad ﷺ teach us about smiling at others?",
      options: [
        "It is rewarded as Charity (Sadaqah)",
        "It is only for grown-ups",
        "It has no spiritual reward"
      ],
      answerIdx: 0,
      explanationEn: "Smiling warms hearts and spreads peace! Allah rewards you with Sadaqah for every genuine smile.",
      explanationUr: "مسکراہٹ دلوں کو جوڑتی ہے۔ اللہ تعالیٰ ہر سچی مسکراہٹ پر صدقے کا ثواب عطا فرماتا ہے۔"
    },
    iconEmoji: "😊"
  },
  {
    id: "hadith_kindness",
    titleEn: "2. Kindness Beautifies Everything",
    titleUr: "۲. نرمی ہر چیز کو خوبصورت بناتی ہے",
    category: "kindness",
    categoryLabelEn: "Kindness & Compassion",
    categoryLabelUr: "نرمی اور شفقت",
    arabicText: "إِنَّ الرِّفْقَ لَا يَكُونُ فِي شَيْءٍ إِلَّا زَانَهُ",
    transliteration: "Innar-rifqa laa yakuunu fii shai'in illaa zaanah",
    translationEn: "Indeed, kindness is not found in anything except that it beautifies it.",
    translationUr: "بیشک نرمی جس چیز میں بھی ہوتی ہے اسے خوبصورت بنا دیتی ہے۔",
    sourceEn: "Sahih Muslim #2594",
    sourceUr: "صحیح مسلم (۲۵۹۴)",
    moralLessonEn: "Being gentle and soft in your words and actions makes your personality shiny and beloved to everyone around you.",
    moralLessonUr: "اپنی بات اور رویے میں نرمی لانا ہر کام اور انسان کی شخصیت کو دلکش اور محبوب بنا دیتا ہے۔",
    practicalExampleEn: "If your pet cat or bird comes near you, touch them gently with love. If your friend drops a pencil, hand it back nicely.",
    practicalExampleUr: "اگر کسی دوست کی پنسل گر جائے تو پیار سے اٹھا کر دیں، اور پرندوں و جانوروں سے ہمیشہ نرمی برتیں۔",
    quiz: {
      question: "What happens when kindness is added to any deed or behavior?",
      options: [
        "It makes it messy",
        "It beautifies and elevates it",
        "It makes people angry"
      ],
      answerIdx: 1,
      explanationEn: "Kindness softens hearts and adds grace to every single act!",
      explanationUr: "نرمی ہر کام میں خوبصورتی اور وقار پیدا کرتی ہے!"
    },
    iconEmoji: "🌸"
  },
  {
    id: "hadith_clean",
    titleEn: "3. Cleanliness is Half of Faith",
    titleUr: "۳. صفائی نصف ایمان ہے",
    category: "cleanliness",
    categoryLabelEn: "Purity & Hygiene",
    categoryLabelUr: "طہارت اور صفائی",
    arabicText: "الطَّهُورُ شَطْرُ الإِيمَانِ",
    transliteration: "At-tahooru shatrul-iimaan",
    translationEn: "Cleanliness is half of faith.",
    translationUr: "صفائی اور پاکیزگی نصف ایمان ہے۔",
    sourceEn: "Sahih Muslim #223",
    sourceUr: "صحیح مسلم (۲۲۳)",
    moralLessonEn: "A good Muslim keeps their body clean, clothes neat, room tidy, and mind pure. Allah loves those who keep clean!",
    moralLessonUr: "ایک سچا مسلمان اپنے جسم، کپڑے، کمرہ اور ارد گرد کے ماحول کو پاک صاف رکھتا ہے۔",
    practicalExampleEn: "Wash your hands with soap before meals, brush teeth twice daily, and arrange your toys after playing.",
    practicalExampleUr: "کھانے سے پہلے ہاتھ دھوئیں، روزانہ دانت صاف کریں اور کھیلنے کے بعد اپنے کھلونے سنبھال کر رکھیں۔",
    quiz: {
      question: "According to this Hadith, cleanliness represents how much of faith?",
      options: [
        "A small bonus",
        "Half of faith",
        "Only relevant on Fridays"
      ],
      answerIdx: 1,
      explanationEn: "Staying clean and performing Wudu represents 50% of our complete faith in Islam!",
      explanationUr: "پاک صاف رہنا اور وضو کرنا ہمارے پورے ایمان کا آدھا حصہ ہے!"
    },
    iconEmoji: "🧼"
  },
  {
    id: "hadith_brotherhood",
    titleEn: "4. Wish for Others What You Wish for Yourself",
    titleUr: "۴. دوسروں کے لیے وہی پسند کرو جو اپنے لیے پسند کرتے ہو",
    category: "character",
    categoryLabelEn: "Good Character",
    categoryLabelUr: "شائستہ کردار",
    arabicText: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    transliteration: "Laa yu'minu ahadukum hatta yuhibba li-akhiihi maa yuhibbu li-nafsih",
    translationEn: "None of you truly believes until he loves for his brother what he loves for himself.",
    translationUr: "تم میں سے کوئی مومن نہیں ہو سکتا جب تک اپنے بھائی کے لیے وہی پسند نہ کرے جو اپنے لیے پسند کرتا ہے۔",
    sourceEn: "Sahih al-Bukhari #13 & Sahih Muslim #45",
    sourceUr: "صحیح بخاری (۱۳) و صحیح مسلم (۴۵)",
    moralLessonEn: "Generosity and selfless love make a true Muslim. Share your favorite things and never feel jealous of others.",
    moralLessonUr: "سچا مسلمان سخاوت کرنے والا ہوتا ہے۔ اپنے دوستوں کے ساتھ کھلونے اور خوشیاں بانٹیں اور حسد سے بچیں۔",
    practicalExampleEn: "If you get a delicious treat, share a piece with your sibling or friend so they can taste the joy too!",
    practicalExampleUr: "جب آپ کو مزیدار ٹافی یا کیک ملے تو اپنے بہن بھائی کے ساتھ بھی خوشی سے شیئر کریں۔",
    quiz: {
      question: "How should a young Muslim treat their friends and siblings?",
      options: [
        "Keep the best toys for themselves only",
        "Wish for them the exact same goodness they want for themselves",
        "Ignore their feelings"
      ],
      answerIdx: 1,
      explanationEn: "True faith shines when we want our friends and family to be just as happy and blessed as we are!",
      explanationUr: "ایمان کی حلاوت تب ملتی ہے جب ہم اپنے دوستوں اور بہن بھائیوں کی خوشی کو اپنی خوشی سمجھیں۔"
    },
    iconEmoji: "🤝"
  },
  {
    id: "hadith_best_quran",
    titleEn: "5. The Best Among You Learn the Quran",
    titleUr: "۵. تم میں سے بہترین وہ ہے جو قرآن سیکھے",
    category: "quran",
    categoryLabelEn: "Quran & Faith",
    categoryLabelUr: "قرآن اور ایمان",
    arabicText: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    transliteration: "Khairukum man ta'allamal-Qur'ana wa 'allamah",
    translationEn: "The best among you are those who learn the Quran and teach it.",
    translationUr: "تم میں سے بہترین شخص وہ ہے جو قرآن سیکھے اور سکھائے۔",
    sourceEn: "Sahih al-Bukhari #5027",
    sourceUr: "صحیح بخاری (۵۰۲۷)",
    moralLessonEn: "Spending time reading, memorizing, and understanding the Quran makes you a superstar in the eyes of Allah!",
    moralLessonUr: "قرآن مجید کو توجہ سے پڑھنا، سیکھنا اور یاد کرنا انسان کو اللہ کے نزدیک سب سے افضل بناتا ہے۔",
    practicalExampleEn: "Recite one Surah every afternoon with Tajweed and help your younger brother memorize short Surahs.",
    practicalExampleUr: "روزانہ شوق سے قاری صاحب یا امی کے ساتھ قرآن پڑھیں اور چھوٹے بہن بھائیوں کو سورتیں یاد کروائیں۔",
    quiz: {
      question: "Who are named as the 'best of people' by Prophet Muhammad ﷺ?",
      options: [
        "Those who learn and teach the Quran",
        "Those who watch cartoons all day",
        "Those who win video games"
      ],
      answerIdx: 0,
      explanationEn: "The Holy Quran is the divine word of Allah. Learning it elevates your status higher than anything else!",
      explanationUr: "قرآن مجید اللہ کا کلام ہے۔ اسے پڑھنے اور سکھانے والے دنیا و آخرت کے ہیرو ہیں۔"
    },
    iconEmoji: "📖"
  },
  {
    id: "hadith_truth",
    titleEn: "6. Truthfulness Leads to Paradise",
    titleUr: "۶. سچائی جنت کا راستہ ہے",
    category: "truth",
    categoryLabelEn: "Honesty & Truth",
    categoryLabelUr: "سچائی اور دیانت",
    arabicText: "إِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ",
    transliteration: "Innas-sidqa yahdii ilal-birri wa innal-birra yahdii ilal-Jannah",
    translationEn: "Truthfulness leads to righteousness, and righteousness leads to Paradise.",
    translationUr: "بیشک سچائی نیکی کی طرف لے جاتی ہے اور نیکی جنت کا راستہ دکھاتی ہے۔",
    sourceEn: "Sahih al-Bukhari #6094",
    sourceUr: "صحیح بخاری (۶۰۹۴)",
    moralLessonEn: "Always tell the truth even when you make a mistake. Honesty brings bravery, peace of heart, and Allah's love.",
    moralLessonUr: "ہمیشہ سچ بولیں خواہ غلطی ہی کیوں نہ ہو جائے۔ سچائی انسان کو بہادر اور اللہ کا محبوب بناتی ہے۔",
    practicalExampleEn: "If you accidentally break a glass while playing, immediately tell your parents truthfully: 'Mom, I accidentally broke it, I am sorry.'",
    practicalExampleUr: "اگر گلاس غلطی سے ٹوٹ جائے تو چھپانے کے بجائے امی کو سچ بتا دیں کہ 'امی مجھ سے غلطی سے ٹوٹ گیا، معاف کر دیں۔'",
    quiz: {
      question: "Where does being honest and truthful ultimately lead us?",
      options: [
        "To trouble and fear",
        "To Righteousness and Paradise (Jannah)",
        "To nowhere special"
      ],
      answerIdx: 1,
      explanationEn: "Truthfulness opens the golden gates of Jannah and makes everyone trust and respect you!",
      explanationUr: "سچائی انسان کو نیک بناتی ہے اور نیک لوگوں کا برحق ٹھکانا جنت ہے۔"
    },
    iconEmoji: "🌟"
  },
  {
    id: "hadith_parents",
    titleEn: "7. Pleasing Parents Pleases Allah",
    titleUr: "۷. والدین کی رضامندی میں اللہ کی رضا ہے",
    category: "manners",
    categoryLabelEn: "Good Manners",
    categoryLabelUr: "حسنِ اخلاق",
    arabicText: "رِضَا الرَّبِّ فِي رِضَا الْوَالِدِ وَسَخَطُ الرَّبِّ فِي سَخَطِ الْوَالِدِ",
    transliteration: "Ridar-Rabbi fii ridal-waalidi wa sakhatur-Rabbi fii sakhatil-waalid",
    translationEn: "The pleasure of the Lord is in the pleasure of the parent, and the displeasure of the Lord is in the displeasure of the parent.",
    translationUr: "رب کی رضا والد کی رضا میں ہے، اور رب کی ناراضگی والد کی ناراضگی میں ہے۔",
    sourceEn: "Jami at-Tirmidhi #1899 (Sahih)",
    sourceUr: "جامع ترمذی (۱۸۹۹ - صحیح)",
    moralLessonEn: "Making your mother and father happy through obedience, polite speech, and helping them earns Allah's immense love and blessings.",
    moralLessonUr: "والدین کی اطاعت، ادب اور خدمت کرنے سے اللہ تعالیٰ راضی ہوتا ہے اور زندگی میں برکت آتی ہے۔",
    practicalExampleEn: "When your parents ask you to clean your room or stop playing, obey with a smile and say 'Yes Mom, right away!'",
    practicalExampleUr: "جب امی یا ابو کوئی کام کہیں تو فوراً مسکرا کر لبیک کہیں اور خوشی سے ان کا کہنا مانیں۔",
    quiz: {
      question: "How can a young Muslim earn Allah's pleasure according to this Hadith?",
      options: [
        "By pleasing and respecting their parents",
        "By ignoring their parents' advice",
        "By arguing with elders"
      ],
      answerIdx: 0,
      explanationEn: "Pleasing your parents brings Allah's happiness and opens doors to success!",
      explanationUr: "والدین کی خوشی میں اللہ تعالیٰ کی خوشی پوشیدہ ہے!"
    },
    iconEmoji: "❤️"
  },
  {
    id: "hadith_anger",
    titleEn: "8. True Strength is Controlling Anger",
    titleUr: "۸. سچی طاقت غصے پر قابو پانا ہے",
    category: "character",
    categoryLabelEn: "Good Character",
    categoryLabelUr: "شائستہ کردار",
    arabicText: "لَيْسَ الشَّدِيدُ بِالصُُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ",
    transliteration: "Laisash-shadiidu bis-sura'ati, innamash-shadiidul-ladhii yamliku nafsahu 'indal-ghadab",
    translationEn: "The strong person is not the one who overcomes people by his strength, but the strong person is the one who controls himself while angry.",
    translationUr: "طاقتور وہ نہیں جو لوگوں کو پچھاڑ دے، بلکہ واقعی طاقتور وہ ہے جو غصے کے وقت اپنے آپ پر قابو رکھے۔",
    sourceEn: "Sahih al-Bukhari #6114 & Sahih Muslim #2609",
    sourceUr: "صحیح بخاری (۶۱۱۴) و صحیح مسلم (۲۶۰۹)",
    moralLessonEn: "Real heroes stay calm when annoyed. Controlling your temper shows true courage and spiritual discipline.",
    moralLessonUr: "اصلی ہیرو وہ ہے جو غصہ آنے پر خاموش رہے، تعوذ (اعوذ باللہ) پڑھے اور صبر سے کام لے۔",
    practicalExampleEn: "When you feel upset during a game, take a deep breath, sit down, and say 'A'udhu billahi minash-shaitanir-rajim'.",
    practicalExampleUr: "غصہ آئے تو اعوذ باللہ من الشیطان الرجیم پڑھیں، ٹھنڈا پانی پیئیں اور جگہ بدل لیں۔",
    quiz: {
      question: "Who is the truly strong person described by Prophet Muhammad ﷺ?",
      options: [
        "Someone who wins physical fights",
        "Someone who controls their temper when angry",
        "Someone who yells the loudest"
      ],
      answerIdx: 1,
      explanationEn: "Self-control and patience in anger demonstrate supreme inner strength and moral victory!",
      explanationUr: "غصے پر قابو پانا اور صبر کرنا انسان کی حقیقی روحانی طاقت کی علامت ہے۔"
    },
    iconEmoji: "🧘"
  },
  {
    id: "hadith_mercy",
    titleEn: "9. Be Merciful to Earthly Creatures",
    titleUr: "۹. زمین والوں پر رحم کرو",
    category: "kindness",
    categoryLabelEn: "Kindness & Compassion",
    categoryLabelUr: "نرمی اور شفقت",
    arabicText: "ارْحَمُوا مَنْ فِي الْأَرْضِ يَرْحَمْكُمْ مَنْ فِي السَّمَاءِ",
    transliteration: "Irhamuu man fil-ardi yarhamkum man fis-samaa'",
    translationEn: "Be merciful to those on the earth, and the One in the heaven will have mercy upon you.",
    translationUr: "تم زمین والوں پر رحم کرو، آسمان والا تم پر رحم کرے گا۔",
    sourceEn: "Sunan Abi Dawood #4941 (Sahih)",
    sourceUr: "سنن ابی داؤد (۴۹۴۱ - صحیح)",
    moralLessonEn: "Show mercy to humans, animals, birds, and plants. When you show compassion to creatures, Allah showers mercy on you.",
    moralLessonUr: "انسانوں، جانوروں اور تمام مخلوق پر رحم کریں۔ اللہ تعالیٰ رحمدل لوگوں سے بے حد محبت فرماتا ہے۔",
    practicalExampleEn: "Put out a small bowl of clean water for birds on hot afternoon days and feed a stray kitten gently.",
    practicalExampleUr: "گرم موسم میں پرندوں کے لیے چھت پر پانی رکھیں اور جانوروں کے ساتھ پیار اور رحم کا سلوک کریں۔",
    quiz: {
      question: "What blessing do we receive when we show mercy to creatures on Earth?",
      options: [
        "Allah in Heaven showers His Mercy upon us",
        "Nothing happens",
        "We lose our good deeds"
      ],
      answerIdx: 0,
      explanationEn: "Compassion is a universal key! Showing kindness to all creation brings Allah's eternal mercy.",
      explanationUr: "خلقِ خدا پر رحم کرنے والوں پر اللہ رب العزت کی خاص رحمت نازل ہوتی ہے۔"
    },
    iconEmoji: "🕊️"
  },
  {
    id: "hadith_knowledge",
    titleEn: "10. Seeking Knowledge is an Obligation",
    titleUr: "۱۰. علم حاصل کرنا فرض ہے",
    category: "quran",
    categoryLabelEn: "Knowledge & Wisdom",
    categoryLabelUr: "علم و حکمت",
    arabicText: "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ",
    transliteration: "Talabul-'ilmi fariidatun 'alaa kulli Muslim",
    translationEn: "Seeking knowledge is an obligation upon every Muslim.",
    translationUr: "علم حاصل کرنا ہر مسلمان پر فرض ہے۔",
    sourceEn: "Sunan Ibn Majah #224 (Sahih)",
    sourceUr: "سنن ابن ماجہ (۲۲۴ - صحیح)",
    moralLessonEn: "Learning about Islam, science, math, and beneficial subjects illuminates your mind and builds a bright future.",
    moralLessonUr: "دینی و دنیاوی مفاد کا علم حاصل کرنا ہر مسلمان بچے، بڑے، مرد اور عورت پر فرض ہے۔",
    practicalExampleEn: "Read books with curiosity every day, pay attention in school, and ask your teacher questions politely.",
    practicalExampleUr: "روزانہ نیا علم سیکھیں، کتابیں پڑھیں اور اپنے اساتذہ و والدین سے شوق سے سوالات پوچھیں۔",
    quiz: {
      question: "Is seeking beneficial knowledge optional or obligatory for Muslims?",
      options: [
        "It is an obligation (Fard) for every Muslim",
        "It is only for scholars",
        "It is not important"
      ],
      answerIdx: 0,
      explanationEn: "Islam places high honor on education and lifelong learning for both boys and girls!",
      explanationUr: "اسلام علم حاصل کرنے کو ہر مسلمان پر لازمی فرض قرار دیتا ہے!"
    },
    iconEmoji: "📚"
  }
];
