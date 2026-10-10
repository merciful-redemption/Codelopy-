import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Bookmark,
  Bug,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Download,
  ExternalLink,
  FileText,
  Flame,
  FolderGit2,
  GitBranch,
  Info,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  Settings,
  Sliders,
  Trash2,
  Trophy,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  detectProviderFromSignature,
  enumerateAndRankModels,
  generateTutorReply,
  SUPPORTED_AI_PROVIDERS,
} from './aiBridge';
import { runCodeInSandbox } from './codeSandbox';
import { CodelopyLogo } from './components/CodelopyLogo';
import { ExerciseRunner } from './components/ExerciseRunner';
import { fetchLivingContentPipeline, mergeIntoBoundedCache } from './contentPipeline';
import {
  ALL_LESSONS,
  DEBUGGING_HUNTS,
  GUIDED_PROJECT_CATALOG,
  PROGRAMMING_LANGUAGES,
  SKILL_TREES,
} from './curriculumData';
import { SUPPORTED_UI_LANGUAGES, t } from './i18n';
import {
  BADGE_CATALOG,
  calculateLevelFromXp,
  computeLearningVelocity,
  evaluateNewBadges,
  getEffectiveConceptMastery,
  getHuntXpReward,
  updateDailyStreak,
  updateFSRSCard,
} from './learningEngine';
import { playSoundEffect } from './soundAndHaptics';
import {
  exportUserDatabaseToJson,
  loadUserDatabase,
  resetUserDatabase,
  saveUserDatabase,
} from './storageLayer';
import {
  MonthlyChallengeCard,
  PracticeHubView,
} from './components/PracticeHubAndV3Views';
import { swapMonthlyChallengeOnce } from './loopwrightV3Data';
import {
  AIInterviewTranscript,
  AIMessage,
  AIProviderId,
  AppScreen,
  ColorblindMode,
  DailyGoalMinutes,
  DebuggingHunt,
  ExperienceLevel,
  FSRSCardState,
  GuidedProjectTemplate,
  LanguageProgress,
  LearningGoal,
  Lesson,
  MistakeJournalEntry,
  MonthlyChallengeId,
  NaturalLanguageCode,
  ProgrammingLanguageId,
  SoundSet,
  ThemeMode,
  UserDatabase,
  UserProject,
} from './types';

interface CelebrationBanner {
  type: 'lesson_complete' | 'badge_unlock' | 'level_up';
  title: string;
  subtitle: string;
  xpEarned?: number;
  badgeName?: string;
  newLevel?: number;
}

