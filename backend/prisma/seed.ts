/**
 * Seed data for the hierarchical course system.
 *
 * Inserts three languages (english / japanese / korean), each with a single
 * A1 level containing 2 units, and each unit containing 3 lessons
 * (vocabulary / grammar / listening mixed).
 *
 * Total: 3 languages × 1 level × 2 units × 3 lessons = 18 lessons.
 *
 * Usage: `pnpm prisma db seed` (configured via the "prisma.seed" field in
 * package.json). The seed is idempotent on `code` uniqueness: existing
 * languages/levels are skipped via upsert-like checks.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type LessonSeed = {
  title: string;
  description: string;
  order: number;
  type: 'vocabulary' | 'grammar' | 'listening';
  duration: number;
};

type UnitSeed = {
  title: string;
  description: string;
  order: number;
  lessons: LessonSeed[];
};

type LanguageSeed = {
  code: string;
  name: string;
  icon: string;
  level: {
    code: string;
    name: string;
    order: number;
    units: UnitSeed[];
  };
};

const SEED: LanguageSeed[] = [
  {
    code: 'english',
    name: '英语',
    icon: '🇬🇧',
    level: {
      code: 'A1',
      name: '入门',
      order: 1,
      units: [
        {
          title: 'Unit 1 · Greetings & Introductions',
          description: '学习最基础的英语问候与自我介绍表达。',
          order: 1,
          lessons: [
            {
              title: '常用问候词汇',
              description: 'Hello / Hi / Good morning 等问候语。',
              order: 1,
              type: 'vocabulary',
              duration: 10,
            },
            {
              title: 'be 动词与代词',
              description: 'I am / You are / He is 的基本结构。',
              order: 2,
              type: 'grammar',
              duration: 15,
            },
            {
              title: '听懂日常问候',
              description: '听简短对话并识别问候用语。',
              order: 3,
              type: 'listening',
              duration: 12,
            },
          ],
        },
        {
          title: 'Unit 2 · Numbers & Time',
          description: '掌握数字表达与基础时间说法。',
          order: 2,
          lessons: [
            {
              title: '数字 0-100',
              description: '基数词的拼写与发音。',
              order: 1,
              type: 'vocabulary',
              duration: 10,
            },
            {
              title: 'What time is it?',
              description: '询问与表达时间的句型。',
              order: 2,
              type: 'grammar',
              duration: 15,
            },
            {
              title: '听懂数字与时间',
              description: '听对话并提取关键数字与时间信息。',
              order: 3,
              type: 'listening',
              duration: 12,
            },
          ],
        },
      ],
    },
  },
  {
    code: 'japanese',
    name: '日语',
    icon: '🇯🇵',
    level: {
      code: 'A1',
      name: '入門',
      order: 1,
      units: [
        {
          title: '第1単元 · 挨拶と自己紹介',
          description: 'ひらがなと基本的な挨拶を学びます。',
          order: 1,
          lessons: [
            {
              title: '挨拶の言葉',
              description: 'おはよう / こんにちは / こんばんは。',
              order: 1,
              type: 'vocabulary',
              duration: 10,
            },
            {
              title: 'です・ます 文',
              description: '丁寧体の基本構文。',
              order: 2,
              type: 'grammar',
              duration: 15,
            },
            {
              title: '挨拶を聞き取る',
              description: '短い会話から挨拶を識別する。',
              order: 3,
              type: 'listening',
              duration: 12,
            },
          ],
        },
        {
          title: '第2単元 · 数字と時間',
          description: '数字と時間の基本的な言い方。',
          order: 2,
          lessons: [
            {
              title: '数字 0-100',
              description: '漢数字と読み方。',
              order: 1,
              type: 'vocabulary',
              duration: 10,
            },
            {
              title: '〜時〜分',
              description: '時間を尋ねる表現。',
              order: 2,
              type: 'grammar',
              duration: 15,
            },
            {
              title: '数字と時間を聞き取る',
              description: '会話から数字と時間を把握する。',
              order: 3,
              type: 'listening',
              duration: 12,
            },
          ],
        },
      ],
    },
  },
  {
    code: 'korean',
    name: '韩语',
    icon: '🇰🇷',
    level: {
      code: 'A1',
      name: '입문',
      order: 1,
      units: [
        {
          title: '1단원 · 인사와 자기소개',
          description: '한글과 기본 인사말을 익힙니다.',
          order: 1,
          lessons: [
            {
              title: '기본 인사말',
              description: '안녕하세요 / 안녕히 가세요.',
              order: 1,
              type: 'vocabulary',
              duration: 10,
            },
            {
              title: '입니다 / 입니까',
              description: '정중한 서술문과 의문문 구조。',
              order: 2,
              type: 'grammar',
              duration: 15,
            },
            {
              title: '인사말 듣기',
              description: '짧은 대화에서 인사말 식별하기。',
              order: 3,
              type: 'listening',
              duration: 12,
            },
          ],
        },
        {
          title: '2단원 · 숫자와 시간',
          description: '숫자와 시간 표현의 기초.',
          order: 2,
          lessons: [
            {
              title: '숫자 0-100',
              description: '한국어 십진법 숫자 읽기.',
              order: 1,
              type: 'vocabulary',
              duration: 10,
            },
            {
              title: '몇 시예요?',
              description: '시간을 묻고 답하는 문형。',
              order: 2,
              type: 'grammar',
              duration: 15,
            },
            {
              title: '숫자와 시간 듣기',
              description: '대화에서 숫자와 시간 파악하기.',
              order: 3,
              type: 'listening',
              duration: 12,
            },
          ],
        },
      ],
    },
  },
];

async function main(): Promise<void> {
  console.log('Seeding course data...');

  for (const lang of SEED) {
    // Upsert language by code.
    const language = await prisma.language.upsert({
      where: { code: lang.code },
      update: { name: lang.name, icon: lang.icon },
      create: {
        code: lang.code,
        name: lang.name,
        icon: lang.icon,
      },
    });

    // Upsert the A1 level for this language.
    const existingLevel = await prisma.level.findFirst({
      where: { languageId: language.id, code: lang.level.code },
    });

    const level = existingLevel
      ? await prisma.level.update({
          where: { id: existingLevel.id },
          data: {
            name: lang.level.name,
            order: lang.level.order,
          },
        })
      : await prisma.level.create({
          data: {
            languageId: language.id,
            code: lang.level.code,
            name: lang.level.name,
            order: lang.level.order,
          },
        });

    for (const unitSeed of lang.level.units) {
      const existingUnit = await prisma.unit.findFirst({
        where: { levelId: level.id, order: unitSeed.order },
      });

      const unit = existingUnit
        ? await prisma.unit.update({
            where: { id: existingUnit.id },
            data: {
              title: unitSeed.title,
              description: unitSeed.description,
            },
          })
        : await prisma.unit.create({
            data: {
              levelId: level.id,
              title: unitSeed.title,
              description: unitSeed.description,
              order: unitSeed.order,
            },
          });

      for (const lessonSeed of unitSeed.lessons) {
        const existingLesson = await prisma.lesson.findFirst({
          where: { unitId: unit.id, order: lessonSeed.order },
        });

        if (existingLesson) {
          await prisma.lesson.update({
            where: { id: existingLesson.id },
            data: {
              title: lessonSeed.title,
              description: lessonSeed.description,
              type: lessonSeed.type,
              duration: lessonSeed.duration,
            },
          });
        } else {
          await prisma.lesson.create({
            data: {
              unitId: unit.id,
              title: lessonSeed.title,
              description: lessonSeed.description,
              order: lessonSeed.order,
              type: lessonSeed.type,
              duration: lessonSeed.duration,
            },
          });
        }
      }
    }
  }

  // ============================================================
  // Task 4.1: Vocabulary seed data.
  // ============================================================
  await seedVocabulary();

  // ============================================================
  // Task 5.1: Grammar question seed data.
  // ============================================================
  await seedGrammar();

  // ============================================================
  // Task 6.1: Speaking exercise seed data.
  // ============================================================
  await seedSpeaking();

  // ============================================================
  // Task 7.1: Listening exercise seed data.
  // ============================================================
  await seedListening();

  console.log(
    'Seed completed: 18 lessons, 30 vocabularies, 18 grammar questions, 9 speaking exercises, 6 listening exercises.',
  );
}

type VocabSeed = {
  word: string;
  translation: string;
  phonetic?: string;
  example?: string;
  exampleTranslation?: string;
};

type VocabLessonSeed = {
  unitOrder: number;
  lessonOrder: number;
  words: VocabSeed[];
};

const VOCAB_SEED: Record<string, VocabLessonSeed[]> = {
  english: [
    {
      unitOrder: 1,
      lessonOrder: 1,
      words: [
        {
          word: 'Hello',
          translation: '你好',
          phonetic: '/həˈloʊ/',
          example: 'Hello! How are you today?',
          exampleTranslation: '你好！你今天好吗？',
        },
        {
          word: 'Good morning',
          translation: '早上好',
          phonetic: '/ˌɡʊd ˈmɔːrnɪŋ/',
          example: 'Good morning, sir.',
          exampleTranslation: '先生，早上好。',
        },
        {
          word: 'Goodbye',
          translation: '再见',
          phonetic: '/ˌɡʊdˈbaɪ/',
          example: 'Goodbye, see you tomorrow.',
          exampleTranslation: '再见，明天见。',
        },
        {
          word: 'Thank you',
          translation: '谢谢',
          phonetic: '/ˈθæŋk juː/',
          example: 'Thank you very much for your help.',
          exampleTranslation: '非常感谢你的帮助。',
        },
        {
          word: 'Sorry',
          translation: '对不起',
          phonetic: '/ˈsɒri/',
          example: 'Sorry, I am late.',
          exampleTranslation: '对不起，我迟到了。',
        },
      ],
    },
    {
      unitOrder: 2,
      lessonOrder: 1,
      words: [
        {
          word: 'one',
          translation: '一',
          phonetic: '/wʌn/',
          example: 'I have one apple.',
          exampleTranslation: '我有一个苹果。',
        },
        {
          word: 'two',
          translation: '二',
          phonetic: '/tuː/',
          example: 'Two cats are on the roof.',
          exampleTranslation: '两只猫在屋顶上。',
        },
        {
          word: 'three',
          translation: '三',
          phonetic: '/θriː/',
          example: 'Three is my lucky number.',
          exampleTranslation: '三是我的幸运数字。',
        },
        {
          word: 'ten',
          translation: '十',
          phonetic: '/ten/',
          example: 'Ten students passed the test.',
          exampleTranslation: '十名学生通过了考试。',
        },
        {
          word: 'hundred',
          translation: '百',
          phonetic: '/ˈhʌndrəd/',
          example: 'A hundred years ago.',
          exampleTranslation: '一百年前。',
        },
      ],
    },
  ],
  japanese: [
    {
      unitOrder: 1,
      lessonOrder: 1,
      words: [
        {
          word: 'おはよう',
          translation: '早上好',
          phonetic: '/oɰaɾoɰo/',
          example: 'おはよう、田中さん。',
          exampleTranslation: '早上好，田中。',
        },
        {
          word: 'こんにちは',
          translation: '你好',
          phonetic: '/koɰɴnitɕiɰa/',
          example: 'こんにちは、はじめまして。',
          exampleTranslation: '你好，初次见面。',
        },
        {
          word: 'こんばんは',
          translation: '晚上好',
          phonetic: '/koɰɴbaɰɰa/',
          example: 'こんばんは、お元気ですか。',
          exampleTranslation: '晚上好，您好吗？',
        },
        {
          word: 'さようなら',
          translation: '再见',
          phonetic: '/saɰoːnaɾa/',
          example: 'さようなら、また明日。',
          exampleTranslation: '再见，明天见。',
        },
        {
          word: 'ありがとう',
          translation: '谢谢',
          phonetic: '/aɾiɡatoː/',
          example: 'ありがとう、助かりました。',
          exampleTranslation: '谢谢，帮大忙了。',
        },
      ],
    },
    {
      unitOrder: 2,
      lessonOrder: 1,
      words: [
        {
          word: '一',
          translation: '一',
          phonetic: '/itɕi/',
          example: '一つください。',
          exampleTranslation: '请给我一个。',
        },
        {
          word: '二',
          translation: '二',
          phonetic: '/ni/',
          example: '二時に会いましょう。',
          exampleTranslation: '两点见吧。',
        },
        {
          word: '三',
          translation: '三',
          phonetic: '/saɰɴ/',
          example: '三人で行きます。',
          exampleTranslation: '三个人去。',
        },
        {
          word: '十',
          translation: '十',
          phonetic: '/dʑɯɯ/',
          example: '十分待ってください。',
          exampleTranslation: '请等十分钟。',
        },
        {
          word: '百',
          translation: '百',
          phonetic: '/hjakɯ/',
          example: '百円です。',
          exampleTranslation: '一百日元。',
        },
      ],
    },
  ],
  korean: [
    {
      unitOrder: 1,
      lessonOrder: 1,
      words: [
        {
          word: '안녕하세요',
          translation: '你好',
          phonetic: '/aɲɲʌŋɦasejo/',
          example: '안녕하세요, 만나서 반갑습니다.',
          exampleTranslation: '你好，很高兴见到你。',
        },
        {
          word: '안녕히 가세요',
          translation: '再见（请走好）',
          phonetic: '/aɲɲʌŋɦi ɡasejo/',
          example: '안녕히 가세요, 내일 봐요.',
          exampleTranslation: '再见，明天见。',
        },
        {
          word: '감사합니다',
          translation: '谢谢',
          phonetic: '/ɡamsʰaɦapnita/',
          example: '감사합니다, 도와주셔서.',
          exampleTranslation: '谢谢您的帮助。',
        },
        {
          word: '죄송합니다',
          translation: '对不起',
          phonetic: '/tɕʰwesʰoŋɦapnita/',
          example: '죄송합니다, 늦었어요.',
          exampleTranslation: '对不起，我迟到了。',
        },
        {
          word: '안녕히 계세요',
          translation: '再见（请留好）',
          phonetic: '/aɲɲʌŋɦi kjesjo/',
          example: '안녕히 계세요, 잘 있어요.',
          exampleTranslation: '再见，保重。',
        },
      ],
    },
    {
      unitOrder: 2,
      lessonOrder: 1,
      words: [
        {
          word: '하나',
          translation: '一（固有词）',
          phonetic: '/hana/',
          example: '하나 주세요.',
          exampleTranslation: '请给我一个。',
        },
        {
          word: '둘',
          translation: '二（固有词）',
          phonetic: '/tɯl/',
          example: '둘이 먹어요.',
          exampleTranslation: '两个人吃。',
        },
        {
          word: '셋',
          translation: '三（固有词）',
          phonetic: '/sɛt/',
          example: '셋이서 갑니다.',
          exampleTranslation: '三个人去。',
        },
        {
          word: '열',
          translation: '十（固有词）',
          phonetic: '/jʌl/',
          example: '열 시에 만나요.',
          exampleTranslation: '十点见。',
        },
        {
          word: '백',
          translation: '百',
          phonetic: '/pɛk/',
          example: '백 원이에요.',
          exampleTranslation: '一百韩元。',
        },
      ],
    },
  ],
};

/**
 * Seed vocabulary rows for the first two vocabulary lessons of each
 * language's A1 level. Lessons are located by (language.code, level.code=A1,
 * unit.order, lesson.order) so the lookup is stable across re-runs.
 */
