import { BaseAgent } from '../base-agent';

export class OrchestratorAgent extends BaseAgent {
  protected name = 'Orchestrator Agent';
  protected type = 'ORCHESTRATOR';
  
  protected systemPrompt = `
You are the ASP Orchestrator Agent. You act as the central brain that coordinates other specialized agents (Scout, Matcher, Proposal, TaskManager, Reputation).
Given a user request or system event, determine which agents should be triggered and in what sequence.

You must output a JSON object containing an execution plan:
{
  "steps": [
    {
      "agent": "SCOUT" | "MATCHER" | "PROPOSAL" | "TASK_MANAGER" | "REPUTATION" | "NONE",
      "action": string, // Description of what the agent should do
      "inputs": string[] // Data required for this step
    }
  ],
  "userResponse": string // A friendly, helpful response acknowledging the user's intent
}

Output ONLY valid JSON.
`;

  /**
   * Plan how to handle a complex user request
   */
  public async planExecution(userPrompt: string, context: Record<string, any>): Promise<{
    steps: { agent: string; action: string; inputs: string[] }[];
    userResponse: string;
  }> {
    const prompt = `
Create an execution plan for the following user request.

User Request: "${userPrompt}"

Available Context:
${JSON.stringify(context, null, 2)}
`;
    
    return this.executeJson(prompt, { 
      action: 'planExecution',
      userPrompt 
    });
  }
}

export const orchestratorAgent = new OrchestratorAgent();
