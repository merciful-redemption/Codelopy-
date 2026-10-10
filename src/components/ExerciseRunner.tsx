import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
  Timer,
  XCircle,
} from 'lucide-react';
import { evaluateExerciseSubmission, runCodeInSandbox } from '../codeSandbox';
import { getExerciseXpReward } from '../learningEngine';
import { Exercise } from '../types';

interface ExerciseRunnerProps {
  exercise: Exercise;
  onComplete: (correct: boolean, xpEarned: number, elapsedSeconds: number, isSpeedRun: boolean) => void;
  onSkip: () => void;
  onAskTutor?: (codeContext: string) => void;
}

const EXERCISE_TYPE_LABELS: Record<Exercise['type'], string> = {
  multiple_choice: 'Multiple Choice',
  fill_blank: 'Fill in the Blank',
  drag_drop: 'Arrange Lines',
  code_reading: 'Code Reading',
  debugging_hunt: 'Debugging Hunt',
  free_coding: 'Free Coding',
  comparison: 'Efficiency Comparison',
  concept_mapping: 'Concept Mapping',
  project_step: 'Project Step',
  speed_run: '60s Speed Run',
  code_completion: 'Code Completion',
  output_prediction: 'Output Prediction',
  error_identification: 'Error Identification',
  refactoring: 'Code Refactoring',
  test_writing: 'Test Writing',
};

