import {
  AlgorithmGymItem,
  InterviewDrill,
  InterviewDrillType,
  MonthlyChallengeId,
  MonthlyChallengeState,
  ProgrammingLanguageId,
  UserDatabase,
} from './types';

export const INTERVIEW_DRILL_TYPE_META: Record<
  InterviewDrillType,
  { label: string; badge: string; description: string }
> = {
  explain_code: {
    label: 'Explain this code',
    badge: 'Code Reading',
    description: 'Walk line-by-line through what a snippet does and why.',
  },
  predict_output: {
    label: 'Predict the output',
    badge: 'Execution Trace',
    description: 'Determine the exact stdout or return value without running the code first.',
  },
  fix_bug: {
    label: 'Fix this bug',
    badge: 'Debugging',
    description: 'Identify and repair a subtle logic or boundary defect.',
  },
  optimize_function: {
    label: 'Optimize this function',
    badge: 'Performance',
    description: 'Reduce time or space complexity by refactoring a naive implementation.',
  },
  write_from_spec: {
    label: 'Write a function from a spec',
    badge: 'Implementation',
    description: 'Implement a clean function satisfying input/output constraints and edge cases.',
  },
  explain_complexity: {
    label: 'Explain time complexity',
    badge: 'Big-O Analysis',
    description: 'State and justify worst-case time and auxiliary space complexity.',
  },
  choose_data_structure: {
    label: 'Choose the right data structure',
    badge: 'Architecture',
    description: 'Select the optimal data structure for specific lookup, insertion, and memory constraints.',
  },
  walk_through_algorithm: {
    label: 'Walk through an algorithm',
    badge: 'Dry Run',
    description: 'Trace state mutations step-by-step on a concrete input.',
  },
  conceptual_question: {
    label: 'Answer a conceptual question',
    badge: 'CS & Language Core',
    description: 'Articulate language semantics, memory behavior, or runtime trade-offs.',
  },
  behavioral_answer: {
    label: 'Practice a behavioral answer',
    badge: 'STAR Communication',
    description: 'Structure a clear Situation–Task–Action–Result engineering story.',
  },
};

export interface MonthlyChallengeDefinition {
  id: MonthlyChallengeId;
  title: string;
  description: string;
  target: number;
}

export const MONTHLY_CHALLENGE_POOL: MonthlyChallengeDefinition[] = [
  {
    id: 'complete_guided_project',
    title: 'Complete one guided project',
    description: 'Finish all steps and verification in any Guided Project template.',
    target: 1,
  },
  {
    id: 'master_10_concepts',
    title: 'Master 10 concepts',
    description: 'Reach Mastered status on 10 concepts via FSRS spaced repetition reviews.',
    target: 10,
  },
  {
    id: 'maintain_20_day_streak',
    title: 'Maintain a 20-day streak',
    description: 'Reach or maintain a 20-day daily coding habit streak.',
    target: 20,
  },
  {
    id: 'finish_25_hunts',
    title: 'Finish 25 debugging hunts',
    description: 'Track down and repair 25 bugs across Debugging Hunts.',
    target: 25,
  },
  {
    id: 'build_custom_project',
    title: 'Build one custom project',
    description: 'Plan, implement, test, and complete 1 Custom Project from scratch.',
    target: 1,
  },
  {
    id: 'clear_15_mistakes',
    title: 'Clear 15 Mistake Journal entries',
    description: 'Review and successfully re-solve 15 logged entries in your Mistake Journal.',
    target: 15,
  },
];

export function computeMonthlyChallengeProgress(db: UserDatabase): MonthlyChallengeState {
  const currentMonth = new Date().toISOString().slice(0, 7);
  let state = db.monthlyChallenge;

  // Reset if a new calendar month started
  if (!state || state.monthKey !== currentMonth) {
    const def = MONTHLY_CHALLENGE_POOL[0];
    state = {
      monthKey: currentMonth,
      challengeId: def.id,
      title: def.title,
      description: def.description,
      target: def.target,
      current: 0,
      swappedThisMonth: false,
      completed: false,
      rewardClaimed: false,
    };
  }

  let currentVal = 0;
  switch (state.challengeId) {
    case 'complete_guided_project':
      currentVal = db.projects.filter((p) => !p.isCustom && p.status === 'completed').length;
      break;
    case 'master_10_concepts':
      currentVal = Object.values(db.fsrsCards).filter((c) => c.mastery === 'mastered').length;
      break;
    case 'maintain_20_day_streak':
      currentVal = Math.max(db.streak, db.longestStreak);
      break;
    case 'finish_25_hunts':
      currentVal = Object.values(db.hunts).filter((h) => h.completed).length;
      break;
    case 'build_custom_project':
      currentVal = db.projects.filter((p) => p.isCustom && p.status === 'completed').length;
      break;
    case 'clear_15_mistakes':
      currentVal = (db.mistakeJournal || []).filter((m) => m.cleared).length;
      break;
  }

  const clamped = Math.min(state.target, currentVal);
  return {
    ...state,
    current: clamped,
    completed: clamped >= state.target,
  };
}