async function seedVocabulary(): Promise<void> {
  console.log('Seeding vocabulary data...');

  for (const [langCode, lessonSeeds] of Object.entries(VOCAB_SEED)) {
    const language = await prisma.language.findUnique({
      where: { code: langCode },
    });
    if (!language) {
      console.warn(`  skip vocab: language ${langCode} not found`);
      continue;
    }

    const level = await prisma.level.findFirst({
      where: { languageId: language.id, code: 'A1' },
    });
    if (!level) {
      console.warn(`  skip vocab: A1 level for ${langCode} not found`);
      continue;
    }

    for (const ls of lessonSeeds) {
      const unit = await prisma.unit.findFirst({
        where: { levelId: level.id, order: ls.unitOrder },
      });
      if (!unit) {
        console.warn(
          `  skip vocab: unit ${ls.unitOrder} for ${langCode} A1 not found`,
        );
        continue;
      }

      const lesson = await prisma.lesson.findFirst({
        where: { unitId: unit.id, order: ls.lessonOrder },
      });
      if (!lesson) {
        console.warn(
          `  skip vocab: lesson order ${ls.lessonOrder} in unit ${ls.unitOrder} (${langCode}) not found`,
        );
        continue;
      }

      for (const w of ls.words) {
        const existing = await prisma.vocabulary.findFirst({
          where: { lessonId: lesson.id, word: w.word },
        });
        const data = {
          lessonId: lesson.id,
          languageCode: langCode,
          word: w.word,
          translation: w.translation,
          phonetic: w.phonetic ?? null,
          audioUrl: null,
          example: w.example ?? null,
          exampleTranslation: w.exampleTranslation ?? null,
        };
        if (existing) {
          await prisma.vocabulary.update({
            where: { id: existing.id },
            data,
          });
        } else {
          await prisma.vocabulary.create({ data });
        }
      }
    }
  }

  console.log('Vocabulary seed completed: 3 languages × 10 words = 30 vocabularies.');
}

