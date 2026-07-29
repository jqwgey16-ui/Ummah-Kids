export type Language = "en" | "ur" | "ar";

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    ur: string;
    ar: string;
  };
}

export const translations: TranslationDictionary = {
  // Brand & General Navigation
  appName: {
    en: "Ummah Kids",
    ur: "امت کڈز",
    ar: "أمة كيدز"
  },
  tagline: {
    en: "Learn Islam with Knowledge, Faith & Fun",
    ur: "علم، ایمان اور خوشی کے ساتھ اسلام سیکھیں",
    ar: "تعلم الإسلام بالمعرفة والإيمان والمرح"
  },
  byAuthor: {
    en: "by Inaamullah",
    ur: "انعام اللہ کی پیشکش",
    ar: "إعداد إنعام الله"
  },
  home: {
    en: "Home",
    ur: "ہوم",
    ar: "الرئيسية"
  },
  allStories: {
    en: "All Stories",
    ur: "تمام کہانیاں",
    ar: "كل القصص"
  },
  quranReader: {
    en: "Quran Reader",
    ur: "قرآن مجید",
    ar: "القرآن الكريم"
  },
  aiTeacher: {
    en: "AI Teacher",
    ur: "اسلامی اے آئی استاد",
    ar: "المعلم الذكي"
  },
  salahGuide: {
    en: "Learn Salah",
    ur: "نماز سیکھیں",
    ar: "تعلم الصلاة"
  },
  dailyDuas: {
    en: "Daily Duas",
    ur: "مسنون دعائیں",
    ar: "الأدعية اليومية"
  },
  hadithSection: {
    en: "Hadith Reader",
    ur: "احادیثِ مبارکہ",
    ar: "الأحاديث النبوية"
  },
  islamicVideos: {
    en: "Islamic Videos",
    ur: "اسلامی ویڈیوز",
    ar: "الفيديوهات الإسلامية"
  },
  games: {
    en: "Islamic Games",
    ur: "اسلامی کھیل",
    ar: "الألعاب الإسلامية"
  },
  askScholar: {
    en: "Ask Scholar",
    ur: "عالم سے پوچھیں",
    ar: "اسأل العالم"
  },
  myBookmarks: {
    en: "My Bookmarks",
    ur: "پسندیدہ",
    ar: "إشاراتي المرجعية"
  },
  bookmarks: {
    en: "Bookmarks",
    ur: "پسندیدہ",
    ar: "إشارات المرجعية"
  },
  aiStoryTeller: {
    en: "AI Storyteller",
    ur: "جادوئی کہانیاں",
    ar: "حكواتي الذكاء الاصطناعي"
  },
  aboutContact: {
    en: "About & Contact",
    ur: "ہمارے بارے میں",
    ar: "من نحن واتصل بنا"
  },
  aboutUs: {
    en: "About Us",
    ur: "ہمارے بارے میں",
    ar: "عنا"
  },
  contactUs: {
    en: "Contact Us",
    ur: "رابطہ کریں",
    ar: "اتصل بنا"
  },
  admin: {
    en: "Admin",
    ur: "ایڈمن",
    ar: "المشرف"
  },

  // Auth & Profile
  login: {
    en: "Log In",
    ur: "لاگ ان",
    ar: "تسجيل الدخول"
  },
  register: {
    en: "Register",
    ur: "رجسٹر کریں",
    ar: "إنشاء حساب"
  },
  logout: {
    en: "Log Out",
    ur: "لاگ آؤٹ",
    ar: "تسجيل الخروج"
  },
  parentPortalLogin: {
    en: "Parent Portal Log In",
    ur: "والدین پورٹل لاگ ان",
    ar: "تسجيل دخول بوابة أولياء الأمور"
  },
  createParentAccount: {
    en: "Create Parent Account",
    ur: "والدین کا نیا اکاؤنٹ بنائیں",
    ar: "إنشاء حساب ولي أمر جديد"
  },
  resetPassword: {
    en: "Reset Password",
    ur: "پاس ورڈ ری سیٹ کریں",
    ar: "إعادة ضبط كلمة المرور"
  },
  forgotPassword: {
    en: "Forgot Password?",
    ur: "پاس ورڈ بھول گئے؟",
    ar: "نسيت كلمة المرور؟"
  },
  parentControlSuite: {
    en: "Secured Parental Control Suite",
    ur: "محفوظ والدینی نگرانی کا نظام",
    ar: "نظام الرقابة الأبوية الآمن"
  },
  parentDashboard: {
    en: "Parent Dashboard",
    ur: "والدین کا ڈیش بورڈ",
    ar: "لوحة تحكم الآباء"
  },
  kidsProfiles: {
    en: "Kids Profiles",
    ur: "بچوں کے پروفائلز",
    ar: "ملفات الأطفال"
  },
  points: {
    en: "Points",
    ur: "پوائنٹس",
    ar: "نقاط"
  },
  streakDays: {
    en: "Day Streak",
    ur: "روزہ سلسلہ",
    ar: "أيام متتالية"
  },
  lastRead: {
    en: "Last Read",
    ur: "آخری بار پڑھا",
    ar: "آخر قراءة"
  },
  lastWatched: {
    en: "Last Watched",
    ur: "آخری بار دیکھا",
    ar: "آخر مشاهدة"
  },
  progress: {
    en: "Progress",
    ur: "پیش رفت",
    ar: "التقدم"
  },
  badges: {
    en: "Badges",
    ur: "بیجز",
    ar: "الأوسمة"
  },
  achievements: {
    en: "Achievements",
    ur: "کامیابیاں",
    ar: "الإنجازات"
  },
  welcomeBack: {
    en: "Welcome Back!",
    ur: "خوش آمدید!",
    ar: "مرحباً بعودتك!"
  },
  selectProfile: {
    en: "Select a Child Profile to Start Learning",
    ur: "سیکھنا شروع کرنے کے لیے بچے کا پروفائل منتخب کریں",
    ar: "اختر ملفاً شخصياً للطفل لبدء التعلم"
  },
  addProfile: {
    en: "Add Child Profile",
    ur: "بچے کا پروفائل شامل کریں",
    ar: "إضافة ملف طفل"
  },
  childName: {
    en: "Child's Name",
    ur: "بچے کا نام",
    ar: "اسم الطفل"
  },
  childAge: {
    en: "Child's Age",
    ur: "بچے کی عمر",
    ar: "عمر الطفل"
  },
  selectAvatar: {
    en: "Select Avatar",
    ur: "تصویر منتخب کریں",
    ar: "اختر الصورة الرمزية"
  },
  createProfile: {
    en: "Create Profile",
    ur: "پروفائل بنائیں",
    ar: "إنشاء الملف الشخصي"
  },
  switchProfile: {
    en: "Switch Profile",
    ur: "پروفائل تبدیل کریں",
    ar: "تبديل الملف"
  },
  readingTime: {
    en: "Reading Time",
    ur: "پڑھنے کا وقت",
    ar: "وقت القراءة"
  },
  storiesRead: {
    en: "Stories Read",
    ur: "پڑھی گئی کہانیاں",
    ar: "القصص المقروءة"
  },
  videosWatched: {
    en: "Videos Watched",
    ur: "دیکھی گئی ویڈیوز",
    ar: "الفيديوهات المشاهدة"
  },
  quizResults: {
    en: "Quiz Results",
    ur: "کوئز کے نتائج",
    ar: "نتائج الاختبارات"
  },
  favoriteStories: {
    en: "Favorite Stories",
    ur: "پسندیدہ کہانیاں",
    ar: "القصص المفضلة"
  },
  noProfileSelected: {
    en: "Please select or create a profile to save progress & earn badges!",
    ur: "پیش رفت کو بچانے اور بیجز حاصل کرنے کے لیے براہ کرم ایک پروفائل منتخب کریں یا بنائیں!",
    ar: "يرجى تحديد أو إنشاء ملف شخصي لحفظ التقدم وكسب الأوسمة!"
  },

  // Search & Filters
  searchPlaceholder: {
    en: "Search by title, category, keywords, age, prophet...",
    ur: "عنوان، زمرہ، مطلوبہ الفاظ، عمر، یا نبی کے نام سے تلاش کریں...",
    ar: "ابحث بالاسم، الفئة، الكلمة، العمر، أو اسم النبي..."
  },
  searchTitle: {
    en: "Search Islamic Platform",
    ur: "اسلامی پلیٹ فارم پر تلاش کریں",
    ar: "البحث في المنصة الإسلامية"
  },
  categoryLabel: {
    en: "Category",
    ur: "زمرہ",
    ar: "الفئة"
  },
  ageGroupLabel: {
    en: "Age Group",
    ur: "عمر کا گروپ",
    ar: "الفئة العمرية"
  },
  prophetLabel: {
    en: "Prophet Associated",
    ur: "منسوب نبی",
    ar: "النبي المرتبط"
  },
  searchIn: {
    en: "Search In:",
    ur: "تلاش کریں:",
    ar: "البحث في:"
  },
  all: {
    en: "All",
    ur: "تمام",
    ar: "الكل"
  },
  titles: {
    en: "Titles",
    ur: "عناوین",
    ar: "العناوين"
  },
  prophets: {
    en: "Prophets",
    ur: "انبیاء کرام",
    ar: "الأنبياء"
  },
  categories: {
    en: "Categories",
    ur: "زمرہ جات",
    ar: "الفئات"
  },
  lessons: {
    en: "Lessons",
    ur: "اسباق",
    ar: "الدروس"
  },
  clear: {
    en: "Clear",
    ur: "صاف کریں",
    ar: "مسح"
  },
  clearSearch: {
    en: "Clear Search",
    ur: "تلاش صاف کریں",
    ar: "مسح البحث"
  },
  searchResults: {
    en: "Search Results",
    ur: "تلاش کے نتائج",
    ar: "نتائج البحث"
  },
  noStoriesFound: {
    en: "No matching stories found",
    ur: "کوئی کہانی نہیں ملی",
    ar: "لم يتم العثور على قصص متطابقة"
  },
  tryAnotherKeyword: {
    en: "Try another keyword or search by category below!",
    ur: "کسی اور لفظ سے تلاش کریں یا ذیل میں زمرہ منتخب کریں!",
    ar: "جرب كلمة مفتاحية أخرى أو ابحث حسب الفئة أدناه!"
  },

  // Hero Section & Welcome
  heroGreeting: {
    en: "Assalamu Alaikum Children!",
    ur: "السلام علیکم پیارے بچوں!",
    ar: "السلام عليكم يا أطفال!"
  },
  heroTitle: {
    en: "Ummah Kids",
    ur: "امت کڈز",
    ar: "أمة كيدز"
  },
  heroByAuthor: {
    en: "by Inaamullah",
    ur: "انعام اللہ کی پیشکش",
    ar: "إعداد إنعام الله"
  },
  heroSubtitle: {
    en: "Welcome to Ummah Kids, an authentic Islamic learning platform where children and families can explore the Quran, Prophets' Stories, Hadith, Daily Duas, Salah, Islamic Videos and an AI Islamic Teacher in a safe, beautiful and interactive environment.",
    ur: "امت کڈز میں خوش آمدید! بچوں اور خاندانوں کے لیے ایک مستند اسلامی تعلیمی پلیٹ فارم جہاں آپ قرآن، قصص الانبیاء، احادیث، مسنون دعائیں، نماز گائیڈ، اسلامی ویڈیوز اور اے آئی استاد کا فائدہ اٹھا سکتے ہیں۔",
    ar: "مرحباً بكم في أمة كيدز، منصة تعليمية إسلامية أصيلة حيث يمكن للأطفال والعائلات استكشاف القرآن الكريم وقصص الأنبياء والأحاديث والأدعية والصلاة والفيديوهات والمعلم الذكي."
  },
  startReading: {
    en: "Start Reading",
    ur: "پڑھنا شروع کریں",
    ar: "ابدأ القراءة"
  },
  askAiStoryteller: {
    en: "Ask AI Storyteller",
    ur: "اے آئی سے کہانی سنیں",
    ar: "اسأل حكواتي الذكاء الاصطناعي"
  },
  rewardsCabin: {
    en: "My Rewards Cabin",
    ur: "میرا انعام کابین",
    ar: "كابينة المكافآت"
  },
  faithPoints: {
    en: "Faith Points",
    ur: "ایمان پوائنٹس",
    ar: "نقاط الإيمان"
  },
  storiesFinished: {
    en: "Stories Finished",
    ur: "مکمل کہانیاں",
    ar: "القصص المكتملة"
  },
  continueGuest: {
    en: "Continue as Guest",
    ur: "بطور مہمان آگے بڑھیں",
    ar: "المتابعة كضيف"
  },
  continueReading: {
    en: "Continue Learning",
    ur: "پڑھنا جاری رکھیں",
    ar: "متابعة التعلم"
  },

  // Quran Reader
  quranTitle: {
    en: "The Noble Quran",
    ur: "قرآنِ کریم",
    ar: "القرآن الكريم"
  },
  quranSubtitle: {
    en: "Read, Listen & Memorize Surahs with Beautiful Audio Recitations",
    ur: "خوبصورت تلاوت کے ساتھ سورتیں پڑھیں، سنیں اور یاد کریں",
    ar: "اقرأ واستمع واحفظ السور مع تلاوات صوتية خاشعة"
  },
  selectReciter: {
    en: "Select Reciter",
    ur: "قاری منتخب کریں",
    ar: "اختر القارئ"
  },
  autoPlay: {
    en: "Auto Play Verses",
    ur: "خودکار آڈیو تلاوت",
    ar: "التشغيل التلقائي"
  },
  searchSurah: {
    en: "Search Surah by name or number...",
    ur: "سورت کا نام یا نمبر تلاش کریں...",
    ar: "ابحث عن السورة باسمها أو رقمها..."
  },
  surah: {
    en: "Surah",
    ur: "سورة",
    ar: "سورة"
  },
  ayahs: {
    en: "Ayahs",
    ur: "آیات",
    ar: "آيات"
  },
  revelationPlace: {
    en: "Revelation",
    ur: "مقامِ نزول",
    ar: "مكان النزول"
  },
  meccan: {
    en: "Meccan",
    ur: "مکی",
    ar: "مكية"
  },
  medinan: {
    en: "Medinan",
    ur: "مدنی",
    ar: "مدنية"
  },

  // AI Teacher
  teacherTitle: {
    en: "Islamic AI Teacher",
    ur: "اسلامی اے آئی استاد",
    ar: "المعلم الإسلامي الذكي"
  },
  teacherSubtitle: {
    en: "Ask any question about Islam, Salah, Prophets, or Good Manners",
    ur: "اسلام، نماز، انبیاء یا اخلاق کے بارے میں کوئی بھی سوال پوچھیں",
    ar: "اسأل أي سؤال عن الإسلام، الصلاة، الأنبياء أو الأخلاق"
  },
  askQuestion: {
    en: "Ask Question",
    ur: "سوال پوچھیں",
    ar: "طرح السؤال"
  },
  typeYourQuestion: {
    en: "Type your question here (e.g. Why do we pray Salah?)...",
    ur: "اپنا سوال یہاں ٹائپ کریں (مثلاً: ہم نماز کیوں پڑھتے ہیں؟)...",
    ar: "اكتب سؤالك هنا (مثال: لماذا نصلي؟)..."
  },
  verifiedSources: {
    en: "Verified References from Quran & Sahih Sunnah",
    ur: "قرآن اور صحیح سنت سے مستند حوالہ جات",
    ar: "مراجع معتمدة من القرآن والسنة الصحيحة"
  },

  // Daily Duas
  duasTitle: {
    en: "Daily Masnoon Duas",
    ur: "روزمرہ کی مسنون دعائیں",
    ar: "الأدعية اليومية المأثورة"
  },
  duasSubtitle: {
    en: "Learn authentic supplications for waking up, eating, sleeping & daily life",
    ur: "جاگنے، کھانے، سونے اور روزمرہ زندگی کے لیے مستند دعائیں سیکھیں",
    ar: "تعلم الأدعية الصحيحة للاستيقاظ، الطعام، النوم والحياة اليومية"
  },
  searchDuas: {
    en: "Search Duas by title or category...",
    ur: "دعا کا عنوان یا زمرہ تلاش کریں...",
    ar: "ابحث عن الدعاء بالعنوان أو الفئة..."
  },
  transliteration: {
    en: "Transliteration",
    ur: "تلفظ (ٹرانسلیٹریشن)",
    ar: "النقحرة الحرفية"
  },
  meaning: {
    en: "Meaning",
    ur: "ترجمہ اور مفہوم",
    ar: "المعنى والترجمة"
  },
  whenToRecite: {
    en: "When to Recite",
    ur: "پڑھنے کا موقع",
    ar: "متى يُقال"
  },

  // Hadith Reader
  hadithTitle: {
    en: "Authentic Hadith Lessons",
    ur: "مستند احادیثِ مبارکہ",
    ar: "أحاديث نبوية شريفة"
  },
  hadithSubtitle: {
    en: "Short & beautiful Hadiths from Prophet Muhammad (ﷺ) for children",
    ur: "بچوں کے لیے نبی کریم (ﷺ) کی خوبصورت اور مختصر احادیث",
    ar: "أحاديث قصيرة وجميلة للأطفال من السيرة النبوية"
  },
  searchHadith: {
    en: "Search Hadith by topic or narrator...",
    ur: "موضوع یا راوی سے حدیث تلاش کریں...",
    ar: "ابحث في الأحاديث حسب الموضوع أو الراوي..."
  },
  narratedBy: {
    en: "Narrated By",
    ur: "راوی",
    ar: "رواه"
  },
  bookReference: {
    en: "Source",
    ur: "حوالہ و کتاب",
    ar: "المصدر والكتيب"
  },

  // Learn Salah Guide
  salahTitle: {
    en: "Learn Salah Step-by-Step",
    ur: "طریقہ نماز تصویری و صوتی رہنمائی",
    ar: "تعلم الصلاة خطوة بخطوة"
  },
  salahSubtitle: {
    en: "Master Wudu, Rakat count, posture, and supplications for daily prayers",
    ur: "وضو، رکعتوں کی تعداد، قیام و سجود اور نماز کی دعائیں سیکھیں",
    ar: "تعلم الوضوء، عدد الركعات، طريقة الصلاة والأدعية"
  },
  wuduGuide: {
    en: "How to Perform Wudu",
    ur: "وضو کا طریقہ",
    ar: "كيفية الوضوء"
  },
  stepByStepPrayer: {
    en: "Step-by-Step Prayer",
    ur: "قدم بقدم نماز کا طریقہ",
    ar: "خطوات الصلاة بالتفصيل"
  },

  // Islamic Videos
  videosTitle: {
    en: "Islamic Educational Videos",
    ur: "اسلامی تعلیمی ویڈیوز",
    ar: "فيديوهات تعليمية إسلامية"
  },
  videosSubtitle: {
    en: "Fun & safe animated stories, Quran lessons & Islamic manners",
    ur: "دلچسپ اور محفوظ اینیمیٹڈ کہانیاں، قرآنی اسباق اور اسلامی آداب",
    ar: "قصص متحركة ممتعة وآمنة، دروس قرآن وأخلاق إسلامية"
  },
  searchVideos: {
    en: "Search videos...",
    ur: "ویڈیو تلاش کریں...",
    ar: "البحث عن الفيديوهات..."
  },
  submitVideo: {
    en: "Submit Educational Video",
    ur: "تعلیمی ویڈیو جمع کرائیں",
    ar: "إرسال فيديو تعليمي"
  },

  // Islamic Games & Quiz
  gamesTitle: {
    en: "Islamic Quiz & Learning Games",
    ur: "تعلیمی و دینی معلومات کے کھیل",
    ar: "الألعاب التفاعلية والاختبارات الإسلامية"
  },
  gamesSubtitle: {
    en: "Test your knowledge, play memory card games, and earn faith points!",
    ur: "اپنی دینی معلومات پرکھیں، میموری گیم کھیلیں اور ایمان پوائنٹس حاصل کریں!",
    ar: "اختبر معلوماتك، العب ألعاب الذاكرة، واكسب نقاط الإيمان!"
  },
  triviaMatch: {
    en: "Islamic Kids Trivia Match",
    ur: "اسلامی کڈز کوئز میچ",
    ar: "مسابقة المعلومات الإسلامية للأطفال"
  },
  memoryCardGame: {
    en: "Islamic Memory Cards",
    ur: "اسلامی میموری کارڈز",
    ar: "بطاقات الذاكرة الإسلامية"
  },

  // Ask Scholar
  scholarTitle: {
    en: "Ask Scholar Q&A",
    ur: "علمائے کرام سے سوالات",
    ar: "اسأل العالم - أسئلة وأجوبة"
  },
  scholarSubtitle: {
    en: "Verified questions and answers for children, parents & educators",
    ur: "بچوں، والدین اور اساتذہ کے لیے مستند دینی سوالات و جوابات",
    ar: "أسئلة وأجوبة معتمدة للأطفال وأولياء الأمور والمعلمين"
  },
  askQuestionBtn: {
    en: "Ask a Verified Scholar",
    ur: "عالمِ دین سے سوال پوچھیں",
    ar: "طرح سؤال على عالم معتمد"
  },

  // Story Reader & Card
  readStory: {
    en: "Read Story",
    ur: "کہانی پڑھیں",
    ar: "اقرأ القصة"
  },
  readMore: {
    en: "Read Full Story",
    ur: "مکمل کہانی پڑھیں",
    ar: "قراءة القصة كاملة"
  },
  listenAudio: {
    en: "Listen Audio",
    ur: "آڈیو سنیں",
    ar: "الاستماع للصوت"
  },
  moralLesson: {
    en: "Moral Lesson",
    ur: "اخلاقی سبق",
    ar: "الدرس الأخلاقي"
  },
  takeQuiz: {
    en: "Take Quiz",
    ur: "کوئز میں حصہ لیں",
    ar: "خوض الاختبار"
  },
  age: {
    en: "Age",
    ur: "عمر",
    ar: "العمر"
  },
  allKids: {
    en: "All Kids",
    ur: "تمام بچے",
    ar: "جميع الأطفال"
  },
  featured: {
    en: "Featured",
    ur: "منتخب",
    ar: "مميز"
  },
  aiStory: {
    en: "AI Story",
    ur: "اے آئی کہانی",
    ar: "قصة ذكية"
  },
  offline: {
    en: "Offline",
    ur: "آف لائن",
    ar: "دون اتصال"
  },
  savedOffline: {
    en: "Saved Offline",
    ur: "آف لائن محفوظ ہو گیا",
    ar: "محفوظ دون اتصال"
  },
  saveOfflineBtn: {
    en: "Save Offline",
    ur: "آف لائن محفوظ کریں",
    ar: "حفظ دون اتصال"
  },
  minutes: {
    en: "mins",
    ur: "منٹ",
    ar: "دقائق"
  },
  printBooklet: {
    en: "Print Booklet",
    ur: "پرنٹ ایبل کتابچہ",
    ar: "طباعة الكتيب"
  },

  // Admin Panel
  adminTitle: {
    en: "Admin Dashboard",
    ur: "ایڈمن ڈیش بورڈ",
    ar: "لوحة التحكم"
  },
  adminSubtitle: {
    en: "Manage Stories, Duas, Hadiths, Videos, and Content",
    ur: "کہانیوں، دعاؤں، احادیث، ویڈیوز اور مواد کا انتظام کریں",
    ar: "إدارة القصص، الأدعية، الأحاديث، الفيديوهات والمحتوى"
  },

  // Navigation & Buttons
  backToHome: {
    en: "Back to Home",
    ur: "ہوم پر واپس جائیں",
    ar: "العودة للرئيسية"
  },
  backToStories: {
    en: "Back to Stories",
    ur: "کہانیوں پر واپس جائیں",
    ar: "العودة للقصص"
  },
  nextStep: {
    en: "Next",
    ur: "آگے",
    ar: "التالي"
  },
  prevStep: {
    en: "Previous",
    ur: "پیچھے",
    ar: "السابق"
  },
  close: {
    en: "Close",
    ur: "بند کریں",
    ar: "إغلاق"
  },
  save: {
    en: "Save",
    ur: "محفوظ کریں",
    ar: "حفظ"
  },
  cancel: {
    en: "Cancel",
    ur: "منسوخ کریں",
    ar: "إلغاء"
  },
  delete: {
    en: "Delete",
    ur: "مٹا دیں",
    ar: "حذف"
  },
  edit: {
    en: "Edit",
    ur: "ترمیم کریں",
    ar: "تعديل"
  },
  share: {
    en: "Share",
    ur: "شیئر کریں",
    ar: "مشاركة"
  },
  copied: {
    en: "Copied!",
    ur: "کاپی ہو گیا!",
    ar: "تم النسخ!"
  },
  copy: {
    en: "Copy Text",
    ur: "متن کاپی کریں",
    ar: "نسخ النص"
  },
  subscribe: {
    en: "Subscribe",
    ur: "سبسکرائب کریں",
    ar: "اشتراك"
  },
  subscribed: {
    en: "Subscribed Successfully!",
    ur: "کامیابی سے سبسکرائب ہو گیا!",
    ar: "تم الاشتراك بنجاح!"
  },

  // Homepage sections
  featuredStories: {
    en: "Featured Islamic Stories",
    ur: "منتخب اسلامی کہانیاں",
    ar: "قصص إسلامية مختارة"
  },
  viewAllStories: {
    en: "View All Stories",
    ur: "تمام کہانیاں دیکھیں",
    ar: "عرض كل القصص"
  },
  dailyInspirations: {
    en: "Daily Inspirations",
    ur: "روزانہ کا الہام",
    ar: "إلهامات يومية"
  },
  dailyHadith: {
    en: "Daily Hadith",
    ur: "آج کی حدیث",
    ar: "حديث اليوم"
  },
  newsletterTitle: {
    en: "Join Our Islamic Family Newsletter",
    ur: "ہمارے اسلامی فیملی نیوز لیٹر میں شامل ہوں",
    ar: "انضم إلى نشرتنا البريدية الإسلامية"
  },
  newsletterDesc: {
    en: "Get new stories, Quran recitations, and educational printable worksheets delivered to your inbox every week.",
    ur: "ہر ہفتے نئی کہانیاں، قرآن کی تلاوت اور تعلیمی ورک شیٹس اپنے ان باکس میں حاصل کریں۔",
    ar: "احصل على قصص جديدة، تلاوات قرآنية وأوراق عمل تعليمية في بريدك كل أسبوع."
  },
  emailPlaceholder: {
    en: "Enter your email address...",
    ur: "اپنا ای میل درج کریں...",
    ar: "أدخل بريدك الإلكتروني..."
  },
  quizChallenge: {
    en: "Quiz Challenge",
    ur: "کوئز چیلنج",
    ar: "تحدي الاختبارات"
  },
  coloringPages: {
    en: "Coloring Pages",
    ur: "رنگ بھریں",
    ar: "صفحات التلوين"
  },
  printableWorksheets: {
    en: "Printable Worksheets",
    ur: "تعلیمی ورک شیٹس",
    ar: "أوراق عمل للطباعة"
  },
  learnMenu: {
    en: "Learn",
    ur: "تعلیم",
    ar: "تعلم"
  },
  educationalHub: {
    en: "Islamic Education Hub",
    ur: "اسلامی تعلیمی مرکز",
    ar: "المركز التعليمي الإسلامي"
  },
  todaysPick: {
    en: "Today's Pick",
    ur: "آج کا انتخاب",
    ar: "اختيار اليوم"
  },
  browseByProphets: {
    en: "Browse by Prophets",
    ur: "انبیاء کرام کے قصص",
    ar: "تصفح حسب الأنبياء"
  },
  selectProphetLife: {
    en: "Select and learn from the beautiful lives of Allah's messengers.",
    ur: "اللہ تعالیٰ کے رسولوں کی مبارک زندگیوں سے سیکھیں۔",
    ar: "اختر وتعلم من السيرة العطرة لرسل الله."
  },
  knowledgeBadge: {
    en: "Knowledge Badge",
    ur: "علم کا بیج",
    ar: "وسام المعرفة"
  },
  levelUpInfo: {
    en: "Gain more points by finishing story quizzes to level up!",
    ur: "لیول اپ کرنے کے لیے کہانیوں کے کوئز مکمل کریں!",
    ar: "احصل على المزيد من النقاط بإكمال اختبارات القصص لرفع مستواك!"
  },
  resume: {
    en: "Resume",
    ur: "جاری رکھیں",
    ar: "متابعة"
  },
  footerTagline: {
    en: "Nurturing young hearts with authentic Islamic stories, noble morals, and love for the Holy Quran.",
    ur: "سچی اسلامی کہانیوں، اعلیٰ اخلاق اور قرآنِ پاک کی محبت سے بچوں کے دلوں کی تربیت۔",
    ar: "تغذية قلوب الأطفال بالقصص الإسلامية الأصيلة، الأخلاق الفاضلة وحب القرآن الكريم."
  },
  copyright: {
    en: "© 2026 Ummah Kids by Inaamullah. All rights reserved. Jazakallahu Khairan.",
    ur: "© 2026 امت کڈز از انعام اللہ۔ جملہ حقوق محفوظ ہیں۔ جزاكم الله خيراً",
    ar: "© 2026 أمة كيدز إعداد إنعام الله. جميع الحقوق محفوظة. جزاكم الله خيراً."
  }
};

export function getTranslation(key: string, lang: Language, fallback?: string): string {
  if (translations[key]) {
    const val = translations[key][lang];
    if (val && val.trim() !== "") return val;
    const enVal = translations[key]["en"];
    if (enVal && enVal.trim() !== "") return enVal;
  }
  return fallback || key;
}

export function t(key: string, lang: Language, fallback?: string): string {
  return getTranslation(key, lang, fallback);
}

export function isRTL(lang: Language): boolean {
  return lang === "ur" || lang === "ar";
}