export function swapMonthlyChallengeOnce(
  current: MonthlyChallengeState,
  targetId: MonthlyChallengeId
): MonthlyChallengeState {
  if (current.swappedThisMonth || current.challengeId === targetId) {
    return current;
  }
  const found = MONTHLY_CHALLENGE_POOL.find((c) => c.id === targetId) || MONTHLY_CHALLENGE_POOL[0];
  return {
    ...current,
    challengeId: found.id,
    title: found.title,
    description: found.description,
    target: found.target,
    current: 0,
    swappedThisMonth: true,
    completed: false,
    rewardClaimed: false,
  };
}

/**
 * Algorithm & CS Gyms (DSA Course drill surface inside Practice Hub)
 */
export const ALGORITHM_GYM_ITEMS: AlgorithmGymItem[] = [
  {
    id: 'gym-two-sum-sorted',
    category: 'arrays_two_pointers',
    title: 'Two-Pointer Pair Target',
    concept: 'loops',
    timeComplexityTarget: 'O(n)',
    spaceComplexityTarget: 'O(1)',
    prompt:
      'Given sorted array [2, 5, 8, 12, 16] and target 17, print the two values that sum to 17 separated by a space ("5 12").',
    starterCodeByLang: {
      python: 'nums = [2, 5, 8, 12, 16]\n# Print the pair summing to 17\nprint("5 12")',
      javascript: 'const nums = [2, 5, 8, 12, 16];\nconsole.log("5 12");',
      typescript: 'const nums: number[] = [2, 5, 8, 12, 16];\nconsole.log("5 12");',
      rust: 'fn main() {\n    println!("5 12");\n}',
      go: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("5 12")\n}',
    },
    expectedOutput: '5 12',
    explanation:
      'Because the input array is sorted, a left pointer at index 0 and right pointer at n-1 converge in O(n) time and O(1) auxiliary space.',
    hints: [
      'Start left at 0 (value 2) and right at 4 (value 16).',
      '2 + 16 = 18 > 17, so decrement right to index 3 (value 12); 5 + 12 = 17.',
    ],
  },
  {
    id: 'gym-frequency-counter',
    category: 'hash_maps',
    title: 'First Non-Repeating Element',
    concept: 'dictionaries',
    timeComplexityTarget: 'O(n)',
    spaceComplexityTarget: 'O(k)',
    prompt:
      'In the sequence ["a", "b", "a", "c", "b", "d"], identify and print the first element with a frequency count of 1.',
    starterCodeByLang: {
      python: '# Print the first unique token\nprint("c")',
      javascript: 'console.log("c");',
      typescript: 'console.log("c");',
      rust: 'fn main() {\n    println!("c");\n}',
      go: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("c")\n}',
    },
    expectedOutput: 'c',
    explanation:
      'A two-pass hash map count records frequencies in O(n) time and finds the first key with count == 1.',
    hints: ['Count occurrences of each character first, then scan left-to-right.'],
  },
  {
    id: 'gym-balanced-brackets',
    category: 'stacks_queues',
    title: 'Balanced Delimiter Stack Trace',
    concept: 'lists',
    timeComplexityTarget: 'O(n)',
    spaceComplexityTarget: 'O(n)',
    prompt:
      'Evaluate whether "{[()]}" has balanced brackets using LIFO stack order. Print "true" if balanced, "false" otherwise.',
    starterCodeByLang: {
      python: 'print("true")',
      javascript: 'console.log("true");',
      typescript: 'console.log("true");',
      rust: 'fn main() {\n    println!("true");\n}',
      go: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("true")\n}',
    },
    expectedOutput: 'true',
    explanation:
      'Every opening bracket is pushed onto a stack; each closing bracket matches the top of the stack in LIFO order.',
    hints: ['Check that ")" matches "(", "]" matches "[", and "}" matches "{".'],
  },
  {
    id: 'gym-recursion-depth',
    category: 'recursion_trees',
    title: 'Binary Tree Maximum Depth',
    concept: 'functions',
    timeComplexityTarget: 'O(n)',
    spaceComplexityTarget: 'O(h)',
    prompt:
      'A binary tree has root 1, left child 2 (with left child 4), and right child 3. Print its maximum depth (number of nodes along the longest root-to-leaf path).',
    starterCodeByLang: {
      python: 'depth = 1 + max(2, 1)\nprint(depth)',
      javascript: 'console.log(1 + Math.max(2, 1));',
      typescript: 'console.log(1 + Math.max(2, 1));',
      rust: 'fn main() {\n    println!("3");\n}',
      go: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println(3)\n}',
    },
    expectedOutput: '3',
    explanation:
      'maxDepth(node) = 1 + max(maxDepth(node.left), maxDepth(node.right)). Path 1 -> 2 -> 4 has length 3.',
    hints: ['Root (1) -> Left (2) -> Left (4) is 3 levels deep.'],
  },
  {
    id: 'gym-binary-search-steps',
    category: 'sorting_big_o',
    title: 'Binary Search Midpoint Trace',
    concept: 'conditionals',
    timeComplexityTarget: 'O(log n)',
    spaceComplexityTarget: 'O(1)',
    prompt:
      'Given sorted array [10, 20, 30, 40, 50, 60, 70], what is the first midpoint value checked by binary search (index (0 + 6) // 2)? Print the value.',
    starterCodeByLang: {
      python: 'arr = [10, 20, 30, 40, 50, 60, 70]\nprint(arr[3])',
      javascript: 'const arr = [10, 20, 30, 40, 50, 60, 70];\nconsole.log(arr[3]);',
      typescript: 'const arr: number[] = [10, 20, 30, 40, 50, 60, 70];\nconsole.log(arr[3]);',
      rust: 'fn main() {\n    println!("40");\n}',
      go: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println(40)\n}',
    },
    expectedOutput: '40',
    explanation:
      'With low = 0 and high = 6, mid = 3, which holds value 40. Binary search halves the search space on each comparison.',
    hints: ['Index 3 of [10, 20, 30, 40, 50, 60, 70] is 40.'],
  },
];

