const axios = require('axios');

class TaskAgent {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = "https://openrouter.ai/api/v1/chat/completions";
    this.model = "meta-llama/llama-3-8b-instruct"; // Consistent with user's preferred model
  }

  async breakdownTasks(projectPlan) {
    if (!this.apiKey || this.apiKey === 'your_openrouter_api_key_here') {
      console.warn("OPENROUTER_API_KEY is missing. Using mock task data.");
      return [
        { "id": 1, "title": "Setup Repository", "description": "Initialize git and project structure.", "phase": "Initial Setup", "status": "todo" },
        { "id": 2, "title": "Database Schema", "description": "Design and implement MongoDB models.", "phase": "Initial Setup", "status": "todo" }
      ];
    }

    const prompt = `
      You are an expert Technical Lead. 
      Your task is to take a Project Plan and break it down into a detailed list of actionable tasks.
      
      Project Plan: ${JSON.stringify(projectPlan)}
      
      Output the tasks in the following JSON format ONLY:
      [
        {
          "title": "Task Title",
          "description": "Short description of what needs to be done",
          "phase": "The phase this task belongs to",
          "priority": "high/medium/low",
          "status": "todo"
        }
      ]
      
      Ensure you create at least 2-3 tasks for each phase mentioned in the plan.
    `;

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          messages: [
            { role: "system", content: "You are a technical lead that breaks projects into tasks. Output JSON only." },
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

      const content = response.data.choices[0].message.content;
      
      try {
        const parsed = JSON.parse(content);
        // If the AI returns an object with a tasks key, return that
        return Array.isArray(parsed) ? parsed : (parsed.tasks || Object.values(parsed)[0]);
      } catch (e) {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      }
    } catch (error) {
      console.error("Task Agent Error:", error.response?.data || error.message);
      throw new Error("Failed to breakdown tasks");
    }
  }
}

module.exports = new TaskAgent();
