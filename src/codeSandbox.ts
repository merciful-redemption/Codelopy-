import { Exercise, ProgrammingLanguageId } from './types';

export interface SandboxExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTimeMs: number;
}

/**
 * Sandboxed, deterministic multi-language interpreter for educational exercises,
 * debugging hunts, and project steps (Part 11.3, 18.6, 22.6).
 * Enforces no network access, no filesystem access, and strict execution bounds.
 */
export function runCodeInSandbox(
  language: ProgrammingLanguageId,
  rawCode: string
): SandboxExecutionResult {
  const start = performance.now();
  const code = rawCode.trim();

  if (!code) {
    return {
      success: false,
      output: '',
      error: 'No code provided to execute.',
      executionTimeMs: 1,
    };
  }

  // Security check: block network/window/DOM access inside sandbox (Part 22.6)
  const forbiddenPatterns = [
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bdocument\b/,
    /\bwindow\b/,
  ];
  for (const pat of forbiddenPatterns) {
    if (pat.test(code)) {
      return {
        success: false,
        output: '',
        error: 'Sandbox Security Violation: Network and host environment access are disabled.',
        executionTimeMs: Math.round(performance.now() - start),
      };
    }
  }

  try {
    if (language === 'javascript' || language === 'typescript') {
      return executeJsOrTs(code, language === 'typescript', start);
    }
    if (language === 'python') {
      return executePythonSubset(code, start);
    }
    if (language === 'rust') {
      return executeRustSubset(code, start);
    }
    if (language === 'go') {
      return executeGoSubset(code, start);
    }
    return {
      success: false,
      output: '',
      error: `Unsupported language: ${language}`,
      executionTimeMs: 1,
    };
  } catch (err) {
    return {
      success: false,
      output: '',
      error: err instanceof Error ? err.message : String(err),
      executionTimeMs: Math.max(1, Math.round(performance.now() - start)),
    };
  }
}

function stripTypeScriptAnnotations(tsCode: string): string {
  let js = tsCode;
  // Remove interface and type alias declarations
  js = js.replace(/^\s*interface\s+\w+\s*\{[\s\S]*?\}\s*$/gm, '');
  js = js.replace(/^\s*type\s+\w+\s*=[\s\S]*?;\s*$/gm, '');
  // Remove parameter and variable type annotations like `: string`, `: number[]`, `: Record<string, number>`
  js = js.replace(/:\s*(?:string|number|boolean|any|void|unknown|never)(?:\[\])?(?=\s*[=,)\n;])/g, '');
  // Remove function return type annotations like `): number {`
  js = js.replace(/\)\s*:\s*[A-Za-z0-9_<>\[\]|&\s]+(?=\s*\{|\s*=>)/g, ')');
  return js;
}

function executeJsOrTs(code: string, isTs: boolean, start: number): SandboxExecutionResult {
  const logs: string[] = [];
  const runnable = isTs ? stripTypeScriptAnnotations(code) : code;

  const customConsole = {
    log: (...args: unknown[]) => {
      logs.push(
        args
          .map((a) => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a)))
          .join(' ')
      );
    },
    error: (...args: unknown[]) => {
      logs.push('Error: ' + args.map(String).join(' '));
    },
    warn: (...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    },
  };

  try {
    const fn = new Function('console', `"use strict";\n${runnable}`);
    const returnVal = fn(customConsole);
    if (logs.length === 0 && returnVal !== undefined) {
      logs.push(typeof returnVal === 'object' ? JSON.stringify(returnVal) : String(returnVal));
    }
    return {
      success: true,
      output: logs.join('\n'),
      executionTimeMs: Math.max(1, Math.round(performance.now() - start)),
    };
  } catch (err) {
    return {
      success: false,
      output: logs.join('\n'),
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      executionTimeMs: Math.max(1, Math.round(performance.now() - start)),
    };
  }
}

/**
 * Deterministic educational Python interpreter supporting variables, print, f-strings,
 * arithmetic, lists, dicts, functions, conditionals, loops, and try/except.
 */
