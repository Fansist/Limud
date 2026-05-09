type Level = 'debug' | 'info' | 'warn' | 'error';
const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function currentThreshold(): number {
  const raw = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug')).toLowerCase();
  return LEVELS[raw as Level] ?? LEVELS.info;
}

function emit(level: Level, scope: string, msg: string, meta?: unknown) {
  if (LEVELS[level] < currentThreshold()) return;
  const line = `[${level.toUpperCase()}][${scope}] ${msg}`;
  if (level === 'error') console.error(line, meta ?? '');
  else if (level === 'warn') console.warn(line, meta ?? '');
  else console.log(line, meta ?? '');
}

export const log = {
  debug: (scope: string, msg: string, meta?: unknown) => emit('debug', scope, msg, meta),
  info:  (scope: string, msg: string, meta?: unknown) => emit('info',  scope, msg, meta),
  warn:  (scope: string, msg: string, meta?: unknown) => emit('warn',  scope, msg, meta),
  error: (scope: string, msg: string, meta?: unknown) => emit('error', scope, msg, meta),
};