// ============================================================
// Task 5.1: Grammar question seed data
// ============================================================

type GrammarSeed = {
  unitOrder: number;
  lessonOrder: number;
  questions: {
    type: 'MULTIPLE_CHOICE' | 'FILL_BLANK' | 'CORRECTION';
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
  }[];
};

const GRAMMAR_SEED: Record<string, GrammarSeed[]> = {
  english: [
    {
      unitOrder: 1,
      lessonOrder: 2,
      questions: [
        {
          type: 'MULTIPLE_CHOICE',
          question: 'I ___ a student.',
          options: ['am', 'is', 'are', 'be'],
          answer: 'am',
          explanation: '第一人称 I 搭配 am。',
        },
        {
          type: 'FILL_BLANK',
          question: 'She ___ my sister.',
          answer: 'is',
          explanation: '第三人称单数用 is。',
        },
        {
          type: 'MULTIPLE_CHOICE',
          question: 'They ___ happy.',
          options: ['am', 'is', 'are', 'be'],
          answer: 'are',
          explanation: '复数主语用 are。',
        },
      ],
    },
    {
      unitOrder: 2,
      lessonOrder: 2,
      questions: [
        {
          type: 'MULTIPLE_CHOICE',
          question: 'What time ___ it?',
          options: ['am', 'is', 'are', 'be'],
          answer: 'is',
          explanation: '固定句型 What time is it?',
        },
        {
          type: 'FILL_BLANK',
          question: "It's three ___.",
          answer: "o'clock",
          explanation: "整点用 o'clock。",
        },
        {
          type: 'CORRECTION',
          question: 'What time are it?',
          answer: 'is',
          explanation: 'it 搭配 is。',
        },
      ],
    },
  ],
  japanese: [
    {
      unitOrder: 1,
      lessonOrder: 2,
      questions: [
        {
          type: 'MULTIPLE_CHOICE',
          question: '私は学生___。',
          options: ['です', 'ます', 'だ', 'である'],
          answer: 'です',
          explanation: '丁寧体の述語は です。',
        },
        {
          type: 'FILL_BLANK',
          question: '田中さん___日本人ですか。',
          answer: 'は',
          explanation: '主題を示す助詞は は。',
        },
        {
          type: 'MULTIPLE_CHOICE',
          question: 'これは本___。',
          options: ['です', 'ます', 'だ', 'の'],
          answer: 'です',
          explanation: '名詞述語文の丁寧形。',
        },
      ],
    },
    {
      unitOrder: 2,
      lessonOrder: 2,
      questions: [
        {
          type: 'FILL_BLANK',
          question: '今、3___です。',
          answer: '時',
          explanation: '時間の助数詞は 時。',
        },
        {
          type: 'MULTIPLE_CHOICE',
          question: '何時___か？',
          options: ['です', 'ます', 'だ', 'に'],
          answer: 'です',
          explanation: '丁寧な疑問文は ですか。',
        },
        {
          type: 'CORRECTION',
          question: '3時ます。',
          answer: 'です',
          explanation: '名詞には ます でなく です。',
        },
      ],
    },
  ],
  korean: [
    {
      unitOrder: 1,
      lessonOrder: 2,
      questions: [
        {
          type: 'MULTIPLE_CHOICE',
          question: '저는 학생___.',
          options: ['입니다', '합니다', '이에요', '해요'],
          answer: '입니다',
          explanation: '정중한 서술문은 입니다.',
        },
        {
          type: 'FILL_BLANK',
          question: '이것은 책___?',
          answer: '입니까',
          explanation: '정중한 의문문은 입니까.',
        },
        {
          type: 'MULTIPLE_CHOICE',
          question: '저는 한국 사람___.',
          options: ['입니다', '합니다', '해요', '이에요'],
          answer: '입니다',
          explanation: '명사 서술문의 정중형。',
        },
      ],
    },
    {
      unitOrder: 2,
      lessonOrder: 2,
      questions: [
        {
          type: 'FILL_BLANK',
          question: '지금 3시___.',
          answer: '입니다',
          explanation: '시간 서술문은 입니다.',
        },
        {
          type: 'MULTIPLE_CHOICE',
          question: '몇 시___?',
          options: ['입니까', '합니까', '해요', '이에요'],
          answer: '입니까',
          explanation: '시간을 묻는 정중疑问文。',
        },
        {
          type: 'CORRECTION',
          question: '3시합니다.',
          answer: '입니다',
          explanation: '명사에는 합니다 대신 입니다。',
        },
      ],
    },
  ],
};

