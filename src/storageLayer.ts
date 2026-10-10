import { ALL_LESSONS } from './curriculumData';
import {
  LanguageProgress,
  ProgrammingLanguageId,
  UserDatabase,
} from './types';

const STORAGE_KEY = 'codelopy_prod_v3_1';
const LEGACY_KEYS = ['codelopy_db_v2', 'codelopy_db_v1', 'loopwright_db'];

function createEmptyLanguageProgress(lang: ProgrammingLanguageId): LanguageProgress {
  const firstLesson = ALL_LESSONS[lang]?.[0]?.id || `${lang}-lesson-1`;
  return {
    languageId: lang,
    xp: 0,
    completedLessonIds: [],
    perfectLessonIds: [],
    completedExerciseIds: [],
    currentLessonId: firstLesson,
    lessonScores: {},
    totalAttempts: 0,
    correctAttempts: 0,
    totalTimeSeconds: 0,
  };
}

/**
 * Creates a strictly clean, zero-progress initial database state (Part 6 Rules 1-10).
 * No preset profiles, no pre-earned XP, no completed lessons, no sample projects,
 * no completed debugging hunts, and no pre-cached articles.
 */
export function createCleanUserDatabase(): UserDatabase {
  const nowIso = new Date().toISOString();
  const todayStr = nowIso.slice(0, 10);

  return {
    onboarded: false,
    createdAt: nowIso,
    updatedAt: nowIso,
    naturalLanguage: 'en',
    selectedLanguages: [],
    activeLanguage: 'python',
    experienceLevel: 'never',
    goal: 'basics',
    dailyGoalMinutes: 10,
    streak: 0,
    longestStreak: 0,
    streakFreezes: 0,
    lastSessionDate: null,
    todayMinutesCompleted: 0,
    todayLessonsCompleted: 0,
    activityByDate: {},
    languageProgress: {
      python: createEmptyLanguageProgress('python'),
      javascript: createEmptyLanguageProgress('javascript'),
      typescript: createEmptyLanguageProgress('typescript'),
      rust: createEmptyLanguageProgress('rust'),
      go: createEmptyLanguageProgress('go'),
    },
    fsrsCards: {},
    unlockedBadges: {} as UserDatabase['unlockedBadges'],
    visitedSkillTreeModules: {},
    projects: [],
    hunts: {},
    bookmarks: [],
    notes: [],
    aiConfig: {
      provider: null,
      modelId: '',
      customBaseUrl: '',
      isFreeAssumed: true,
      weights: {
        speed: 0.25,
        quality: 0.3,
        context: 0.15,
        cost: 0.2,
        availability: 0.1,
      },
      persistentMemory: false,
    },
    aiMessages: [],
    weeklyQuest: {
      weekStart: todayStr,
      goals: [
        { id: 'wq-lessons', title: 'Complete 5 lessons', target: 5, current: 0, unit: 'lessons' },
        { id: 'wq-xp', title: 'Earn 500 XP', target: 500, current: 0, unit: 'xp' },
        { id: 'wq-hunts', title: 'Solve 3 debugging hunts', target: 3, current: 0, unit: 'hunts' },
      ],
      bonusClaimed: false,
    },
    monthlyChallenge: {
      monthKey: todayStr.slice(0, 7),
      challengeId: 'complete_guided_project',
      title: 'Complete one guided project',
      description: 'Finish all steps and verification in any Guided Project template this month.',
      target: 1,
      current: 0,
      swappedThisMonth: false,
      completed: false,
      rewardClaimed: false,
    },
    mistakeJournal: [],
    completedInterviewDrillIds: [],
    interviewTranscripts: [],
    completedGymIds: [],
    cachedFeed: [],
    settings: {
      theme: 'light',
      customThemeColors: {
        primary: '#4A6FDC',
        background: '#ECF0F1',
        surface: '#FFFFFF',
        text: '#2C3E50',
      },
      soundSet: 'classic',
      hapticsEnabled: true,
      highContrast: false,
      largeText: false,
      dyslexicFont: false,
      reducedMotion: false,
      colorblindMode: 'none',
      trendingEnabled: true,
      weeklyQuestsEnabled: true,
      monthlyChallengeEnabled: false, // [3.1] Optional, turned off by default
      interviewModeEnabled: true, // [3.2] Optional track in Practice Hub
      autoRefreshContent: true,
      cacheLimitMb: 500,
    },
  };
}

export function loadUserDatabase(): UserDatabase {
  if (typeof window === 'undefined') return createCleanUserDatabase();
  try {
    for (const k of LEGACY_KEYS) {
      window.localStorage.removeItem(k);
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createCleanUserDatabase();
    const parsed = JSON.parse(raw) as Partial<UserDatabase>;
    const clean = createCleanUserDatabase();
    const merged: UserDatabase = {
      ...clean,
      ...parsed,
      languageProgress: {
        ...clean.languageProgress,
        ...(parsed.languageProgress || {}),
      },
      settings: {
        ...clean.settings,
        ...(parsed.settings || {}),
      },
      aiConfig: {
        ...clean.aiConfig,
        ...(parsed.aiConfig || {}),
      },
      monthlyChallenge: {
        ...clean.monthlyChallenge,
        ...(parsed.monthlyChallenge || {}),
      },
      mistakeJournal: parsed.mistakeJournal || [],
      completedInterviewDrillIds: parsed.completedInterviewDrillIds || [],
      interviewTranscripts: parsed.interviewTranscripts || [],
      completedGymIds: parsed.completedGymIds || [],
    };
    if (!merged.aiConfig.persistentMemory) {
      merged.aiMessages = [];
    }
    return merged;
  } catch {
    return createCleanUserDatabase();
  }
}

export function saveUserDatabase(db: UserDatabase): void {
  if (typeof window === 'undefined') return;
  try {
    const copy: UserDatabase = {
      ...db,
      updatedAt: new Date().toISOString(),
      aiMessages: db.aiConfig.persistentMemory ? db.aiMessages : [],
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
  } catch {
    // Storage quota full fallback
  }
}

export function resetUserDatabase(): UserDatabase {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
    for (const k of LEGACY_KEYS) {
      window.localStorage.removeItem(k);
    }
  }
  return createCleanUserDatabase();
}

export function exportUserDatabaseToJson(db: UserDatabase): string {
  return JSON.stringify(db, null, 2);
}
