import { config } from '../config.js'
import { getNewLLM } from './getNewLLM.js'

export const generateSrcFileDescription = async (content: string, file: string) => {
  const llm = getNewLLM()
  const response = await llm.chat({
    model: config.llm.models.small,
    messages: [
      {
        role: 'system',
        content: `You are an AI which generates a short summarization for the file \`${file}\`
        It will be used by an AI RAG.
        Also include a detailed list of defined dependencies.
        Include all defined exports with a description of the purpose.
        A general example is not required`,
        /*
        content: `You are an AI which generates documentation for the file ${file}

1. Analyze the code to understand its structure and functionality.
2. Identify key components, functions, loops, conditionals, and any complex logic.

Explain and describe:
- the used dependencies
- the exports
- functions / methods
- classes with all public, private and protected methods, getters and setters
- exported type and/or interface definitions

Do not mention them if they are not present in the file.

The description for functions and methods should also include a description of input parameter and output/result.
`,
*/
      },
      { role: 'user', content },
    ],
    stream: false,
    options: {
      temperature: 0,
      top_k: 40,
      repeat_penalty: 1.1,
      top_p: 0.95,
    },
  })

  return response.message.content
}