async function seedGrammar(): Promise<void> {
  console.log('Seeding grammar questions...');
  for (const [langCode, lessonSeeds] of Object.entries(GRAMMAR_SEED)) {
    const language = await prisma.language.findUnique({ where: { code: langCode } });
    if (!language) continue;
    const level = await prisma.level.findFirst({ where: { languageId: language.id, code: 'A1' } });
    if (!level) continue;
    for (const ls of lessonSeeds) {
      const unit = await prisma.unit.findFirst({ where: { levelId: level.id, order: ls.unitOrder } });
      if (!unit) continue;
      const lesson = await prisma.lesson.findFirst({ where: { unitId: unit.id, order: ls.lessonOrder } });
      if (!lesson) continue;
      for (const q of ls.questions) {
        const existing = await prisma.grammarQuestion.findFirst({
          where: { lessonId: lesson.id, question: q.question },
        });
        const data = {
          lessonId: lesson.id,
          languageCode: langCode,
          type: q.type,
          question: q.question,
          options: q.options ?? undefined,
          answer: q.answer,
          explanation: q.explanation,
        };
        if (existing) {
          await prisma.grammarQuestion.update({ where: { id: existing.id }, data });
        } else {
          await prisma.grammarQuestion.create({ data });
        }
      }
    }
  }
  console.log('Grammar seed completed: 18 questions.');
}

