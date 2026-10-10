import {
  InterviewRoleFocus,
  InterviewSeniority,
  ProgrammingLanguageId,
  ThemeMode,
  UserDatabase,
} from './types';

export interface ThemePaletteDefinition {
  id: ThemeMode;
  name: string;
  category: 'Classic' | 'Signature Loopwright' | 'Community Classics' | 'Advanced';
  bg: string;
  surface: string;
  text: string;
  primary: string;
  accent: string;
  isDark: boolean;
}

/**
 * Part 5.3 — All 26 Built-In Themes
 */
export const LOOPWRIGHT_26_THEMES: ThemePaletteDefinition[] = [
  // Classic (1-5)
  { id: 'light', name: 'Light', category: 'Classic', bg: '#F4F6FA', surface: '#FFFFFF', text: '#14181F', primary: '#4C5BD4', accent: '#FF9F43', isDark: false },
  { id: 'dark', name: 'Dark', category: 'Classic', bg: '#14181F', surface: '#1E2430', text: '#F4F6FA', primary: '#5B6BE0', accent: '#FF9F43', isDark: true },
  { id: 'system', name: 'System (OS)', category: 'Classic', bg: '#F4F6FA', surface: '#FFFFFF', text: '#14181F', primary: '#4C5BD4', accent: '#FF9F43', isDark: false },
  { id: 'high_contrast_light', name: 'High Contrast Light (AAA)', category: 'Classic', bg: '#FFFFFF', surface: '#FFFFFF', text: '#000000', primary: '#1B2CC1', accent: '#B34700', isDark: false },
  { id: 'high_contrast_dark', name: 'High Contrast Dark (AAA)', category: 'Classic', bg: '#000000', surface: '#0A0A0A', text: '#FFFFFF', primary: '#809BFF', accent: '#FFB84D', isDark: true },

  // Signature Loopwright (6-10)
  { id: 'terminal', name: 'Terminal', category: 'Signature Loopwright', bg: '#050B07', surface: '#0A1910', text: '#2DD4A7', primary: '#2DD4A7', accent: '#F5C542', isDark: true },
  { id: 'neon', name: 'Neon', category: 'Signature Loopwright', bg: '#0B0719', surface: '#161032', text: '#F8FAFC', primary: '#8B6CF0', accent: '#4DA8FF', isDark: true },
  { id: 'paper', name: 'Paper', category: 'Signature Loopwright', bg: '#FAF6EE', surface: '#FFFDF8', text: '#2B2620', primary: '#4C5BD4', accent: '#D97724', isDark: false },
  { id: 'blueprint', name: 'Blueprint', category: 'Signature Loopwright', bg: '#0D233A', surface: '#133152', text: '#E6F1FF', primary: '#4DA8FF', accent: '#FF9F43', isDark: true },
  { id: 'circuit', name: 'Circuit', category: 'Signature Loopwright', bg: '#16191D', surface: '#20252B', text: '#ECEFF4', primary: '#FF9F43', accent: '#2DD4A7', isDark: true },

  // Community Classics (11-25)
  { id: 'solarized_light', name: 'Solarized Light', category: 'Community Classics', bg: '#FDF6E3', surface: '#EEE8D5', text: '#073642', primary: '#268BD2', accent: '#CB4B16', isDark: false },
  { id: 'solarized_dark', name: 'Solarized Dark', category: 'Community Classics', bg: '#002B36', surface: '#073642', text: '#EEE8D5', primary: '#268BD2', accent: '#B58900', isDark: true },
  { id: 'nord', name: 'Nord', category: 'Community Classics', bg: '#2E3440', surface: '#3B4252', text: '#ECEFF4', primary: '#88C0D0', accent: '#EBCB8B', isDark: true },
  { id: 'dracula', name: 'Dracula', category: 'Community Classics', bg: '#282A36', surface: '#343746', text: '#F8F8F2', primary: '#BD93F9', accent: '#FF79C6', isDark: true },
  { id: 'gruvbox_light', name: 'Gruvbox Light', category: 'Community Classics', bg: '#FBF1C7', surface: '#EBDBB2', text: '#3C3836', primary: '#076678', accent: '#AF3A03', isDark: false },
  { id: 'gruvbox_dark', name: 'Gruvbox Dark', category: 'Community Classics', bg: '#282828', surface: '#3C3836', text: '#EBDBB2', primary: '#83A598', accent: '#FE8019', isDark: true },
  { id: 'monokai', name: 'Monokai', category: 'Community Classics', bg: '#272822', surface: '#383930', text: '#F8F8F2', primary: '#A6E22E', accent: '#FD971F', isDark: true },
  { id: 'one_dark', name: 'One Dark', category: 'Community Classics', bg: '#282C34', surface: '#313640', text: '#ABB2BF', primary: '#61AFEF', accent: '#E5C07B', isDark: true },
  { id: 'tokyo_night', name: 'Tokyo Night', category: 'Community Classics', bg: '#1A1B26', surface: '#24283B', text: '#C0CAF5', primary: '#7AA2F7', accent: '#FF9E64', isDark: true },
  { id: 'catppuccin_latte', name: 'Catppuccin Latte', category: 'Community Classics', bg: '#EFF1F5', surface: '#E6E9EF', text: '#4C4F69', primary: '#1E66F5', accent: '#FE640B', isDark: false },
  { id: 'catppuccin_mocha', name: 'Catppuccin Mocha', category: 'Community Classics', bg: '#1E1E2E', surface: '#313244', text: '#CDD6F4', primary: '#89B4FA', accent: '#FAB387', isDark: true },
  { id: 'rose_pine', name: 'Rosé Pine', category: 'Community Classics', bg: '#191724', surface: '#1F1D2E', text: '#E0DEF4', primary: '#C4A7E7', accent: '#F6C177', isDark: true },
  { id: 'kanagawa', name: 'Kanagawa', category: 'Community Classics', bg: '#1F1F28', surface: '#2A2A37', text: '#DCD7BA', primary: '#7E9CD8', accent: '#FFA066', isDark: true },
  { id: 'everforest', name: 'Everforest', category: 'Community Classics', bg: '#272E33', surface: '#2E383C', text: '#D3C6AA', primary: '#A7C080', accent: '#E69875', isDark: true },
  { id: 'ayu_mirage', name: 'Ayu Mirage', category: 'Community Classics', bg: '#1F2430', surface: '#242B38', text: '#CCCAC2', primary: '#5CCFE6', accent: '#FFAD66', isDark: true },

  // Advanced (26)
  { id: 'custom', name: 'Custom Theme Editor', category: 'Advanced', bg: '#F4F6FA', surface: '#FFFFFF', text: '#14181F', primary: '#4C5BD4', accent: '#FF9F43', isDark: false },
];