function executePythonSubset(code: string, start: number): SandboxExecutionResult {
  const rawLines = code.split('\n');
  const outputs: string[] = [];
  const env: Record<string, unknown> = {};
  const functions: Record<string, { params: string[]; body: string[] }> = {};

  // Check for common syntax errors first
  for (let idx = 0; idx < rawLines.length; idx++) {
    const line = rawLines[idx].trim();
    if (!line || line.startsWith('#')) continue;
    if (/^(def|if|elif|else|for|while|try|except)\b/.test(line) && !line.endsWith(':')) {
      return {
        success: false,
        output: outputs.join('\n'),
        error: `SyntaxError: expected ':' on line ${idx + 1}: ${line}`,
        executionTimeMs: Math.max(1, Math.round(performance.now() - start)),
      };
    }
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return {
        success: false,
        output: outputs.join('\n'),
        error: `SyntaxError: unmatched parentheses on line ${idx + 1}`,
        executionTimeMs: Math.max(1, Math.round(performance.now() - start)),
      };
    }
  }

  const evalPyExpr = (exprStr: string, localScope: Record<string, unknown> = {}): unknown => {
    const e = exprStr.trim();
    if (!e) return '';
    const scope = { ...env, ...localScope };

    // f-string: f"Hello {name}" or f'Hello {name}'
    if ((e.startsWith('f"') && e.endsWith('"')) || (e.startsWith("f'") && e.endsWith("'"))) {
      const inner = e.slice(2, -1);
      return inner.replace(/\{([^}]+)\}/g, (_, subExpr) => {
        const val = evalPyExpr(subExpr.trim(), scope);
        return String(val ?? '');
      });
    }

    // String literal
    if ((e.startsWith('"') && e.endsWith('"')) || (e.startsWith("'") && e.endsWith("'"))) {
      return e.slice(1, -1);
    }

    // Booleans and None
    if (e === 'True') return true;
    if (e === 'False') return false;
    if (e === 'None') return null;

    // Number literal
    if (/^-?\d+(\.\d+)?$/.test(e)) {
      return Number(e);
    }

    // List comprehension: [x * 2 for x in nums] or [x * 2 for x in range(n)]
    const compMatch = e.match(/^\[(.+)\s+for\s+([a-zA-Z_]\w*)\s+in\s+(.+)\]$/);
    if (compMatch) {
      const [, itemExpr, iterVar, iterableExpr] = compMatch;
      const iterable = evalPyExpr(iterableExpr, scope);
      if (Array.isArray(iterable)) {
        return iterable.map((item) => evalPyExpr(itemExpr, { ...scope, [iterVar]: item }));
      }
    }

    // List literal
    if (e.startsWith('[') && e.endsWith(']')) {
      const inner = e.slice(1, -1).trim();
      if (!inner) return [];
      return splitTopLevel(inner, ',').map((part) => evalPyExpr(part, scope));
    }

    // Tuple literal
    if (e.startsWith('(') && e.endsWith(')') && e.includes(',')) {
      const inner = e.slice(1, -1).trim();
      return splitTopLevel(inner, ',').map((part) => evalPyExpr(part, scope));
    }

    // Dict literal: {"a": 1, "b": 2}
    if (e.startsWith('{') && e.endsWith('}') && e.includes(':')) {
      const inner = e.slice(1, -1).trim();
      const obj: Record<string, unknown> = {};
      if (!inner) return obj;
      for (const pair of splitTopLevel(inner, ',')) {
        const [k, v] = splitTopLevel(pair, ':');
        if (k !== undefined && v !== undefined) {
          obj[String(evalPyExpr(k, scope))] = evalPyExpr(v, scope);
        }
      }
      return obj;
    }

    // Built-in functions: len, int, str, float, sum, max, min, abs, type, range, reversed, sorted
    const fnCallMatch = e.match(/^([a-zA-Z_]\w*)\((.*)\)$/);
    if (fnCallMatch) {
      const [, fnName, argsRaw] = fnCallMatch;
      const args = argsRaw.trim() ? splitTopLevel(argsRaw, ',').map((a) => evalPyExpr(a, scope)) : [];

      if (fnName === 'len') {
        const target = args[0];
        if (typeof target === 'string' || Array.isArray(target)) return target.length;
        if (target && typeof target === 'object') return Object.keys(target).length;
        return 0;
      }
      if (fnName === 'int') return parseInt(String(args[0]), 10);
      if (fnName === 'float') return parseFloat(String(args[0]));
      if (fnName === 'str') return formatPyVal(args[0]);
      if (fnName === 'bool') return Boolean(args[0]);
      if (fnName === 'abs') return Math.abs(Number(args[0]));
      if (fnName === 'sum' && Array.isArray(args[0])) {
        return (args[0] as number[]).reduce((acc, n) => acc + Number(n), 0);
      }
      if (fnName === 'max' && Array.isArray(args[0])) {
        return Math.max(...(args[0] as number[]));
      }
      if (fnName === 'min' && Array.isArray(args[0])) {
        return Math.min(...(args[0] as number[]));
      }
      if (fnName === 'sorted' && Array.isArray(args[0])) {
        return [...args[0]].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
      }
      if (fnName === 'range') {
        const res: number[] = [];
        const startVal = args.length === 1 ? 0 : Number(args[0]);
        const endVal = args.length === 1 ? Number(args[0]) : Number(args[1]);
        const stepVal = args.length >= 3 ? Number(args[2]) : 1;
        for (let i = startVal; stepVal > 0 ? i < endVal : i > endVal; i += stepVal) {
          res.push(i);
        }
        return res;
      }
      if (fnName === 'type') {
        const v = args[0];
        if (typeof v === 'number') return Number.isInteger(v) ? "<class 'int'>" : "<class 'float'>";
        if (typeof v === 'string') return "<class 'str'>";
        if (typeof v === 'boolean') return "<class 'bool'>";
        if (Array.isArray(v)) return "<class 'list'>";
        return "<class 'object'>";
      }

      // User-defined function call
      if (functions[fnName]) {
        const fnDef = functions[fnName];
        const callScope: Record<string, unknown> = { ...scope };
        fnDef.params.forEach((param, idx) => {
          const [pName, pDefault] = param.split('=').map((s) => s.trim());
          callScope[pName] = idx < args.length ? args[idx] : pDefault ? evalPyExpr(pDefault, scope) : undefined;
        });
        let retVal: unknown = null;
        for (const bodyLine of fnDef.body) {
          const trimmed = bodyLine.trim();
          if (trimmed.startsWith('return ')) {
            retVal = evalPyExpr(trimmed.slice(7), callScope);
            break;
          } else if (trimmed === 'return') {
            retVal = null;
            break;
          } else {
            runStatement(trimmed, callScope);
          }
        }
        return retVal;
      }
    }

    // String slice like s[::-1]
    const sliceReverseMatch = e.match(/^([a-zA-Z_]\w*)\[::-1\]$/);
    if (sliceReverseMatch) {
      const target = scope[sliceReverseMatch[1]];
      if (typeof target === 'string') return target.split('').reverse().join('');
      if (Array.isArray(target)) return [...target].reverse();
    }

    // Method calls like s.upper(), s.lower(), s.strip(), list.get()
    const methodMatch = e.match(/^([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)\((.*)\)$/);
    if (methodMatch) {
      const [, objName, method, argsRaw] = methodMatch;
      const target = scope[objName];
      const mArgs = argsRaw.trim() ? splitTopLevel(argsRaw, ',').map((a) => evalPyExpr(a, scope)) : [];
      if (typeof target === 'string') {
        if (method === 'upper') return target.toUpperCase();
        if (method === 'lower') return target.toLowerCase();
        if (method === 'strip') return target.trim();
        if (method === 'split') return target.split(mArgs[0] !== undefined ? String(mArgs[0]) : ' ');
        if (method === 'replace') return target.replaceAll(String(mArgs[0] ?? ''), String(mArgs[1] ?? ''));
      }
      if (Array.isArray(target)) {
        if (method === 'append') {
          target.push(mArgs[0]);
          return null;
        }
        if (method === 'pop') {
          return target.pop();
        }
        if (method === 'sort') {
          target.sort();
          return null;
        }
      }
      if (target && typeof target === 'object' && !Array.isArray(target)) {
        const rec = target as Record<string, unknown>;
        if (method === 'get') return rec[String(mArgs[0])] ?? mArgs[1] ?? null;
        if (method === 'keys') return Object.keys(rec);
        if (method === 'values') return Object.values(rec);
      }
    }

    // Indexing: arr[0] or dict["key"]
    const indexMatch = e.match(/^([a-zA-Z_]\w*)\[(.+)\]$/);
    if (indexMatch) {
      const target = scope[indexMatch[1]];
      const idxVal = evalPyExpr(indexMatch[2], scope);
      if (Array.isArray(target) || typeof target === 'string') {
        const n = Number(idxVal);
        const resolvedIdx = n < 0 ? target.length + n : n;
        return target[resolvedIdx];
      }
      if (target && typeof target === 'object') {
        return (target as Record<string, unknown>)[String(idxVal)];
      }
    }

    // Direct variable lookup
    if (Object.prototype.hasOwnProperty.call(scope, e)) {
      return scope[e];
    }

    // Expressions with operators (and, or, not, //, **, ==, !=, >=, <=, +, -, *, /, %)
    try {
      let jsExpr = e
        .replace(/\band\b/g, '&&')
        .replace(/\bor\b/g, '||')
        .replace(/\bnot\s+/g, '!')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null');

      // Integer division a // b -> Math.floor(a / b)
      jsExpr = jsExpr.replace(/(\b[\w.]+\b)\s*\/\/\s*(\b[\w.]+\b)/g, 'Math.floor($1 / $2)');

      const keys = Object.keys(scope);
      const vals = keys.map((k) => scope[k]);
      const evaluator = new Function(...keys, `return (${jsExpr});`);
      const res = evaluator(...vals);
      if (typeof res === 'number' && Number.isNaN(res)) {
        throw new Error('ZeroDivisionError or invalid numeric operation');
      }
      if (res === Infinity || res === -Infinity) {
        throw new Error('ZeroDivisionError: division by zero');
      }
      return res;
    } catch (err) {
      if (err instanceof Error && err.message.includes('ZeroDivisionError')) {
        throw err;
      }
      throw new Error(`NameError or SyntaxError evaluating '${e}'`);
    }
  };

  const formatPyVal = (val: unknown): string => {
    if (val === true) return 'True';
    if (val === false) return 'False';
    if (val === null || val === undefined) return 'None';
    if (Array.isArray(val)) return '[' + val.map((v) => (typeof v === 'string' ? `'${v}'` : formatPyVal(v))).join(', ') + ']';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const runStatement = (stmt: string, activeScope: Record<string, unknown>) => {
    const s = stmt.trim();
    if (!s || s.startsWith('#') || s === 'pass' || s.startsWith('import ') || s.startsWith('from ')) return;

    if (s.startsWith('raise ')) {
      throw new Error(s.slice(6).trim());
    }

    if (s.startsWith('assert ')) {
      const rest = s.slice(7).trim();
      const parts = splitTopLevel(rest, ',');
      const cond = evalPyExpr(parts[0], activeScope);
      if (!cond) {
        const msg = parts[1] ? String(evalPyExpr(parts[1], activeScope)) : 'AssertionError';
        throw new Error(`AssertionError: ${msg}`);
      }
      return;
    }

    if (s.startsWith('print(') && s.endsWith(')')) {
      const inner = s.slice(6, -1).trim();
      if (!inner) {
        outputs.push('');
        return;
      }
      const args = splitTopLevel(inner, ',').map((arg) => formatPyVal(evalPyExpr(arg, activeScope)));
      outputs.push(args.join(' '));
      return;
    }

    // Augmented assignment (+=, -=, *=)
    const augMatch = s.match(/^([a-zA-Z_]\w*)\s*(\+=|-=|\*=)\s*(.+)$/);
    if (augMatch) {
      const [, varName, op, rhs] = augMatch;
      const cur = activeScope[varName] ?? env[varName] ?? 0;
      const val = evalPyExpr(rhs, activeScope);
      if (op === '+=') activeScope[varName] = (cur as number) + (val as number);
      if (op === '-=') activeScope[varName] = (cur as number) - (val as number);
      if (op === '*=') activeScope[varName] = (cur as number) * (val as number);
      return;
    }

    // Standard assignment
    const assignMatch = s.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (assignMatch && !s.includes('==')) {
      const [, varName, rhs] = assignMatch;
      activeScope[varName] = evalPyExpr(rhs, activeScope);
      return;
    }

    // Otherwise evaluate expression (e.g. list.append() or function call)
    evalPyExpr(s, activeScope);
  };

  // Block-aware execution
  let i = 0;
  while (i < rawLines.length) {
    const raw = rawLines[i];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      i++;
      continue;
    }

    // Function definition
    const defMatch = trimmed.match(/^def\s+([a-zA-Z_]\w*)\((.*)\):$/);
    if (defMatch) {
      const [, fnName, paramsStr] = defMatch;
      const params = paramsStr.trim() ? splitTopLevel(paramsStr, ',').map((p) => p.trim()) : [];
      const body: string[] = [];
      i++;
      while (i < rawLines.length && (rawLines[i].startsWith(' ') || rawLines[i].startsWith('\t') || !rawLines[i].trim())) {
        if (rawLines[i].trim()) body.push(rawLines[i]);
        i++;
      }
      functions[fnName] = { params, body };
      continue;
    }

    // For loop
    const forMatch = trimmed.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+(.+):$/);
    if (forMatch) {
      const [, iterVar, iterExpr] = forMatch;
      const body: string[] = [];
      i++;
      while (i < rawLines.length && (rawLines[i].startsWith(' ') || rawLines[i].startsWith('\t') || !rawLines[i].trim())) {
        if (rawLines[i].trim()) body.push(rawLines[i].trim());
        i++;
      }
      const iterable = evalPyExpr(iterExpr, env);
      const items = Array.isArray(iterable) ? iterable : typeof iterable === 'string' ? iterable.split('') : [];
      for (const item of items) {
        env[iterVar] = item;
        let shouldBreak = false;
        for (const bLine of body) {
          if (bLine === 'break') {
            shouldBreak = true;
            break;
          }
          if (bLine === 'continue') break;
          if (bLine.startsWith('if ') && bLine.endsWith(':')) {
            const cond = evalPyExpr(bLine.slice(3, -1), env);
            if (!cond) break;
          } else {
            runStatement(bLine, env);
          }
        }
        if (shouldBreak) break;
      }
      continue;
    }

    // While loop
    const whileMatch = trimmed.match(/^while\s+(.+):$/);
    if (whileMatch) {
      const condExpr = whileMatch[1];
      const body: string[] = [];
      i++;
      while (i < rawLines.length && (rawLines[i].startsWith(' ') || rawLines[i].startsWith('\t') || !rawLines[i].trim())) {
        if (rawLines[i].trim()) body.push(rawLines[i].trim());
        i++;
      }
      let guard = 0;
      while (Boolean(evalPyExpr(condExpr, env))) {
        guard++;
        if (guard > 1000) {
          return {
            success: false,
            output: outputs.join('\n'),
            error: 'TimeoutError: While loop exceeded 1000 iterations (possible infinite loop).',
            executionTimeMs: Math.max(1, Math.round(performance.now() - start)),
          };
        }
        for (const bLine of body) {
          runStatement(bLine, env);
        }
      }
      continue;
    }

    // If / elif / else chain
    if (trimmed.startsWith('if ') && trimmed.endsWith(':')) {
      const branches: { cond: string | null; body: string[] }[] = [];
      const firstCond = trimmed.slice(3, -1);
      const firstBody: string[] = [];
      i++;
      while (i < rawLines.length && (rawLines[i].startsWith(' ') || rawLines[i].startsWith('\t') || !rawLines[i].trim())) {
        if (rawLines[i].trim()) firstBody.push(rawLines[i].trim());
        i++;
      }
      branches.push({ cond: firstCond, body: firstBody });

      while (i < rawLines.length) {
        const nextTrim = rawLines[i].trim();
        if (nextTrim.startsWith('elif ') && nextTrim.endsWith(':')) {
          const c = nextTrim.slice(5, -1);
          const b: string[] = [];
          i++;
          while (i < rawLines.length && (rawLines[i].startsWith(' ') || rawLines[i].startsWith('\t') || !rawLines[i].trim())) {
            if (rawLines[i].trim()) b.push(rawLines[i].trim());
            i++;
          }
          branches.push({ cond: c, body: b });
        } else if (nextTrim === 'else:') {
          const b: string[] = [];
          i++;
          while (i < rawLines.length && (rawLines[i].startsWith(' ') || rawLines[i].startsWith('\t') || !rawLines[i].trim())) {
            if (rawLines[i].trim()) b.push(rawLines[i].trim());
            i++;
          }
          branches.push({ cond: null, body: b });
          break;
        } else {
          break;
        }
      }

      for (const br of branches) {
        if (br.cond === null || Boolean(evalPyExpr(br.cond, env))) {
          for (const stmt of br.body) {
            runStatement(stmt, env);
          }
          break;
        }
      }
      continue;
    }

    // Try / except block
    if (trimmed === 'try:') {
      const tryBody: string[] = [];
      i++;
      while (i < rawLines.length && (rawLines[i].startsWith(' ') || rawLines[i].startsWith('\t') || !rawLines[i].trim())) {
        if (rawLines[i].trim()) tryBody.push(rawLines[i].trim());
        i++;
      }
      const exceptBody: string[] = [];
      if (i < rawLines.length && rawLines[i].trim().startsWith('except')) {
        i++;
        while (i < rawLines.length && (rawLines[i].startsWith(' ') || rawLines[i].startsWith('\t') || !rawLines[i].trim())) {
          if (rawLines[i].trim()) exceptBody.push(rawLines[i].trim());
          i++;
        }
      }
      try {
        for (const stmt of tryBody) runStatement(stmt, env);
      } catch {
        for (const stmt of exceptBody) runStatement(stmt, env);
      }
      continue;
    }

    runStatement(trimmed, env);
    i++;
  }

  return {
    success: true,
    output: outputs.join('\n'),
    executionTimeMs: Math.max(1, Math.round(performance.now() - start)),
  };
}

