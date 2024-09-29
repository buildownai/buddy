import { Ollama } from 'ollama'
import { config } from '../config.js'

export const getNewLLM = () => new Ollama({ host: config.llm.url })