/**
 * [3.2] INTERVIEW MODE — All 10 Drill Types calibrated to the user's studied concepts
 */
export const INTERVIEW_MODE_DRILLS: InterviewDrill[] = [
  {
    id: 'id-explain-code-1',
    languageId: 'python',
    drillType: 'explain_code',
    concept: 'loops',
    title: 'Accumulator Loop & Early Termination',
    prompt: 'Explain what this code does, when the loop terminates, and what value is printed.',
    codeSnippet: `total = 0\nfor n in [4, 7, -1, 9]:\n    if n < 0:\n        break\n    total += n\nprint(total)`,
    expectedAnswer: '11',
    requiredKeywords: ['11', 'break'],
    sampleStrongResponse:
      'It initializes total to 0 and iterates over the list. It adds 4 and 7 (reaching 11), then encounters -1 which triggers break, terminating the loop before 9 is processed, and prints 11.',
    rubricPoints: [
      'Identifies accumulator initialization (total = 0)',
      'Explains early exit on negative number via break',
      'States final output 11',
    ],
  },
  {
    id: 'id-predict-output-1',
    languageId: 'python',
    drillType: 'predict_output',
    concept: 'lists',
    title: 'List Aliasing vs. Shallow Copy',
    prompt: 'Predict the exact output printed by this snippet.',
    codeSnippet: `a = [1, 2, 3]\nb = a\nb.append(4)\nprint(len(a))`,
    options: ['3', '4', 'Error', '0'],
    expectedAnswer: '4',
    sampleStrongResponse:
      '4 — because b = a assigns a reference to the same list object in memory rather than copying it.',
    rubricPoints: [
      'Predicts 4 accurately',
      'Understands reference assignment vs shallow copy',
    ],
  },
  {
    id: 'id-fix-bug-1',
    languageId: 'python',
    drillType: 'fix_bug',
    concept: 'conditionals',
    title: 'Boundary Check in Range Validator',
    prompt:
      'Fix the bug so that score = 100 prints "Valid" (inclusive bounds 0 to 100).',
    codeSnippet: `score = 100\nif score > 0 and score < 100:\n    print("Valid")\nelse:\n    print("Invalid")`,
    starterCode: `score = 100\nif score >= 0 and score <= 100:\n    print("Valid")`,
    expectedAnswer: 'Valid',
    sampleStrongResponse:
      'Use inclusive operators (>= 0 and <= 100) so boundary inputs 0 and 100 are accepted.',
    rubricPoints: [
      'Replaces strict < with <= for upper boundary',
      'Produces "Valid" output in sandbox',
    ],
  },
  {
    id: 'id-optimize-fn-1',
    languageId: 'python',
    drillType: 'optimize_function',
    concept: 'dictionaries',
    title: 'Optimize O(n²) Duplicate Check to O(n)',
    prompt:
      'Why is checking membership in a `set` faster than nested loops for finding duplicates, and what is the resulting time complexity?',
    codeSnippet: `# Naive O(n^2):\n# for i in range(len(arr)):\n#   for j in range(i+1, len(arr)): ...\n\n# Optimized:\nseen = set()`,
    options: [
      'O(n) time using O(1) average hash set lookups',
      'O(n log n) time using binary search on unsorted list',
      'O(1) time and O(1) space for any array size',
      'O(n^2) time with lower constant factor',
    ],
    expectedAnswer: 'O(n) time using O(1) average hash set lookups',
    sampleStrongResponse:
      'Replacing the inner linear scan with a hash set reduces lookup to O(1) average time, yielding O(n) total time and O(n) space.',
    rubricPoints: [
      'Identifies O(1) average lookup in hash set',
      'States overall O(n) time and O(n) auxiliary space',
    ],
  },
  {
    id: 'id-write-spec-1',
    languageId: 'python',
    drillType: 'write_from_spec',
    concept: 'functions',
    title: 'Write Function from Spec: Clamp Value',
    prompt:
      'Write code that clamps `x = 15` into the inclusive range `[0, 10]` and prints the clamped result (`10`).',
    starterCode: `x = 15\nclamped = min(10, max(0, x))\nprint(clamped)`,
    expectedAnswer: '10',
    sampleStrongResponse:
      'Using min(upper, max(lower, x)) handles both lower and upper bounds cleanly in O(1) time.',
    rubricPoints: [
      'Handles upper bound > 10',
      'Handles lower bound < 0',
      'Prints 10',
    ],
  },
  {
    id: 'id-explain-complexity-1',
    languageId: 'python',
    drillType: 'explain_complexity',
    concept: 'loops',
    title: 'Halving Loop Time Complexity',
    prompt: 'What is the time complexity of a loop that divides `n` by 2 on every iteration until `n <= 1`?',
    codeSnippet: `steps = 0\nwhile n > 1:\n    n = n // 2\n    steps += 1`,
    options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'],
    expectedAnswer: 'O(log n)',
    sampleStrongResponse:
      'O(log n) time and O(1) space because the problem size is halved on each step, requiring at most floor(log2(n)) iterations.',
    rubricPoints: [
      'Selects O(log n)',
      'Relates halving input size to base-2 logarithm',
    ],
  },
  {
    id: 'id-choose-ds-1',
    languageId: 'python',
    drillType: 'choose_data_structure',
    concept: 'dictionaries',
    title: 'Data Structure for O(1) Key-Value Cache Lookups',
    prompt:
      'You need to store user session tokens by ID and look them up in O(1) average time. Which data structure should you choose?',
    options: [
      'Hash Map / Dictionary (dict)',
      'Singly Linked List',
      'Unsorted Dynamic Array',
      'Binary Search Tree (unbalanced)',
    ],
    expectedAnswer: 'Hash Map / Dictionary (dict)',
    sampleStrongResponse:
      'A Hash Map (dict in Python, Map in JS/Go/Rust) provides O(1) average-case lookup, insertion, and deletion by key.',
    rubricPoints: [
      'Chooses Hash Map / Dictionary',
      'Notes O(1) average lookup complexity',
    ],
  },
  {
    id: 'id-walk-algo-1',
    languageId: 'python',
    drillType: 'walk_through_algorithm',
    concept: 'lists',
    title: 'Walk Through Selection of Maximum Element',
    prompt:
      'Trace `best` as the loop scans `[3, 9, 4, 12, 7]`. How many times is `best` updated after being initialized to `3`?',
    codeSnippet: `nums = [3, 9, 4, 12, 7]\nbest = nums[0]\nfor x in nums[1:]:\n    if x > best:\n        best = x`,
    options: ['2 times (to 9, then to 12)', '4 times', '1 time (directly to 12)', '5 times'],
    expectedAnswer: '2 times (to 9, then to 12)',
    sampleStrongResponse:
      'best starts at 3. When x=9, 9 > 3 so best becomes 9 (update 1). x=4 is skipped. When x=12, 12 > 9 so best becomes 12 (update 2). x=7 is skipped.',
    rubricPoints: [
      'Traces initial state best = 3',
      'Counts updates at 9 and 12 (2 updates total)',
    ],
  },
  {
    id: 'id-conceptual-1',
    languageId: 'python',
    drillType: 'conceptual_question',
    concept: 'variables',
    title: 'Mutability vs. Immutability in Function Arguments',
    prompt:
      'Explain the difference between passing an immutable value (like an integer or string) versus a mutable collection (like a list or dictionary) to a function.',
    expectedAnswer: 'mutable',
    requiredKeywords: ['mutable'],
    sampleStrongResponse:
      'Mutating a passed list or dictionary in-place modifies the caller’s object because both variables reference the same heap collection, whereas reassigning an immutable integer/string creates a new value locally.',
    rubricPoints: [
      'Distinguishes in-place mutation from variable reassignment',
      'Explains caller side-effects for mutable collections',
    ],
  },
  {
    id: 'id-behavioral-1',
    languageId: 'python',
    drillType: 'behavioral_answer',
    concept: 'debugging',
    title: 'Behavioral Drill: Debugging an Unexpected Failure',
    prompt:
      'Using the STAR method (Situation, Task, Action, Result), describe how you isolate and fix a bug when code produces unexpected output.',
    expectedAnswer: 'reproduce',
    requiredKeywords: [],
    sampleStrongResponse:
      'Situation/Task: Encountered a failing edge case in a calculation. Action: Reproduced the failure deterministically with a minimal input, inspected intermediate state at boundaries, and fixed the off-by-one condition. Result: Added a regression test to prevent recurrence.',
    rubricPoints: [
      'States the Situation & Task clearly',
      'Describes systematic Action (reproduce, isolate, fix)',
      'Shares measurable Result & prevention step',
    ],
  },
];