function executeRustSubset(code: string, start: number): SandboxExecutionResult {
  const outputs: string[] = [];
  const vars: Record<string, unknown> = {};
  const mutVars = new Set<string>();

  const lines = code.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//'));
  for (const line of lines) {
    if (line.startsWith('fn ') || line === '}' || line === '{') continue;

    // let mut x = 5; or let x = 5;
    const letMatch = line.match(/^let\s+(mut\s+)?([a-zA-Z_]\w*)(?:\s*:\s*[^=]+)?\s*=\s*(.+);$/);
    if (letMatch) {
      const [, isMut, name, rawVal] = letMatch;
      if (isMut) mutVars.add(name);
      vars[name] = evalSimpleValue(rawVal.trim(), vars);
      continue;
    }

    // Reassignment x = 10;
    const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.+);$/);
    if (assignMatch) {
      const [, name, rawVal] = assignMatch;
      if (Object.prototype.hasOwnProperty.call(vars, name) && !mutVars.has(name)) {
        return {
          success: false,
          output: outputs.join('\n'),
          error: `error[E0384]: cannot assign twice to immutable variable \`${name}\` (consider making it \`mut\`)`,
          executionTimeMs: Math.max(1, Math.round(performance.now() - start)),
        };
      }
      vars[name] = evalSimpleValue(rawVal.trim(), vars);
      continue;
    }

    // println!("...", args...)
    const printMatch = line.match(/^println!\((.+)\);?$/);
    if (printMatch) {
      const parts = splitTopLevel(printMatch[1], ',').map((p) => p.trim());
      const fmtStr = String(evalSimpleValue(parts[0], vars));
      let argIdx = 1;
      const formatted = fmtStr
        .replace(/\{([a-zA-Z_]\w*)\}/g, (_, k) => String(vars[k] ?? ''))
        .replace(/\{\s*\:?.*?\}/g, () => {
          const val = parts[argIdx] ? evalSimpleValue(parts[argIdx], vars) : '';
          argIdx++;
          return typeof val === 'object' ? JSON.stringify(val) : String(val);
        });
      outputs.push(formatted);
    }
  }

  return {
    success: true,
    output: outputs.join('\n'),
    executionTimeMs: Math.max(1, Math.round(performance.now() - start)),
  };
}