// ============================================================
// Task 6.1: Speaking exercise seed data
// ============================================================

type SpeakingSeed = {
  unitOrder: number;
  lessonOrder: number;
  exercises: { text: string; audioUrl: string }[];
};

const SPEAKING_SEED: Record<string, SpeakingSeed[]> = {
  english: [
    {
      unitOrder: 1,
      lessonOrder: 2,
      exercises: [
        { text: 'Hello, my name is Tom.', audioUrl: '/audio/en/speaking-1.mp3' },
        { text: 'How are you today?', audioUrl: '/audio/en/speaking-2.mp3' },
        { text: 'Nice to meet you.', audioUrl: '/audio/en/speaking-3.mp3' },
      ],
    },
  ],
  japanese: [
    {
      unitOrder: 1,
      lessonOrder: 2,
      exercises: [
        { text: 'こんにちは、はじめまして。', audioUrl: '/audio/ja/speaking-1.mp3' },
        { text: '私は田中です。', audioUrl: '/audio/ja/speaking-2.mp3' },
        { text: 'よろしくお願いします。', audioUrl: '/audio/ja/speaking-3.mp3' },
      ],
    },
  ],
  korean: [
    {
      unitOrder: 1,
      lessonOrder: 2,
      exercises: [
        { text: '안녕하세요, 만나서 반갑습니다.', audioUrl: '/audio/ko/speaking-1.mp3' },
        { text: '저는 김민수입니다.', audioUrl: '/audio/ko/speaking-2.mp3' },
        { text: '잘 부탁드립니다.', audioUrl: '/audio/ko/speaking-3.mp3' },
      ],
    },
  ],
};

