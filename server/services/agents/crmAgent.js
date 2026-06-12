const axios = require('axios');

class CRMAgent {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = "https://openrouter.ai/api/v1/chat/completions";
    this.model = "meta-llama/llama-3-8b-instruct";
  }

  async scoreLead(leadData) {
    const prompt = `
      You are a Sales Intelligence AI. 
      Score the following lead based on their project inquiry.
      
      Lead Data: ${JSON.stringify(leadData)}
      
      Evaluate based on:
      1. Budget potential
      2. Project clarity
      3. Urgency
      
      Output JSON only:
      {
        "score": 0-100,
        "category": "Hot/Warm/Cold",
        "reasoning": "Brief explanation",
        "nextStep": "Suggested action"
      }
    `;

    try {
      const response = await axios.post(this.baseUrl, {
        model: this.model,
        messages: [{ role: "system", content: "You are a CRM analytics expert. Output JSON." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" }
      }, { headers: { "Authorization": `Bearer ${this.apiKey}` } });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error("CRM Scoring Error:", error.message);
      return { score: 50, category: "Warm", reasoning: "Automatic scoring failed." };
    }
  }

  async generateCommunication(lead, context) {
    const prompt = `
      You are a Professional Communications Assistant.
      Write a personalized follow-up email for the following lead.
      
      Lead Name: ${lead.name}
      Project Context: ${context}
      Goal: ${lead.goal || "Follow up on inquiry"}
      
      Requirements:
      1. Professional yet friendly tone.
      2. Clear call to action.
      3. Keep it concise.
    `;

    try {
      const response = await axios.post(this.baseUrl, {
        model: this.model,
        messages: [{ role: "system", content: "You are a communications expert." }, { role: "user", content: prompt }]
      }, { headers: { "Authorization": `Bearer ${this.apiKey}` } });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("CRM Communication Error:", error.message);
      return "Hello " + lead.name + ", thank you for your inquiry. Let's discuss further.";
    }
  }
}

module.exports = new CRMAgent();
