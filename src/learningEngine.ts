import {
  BadgeDefinition,
  BadgeId,
  ConceptMasteryLevel,
  FSRSCardState,
  ProgrammingLanguageId,
  UserDatabase,
} from './types';

export const FSRS_INTERVALS = [1, 3, 7, 14, 30, 90, 180];

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your very first coding lesson.',
    requirementText: 'Complete 1 lesson',
    color: '#4A6FDC',
  },
  {
    id: 'loop_master',
    name: 'Loop Master',
    description: 'Complete 100 coding exercises across any language.',
    requirementText: '100 exercises completed',
    color: '#2ECC71',
  },
  {
    id: 'debugger',
    name: 'Debugger',
    description: 'Track down and fix 10 broken code snippets.',
    requirementText: 'Complete 10 debugging hunts',
    color: '#E74C3C',
  },
  {
    id: 'project_builder',
    name: 'Project Builder',
    description: 'Plan, build, and verify 3 complete projects.',
    requirementText: 'Complete 3 projects',
    color: '#F6B93B',
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Start learning at least 3 programming languages.',
    requirementText: 'Start 3 languages',
    color: '#4A6FDC',
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a lesson after midnight.',
    requirementText: 'Practice between 00:00 and 04:59',
    color: '#2C3E50',
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a lesson before 7:00 AM.',
    requirementText: 'Practice between 05:00 and 06:59',
    color: '#F6B93B',
  },
  {
    id: 'speed_runner',
    name: 'Speed Runner',
    description: 'Complete a 60-second Speed Run exercise.',
    requirementText: 'Finish 1 Speed Run',
    color: '#E74C3C',
  },
  {
    id: 'streak_keeper',
    name: 'Streak Keeper',
    description: 'Maintain a 30-day daily coding streak.',
    requirementText: '30-day streak',
    color: '#F6B93B',
  },
  {
    id: 'century',
    name: 'Century',
    description: 'Maintain a 100-day daily coding streak.',
    requirementText: '100-day streak',
    color: '#2ECC71',
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: 'Complete 10 lessons in a single calendar day.',
    requirementText: '10 lessons in 1 day',
    color: '#4A6FDC',
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete 10 lessons without making a single mistake.',
    requirementText: '10 flawless lessons',
    color: '#2ECC71',
  },
  {
    id: 'note_taker',
    name: 'Note Taker',
    description: 'Write 10 personal study notes on lessons or concepts.',
    requirementText: 'Write 10 notes',
    color: '#4A6FDC',
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    description: 'Save 20 bookmarks across lessons, exercises, or docs.',
    requirementText: 'Save 20 bookmarks',
    color: '#F6B93B',
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Inspect every module in a language skill tree.',
    requirementText: 'Visit all modules in a tree',
    color: '#2ECC71',
  },
  {
    id: 'polyglot_master',
    name: 'Polyglot Master',
    description: 'Reach mastered concepts in 3 programming languages.',
    requirementText: 'Mastery in 3 languages',
    color: '#4A6FDC',
  },
  {
    id: 'interview_ready_1',
    name: 'Interview Ready I',
    description: 'Complete 5 Interview Mode technical or behavioral drills.',
    requirementText: 'Complete 5 interview drills',
    color: '#4A6FDC',
  },
  {
    id: 'interview_ready_2',
    name: 'Interview Ready II',
    description: 'Complete 15 Interview Mode drills across studied concepts.',
    requirementText: 'Complete 15 interview drills',
    color: '#2ECC71',
  },
  {
    id: 'interview_ready_3',
    name: 'Interview Ready III',
    description: 'Complete 30 Interview Mode drills and master technical communication.',
    requirementText: 'Complete 30 interview drills',
    color: '#F6B93B',
  },
  {
    id: 'monthly_challenger',
    name: 'Monthly Challenger',
    description: 'Complete a calendar Monthly Challenge.',
    requirementText: 'Complete 1 Monthly Challenge',
    color: '#2ECC71',
  },
];

export function calculateLevelFromXp(xp: number): {
  level: number;
  title: 'Beginner' | 'Learner' | 'Intermediate' | 'Advanced' | 'Expert';
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  // Each level requires 250 XP
  const xpPerLevel = 250;
  const level = Math.floor(xp / xpPerLevel) + 1;
  const currentLevelXp = xp % xpPerLevel;
  const nextLevelXp = xpPerLevel;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));

  let title: 'Beginner' | 'Learner' | 'Intermediate' | 'Advanced' | 'Expert' = 'Beginner';
  if (level >= 31) title = 'Expert';
  else if (level >= 21) title = 'Advanced';
  else if (level >= 11) title = 'Intermediate';
  else if (level >= 6) title = 'Learner';

  return { level, title, currentLevelXp, nextLevelXp, progressPercent };
}