export function App() {
  const [db, setDb] = useState<UserDatabase>(() => loadUserDatabase());
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Onboarding state (Part 6 Rule 3: strictly NO pre-selected options, starts at Step 1 of 8)
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [obNaturalLang, setObNaturalLang] = useState<NaturalLanguageCode | null>(null);
  const [obLanguages, setObLanguages] = useState<ProgrammingLanguageId[]>([]);
  const [obExperience, setObExperience] = useState<ExperienceLevel | null>(null);
  const [obGoal, setObGoal] = useState<LearningGoal | null>(null);
  const [obDailyGoal, setObDailyGoal] = useState<DailyGoalMinutes | null>(null);
  const [obAiProvider, setObAiProvider] = useState<AIProviderId | null>(null);
  const [obAiModel, setObAiModel] = useState<string>('');

  // Lesson & Exercise navigation state
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [lessonStepIndex, setLessonStepIndex] = useState<number>(0);
  const [lessonMistakesCount, setLessonMistakesCount] = useState<number>(0);
  const [lessonEarnedXp, setLessonEarnedXp] = useState<number>(0);
  const [interactiveCode, setInteractiveCode] = useState<string>('');
  const [interactiveOut, setInteractiveOut] = useState<string | null>(null);

  // Debugging Hunt Editor state
  const [activeHunt, setActiveHunt] = useState<DebuggingHunt | null>(null);
  const [huntCode, setHuntCode] = useState<string>('');
  const [huntOutput, setHuntOutput] = useState<string | null>(null);
  const [huntError, setHuntError] = useState<string | null>(null);
  const [huntFeedback, setHuntFeedback] = useState<{ solved: boolean; text: string } | null>(null);
  const [huntStartMs, setHuntStartMs] = useState<number>(Date.now());
  const [huntHintShown, setHuntHintShown] = useState<boolean>(false);

  // Project Editor state
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectDesc, setNewProjectDesc] = useState<string>('');
  const [projectStepFeedback, setProjectStepFeedback] = useState<string | null>(null);
  const [viewingCertificateProject, setViewingCertificateProject] = useState<UserProject | null>(
    null
  );

  // AI Tutor & AI Setup state
  const [tutorInput, setTutorInput] = useState<string>('');
  const [tutorCodeAttachment, setTutorCodeAttachment] = useState<string>('');
  const [tutorLoading, setTutorLoading] = useState<boolean>(false);
  const [aiSignatureProbe, setAiSignatureProbe] = useState<string>('');
  const [manualModelInput, setManualModelInput] = useState<string>('');

  // Content Feed state
  const [feedLoading, setFeedLoading] = useState<boolean>(false);
  const [redditQuery, setRedditQuery] = useState<string>('');

  // Notes modal/editor state
  const [noteTitleInput, setNoteTitleInput] = useState<string>('');
  const [noteBodyInput, setNoteBodyInput] = useState<string>('');

  // Focus Timer (Pomodoro Part 15.8: default 25m focus / 5m break)
  const [focusSecondsLeft, setFocusSecondsLeft] = useState<number>(25 * 60);
  const [focusRunning, setFocusRunning] = useState<boolean>(false);
  const [focusModeType, setFocusModeType] = useState<'focus' | 'break'>('focus');

  // Import JSON state
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);

  // Celebration overlay (Part 5.5: skippable on tap)
  const [celebration, setCelebration] = useState<CelebrationBanner | null>(null);

  // Splash Screen (< 500ms per Part 3 Rule 25 & Part 7.1)
  useEffect(() => {
    if (screen !== 'splash') return;
    const duration = db.settings.reducedMotion ? 50 : 380;
    const timer = window.setTimeout(() => {
      setScreen(db.onboarded ? 'home' : 'onboarding');
    }, duration);
    return () => window.clearTimeout(timer);
  }, [screen, db.onboarded, db.settings.reducedMotion]);

  // Persist database changes automatically
  useEffect(() => {
    saveUserDatabase(db);
  }, [db]);

  // Online / Offline listener (Part 14.3)
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Fetch initial living content only AFTER onboarding is completed and device is online (Part 6 Rule 10)
  useEffect(() => {
    if (
      db.onboarded &&
      isOnline &&
      db.settings.autoRefreshContent &&
      db.cachedFeed.length === 0
    ) {
      setFeedLoading(true);
      fetchLivingContentPipeline(db.activeLanguage)
        .then((items) => {
          if (items.length > 0) {
            setDb((prev) => ({
              ...prev,
              cachedFeed: mergeIntoBoundedCache(prev.cachedFeed, items),
            }));
          }
        })
        .finally(() => setFeedLoading(false));
    }
  }, [db.onboarded, isOnline, db.activeLanguage, db.settings.autoRefreshContent, db.cachedFeed.length]);

  // Pomodoro Focus Timer interval
  useEffect(() => {
    if (!focusRunning) return;
    const interval = window.setInterval(() => {
      setFocusSecondsLeft((prev) => {
        if (prev <= 1) {
          setFocusRunning(false);
          playSoundEffect('lesson_complete', db.settings.soundSet, db.settings.hapticsEnabled);
          const nextMode = focusModeType === 'focus' ? 'break' : 'focus';
          setFocusModeType(nextMode);
          return nextMode === 'focus' ? 25 * 60 : 5 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [focusRunning, focusModeType, db.settings.soundSet, db.settings.hapticsEnabled]);

  // Auto-dismiss skippable celebration banner after its Part 5.5 duration
  useEffect(() => {
    if (!celebration) return;
    const duration = db.settings.reducedMotion
      ? 200
      : celebration.type === 'level_up'
      ? 2400
      : celebration.type === 'badge_unlock'
      ? 1800
      : 1200;
    const timer = window.setTimeout(() => setCelebration(null), duration);
    return () => window.clearTimeout(timer);
  }, [celebration, db.settings.reducedMotion]);

  // Active language data
  const activeLang = db.activeLanguage;
  const activeLangMeta =
    PROGRAMMING_LANGUAGES.find((l) => l.id === activeLang) || PROGRAMMING_LANGUAGES[0];
  const activeLangProgress = db.languageProgress[activeLang];
  const langLessons = ALL_LESSONS[activeLang] || ALL_LESSONS.python;
  const currentLesson: Lesson = useMemo(() => {
    return (
      langLessons.find((l) => l.id === activeLangProgress.currentLessonId) ||
      langLessons[0]
    );
  }, [langLessons, activeLangProgress.currentLessonId]);

  const activeLesson: Lesson = useMemo(() => {
    return langLessons.find((l) => l.id === activeLessonId) || currentLesson;
  }, [langLessons, activeLessonId, currentLesson]);

  const totalXpAllLanguages = useMemo(() => {
    return (Object.values(db.languageProgress) as LanguageProgress[]).reduce(
      (sum, p) => sum + p.xp,
      0
    );
  }, [db.languageProgress]);

  const levelInfo = useMemo(() => calculateLevelFromXp(totalXpAllLanguages), [totalXpAllLanguages]);

  // Start a lesson
  const startLesson = (lesson: Lesson) => {
    playSoundEffect('tap', db.settings.soundSet, db.settings.hapticsEnabled);
    setActiveLessonId(lesson.id);
    setLessonStepIndex(0);
    setLessonMistakesCount(0);
    setLessonEarnedXp(0);
    setInteractiveCode(lesson.interactivePrompt.templateCode);
    setInteractiveOut(null);
    setScreen('lesson');
  };

  // Complete a lesson and trigger gamification + FSRS + celebrations
  const completeActiveLesson = () => {
    const isPerfect = lessonMistakesCount === 0;
    const lessonBaseXp = 100 + (isPerfect ? 50 : 0);
    const totalSessionXp = lessonEarnedXp + lessonBaseXp;
    const prevLevel = calculateLevelFromXp(totalXpAllLanguages).level;
    const newLevel = calculateLevelFromXp(totalXpAllLanguages + lessonBaseXp).level;
    const todayStr = new Date().toISOString().slice(0, 10);

    setDb((prev) => {
      const streakUpdate = updateDailyStreak(prev);
      const langProg = prev.languageProgress[activeLang];
      const completedSet = new Set(langProg.completedLessonIds);
      completedSet.add(activeLesson.id);
      const perfectSet = new Set(langProg.perfectLessonIds);
      if (isPerfect) perfectSet.add(activeLesson.id);

      // Advance currentLessonId to next uncompleted lesson in curriculum
      const nextUncompleted =
        langLessons.find((l) => !completedSet.has(l.id)) ||
        langLessons[langLessons.length - 1];

      const prevDayActivity = prev.activityByDate[todayStr] || {
        exercises: 0,
        minutes: 0,
        xp: 0,
      };

      // Update FSRS cards for lesson concepts
      const updatedFsrs = { ...prev.fsrsCards };
      for (const concept of activeLesson.concepts) {
        const key = `${activeLang}:${concept}`;
        updatedFsrs[key] = updateFSRSCard(
          updatedFsrs[key],
          concept,
          activeLang,
          isPerfect,
          15
        );
      }

      // Update weekly quests
      const updatedGoals = prev.weeklyQuest.goals.map((g) => {
        if (g.unit === 'lessons') return { ...g, current: g.current + 1 };
        if (g.unit === 'xp') return { ...g, current: g.current + lessonBaseXp };
        return g;
      });

      const nextDb: UserDatabase = {
        ...prev,
        streak: streakUpdate.streak,
        longestStreak: streakUpdate.longestStreak,
        streakFreezes: streakUpdate.streakFreezes,
        lastSessionDate: todayStr,
        todayMinutesCompleted: prev.todayMinutesCompleted + 5,
        todayLessonsCompleted: prev.todayLessonsCompleted + 1,
        activityByDate: {
          ...prev.activityByDate,
          [todayStr]: {
            exercises: prevDayActivity.exercises + activeLesson.exercises.length,
            minutes: prevDayActivity.minutes + 5,
            xp: prevDayActivity.xp + lessonBaseXp,
          },
        },
        languageProgress: {
          ...prev.languageProgress,
          [activeLang]: {
            ...langProg,
            xp: langProg.xp + lessonBaseXp,
            completedLessonIds: Array.from(completedSet),
            perfectLessonIds: Array.from(perfectSet),
            currentLessonId: nextUncompleted.id,
            totalTimeSeconds: langProg.totalTimeSeconds + 300,
          },
        },
        fsrsCards: updatedFsrs,
        weeklyQuest: {
          ...prev.weeklyQuest,
          goals: updatedGoals,
        },
      };

      const newBadges = evaluateNewBadges(nextDb);
      if (newBadges.length > 0) {
        const badgeTimestamps = { ...nextDb.unlockedBadges };
        const nowIso = new Date().toISOString();
        for (const bId of newBadges) {
          badgeTimestamps[bId] = nowIso;
        }
        nextDb.unlockedBadges = badgeTimestamps;
      }

      return nextDb;
    });

    if (newLevel > prevLevel) {
      playSoundEffect('level_up', db.settings.soundSet, db.settings.hapticsEnabled);
      setCelebration({
        type: 'level_up',
        title: `Level ${newLevel} Reached!`,
        subtitle: `${activeLesson.title} complete (+${totalSessionXp} XP)`,
        xpEarned: totalSessionXp,
        newLevel,
      });
    } else {
      playSoundEffect('lesson_complete', db.settings.soundSet, db.settings.hapticsEnabled);
      setCelebration({
        type: 'lesson_complete',
        title: 'Lesson Complete!',
        subtitle: isPerfect
          ? `Flawless completion! +${totalSessionXp} XP (includes +50 Perfection Bonus)`
          : `Earned +${totalSessionXp} XP toward your daily habit`,
        xpEarned: totalSessionXp,
      });
    }

    setScreen('home');
  };

  // Handle single exercise completion inside Lesson or Exercise screen
  const handleExerciseEvaluated = (
    correct: boolean,
    xpEarned: number,
    elapsedSeconds: number,
    isSpeedRun: boolean
  ) => {
    playSoundEffect(
      correct ? 'correct' : 'incorrect',
      db.settings.soundSet,
      db.settings.hapticsEnabled
    );

    if (!correct) {
      setLessonMistakesCount((c) => c + 1);
    } else {
      setLessonEarnedXp((x) => x + xpEarned);
    }

    const currentExercise =
      activeLesson.exercises[lessonStepIndex - 2] || activeLesson.exercises[0];
    const todayStr = new Date().toISOString().slice(0, 10);

    setDb((prev) => {
      const langProg = prev.languageProgress[activeLang];
      const completedEx = new Set(langProg.completedExerciseIds);
      if (correct && currentExercise) completedEx.add(currentExercise.id);

      const fsrsKey = `${activeLang}:${currentExercise?.concept || activeLesson.concepts[0]}`;
      const updatedCard = updateFSRSCard(
        prev.fsrsCards[fsrsKey],
        currentExercise?.concept || activeLesson.concepts[0],
        activeLang,
        correct,
        elapsedSeconds
      );

      const dayRec = prev.activityByDate[todayStr] || { exercises: 0, minutes: 0, xp: 0 };

      let updatedMistakes = prev.mistakeJournal || [];
      if (!correct && currentExercise) {
        const answerStr = Array.isArray(currentExercise.answer)
          ? currentExercise.answer.join(' ')
          : currentExercise.answer;
        const alreadyLogged = updatedMistakes.some(
          (m) => m.sourceId === currentExercise.id && !m.cleared
        );
        if (!alreadyLogged) {
          const newEntry: MistakeJournalEntry = {
            id: `mj-${Date.now()}`,
            languageId: activeLang,
            concept: currentExercise.concept,
            sourceType: 'exercise',
            sourceId: currentExercise.id,
            prompt: currentExercise.prompt,
            userWrongAttempt: 'Incorrect attempt during lesson',
            correctAnswer: answerStr,
            explanation: currentExercise.explanation,
            reflectionNote: '',
            cleared: false,
            createdAt: new Date().toISOString(),
          };
          updatedMistakes = [newEntry, ...updatedMistakes];
        }
      }

      const nextDb: UserDatabase = {
        ...prev,
        activityByDate: {
          ...prev.activityByDate,
          [todayStr]: {
            exercises: dayRec.exercises + (correct ? 1 : 0),
            minutes: dayRec.minutes + 1,
            xp: dayRec.xp + xpEarned,
          },
        },
        languageProgress: {
          ...prev.languageProgress,
          [activeLang]: {
            ...langProg,
            xp: langProg.xp + xpEarned,
            completedExerciseIds: Array.from(completedEx),
            totalAttempts: langProg.totalAttempts + 1,
            correctAttempts: langProg.correctAttempts + (correct ? 1 : 0),
            totalTimeSeconds: langProg.totalTimeSeconds + elapsedSeconds,
          },
        },
        fsrsCards: {
          ...prev.fsrsCards,
          [fsrsKey]: updatedCard,
        },
        mistakeJournal: updatedMistakes,
      };

      const newBadges = evaluateNewBadges(nextDb, { completedSpeedRun: isSpeedRun && correct });
      if (newBadges.length > 0) {
        const badgeMap = { ...nextDb.unlockedBadges };
        for (const b of newBadges) badgeMap[b] = new Date().toISOString();
        nextDb.unlockedBadges = badgeMap;
      }

      return nextDb;
    });

    // Advance to next step in lesson
    const totalSteps = 2 + activeLesson.exercises.length + 1; // 0: Intro+Examples, 1: Interactive+Surprise, 2..N: Exercises, Last: Recap
    if (lessonStepIndex + 1 < totalSteps) {
      setLessonStepIndex((i) => i + 1);
    } else {
      completeActiveLesson();
    }
  };

  // Theme & Accessibility wrapper classes (Part 17.6 & Part 20)
  const themeClasses = useMemo(() => {
    const { theme, highContrast, largeText, dyslexicFont, reducedMotion, colorblindMode } =
      db.settings;
    const classes: string[] = ['min-h-screen flex flex-col transition-colors duration-200'];

    if (highContrast) {
      classes.push('bg-black text-white');
    } else if (theme === 'dark') {
      classes.push('dark bg-[#0F172A] text-[#ECF0F1]');
    } else if (theme === 'terminal') {
      classes.push('dark bg-[#050B07] text-[#2ECC71] font-mono');
    } else if (theme === 'neon') {
      classes.push('dark bg-[#0B0719] text-[#F8FAFC]');
    } else {
      classes.push('bg-[#F8FAFC] text-[#2C3E50]');
    }

    if (largeText) classes.push('large-text-mode');
    if (dyslexicFont) classes.push('font-dyslexic-mode');
    if (reducedMotion) classes.push('reduced-motion');
    if (colorblindMode !== 'none') classes.push(`cb-${colorblindMode}`);

    return classes.join(' ');
  }, [db.settings]);

  const cardSurfaceClass = useMemo(() => {
    if (db.settings.highContrast) return 'bg-black border-2 border-white text-white';
    if (db.settings.theme === 'dark') return 'bg-[#1E293B] border border-slate-800 text-slate-100';
    if (db.settings.theme === 'terminal')
      return 'bg-[#0A1910] border border-[#2ECC71]/40 text-[#2ECC71]';
    if (db.settings.theme === 'neon')
      return 'bg-[#161032] border border-[#4A6FDC]/40 text-slate-100';
    return 'bg-white border border-slate-200/90 text-[#2C3E50] shadow-xs';
  }, [db.settings.theme, db.settings.highContrast]);

  // Toggle Bookmark helper
  const toggleBookmark = (
    type: 'lesson' | 'exercise' | 'article',
    referenceId: string,
    title: string,
    subtitle: string
  ) => {
    playSoundEffect('tap', db.settings.soundSet, db.settings.hapticsEnabled);
    setDb((prev) => {
      const exists = prev.bookmarks.some((b) => b.referenceId === referenceId);
      const nextBookmarks = exists
        ? prev.bookmarks.filter((b) => b.referenceId !== referenceId)
        : [
            {
              id: `bm-${Date.now()}`,
              type,
              referenceId,
              languageId: prev.activeLanguage,
              title,
              subtitle,
              createdAt: new Date().toISOString(),
            },
            ...prev.bookmarks,
          ];
      return { ...prev, bookmarks: nextBookmarks };
    });
  };

  // ==========================================================================
  // SCREEN 1: SPLASH SCREEN (Part 3 Rule 25 & Part 7.1: < 500ms fade)
  // ==========================================================================
  if (screen === 'splash') {
    return (
      <div className={`${themeClasses} items-center justify-center p-6`}>
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <CodelopyLogo size={72} />
          <h1 className="text-3xl font-bold tracking-tight">Codelopy</h1>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SCREEN 2: 8-STEP ONBOARDING (Part 6 Rule 3: Zero pre-selected options)
  // ==========================================================================
  if (screen === 'onboarding') {
    const finishOnboarding = () => {
      const chosenLangs: ProgrammingLanguageId[] =
        obLanguages.length > 0 ? obLanguages : ['python'];
      const primaryLang = chosenLangs[0];
      playSoundEffect('lesson_complete', db.settings.soundSet, db.settings.hapticsEnabled);

      setDb((prev) => ({
        ...prev,
        onboarded: true,
        naturalLanguage: obNaturalLang || 'en',
        selectedLanguages: chosenLangs,
        activeLanguage: primaryLang,
        experienceLevel: obExperience || 'never',
        goal: obGoal || 'basics',
        dailyGoalMinutes: obDailyGoal || 10,
        aiConfig: {
          ...prev.aiConfig,
          provider: obAiProvider,
          modelId: obAiModel,
          detectedAt: obAiProvider ? new Date().toISOString() : undefined,
        },
      }));
      setScreen('home');
    };

    const rankedOnboardingModels = obAiProvider
      ? enumerateAndRankModels(obAiProvider, db.aiConfig.weights)
      : [];

    return (
      <div className={`${themeClasses} justify-between p-4 md:p-8`}>
        <div className="max-w-xl w-full mx-auto flex flex-col gap-6 my-auto py-4">
          {/* Progress header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <CodelopyLogo size={32} />
              <span className="font-bold text-lg tracking-tight">Codelopy</span>
            </div>
            <span className="text-xs font-medium text-slate-500 tabular-nums">
              Step {onboardingStep} of 8
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-[#4A6FDC] transition-all duration-300"
              style={{ width: `${(onboardingStep / 8) * 100}%` }}
            />
          </div>

          {/* Step 1: Welcome & Brand Launch Step */}
          {onboardingStep === 1 && (
            <div className={`${cardSurfaceClass} p-6 md:p-8 rounded-3xl flex flex-col items-center text-center gap-5`}>
              <CodelopyLogo size={64} />
              <div className="flex flex-col gap-2 max-w-md">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">
                  Welcome to Codelopy
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Build a daily coding habit in Python, JavaScript, TypeScript, Rust, and Go. Local-first, private, and tailored to your pace.
                </p>
              </div>
              <div className="w-full flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(2)}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#4A6FDC] text-white font-semibold text-sm active:scale-95 transition-transform"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Natural Language Selection */}
          {onboardingStep === 2 && (
            <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-5`}>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-balance">
                  Choose your interface language
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Select the language for menus and navigation. Nothing is pre-selected.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {SUPPORTED_UI_LANGUAGES.map((lang) => {
                  const selected = obNaturalLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setObNaturalLang(lang.code)}
                      className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border text-left transition-transform active:scale-95 flex flex-col justify-center ${
                        selected
                          ? 'border-[#4A6FDC] bg-[#4A6FDC]/10 text-[#4A6FDC] font-semibold'
                          : 'border-slate-200 dark:border-slate-700 hover:border-[#4A6FDC]/50'
                      }`}
                    >
                      <span className="text-sm">{lang.nativeName}</span>
                      <span className="text-[11px] text-slate-500">{lang.englishName}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(1)}
                  className="min-h-[48px] px-4 py-2 text-sm font-medium text-slate-500"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!obNaturalLang}
                  onClick={() => setOnboardingStep(3)}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#4A6FDC] text-white font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Programming Language Interest Selection */}
          {onboardingStep === 3 && (
            <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-5`}>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-balance">
                  Which programming languages do you want to learn?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Select one or more languages. Each has its own skill tree and curriculum.
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                {PROGRAMMING_LANGUAGES.map((lang) => {
                  const selected = obLanguages.includes(lang.id);
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        setObLanguages((prev) =>
                          prev.includes(lang.id)
                            ? prev.filter((x) => x !== lang.id)
                            : [...prev, lang.id]
                        );
                      }}
                      className={`min-h-[56px] px-4 py-3 rounded-2xl border text-left transition-transform active:scale-[0.99] flex items-center justify-between gap-3 ${
                        selected
                          ? 'border-[#4A6FDC] bg-[#4A6FDC]/10'
                          : 'border-slate-200 dark:border-slate-700 hover:border-[#4A6FDC]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-10 h-10 rounded-xl font-mono font-bold text-sm flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: lang.accentColor }}
                        >
                          {lang.monogram}
                        </span>
                        <div>
                          <div className="font-semibold text-sm">{lang.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {lang.tagline}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                          selected
                            ? 'bg-[#4A6FDC] border-[#4A6FDC] text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {selected && <Check className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(2)}
                  className="min-h-[48px] px-4 py-2 text-sm font-medium text-slate-500"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={obLanguages.length === 0}
                  onClick={() => setOnboardingStep(4)}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#4A6FDC] text-white font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Experience Level */}
          {onboardingStep === 4 && (
            <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-5`}>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-balance">
                  What is your coding experience level?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Codelopy adapts pacing and review intervals to your background.
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                {(
                  [
                    {
                      id: 'never',
                      label: "I've never coded before",
                      desc: 'Start from first principles with step-by-step guidance.',
                    },
                    {
                      id: 'some',
                      label: "I've written some code",
                      desc: 'Familiar with basic concepts and ready to build fluency.',
                    },
                    {
                      id: 'experienced',
                      label: "I'm experienced in another language",
                      desc: 'Picking up syntax, idioms, and standard libraries quickly.',
                    },
                  ] as const
                ).map((item) => {
                  const selected = obExperience === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setObExperience(item.id)}
                      className={`min-h-[56px] p-4 rounded-2xl border text-left transition-transform active:scale-[0.99] ${
                        selected
                          ? 'border-[#4A6FDC] bg-[#4A6FDC]/10'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-sm">{item.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(3)}
                  className="min-h-[48px] px-4 py-2 text-sm font-medium text-slate-500"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!obExperience}
                  onClick={() => setOnboardingStep(5)}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#4A6FDC] text-white font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Goal Selection */}
          {onboardingStep === 5 && (
            <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-5`}>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-balance">
                  What is your primary goal?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Choose what motivates your daily coding habit.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    { id: 'basics', label: 'Learn the basics', desc: 'Understand how software works' },
                    { id: 'project', label: 'Build a project', desc: 'Create real utilities and tools' },
                    { id: 'job', label: 'Prepare for a job', desc: 'Master practical problem solving' },
                    { id: 'fun', label: 'Just for fun', desc: 'Enjoy daily logic puzzles' },
                  ] as const
                ).map((item) => {
                  const selected = obGoal === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setObGoal(item.id)}
                      className={`min-h-[64px] p-4 rounded-2xl border text-left transition-transform active:scale-95 ${
                        selected
                          ? 'border-[#4A6FDC] bg-[#4A6FDC]/10'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-sm">{item.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(4)}
                  className="min-h-[48px] px-4 py-2 text-sm font-medium text-slate-500"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!obGoal}
                  onClick={() => setOnboardingStep(6)}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#4A6FDC] text-white font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Daily Goal Selection */}
          {onboardingStep === 6 && (
            <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-5`}>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-balance">
                  Pick your daily habit target
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Short, consistent daily sessions build lasting competence over months.
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                {(
                  [
                    { mins: 5, name: 'Casual', desc: '5 minutes/day · Keep the habit alive' },
                    { mins: 10, name: 'Regular', desc: '10 minutes/day · Steady daily progress' },
                    { mins: 20, name: 'Serious', desc: '20 minutes/day · Deepen fluency fast' },
                    { mins: 30, name: 'Intense', desc: '30+ minutes/day · Accelerated mastery' },
                  ] as const
                ).map((item) => {
                  const selected = obDailyGoal === item.mins;
                  return (
                    <button
                      key={item.mins}
                      type="button"
                      onClick={() => setObDailyGoal(item.mins)}
                      className={`min-h-[54px] px-4 py-3 rounded-2xl border text-left flex items-center justify-between transition-transform active:scale-[0.99] ${
                        selected
                          ? 'border-[#4A6FDC] bg-[#4A6FDC]/10'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="font-semibold text-sm">{item.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(5)}
                  className="min-h-[48px] px-4 py-2 text-sm font-medium text-slate-500"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!obDailyGoal}
                  onClick={() => setOnboardingStep(7)}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#4A6FDC] text-white font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 7: Optional AI Setup */}
          {onboardingStep === 7 && (
            <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-5`}>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-balance">
                  Optional AI Tutor Provider Setup
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Select a provider profile to auto-enumerate and rank free models by efficiency, or skip and configure later in Settings.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUPPORTED_AI_PROVIDERS.slice(0, 9).map((prov) => {
                  const active = obAiProvider === prov.id;
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => {
                        setObAiProvider(prov.id);
                        const models = enumerateAndRankModels(prov.id, db.aiConfig.weights);
                        setObAiModel(models[0]?.id || '');
                      }}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-left text-xs font-medium transition-colors ${
                        active
                          ? 'border-[#4A6FDC] bg-[#4A6FDC]/10 text-[#4A6FDC] font-semibold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {prov.name}
                    </button>
                  );
                })}
              </div>

              {obAiProvider && rankedOnboardingModels.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 text-xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#2ECC71]">
                      Top Ranked Free Model: {rankedOnboardingModels[0].name}
                    </span>
                    <span className="font-mono tabular-nums font-bold">
                      Score {rankedOnboardingModels[0].compositeScore}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    {rankedOnboardingModels[0].freeEvidence} (Assumed free unless proven otherwise).
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(6)}
                  className="min-h-[48px] px-4 py-2 text-sm font-medium text-slate-500"
                >
                  Back
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setObAiProvider(null);
                      setObAiModel('');
                      setOnboardingStep(8);
                    }}
                    className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                  >
                    Skip for Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(8)}
                    className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#4A6FDC] text-white font-semibold text-sm active:scale-95 transition-transform"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Ready Screen (Part 6 Rule 4: Starts at 0 XP, 0 streak, 0 completed lessons) */}
          {onboardingStep === 8 && (
            <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-5`}>
              <div className="flex items-center gap-3">
                <CodelopyLogo size={48} />
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Your Learning Path is Ready</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Starting fresh at Lesson 1 with 0 XP and 0 completed lessons.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs border-y border-slate-200 dark:border-slate-800 py-4">
                <div>
                  <span className="text-slate-500">Selected Languages</span>
                  <div className="font-semibold mt-0.5 uppercase">
                    {(obLanguages.length > 0 ? obLanguages : ['python']).join(' · ')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Daily Habit Target</span>
                  <div className="font-semibold mt-0.5 tabular-nums">
                    {obDailyGoal || 10} minutes / day
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Starting State</span>
                  <div className="font-semibold mt-0.5 tabular-nums">0 XP · 0 Day Streak</div>
                </div>
                <div>
                  <span className="text-slate-500">Storage Mode</span>
                  <div className="font-semibold mt-0.5">100% Local-First · Private</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(7)}
                  className="min-h-[48px] px-4 py-2 text-sm font-medium text-slate-500"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={finishOnboarding}
                  className="min-h-[48px] px-7 py-3 rounded-xl bg-[#2ECC71] text-slate-950 font-bold text-sm active:scale-95 transition-transform"
                >
                  Start First Lesson Path
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SHARED TOP BAR & BOTTOM NAVIGATION (Part 17.3 & Top Bar 3-Zone Contract)
  // ==========================================================================
  const dailyProgressPercent = Math.min(
    100,
    Math.round((db.todayMinutesCompleted / db.dailyGoalMinutes) * 100)
  );

  return (
    <div className={themeClasses}>
      {/* Skippable Celebration Modal Overlay (Part 5.5) */}
      {celebration && (
        <div
          role="dialog"
          aria-label="Achievement celebration"
          onClick={() => setCelebration(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            className={`${cardSurfaceClass} max-w-md w-full p-6 rounded-3xl text-center flex flex-col items-center gap-3 transform transition-all duration-300 scale-100`}
          >
            <div className="w-16 h-16 rounded-2xl bg-[#F6B93B]/20 text-[#F6B93B] flex items-center justify-center">
              <Trophy className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{celebration.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{celebration.subtitle}</p>
            <span className="text-[11px] text-slate-400 mt-2">Tap anywhere to continue</span>
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal (Part 16.4) */}
      {viewingCertificateProject && (
        <div
          role="dialog"
          aria-label="Project completion certificate"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className={`${cardSurfaceClass} max-w-lg w-full p-8 rounded-3xl flex flex-col gap-5`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <CodelopyLogo size={32} />
                <span className="font-bold text-lg">Codelopy Project Portfolio Record</span>
              </div>
              <Award className="w-6 h-6 text-[#F6B93B]" />
            </div>
            <div className="py-4 text-center flex flex-col gap-2">
              <span className="text-xs text-slate-500">Completed Practical Build</span>
              <h3 className="text-2xl font-bold">{viewingCertificateProject.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {viewingCertificateProject.description}
              </p>
              <div className="text-xs font-mono text-[#4A6FDC] mt-2">
                Language: {viewingCertificateProject.languageId.toUpperCase()} · Completed{' '}
                {viewingCertificateProject.completedAt
                  ? new Date(viewingCertificateProject.completedAt).toLocaleDateString()
                  : new Date().toLocaleDateString()}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewingCertificateProject(null)}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#4A6FDC] text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-Zone Top Navigation Bar (Frontend Design Section 2 Contract) */}
      <header className="sticky top-0 z-30 h-14 px-4 md:px-8 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => setScreen('home')}
          className="text-lg font-bold tracking-tight text-[#4A6FDC] whitespace-nowrap shrink-0 cursor-pointer"
        >
          Codelopy
        </button>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setScreen('home')}
            className={`hover:text-[#4A6FDC] transition-colors whitespace-nowrap shrink-0 ${
              screen === 'home' ? 'text-[#4A6FDC] font-semibold underline underline-offset-8' : ''
            }`}
          >
            {t(db.naturalLanguage, 'home')}
          </button>
          <button
            type="button"
            onClick={() => setScreen('skill_tree')}
            className={`hover:text-[#4A6FDC] transition-colors whitespace-nowrap shrink-0 ${
              screen === 'skill_tree'
                ? 'text-[#4A6FDC] font-semibold underline underline-offset-8'
                : ''
            }`}
          >
            {t(db.naturalLanguage, 'skill_tree')}
          </button>
          <button
            type="button"
            onClick={() => setScreen('practice_hub')}
            className={`hover:text-[#4A6FDC] transition-colors whitespace-nowrap shrink-0 ${
              screen === 'practice_hub' ||
              screen === 'debugging_hunts' ||
              screen === 'debugging_hunt_editor' ||
              screen === 'interview_mode'
                ? 'text-[#4A6FDC] font-semibold underline underline-offset-8'
                : ''
            }`}
          >
            Practice Hub
          </button>
          <button
            type="button"
            onClick={() => setScreen('projects')}
            className={`hover:text-[#4A6FDC] transition-colors whitespace-nowrap shrink-0 ${
              screen === 'projects' || screen === 'project_editor'
                ? 'text-[#4A6FDC] font-semibold underline underline-offset-8'
                : ''
            }`}
          >
            {t(db.naturalLanguage, 'projects')}
          </button>
          <button
            type="button"
            onClick={() => setScreen('ai_tutor')}
            className={`hover:text-[#4A6FDC] transition-colors whitespace-nowrap shrink-0 ${
              screen === 'ai_tutor'
                ? 'text-[#4A6FDC] font-semibold underline underline-offset-8'
                : ''
            }`}
          >
            {t(db.naturalLanguage, 'ai_tutor')}
          </button>
        </nav>

        {/* Zone 3: 1 primary contextual action (Settings) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setScreen('settings')}
            aria-label="Open settings"
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:border-[#4A6FDC] transition-colors whitespace-nowrap shrink-0"
          >
            <Settings className="w-4 h-4" />
            <span>{t(db.naturalLanguage, 'settings')}</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-5 pb-24 md:pb-10">
        {/* ====================================================================
            SCREEN 3: HOME SCREEN (Part 7.2)
            Current lesson card prominent & visible without scrolling, streak,
            XP progress bar, daily goal ring, skill tree access, trending section.
           ==================================================================== */}
        {screen === 'home' && (
          <div className="flex flex-col gap-6">
            {/* Language Switcher + Secondary Utility Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 overflow-x-auto">
                {PROGRAMMING_LANGUAGES.map((lang) => {
                  const isActive = db.activeLanguage === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() =>
                        setDb((prev) => ({
                          ...prev,
                          activeLanguage: lang.id,
                          selectedLanguages: prev.selectedLanguages.includes(lang.id)
                            ? prev.selectedLanguages
                            : [...prev.selectedLanguages, lang.id],
                        }))
                      }
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-[#4A6FDC] text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {lang.name}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setScreen('practice_hub')}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#4A6FDC]/10 text-[#4A6FDC] border border-[#4A6FDC]/30 font-semibold flex items-center gap-1.5 hover:border-[#4A6FDC] whitespace-nowrap shrink-0"
                >
                  <Trophy className="w-3.5 h-3.5 text-[#4A6FDC]" />
                  <span>Practice Hub &amp; Interview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScreen('ai_tutor')}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium flex items-center gap-1.5 hover:border-[#4A6FDC] whitespace-nowrap shrink-0"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#4A6FDC]" />
                  <span>{t(db.naturalLanguage, 'ai_tutor')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScreen('debugging_hunts')}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium flex items-center gap-1.5 hover:border-[#F6B93B] whitespace-nowrap shrink-0"
                >
                  <Bug className="w-3.5 h-3.5 text-[#F6B93B]" />
                  <span>Hunts</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScreen('bookmarks')}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium flex items-center gap-1.5 hover:border-[#4A6FDC] whitespace-nowrap shrink-0"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span className="tabular-nums">({db.bookmarks.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScreen('notes')}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium flex items-center gap-1.5 hover:border-[#4A6FDC] whitespace-nowrap shrink-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="tabular-nums">({db.notes.length})</span>
                </button>
              </div>
            </div>

            {/* Top Hero Row: Current Lesson Card (Focal Anchor) + Daily Habit Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Prominent Current Lesson Card (Always visible without scrolling) */}
              <div
                className={`${cardSurfaceClass} lg:col-span-7 p-6 md:p-7 rounded-3xl flex flex-col justify-between gap-5`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#4A6FDC]">{activeLangMeta.name}</span>
                      <span aria-hidden="true">·</span>
                      <span>{currentLesson.moduleTitle}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {activeLangProgress.completedLessonIds.length} / {langLessons.length}{' '}
                        lessons
                      </span>
                    </div>
                    <CodelopyLogo size={28} />
                  </div>

                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">
                    {currentLesson.title}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentLesson.objective}
                  </p>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-1">
                    <span>Concepts: {currentLesson.concepts.join(' · ')}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{currentLesson.exercises.length} exercises</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => startLesson(currentLesson)}
                    className="min-h-[48px] px-7 py-3 rounded-2xl bg-[#4A6FDC] hover:bg-[#3b5ec7] text-white font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{t(db.naturalLanguage, 'continue_lesson')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScreen('skill_tree')}
                    className="min-h-[48px] px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-semibold text-sm flex items-center gap-2 hover:border-[#4A6FDC] transition-colors whitespace-nowrap shrink-0"
                  >
                    <GitBranch className="w-4 h-4 text-[#4A6FDC]" />
                    <span>{t(db.naturalLanguage, 'skill_tree')}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Streak + Daily Goal Progress Ring + XP Level Bar */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                {/* Daily Streak Card */}
                <div className={`${cardSurfaceClass} p-5 rounded-3xl flex flex-col justify-between`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t(db.naturalLanguage, 'streak')}
                    </span>
                    <Flame
                      className={`w-5 h-5 ${
                        db.streak > 0 ? 'text-[#F6B93B] fill-[#F6B93B]' : 'text-slate-400'
                      }`}
                    />
                  </div>
                  <div className="my-2">
                    <div className="text-3xl font-bold tabular-nums">{db.streak}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                      Longest: {db.longestStreak}d · Freezes: {db.streakFreezes}
                    </div>
                  </div>
                </div>

                {/* Daily Goal Progress Ring Card */}
                <div className={`${cardSurfaceClass} p-5 rounded-3xl flex flex-col justify-between`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t(db.naturalLanguage, 'daily_goal')}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#2ECC71] tabular-nums">
                      {dailyProgressPercent}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 my-1">
                    <svg className="w-14 h-14 -rotate-90 shrink-0" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        className="text-slate-200 dark:text-slate-800"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        fill="none"
                        stroke="#2ECC71"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 26}
                        strokeDashoffset={
                          2 * Math.PI * 26 * (1 - Math.min(1, dailyProgressPercent / 100))
                        }
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div>
                      <div className="text-lg font-bold tabular-nums">
                        {db.todayMinutesCompleted} / {db.dailyGoalMinutes}m
                      </div>
                      <div className="text-[11px] text-slate-500">Today&apos;s practice</div>
                    </div>
                  </div>
                </div>

                {/* XP Progress Bar Toward Next Level */}
                <div className={`${cardSurfaceClass} col-span-2 p-5 rounded-3xl flex flex-col gap-2.5`}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-semibold">
                      Level {levelInfo.level} · {levelInfo.title}
                    </div>
                    <div className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      {totalXpAllLanguages} Total XP ({levelInfo.currentLevelXp} /{' '}
                      {levelInfo.nextLevelXp} to Lvl {levelInfo.level + 1})
                    </div>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#4A6FDC] transition-all duration-700"
                      style={{ width: `${levelInfo.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Row: Weekly Quests (Part 15.1) + Pomodoro Focus Timer (Part 15.8) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {db.settings.weeklyQuestsEnabled && (
                <div className={`${cardSurfaceClass} p-5 rounded-3xl flex flex-col gap-3.5`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold">Weekly Quests</h2>
                    <span className="text-xs text-slate-500 tabular-nums">Bonus +150 XP</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {db.weeklyQuest.goals.map((q) => {
                      const pct = Math.min(100, Math.round((q.current / q.target) * 100));
                      return (
                        <div key={q.id} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>{q.title}</span>
                            <span className="font-mono tabular-nums">
                              {q.current} / {q.target}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-[#2ECC71] transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Focus Timer (Part 15.8: Optional Pomodoro 25m focus / 5m break) */}
              <div className={`${cardSurfaceClass} p-5 rounded-3xl flex flex-col justify-between gap-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold">Focus Session Timer</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Pomodoro study timer ({focusModeType === 'focus' ? '25m Focus' : '5m Break'})
                    </p>
                  </div>
                  <div className="text-2xl font-mono font-bold tabular-nums text-[#4A6FDC]">
                    {String(Math.floor(focusSecondsLeft / 60)).padStart(2, '0')}:
                    {String(focusSecondsLeft % 60).padStart(2, '0')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFocusRunning((r) => !r)}
                    className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#4A6FDC] text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    {focusRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{focusRunning ? 'Pause' : 'Start Focus'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFocusRunning(false);
                      setFocusModeType('focus');
                      setFocusSecondsLeft(25 * 60);
                    }}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    Reset 25m
                  </button>
                </div>
              </div>
            </div>

            {/* ADDITION 2: MONTHLY CHALLENGE [3.1] (After Weekly Quests; off by default, enabled in Settings) */}
            {db.settings.monthlyChallengeEnabled && (
              <MonthlyChallengeCard
                db={db}
                cardSurfaceClass={cardSurfaceClass}
                onSwapChallenge={(newId: MonthlyChallengeId) => {
                  setDb((prev) => ({
                    ...prev,
                    monthlyChallenge: swapMonthlyChallengeOnce(prev.monthlyChallenge, newId),
                  }));
                }}
                onClaimReward={() => {
                  playSoundEffect('badge', db.settings.soundSet, db.settings.hapticsEnabled);
                  setDb((prev) => {
                    const langProg = prev.languageProgress[prev.activeLanguage];
                    const nextDb: UserDatabase = {
                      ...prev,
                      streakFreezes: prev.streakFreezes + 1,
                      languageProgress: {
                        ...prev.languageProgress,
                        [prev.activeLanguage]: {
                          ...langProg,
                          xp: langProg.xp + 500,
                        },
                      },
                      monthlyChallenge: {
                        ...prev.monthlyChallenge,
                        completed: true,
                        rewardClaimed: true,
                      },
                    };
                    const newBadges = evaluateNewBadges(nextDb);
                    if (newBadges.length > 0) {
                      const map = { ...nextDb.unlockedBadges };
                      for (const b of newBadges) map[b] = new Date().toISOString();
                      nextDb.unlockedBadges = map;
                    }
                    return nextDb;
                  });
                  setCelebration({
                    type: 'badge_unlock',
                    title: 'Monthly Challenge Complete!',
                    subtitle: 'Earned +500 XP, +1 Streak Freeze, and Monthly Challenger Badge',
                    xpEarned: 500,
                  });
                }}
              />
            )}

            {/* Trending & Living Content Section (Part 7.2 & Part 13.6: shown when online & enabled) */}
            {db.settings.trendingEnabled && isOnline && (
              <div className={`${cardSurfaceClass} p-5 rounded-3xl flex flex-col gap-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold">
                      Living Content & {activeLangMeta.name} Community Pulse
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Live documentation, Dev.to tutorials, Reddit r/{activeLangMeta.subreddit}, and Hacker News
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen('content_feed')}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-[#4A6FDC] whitespace-nowrap shrink-0"
                  >
                    Open Full Feed
                  </button>
                </div>

                {feedLoading && db.cachedFeed.length === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse p-4"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {db.cachedFeed
                      .filter((item) => item.languageId === activeLang || item.languageId === 'all')
                      .slice(0, 3)
                      .map((item) => (
                        <a
                          key={item.id}
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-[#4A6FDC] transition-colors flex flex-col justify-between gap-2"
                        >
                          <div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {item.sourceLabel}
                              {item.upvotes !== undefined ? ` · ${item.upvotes} upvotes` : ''}
                            </div>
                            <h3 className="text-sm font-semibold mt-1 line-clamp-2">{item.title}</h3>
                          </div>
                          <span className="text-xs text-[#4A6FDC] font-medium flex items-center gap-1">
                            <span>Read source</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </a>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            SCREEN 4 & 5: LESSON & EXERCISE SCREEN (Part 7.4 & 7.5)
            Fits in one screen. Progress indicator at top, current content or
            exercise, Back & Next navigation at bottom.
           ==================================================================== */}
        {(screen === 'lesson' || screen === 'exercise') && (
          <div className="max-w-3xl mx-auto flex flex-col gap-5">
            {/* Top Lesson Progress Bar */}
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setScreen('home')}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Exit Lesson</span>
              </button>

              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                  <span>{activeLesson.title}</span>
                  <span>
                    Step {lessonStepIndex + 1} of {activeLesson.exercises.length + 3}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#4A6FDC] transition-all duration-300"
                    style={{
                      width: `${Math.round(
                        ((lessonStepIndex + 1) / (activeLesson.exercises.length + 3)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  toggleBookmark(
                    'lesson',
                    activeLesson.id,
                    activeLesson.title,
                    activeLesson.objective
                  )
                }
                aria-label="Bookmark lesson"
                className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center ${
                  db.bookmarks.some((b) => b.referenceId === activeLesson.id)
                    ? 'border-[#F6B93B] bg-[#F6B93B]/15 text-[#F6B93B]'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>

            {/* Step 0: Introduction + Code Examples */}
            {lessonStepIndex === 0 && (
              <div className={`${cardSurfaceClass} p-6 md:p-7 rounded-3xl flex flex-col gap-5`}>
                <div>
                  <div className="text-xs text-[#4A6FDC] font-semibold">
                    {activeLesson.moduleTitle} · {activeLesson.concepts.join(' · ')}
                  </div>
                  <h2 className="text-2xl font-bold mt-1">{activeLesson.title}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Objective: {activeLesson.objective}
                  </p>
                </div>

                <div className="flex flex-col gap-3 text-sm leading-relaxed">
                  {activeLesson.introduction.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                {activeLesson.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-[#1E293B] text-slate-100"
                  >
                    <div className="px-4 py-2 bg-[#0F172A] text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>{ex.title}</span>
                      <span className="font-mono text-[11px] text-[#2ECC71]">
                        Output: {ex.output.replace(/\n/g, ' ↵ ')}
                      </span>
                    </div>
                    <pre className="p-4 font-mono text-sm overflow-x-auto">{ex.code}</pre>
                    <div className="px-4 py-2.5 bg-[#0F172A]/60 text-xs text-slate-300 border-t border-slate-800">
                      {ex.note}
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setScreen('notes')}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Add Lesson Note</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSoundEffect('tap', db.settings.soundSet, db.settings.hapticsEnabled);
                      setLessonStepIndex(1);
                    }}
                    className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#4A6FDC] text-white font-semibold text-sm flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <span>Interactive Practice</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Interactive Element + Optional Surprise Card (Part 10.4) */}
            {lessonStepIndex === 1 && (
              <div className={`${cardSurfaceClass} p-6 md:p-7 rounded-3xl flex flex-col gap-5`}>
                <div>
                  <span className="text-xs font-semibold text-[#4A6FDC]">
                    Interactive Try-It Sandbox
                  </span>
                  <h3 className="text-lg font-bold mt-1">
                    {activeLesson.interactivePrompt.question}
                  </h3>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-[#1E293B] text-slate-100">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#0F172A] border-b border-slate-800">
                    <span className="font-mono text-xs text-slate-400">
                      {activeLesson.languageId} interactive runner
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const res = runCodeInSandbox(activeLesson.languageId, interactiveCode);
                        setInteractiveOut(
                          res.success ? res.output : res.error || 'Execution error'
                        );
                        playSoundEffect(
                          res.success ? 'correct' : 'incorrect',
                          db.settings.soundSet,
                          db.settings.hapticsEnabled
                        );
                      }}
                      className="min-h-[36px] px-3.5 py-1 rounded-lg bg-[#2ECC71] text-slate-950 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Code</span>
                    </button>
                  </div>
                  <textarea
                    value={interactiveCode}
                    onChange={(e) => setInteractiveCode(e.target.value)}
                    rows={4}
                    spellCheck={false}
                    className="w-full p-4 font-mono text-sm bg-transparent text-slate-100 focus:outline-none"
                  />
                  {interactiveOut !== null && (
                    <div className="px-4 py-3 bg-[#0F172A] border-t border-slate-800 font-mono text-xs text-[#2ECC71]">
                      Output: {interactiveOut}
                    </div>
                  )}
                </div>

                {/* Surprise Card (Part 3 Rule 18 & Part 10.4: Trending / Community / Did you know?) */}
                <div className="p-4 rounded-2xl border border-[#F6B93B]/40 bg-[#F6B93B]/10 flex flex-col gap-1.5">
                  <div className="text-xs font-semibold text-[#D97706] dark:text-[#F6B93B]">
                    Did You Know? · {activeLesson.surprise.title}
                  </div>
                  <p className="text-xs md:text-sm leading-relaxed">
                    {activeLesson.surprise.body}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setLessonStepIndex(0)}
                    className="min-h-[48px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setLessonStepIndex(2)}
                    className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#4A6FDC] text-white font-semibold text-sm flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <span>Start Exercises</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Steps 2 .. 2 + exercises.length - 1: Exercises */}
            {lessonStepIndex >= 2 &&
              lessonStepIndex < 2 + activeLesson.exercises.length && (
                <div className={`${cardSurfaceClass} p-6 md:p-7 rounded-3xl`}>
                  <ExerciseRunner
                    exercise={activeLesson.exercises[lessonStepIndex - 2]}
                    onComplete={handleExerciseEvaluated}
                    onSkip={() => {
                      if (lessonStepIndex + 1 < 2 + activeLesson.exercises.length + 1) {
                        setLessonStepIndex((i) => i + 1);
                      } else {
                        completeActiveLesson();
                      }
                    }}
                    onAskTutor={(codeContext) => {
                      setTutorCodeAttachment(codeContext);
                      setScreen('ai_tutor');
                    }}
                  />
                </div>
              )}

            {/* Final Step: Lesson Recap & Finish */}
            {lessonStepIndex >= 2 + activeLesson.exercises.length && (
              <div
                className={`${cardSurfaceClass} p-6 md:p-8 rounded-3xl text-center flex flex-col items-center gap-5`}
              >
                <div className="w-16 h-16 rounded-2xl bg-[#2ECC71]/15 text-[#2ECC71] flex items-center justify-center">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Lesson Recap</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-lg">
                    {activeLesson.recap}
                  </p>
                </div>
                <div className="text-xs text-slate-500 tabular-nums">
                  Exercise XP: +{lessonEarnedXp} XP · Completion Bonus: +100 XP
                  {lessonMistakesCount === 0 ? ' · Perfection Bonus: +50 XP' : ''}
                </div>
                <button
                  type="button"
                  onClick={completeActiveLesson}
                  className="min-h-[48px] px-8 py-3 rounded-2xl bg-[#2ECC71] text-slate-950 font-bold text-sm active:scale-95 transition-transform"
                >
                  Claim XP & Finish Lesson
                </button>
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            SCREEN 6: SKILL TREE (Part 7.7 & Part 9.2)
            Winding, branching DAG of skill nodes + FSRS Concept Mastery queue.
           ==================================================================== */}
        {screen === 'skill_tree' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {activeLangMeta.name} Skill Tree
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Winding directed acyclic graph of modules. Complete prerequisites to unlock branching paths.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800">
                {PROGRAMMING_LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setDb((prev) => ({ ...prev, activeLanguage: l.id }))}
                    className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold ${
                      activeLang === l.id ? 'bg-[#4A6FDC] text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Winding & Branching DAG Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 flex flex-col gap-4">
                {(SKILL_TREES[activeLang] || []).map((node) => {
                  const completedIds = activeLangProgress.completedLessonIds;
                  const prereqsMet = node.prerequisites.every((preId) => {
                    const preNode = SKILL_TREES[activeLang].find((n) => n.id === preId);
                    return preNode
                      ? preNode.lessonIds.every((lId) => completedIds.includes(lId))
                      : true;
                  });
                  const completedLessonsInNode = node.lessonIds.filter((id) =>
                    completedIds.includes(id)
                  ).length;
                  const isNodeComplete = completedLessonsInNode === node.lessonIds.length;
                  const nodeLessons = langLessons.filter((l) => node.lessonIds.includes(l.id));

                  const offsetClass =
                    node.position.col === 0
                      ? 'md:mr-16'
                      : node.position.col === 2
                      ? 'md:ml-16'
                      : 'md:mx-8';

                  return (
                    <div
                      key={node.id}
                      onClick={() => {
                        setDb((prev) => {
                          const visited = {
                            ...prev.visitedSkillTreeModules,
                            [`${activeLang}:${node.id}`]: true,
                          };
                          const nextDb = { ...prev, visitedSkillTreeModules: visited };
                          const badges = evaluateNewBadges(nextDb, {
                            totalModulesInActiveTree: SKILL_TREES[activeLang].length,
                          });
                          if (badges.length > 0) {
                            const unlocked = { ...nextDb.unlockedBadges };
                            for (const b of badges) unlocked[b] = new Date().toISOString();
                            nextDb.unlockedBadges = unlocked;
                          }
                          return nextDb;
                        });
                      }}
                      className={`${cardSurfaceClass} ${offsetClass} p-5 rounded-3xl transition-all duration-300 ${
                        isNodeComplete
                          ? 'border-[#F6B93B]'
                          : prereqsMet
                          ? 'border-[#4A6FDC]'
                          : 'opacity-65'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-[#4A6FDC]">
                            Module {node.moduleNumber}
                            {node.prerequisites.length > 0
                              ? ` · Requires ${node.prerequisites.join(', ')}`
                              : ' · Entry Node'}
                          </div>
                          <h2 className="text-lg font-bold mt-0.5">{node.name}</h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {node.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-xs font-bold tabular-nums">
                            {completedLessonsInNode}/{node.lessonIds.length}
                          </span>
                          <div className="text-[11px] text-slate-500">
                            {isNodeComplete ? 'Completed' : prereqsMet ? 'Unlocked' : 'Locked'}
                          </div>
                        </div>
                      </div>

                      {/* Lessons inside this skill tree node */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                        {nodeLessons.map((les) => {
                          const done = completedIds.includes(les.id);
                          return (
                            <button
                              key={les.id}
                              type="button"
                              disabled={!prereqsMet}
                              onClick={() => startLesson(les)}
                              className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-left text-xs flex items-center justify-between gap-2 transition-transform active:scale-95 disabled:opacity-40 ${
                                done
                                  ? 'border-[#2ECC71] bg-[#2ECC71]/10 font-semibold'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-[#4A6FDC]'
                              }`}
                            >
                              <span className="truncate">{les.title}</span>
                              {done ? (
                                <Check className="w-4 h-4 text-[#2ECC71] shrink-0" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-[#4A6FDC] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: FSRS Spaced Repetition & Concept Mastery (Part 9.3 & 9.7) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className={`${cardSurfaceClass} p-5 rounded-3xl flex flex-col gap-3`}>
                  <h2 className="text-base font-bold">FSRS Spaced Repetition</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Free Spaced Repetition Scheduler tracks concept stability across 1d, 3d, 7d, 14d, 30d, 90d, and 180d intervals.
                  </p>
                  {(Object.values(db.fsrsCards) as FSRSCardState[]).filter(
                    (c) => c.languageId === activeLang
                  ).length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 text-xs text-slate-500">
                      No concepts introduced yet. Complete your first lesson to schedule spaced repetition reviews.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                      {(Object.values(db.fsrsCards) as FSRSCardState[])
                        .filter((c) => c.languageId === activeLang)
                        .map((card) => {
                          const mastery = getEffectiveConceptMastery(card);
                          return (
                            <div
                              key={card.conceptId}
                              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
                            >
                              <div>
                                <div className="font-semibold">{card.conceptId}</div>
                                <div className="text-[11px] text-slate-500 tabular-nums">
                                  Interval: {card.scheduledDays}d · Difficulty: {card.difficulty}
                                </div>
                              </div>
                              <span
                                className={`font-semibold capitalize ${
                                  mastery === 'mastered'
                                    ? 'text-[#2ECC71]'
                                    : mastery === 'practicing'
                                    ? 'text-[#F6B93B]'
                                    : 'text-[#4A6FDC]'
                                }`}
                              >
                                {mastery}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            SCREEN 10 & 11: DEBUGGING HUNTS & HUNT EDITOR (Part 7.9 & Part 6 Rule 8)
            None marked complete initially. Easy (50 XP), Medium (100 XP), Hard (200 XP).
           ==================================================================== */}
        {screen === 'debugging_hunts' && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Debugging Hunts</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Inspect broken code snippets, identify the bug, fix it in the sandbox, and verify the fix.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEBUGGING_HUNTS.map((hunt) => {
                const record = db.hunts[hunt.id];
                const isSolved = Boolean(record?.completed);
                const xpReward = getHuntXpReward(hunt.difficulty);
                return (
                  <div
                    key={hunt.id}
                    className={`${cardSurfaceClass} p-5 rounded-3xl flex flex-col justify-between gap-4`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {hunt.languageId.toUpperCase()} · {hunt.difficulty.toUpperCase()} · +
                          {xpReward} XP
                        </span>
                        <span>{isSolved ? 'Solved' : 'Available'}</span>
                      </div>
                      <h2 className="text-lg font-bold mt-1">{hunt.title}</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {hunt.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-mono text-slate-500">
                        Category: {hunt.bugCategory}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveHunt(hunt);
                          setHuntCode(hunt.buggyCode);
                          setHuntOutput(null);
                          setHuntError(null);
                          setHuntFeedback(null);
                          setHuntStartMs(Date.now());
                          setHuntHintShown(false);
                          setScreen('debugging_hunt_editor');
                        }}
                        className="min-h-[44px] px-5 py-2 rounded-xl bg-[#4A6FDC] text-white text-xs font-semibold active:scale-95 transition-transform"
                      >
                        {isSolved ? 'Practice Again' : 'Start Hunt'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {screen === 'debugging_hunt_editor' && activeHunt && (
          <div className="max-w-3xl mx-auto flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setScreen('debugging_hunts')}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>All Hunts</span>
              </button>
              <span className="text-xs font-mono text-slate-500">
                {activeHunt.languageId.toUpperCase()} · {activeHunt.difficulty.toUpperCase()} (+
                {getHuntXpReward(activeHunt.difficulty)} XP)
              </span>
            </div>

            <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-4`}>
              <div>
                <h1 className="text-xl font-bold">{activeHunt.title}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {activeHunt.description}
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-[#1E293B] text-slate-100">
                <div className="flex items-center justify-between px-4 py-2 bg-[#0F172A] border-b border-slate-800 text-xs">
                  <span className="font-mono">
                    Expected Output: &quot;{activeHunt.expectedOutput}&quot;
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHuntCode(activeHunt.buggyCode);
                        setHuntFeedback(null);
                      }}
                      className="min-h-[34px] px-2.5 py-1 rounded-lg text-slate-300 hover:bg-slate-800"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = runCodeInSandbox(activeHunt.languageId, huntCode);
                        setHuntOutput(res.output);
                        setHuntError(res.error ?? null);
                      }}
                      className="min-h-[34px] px-3 py-1 rounded-lg bg-slate-700 text-white font-semibold"
                    >
                      Test Run
                    </button>
                  </div>
                </div>
                <textarea
                  value={huntCode}
                  onChange={(e) => setHuntCode(e.target.value)}
                  rows={6}
                  spellCheck={false}
                  className="w-full p-4 font-mono text-sm bg-transparent text-slate-100 focus:outline-none"
                />
                {(huntOutput !== null || huntError !== null) && (
                  <div className="px-4 py-3 bg-[#0F172A] border-t border-slate-800 font-mono text-xs">
                    {huntOutput && <div className="text-[#2ECC71]">Stdout: {huntOutput}</div>}
                    {huntError && <div className="text-[#E74C3C]">{huntError}</div>}
                  </div>
                )}
              </div>

              {huntHintShown && (
                <div className="p-3.5 rounded-xl bg-[#F6B93B]/10 border border-[#F6B93B]/40 text-xs">
                  <strong>Hint:</strong> {activeHunt.hints.join(' ')}
                </div>
              )}

              {huntFeedback && (
                <div
                  className={`p-4 rounded-2xl border text-sm ${
                    huntFeedback.solved
                      ? 'border-[#2ECC71] bg-[#2ECC71]/15'
                      : 'border-[#E74C3C] bg-[#E74C3C]/15'
                  }`}
                >
                  {huntFeedback.text}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setHuntHintShown(true)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Show Hint
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = runCodeInSandbox(activeHunt.languageId, huntCode);
                    setHuntOutput(res.output);
                    setHuntError(res.error ?? null);
                    const isFixed =
                      res.success && res.output.trim() === activeHunt.expectedOutput.trim();
                    if (isFixed) {
                      const xp = getHuntXpReward(activeHunt.difficulty);
                      playSoundEffect(
                        'badge',
                        db.settings.soundSet,
                        db.settings.hapticsEnabled
                      );
                      setHuntFeedback({
                        solved: true,
                        text: `Bug Squashed! +${xp} XP. ${activeHunt.explanation}`,
                      });
                      const elapsed = Math.max(1, Math.round((Date.now() - huntStartMs) / 1000));
                      setDb((prev) => {
                        const langProg = prev.languageProgress[activeHunt.languageId];
                        const nextDb: UserDatabase = {
                          ...prev,
                          languageProgress: {
                            ...prev.languageProgress,
                            [activeHunt.languageId]: {
                              ...langProg,
                              xp: langProg.xp + xp,
                            },
                          },
                          hunts: {
                            ...prev.hunts,
                            [activeHunt.id]: {
                              huntId: activeHunt.id,
                              completed: true,
                              timeTakenSeconds: elapsed,
                              attempts: (prev.hunts[activeHunt.id]?.attempts || 0) + 1,
                              completedAt: new Date().toISOString(),
                            },
                          },
                          weeklyQuest: {
                            ...prev.weeklyQuest,
                            goals: prev.weeklyQuest.goals.map((g) =>
                              g.unit === 'hunts'
                                ? { ...g, current: g.current + 1 }
                                : g.unit === 'xp'
                                ? { ...g, current: g.current + xp }
                                : g
                            ),
                          },
                        };
                        const newBadges = evaluateNewBadges(nextDb);
                        if (newBadges.length > 0) {
                          const bm = { ...nextDb.unlockedBadges };
                          for (const b of newBadges) bm[b] = new Date().toISOString();
                          nextDb.unlockedBadges = bm;
                        }
                        return nextDb;
                      });
                    } else {
                      playSoundEffect(
                        'incorrect',
                        db.settings.soundSet,
                        db.settings.hapticsEnabled
                      );
                      setHuntFeedback({
                        solved: false,
                        text:
                          res.error ||
                          `Expected output "${activeHunt.expectedOutput}", got "${res.output}".`,
                      });
                    }
                  }}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#2ECC71] text-slate-950 font-bold text-sm active:scale-95 transition-transform"
                >
                  Verify Fix
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            SCREEN 8 & 9: PROJECTS & PROJECT EDITOR (Part 16 & Part 6 Rule 7)
            Project list is empty on first launch. Supports Custom & Guided projects.
           ==================================================================== */}
        {screen === 'projects' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Project Mode & Portfolio</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Build real utilities step-by-step with the AI as an advisor, or start a Guided Project.
                </p>
              </div>
            </div>

            {/* Active / Completed User Projects (Starts empty on first launch per Part 6 Rule 7!) */}
            <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-4`}>
              <h2 className="text-lg font-bold">Your Projects ({db.projects.length})</h2>
              {db.projects.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your project portfolio is currently empty. Create a custom project below or select a guided template to begin.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {db.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs text-slate-500">
                          {proj.languageId.toUpperCase()} ·{' '}
                          {proj.isCustom ? 'Custom Project' : 'Guided Project'} ·{' '}
                          {proj.status.toUpperCase()}
                        </div>
                        <h3 className="text-base font-bold mt-1">{proj.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">{proj.description}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveProjectId(proj.id);
                            setProjectStepFeedback(null);
                            setScreen('project_editor');
                          }}
                          className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#4A6FDC] text-white text-xs font-semibold"
                        >
                          {proj.status === 'completed' ? 'Inspect Code' : 'Open Workspace'}
                        </button>
                        {proj.status === 'completed' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setViewingCertificateProject(proj)}
                              className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-[#F6B93B] text-xs font-semibold"
                            >
                              View Certificate
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const blob = new Blob([proj.sourceCode], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${proj.name.toLowerCase().replace(/\s+/g, '_')}.${
                                  proj.languageId === 'python' ? 'py' : 'js'
                                }`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Source</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Custom Project + Guided Project Catalog */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Custom Project Creator (Part 16.2 Step 1: Idea) */}
              <div className={`${cardSurfaceClass} lg:col-span-5 p-6 rounded-3xl flex flex-col gap-4`}>
                <h2 className="text-lg font-bold">New Custom Project</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Define your own project idea. Codelopy structures the 6-phase workflow (Idea, Planning, Setup, Steps, Testing, Completion).
                </p>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project Name (e.g., Markdown Todo CLI)"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                />
                <input
                  type="text"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="One-sentence description..."
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
                />
                <button
                  type="button"
                  disabled={!newProjectName.trim() || !newProjectDesc.trim()}
                  onClick={() => {
                    const id = `proj-${Date.now()}`;
                    const starter =
                      activeLang === 'python'
                        ? `# ${newProjectName}\ndef main():\n    print("Project initialized")\n\nmain()`
                        : `// ${newProjectName}\nconsole.log("Project initialized");`;
                    const created: UserProject = {
                      id,
                      languageId: activeLang,
                      name: newProjectName.trim(),
                      description: newProjectDesc.trim(),
                      isCustom: true,
                      status: 'planning',
                      currentPhaseIndex: 1,
                      planNotes: [
                        'Define core data structure and inputs',
                        'Implement primary transformation function',
                        'Verify output with deterministic assertions',
                      ],
                      steps: [
                        {
                          id: 'custom-step-1',
                          title: 'Core Implementation & Verification',
                          instruction:
                            'Write your implementation in the sandbox editor and run it to verify output.',
                          starterCode: starter,
                          validationKeywords: [],
                          completed: false,
                          userCode: starter,
                        },
                      ],
                      sourceCode: starter,
                      hintsUsed: 0,
                      createdAt: new Date().toISOString(),
                    };
                    setDb((prev) => ({ ...prev, projects: [created, ...prev.projects] }));
                    setNewProjectName('');
                    setNewProjectDesc('');
                    setActiveProjectId(id);
                    setScreen('project_editor');
                  }}
                  className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#4A6FDC] text-white font-semibold text-sm disabled:opacity-40"
                >
                  Create Custom Project
                </button>
              </div>

              {/* Guided Projects Catalog */}
              <div className={`${cardSurfaceClass} lg:col-span-7 p-6 rounded-3xl flex flex-col gap-4`}>
                <h2 className="text-lg font-bold">Guided Project Templates</h2>
                <div className="flex flex-col gap-3">
                  {GUIDED_PROJECT_CATALOG.map((tmpl: GuidedProjectTemplate) => (
                    <div
                      key={tmpl.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="text-xs text-slate-500">
                          {tmpl.languageId.toUpperCase()} · {tmpl.difficulty} · {tmpl.estimatedMinutes}m
                        </div>
                        <h3 className="text-sm font-bold mt-0.5">{tmpl.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{tmpl.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const id = `proj-${Date.now()}`;
                          const created: UserProject = {
                            id,
                            languageId: tmpl.languageId,
                            name: tmpl.name,
                            description: tmpl.description,
                            isCustom: false,
                            status: 'in_progress',
                            currentPhaseIndex: 3,
                            planNotes: tmpl.requirements,
                            steps: tmpl.steps.map((s) => ({
                              ...s,
                              completed: false,
                              userCode: s.starterCode,
                            })),
                            sourceCode: tmpl.steps[0]?.starterCode || '',
                            hintsUsed: 0,
                            createdAt: new Date().toISOString(),
                          };
                          setDb((prev) => ({ ...prev, projects: [created, ...prev.projects] }));
                          setActiveProjectId(id);
                          setScreen('project_editor');
                        }}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#2ECC71] text-slate-950 font-bold text-xs shrink-0"
                      >
                        Start Guided
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 9: PROJECT EDITOR (Part 16.2: 6 Steps - Idea, Planning, Setup, Steps, Testing, Completion) */}
        {screen === 'project_editor' &&
          (() => {
            const proj = db.projects.find((p) => p.id === activeProjectId);
            if (!proj) return null;
            const currentStep = proj.steps.find((s) => !s.completed) || proj.steps[proj.steps.length - 1];
            const phases = ['1. Idea', '2. Planning', '3. Setup', '4. Steps', '5. Testing', '6. Completion'];

            return (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setScreen('projects')}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Projects</span>
                  </button>
                  <div className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto">
                    {phases.map((ph, idx) => (
                      <span
                        key={ph}
                        className={
                          idx <= proj.currentPhaseIndex
                            ? 'font-bold text-[#4A6FDC]'
                            : 'opacity-50'
                        }
                      >
                        {ph}
                        {idx < phases.length - 1 ? ' · ' : ''}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-5`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h1 className="text-xl font-bold">{proj.name}</h1>
                      <p className="text-xs text-slate-500 mt-1">{proj.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTutorCodeAttachment(currentStep.userCode);
                        setScreen('ai_tutor');
                      }}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-[#4A6FDC] text-[#4A6FDC] text-xs font-semibold"
                    >
                      Consult AI Collaborator
                    </button>
                  </div>

                  {/* Step Checklist */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Current Step: {currentStep.title}
                    </span>
                    <p className="text-sm">{currentStep.instruction}</p>
                  </div>

                  {/* Code Editor */}
                  <div className="rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-[#1E293B] text-slate-100">
                    <div className="px-4 py-2 bg-[#0F172A] border-b border-slate-800 text-xs flex items-center justify-between">
                      <span className="font-mono">{proj.languageId} project workspace</span>
                      <button
                        type="button"
                        onClick={() => {
                          const res = runCodeInSandbox(proj.languageId, currentStep.userCode);
                          setProjectStepFeedback(
                            res.success
                              ? `Stdout: ${res.output || '(empty)'}`
                              : `Error: ${res.error}`
                          );
                        }}
                        className="min-h-[34px] px-3 py-1 rounded-lg bg-[#2ECC71] text-slate-950 font-semibold"
                      >
                        Run & Test Step
                      </button>
                    </div>
                    <textarea
                      value={currentStep.userCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDb((prev) => ({
                          ...prev,
                          projects: prev.projects.map((p) =>
                            p.id === proj.id
                              ? {
                                  ...p,
                                  sourceCode: val,
                                  steps: p.steps.map((s) =>
                                    s.id === currentStep.id ? { ...s, userCode: val } : s
                                  ),
                                }
                              : p
                          ),
                        }));
                      }}
                      rows={7}
                      spellCheck={false}
                      className="w-full p-4 font-mono text-sm bg-transparent text-slate-100 focus:outline-none"
                    />
                  </div>

                  {projectStepFeedback && (
                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                      {projectStepFeedback}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const res = runCodeInSandbox(proj.languageId, currentStep.userCode);
                        if (!res.success) {
                          setProjectStepFeedback(`Fix errors before completing: ${res.error}`);
                          return;
                        }
                        if (
                          currentStep.expectedOutput &&
                          res.output.trim() !== currentStep.expectedOutput.trim()
                        ) {
                          setProjectStepFeedback(
                            `Expected output "${currentStep.expectedOutput}", got "${res.output}".`
                          );
                          return;
                        }

                        // Mark step complete; if all steps complete, award 500 XP (+500 perfection bonus if 0 hints)
                        setDb((prev) => {
                          const updatedProjects = prev.projects.map((p) => {
                            if (p.id !== proj.id) return p;
                            const nextSteps = p.steps.map((s) =>
                              s.id === currentStep.id ? { ...s, completed: true } : s
                            );
                            const allDone = nextSteps.every((s) => s.completed);
                            return {
                              ...p,
                              steps: nextSteps,
                              status: allDone ? ('completed' as const) : ('in_progress' as const),
                              currentPhaseIndex: allDone ? 5 : 4,
                              completedAt: allDone ? new Date().toISOString() : undefined,
                            };
                          });

                          const finishedNow =
                            updatedProjects.find((p) => p.id === proj.id)?.status === 'completed' &&
                            proj.status !== 'completed';
                          const projectXp = finishedNow
                            ? 500 + (proj.hintsUsed === 0 ? 500 : 0)
                            : 0;
                          const langProg = prev.languageProgress[proj.languageId];

                          const nextDb: UserDatabase = {
                            ...prev,
                            projects: updatedProjects,
                            languageProgress: {
                              ...prev.languageProgress,
                              [proj.languageId]: {
                                ...langProg,
                                xp: langProg.xp + projectXp,
                              },
                            },
                          };

                          const newBadges = evaluateNewBadges(nextDb);
                          if (newBadges.length > 0) {
                            const bm = { ...nextDb.unlockedBadges };
                            for (const b of newBadges) bm[b] = new Date().toISOString();
                            nextDb.unlockedBadges = bm;
                          }
                          return nextDb;
                        });

                        playSoundEffect(
                          'lesson_complete',
                          db.settings.soundSet,
                          db.settings.hapticsEnabled
                        );
                        setProjectStepFeedback('Step verified and completed!');
                      }}
                      className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#4A6FDC] text-white font-semibold text-sm"
                    >
                      Verify & Complete Step
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* ====================================================================
            SCREEN 12: AI TUTOR (Part 7.10 & Part 12.9–12.13 & Part 17.5)
            Context-aware chat, code attachments, function calling, clear & export.
           ==================================================================== */}
        {screen === 'ai_tutor' && (
          <div className="max-w-4xl mx-auto flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Personal AI Tutor</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Context: {activeLesson.title} ({activeLangMeta.name}) · Model:{' '}
                  {db.aiConfig.modelId || 'Gemini 2.5 Flash (Default Free Tier)'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScreen('ai_setup')}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>AI Setup & Ranking</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = db.aiMessages
                      .map((m) => `[${m.role.toUpperCase()}] ${m.content}`)
                      .join('\n\n');
                    const blob = new Blob([text || 'No messages'], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'codelopy_tutor_conversation.txt';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Export Chat
                </button>
                <button
                  type="button"
                  onClick={() => setDb((prev) => ({ ...prev, aiMessages: [] }))}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#E74C3C]"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* AI Function Calling Quick Triggers (Part 12.13) */}
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { fn: 'explain_code', label: 'Function: Explain Current Code' },
                  { fn: 'generate_hint', label: 'Function: Generate Targeted Hint' },
                  { fn: 'review_code', label: 'Function: Code Review' },
                  { fn: 'suggest_project_step', label: 'Function: Suggest Project Step' },
                ] as const
              ).map((item) => (
                <button
                  key={item.fn}
                  type="button"
                  onClick={async () => {
                    setTutorLoading(true);
                    const userMsg: AIMessage = {
                      id: `msg-${Date.now()}`,
                      role: 'user',
                      content: `Invoke ${item.fn} on ${activeLesson.title}`,
                      functionCallName: item.fn,
                      createdAt: new Date().toISOString(),
                    };
                    const replyText = await generateTutorReply({
                      userPrompt: userMsg.content,
                      languageId: activeLang,
                      activeLesson,
                      codeAttachment: tutorCodeAttachment,
                      functionCallName: item.fn,
                      provider: db.aiConfig.provider,
                      modelId: db.aiConfig.modelId,
                      customBaseUrl: db.aiConfig.customBaseUrl,
                    });
                    const botMsg: AIMessage = {
                      id: `msg-${Date.now() + 1}`,
                      role: 'assistant',
                      content: replyText,
                      functionCallName: item.fn,
                      createdAt: new Date().toISOString(),
                    };
                    setDb((prev) => ({
                      ...prev,
                      aiMessages: [...prev.aiMessages, userMsg, botMsg],
                    }));
                    setTutorLoading(false);
                  }}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium hover:border-[#4A6FDC] transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Chat Messages Scroll Container */}
            <div
              className={`${cardSurfaceClass} p-5 rounded-3xl min-h-[320px] max-h-[440px] overflow-y-auto flex flex-col gap-3`}
            >
              {db.aiMessages.length === 0 ? (
                <div className="my-auto text-center text-sm text-slate-500 p-6">
                  Ask a question about <strong>{activeLesson.title}</strong>, attach a code snippet for diagnosis, or invoke one of the tutor functions above.
                </div>
              ) : (
                db.aiMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl text-sm max-w-2xl whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'ml-auto bg-[#4A6FDC] text-white'
                        : 'mr-auto bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))
              )}
              {tutorLoading && (
                <div className="text-xs text-slate-400 animate-pulse">Tutor is analyzing...</div>
              )}
            </div>

            {/* Code Attachment + Message Input */}
            <div className={`${cardSurfaceClass} p-4 rounded-3xl flex flex-col gap-3`}>
              <textarea
                value={tutorCodeAttachment}
                onChange={(e) => setTutorCodeAttachment(e.target.value)}
                rows={2}
                placeholder="Optional: Paste or attach code snippet here..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-xs"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tutorInput}
                  onChange={(e) => setTutorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tutorInput.trim()) {
                      e.preventDefault();
                      document.getElementById('send-tutor-btn')?.click();
                    }
                  }}
                  placeholder={`Ask about ${activeLesson.title} or "is this still relevant?"...`}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                />
                <button
                  id="send-tutor-btn"
                  type="button"
                  disabled={!tutorInput.trim() || tutorLoading}
                  onClick={async () => {
                    const q = tutorInput.trim();
                    if (!q) return;
                    setTutorInput('');
                    setTutorLoading(true);
                    const uMsg: AIMessage = {
                      id: `msg-${Date.now()}`,
                      role: 'user',
                      content: q,
                      codeAttachment: tutorCodeAttachment || undefined,
                      createdAt: new Date().toISOString(),
                    };
                    const reply = await generateTutorReply({
                      userPrompt: q,
                      languageId: activeLang,
                      activeLesson,
                      codeAttachment: tutorCodeAttachment || undefined,
                      provider: db.aiConfig.provider,
                      modelId: db.aiConfig.modelId,
                      customBaseUrl: db.aiConfig.customBaseUrl,
                    });
                    const aMsg: AIMessage = {
                      id: `msg-${Date.now() + 1}`,
                      role: 'assistant',
                      content: reply,
                      createdAt: new Date().toISOString(),
                    };
                    setDb((prev) => ({
                      ...prev,
                      aiMessages: [...prev.aiMessages, uMsg, aMsg],
                    }));
                    setTutorLoading(false);
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#4A6FDC] text-white font-semibold text-sm disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            SCREEN 17: AI SETUP (Part 12: Provider Detection, Model Enumeration,
            Free-Unless-Proven-Otherwise, Composite Score Ranking)
           ==================================================================== */}
        {screen === 'ai_setup' &&
          (() => {
            const activeProv = db.aiConfig.provider || 'gemini';
            const rankedModels = enumerateAndRankModels(activeProv, db.aiConfig.weights);
            const detectionResult = aiSignatureProbe
              ? detectProviderFromSignature(aiSignatureProbe)
              : null;

            return (
              <div className="max-w-4xl mx-auto flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                      AI Provider Detection & Efficiency Ranking
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Codelopy detects providers by format signature, assumes models are free unless proven otherwise, and ranks them by a 5-factor composite efficiency score.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen('ai_tutor')}
                    className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#4A6FDC] text-white text-xs font-semibold"
                  >
                    Back to Tutor
                  </button>
                </div>

                {/* Step 1: Format Analysis & Provider Selection */}
                <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-4`}>
                  <h2 className="text-base font-bold">1. Provider Format Analysis & Endpoint Verification</h2>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={aiSignatureProbe}
                      onChange={(e) => setAiSignatureProbe(e.target.value)}
                      placeholder="Test prefix or localhost URL (e.g. AIza..., gsk_..., sk-or-..., http://localhost:11434)"
                      className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-xs"
                    />
                    {detectionResult && (
                      <button
                        type="button"
                        onClick={() => {
                          const models = enumerateAndRankModels(
                            detectionResult.provider,
                            db.aiConfig.weights
                          );
                          setDb((prev) => ({
                            ...prev,
                            aiConfig: {
                              ...prev.aiConfig,
                              provider: detectionResult.provider,
                              modelId: models[0]?.id || '',
                              detectedAt: new Date().toISOString(),
                            },
                          }));
                        }}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#2ECC71] text-slate-950 font-bold text-xs"
                      >
                        Confirm {detectionResult.provider.toUpperCase()} ({detectionResult.reason})
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {SUPPORTED_AI_PROVIDERS.map((p) => {
                      const isSelected = activeProv === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            const models = enumerateAndRankModels(p.id, db.aiConfig.weights);
                            setDb((prev) => ({
                              ...prev,
                              aiConfig: {
                                ...prev.aiConfig,
                                provider: p.id,
                                modelId: models[0]?.id || '',
                                detectedAt: new Date().toISOString(),
                              },
                            }));
                          }}
                          className={`min-h-[44px] p-2.5 rounded-xl border text-left text-xs transition-colors ${
                            isSelected
                              ? 'border-[#4A6FDC] bg-[#4A6FDC]/10 font-semibold text-[#4A6FDC]'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {p.category.toUpperCase()}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Configurable Composite Score Weights (Part 12.6) */}
                <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-4`}>
                  <h2 className="text-base font-bold">
                    2. Composite Efficiency Score Weights (Default: Speed 25%, Quality 30%, Context 15%, Cost 20%, Availability 10%)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    {(
                      [
                        { key: 'speed', label: 'Speed' },
                        { key: 'quality', label: 'Quality' },
                        { key: 'context', label: 'Context' },
                        { key: 'cost', label: 'Cost (Free)' },
                        { key: 'availability', label: 'Availability' },
                      ] as const
                    ).map((dim) => (
                      <div key={dim.key} className="flex flex-col gap-1">
                        <label className="text-xs font-medium flex justify-between">
                          <span>{dim.label}</span>
                          <span className="font-mono tabular-nums">
                            {Math.round(db.aiConfig.weights[dim.key] * 100)}%
                          </span>
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={Math.round(db.aiConfig.weights[dim.key] * 100)}
                          onChange={(e) => {
                            const val = Number(e.target.value) / 100;
                            setDb((prev) => ({
                              ...prev,
                              aiConfig: {
                                ...prev.aiConfig,
                                weights: {
                                  ...prev.aiConfig.weights,
                                  [dim.key]: val,
                                },
                              },
                            }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3: Ranked Models + Manual Override (Part 12.7) */}
                <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-4`}>
                  <h2 className="text-base font-bold">
                    3. Ranked Models (Free Unless Proven Otherwise)
                  </h2>
                  <div className="flex flex-col gap-2.5">
                    {rankedModels.slice(0, 6).map((m, idx) => {
                      const chosen = db.aiConfig.modelId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            setDb((prev) => ({
                              ...prev,
                              aiConfig: {
                                ...prev.aiConfig,
                                provider: m.provider,
                                modelId: m.id,
                              },
                            }))
                          }
                          className={`p-4 rounded-2xl border text-left flex flex-wrap items-center justify-between gap-3 ${
                            chosen
                              ? 'border-[#2ECC71] bg-[#2ECC71]/10'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="font-bold text-[#4A6FDC]">#{idx + 1}</span>
                              <span>·</span>
                              <span>{m.provider.toUpperCase()}</span>
                              <span>·</span>
                              <span className="tabular-nums">
                                {(m.contextWindow / 1000).toFixed(0)}k context
                              </span>
                              <span>·</span>
                              <span className={m.isFree ? 'text-[#2ECC71] font-semibold' : 'text-[#F6B93B]'}>
                                {m.isFree ? 'Free / Assumed Free' : 'Paid Evidence Found'}
                              </span>
                            </div>
                            <div className="font-bold text-sm mt-0.5">{m.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{m.freeEvidence}</div>
                          </div>
                          <div className="text-right font-mono">
                            <div className="text-lg font-bold tabular-nums">{m.compositeScore}</div>
                            <div className="text-[11px] text-slate-400">Composite Score</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual Model Override */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={manualModelInput}
                      onChange={(e) => setManualModelInput(e.target.value)}
                      placeholder="Or manually enter any model ID (e.g. llama3.2:latest)..."
                      className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-xs"
                    />
                    <button
                      type="button"
                      disabled={!manualModelInput.trim()}
                      onClick={() => {
                        setDb((prev) => ({
                          ...prev,
                          aiConfig: {
                            ...prev.aiConfig,
                            modelId: manualModelInput.trim(),
                          },
                        }));
                        setManualModelInput('');
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#4A6FDC] text-white text-xs font-semibold disabled:opacity-40"
                    >
                      Use Custom Model
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* ====================================================================
            SCREEN 13: CONTENT FEED (Part 13: Docs, Dev.to, Reddit Research, HN)
           ==================================================================== */}
        {screen === 'content_feed' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Living Content Pipeline</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Real-time documentation, Dev.to articles, Hacker News, and Reddit community research.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs flex items-center gap-1 text-slate-500">
                  {isOnline ? (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-[#2ECC71]" /> Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-[#F6B93B]" /> Offline Cache
                    </>
                  )}
                </span>
                <button
                  type="button"
                  disabled={!isOnline || feedLoading}
                  onClick={async () => {
                    setFeedLoading(true);
                    const fresh = await fetchLivingContentPipeline(
                      activeLang,
                      redditQuery.trim() || undefined
                    );
                    setDb((prev) => ({
                      ...prev,
                      cachedFeed: mergeIntoBoundedCache(prev.cachedFeed, fresh),
                    }));
                    setFeedLoading(false);
                  }}
                  className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#4A6FDC] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${feedLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Pipeline</span>
                </button>
              </div>
            </div>

            {/* Reddit Topic Research Search Bar (Part 13.3) */}
            <div className={`${cardSurfaceClass} p-4 rounded-2xl flex items-center gap-2`}>
              <input
                type="text"
                value={redditQuery}
                onChange={(e) => setRedditQuery(e.target.value)}
                placeholder={`Search r/${activeLangMeta.subreddit} & community articles (e.g. "decorators", "async", "ownership")...`}
                className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
              <button
                type="button"
                disabled={!isOnline || feedLoading}
                onClick={async () => {
                  setFeedLoading(true);
                  const fresh = await fetchLivingContentPipeline(
                    activeLang,
                    redditQuery.trim() || activeLesson.concepts[0]
                  );
                  setDb((prev) => ({
                    ...prev,
                    cachedFeed: mergeIntoBoundedCache(prev.cachedFeed, fresh),
                  }));
                  setFeedLoading(false);
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#4A6FDC] text-white text-xs font-semibold"
              >
                Research Topic
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {db.cachedFeed.map((item) => (
                <div
                  key={item.id}
                  className={`${cardSurfaceClass} p-5 rounded-3xl flex flex-col justify-between gap-3`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {item.sourceLabel}
                        {item.upvotes !== undefined ? ` · ${item.upvotes} upvotes` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          toggleBookmark('article', item.id, item.title, item.sourceUrl)
                        }
                        className="text-xs hover:text-[#4A6FDC]"
                      >
                        {db.bookmarks.some((b) => b.referenceId === item.id)
                          ? 'Bookmarked'
                          : 'Bookmark'}
                      </button>
                    </div>
                    <h2 className="text-base font-bold mt-1">{item.title}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#4A6FDC] flex items-center gap-1"
                  >
                    <span>Open Original Thread / Article</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================================
            SCREEN 14 & 15: BOOKMARKS & NOTES (Part 17.2 & Part 19.1)
           ==================================================================== */}
        {screen === 'bookmarks' && (
          <div className="max-w-3xl mx-auto flex flex-col gap-5">
            <h1 className="text-2xl font-bold tracking-tight">
              Saved Bookmarks ({db.bookmarks.length})
            </h1>
            {db.bookmarks.length === 0 ? (
              <div className={`${cardSurfaceClass} p-6 rounded-3xl text-sm text-slate-500`}>
                No bookmarks saved yet. Tap the bookmark icon inside any lesson or article to save it here.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {db.bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className={`${cardSurfaceClass} p-4 rounded-2xl flex items-center justify-between gap-4`}
                  >
                    <div>
                      <div className="text-xs text-slate-500">
                        {bm.type.toUpperCase()} · {bm.languageId.toUpperCase()}
                      </div>
                      <div className="font-bold text-sm">{bm.title}</div>
                      <div className="text-xs text-slate-500">{bm.subtitle}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(bm.type, bm.referenceId, bm.title, bm.subtitle)}
                      aria-label="Remove bookmark"
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#E74C3C]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {screen === 'notes' && (
          <div className="max-w-3xl mx-auto flex flex-col gap-5">
            <h1 className="text-2xl font-bold tracking-tight">Personal Study Notes ({db.notes.length})</h1>
            <div className={`${cardSurfaceClass} p-5 rounded-3xl flex flex-col gap-3`}>
              <h2 className="text-sm font-bold">Write a Note ({activeLesson.title})</h2>
              <input
                type="text"
                value={noteTitleInput}
                onChange={(e) => setNoteTitleInput(e.target.value)}
                placeholder="Note title..."
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
              <textarea
                value={noteBodyInput}
                onChange={(e) => setNoteBodyInput(e.target.value)}
                rows={3}
                placeholder="Write your code takeaway or summary..."
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!noteTitleInput.trim() || !noteBodyInput.trim()}
                  onClick={() => {
                    const nowIso = new Date().toISOString();
                    setDb((prev) => {
                      const nextNotes = [
                        {
                          id: `note-${Date.now()}`,
                          type: 'lesson' as const,
                          referenceId: activeLesson.id,
                          languageId: activeLang,
                          title: noteTitleInput.trim(),
                          content: noteBodyInput.trim(),
                          createdAt: nowIso,
                          updatedAt: nowIso,
                        },
                        ...prev.notes,
                      ];
                      const nextDb = { ...prev, notes: nextNotes };
                      const newBadges = evaluateNewBadges(nextDb);
                      if (newBadges.length > 0) {
                        const bm = { ...nextDb.unlockedBadges };
                        for (const b of newBadges) bm[b] = nowIso;
                        nextDb.unlockedBadges = bm;
                      }
                      return nextDb;
                    });
                    setNoteTitleInput('');
                    setNoteBodyInput('');
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#4A6FDC] text-white text-xs font-semibold disabled:opacity-40"
                >
                  Save Note
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {db.notes.map((n) => (
                <div key={n.id} className={`${cardSurfaceClass} p-4 rounded-2xl flex flex-col gap-1`}>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {n.languageId.toUpperCase()} · {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDb((prev) => ({
                          ...prev,
                          notes: prev.notes.filter((x) => x.id !== n.id),
                        }))
                      }
                      className="text-[#E74C3C]"
                    >
                      Delete
                    </button>
                  </div>
                  <h3 className="font-bold text-sm">{n.title}</h3>
                  <p className="text-xs whitespace-pre-wrap text-slate-600 dark:text-slate-300 mt-1">
                    {n.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================================
            SCREEN 7: PROFILE (Part 9.8, 9.9, 15.1, 15.7, 22.7)
            Learning Velocity, Predicted Completion, 365-Day Heat Map, 16 Badges,
            Manual JSON Export/Import.
           ==================================================================== */}
        {screen === 'profile' &&
          (() => {
            const velocity = computeLearningVelocity(db, langLessons.length);
            // Generate last 84 days for compact GitHub-style activity heat map
            const heatDays: Array<{ date: string; exercises: number }> = [];
            for (let d = 83; d >= 0; d--) {
              const dt = new Date(Date.now() - d * 86400 * 1000).toISOString().slice(0, 10);
              heatDays.push({
                date: dt,
                exercises: db.activityByDate[dt]?.exercises || 0,
              });
            }

            return (
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Learner Profile & Analytics</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Level {levelInfo.level} {levelInfo.title} · {totalXpAllLanguages} Total XP ·{' '}
                    {db.streak}-Day Streak
                  </p>
                </div>

                {/* Learning Velocity & Predicted Completion (Part 9.8 & 9.9) */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className={`${cardSurfaceClass} p-4 rounded-2xl`}>
                    <div className="text-xs text-slate-500">Concepts / Week</div>
                    <div className="text-2xl font-bold tabular-nums mt-1">
                      {velocity.conceptsPerWeek}
                    </div>
                  </div>
                  <div className={`${cardSurfaceClass} p-4 rounded-2xl`}>
                    <div className="text-xs text-slate-500">Exercises / Week</div>
                    <div className="text-2xl font-bold tabular-nums mt-1">
                      {velocity.exercisesPerWeek}
                    </div>
                  </div>
                  <div className={`${cardSurfaceClass} p-4 rounded-2xl`}>
                    <div className="text-xs text-slate-500">Avg Accuracy</div>
                    <div className="text-2xl font-bold tabular-nums mt-1">
                      {velocity.averageAccuracyPercent}%
                    </div>
                  </div>
                  <div className={`${cardSurfaceClass} p-4 rounded-2xl`}>
                    <div className="text-xs text-slate-500">Avg Time / Lesson</div>
                    <div className="text-2xl font-bold tabular-nums mt-1">
                      {velocity.averageMinutesPerLesson}m
                    </div>
                  </div>
                  <div className={`${cardSurfaceClass} col-span-2 md:col-span-1 p-4 rounded-2xl`}>
                    <div className="text-xs text-slate-500">Predicted Completion</div>
                    <div className="text-sm font-bold mt-1">{velocity.predictedCompletionText}</div>
                  </div>
                </div>

                {/* Activity Heat Map (Part 15.7) */}
                <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-3`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold">Activity Heat Map</h2>
                    <span className="text-xs text-slate-500">Daily exercises completed</span>
                  </div>
                  <div className="grid grid-cols-12 sm:grid-cols-28 gap-1.5">
                    {heatDays.map((hd) => {
                      const intensity =
                        hd.exercises === 0
                          ? 'bg-slate-200 dark:bg-slate-800'
                          : hd.exercises < 3
                          ? 'bg-[#2ECC71]/40'
                          : hd.exercises < 6
                          ? 'bg-[#2ECC71]/70'
                          : 'bg-[#2ECC71]';
                      return (
                        <div
                          key={hd.date}
                          title={`${hd.date}: ${hd.exercises} exercises`}
                          className={`h-4 rounded-xs ${intensity}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* 16 Milestone Badges Grid (Part 15.1) */}
                <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-4`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold">
                      Milestone Badges ({Object.keys(db.unlockedBadges).length} /{' '}
                      {BADGE_CATALOG.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {BADGE_CATALOG.map((badge) => {
                      const unlockedAt = db.unlockedBadges[badge.id];
                      return (
                        <div
                          key={badge.id}
                          className={`p-4 rounded-2xl border flex flex-col gap-1.5 ${
                            unlockedAt
                              ? 'border-[#F6B93B] bg-[#F6B93B]/10'
                              : 'border-slate-200 dark:border-slate-800 opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Award
                              className="w-5 h-5"
                              style={{ color: unlockedAt ? badge.color : '#94a3b8' }}
                            />
                            <span className="text-[10px] font-mono text-slate-500">
                              {unlockedAt ? 'Unlocked' : 'Locked'}
                            </span>
                          </div>
                          <div className="font-bold text-xs">{badge.name}</div>
                          <div className="text-[11px] text-slate-500">{badge.description}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Local Data Control: Export & Import JSON (Part 8.5 & 22.7) */}
                <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-4`}>
                  <h2 className="text-base font-bold">Local Data Portability (No Cloud Sync)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    All your progress lives strictly on your device. Export a JSON snapshot to back up or transfer devices manually.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const json = exportUserDatabaseToJson(db);
                        const blob = new Blob([json], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `codelopy_progress_${new Date().toISOString().slice(0, 10)}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#4A6FDC] text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Progress JSON</span>
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <input
                      type="text"
                      value={importJsonText}
                      onChange={(e) => setImportJsonText(e.target.value)}
                      placeholder="Paste exported JSON backup string here to restore..."
                      className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-xs"
                    />
                    <button
                      type="button"
                      disabled={!importJsonText.trim()}
                      onClick={() => {
                        try {
                          const parsed = JSON.parse(importJsonText) as UserDatabase;
                          if (parsed && typeof parsed === 'object' && parsed.languageProgress) {
                            setDb(parsed);
                            setImportJsonText('');
                            setImportStatusMsg('Progress restored successfully.');
                          }
                        } catch {
                          setImportStatusMsg('Invalid JSON backup format.');
                        }
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Import JSON</span>
                    </button>
                  </div>
                  {importStatusMsg && (
                    <div className="text-xs text-[#2ECC71] font-medium">{importStatusMsg}</div>
                  )}
                </div>
              </div>
            );
          })()}

        {/* ====================================================================
            SCREEN 16: SETTINGS (Part 17.6, 17.7, 17.8, 20, 21)
            Every setting is documented in one place. No hidden settings.
           ==================================================================== */}
        {screen === 'settings' && (
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CodelopyLogo size={36} />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                  <p className="text-xs text-slate-500">
                    Themes, Sound Sets, Accessibility, Localization, AI Tutor, and Local Storage
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScreen('about')}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <Info className="w-3.5 h-3.5" />
                <span>About Codelopy</span>
              </button>
            </div>

            {/* Theme & Visual Style (Part 17.6: Light, Dark, Terminal, Neon) */}
            <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-4`}>
              <h2 className="text-base font-bold">Theme & Visual Mode</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['light', 'dark', 'terminal', 'neon'] as ThemeMode[]).map((thm) => (
                  <button
                    key={thm}
                    type="button"
                    onClick={() =>
                      setDb((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, theme: thm },
                      }))
                    }
                    className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-semibold capitalize ${
                      db.settings.theme === thm
                        ? 'border-[#4A6FDC] bg-[#4A6FDC]/15 text-[#4A6FDC]'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {thm}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Set & Haptics (Part 15.3 & 17.8: Minimal, Classic, Playful, Silent) */}
            <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-4`}>
              <h2 className="text-base font-bold">Sound Design & Haptics</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['minimal', 'classic', 'playful', 'silent'] as SoundSet[]).map((snd) => (
                  <button
                    key={snd}
                    type="button"
                    onClick={() => {
                      playSoundEffect('correct', snd, db.settings.hapticsEnabled);
                      setDb((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, soundSet: snd },
                      }));
                    }}
                    className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-semibold capitalize ${
                      db.settings.soundSet === snd
                        ? 'border-[#4A6FDC] bg-[#4A6FDC]/15 text-[#4A6FDC]'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {snd}
                  </button>
                ))}
              </div>

              <label className="flex items-center justify-between text-sm pt-2 cursor-pointer">
                <span>Haptic Feedback on Interactions</span>
                <input
                  type="checkbox"
                  checked={db.settings.hapticsEnabled}
                  onChange={(e) =>
                    setDb((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, hapticsEnabled: e.target.checked },
                    }))
                  }
                  className="w-5 h-5 accent-[#4A6FDC]"
                />
              </label>
            </div>

            {/* Accessibility Suite (Part 20) */}
            <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-4`}>
              <h2 className="text-base font-bold">Accessibility</h2>
              {(
                [
                  { key: 'highContrast', label: 'High Contrast Mode' },
                  { key: 'largeText', label: 'Large Text Mode (112.5% Scale)' },
                  { key: 'dyslexicFont', label: 'Dyslexia-Friendly Font Spacing' },
                  { key: 'reducedMotion', label: 'Reduced Motion (Instant Transitions)' },
                ] as const
              ).map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between text-sm cursor-pointer"
                >
                  <span>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={db.settings[item.key]}
                    onChange={(e) =>
                      setDb((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, [item.key]: e.target.checked },
                      }))
                    }
                    className="w-5 h-5 accent-[#4A6FDC]"
                  />
                </label>
              ))}

              <div className="flex items-center justify-between text-sm pt-2">
                <span>Colorblind Palette Mode</span>
                <select
                  value={db.settings.colorblindMode}
                  onChange={(e) =>
                    setDb((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        colorblindMode: e.target.value as ColorblindMode,
                      },
                    }))
                  }
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                >
                  <option value="none">Standard Palette</option>
                  <option value="deuteranopia">Deuteranopia Safe</option>
                  <option value="protanopia">Protanopia Safe</option>
                  <option value="tritanopia">Tritanopia Safe</option>
                </select>
              </div>
            </div>

            {/* Daily Habit, Localization & Content Pipeline Controls */}
            <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-4`}>
              <h2 className="text-base font-bold">Habit, Language & Optional Features</h2>
              <div className="flex items-center justify-between text-sm">
                <span>Interface Language</span>
                <select
                  value={db.naturalLanguage}
                  onChange={(e) =>
                    setDb((prev) => ({
                      ...prev,
                      naturalLanguage: e.target.value as NaturalLanguageCode,
                    }))
                  }
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                >
                  {SUPPORTED_UI_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.nativeName} ({l.englishName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>Daily Goal Target</span>
                <select
                  value={db.dailyGoalMinutes}
                  onChange={(e) =>
                    setDb((prev) => ({
                      ...prev,
                      dailyGoalMinutes: Number(e.target.value) as DailyGoalMinutes,
                    }))
                  }
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                >
                  <option value={5}>Casual (5m / day)</option>
                  <option value={10}>Regular (10m / day)</option>
                  <option value={20}>Serious (20m / day)</option>
                  <option value={30}>Intense (30m / day)</option>
                </select>
              </div>

              <label className="flex items-center justify-between text-sm cursor-pointer">
                <div>
                  <div className="font-medium">Enable Monthly Challenge</div>
                  <div className="text-xs text-slate-500">
                    Optional calendar-month goal (Off by default; allows 1 swap per month).
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={db.settings.monthlyChallengeEnabled}
                  onChange={(e) =>
                    setDb((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, monthlyChallengeEnabled: e.target.checked },
                    }))
                  }
                  className="w-5 h-5 accent-[#4A6FDC]"
                />
              </label>

              <label className="flex items-center justify-between text-sm cursor-pointer">
                <div>
                  <div className="font-medium">Enable Interview Mode Track in Practice Hub</div>
                  <div className="text-xs text-slate-500">
                    10 technical &amp; behavioral drill types (+75 XP/drill) + optional AI Interviewer.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={db.settings.interviewModeEnabled}
                  onChange={(e) =>
                    setDb((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, interviewModeEnabled: e.target.checked },
                    }))
                  }
                  className="w-5 h-5 accent-[#4A6FDC]"
                />
              </label>

              <label className="flex items-center justify-between text-sm cursor-pointer">
                <span>Show Living Content &amp; Trending Feed on Home</span>
                <input
                  type="checkbox"
                  checked={db.settings.trendingEnabled}
                  onChange={(e) =>
                    setDb((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, trendingEnabled: e.target.checked },
                    }))
                  }
                  className="w-5 h-5 accent-[#4A6FDC]"
                />
              </label>

              <label className="flex items-center justify-between text-sm cursor-pointer">
                <span>Persistent Local AI Tutor Conversation Memory</span>
                <input
                  type="checkbox"
                  checked={db.aiConfig.persistentMemory}
                  onChange={(e) =>
                    setDb((prev) => ({
                      ...prev,
                      aiConfig: { ...prev.aiConfig, persistentMemory: e.target.checked },
                    }))
                  }
                  className="w-5 h-5 accent-[#4A6FDC]"
                />
              </label>
            </div>

            {/* Danger Zone: Delete All Local Data (Part 22.7) */}
            <div className={`${cardSurfaceClass} p-6 rounded-3xl flex items-center justify-between gap-4`}>
              <div>
                <h2 className="text-base font-bold text-[#E74C3C]">Delete All Local Data</h2>
                <p className="text-xs text-slate-500">
                  Wipes all local progress, notes, projects, and settings and returns to first-install Onboarding.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const fresh = resetUserDatabase();
                  setDb(fresh);
                  setOnboardingStep(1);
                  setObNaturalLang(null);
                  setObLanguages([]);
                  setObExperience(null);
                  setObGoal(null);
                  setObDailyGoal(null);
                  setScreen('onboarding');
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#E74C3C] text-white text-xs font-semibold shrink-0"
              >
                Wipe Data
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
            SCREEN 18: ABOUT (Part 17.2 & Part 22 & Part 25)
           ==================================================================== */}
        {screen === 'about' && (
          <div className="max-w-2xl mx-auto flex flex-col gap-5">
            <div className={`${cardSurfaceClass} p-7 rounded-3xl flex flex-col gap-4`}>
              <div className="flex items-center gap-3">
                <CodelopyLogo size={48} />
                <div>
                  <h1 className="text-2xl font-bold">Codelopy v2.0</h1>
                  <p className="text-xs text-slate-500">
                    Daily Coding Habit · Local-First · Zero Telemetry · Bring Your Own AI
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">
                Codelopy is built around a simple premise: learning to code is a daily habit, not a marathon course. Open it for five to ten minutes a day, write real code in a deterministic sandbox, review concepts with FSRS spaced repetition, and consult your own AI tutor when you want deeper context.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-200 dark:border-slate-800 pt-4">
                <div>
                  <div className="font-bold">Privacy Guarantee</div>
                  <p className="text-slate-500 mt-0.5">
                    Zero accounts, zero cloud sync, zero analytics, and zero tracking.
                  </p>
                </div>
                <div>
                  <div className="font-bold">Open Distribution</div>
                  <p className="text-slate-500 mt-0.5">
                    Designed for GitHub Releases and F-Droid with full local data export.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setScreen('settings')}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#4A6FDC] text-white text-xs font-semibold"
                >
                  Back to Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            PRACTICE HUB, INTERVIEW MODE, GYMS & MISTAKE JOURNAL
           ==================================================================== */}
        {(screen === 'practice_hub' ||
          screen === 'interview_mode' ||
          screen === 'mistake_journal' ||
          screen === 'algo_gym') && (
          <PracticeHubView
            db={db}
            cardSurfaceClass={cardSurfaceClass}
            onNavigate={(nextScreen) => setScreen(nextScreen)}
            onCompleteInterviewDrill={(drillId, xpReward) => {
              playSoundEffect('correct', db.settings.soundSet, db.settings.hapticsEnabled);
              setDb((prev) => {
                const alreadyDone = (prev.completedInterviewDrillIds || []).includes(drillId);
                const nextDrills = alreadyDone
                  ? prev.completedInterviewDrillIds
                  : [...(prev.completedInterviewDrillIds || []), drillId];
                const langProg = prev.languageProgress[prev.activeLanguage];
                const nextDb: UserDatabase = {
                  ...prev,
                  completedInterviewDrillIds: nextDrills,
                  languageProgress: {
                    ...prev.languageProgress,
                    [prev.activeLanguage]: {
                      ...langProg,
                      xp: langProg.xp + (alreadyDone ? 15 : xpReward),
                    },
                  },
                };
                const newBadges = evaluateNewBadges(nextDb);
                if (newBadges.length > 0) {
                  const map = { ...nextDb.unlockedBadges };
                  for (const b of newBadges) map[b] = new Date().toISOString();
                  nextDb.unlockedBadges = map;
                }
                return nextDb;
              });
            }}
            onSaveInterviewTranscript={(transcript: AIInterviewTranscript) => {
              setDb((prev) => ({
                ...prev,
                interviewTranscripts: [transcript, ...(prev.interviewTranscripts || [])],
              }));
            }}
            onCompleteGymItem={(gymId, xpReward) => {
              playSoundEffect('correct', db.settings.soundSet, db.settings.hapticsEnabled);
              setDb((prev) => {
                const already = (prev.completedGymIds || []).includes(gymId);
                const nextGyms = already
                  ? prev.completedGymIds
                  : [...(prev.completedGymIds || []), gymId];
                const langProg = prev.languageProgress[prev.activeLanguage];
                return {
                  ...prev,
                  completedGymIds: nextGyms,
                  languageProgress: {
                    ...prev.languageProgress,
                    [prev.activeLanguage]: {
                      ...langProg,
                      xp: langProg.xp + (already ? 10 : xpReward),
                    },
                  },
                };
              });
            }}
            onClearMistakeEntry={(entryId, reflectionNote) => {
              playSoundEffect('correct', db.settings.soundSet, db.settings.hapticsEnabled);
              setDb((prev) => {
                const langProg = prev.languageProgress[prev.activeLanguage];
                return {
                  ...prev,
                  languageProgress: {
                    ...prev.languageProgress,
                    [prev.activeLanguage]: {
                      ...langProg,
                      xp: langProg.xp + 25,
                    },
                  },
                  mistakeJournal: (prev.mistakeJournal || []).map((m) =>
                    m.id === entryId
                      ? {
                          ...m,
                          reflectionNote,
                          cleared: true,
                          clearedAt: new Date().toISOString(),
                        }
                      : m
                  ),
                };
              });
            }}
            onUpdateMistakeNote={(entryId, reflectionNote) => {
              setDb((prev) => ({
                ...prev,
                mistakeJournal: (prev.mistakeJournal || []).map((m) =>
                  m.id === entryId ? { ...m, reflectionNote } : m
                ),
              }));
            }}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation Bar with 4 Tabs (Part 17.3: Home, Learn, Projects, Profile) */}
      <nav
        aria-label="Primary bottom navigation"
        className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 items-center px-2"
      >
        {(
          [
            { id: 'home', label: t(db.naturalLanguage, 'home'), icon: Compass },
            { id: 'skill_tree', label: t(db.naturalLanguage, 'learn'), icon: GitBranch },
            { id: 'projects', label: t(db.naturalLanguage, 'projects'), icon: FolderGit2 },
            { id: 'profile', label: t(db.naturalLanguage, 'profile'), icon: Trophy },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active =
            screen === tab.id ||
            (tab.id === 'projects' && screen === 'project_editor') ||
            (tab.id === 'skill_tree' && (screen === 'lesson' || screen === 'exercise'));
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playSoundEffect('tap', db.settings.soundSet, db.settings.hapticsEnabled);
                setScreen(tab.id);
              }}
              className={`min-h-[48px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
                active ? 'text-[#4A6FDC] font-semibold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
