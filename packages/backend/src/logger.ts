import pino from 'pino'
import { config } from './config.js'

const transport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    ignore: 'pid,hostname',
  },
})

const logger = pino(
  {
    level: config.environment === 'development' ? 'debug' : 'info',
  },
  config.environment === 'development' ? transport : undefined
)

export default logger