export function getExerciseXpReward(difficulty: 1 | 2 | 3 | 4 | 5): number {
  if (difficulty <= 2) return 10; // Easy exercise: 10 XP
  if (difficulty <= 3) return 20; // Medium exercise: 20 XP
  return 40; // Hard exercise: 40 XP
}

export function getHuntXpReward(difficulty: 'easy' | 'medium' | 'hard'): number {
  if (difficulty === 'easy') return 50;
  if (difficulty === 'medium') return 100;
  return 200;
}

/**
 * FSRS (Free Spaced Repetition Scheduler) update (Part 9.3 & 9.7)
 * Schedules reviews at 1d, 3d, 7d, 14d, 30d, 90d, 180d based on accuracy and speed.
 */
export function updateFSRSCard(
  existing: FSRSCardState | undefined,
  conceptId: string,
  languageId: ProgrammingLanguageId,
  correct: boolean,
  responseTimeSeconds: number
): FSRSCardState {
  const now = new Date();
  const prevReps = existing ? existing.reps : 0;
  const prevLapses = existing ? existing.lapses : 0;
  const prevDifficulty = existing ? existing.difficulty : 5.0;

  // Grade 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
  const grade = !correct ? 1 : responseTimeSeconds < 12 ? 4 : responseTimeSeconds < 25 ? 3 : 2;

  const newDifficulty = Math.max(
    1,
    Math.min(10, Number((prevDifficulty - 0.8 * (grade - 3)).toFixed(2)))
  );

  let reps = prevReps;
  let lapses = prevLapses;
  let scheduledDays = 1;

  if (correct) {
    reps += 1;
    const intervalIdx = Math.min(FSRS_INTERVALS.length - 1, Math.max(0, reps - 1));
    scheduledDays = FSRS_INTERVALS[intervalIdx];
  } else {
    lapses += 1;
    reps = Math.max(0, reps - 1);
    scheduledDays = 1;
  }

  const nextReview = new Date(now.getTime() + scheduledDays * 86400 * 1000);

  let mastery: ConceptMasteryLevel = 'introduced';
  if (reps >= 3 && correct) {
    mastery = 'mastered';
  } else if (reps >= 1) {
    mastery = 'practicing';
  }

  return {
    conceptId,
    languageId,
    stability: scheduledDays,
    difficulty: newDifficulty,
    elapsedDays: 0,
    scheduledDays,
    reps,
    lapses,
    lastReviewAt: now.toISOString(),
    nextReviewAt: nextReview.toISOString(),
    mastery,
  };
}

/**
 * Computes effective mastery considering time decay (Part 9.7)
 */
export function getEffectiveConceptMastery(card: FSRSCardState | undefined): ConceptMasteryLevel {
  if (!card) return 'introduced';
  const now = Date.now();
  const due = new Date(card.nextReviewAt).getTime();
  if (now > due + 7 * 86400 * 1000 && card.mastery === 'mastered') {
    return 'practicing'; // Decayed over time, needs review
  }
  return card.mastery;
}

/**
 * Updates daily streak and automatic streak freezes (Part 15.1 & 15.6)
 */
export function updateDailyStreak(db: UserDatabase): {
  streak: number;
  longestStreak: number;
  streakFreezes: number;
  streakIncremented: boolean;
} {
  const todayStr = new Date().toISOString().slice(0, 10);
  if (db.lastSessionDate === todayStr) {
    return {
      streak: db.streak,
      longestStreak: db.longestStreak,
      streakFreezes: db.streakFreezes,
      streakIncremented: false,
    };
  }

  let newStreak = db.streak;
  let freezes = db.streakFreezes;

  if (!db.lastSessionDate) {
    newStreak = 1;
  } else {
    const lastDate = new Date(db.lastSessionDate + 'T00:00:00Z');
    const currDate = new Date(todayStr + 'T00:00:00Z');
    const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (86400 * 1000));

    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      const missedDays = diffDays - 1;
      if (freezes >= missedDays) {
        freezes -= missedDays;
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }
  }

  // Award automatic streak freezes at milestones: 7-day -> 1, 30-day -> 2, 100-day -> 3
  if (newStreak === 7) freezes = Math.max(freezes, 1);
  if (newStreak === 30) freezes = Math.max(freezes, 2);
  if (newStreak === 100) freezes = Math.max(freezes, 3);

  const longestStreak = Math.max(db.longestStreak, newStreak);
  return {
    streak: newStreak,
    longestStreak,
    streakFreezes: freezes,
    streakIncremented: true,
  };
}

/**
 * Evaluates and unlocks any newly earned badges (Part 15.1)
 */
