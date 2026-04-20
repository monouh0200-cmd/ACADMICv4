// src/lib/logger.ts — Structured console logger (Sentry-free)
type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

function log(level: LogLevel, event: string, ctx?: LogContext) {
  const entry = { ts: new Date().toISOString(), level, event, ...ctx }
  const fn = level === 'error' ? console.error
           : level === 'warn'  ? console.warn
           : console.log
  fn(JSON.stringify(entry))
}

export const logger = {
  debug: (event: string, ctx?: LogContext) => log('debug', event, ctx),
  info:  (event: string, ctx?: LogContext) => log('info',  event, ctx),
  warn:  (event: string, ctx?: LogContext) => log('warn',  event, ctx),
  error: (event: string, ctx?: LogContext) => log('error', event, ctx),
}
