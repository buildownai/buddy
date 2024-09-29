import { config } from '../config.js'
import { getNewLLM } from './getNewLLM.js'

/*
const extractMiddlePart = (
  original: string,
  completion: string,
  prefix: string,
  suffix: string
): string => {
  // Extract the part of the completion that comes after the prefix and before the suffix
  let startIndex = 0
  if (completion.startsWith(prefix)) {
    console.log('starts with')
    startIndex = completion.indexOf(prefix) + prefix.length
  }

  let endIndex = completion.length - 1
  if (completion.endsWith(suffix)) {
    endIndex = completion.length - 1 - suffix.length - 1
  }

  // Return the middle part (filled content)
  return completion.slice(startIndex, endIndex).trim()
}
*/

export const fillInTheMiddleCode = async (
  projectId: string,
  content: string,
  suffix: string,
  language: string
) => {
  const llm = getNewLLM()

  const response = await llm.chat({
    model: config.llm.models.code,
    messages: [
      {
        role: 'system',
        content: `You are a ${language} code generator wich fills in the middle marked as <FIM>.
The users language is english.
Return only the code which is replacing <FIM>.
If you can not fill in the middle, return a empty response.
Do not return the content before or after <FIM>.
Return the only code as plain text.
`,
      },
      { role: 'user', content: `${content}<FIM>${suffix}` },
    ],
    stream: false,
    options: {
      temperature: 0,
    },
  })

  const regex = /```(?:\w+)?\n([\s\S]*?)\n```/

  const answer = response.message.content

  const match = answer.match(regex)

  return match ? match[1] : answer

  //return extractMiddlePart(`${content}${suffix}`, fullContent, content, suffix)
}