async function seedSpeaking(): Promise<void> {
  console.log('Seeding speaking exercises...');
  for (const [langCode, lessonSeeds] of Object.entries(SPEAKING_SEED)) {
    const language = await prisma.language.findUnique({ where: { code: langCode } });
    if (!language) continue;
    const level = await prisma.level.findFirst({ where: { languageId: language.id, code: 'A1' } });
    if (!level) continue;
    for (const ls of lessonSeeds) {
      const unit = await prisma.unit.findFirst({ where: { levelId: level.id, order: ls.unitOrder } });
      if (!unit) continue;
      const lesson = await prisma.lesson.findFirst({ where: { unitId: unit.id, order: ls.lessonOrder } });
      if (!lesson) continue;
      for (const ex of ls.exercises) {
        const existing = await prisma.speakingExercise.findFirst({
          where: { lessonId: lesson.id, text: ex.text },
        });
        const data = {
          lessonId: lesson.id,
          languageCode: langCode,
          text: ex.text,
          audioUrl: ex.audioUrl,
          difficulty: 'A1',
        };
        if (existing) {
          await prisma.speakingExercise.update({ where: { id: existing.id }, data });
        } else {
          await prisma.speakingExercise.create({ data });
        }
      }
    }
  }
  console.log('Speaking seed completed: 9 exercises.');
}

