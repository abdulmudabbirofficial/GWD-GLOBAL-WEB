/**
 * Minimal structured logger: one JSON object per line on stdout/stderr, which
 * every log platform (CloudWatch, Datadog, Vercel, Loki…) ingests natively.
 * Sensitive keys are redacted recursively before serialisation.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';
type Context = Record<string, unknown>;

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const REDACT = /pass(word)?|secret|token|authorization|cookie|session|api[-_]?key/i;

function threshold(): number {
  const configured = (process.env.LOG_LEVEL ?? 'info') as Level;
  return LEVELS[configured] ?? LEVELS.info;
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== 'object') return value;
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: process.env.NODE_ENV === 'production' ? undefined : value.stack };
  }
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Context = {};
  for (const [k, v] of Object.entries(value)) out[k] = REDACT.test(k) ? '[redacted]' : redact(v, depth + 1);
  return out;
}

function write(level: Level, message: string, context?: Context) {
  if (LEVELS[level] < threshold()) return;
  const line = JSON.stringify({ level, time: new Date().toISOString(), message, ...(context ? (redact(context) as Context) : {}) });
  if (level === 'error' || level === 'warn') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

export interface Logger {
  debug(message: string, context?: Context): void;
  info(message: string, context?: Context): void;
  warn(message: string, context?: Context): void;
  error(message: string, context?: Context): void;
  child(bindings: Context): Logger;
}

function create(bindings: Context = {}): Logger {
  const merge = (c?: Context) => ({ ...bindings, ...c });
  return {
    debug: (m, c) => write('debug', m, merge(c)),
    info: (m, c) => write('info', m, merge(c)),
    warn: (m, c) => write('warn', m, merge(c)),
    error: (m, c) => write('error', m, merge(c)),
    child: (b) => create({ ...bindings, ...b }),
  };
}

export const logger = create({ service: 'gwd-web' });