export const ExerciseRunner: React.FC<ExerciseRunnerProps> = ({
  exercise,
  onComplete,
  onSkip,
  onAskTutor,
}) => {
  const isCodeEditorType =
    exercise.type === 'free_coding' ||
    exercise.type === 'debugging_hunt' ||
    exercise.type === 'project_step' ||
    exercise.type === 'refactoring' ||
    exercise.type === 'test_writing' ||
    exercise.type === 'speed_run';

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [codeValue, setCodeValue] = useState<string>(exercise.starterCode ?? '');
  const [dragOrder, setDragOrder] = useState<string[]>(exercise.dragLines ?? []);
  const [selectedLeftConcept, setSelectedLeftConcept] = useState<string | null>(null);
  const [mappedPairs, setMappedPairs] = useState<Record<string, string>>({});

  const [sandboxOutput, setSandboxOutput] = useState<string | null>(null);
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [showHintIndex, setShowHintIndex] = useState<number>(-1);
  const [evaluationResult, setEvaluationResult] = useState<{
    submitted: boolean;
    correct: boolean;
    feedback: string;
    xp: number;
  } | null>(null);

  const [startTimeMs, setStartTimeMs] = useState<number>(Date.now());
  const [speedRunRemaining, setSpeedRunRemaining] = useState<number>(60);

  // Reset state whenever the exercise changes
  useEffect(() => {
    setSelectedOption('');
    setTextAnswer('');
    setCodeValue(exercise.starterCode ?? '');
    setDragOrder(exercise.dragLines ? [...exercise.dragLines] : []);
    setSelectedLeftConcept(null);
    setMappedPairs({});
    setSandboxOutput(null);
    setSandboxError(null);
    setShowHintIndex(-1);
    setEvaluationResult(null);
    setStartTimeMs(Date.now());
    setSpeedRunRemaining(60);
  }, [exercise.id, exercise.starterCode, exercise.dragLines]);

  // Speed Run 60-second countdown timer
  useEffect(() => {
    if (exercise.type !== 'speed_run' || evaluationResult?.submitted) return;
    const interval = window.setInterval(() => {
      setSpeedRunRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [exercise.type, evaluationResult?.submitted]);

  const handleRunSandbox = () => {
    const res = runCodeInSandbox(exercise.languageId, codeValue);
    setSandboxOutput(res.output || (res.success ? '(Executed with no stdout)' : ''));
    setSandboxError(res.error ?? null);
  };

  const handleResetCode = () => {
    setCodeValue(exercise.starterCode ?? '');
    setSandboxOutput(null);
    setSandboxError(null);
    setEvaluationResult(null);
  };

  const moveDragLine = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= dragOrder.length) return;
    const copy = [...dragOrder];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setDragOrder(copy);
  };

  const handleSubmit = () => {
    let responsePayload: string | string[] = '';

    if (
      exercise.type === 'multiple_choice' ||
      exercise.type === 'code_reading' ||
      exercise.type === 'comparison' ||
      exercise.type === 'error_identification'
    ) {
      responsePayload = selectedOption;
    } else if (
      exercise.type === 'fill_blank' ||
      exercise.type === 'code_completion' ||
      exercise.type === 'output_prediction'
    ) {
      responsePayload = textAnswer;
    } else if (exercise.type === 'drag_drop') {
      responsePayload = dragOrder;
    } else if (exercise.type === 'concept_mapping') {
      responsePayload = Object.entries(mappedPairs).map(([k, v]) => `${k}->${v}`);
    } else if (isCodeEditorType) {
      responsePayload = codeValue;
    }

    const res = evaluateExerciseSubmission(exercise, responsePayload);
    if (res.executionOutput !== undefined) {
      setSandboxOutput(res.executionOutput);
    }
    const xp = res.correct ? getExerciseXpReward(exercise.difficulty) : 0;
    setEvaluationResult({
      submitted: true,
      correct: res.correct,
      feedback: res.feedback,
      xp,
    });
  };

  const handleNextAfterFeedback = () => {
    if (!evaluationResult) return;
    const elapsedSec = Math.max(1, Math.round((Date.now() - startTimeMs) / 1000));
    onComplete(
      evaluationResult.correct,
      evaluationResult.xp,
      elapsedSec,
      exercise.type === 'speed_run' && speedRunRemaining > 0
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Metadata row (Zero-pill unboxed typography per Frontend Constitution) */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#4A6FDC]">
            {EXERCISE_TYPE_LABELS[exercise.type]}
          </span>
          <span aria-hidden="true">·</span>
          <span>Concept: {exercise.concept}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">+{getExerciseXpReward(exercise.difficulty)} XP</span>
        </div>
        {exercise.type === 'speed_run' && (
          <div className="flex items-center gap-1.5 font-mono font-semibold text-[#E74C3C] tabular-nums">
            <Timer className="w-4 h-4" />
            <span>{speedRunRemaining}s</span>
          </div>
        )}
      </div>

      {/* Exercise Prompt (Part 7.5: Large, clear) */}
      <h3 className="text-lg md:text-xl font-semibold leading-snug text-balance">
        {exercise.prompt}
      </h3>

      {/* Code Snippet Display for reading/prediction/error exercises */}
      {exercise.codeSnippet && !isCodeEditorType && (
        <pre className="p-4 rounded-xl bg-[#2C3E50] text-[#ECF0F1] font-mono text-sm overflow-x-auto leading-relaxed">
          <code>{exercise.codeSnippet}</code>
        </pre>
      )}

      {/* Comparison Type Side-by-Side Snippets */}
      {exercise.type === 'comparison' && exercise.comparisonOptions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-[#2C3E50] text-[#ECF0F1] font-mono text-xs">
            <div className="text-[#F6B93B] font-sans font-semibold mb-1.5">Implementation A</div>
            <pre className="whitespace-pre-wrap">{exercise.comparisonOptions.codeA}</pre>
          </div>
          <div className="p-3.5 rounded-xl bg-[#2C3E50] text-[#ECF0F1] font-mono text-xs">
            <div className="text-[#2ECC71] font-sans font-semibold mb-1.5">Implementation B</div>
            <pre className="whitespace-pre-wrap">{exercise.comparisonOptions.codeB}</pre>
          </div>
        </div>
      )}

      {/* Interactive Input Zone by Exercise Type */}
      {(exercise.type === 'multiple_choice' ||
        exercise.type === 'code_reading' ||
        exercise.type === 'error_identification' ||
        exercise.type === 'comparison') && (
        <div className="flex flex-col gap-2.5">
          {(exercise.options || exercise.comparisonOptions?.reasons || []).map((opt) => {
            const isSelected = selectedOption === opt;
            return (
              <button
                key={opt}
                type="button"
                disabled={evaluationResult?.submitted}
                onClick={() => setSelectedOption(opt)}
                className={`min-h-[48px] w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-transform active:scale-[0.98] flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-[#4A6FDC] bg-[#4A6FDC]/10 text-[#4A6FDC] dark:text-blue-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 hover:border-[#4A6FDC]/50'
                }`}
              >
                <span>{opt}</span>
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-[#4A6FDC] bg-[#4A6FDC] text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {(exercise.type === 'fill_blank' ||
        exercise.type === 'code_completion' ||
        exercise.type === 'output_prediction') && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {exercise.type === 'output_prediction'
              ? 'Type the exact console output:'
              : 'Type the missing code:'}
          </label>
          <input
            type="text"
            value={textAnswer}
            disabled={evaluationResult?.submitted}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder={
              exercise.type === 'output_prediction' ? 'e.g. 42' : 'Type your code answer here...'
            }
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent font-mono text-sm focus:outline-none focus:border-[#4A6FDC]"
          />
        </div>
      )}

      {exercise.type === 'drag_drop' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use the up and down controls to arrange the lines in execution order:
          </p>
          {dragOrder.map((line, idx) => (
            <div
              key={`${line}-${idx}`}
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
            >
              <code className="font-mono text-sm">{line}</code>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0 || evaluationResult?.submitted}
                  onClick={() => moveDragLine(idx, -1)}
                  aria-label="Move line up"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === dragOrder.length - 1 || evaluationResult?.submitted}
                  onClick={() => moveDragLine(idx, 1)}
                  aria-label="Move line down"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {exercise.type === 'concept_mapping' && exercise.mappingPairs && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-500">1. Tap a Concept</span>
            {exercise.mappingPairs.map((pair) => {
              const isActive = selectedLeftConcept === pair.concept;
              const isMatched = Boolean(mappedPairs[pair.concept]);
              return (
                <button
                  key={pair.id}
                  type="button"
                  disabled={evaluationResult?.submitted}
                  onClick={() => setSelectedLeftConcept(pair.concept)}
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border text-left font-mono text-xs transition-colors ${
                    isActive
                      ? 'border-[#4A6FDC] bg-[#4A6FDC]/15 font-semibold'
                      : isMatched
                      ? 'border-[#2ECC71] bg-[#2ECC71]/10'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div>{pair.concept}</div>
                  {mappedPairs[pair.concept] && (
                    <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400 mt-1 truncate">
                      → {mappedPairs[pair.concept]}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-500">2. Tap Matching Definition</span>
            {exercise.mappingPairs.map((pair) => (
              <button
                key={pair.id + '-def'}
                type="button"
                disabled={!selectedLeftConcept || evaluationResult?.submitted}
                onClick={() => {
                  if (!selectedLeftConcept) return;
                  setMappedPairs((prev) => ({
                    ...prev,
                    [selectedLeftConcept]: pair.definition,
                  }));
                  setSelectedLeftConcept(null);
                }}
                className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs hover:border-[#4A6FDC] disabled:opacity-50"
              >
                {pair.definition}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Code Editor + Run + Output Panel (Part 7.5 & 17.4) */}
      {isCodeEditorType && (
        <div className="flex flex-col rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-[#1E293B] text-slate-100">
          <div className="flex items-center justify-between px-3.5 py-2 bg-[#0F172A] border-b border-slate-700 text-xs">
            <span className="font-mono text-slate-300">
              {exercise.languageId} · Sandbox Editor
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetCode}
                className="min-h-[36px] px-2.5 py-1 rounded-lg text-slate-300 hover:bg-slate-800 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={handleRunSandbox}
                className="min-h-[36px] px-3 py-1 rounded-lg bg-[#2ECC71] text-slate-950 font-semibold flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run</span>
              </button>
            </div>
          </div>

          <div className="flex">
            {/* Line numbers */}
            <div
              className="py-3 px-2.5 text-right font-mono text-xs text-slate-500 select-none bg-[#0F172A]/50 border-r border-slate-800"
              aria-hidden="true"
            >
              {(codeValue.split('\n') || ['']).map((_, i) => (
                <div key={i} className="leading-6">
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              value={codeValue}
              disabled={evaluationResult?.submitted}
              onChange={(e) => setCodeValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  const nextVal = codeValue.substring(0, start) + '    ' + codeValue.substring(end);
                  setCodeValue(nextVal);
                }
              }}
              rows={Math.max(4, codeValue.split('\n').length + 1)}
              spellCheck={false}
              aria-label="Code editor"
              className="w-full p-3 font-mono text-sm leading-6 bg-transparent text-slate-100 focus:outline-none resize-y"
            />
          </div>

          {/* Sandbox Output Panel */}
          {(sandboxOutput !== null || sandboxError !== null) && (
            <div className="px-4 py-3 bg-[#0F172A] border-t border-slate-800 font-mono text-xs">
              <div className="text-[11px] text-slate-400 mb-1">Output Panel</div>
              {sandboxOutput && <pre className="text-[#2ECC71] whitespace-pre-wrap">{sandboxOutput}</pre>}
              {sandboxError && <pre className="text-[#E74C3C] whitespace-pre-wrap mt-1">{sandboxError}</pre>}
            </div>
          )}
        </div>
      )}

      {/* Hint Drawer */}
      {showHintIndex >= 0 && exercise.hints.length > 0 && (
        <div className="p-3.5 rounded-xl border border-[#F6B93B]/50 bg-[#F6B93B]/10 text-sm">
          <div className="font-semibold text-[#D97706] dark:text-[#F6B93B] text-xs mb-1">
            Hint {showHintIndex + 1} of {exercise.hints.length}
          </div>
          <p>{exercise.hints[showHintIndex]}</p>
        </div>
      )}

      {/* Immediate Deterministic Evaluation Feedback Banner (Part 7.6 & 11.4) */}
      {evaluationResult && (
        <div
          role="status"
          className={`p-4 rounded-2xl border transition-all duration-200 ${
            evaluationResult.correct
              ? 'border-[#2ECC71] bg-[#2ECC71]/15 text-slate-900 dark:text-slate-100'
              : 'border-[#E74C3C] bg-[#E74C3C]/15 text-slate-900 dark:text-slate-100'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {evaluationResult.correct ? (
                <CheckCircle2 className="w-5 h-5 text-[#2ECC71] shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-[#E74C3C] shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {evaluationResult.correct
                    ? `Correct! +${evaluationResult.xp} XP`
                    : 'Not quite right'}
                </div>
                <p className="text-xs md:text-sm mt-1 opacity-90">{evaluationResult.feedback}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Controls (Submit / Next / Hint / Skip) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {exercise.hints.length > 0 && !evaluationResult?.submitted && (
            <button
              type="button"
              onClick={() =>
                setShowHintIndex((prev) => Math.min(exercise.hints.length - 1, prev + 1))
              }
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 hover:border-[#F6B93B] transition-colors whitespace-nowrap shrink-0"
            >
              <HelpCircle className="w-4 h-4 text-[#F6B93B]" />
              <span>Hint</span>
            </button>
          )}
          {onAskTutor && (
            <button
              type="button"
              onClick={() => onAskTutor(isCodeEditorType ? codeValue : exercise.prompt)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium hover:border-[#4A6FDC] transition-colors whitespace-nowrap shrink-0"
            >
              Ask AI Tutor
            </button>
          )}
          {!evaluationResult?.submitted && (
            <button
              type="button"
              onClick={onSkip}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 whitespace-nowrap shrink-0"
            >
              Skip
            </button>
          )}
        </div>

        {!evaluationResult?.submitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#4A6FDC] hover:bg-[#3b5ec7] text-white font-semibold text-sm active:scale-95 transition-transform whitespace-nowrap shrink-0"
          >
            Submit Answer
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {!evaluationResult.correct && (
              <button
                type="button"
                onClick={() => setEvaluationResult(null)}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold whitespace-nowrap shrink-0"
              >
                Try Again
              </button>
            )}
            <button
              type="button"
              onClick={handleNextAfterFeedback}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#2ECC71] text-slate-950 font-bold text-sm active:scale-95 transition-transform whitespace-nowrap shrink-0"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