// ============================================================
// Task 7.1: Listening exercise seed data
// ============================================================

type ListeningSeed = {
  unitOrder: number;
  lessonOrder: number;
  audioUrl: string;
  transcript: string;
  questions: {
    type: 'MULTIPLE_CHOICE' | 'FILL_BLANK' | 'TRUE_FALSE';
    question: string;
    options?: string[];
    answer: string;
  }[];
};

const LISTENING_SEED: Record<string, ListeningSeed[]> = {
  english: [
    {
      unitOrder: 1,
      lessonOrder: 3,
      audioUrl: '/audio/en/listening-1.mp3',
      transcript: 'A: Hello! How are you? B: Hi, I am fine, thank you. And you?',
      questions: [
        {
          type: 'MULTIPLE_CHOICE',
          question: 'What does A say first?',
          options: ['Hello', 'Hi', 'Bye', 'Thanks'],
          answer: 'Hello',
        },
        {
          type: 'MULTIPLE_CHOICE',
          question: 'How is B?',
          options: ['Fine', 'Sad', 'Angry', 'Tired'],
          answer: 'Fine',
        },
        {
          type: 'TRUE_FALSE',
          question: "B says 'Goodbye'.",
          options: ['True', 'False'],
          answer: 'False',
        },
      ],
    },
    {
      unitOrder: 2,
      lessonOrder: 3,
      audioUrl: '/audio/en/listening-2.mp3',
      transcript: "A: What time is it? B: It's three o'clock. A: Thank you.",
      questions: [
        {
          type: 'MULTIPLE_CHOICE',
          question: "What time is it?",
          options: ['Two', 'Three', 'Four', 'Five'],
          answer: 'Three',
        },
        {
          type: 'TRUE_FALSE',
          question: 'A thanks B.',
          options: ['True', 'False'],
          answer: 'True',
        },
        {
          type: 'FILL_BLANK',
          question: "It's ___ o'clock.",
          answer: 'three',
        },
      ],
    },
  ],
  japanese: [
    {
      unitOrder: 1,
      lessonOrder: 3,
      audioUrl: '/audio/ja/listening-1.mp3',
      transcript: 'A: こんにちは。B: こんにちは、お元気ですか。A: はい、元気です。',
      questions: [
        {
          type: 'MULTIPLE_CHOICE',
          question: 'Aは最初に何と言いましたか？',
          options: ['こんにちは', 'ありがとう', 'さようなら', 'おはよう'],
          answer: 'こんにちは',
        },
        {
          type: 'TRUE_FALSE',
          question: 'Aは元気です。',
          options: ['True', 'False'],
          answer: 'True',
        },
        {
          type: 'FILL_BLANK',
          question: 'Bは「お___ですか」と聞きました。',
          answer: '元気',
        },
      ],
    },
    {
      unitOrder: 2,
      lessonOrder: 3,
      audioUrl: '/audio/ja/listening-2.mp3',
      transcript: 'A: 今、何時ですか。B: 3時です。A: ありがとうございます。',
      questions: [
        {
          type: 'MULTIPLE_CHOICE',
          question: '今何時ですか？',
          options: ['2時', '3時', '4時', '5時'],
          answer: '3時',
        },
        {
          type: 'TRUE_FALSE',
          question: 'AはBに感謝しました。',
          options: ['True', 'False'],
          answer: 'True',
        },
      ],
    },
  ],
  korean: [
    {
      unitOrder: 1,
      lessonOrder: 3,
      audioUrl: '/audio/ko/listening-1.mp3',
      transcript: 'A: 안녕하세요. B: 안녕하세요, 잘 지내셨어요? A: 네, 잘 지냈습니다.',
      questions: [
        {
          type: 'MULTIPLE_CHOICE',
          question: 'A가 처음에 한 말은?',
          options: ['안녕하세요', '감사합니다', '안녕히 가세요', '죄송합니다'],
          answer: '안녕하세요',
        },
        {
          type: 'TRUE_FALSE',
          question: 'A는 잘 지냈습니다.',
          options: ['True', 'False'],
          answer: 'True',
        },
      ],
    },
    {
      unitOrder: 2,
      lessonOrder: 3,
      audioUrl: '/audio/ko/listening-2.mp3',
      transcript: 'A: 지금 몇 시예요? B: 세 시예요. A: 감사합니다.',
      questions: [
        {
          type: 'MULTIPLE_CHOICE',
          question: '지금 몇 시인가요?',
          options: ['두 시', '세 시', '네 시', '다섯 시'],
          answer: '세 시',
        },
        {
          type: 'TRUE_FALSE',
          question: 'A가 B에게 감사했습니다.',
          options: ['True', 'False'],
          answer: 'True',
        },
      ],
    },
  ],
};