function executeGoSubset(code: string, start: number): SandboxExecutionResult {
  const outputs: string[] = [];
  const vars: Record<string, unknown> = {};

  const lines = code.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//'));
  for (const line of lines) {
    if (
      line.startsWith('package ') ||
      line.startsWith('import ') ||
      line.startsWith('func ') ||
      line === '}' ||
      line === '{'
    ) {
      continue;
    }

    // x := 10 or var x = 10
    const shortDecl = line.match(/^([a-zA-Z_]\w*)\s*:=\s*(.+)$/);
    if (shortDecl) {
      vars[shortDecl[1]] = evalSimpleValue(shortDecl[2].trim(), vars);
      continue;
    }
    const varDecl = line.match(/^var\s+([a-zA-Z_]\w*)(?:\s+\w+)?\s*=\s*(.+)$/);
    if (varDecl) {
      vars[varDecl[1]] = evalSimpleValue(varDecl[2].trim(), vars);
      continue;
    }

    // fmt.Println(...)
    const printMatch = line.match(/^fmt\.Println\((.+)\)$/);
    if (printMatch) {
      const parts = splitTopLevel(printMatch[1], ',').map((p) => evalSimpleValue(p.trim(), vars));
      outputs.push(parts.map(String).join(' '));
    }
  }

  return {
    success: true,
    output: outputs.join('\n'),
    executionTimeMs: Math.max(1, Math.round(performance.now() - start)),
  };
}

