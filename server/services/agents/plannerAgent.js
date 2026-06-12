const axios = require('axios');

class PlannerAgent {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = "https://openrouter.ai/api/v1/chat/completions";
  }

  async generatePlan(projectIdea) {
    // Mock fallback if API key is missing or is the placeholder
    if (!this.apiKey || this.apiKey === 'your_openrouter_api_key_here') {
      console.warn("OPENROUTER_API_KEY is missing. Using mock data.");
      return {
        "title": "MOCK: " + projectIdea,
        "description": "This is a mock project plan because no OpenRouter API key was provided.",
        "objectives": ["Implement core features", "Test and deploy"],
        "phases": [
          {
            "name": "Initial Setup",
            "description": "Setting up the environment and basic structure.",
            "keyDeliverables": ["Source code", "Config files"]
          }
        ],
        "techStack": ["Node.js", "React", "MongoDB"],
        "estimatedTimeline": "2 weeks"
      };
    }

    const prompt = `
      You are an expert Project Manager AI. 
      Your task is to take a project idea and generate a comprehensive high-level project plan.
      
      Project Idea: ${projectIdea}
      
      Output the plan in the following JSON format ONLY:
      {
        "title": "Project Title",
        "description": "Project Description",
        "objectives": ["Objective 1", "Objective 2"],
        "phases": [
          {
            "name": "Phase Name",
            "description": "Phase Description",
            "keyDeliverables": ["Deliverable 1", "Deliverable 2"]
          }
        ],
        "techStack": ["Tech 1", "Tech 2"],
        "estimatedTimeline": "e.g. 4 weeks"
      }
      
      Ensure the output is strictly JSON.
    `;

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: "meta-llama/llama-3-8b-instruct",
          messages: [
            { role: "system", content: "You are a specialized project management assistant that outputs JSON." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000", // Optional, for OpenRouter tracking
            "X-Title": "Agentic PM System" // Optional
          }
        }
      );

      const content = response.data.choices[0].message.content;
      console.log("OpenRouter Response Content:", content);

      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error("JSON Parsing Error:", parseError, "Raw Content:", content);
        // Fallback: If it's not JSON, try to extract JSON from the string
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw parseError;
      }
    } catch (error) {
      const errorData = error.response?.data || error.message;
      console.error("Planner Agent Error (OpenRouter):", errorData);
      throw new Error(`Planner Agent Error: ${JSON.stringify(errorData)}`);
    }
  }
}

module.exports = new PlannerAgent();
