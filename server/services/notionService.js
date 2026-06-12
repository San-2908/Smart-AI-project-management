const { Client } = require("@notionhq/client");

class NotionService {
  constructor() {
    this.notion = new Client({ auth: process.env.NOTION_API_KEY });
    this.parentId = process.env.NOTION_PAGE_ID;
  }

  async createProjectPage(project) {
    if (!process.env.NOTION_API_KEY || process.env.NOTION_API_KEY === 'your_notion_api_key_here') {
      console.warn("Notion API Key missing. Skipping sync.");
      return null;
    }

    try {
      const response = await this.notion.pages.create({
        parent: { page_id: this.parentId },
        properties: {
          title: [
            {
              text: {
                content: `🚀 Project: ${project.title}`,
              },
            },
          ],
        },
        children: [
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ type: "text", text: { content: "Project Overview" } }],
            },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: project.description } }],
            },
          },
          {
            object: "block",
            type: "heading_3",
            heading_3: {
              rich_text: [{ type: "text", text: { content: "Tech Stack" } }],
            },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: project.techStack.join(", ") } }],
            },
          },
        ],
      });
      return response.id;
    } catch (error) {
      console.error("Notion Sync Error:", error.message);
      return null;
    }
  }

  async syncTasks(pageId, tasks) {
    try {
      for (const task of tasks) {
        await this.notion.pages.create({
          parent: { page_id: pageId },
          properties: {
            title: [
              {
                text: {
                  content: `[${task.priority.toUpperCase()}] ${task.title}`,
                },
              },
            ],
          },
        });
      }
      return true;
    } catch (error) {
      console.error("Notion Task Sync Error:", error.message);
      return false;
    }
  }
}

module.exports = new NotionService();
