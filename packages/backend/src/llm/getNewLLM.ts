import OpenAI from 'openai'
import { config } from '../config.js'

export const getNewLLM = () =>
  new OpenAI({
    apiKey: config.llm.apiKey,
    baseURL: config.llm.url,
  })
