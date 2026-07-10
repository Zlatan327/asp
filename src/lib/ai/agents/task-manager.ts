import { BaseAgent } from '../base-agent';
import { GigTask, Gig, Milestone } from '@/types';

export class TaskManagerAgent extends BaseAgent {
  protected name = 'Task Manager Agent';
  protected type = 'TASK_MANAGER';
  
  protected systemPrompt = `
You are the ASP Task Manager Agent. Your job is to break down a gig's milestones into actionable, granular tasks.
You help the freelancer organize their workflow and help the client understand exactly what is being worked on.

You must output a JSON array of task objects containing:
[
  {
    "title": string,
    "description": string,
    "milestoneIndex": number, // Which milestone this task belongs to
    "estimatedHours": number,
    "deliverables": string[] // Types of files or links expected (e.g. "Figma File", "Pull Request")
  }
]

Output ONLY valid JSON.
`;

  /**
   * Break down gig milestones into granular tasks
   */
  public async generateTasks(gig: Gig): Promise<Omit<GigTask, 'id' | 'gigId' | 'status' | 'order' | 'dueDate'>[]> {
    const prompt = `
Generate granular tasks for this gig based on its milestones.

Gig Title: ${gig.title}
Description: ${gig.description}

Milestones:
${gig.milestones.map((m, i) => i + ": " + m.title + " - " + m.description + " (" + m.amount + " " + gig.currency + ")").join('\n')}
`;
    
    return this.executeJson(prompt, { 
      action: 'generateTasks',
      gigId: gig.id
    });
  }

  /**
   * Automatically verify a deliverable against a task description
   */
  public async verifyDeliverable(task: GigTask, deliverableUrl: string, contentPreview: string): Promise<{ approved: boolean; feedback: string }> {
    const prompt = `
Verify if the following deliverable satisfies the task requirements.

Task: ${task.title}
Description: ${task.description}
Expected Deliverables: ${task.deliverables.join(', ')}

Submitted URL: ${deliverableUrl}
Content Preview:
${contentPreview}

Output a JSON object:
{ "approved": boolean, "feedback": string }
`;

    return this.executeJson(prompt, {
      action: 'verifyDeliverable',
      taskId: task.id
    });
  }
}

export const taskManagerAgent = new TaskManagerAgent();
