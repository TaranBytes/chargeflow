// Tiny structured logger. Swap for pino/winston when you outgrow this.
const ts = () => new Date().toISOString()

function format(level, args) {
  return [`[${ts()}]`, `[${level}]`, ...args]
}

export const logger = {
  info: (...a) => console.log(...format('info', a)),
  warn: (...a) => console.warn(...format('warn', a)),
  error: (...a) => console.error(...format('error', a)),
  debug: (...a) => {
    if (process.env.NODE_ENV !== 'production') console.debug(...format('debug', a))
  },
}
