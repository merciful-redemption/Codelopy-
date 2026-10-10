import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Bug,
  Check,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Lock,
  MessageSquare,
  Play,
  RefreshCw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { runCodeInSandbox } from '../codeSandbox';
import {
  ALGORITHM_GYM_ITEMS,
  buildAIInterviewerFeedback,
  computeMonthlyChallengeProgress,
  getCalibratedInterviewDrills,
  INTERVIEW_DRILL_TYPE_META,
  MONTHLY_CHALLENGE_POOL,
} from '../loopwrightV3Data';
import {
  AIInterviewTranscript,
  AlgorithmGymItem,
  AppScreen,
  InterviewDrill,
  InterviewDrillType,
  MonthlyChallengeId,
  UserDatabase,
  UserHuntRecord,
} from '../types';

interface MonthlyChallengeCardProps {
  db: UserDatabase;
  cardSurfaceClass: string;
  onSwapChallenge: (newId: MonthlyChallengeId) => void;
  onClaimReward: () => void;
}

/**
 * ADDITION 2: MONTHLY CHALLENGE [3.1]
 * Rendered after Weekly Quests when enabled in Settings (off by default).
 */
export const MonthlyChallengeCard: React.FC<MonthlyChallengeCardProps> = ({
  db,
  cardSurfaceClass,
  onSwapChallenge,
  onClaimReward,
}) => {
  const [showSwapPicker, setShowSwapPicker] = useState(false);
  const mc = computeMonthlyChallengeProgress(db);
  const pct = Math.min(100, Math.round((mc.current / Math.max(1, mc.target)) * 100));

  return (
    <div className={`${cardSurfaceClass} p-5 rounded-3xl flex flex-col justify-between gap-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold">Monthly Challenge</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#4A6FDC]/15 text-[#4A6FDC] font-semibold">
              {mc.monthKey}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{mc.description}</p>
        </div>
        <span className="text-xs font-mono font-semibold text-[#2ECC71] whitespace-nowrap">
          +500 XP · +1 Freeze
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">{mc.title}</span>
          <span className="font-mono tabular-nums">
            {mc.current} / {mc.target}
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-[#4A6FDC] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {!mc.swappedThisMonth ? (
          <button
            type="button"
            onClick={() => setShowSwapPicker((s) => !s)}
            className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:border-[#4A6FDC]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Swap Challenge (1 left this month)</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-500">
            Monthly swap used for {mc.monthKey}
          </span>
        )}

        {mc.completed && !mc.rewardClaimed && (
          <button
            type="button"
            onClick={onClaimReward}
            className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#2ECC71] text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Claim +500 XP & Freeze</span>
          </button>
        )}
        {mc.rewardClaimed && (
          <span className="text-xs font-semibold text-[#2ECC71] flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Monthly Reward Claimed</span>
          </span>
        )}
      </div>

      {showSwapPicker && !mc.swappedThisMonth && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex flex-col gap-2">
          <div className="text-xs font-semibold text-slate-500">
            Select a replacement challenge from the authored pool (once per month):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MONTHLY_CHALLENGE_POOL.filter((item) => item.id !== mc.challengeId).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSwapChallenge(item.id);
                  setShowSwapPicker(false);
                }}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#4A6FDC] text-left flex flex-col gap-0.5"
              >
                <span className="text-xs font-semibold">{item.title}</span>
                <span className="text-[11px] text-slate-500 line-clamp-1">{item.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface PracticeHubViewProps {
  db: UserDatabase;
  cardSurfaceClass: string;
  onNavigate: (screen: AppScreen) => void;
  onCompleteInterviewDrill: (drillId: string, xpReward: number) => void;
  onSaveInterviewTranscript: (transcript: AIInterviewTranscript) => void;
  onCompleteGymItem: (gymId: string, xpReward: number) => void;
  onClearMistakeEntry: (entryId: string, reflectionNote: string) => void;
  onUpdateMistakeNote: (entryId: string, reflectionNote: string) => void;
}

export const PracticeHubView: React.FC<PracticeHubViewProps> = ({
  db,
  cardSurfaceClass,
  onNavigate,
  onCompleteInterviewDrill,
  onSaveInterviewTranscript,
  onCompleteGymItem,
  onClearMistakeEntry,
  onUpdateMistakeNote,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'gyms' | 'interview' | 'mistakes'
  >('overview');

  // Algorithm Gym state
  const [selectedGym, setSelectedGym] = useState<AlgorithmGymItem>(ALGORITHM_GYM_ITEMS[0]);
  const [gymCode, setGymCode] = useState<string>(
    ALGORITHM_GYM_ITEMS[0].starterCodeByLang[db.activeLanguage]
  );
  const [gymResult, setGymResult] = useState<{ passed: boolean; output: string } | null>(null);

  // [3.2] Interview Mode state
  const calibratedDrills = getCalibratedInterviewDrills(db);
  const [selectedDrillType, setSelectedDrillType] = useState<InterviewDrillType | 'all'>('all');
  const [activeDrill, setActiveDrill] = useState<InterviewDrill>(calibratedDrills[0].drill);
  const [drillInput, setDrillInput] = useState<string>(
    calibratedDrills[0].drill.starterCode || ''
  );
  const [drillFeedback, setDrillFeedback] = useState<{
    passed: boolean;
    message: string;
  } | null>(null);

  // [3.2] Optional AI Interviewer (Requires N1) state
  const hasN1Provider = Boolean(db.aiConfig.provider);
  const [interviewModeTab, setInterviewModeTab] = useState<'drills' | 'ai_interviewer'>('drills');
  const [candidateApproachText, setCandidateApproachText] = useState<string>('');
  const [activeTranscript, setActiveTranscript] = useState<AIInterviewTranscript | null>(null);

  // Mistake Journal state
  const [resolvingMistakeId, setResolvingMistakeId] = useState<string | null>(null);
  const [mistakeRetryInput, setMistakeRetryInput] = useState<string>('');
  const [mistakeRetryError, setMistakeRetryError] = useState<string | null>(null);

  const completedDrillsCount = (db.completedInterviewDrillIds || []).length;
  const activeMistakes = (db.mistakeJournal || []).filter((m) => !m.cleared);
  const clearedMistakes = (db.mistakeJournal || []).filter((m) => m.cleared);

  const filteredDrills = calibratedDrills.filter(
    (d) => selectedDrillType === 'all' || d.drill.drillType === selectedDrillType
  );

  const selectDrill = (drill: InterviewDrill) => {
    setActiveDrill(drill);
    setDrillInput(drill.starterCode || '');
    setDrillFeedback(null);
  };

  const evaluateCurrentDrill = () => {
    const trimmed = drillInput.trim();
    if (!trimmed) {
      setDrillFeedback({
        passed: false,
        message: 'Provide an answer, code solution, or explanation first.',
      });
      return;
    }

    let passed = false;
    if (activeDrill.options && activeDrill.options.length > 0) {
      passed = trimmed === activeDrill.expectedAnswer;
    } else if (activeDrill.starterCode) {
      const exec = runCodeInSandbox(trimmed, db.activeLanguage);
      passed = exec.success && exec.output.trim() === activeDrill.expectedAnswer.trim();
    } else if (activeDrill.requiredKeywords && activeDrill.requiredKeywords.length > 0) {
      const lower = trimmed.toLowerCase();
      passed = activeDrill.requiredKeywords.some((kw) => lower.includes(kw.toLowerCase()));
    } else {
      passed = trimmed.split(/\s+/).length >= 6;
    }

    if (passed) {
      onCompleteInterviewDrill(activeDrill.id, 75);
      setDrillFeedback({
        passed: true,
        message: `Strong response (+75 XP). Model reference: ${activeDrill.sampleStrongResponse}`,
      });
    } else {
      setDrillFeedback({
        passed: false,
        message: `Not quite yet. Review the rubric points and try again.`,
      });
    }
  };

  const startNewAIInterviewSession = () => {
    const chosen = calibratedDrills[0]?.drill || INTERVIEW_MODE_DRILLS_FALLBACK;
    const nowIso = new Date().toISOString();
    const newSession: AIInterviewTranscript = {
      id: `ai-int-${Date.now()}`,
      languageId: db.activeLanguage,
      concept: chosen.concept,
      problemTitle: chosen.title,
      status: 'awaiting_approach',
      createdAt: nowIso,
      turns: [
        {
          id: `turn-1-${Date.now()}`,
          role: 'interviewer',
          stage: 'problem_pose',
          content: `Problem (${chosen.concept.toUpperCase()}): ${chosen.prompt}${
            chosen.codeSnippet ? `\n\n${chosen.codeSnippet}` : ''
          }\n\nBefore writing code, please explain your high-level approach and state the worst-case time and space complexity.`,
          createdAt: nowIso,
        },
      ],
    };
    setActiveTranscript(newSession);
    setCandidateApproachText('');
  };

  const submitCandidateApproachToAI = () => {
    if (!activeTranscript || !candidateApproachText.trim()) return;
    const nowIso = new Date().toISOString();
    const feedbackText = buildAIInterviewerFeedback(
      activeTranscript.problemTitle,
      activeTranscript.concept,
      candidateApproachText
    );
    const updated: AIInterviewTranscript = {
      ...activeTranscript,
      status: 'completed',
      completedAt: nowIso,
      turns: [
        ...activeTranscript.turns,
        {
          id: `turn-cand-${Date.now()}`,
          role: 'candidate',
          stage: 'approach_and_complexity',
          content: candidateApproachText.trim(),
          createdAt: nowIso,
        },
        {
          id: `turn-fb-${Date.now() + 1}`,
          role: 'interviewer',
          stage: 'structured_feedback',
          content: feedbackText,
          createdAt: nowIso,
        },
      ],
    };
    setActiveTranscript(updated);
    onSaveInterviewTranscript(updated);
    onCompleteInterviewDrill(`ai-session-${updated.id}`, 75);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Practice Hub</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Deliberate practice across Debugging Hunts, Algorithm &amp; CS Gyms, Interview Mode, and your Mistake Journal.
            </p>
          </div>
        </div>

        {/* Sub-navigation tabs inside Practice Hub */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/80 dark:border-slate-800">
          {(
            [
              { id: 'overview', label: 'Hub Overview' },
              { id: 'gyms', label: 'Algorithm & CS Gyms' },
              { id: 'interview', label: 'Interview Mode' },
              {
                id: 'mistakes',
                label: `Mistake Journal (${activeMistakes.length} active / ${clearedMistakes.length} cleared)`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-[#4A6FDC] text-white'
                  : 'border border-slate-200 dark:border-slate-700 hover:border-[#4A6FDC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ====================================================================
          SUB-TAB 1: PRACTICE HUB OVERVIEW (Ordered per Loopwright v3.1)
         ==================================================================== */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Debugging Hunts */}
          <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col justify-between gap-4`}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#F6B93B] font-semibold">
                  BUG ISOLATION &amp; REPAIR
                </span>
                <Bug className="w-5 h-5 text-[#F6B93B]" />
              </div>
              <h2 className="text-lg font-bold">Debugging Hunts</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Inspect broken code across Easy, Medium, and Hard hunts. Locate the defective line and verify the fix in the local sandbox.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-slate-500">
                {(Object.values(db.hunts) as UserHuntRecord[]).filter((h) => h.completed).length} hunts solved
              </span>
              <button
                type="button"
                onClick={() => onNavigate('debugging_hunts')}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#4A6FDC] text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Open Debugging Hunts</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Algorithm and CS Gyms */}
          <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col justify-between gap-4`}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#2ECC71] font-semibold">
                  DSA &amp; COMPLEXITY DRILLS
                </span>
                <Cpu className="w-5 h-5 text-[#2ECC71]" />
              </div>
              <h2 className="text-lg font-bold">Algorithm and CS Gyms</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Focused data structure and algorithmic complexity drills covering Two Pointers, Hash Maps, Stacks, Recursion, and Binary Search.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-slate-500">
                {(db.completedGymIds || []).length} / {ALGORITHM_GYM_ITEMS.length} gyms completed
              </span>
              <button
                type="button"
                onClick={() => setActiveSubTab('gyms')}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#4A6FDC] text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Enter CS Gyms</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. INTERVIEW MODE (Directly after Algorithm and CS gyms) */}
          <div
            className={`${cardSurfaceClass} md:col-span-2 p-6 rounded-3xl border-2 border-[#4A6FDC]/40 flex flex-col justify-between gap-4`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#4A6FDC] font-semibold">
                    TECHNICAL ROLE PREPARATION TRACK
                  </span>
                </div>
                <h2 className="text-xl font-bold">Interview Mode</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  An optional drill surface on top of your studied concepts and DSA course. Practice all 10 technical and behavioral drill types offline for <strong>+75 XP per drill</strong>, or launch the optional <strong>AI Interviewer</strong> with local transcript storage.
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-bold text-[#2ECC71]">+75 XP / Completed Drill</span>
                <span className="text-[11px] font-mono text-slate-500">
                  {completedDrillsCount} drills completed · Badge Tier:{' '}
                  {completedDrillsCount >= 30
                    ? 'Interview Ready III'
                    : completedDrillsCount >= 15
                    ? 'Interview Ready II'
                    : completedDrillsCount >= 5
                    ? 'Interview Ready I'
                    : `${completedDrillsCount}/5 to Tier I`}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {Object.values(INTERVIEW_DRILL_TYPE_META)
                  .slice(0, 5)
                  .map((m) => (
                    <span
                      key={m.label}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium"
                    >
                      {m.label}
                    </span>
                  ))}
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium">
                  +5 more drill types
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab('interview')}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#4A6FDC] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <span>Launch Interview Mode</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4. Mistake Journal */}
          <div className={`${cardSurfaceClass} md:col-span-2 p-6 rounded-3xl flex flex-col justify-between gap-4`}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#E74C3C] font-semibold">
                  ERROR REFLECTION &amp; RECOVERY
                </span>
                <BookOpen className="w-5 h-5 text-[#E74C3C]" />
              </div>
              <h2 className="text-lg font-bold">Mistake Journal</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Every missed exercise or hunt is captured locally. Write reflection notes and re-solve entries to clear them toward your Monthly Challenge.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-slate-500">
                {activeMistakes.length} active · {clearedMistakes.length} cleared
              </span>
              <button
                type="button"
                onClick={() => setActiveSubTab('mistakes')}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:border-[#4A6FDC]"
              >
                <span>Open Mistake Journal</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 2: ALGORITHM & CS GYMS
         ==================================================================== */}
      {activeSubTab === 'gyms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 flex flex-col gap-2.5">
            {ALGORITHM_GYM_ITEMS.map((item) => {
              const isDone = (db.completedGymIds || []).includes(item.id);
              const isSelected = selectedGym.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedGym(item);
                    setGymCode(item.starterCodeByLang[db.activeLanguage]);
                    setGymResult(null);
                  }}
                  className={`${cardSurfaceClass} p-4 rounded-2xl text-left flex items-center justify-between gap-3 ${
                    isSelected ? 'ring-2 ring-[#4A6FDC]' : ''
                  }`}
                >
                  <div>
                    <div className="text-xs font-mono text-[#4A6FDC]">
                      Time: {item.timeComplexityTarget} · Space: {item.spaceComplexityTarget}
                    </div>
                    <div className="text-sm font-bold mt-0.5">{item.title}</div>
                  </div>
                  {isDone && <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className={`${cardSurfaceClass} lg:col-span-8 p-6 rounded-3xl flex flex-col gap-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono text-[#2ECC71] font-semibold">
                  Target Complexity: {selectedGym.timeComplexityTarget} Time ·{' '}
                  {selectedGym.spaceComplexityTarget} Space
                </span>
                <h2 className="text-xl font-bold mt-0.5">{selectedGym.title}</h2>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                {db.activeLanguage.toUpperCase()}
              </span>
            </div>

            <p className="text-sm leading-relaxed">{selectedGym.prompt}</p>

            <textarea
              value={gymCode}
              onChange={(e) => setGymCode(e.target.value)}
              rows={6}
              className="w-full p-4 rounded-2xl bg-[#0F172A] text-slate-100 font-mono text-xs leading-relaxed border border-slate-700"
            />

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const res = runCodeInSandbox(gymCode, db.activeLanguage);
                  const passed =
                    res.success && res.output.trim() === selectedGym.expectedOutput.trim();
                  setGymResult({
                    passed,
                    output: res.error || res.output || '(no output)',
                  });
                  if (passed) {
                    onCompleteGymItem(selectedGym.id, 60);
                  }
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#4A6FDC] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Play className="w-4 h-4" />
                <span>Run &amp; Verify Gym (+60 XP)</span>
              </button>
            </div>

            {gymResult && (
              <div
                className={`p-4 rounded-2xl border text-xs ${
                  gymResult.passed
                    ? 'border-[#2ECC71] bg-[#2ECC71]/10 text-[#2ECC71]'
                    : 'border-[#E74C3C] bg-[#E74C3C]/10 text-[#E74C3C]'
                }`}
              >
                <div className="font-bold">
                  {gymResult.passed ? 'Complexity & Output Verified! (+60 XP)' : 'Output Mismatch'}
                </div>
                <div className="font-mono mt-1">Stdout: {gymResult.output}</div>
                <div className="mt-2 text-slate-600 dark:text-slate-300">
                  {selectedGym.explanation}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 3: ADDITION 1 — INTERVIEW MODE [3.2]
          10 Drill Types + Studied Concept Calibration + Optional N1 AI Interviewer
         ==================================================================== */}
      {activeSubTab === 'interview' && (
        <div className="flex flex-col gap-5">
          {/* Top Mode Bar: Offline 10-Type Drills (N0) vs Optional AI Interviewer (N1) */}
          <div className={`${cardSurfaceClass} p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4`}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInterviewModeTab('drills')}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  interviewModeTab === 'drills'
                    ? 'bg-[#4A6FDC] text-white'
                    : 'border border-slate-200 dark:border-slate-700'
                }`}
              >
                10 Offline Drill Types (+75 XP)
              </button>
              <button
                type="button"
                onClick={() => setInterviewModeTab('ai_interviewer')}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  interviewModeTab === 'ai_interviewer'
                    ? 'bg-[#4A6FDC] text-white'
                    : 'border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Optional AI Interviewer</span>
              </button>
            </div>

            {/* Interview Ready I / II / III Badge Family Progress */}
            <div className="flex items-center gap-3 text-xs">
              <Award className="w-4 h-4 text-[#F6B93B]" />
              <span className="font-semibold">
                Drills Completed: <strong className="tabular-nums">{completedDrillsCount}</strong>
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-[11px]">
                Tier I (5) {completedDrillsCount >= 5 ? '✓' : ''} · Tier II (15){' '}
                {completedDrillsCount >= 15 ? '✓' : ''} · Tier III (30){' '}
                {completedDrillsCount >= 30 ? '✓' : ''}
              </span>
            </div>
          </div>

          {interviewModeTab === 'drills' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Sidebar: Filter by the 10 Drill Types */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className={`${cardSurfaceClass} p-4 rounded-2xl flex flex-col gap-2`}>
                  <label className="text-xs font-bold text-slate-500">
                    Filter by Drill Type (10 Hub Drill Types)
                  </label>
                  <select
                    value={selectedDrillType}
                    onChange={(e) => {
                      const val = e.target.value as InterviewDrillType | 'all';
                      setSelectedDrillType(val);
                      const nextList = calibratedDrills.filter(
                        (d) => val === 'all' || d.drill.drillType === val
                      );
                      if (nextList[0]) selectDrill(nextList[0].drill);
                    }}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-semibold"
                  >
                    <option value="all">All 10 Interview Drill Types</option>
                    {(Object.keys(INTERVIEW_DRILL_TYPE_META) as InterviewDrillType[]).map((k) => (
                      <option key={k} value={k}>
                        {INTERVIEW_DRILL_TYPE_META[k].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  {filteredDrills.map(({ drill, isFromStudiedConcept }) => {
                    const isDone = (db.completedInterviewDrillIds || []).includes(drill.id);
                    const isSelected = activeDrill.id === drill.id;
                    const meta = INTERVIEW_DRILL_TYPE_META[drill.drillType];
                    return (
                      <button
                        key={drill.id}
                        type="button"
                        onClick={() => selectDrill(drill)}
                        className={`${cardSurfaceClass} p-3.5 rounded-2xl text-left flex flex-col gap-1 transition-all ${
                          isSelected ? 'ring-2 ring-[#4A6FDC]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-[#4A6FDC] font-semibold">
                            {meta.label}
                          </span>
                          {isDone ? (
                            <span className="text-[11px] font-mono text-[#2ECC71] font-bold">
                              +75 XP ✓
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-400">+75 XP</span>
                          )}
                        </div>
                        <div className="text-sm font-bold">{drill.title}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>Concept: {drill.concept}</span>
                          {isFromStudiedConcept && (
                            <span className="px-1.5 py-0.5 rounded bg-[#2ECC71]/15 text-[#2ECC71] font-medium">
                              Studied Concept
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Workspace: Active Interview Drill */}
              <div
                className={`${cardSurfaceClass} lg:col-span-8 p-6 rounded-3xl flex flex-col justify-between gap-5`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#4A6FDC]/15 text-[#4A6FDC] text-xs font-mono font-bold">
                        {INTERVIEW_DRILL_TYPE_META[activeDrill.drillType].label}
                      </span>
                      <span className="text-xs text-slate-500">
                        Concept: <strong>{activeDrill.concept}</strong>
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#2ECC71]">
                      Reward: 75 XP
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">{activeDrill.title}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {activeDrill.prompt}
                    </p>
                  </div>

                  {activeDrill.codeSnippet && (
                    <pre className="p-4 rounded-2xl bg-[#0F172A] text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
                      <code>{activeDrill.codeSnippet}</code>
                    </pre>
                  )}

                  {/* Drill Input Surface: Options OR Code/Text Response */}
                  {activeDrill.options && activeDrill.options.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeDrill.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setDrillInput(opt)}
                          className={`min-h-[48px] p-3.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                            drillInput === opt
                              ? 'border-[#4A6FDC] bg-[#4A6FDC]/15 text-[#4A6FDC]'
                              : 'border-slate-200 dark:border-slate-700 hover:border-[#4A6FDC]/50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500">
                        {activeDrill.starterCode
                          ? 'Your Code Solution (Verified in Local Sandbox):'
                          : 'Your Technical / Behavioral Explanation:'}
                      </label>
                      <textarea
                        value={drillInput}
                        onChange={(e) => setDrillInput(e.target.value)}
                        rows={5}
                        placeholder="Write your code or structured explanation here..."
                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-xs leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Self-Check Rubric Points */}
                  <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 flex flex-col gap-1.5">
                    <span className="text-xs font-bold">Target Interview Rubric:</span>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc pl-4 space-y-1">
                      {activeDrill.rubricPoints.map((pt) => (
                        <li key={pt}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setDrillInput(activeDrill.expectedAnswer)}
                      className="text-xs text-slate-500 underline hover:text-[#4A6FDC]"
                    >
                      Fill Reference Solution
                    </button>
                    <button
                      type="button"
                      onClick={evaluateCurrentDrill}
                      className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#4A6FDC] text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Submit Drill (+75 XP)</span>
                    </button>
                  </div>

                  {drillFeedback && (
                    <div
                      className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                        drillFeedback.passed
                          ? 'border-[#2ECC71] bg-[#2ECC71]/10 text-[#2ECC71]'
                          : 'border-[#E74C3C] bg-[#E74C3C]/10 text-[#E74C3C]'
                      }`}
                    >
                      {drillFeedback.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Optional AI Interviewer (Requires N1) [3.2] */
            <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-5`}>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold">Interactive AI Interviewer</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Poses one problem at a time from your studied concepts, waits for your approach and complexity analysis, and gives structured feedback. Transcripts are stored locally. Never issues any credential or numeric score.
                  </p>
                </div>
                {hasN1Provider && (
                  <button
                    type="button"
                    onClick={startNewAIInterviewSession}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-[#4A6FDC] text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>New Interview Session</span>
                  </button>
                )}
              </div>

              {!hasN1Provider ? (
                <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center gap-3">
                  <Lock className="w-8 h-8 text-slate-400" />
                  <h3 className="text-base font-bold">
                    Connect an AI Provider to Start Interactive Interviews
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                    All 10 Interview Mode drill types work 100% offline without AI. To enable the interactive AI Interviewer, connect a local (Ollama / LM Studio) or cloud AI provider in AI Setup.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('ai_setup')}
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-[#4A6FDC] text-white text-xs font-bold"
                  >
                    Configure AI Provider in AI Setup
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-7 flex flex-col gap-4">
                    {!activeTranscript ? (
                      <div className="p-6 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 flex flex-col items-start gap-3">
                        <div className="text-sm font-bold">
                          Ready to start a 1-on-1 problem &amp; complexity discussion
                        </div>
                        <p className="text-xs text-slate-500">
                          Click &ldquo;New Interview Session&rdquo; to receive a problem drawn from your studied concepts.
                        </p>
                        <button
                          type="button"
                          onClick={startNewAIInterviewSession}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#4A6FDC] text-white text-xs font-bold"
                        >
                          Start Session Now
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {activeTranscript.turns.map((turn) => (
                          <div
                            key={turn.id}
                            className={`p-4 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed ${
                              turn.role === 'interviewer'
                                ? 'bg-slate-100 dark:bg-slate-800'
                                : 'bg-[#4A6FDC]/15 border border-[#4A6FDC]/30'
                            }`}
                          >
                            <div className="font-mono text-[10px] uppercase text-slate-500 mb-1">
                              {turn.role === 'interviewer'
                                ? `AI Interviewer (${turn.stage})`
                                : 'Your Approach & Complexity Analysis'}
                            </div>
                            {turn.content}
                          </div>
                        ))}

                        {activeTranscript.status === 'awaiting_approach' && (
                          <div className="flex flex-col gap-2 pt-2">
                            <textarea
                              value={candidateApproachText}
                              onChange={(e) => setCandidateApproachText(e.target.value)}
                              rows={4}
                              placeholder="Describe your algorithm approach, edge cases, and Big-O time/space complexity..."
                              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                            />
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={submitCandidateApproachToAI}
                                className="min-h-[42px] px-5 py-2 rounded-xl bg-[#4A6FDC] text-white text-xs font-bold"
                              >
                                Submit Approach &amp; Complexity (+75 XP)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Saved Local Transcripts */}
                  <div className="lg:col-span-5 flex flex-col gap-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Local Session Transcripts ({(db.interviewTranscripts || []).length})
                    </h3>
                    {(db.interviewTranscripts || []).length === 0 ? (
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                        No completed AI Interviewer transcripts saved yet.
                      </div>
                    ) : (
                      (db.interviewTranscripts || []).map((tr) => (
                        <button
                          key={tr.id}
                          type="button"
                          onClick={() => setActiveTranscript(tr)}
                          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#4A6FDC] text-left flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono text-[#4A6FDC]">
                            <span>{tr.concept.toUpperCase()}</span>
                            <span>{new Date(tr.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs font-bold">{tr.problemTitle}</div>
                          <div className="text-[11px] text-slate-500">
                            {tr.turns.length} turns · Stored locally
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 4: MISTAKE JOURNAL (Feeds Monthly Challenge "Clear 15 entries")
         ==================================================================== */}
      {activeSubTab === 'mistakes' && (
        <div className={`${cardSurfaceClass} p-6 rounded-3xl flex flex-col gap-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Mistake Journal</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every incorrect exercise or debugging hunt is logged here. Add reflection notes and re-solve the prompt to clear the entry.
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-xl bg-[#2ECC71]/15 text-[#2ECC71] font-semibold">
              Cleared: {clearedMistakes.length} / 15 Monthly Challenge Target
            </span>
          </div>

          {(db.mistakeJournal || []).length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-[#2ECC71]" />
              <div className="text-sm font-bold">Zero Unresolved Mistakes</div>
              <p className="text-xs text-slate-500 max-w-md">
                Whenever you miss an exercise during a lesson or debugging hunt, Loopwright automatically records it here so you can reflect and clear it.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {(db.mistakeJournal || []).map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-[#4A6FDC]">
                        {entry.languageId.toUpperCase()} · {entry.concept}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          entry.cleared
                            ? 'bg-[#2ECC71]/15 text-[#2ECC71]'
                            : 'bg-[#E74C3C]/15 text-[#E74C3C]'
                        }`}
                      >
                        {entry.cleared ? 'Cleared ✓' : 'Needs Review'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-sm font-semibold">{entry.prompt}</div>
                  <div className="text-xs text-slate-500">
                    <strong>Target Solution:</strong>{' '}
                    <code className="font-mono text-[#2ECC71]">{entry.correctAnswer}</code> —{' '}
                    {entry.explanation}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={entry.reflectionNote}
                      onChange={(e) => onUpdateMistakeNote(entry.id, e.target.value)}
                      placeholder="Write a note on why this happened..."
                      className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                    />
                    {!entry.cleared && (
                      <button
                        type="button"
                        onClick={() => {
                          setResolvingMistakeId(entry.id);
                          setMistakeRetryInput('');
                          setMistakeRetryError(null);
                        }}
                        className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#4A6FDC] text-white text-xs font-semibold shrink-0"
                      >
                        Re-Solve to Clear
                      </button>
                    )}
                  </div>

                  {resolvingMistakeId === entry.id && !entry.cleared && (
                    <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 flex flex-col gap-2">
                      <label className="text-xs font-semibold">
                        Type the correct answer (<code className="font-mono">{entry.correctAnswer}</code>) to verify &amp; clear this entry:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={mistakeRetryInput}
                          onChange={(e) => setMistakeRetryInput(e.target.value)}
                          className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              mistakeRetryInput.trim().toLowerCase() ===
                              entry.correctAnswer.trim().toLowerCase()
                            ) {
                              onClearMistakeEntry(entry.id, entry.reflectionNote);
                              setResolvingMistakeId(null);
                            } else {
                              setMistakeRetryError('Answer does not match target solution yet.');
                            }
                          }}
                          className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#2ECC71] text-white text-xs font-bold"
                        >
                          Verify &amp; Clear (+25 XP)
                        </button>
                      </div>
                      {mistakeRetryError && (
                        <span className="text-xs text-[#E74C3C]">{mistakeRetryError}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const INTERVIEW_MODE_DRILLS_FALLBACK: InterviewDrill = {
  id: 'fallback-drill',
  languageId: 'python',
  drillType: 'explain_code',
  concept: 'loops',
  title: 'Accumulator Loop & Early Termination',
  prompt: 'Explain how an accumulator loop with a break condition works and state its time complexity.',
  expectedAnswer: 'O(n)',
  sampleStrongResponse: 'Runs in O(n) worst-case time and O(1) auxiliary space.',
  rubricPoints: ['Explains loop invariant', 'States O(n) time and O(1) space'],
};
