export type ProgrammingLanguageId = 'python' | 'javascript' | 'typescript' | 'rust' | 'go';

export type NaturalLanguageCode =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'pt'
  | 'it'
  | 'nl'
  | 'pl'
  | 'ru'
  | 'ja'
  | 'ko'
  | 'zh-CN'
  | 'zh-TW';

export type ExperienceLevel = 'never' | 'some' | 'experienced';

export type LearningGoal = 'basics' | 'project' | 'job' | 'fun';

export type DailyGoalMinutes = 5 | 10 | 20 | 30;

export type ThemeMode = 'light' | 'dark' | 'terminal' | 'neon' | 'custom';

export type SoundSet = 'minimal' | 'classic' | 'playful' | 'silent';

export type ColorblindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

export type ExerciseType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'drag_drop'
  | 'code_reading'
  | 'debugging_hunt'
  | 'free_coding'
  | 'comparison'
  | 'concept_mapping'
  | 'project_step'
  | 'speed_run'
  | 'code_completion'
  | 'output_prediction'
  | 'error_identification'
  | 'refactoring'
  | 'test_writing';

export type ConceptMasteryLevel = 'introduced' | 'practicing' | 'mastered';

export interface FSRSCardState {
  conceptId: string;
  languageId: ProgrammingLanguageId;
  stability: number; // S in days
  difficulty: number; // D (1 to 10)
  elapsedDays: number;
  scheduledDays: number; // 1, 3, 7, 14, 30, 90, 180
  reps: number;
  lapses: number;
  lastReviewAt: string;
  nextReviewAt: string;
  mastery: ConceptMasteryLevel;
}

export interface ConceptMappingPair {
  id: string;
  concept: string;
  definition: string;
}

export interface Exercise {
  id: string;
  lessonId: string;
  languageId: ProgrammingLanguageId;
  type: ExerciseType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  concept: string;
  prompt: string;
  codeSnippet?: string;
  starterCode?: string;
  options?: string[];
  dragLines?: string[];
  mappingPairs?: ConceptMappingPair[];
  comparisonOptions?: {
    codeA: string;
    codeB: string;
    reasons: string[];
  };
  answer: string | string[];
  expectedOutput?: string;
  requiredTokens?: string[];
  forbiddenTokens?: string[];
  explanation: string;
  hints: string[];
  estimatedSeconds: number;
  tags: string[];
}

export interface LessonExample {
  title: string;
  code: string;
  output: string;
  note: string;
}

export interface LessonSurprise {
  category: 'trending' | 'community' | 'did_you_know';
  title: string;
  body: string;
  sourceLabel: string;
  sourceUrl?: string;
}

export interface Lesson {
  id: string;
  languageId: ProgrammingLanguageId;
  moduleId: string;
  moduleTitle: string;
  nodeId: string;
  orderIndex: number;
  title: string;
  objective: string;
  concepts: string[];
  introduction: string[];
  examples: LessonExample[];
  interactivePrompt: {
    question: string;
    templateCode: string;
    expectedOutput: string;
    hint: string;
  };
  exercises: Exercise[];
  recap: string;
  surprise: LessonSurprise;
}

export interface SkillNode {
  id: string;
  languageId: ProgrammingLanguageId;
  moduleId: string;
  moduleNumber: number;
  name: string;
  description: string;
  prerequisites: string[];
  lessonIds: string[];
  position: { row: number; col: number }; // For winding DAG layout
}

export interface DebuggingHunt {
  id: string;
  languageId: ProgrammingLanguageId;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  buggyCode: string;
  fixedCode: string;
  expectedOutput: string;
  bugLineNumber: number;
  bugCategory: string;
  explanation: string;
  hints: string[];
  timeLimitSeconds: number;
}

export interface UserHuntRecord {
  huntId: string;
  completed: boolean;
  timeTakenSeconds: number;
  attempts: number;
  completedAt: string;
}

export interface ProjectStepItem {
  id: string;
  title: string;
  instruction: string;
  starterCode: string;
  validationKeywords: string[];
  expectedOutput?: string;
  completed: boolean;
  userCode: string;
}

export interface GuidedProjectTemplate {
  id: string;
  languageId: ProgrammingLanguageId;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate';
  estimatedMinutes: number;
  requirements: string[];
  steps: Omit<ProjectStepItem, 'completed' | 'userCode'>[];
}