export function evaluateNewBadges(
  db: UserDatabase,
  options?: { completedSpeedRun?: boolean; totalModulesInActiveTree?: number }
): BadgeId[] {
  const newlyUnlocked: BadgeId[] = [];
  const unlock = (id: BadgeId) => {
    if (!db.unlockedBadges[id]) {
      newlyUnlocked.push(id);
    }
  };

  const allProgress = Object.values(db.languageProgress);
  const totalLessons = allProgress.reduce((acc, p) => acc + p.completedLessonIds.length, 0);
  const totalPerfectLessons = allProgress.reduce((acc, p) => acc + p.perfectLessonIds.length, 0);
  const totalExercises = allProgress.reduce((acc, p) => acc + p.completedExerciseIds.length, 0);
  const startedLangs = allProgress.filter((p) => p.completedLessonIds.length > 0 || p.xp > 0).length;
  const completedHunts = Object.values(db.hunts).filter((h) => h.completed).length;
  const completedProjects = db.projects.filter((p) => p.status === 'completed').length;

  if (totalLessons >= 1) unlock('first_steps');
  if (totalExercises >= 100) unlock('loop_master');
  if (completedHunts >= 10) unlock('debugger');
  if (completedProjects >= 3) unlock('project_builder');
  if (startedLangs >= 3 || db.selectedLanguages.length >= 3) unlock('polyglot');

  const hour = new Date().getHours();
  if (totalLessons >= 1 && hour >= 0 && hour < 5) unlock('night_owl');
  if (totalLessons >= 1 && hour >= 5 && hour < 7) unlock('early_bird');
  if (options?.completedSpeedRun) unlock('speed_runner');

  if (db.streak >= 30) unlock('streak_keeper');
  if (db.streak >= 100) unlock('century');
  if (db.todayLessonsCompleted >= 10) unlock('marathon');
  if (totalPerfectLessons >= 10) unlock('perfectionist');
  if (db.notes.length >= 10) unlock('note_taker');
  if (db.bookmarks.length >= 20) unlock('bookworm');

  if (options?.totalModulesInActiveTree) {
    const visitedCount = Object.keys(db.visitedSkillTreeModules).filter((k) =>
      k.startsWith(db.activeLanguage + ':')
    ).length;
    if (visitedCount >= options.totalModulesInActiveTree) {
      unlock('explorer');
    }
  }

  // Polyglot Master: mastered concepts in 3 languages
  const langsWithMastery = new Set(
    Object.values(db.fsrsCards)
      .filter((c) => c.mastery === 'mastered')
      .map((c) => c.languageId)
  );
  if (langsWithMastery.size >= 3) unlock('polyglot_master');

  // [3.2] Interview Ready I / II / III badge family tied to drills completed
  const drillsCount = (db.completedInterviewDrillIds || []).length;
  if (drillsCount >= 5) unlock('interview_ready_1');
  if (drillsCount >= 15) unlock('interview_ready_2');
  if (drillsCount >= 30) unlock('interview_ready_3');

  // [3.1] Monthly Challenge completion badge
  if (db.monthlyChallenge?.completed) unlock('monthly_challenger');

  return newlyUnlocked;
}

/**
 * Computes Learning Velocity & Predicted Completion (Part 9.8 & 9.9)
 */
export function computeLearningVelocity(
  db: UserDatabase,
  totalCurriculumLessons: number
): {
  conceptsPerWeek: number;
  exercisesPerWeek: number;
  averageAccuracyPercent: number;
  averageMinutesPerLesson: number;
  predictedCompletionText: string;
} {
  const prog = db.languageProgress[db.activeLanguage];
  const createdMs = new Date(db.createdAt).getTime();
  const weeksActive = Math.max(1, (Date.now() - createdMs) / (7 * 86400 * 1000));

  const conceptsCount = Object.values(db.fsrsCards).filter(
    (c) => c.languageId === db.activeLanguage
  ).length;
  const conceptsPerWeek = Number((conceptsCount / weeksActive).toFixed(1));
  const exercisesPerWeek = Number((prog.completedExerciseIds.length / weeksActive).toFixed(1));

  const averageAccuracyPercent =
    prog.totalAttempts > 0 ? Math.round((prog.correctAttempts / prog.totalAttempts) * 100) : 0;

  const completedCount = prog.completedLessonIds.length;
  const averageMinutesPerLesson =
    completedCount > 0 ? Number((prog.totalTimeSeconds / 60 / completedCount).toFixed(1)) : 0;

  const remainingLessons = Math.max(0, totalCurriculumLessons - completedCount);
  if (remainingLessons === 0) {
    return {
      conceptsPerWeek,
      exercisesPerWeek,
      averageAccuracyPercent,
      averageMinutesPerLesson,
      predictedCompletionText: 'Curriculum Complete',
    };
  }

  // Estimate daily pace from dailyGoalMinutes or actual velocity
  const lessonsPerDay = Math.max(0.5, db.dailyGoalMinutes / 10);
  const daysRemaining = Math.ceil(remainingLessons / lessonsPerDay);
  const targetDate = new Date(Date.now() + daysRemaining * 86400 * 1000);

  return {
    conceptsPerWeek,
    exercisesPerWeek,
    averageAccuracyPercent,
    averageMinutesPerLesson,
    predictedCompletionText: `${daysRemaining} days (${targetDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })})`,
  };
}