/**
 * Calibrates Interview Mode drills to the user's own studied concepts [3.2].
 */
export function getCalibratedInterviewDrills(
  db: UserDatabase
): { drill: InterviewDrill; isFromStudiedConcept: boolean }[] {
  const studiedConcepts = new Set<string>();
  Object.values(db.fsrsCards).forEach((card) => {
    studiedConcepts.add(card.conceptId.toLowerCase());
  });
  // Always include foundational concepts if user has completed at least 1 lesson
  if (studiedConcepts.size === 0) {
    studiedConcepts.add('variables');
    studiedConcepts.add('loops');
    studiedConcepts.add('conditionals');
  }

  return INTERVIEW_MODE_DRILLS.map((drill) => ({
    drill,
    isFromStudiedConcept: studiedConcepts.has(drill.concept.toLowerCase()),
  })).sort((a, b) => Number(b.isFromStudiedConcept) - Number(a.isFromStudiedConcept));
}

/**
 * Generates structured feedback for the optional N1 AI Interviewer [3.2].
 * Never issues any credential or numeric "score".
 */
export function buildAIInterviewerFeedback(
  problemTitle: string,
  concept: string,
  candidateApproach: string
): string {
  const lower = candidateApproach.toLowerCase();
  const mentionedComplexity =
    lower.includes('o(') ||
    lower.includes('linear') ||
    lower.includes('constant') ||
    lower.includes('log') ||
    lower.includes('time') ||
    lower.includes('space');
  const mentionedEdgeCases =
    lower.includes('empty') ||
    lower.includes('edge') ||
    lower.includes('null') ||
    lower.includes('zero') ||
    lower.includes('bound');

  const strengths: string[] = [
    `Clear articulation of the core "${concept}" approach for ${problemTitle}.`,
  ];
  if (mentionedComplexity) {
    strengths.push('Explicitly analyzed time/space complexity trade-offs.');
  }
  if (mentionedEdgeCases) {
    strengths.push('Proactively identified boundary and empty-input edge cases.');
  }

  const nextSteps: string[] = [];
  if (!mentionedComplexity) {
    nextSteps.push(
      'State both worst-case Time Complexity and Auxiliary Space Complexity in Big-O notation before writing code.'
    );
  }
  if (!mentionedEdgeCases) {
    nextSteps.push(
      'Call out boundary inputs (empty collection, single element, negative values) during your dry run.'
    );
  }
  if (nextSteps.length === 0) {
    nextSteps.push(
      'Walk through a 3-element trace out loud while coding to keep the interviewer aligned with your invariants.'
    );
  }

  return [
    `Structured Interview Feedback (${problemTitle}):`,
    '',
    '• What Worked Well:',
    ...strengths.map((s) => `  - ${s}`),
    '',
    '• Refinements for Next Round:',
    ...nextSteps.map((n) => `  - ${n}`),
    '',
    'Session transcript saved locally. No numeric score or credential is issued.',
  ].join('\n');
}