/**
 * WCAG 2.2 Relative Luminance & Contrast Ratio Calculator (Part 5.4)
 */
function hexToLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return 0.5;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function calculateContrastRatio(hex1: string, hex2: string): number {
  const l1 = hexToLuminance(hex1);
  const l2 = hexToLuminance(hex2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

/**
 * Part 10.16 — Focus Score Calculator (Hidden in Calm Mode)
 */
export function computeFocusScore(db: UserDatabase): number {
  const prog = db.languageProgress[db.activeLanguage];
  const goalRatio = Math.min(1, db.todayMinutesCompleted / Math.max(5, db.dailyGoalMinutes));
  const streakBonus = Math.min(1, db.streak / 7);
  const accuracy =
    prog.totalAttempts > 0 ? prog.correctAttempts / prog.totalAttempts : 0.85;
  const score = Math.round(goalRatio * 40 + streakBonus * 25 + accuracy * 35);
  return Math.max(10, Math.min(100, score));
}

/**
 * Part 22.5 — On-Device Static Big-O Complexity Estimator
 */
export function estimateBigOComplexity(code: string): {
  timeComplexity: string;
  spaceComplexity: string;
  rationale: string;
} {
  const lines = code
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

  const loopCount = lines.filter(
    (l) => l.startsWith('for ') || l.startsWith('while ') || l.includes('.forEach(')
  ).length;
  const hasHalving =
    code.includes('// 2') ||
    code.includes('>> 1') ||
    code.includes('/= 2') ||
    code.includes('mid =');
  const hasSorting =
    code.includes('.sort(') || code.includes('sorted(') || code.includes('slices.Sort');
  const hasAllocation =
    code.includes('set(') ||
    code.includes('new Map') ||
    code.includes('new Set') ||
    code.includes('{}') ||
    code.includes('make(map');

  let timeComplexity = 'O(1)';
  let rationale = 'Constant-time scalar operations with no loop or recursive branching.';

  if (loopCount >= 2) {
    timeComplexity = 'O(n²)';
    rationale = 'Detected multiple/nested iteration constructs over the input collection.';
  } else if (hasSorting && loopCount >= 1) {
    timeComplexity = 'O(n log n)';
    rationale = 'Dominated by comparison sorting combined with linear traversal.';
  } else if (hasHalving && loopCount === 1) {
    timeComplexity = 'O(log n)';
    rationale = 'Search space or loop counter is halved on each iteration.';
  } else if (loopCount === 1 || hasSorting) {
    timeComplexity = hasSorting ? 'O(n log n)' : 'O(n)';
    rationale = hasSorting
      ? 'Comparison-based sort dominates runtime at O(n log n).'
      : 'Single linear pass proportional to input length n.';
  }

  const spaceComplexity = hasAllocation ? 'O(n)' : 'O(1)';
  return { timeComplexity, spaceComplexity, rationale };
}

/**
 * Part 22.4 — Complexity Cheat Sheet Reference Table
 */
export interface ComplexityReferenceRow {
  category: 'Data Structure' | 'Sorting' | 'Searching';
  name: string;
  averageTime: string;
  worstTime: string;
  space: string;
  note: string;
}

export const COMPLEXITY_CHEAT_SHEET: ComplexityReferenceRow[] = [
  { category: 'Data Structure', name: 'Dynamic Array (List / Slice / Vec)', averageTime: 'Access O(1) · Search O(n)', worstTime: 'Append O(n) amortized O(1)', space: 'O(n)', note: 'Contiguous memory; cache-friendly sequential scans.' },
  { category: 'Data Structure', name: 'Hash Map / Dictionary / Set', averageTime: 'Lookup/Insert/Delete O(1)', worstTime: 'O(n) on hash collision', space: 'O(n)', note: 'Ideal for frequency counting, memoization, and O(1) key lookups.' },
  { category: 'Data Structure', name: 'Stack & Queue (Deque)', averageTime: 'Push/Pop O(1)', worstTime: 'O(1)', space: 'O(n)', note: 'LIFO (DFS,括号 matching) vs FIFO (BFS level-order traversal).' },
  { category: 'Data Structure', name: 'Binary Heap (Priority Queue)', averageTime: 'Peek O(1) · Push/Pop O(log n)', worstTime: 'O(log n)', space: 'O(n)', note: 'Maintains min/max element for Top-K and Dijkstra.' },
  { category: 'Sorting', name: 'Merge Sort', averageTime: 'O(n log n)', worstTime: 'O(n log n)', space: 'O(n)', note: 'Stable divide-and-conquer sort with guaranteed worst-case bound.' },
  { category: 'Sorting', name: 'Quick Sort', averageTime: 'O(n log n)', worstTime: 'O(n²)', space: 'O(log n)', note: 'In-place partitioning with low constant overhead.' },
  { category: 'Searching', name: 'Binary Search', averageTime: 'O(log n)', worstTime: 'O(log n)', space: 'O(1)', note: 'Requires monotonic / sorted search space.' },
  { category: 'Searching', name: 'BFS & DFS Graph Traversal', averageTime: 'O(V + E)', worstTime: 'O(V + E)', space: 'O(V)', note: 'Visits every vertex V and edge E once.' },
];

/**
 * Part 13.9 — Code Review Arena Challenges
 */
export interface CodeReviewArenaItem {
  id: string;
  title: string;
  language: ProgrammingLanguageId;
  diffSnippet: string;
  issuesToFind: string[];
  correctIssue: string;
  explanation: string;
}

export const CODE_REVIEW_ARENA_ITEMS: CodeReviewArenaItem[] = [
  {
    id: 'cra-1',
    title: 'Mutable Default Argument in User Role Helper',
    language: 'python',
    diffSnippet: `+ def add_role(role, roles=[]):\n+     roles.append(role)\n+     return roles`,
    issuesToFind: [
      'Shared mutable default list persists state across calls',
      'Missing return statement in function body',
      'Syntax error in parameter list',
      'Time complexity is O(n^2)',
    ],
    correctIssue: 'Shared mutable default list persists state across calls',
    explanation:
      'In Python, default parameter values are evaluated once at function definition time. Use `roles=None` and initialize `roles = []` inside the function.',
  },
  {
    id: 'cra-2',
    title: 'Unchecked Array Index in Two-Pointer Loop',
    language: 'javascript',
    diffSnippet: `+ for (let i = 0; i <= items.length; i++) {\n+   total += items[i].price;\n+ }`,
    issuesToFind: [
      'Off-by-one `<= items.length` accesses `undefined` on final iteration',
      '`let` cannot be used inside a `for` header',
      '`+=` mutates a constant reference',
      'Missing semicolon after block',
    ],
    correctIssue: 'Off-by-one `<= items.length` accesses `undefined` on final iteration',
    explanation:
      'Valid 0-based indices run from `0` to `items.length - 1`. Using `<=` reads `items[items.length]`, which is `undefined` and throws a TypeError.',
  },
];

/**
 * Part 13.9 — AI Debate Topics (Architectural Trade-offs)
 */
export interface AIDebateTopic {
  id: string;
  title: string;
  sideATitle: string;
  sideAArgument: string;
  sideBTitle: string;
  sideBArgument: string;
  synthesisTakeaway: string;
}

export const AI_DEBATE_TOPICS: AIDebateTopic[] = [
  {
    id: 'debate-1',
    title: 'Composition vs. Class Inheritance',
    sideATitle: 'Favor Composition Over Inheritance',
    sideAArgument:
      'Small, composable interfaces decouple behavior from rigid class hierarchies and make unit testing and refactoring straightforward.',
    sideBTitle: 'Structured Inheritance Hierarchies',
    sideBArgument:
      'When modeling true "is-a" domain taxonomies with shared base invariants, inheritance avoids boilerplate delegation.',
    synthesisTakeaway:
      'Default to composition for behavior reuse and interfaces; reserve shallow inheritance only for stable, closed domain hierarchies.',
  },
  {
    id: 'debate-2',
    title: 'In-Place Mutation vs. Immutable Data Transformations',
    sideATitle: 'Immutable Transformations',
    sideAArgument:
      'Returning new collections eliminates spooky action-at-a-distance bugs, simplifies concurrency, and makes state transitions predictable.',
    sideBTitle: 'In-Place Mutation',
    sideBArgument:
      'Mutating buffers in-place achieves O(1) auxiliary space and avoids garbage-collection pressure in tight inner loops.',
    synthesisTakeaway:
      'Use immutable values across API boundaries and state stores; use localized in-place mutation inside performance-critical algorithms.',
  },
];

/**
 * Part 22.8 — Language Comparison Examples
 */
export const LANGUAGE_COMPARISON_SNIPPETS: Record<
  ProgrammingLanguageId,
  { filterMap: string; structOrDict: string; errorHandling: string }
> = {
  python: {
    filterMap: 'evens_sq = [x * x for x in nums if x % 2 == 0]',
    structOrDict: 'user = {"name": "Ada", "level": 4}',
    errorHandling: 'try:\n    val = int(raw)\nexcept ValueError as err:\n    val = 0',
  },
  javascript: {
    filterMap: 'const evensSq = nums.filter(x => x % 2 === 0).map(x => x * x);',
    structOrDict: 'const user = { name: "Ada", level: 4 };',
    errorHandling: 'try {\n  const data = JSON.parse(raw);\n} catch (err) {\n  console.error(err);\n}',
  },
  typescript: {
    filterMap: 'const evensSq: number[] = nums.filter((x): boolean => x % 2 === 0).map(x => x * x);',
    structOrDict: 'interface User { name: string; level: number }\nconst user: User = { name: "Ada", level: 4 };',
    errorHandling: 'function parseSafe(raw: string): number | null {\n  const n = Number(raw);\n  return Number.isNaN(n) ? null : n;\n}',
  },
  rust: {
    filterMap: 'let evens_sq: Vec<i32> = nums.iter().filter(|&&x| x % 2 == 0).map(|&x| x * x).collect();',
    structOrDict: 'struct User { name: String, level: u32 }',
    errorHandling: 'let val: i32 = raw.parse().unwrap_or(0);',
  },
  go: {
    filterMap: 'var evensSq []int\nfor _, x := range nums {\n    if x%2 == 0 { evensSq = append(evensSq, x*x) }\n}',
    structOrDict: 'type User struct {\n    Name  string\n    Level int\n}',
    errorHandling: 'val, err := strconv.Atoi(raw)\nif err != nil {\n    val = 0\n}',
  },
};

/**
 * Part 17.4 — Curated Interview Question Bank
 */
export interface InterviewQuestionBankEntry {
  id: string;
  role: InterviewRoleFocus;
  seniority: InterviewSeniority;
  question: string;
  keyPoints: string[];
  sampleAnswer: string;
  followUp: string;
}

export const INTERVIEW_QUESTION_BANK: InterviewQuestionBankEntry[] = [
  {
    id: 'iqb-1',
    role: 'Backend',
    seniority: 'Junior',
    question: 'When should you use a database index, and what is the write-performance trade-off?',
    keyPoints: [
      'Speeds up SELECT/WHERE/JOIN lookups from O(n) full table scan to O(log n) B-Tree traversal',
      'Adds write overhead on INSERT/UPDATE/DELETE and consumes additional disk/memory',
    ],
    sampleAnswer:
      'Add an index on high-cardinality columns frequently used in WHERE filters, JOIN keys, or ORDER BY clauses. Every additional index requires updating its B-Tree on writes, so avoid over-indexing write-heavy tables.',
    followUp: 'How does a composite index on (user_id, created_at) behave when querying only by created_at?',
  },
  {
    id: 'iqb-2',
    role: 'Frontend',
    seniority: 'Mid',
    question: 'How do you diagnose and prevent unnecessary re-renders and layout thrashing in interactive UIs?',
    keyPoints: [
      'Colocate state close to the leaf components that read it',
      'Animate GPU-composited properties (transform, opacity) rather than layout geometry',
    ],
    sampleAnswer:
      'Keep high-frequency state localized, memoize expensive derived computations, and ensure animations only mutate transform and opacity so the browser skips layout and paint.',
    followUp: 'How would you virtualize a 10,000-row log viewer while preserving keyboard accessibility?',
  },
  {
    id: 'iqb-3',
    role: 'Full-stack',
    seniority: 'Mid',
    question: 'How do you design an idempotent API endpoint for a retryable client action?',
    keyPoints: [
      'Client sends a deterministic Idempotency-Key header per logical operation',
      'Server stores key + response atomically to return the same result on network retries',
    ],
    sampleAnswer:
      'Require a client-generated UUID `Idempotency-Key` and persist the operation state in a unique-constrained transaction so duplicate retries return the original outcome without double-applying side effects.',
    followUp: 'When should idempotency keys expire, and how do you handle concurrent in-flight requests with the same key?',
  },
  {
    id: 'iqb-4',
    role: 'Systems',
    seniority: 'Senior',
    question: 'Compare stack allocation versus heap allocation in terms of lifetime, locality, and concurrency.',
    keyPoints: [
      'Stack frames use LIFO pointer bump with L1 cache locality and deterministic scope cleanup',
      'Heap allocations allow dynamic sizing and cross-frame lifetimes at the cost of allocator/GC overhead',
    ],
    sampleAnswer:
      'Stack allocation is a single stack-pointer offset with automatic scope deallocation and high cache locality, whereas heap allocation supports values whose size is unknown at compile time or whose lifetime outlives the creating stack frame.',
    followUp: 'How does escape analysis in Go or ownership borrowing in Rust minimize heap allocations?',
  },
];
