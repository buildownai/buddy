import { config } from '../config.js'
import { llmDefaultOptions } from '../defaults/llmDefaultOptions.js'
import { getNewLLM } from './getNewLLM.js'

export const applyChanges = async (
  _projectId: string,
  originalContent: string,
  contentToApply: string
) => {
  const llm = getNewLLM()

  const response = await llm.chat.completions.create({
    model: config.llm.models.chat,
    messages: [
      {
        role: 'system',
        content: `You are an AI applies code changes on existing code.

# Instructions:

- Apply the given given code changes to the original content
- Ensure that no code gets lost
- Ensure that the code result is valid and correct
- Unchanged code must have the same formatting as in the original code
- Return only the code as plain text
- Return the full and complete code.
- It is not permitted to shorten the output and unchanged code must always be returned
- do not add any thoughts or explanations
- return only plain code without any backtick or markdown
    `,
      },
      {
        role: 'user',
        content: `Here is the original code

${originalContent}

---
Here are the code changes to apply:

${contentToApply}
    `,
      },
    ],
    stream: true,
    ...llmDefaultOptions,
  })

  return response
}