async function seedListening(): Promise<void> {
  console.log('Seeding listening exercises...');
  for (const [langCode, lessonSeeds] of Object.entries(LISTENING_SEED)) {
    const language = await prisma.language.findUnique({ where: { code: langCode } });
    if (!language) continue;
    const level = await prisma.level.findFirst({ where: { languageId: language.id, code: 'A1' } });
    if (!level) continue;
    for (const ls of lessonSeeds) {
      const unit = await prisma.unit.findFirst({ where: { levelId: level.id, order: ls.unitOrder } });
      if (!unit) continue;
      const lesson = await prisma.lesson.findFirst({ where: { unitId: unit.id, order: ls.lessonOrder } });
      if (!lesson) continue;
      const existing = await prisma.listeningExercise.findFirst({
        where: { lessonId: lesson.id, audioUrl: ls.audioUrl },
      });
      const exData = {
        lessonId: lesson.id,
        languageCode: langCode,
        audioUrl: ls.audioUrl,
        transcript: ls.transcript,
        difficulty: 'A1',
      };
      const exercise = existing
        ? await prisma.listeningExercise.update({ where: { id: existing.id }, data: exData })
        : await prisma.listeningExercise.create({ data: exData });
      // Replace questions (delete + recreate for simplicity)
      await prisma.listeningQuestion.deleteMany({ where: { exerciseId: exercise.id } });
      for (const q of ls.questions) {
        await prisma.listeningQuestion.create({
          data: {
            exerciseId: exercise.id,
            type: q.type,
            question: q.question,
            options: q.options ?? undefined,
            answer: q.answer,
          },
        });
      }
    }
  }
  console.log('Listening seed completed: 6 exercises with questions.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
