import { Story, DailyHadith, DailyQuote } from './types';

export const INITIAL_STORIES: Story[] = [
  {
    id: "prophet-nuh-ark",
    titleEn: "Prophet Nuh (AS) and the Great Ark",
    titleUr: "حضرت نوح علیہ السلام اور عظیم کشتی",
    category: "Prophets Stories",
    readingTime: 5,
    ageGroup: "7-9",
    coverImage: "https://images.unsplash.com/photo-1541411111595-e2bc7eed3131?auto=format&fit=crop&q=80&w=800", // storm / sea theme
    shortDescriptionEn: "Learn how the brave Prophet Nuh (AS) built a massive ship to save his family and animals from the great flood.",
    shortDescriptionUr: "سیکھیں کہ کس طرح حضرت نوح علیہ السلام نے ایک عظیم کشتی بنائی تاکہ اپنے خاندان اور جانوروں کو طوفان سے بچا سکیں۔",
    contentEn: `Prophet Nuh (AS) was a very kind and patient Prophet of Allah. He spent 950 years calling his people to worship only Allah, the One and True Creator. However, most of his people laughed at him and refused to listen. They worshipped statues made of stone instead.

Allah told Nuh (AS) that a great flood would come, and commanded him to build a massive ship, called an **Ark (Kashti)**, in the middle of dry land. People who passed by laughed even more. "Nuh! Are you building a ship on dry soil where there is no water?" they mocked. But Nuh (AS) remained strong. He knew that Allah's promise is always true.

Under Allah's guidance, Nuh (AS) built the Ark using strong wood and iron. When it was finished, Allah commanded Nuh (AS) to gather his family, the believers, and **a male and female pair of every kind of animal, bird, and insect** onto the Ark.

Can you imagine the line of animals? Majestic lions, gentle deer, colorful parrots, tiny ants, and big elephants all walking peacefully into the giant ship! 

Once everyone was safely inside, the doors of the Ark closed. Suddenly, heavy rain began to fall from the sky, and springs of water burst from the ground. The water rose higher and higher until the entire land was covered in a deep ocean. The giant Ark floated safely on top of the stormy waves.

Eventually, the rain stopped, and the sun began to shine. The water went down, and the Ark rested gently on the mountain of **Judi**. Nuh (AS) and the animals stepped out onto the clean, fresh earth, thanking Allah for saving them. This teaches us that those who trust and obey Allah will always be successful and protected!`,
    contentUr: `حضرت نوح علیہ السلام اللہ کے ایک نہایت شفیق اور صابر نبی تھے۔ انہوں نے ساڑھے نو سو سال تک اپنی قوم کو ایک اللہ کی عبادت کی طرف بلایا۔ لیکن ان کی قوم کے زیادہ تر لوگ ان کا مذاق اڑاتے اور بتوں کی پوجا کرتے تھے۔

اللہ تعالیٰ نے حضرت نوح علیہ السلام کو خبر دی کہ ایک بڑا طوفان آنے والا ہے، اور انہیں حکم دیا کہ وہ خشک زمین پر ایک بہت بڑی کشتی تیار کریں۔ لوگ جب وہاں سے گزرتے تو ہنستے اور کہتے: "اے نوح! آپ خشک مٹی پر کشتی کیوں بنا رہے ہیں جہاں کوئی پانی نہیں؟" لیکن نوح علیہ السلام پرسکون رہے کیونکہ وہ جانتے تھے کہ اللہ کا وعدہ سچا ہے۔

اللہ کے حکم سے انہوں نے کشتی مکمل کی۔ پھر اللہ نے حکم دیا کہ وہ اپنے خاندان، ایمان والوں، اور ہر قسم کے جانوروں اور پرندوں کا ایک ایک جوڑا کشتی میں سوار کر لیں۔

تصور کریں! شیر، ہرن، ہاتھی، چڑیاں اور ننھی چیونٹیاں سب سکون سے اس عظیم کشتی میں داخل ہو رہے تھے۔

جب سب سوار ہو گئے تو کشتی کے دروازے بند ہو گئے۔ پھر بادل گرجے اور زمین و آسمان سے پانی کا ایسا طوفان آیا کہ پہاڑ بھی ڈوب گئے۔ لیکن نوح علیہ السلام کی کشتی اللہ کی حفاظت میں لہروں پر تیرتی رہی۔

آخر کار طوفان تھم گیا اور سورج نکل آیا۔ کشتی جودی پہاڑ پر جا ٹھہری۔ سب نے اللہ کا شکر ادا کیا۔ اس کہانی سے ہمیں سبق ملتا ہے کہ جو اللہ پر بھروسہ کرتے ہیں وہ ہمیشہ کامیاب اور محفوظ رہتے ہیں۔`,
    lessonsEn: [
      "Always have patience, even when others mock your good deeds.",
      "Trust Allah's commands completely, as His wisdom is perfect.",
      "Allah always protects and rewards those who are faithful to Him."
    ],
    lessonsUr: [
      "ہمیشہ صبر کریں، چاہے لوگ آپ کے اچھے کاموں کا مذاق ہی کیوں نہ اڑائیں۔",
      "اللہ کے احکامات پر مکمل بھروسہ رکھیں کیونکہ اس کا فیصلہ بہترین ہوتا ہے۔",
      "اللہ تعالیٰ ہمیشہ اپنے وفادار بندوں کی حفاظت کرتا ہے اور انہیں انعام دیتا ہے۔"
    ],
    references: [
      {
        type: "quran",
        source: "Surah Hud",
        referenceKey: "11:36-48",
        verificationStatus: "verified"
      },
      {
        type: "quran",
        source: "Surah Al-Anbya",
        referenceKey: "21:76-77",
        verificationStatus: "verified"
      }
    ],
    quiz: [
      {
        question: "For how long did Prophet Nuh (AS) call his people to Allah?",
        options: ["100 years", "500 years", "950 years", "50 years"],
        answerIndex: 2,
        explanation: "Prophet Nuh (AS) spent 950 years preaching and calling his people to worship only Allah."
      },
      {
        question: "What is the name of the mountain where Prophet Nuh's Ark finally rested?",
        options: ["Mount Uhud", "Mount Judi", "Mount Safa", "Mount Sinai"],
        answerIndex: 1,
        explanation: "As mentioned in Surah Hud (Ayah 44), the Ark rested on Mount Judi."
      },
      {
        question: "Who were taken onto the Ark along with the believers?",
        options: ["Gold and silver", "Only birds", "A male and female pair of every animal", "No animals, only humans"],
        answerIndex: 2,
        explanation: "Allah commanded Prophet Nuh (AS) to load a pair (male and female) of every living creature onto the ship."
      }
    ],
    isFeatured: true,
    status: "published",
    createdAt: "2026-07-10T10:00:00Z",
    tags: ["Prophets", "Noah", "Animals", "Patience"],
    slug: "prophet-nuh-great-ark"
  },
  {
    id: "prophet-muhammad-thirsty-camel",
    titleEn: "The Prophet ﷺ and the Thirsty Camel",
    titleUr: "پیارے نبی ﷺ اور پیاسا اونٹ",
    category: "Prophet Muhammad ﷺ Life",
    readingTime: 3,
    ageGroup: "4-6",
    coverImage: "https://images.unsplash.com/photo-1533038590840-1cde6b668a91?auto=format&fit=crop&q=80&w=800", // desert / camel theme
    shortDescriptionEn: "A beautiful story showing how Prophet Muhammad ﷺ loved all living creatures and helped a crying camel.",
    shortDescriptionUr: "ایک خوبصورت کہانی جو بتاتی ہے کہ پیارے نبی ﷺ تمام جانداروں سے محبت فرماتے تھے اور انہوں نے ایک پیاسے اونٹ کی مدد کی۔",
    contentEn: `Our beloved Prophet Muhammad ﷺ was sent as a mercy to the entire world—not just for people, but for animals, trees, and everything that lives!

One sunny afternoon, the Prophet ﷺ entered an orchard belonging to a helper (Ansar) from Madinah. As he walked past the date-palm trees, he saw a beautiful, large camel. But when the camel saw the Prophet ﷺ, it began to make a soft, sad sound, and tears started rolling down its big, dark eyes!

The Prophet ﷺ felt very sad for the camel. He immediately walked up to it, patted its head gently, and wiped away its tears. The camel felt comforted and became quiet.

The Prophet ﷺ then looked around and asked the people, "Who is the owner of this camel?"
A young man stepped forward and said, "I am, O Messenger of Allah."

The Prophet ﷺ looked at him with gentle, serious eyes and said, "Do you not fear Allah regarding this animal which Allah has put in your ownership? The camel has complained to me that you keep it hungry and work it too hard without rest!"

The young man felt ashamed. He realized he had been unkind to his camel. He promised the Prophet ﷺ that he would always feed it on time and let it rest when it was tired.

From that day on, the camel was happy, and everyone in Madinah learned a beautiful lesson: **We must always be kind to animals!** They cannot speak our language to ask for food or rest, so it is our duty to take care of them.`,
    contentUr: `ہمارے پیارے نبی حضرت محمد ﷺ کو پوری دنیا کے لیے رحمت بنا کر بھیجا گیا۔ آپ ﷺ نہ صرف انسانوں بلکہ جانوروں، پرندوں اور درختوں کے لیے بھی سراپا رحمت تھے۔

ایک دوپہر پیارے نبی ﷺ مدینہ منورہ کے ایک باغ میں تشریف لے گئے۔ وہاں آپ ﷺ نے ایک خوبصورت اونٹ دیکھا۔ جیسے ہی اونٹ نے آپ ﷺ کو دیکھا، وہ رقت آمیز آواز نکالنے لگا اور اس کی آنکھوں سے آنسو بہنے لگے۔

پیارے نبی ﷺ کو اونٹ پر بڑا رحم آیا۔ آپ ﷺ فوراً اس کے پاس گئے، اس کے سر پر شفقت سے ہاتھ پھیرا اور اس کے آنسو پونچھیے۔ اونٹ پرسکون ہو گیا۔

آپ ﷺ نے پوچھا: "اس اونٹ کا مالک کون ہے؟"
ایک نوجوان انصاری آگے بڑھا اور بولا: "اے اللہ کے رسول ﷺ! میں اس کا مالک ہوں۔"

پیارے نبی ﷺ نے اس سے فرمایا: "کیا تم اس بے زبان جانور کے بارے میں اللہ سے نہیں ڈرتے جسے اللہ نے تمہاری ملکیت میں دیا ہے؟ اس نے مجھ سے شکایت کی ہے کہ تم اسے بھوکا رکھتے ہو اور اس سے بہت زیادہ کام لیتے ہو!"

نوجوان بہت شرمندہ ہوا اور اس نے وعدہ کیا کہ وہ آئندہ اونٹ کو وقت پر کھانا کھلائے گا اور آرام دے گا۔ اس دن سے مدینہ کے لوگوں نے سیکھا کہ جانوروں پر رحم کرنا کتنا ضروری ہے۔`,
    lessonsEn: [
      "Be kind and gentle to all animals and pets.",
      "Wipe away tears and console those who are sad or hurt.",
      "Animals have feelings too, and we will be rewarded for treating them well."
    ],
    lessonsUr: [
      "تمام جانوروں اور پالتو جانوروں کے ساتھ نرمی اور شفقت کا سلوک کریں۔",
      "دوسروں کے آنسو پونچھیں اور دکھی دلوں کو تسلی دیں۔",
      "جانوروں کے بھی احساسات ہوتے ہیں، اور ان کے ساتھ اچھا سلوک کرنے پر ہمیں ثواب ملتا ہے۔"
    ],
    references: [
      {
        type: "hadith",
        source: "Sunan Abi Dawud",
        referenceKey: "Book of Jihad, Hadith 2549",
        verificationStatus: "verified"
      }
    ],
    quiz: [
      {
        question: "Why was the camel crying when the Prophet ﷺ saw it?",
        options: ["It lost its way", "It was kept hungry and overworked", "It was scared of the trees", "It wanted to go to the desert"],
        answerIndex: 1,
        explanation: "The camel complained to the Prophet ﷺ that its owner kept it hungry and made it work too hard without rest."
      },
      {
        question: "How did the Prophet ﷺ comfort the crying camel?",
        options: ["By giving it water", "By wiping its tears and patting its head", "By singing to it", "By letting it run away"],
        answerIndex: 1,
        explanation: "The Prophet ﷺ went to the camel, stroked its head gently, and wiped away its tears."
      },
      {
        question: "What is the main lesson of this story?",
        options: ["We should ride camels fast", "We must be kind to animals", "Gardens are beautiful", "Madinah is hot"],
        answerIndex: 1,
        explanation: "The story teaches us to be merciful and kind to animals, protecting them from hunger and overwork."
      }
    ],
    isFeatured: false,
    status: "published",
    createdAt: "2026-07-09T14:30:00Z",
    tags: ["Prophet Muhammad", "Camel", "Kindness", "Animals"],
    slug: "prophet-muhammad-thirsty-camel"
  },
  {
    id: "hazrat-bilal-sweet-adhan",
    titleEn: "Hazrat Bilal (RA) and the Sweet Sound of Adhan",
    titleUr: "حضرت بلال رضی اللہ عنہ اور خوبصورت اذان",
    category: "Sahaba Stories",
    readingTime: 4,
    ageGroup: "7-9",
    coverImage: "https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&q=80&w=800", // minaret / mosque theme
    shortDescriptionEn: "Discover the inspiring life of Hazrat Bilal (RA), the very first Muezzin of Islam with the most beautiful voice.",
    shortDescriptionUr: "اسلام کے سب سے پہلے موذن، حضرت بلال رضی اللہ عنہ کی متاثر کن زندگی اور ان کی خوبصورت اذان کی کہانی۔",
    contentEn: `Hazrat Bilal ibn Rabah (RA) was one of the closest and most beloved companions of Prophet Muhammad ﷺ. He was born in Abyssinia (modern-day Ethiopia) and had a very difficult life as a slave in Makkah before Islam.

When Bilal heard about the message of Islam—that there is only One God and all humans are equal—his heart filled with faith. His cruel master tried to force him to leave Islam, putting a massive, heavy hot stone on his chest under the burning desert sun. But Bilal refused to give up his faith. He bravely repeated: **"Ahad! Ahad!"** (The One! The One!).

Seeing Bilal's great patience and sacrifice, Hazrat Abu Bakr (RA) bought Bilal and set him free. Bilal was finally free to worship Allah!

When the beautiful Masjid an-Nabawi was built in Madinah, the companions needed a way to call people to prayer. After discussing different ideas, Bilal (RA) was chosen by the Prophet ﷺ because he had a powerful, sweet, and deeply emotional voice.

Bilal climbed to the highest roof and called out the very first **Adhan** in Islamic history. His beautiful voice echoed through the streets of Madinah: 
*"Allahu Akbar! Allahu Akbar!..."* (Allah is the Greatest!)

People stopped what they were doing, tears of joy in their eyes, and rushed to the mosque. From that day on, Bilal (RA) became the official **Muezzin** (the caller to prayer) of the Prophet ﷺ. His story teaches us that in Islam, your background, skin color, or wealth do not matter. What matters is the goodness of your heart and your love for Allah!`,
    contentUr: `حضرت بلال بن رباح رضی اللہ عنہ پیارے نبی ﷺ کے سب سے قریبی اور محبوب صحابہ میں سے ایک تھے۔ وہ حبشہ (موجودہ ایتھوپیا) میں پیدا ہوئے اور اسلام لانے سے پہلے مکہ میں ایک غلام کے طور پر سخت زندگی گزاری۔

جب بلال رضی اللہ عنہ نے اسلام کا پیغام سنا کہ اللہ ایک ہے اور تمام انسان برابر ہیں، تو ان کا دل ایمان سے بھر گیا۔ ان کے ظالم آقا نے انہیں اسلام چھوڑنے پر مجبور کرنے کے لیے تپتے ہوئے صحرا میں ان کے سینے پر بھاری پتھر رکھوایا۔ لیکن بلال رضی اللہ عنہ نے کلمہ حق نہیں چھوڑا اور پکارتے رہے: "احد! احد!" (وہ ایک ہے! وہ ایک ہے!)۔

ان کا صبر دیکھ کر حضرت ابو بکر صدیق رضی اللہ عنہ نے انہیں خرید کر آزاد کر دیا۔

جب مدینہ منورہ میں مسجد نبوی تعمیر ہوئی تو لوگوں کو نماز کے لیے بلانے کا طریقہ طے کرنا تھا۔ پیارے نبی ﷺ نے اذان دینے کے لیے حضرت بلال رضی اللہ عنہ کو منتخب کیا کیونکہ ان کی آواز بہت پاٹ دار، شیریں اور دل پذیریت سے بھرپور تھی۔

حضرت بلال رضی اللہ عنہ نے پہلی بار بلند آواز میں اذان دی: "اللہ اکبر! اللہ اکبر!"

مدینہ کے لوگ سب کام چھوڑ کر خوشی کے آنسو بہاتے ہوئے مسجد کی طرف دوڑے۔ حضرت بلال رضی اللہ عنہ اسلام کے پہلے موذن بنے۔ یہ کہانی ہمیں سکھاتی ہے کہ اسلام میں رنگ، نسل یا مال و دولت کی کوئی اہمیت نہیں، اصل چیز دل کا تقویٰ اور اللہ سے محبت ہے۔`,
    lessonsEn: [
      "Stand strong for your faith and truth, no matter how difficult it gets.",
      "In Islam, all humans are equal. Piety and character are what make someone noble.",
      "The Adhan is a beautiful call that connects our hearts to Allah five times a day."
    ],
    lessonsUr: [
      "اپنے ایمان اور سچائی پر ہمیشہ قائم رہیں، چاہے کتنی ہی مشکلات کیوں نہ آئیں۔",
      "اسلام میں تمام انسان برابر ہیں۔ صرف تقویٰ اور اچھا اخلاق انسان کو بلند بناتا ہے۔",
      "اذان ایک خوبصورت پکار ہے جو دن میں پانچ بار ہمارے دلوں کو اللہ سے جوڑتی ہے۔"
    ],
    references: [
      {
        type: "hadith",
        source: "Sahih al-Bukhari",
        referenceKey: "Book of Adhan, Hadith 603-606",
        verificationStatus: "verified"
      },
      {
        type: "historical",
        source: "Siyar A'lam al-Nubala by Al-Dhahabi",
        referenceKey: "Biography of Bilal ibn Rabah",
        verificationStatus: "verified"
      }
    ],
    quiz: [
      {
        question: "What did Bilal (RA) repeat when he was persecuted under the hot sun?",
        options: ["La ilaha illallah", "Ahad! Ahad!", "Allahu Akbar", "Subhanallah"],
        answerIndex: 1,
        explanation: "Bilal (RA) repeated 'Ahad! Ahad!' which means 'The One! The One!', declaring the oneness of Allah."
      },
      {
        question: "Who purchased Hazrat Bilal (RA) to set him free?",
        options: ["Hazrat Umar (RA)", "Hazrat Abu Bakr (RA)", "Hazrat Ali (RA)", "Hazrat Usman (RA)"],
        answerIndex: 1,
        explanation: "Hazrat Abu Bakr Al-Siddiq (RA) bought Hazrat Bilal (RA) and freed him for the sake of Allah."
      },
      {
        question: "What role was Hazrat Bilal (RA) given in Madinah?",
        options: ["The Writer of Quran", "The Treasure Keeper", "The First Muezzin (Caller to Prayer)", "The Commander of Horsemen"],
        answerIndex: 2,
        explanation: "Prophet Muhammad ﷺ chose Hazrat Bilal (RA) to be the very first Muezzin of Islam due to his beautiful and clear voice."
      }
    ],
    isFeatured: false,
    status: "published",
    createdAt: "2026-07-08T09:15:00Z",
    tags: ["Sahaba", "Bilal", "Adhan", "Madinah", "Equality"],
    slug: "hazrat-bilal-sweet-adhan"
  },
  {
    id: "sulaiman-wise-ant",
    titleEn: "Hazrat Sulaiman (AS) and the Wise Ant",
    titleUr: "حضرت سلیمان علیہ السلام اور سمجھدار چیونٹی",
    category: "Quran Stories",
    readingTime: 4,
    ageGroup: "7-9",
    coverImage: "https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&q=80&w=800", // nature / ant / forest theme
    shortDescriptionEn: "A wonderful Quranic story of Prophet Sulaiman (AS) who could speak to animals and heard a tiny ant warning her colony.",
    shortDescriptionUr: "قرآن پاک کا ایک خوبصورت واقعہ کہ کس طرح حضرت سلیمان علیہ السلام نے ایک ننھی چیونٹی کی بات سنی جو اپنی بستی کو بچا رہی تھی۔",
    contentEn: `Prophet Sulaiman (AS) was a great king and a mighty Prophet of Allah. Allah blessed him with unique miracles. One of his special gifts was the ability to **understand the speech of animals, birds, and insects!** He could also control the wind and command jinns.

One day, Sulaiman (AS) was marching with his massive army. It was a grand sight! There were soldiers, horses, birds flying overhead to give shade, and animals walking together.

As they approached a beautiful valley, Sulaiman (AS) heard a tiny, high-pitched voice from the ground. He stopped his army and listened closely.

It was a tiny queen ant talking to her colony! She looked up at the giant soldiers and cried out to her friends:
**"O ants! Enter your dwellings lest Sulaiman and his hosts crush you while they perceive not!"**

The little ant was very wise. She wanted to save her family, but she also knew that Prophet Sulaiman (AS) and his soldiers were good people who would never step on ants on purpose—they just might not see them because ants are so small!

Hearing the ant's speech, Prophet Sulaiman (AS) smiled beautifully and laughed with joy. He was so happy that Allah had given him the gift to hear and understand even the tiniest of creatures. 

He immediately commanded his entire army to halt and change their path so they wouldn't hurt a single ant!

Then, Sulaiman (AS) raised his hands to the sky and prayed to Allah: *"My Lord, enable me to be grateful for Your favor which You have bestowed upon me and upon my parents, and to do righteousness of which You approve..."*

This story tells us that no creature is too small to be noticed by Allah, and we should always be careful not to harm even the tiniest insects on earth!`,
    contentUr: `حضرت سلیمان علیہ السلام اللہ کے عظیم پیغمبر اور بادشاہ تھے۔ اللہ نے انہیں بہت سے معجزات عطا کیے تھے جن میں سب سے انوکھا معجزہ یہ تھا کہ آپ **پرندوں، جانوروں اور حشرات الارض کی بولیاں سمجھ سکتے تھے!**

ایک دن حضرت سلیمان علیہ السلام اپنے عظیم لشکر کے ساتھ جا رہے تھے۔ اس لشکر میں انسان، جن، گھوڑے اور پرندے سب شامل تھے جو اوپر پروں کا سایہ کیے ہوئے چل رہے تھے۔

جب وہ ایک وادی کے پاس پہنچے تو حضرت سلیمان علیہ السلام کو زمین سے ایک نہایت باریک آواز سنائی دی۔ انہوں نے لشکر کو روکا اور غور سے سنا۔

وہ ایک ننھی چیونٹی تھی جو اپنی ساتھیوں سے کہہ رہی تھی:
"اے چیونٹیو! اپنے بلوں میں داخل ہو جاؤ، ایسا نہ ہو کہ سلیمان اور ان کا لشکر تمہیں کچل دے اور انہیں خبر بھی نہ ہو!"

وہ چیونٹی بہت سمجھدار تھی۔ وہ اپنی برادری کو بچانا چاہتی تھی اور یہ بھی جانتی تھی کہ سلیمان علیہ السلام اور ان کا لشکر نیک ہے، وہ جان بوجھ کر کسی کو نقصان نہیں پہنچائے گا بلکہ نادانستہ طور پر پاؤں آ سکتا ہے۔

چیونٹی کی یہ بات سن کر حضرت سلیمان علیہ السلام مسکرا دیے اور کھلکھلا کر ہنس پڑے۔ وہ بہت خوش ہوئے کہ اللہ نے انہیں اتنی چھوٹی مخلوق کی بات سمجھنے کی صلاحیت دی ہے۔

انہوں نے فوراً لشکر کا راستہ بدلنے کا حکم دیا تاکہ چیونٹیوں کو کوئی نقصان نہ پہنچے۔ پھر انہوں نے ہاتھ اٹھا کر اللہ کا شکر ادا کیا۔ یہ کہانی ہمیں بتاتی ہے کہ کوئی بھی مخلوق اللہ کی نظر میں معمولی نہیں اور ہمیں چھوٹے چھوٹے کیڑے مکوڑوں کا بھی خیال رکھنا چاہیے۔`,
    lessonsEn: [
      "Never underestimate anyone because of their small size. Even a tiny ant can be wise.",
      "Be grateful for the unique gifts and blessings Allah has given you.",
      "Be extremely careful not to harm small creatures under your feet."
    ],
    lessonsUr: [
      "کسی کو اس کے چھوٹے سائز کی وجہ سے معمولی نہ سمجھیں۔ ایک ننھی چیونٹی بھی عقلمند ہو سکتی ہے۔",
      "اللہ کی دی ہوئی نعمتوں اور صلاحیتوں پر ہمیشہ اس کا شکر ادا کریں۔",
      "اپنے پیروں تلے چلنے والی چھوٹی مخلوقات کو نقصان نہ پہنچانے کا خاص خیال رکھیں۔"
    ],
    references: [
      {
        type: "quran",
        source: "Surah An-Naml",
        referenceKey: "27:17-19",
        verificationStatus: "verified"
      }
    ],
    quiz: [
      {
        question: "What special miracle did Allah give to Prophet Sulaiman (AS)?",
        options: ["He could split the sea", "He could understand animal and insect speech", "He built a big wooden ark", "He could cure illnesses with a touch"],
        answerIndex: 1,
        explanation: "Prophet Sulaiman (AS) was blessed with the ability to understand the languages of birds, ants, and other animals."
      },
      {
        question: "What did the wise ant tell her colony to do?",
        options: ["To fight the army", "To gather sweet sugar", "To run to their homes so they wouldn't be crushed", "To fly away"],
        answerIndex: 2,
        explanation: "The queen ant warned her colony to enter their dwellings so they wouldn't be crushed accidentally by Prophet Sulaiman's army."
      },
      {
        question: "How did Prophet Sulaiman (AS) react when he heard the ant?",
        options: ["He ignored it", "He got angry", "He smiled and thanked Allah", "He stepped on them"],
        answerIndex: 2,
        explanation: "Prophet Sulaiman (AS) smiled and laughed with joy, then made a beautiful prayer thanking Allah for this blessing."
      }
    ],
    isFeatured: false,
    status: "published",
    createdAt: "2026-07-07T08:00:00Z",
    tags: ["Prophets", "Ants", "Gratitude", "Animals", "Quran Story"],
    slug: "prophet-sulaiman-wise-ant"
  }
];

export const DAILY_HADITH: DailyHadith = {
  hadithUr: "رسول اللہ ﷺ نے فرمایا: 'تم زمین والوں پر رحم کرو، آسمان والا تم پر رحم کرے گا۔'",
  hadithEn: "The Messenger of Allah (ﷺ) said: 'Be merciful to those on the earth, and the One in the heaven will have mercy upon you.'",
  source: "Sunan al-Tirmidhi (1924)"
};

export const DAILY_QUOTE: DailyQuote = {
  quoteUr: "بچوں کو نیک بنانے کا بہترین طریقہ یہ ہے کہ انہیں اچھے اخلاق اور سچی کہانیاں سکھائی جائیں۔",
  quoteEn: "The best way to raise righteous children is to teach them good manners and pure stories of faith.",
  source: "Islamic Proverb"
};
