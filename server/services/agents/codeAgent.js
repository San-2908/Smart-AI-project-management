const axios = require('axios');

class CodeAgent {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = "https://openrouter.ai/api/v1/chat/completions";
    this.model = "meta-llama/llama-3-8b-instruct";
  }

  async generateCode(task, techStack) {
    if (!this.apiKey || this.apiKey === 'your_openrouter_api_key_here') {
      console.warn("OPENROUTER_API_KEY is missing. Using mock code data.");
      return "// Mock code for: " + task.title + "\nconsole.log('Feature implemented');";
    }

    const prompt = `
      You are an expert Full-Stack Senior Developer.
      Your task is to write high-quality, production-ready code for the following task:
      
      Task: ${task.title}
      Description: ${task.description}
      Phase: ${task.phase}
      Tech Stack: ${techStack.join(", ")}
      
      Requirements:
      1. Provide a complete, working code snippet.
      2. Include comments explaining the logic.
      3. Follow best practices for the specified tech stack.
      4. Output only the code, wrapped in markdown code blocks.
    `;

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages: [
            { role: "system", content: "You are a senior developer. Output code in markdown blocks." },
            { role: "user", content: prompt }
          ]
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Code Agent Error:", error.response?.data || error.message);
      throw new Error("Failed to generate code");
    }
  }
}

module.exports = new CodeAgent();