export interface UserProject {
  id: string;
  languageId: ProgrammingLanguageId;
  name: string;
  description: string;
  isCustom: boolean;
  status: 'planning' | 'setup' | 'in_progress' | 'testing' | 'completed';
  currentPhaseIndex: number; // 0..5 (Idea, Planning, Setup, Steps, Testing, Completion)
  planNotes: string[];
  steps: ProjectStepItem[];
  sourceCode: string;
  hintsUsed: number;
  createdAt: string;
  completedAt?: string;
}

export type AIProviderId =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'groq'
  | 'openrouter'
  | 'mistral'
  | 'deepseek'
  | 'together'
  | 'fireworks'
  | 'perplexity'
  | 'cohere'
  | 'huggingface'
  | 'ollama'
  | 'lmstudio'
  | 'llamacpp'
  | 'custom';

export interface NormalizedAIModel {
  id: string;
  name: string;
  provider: AIProviderId;
  contextWindow: number;
  supportsFunctions: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
  isDeprecated: boolean;
  isFree: boolean;
  freeEvidence: string;
  speedScore: number; // 0-100
  qualityScore: number; // 0-100
  contextScore: number; // 0-100
  costScore: number; // 0-100
  availabilityScore: number; // 0-100
  compositeScore: number; // Weighted sum
}

export interface ScoreWeights {
  speed: number; // default 0.25
  quality: number; // default 0.30
  context: number; // default 0.15
  cost: number; // default 0.20
  availability: number; // default 0.10
}

export interface AIConfig {
  provider: AIProviderId | null;
  modelId: string;
  customBaseUrl: string;
  isFreeAssumed: boolean;
  weights: ScoreWeights;
  persistentMemory: boolean;
  detectedAt?: string;
  lastUsedAt?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  codeAttachment?: string;
  lessonContextId?: string;
  functionCallName?: string;
  createdAt: string;
}

export interface ContentFeedItem {
  id: string;
  source: 'official_docs' | 'reddit' | 'hacker_news' | 'dev_to' | 'github_trending';
  sourceLabel: string;
  sourceUrl: string;
  languageId: ProgrammingLanguageId | 'all';
  title: string;
  summary: string;
  upvotes?: number;
  publishedAt: string;
  fetchedAt: string;
  relevanceScore: number;
}

export interface BookmarkItem {
  id: string;
  type: 'lesson' | 'exercise' | 'article';
  referenceId: string;
  languageId: ProgrammingLanguageId;
  title: string;
  subtitle: string;
  createdAt: string;
}

export interface NoteItem {
  id: string;
  type: 'lesson' | 'exercise' | 'concept';
  referenceId: string;
  languageId: ProgrammingLanguageId;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type BadgeId =
  | 'first_steps'
  | 'loop_master'
  | 'debugger'
  | 'project_builder'
  | 'polyglot'
  | 'night_owl'
  | 'early_bird'
  | 'speed_runner'
  | 'streak_keeper'
  | 'century'
  | 'marathon'
  | 'perfectionist'
  | 'note_taker'
  | 'bookworm'
  | 'explorer'
  | 'polyglot_master'
  | 'interview_ready_1'
  | 'interview_ready_2'
  | 'interview_ready_3'
  | 'monthly_challenger';

export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  description: string;
  requirementText: string;
  color: string;
}

export type InterviewDrillType =
  | 'explain_code'
  | 'predict_output'
  | 'fix_bug'
  | 'optimize_function'
  | 'write_from_spec'
  | 'explain_complexity'
  | 'choose_data_structure'
  | 'walk_through_algorithm'
  | 'conceptual_question'
  | 'behavioral_answer';

export interface InterviewDrill {
  id: string;
  languageId: ProgrammingLanguageId;
  drillType: InterviewDrillType;
  concept: string;
  title: string;
  prompt: string;
  codeSnippet?: string;
  starterCode?: string;
  options?: string[];
  expectedAnswer: string;
  requiredKeywords?: string[];
  sampleStrongResponse: string;
  rubricPoints: string[];
}

export interface AIInterviewTurn {
  id: string;
  role: 'interviewer' | 'candidate';
  stage: 'problem_pose' | 'approach_and_complexity' | 'structured_feedback';
  content: string;
  createdAt: string;
}