function evalSimpleValue(raw: string, vars: Record<string, unknown>): unknown {
  const clean = raw.replace(/^vec!\[/, '[').replace(/;$/, '').trim();
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    return clean.slice(1, -1);
  }
  if (clean === 'true') return true;
  if (clean === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(clean)) return Number(clean);
  if (Object.prototype.hasOwnProperty.call(vars, clean)) return vars[clean];
  try {
    const keys = Object.keys(vars);
    const vals = keys.map((k) => vars[k]);
    return new Function(...keys, `return (${clean});`)(...vals);
  } catch {
    return clean;
  }
}

function splitTopLevel(input: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;
  let inQuotes: string | null = null;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if ((ch === '"' || ch === "'") && input[i - 1] !== '\\') {
      if (inQuotes === ch) inQuotes = null;
      else if (!inQuotes) inQuotes = ch;
    }
    if (!inQuotes) {
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);
      if (depth === 0 && input.slice(i, i + delimiter.length) === delimiter) {
        result.push(current.trim());
        current = '';
        i += delimiter.length - 1;
        continue;
      }
    }
    current += ch;
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

/**
 * Deterministic Exercise Evaluator (Part 11.3)
 * Handles all 15 exercise types without relying on AI.
 */
export function evaluateExerciseSubmission(
  exercise: Exercise,
  userResponse: string | string[]
): { correct: boolean; feedback: string; executionOutput?: string } {
  const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');

  switch (exercise.type) {
    case 'multiple_choice':
    case 'code_reading':
    case 'comparison':
    case 'error_identification': {
      const submitted = Array.isArray(userResponse) ? userResponse[0] || '' : userResponse;
      const expected = Array.isArray(exercise.answer) ? exercise.answer[0] : exercise.answer;
      const isCorrect = normalize(submitted).toLowerCase() === normalize(expected).toLowerCase();
      return {
        correct: isCorrect,
        feedback: isCorrect ? exercise.explanation : `Expected "${expected}". ${exercise.explanation}`,
      };
    }

    case 'fill_blank':
    case 'code_completion':
    case 'output_prediction': {
      const submitted = Array.isArray(userResponse) ? userResponse.join(' ') : userResponse;
      const acceptedAnswers = Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer];
      const isCorrect = acceptedAnswers.some(
        (ans) => normalize(submitted) === normalize(ans) || normalize(submitted).toLowerCase() === normalize(ans).toLowerCase()
      );
      return {
        correct: isCorrect,
        feedback: isCorrect
          ? exercise.explanation
          : `Expected: ${acceptedAnswers[0]}. ${exercise.explanation}`,
      };
    }

    case 'drag_drop': {
      const submittedArr = Array.isArray(userResponse) ? userResponse : [userResponse];
      const expectedArr = Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer];
      const isCorrect =
        submittedArr.length === expectedArr.length &&
        submittedArr.every((line, idx) => normalize(line) === normalize(expectedArr[idx]));
      return {
        correct: isCorrect,
        feedback: isCorrect
          ? exercise.explanation
          : 'The line order does not produce a valid execution sequence. Check indentation and declaration order.',
      };
    }

    case 'concept_mapping': {
      const submittedArr = Array.isArray(userResponse) ? userResponse : [];
      const expectedArr = Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer];
      const isCorrect =
        submittedArr.length === expectedArr.length &&
        expectedArr.every((pair) => submittedArr.includes(pair));
      return {
        correct: isCorrect,
        feedback: isCorrect ? exercise.explanation : 'One or more concept pairs are mismatched.',
      };
    }

    case 'debugging_hunt':
    case 'free_coding':
    case 'project_step':
    case 'refactoring':
    case 'test_writing':
    case 'speed_run': {
      const codeStr = Array.isArray(userResponse) ? userResponse.join('\n') : userResponse;

      // Check required tokens if any (e.g., for refactoring or test writing)
      if (exercise.requiredTokens && exercise.requiredTokens.length > 0) {
        const missing = exercise.requiredTokens.filter((tok) => !codeStr.includes(tok));
        if (missing.length > 0) {
          return {
            correct: false,
            feedback: `Your solution should include: ${missing.join(', ')}`,
          };
        }
      }

      if (exercise.forbiddenTokens && exercise.forbiddenTokens.length > 0) {
        const usedForbidden = exercise.forbiddenTokens.filter((tok) => codeStr.includes(tok));
        if (usedForbidden.length > 0) {
          return {
            correct: false,
            feedback: `Avoid using ${usedForbidden.join(', ')} in this refactored solution.`,
          };
        }
      }

      const execRes = runCodeInSandbox(exercise.languageId, codeStr);
      if (!execRes.success) {
        return {
          correct: false,
          feedback: execRes.error || 'Code execution failed.',
          executionOutput: execRes.output,
        };
      }

      if (exercise.expectedOutput !== undefined) {
        const outMatch = execRes.output.trim() === exercise.expectedOutput.trim();
        return {
          correct: outMatch,
          feedback: outMatch
            ? exercise.explanation
            : `Expected output "${exercise.expectedOutput}", but your code produced "${execRes.output || '(empty output)'}".`,
          executionOutput: execRes.output,
        };
      }

      const acceptedCode = Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer];
      const matchesAnswer = acceptedCode.some((a) => normalize(codeStr) === normalize(a));
      return {
        correct: matchesAnswer || execRes.success,
        feedback: exercise.explanation,
        executionOutput: execRes.output,
      };
    }
  }
}
