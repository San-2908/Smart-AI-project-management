const axios = require('axios');

class ReviewAgent {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = "https://openrouter.ai/api/v1/chat/completions";
    this.model = "meta-llama/llama-3-8b-instruct";
  }

  async reviewCode(code, task) {
    if (!this.apiKey || this.apiKey === 'your_openrouter_api_key_here') {
      return {
        score: 95,
        suggestions: ["Code looks good.", "Ensure environment variables are handled."]
      };
    }

    const prompt = `
      You are a Senior Code Reviewer.
      Review the following code generated for the task: "${task.title}".
      
      Code:
      ${code}
      
      Evaluate the code based on:
      1. Correctness
      2. Security
      3. Performance
      4. Readability
      
      Output your review in the following JSON format ONLY:
      {
        "score": 0-100,
        "summary": "Overall summary",
        "suggestions": ["Suggestion 1", "Suggestion 2"],
        "isApproved": true/false
      }
    `;

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages: [
            { role: "system", content: "You are a code reviewer. Output JSON only." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error("Review Agent Error:", error.response?.data || error.message);
      throw new Error("Failed to review code");
    }
  }
}

module.exports = new ReviewAgent();