export interface AIInterviewTranscript {
  id: string;
  languageId: ProgrammingLanguageId;
  concept: string;
  problemTitle: string;
  turns: AIInterviewTurn[];
  status: 'awaiting_approach' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export type MonthlyChallengeId =
  | 'complete_guided_project'
  | 'master_10_concepts'
  | 'maintain_20_day_streak'
  | 'finish_25_hunts'
  | 'build_custom_project'
  | 'clear_15_mistakes';

export interface MonthlyChallengeState {
  monthKey: string; // YYYY-MM
  challengeId: MonthlyChallengeId;
  title: string;
  description: string;
  target: number;
  current: number;
  swappedThisMonth: boolean;
  completed: boolean;
  rewardClaimed: boolean;
}

export interface MistakeJournalEntry {
  id: string;
  languageId: ProgrammingLanguageId;
  concept: string;
  sourceType: 'exercise' | 'debugging_hunt' | 'gym';
  sourceId: string;
  prompt: string;
  userWrongAttempt: string;
  correctAnswer: string;
  explanation: string;
  reflectionNote: string;
  cleared: boolean;
  createdAt: string;
  clearedAt?: string;
}

export interface AlgorithmGymItem {
  id: string;
  category: 'arrays_two_pointers' | 'hash_maps' | 'stacks_queues' | 'recursion_trees' | 'sorting_big_o';
  title: string;
  concept: string;
  timeComplexityTarget: string;
  spaceComplexityTarget: string;
  prompt: string;
  starterCodeByLang: Record<ProgrammingLanguageId, string>;
  expectedOutput: string;
  explanation: string;
  hints: string[];
}

export interface WeeklyQuestGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: 'lessons' | 'xp' | 'hunts';
}

export interface WeeklyQuestState {
  weekStart: string;
  goals: WeeklyQuestGoal[];
  bonusClaimed: boolean;
}

export interface LanguageProgress {
  languageId: ProgrammingLanguageId;
  xp: number;
  completedLessonIds: string[];
  perfectLessonIds: string[];
  completedExerciseIds: string[];
  currentLessonId: string;
  lessonScores: Record<string, { score: number; attempts: number; lastAttemptAt: string }>;
  totalAttempts: number;
  correctAttempts: number;
  totalTimeSeconds: number;
}

export interface UserSettings {
  theme: ThemeMode;
  customThemeColors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
  };
  soundSet: SoundSet;
  hapticsEnabled: boolean;
  highContrast: boolean;
  largeText: boolean;
  dyslexicFont: boolean;
  reducedMotion: boolean;
  colorblindMode: ColorblindMode;
  trendingEnabled: boolean;
  weeklyQuestsEnabled: boolean;
  monthlyChallengeEnabled: boolean; // [3.1] Optional, turned off by default
  interviewModeEnabled: boolean; // [3.2] Optional track in Practice Hub
  autoRefreshContent: boolean;
  cacheLimitMb: number;
}

export interface UserDatabase {
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
  naturalLanguage: NaturalLanguageCode;
  selectedLanguages: ProgrammingLanguageId[];
  activeLanguage: ProgrammingLanguageId;
  experienceLevel: ExperienceLevel;
  goal: LearningGoal;
  dailyGoalMinutes: DailyGoalMinutes;
  streak: number;
  longestStreak: number;
  streakFreezes: number;
  lastSessionDate: string | null; // YYYY-MM-DD
  todayMinutesCompleted: number;
  todayLessonsCompleted: number;
  activityByDate: Record<string, { exercises: number; minutes: number; xp: number }>;
  languageProgress: Record<ProgrammingLanguageId, LanguageProgress>;
  fsrsCards: Record<string, FSRSCardState>;
  unlockedBadges: Record<BadgeId, string>; // badgeId -> ISO timestamp
  visitedSkillTreeModules: Record<string, boolean>;
  projects: UserProject[];
  hunts: Record<string, UserHuntRecord>;
  bookmarks: BookmarkItem[];
  notes: NoteItem[];
  aiConfig: AIConfig;
  aiMessages: AIMessage[];
  weeklyQuest: WeeklyQuestState;
  monthlyChallenge: MonthlyChallengeState; // [3.1]
  mistakeJournal: MistakeJournalEntry[]; // Mistake Journal entries
  completedInterviewDrillIds: string[]; // [3.2]
  interviewTranscripts: AIInterviewTranscript[]; // [3.2] Stored locally
  completedGymIds: string[]; // Algorithm & CS Gyms
  cachedFeed: ContentFeedItem[];
  settings: UserSettings;
}

export type AppScreen =
  | 'splash'
  | 'onboarding'
  | 'home'
  | 'lesson'
  | 'exercise'
  | 'skill_tree'
  | 'practice_hub'
  | 'interview_mode'
  | 'mistake_journal'
  | 'algo_gym'
  | 'v3_spec'
  | 'profile'
  | 'projects'
  | 'project_editor'
  | 'debugging_hunts'
  | 'debugging_hunt_editor'
  | 'ai_tutor'
  | 'content_feed'
  | 'bookmarks'
  | 'notes'
  | 'settings'
  | 'ai_setup'
  | 'about';
