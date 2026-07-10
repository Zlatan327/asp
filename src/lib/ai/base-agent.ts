import { askJson, ask } from './llm';
import { prisma } from '@/lib/db/prisma';

export abstract class BaseAgent {
  protected abstract name: string;
  protected abstract type: string;
  protected abstract systemPrompt: string;

  /**
   * Execute a prompt expecting a JSON response
   */
  protected async executeJson<T>(
    prompt: string,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    let status = 'SUCCESS';
    let outputData: string | null = null;
    let inputData = JSON.stringify({ prompt, context });

    try {
      const fullPrompt = context
        ? `${prompt}\n\nContext Context:\n${JSON.stringify(context, null, 2)}`
        : prompt;

      const result = await askJson<T>(this.systemPrompt, fullPrompt);
      outputData = JSON.stringify(result);
      return result;
    } catch (error) {
      status = 'ERROR';
      outputData = JSON.stringify({ error: (error as Error).message });
      throw error;
    } finally {
      // Log the agent action asynchronously
      this.logAction(inputData, outputData, status, Date.now() - startTime).catch(console.error);
    }
  }

  /**
   * Execute a prompt expecting a plain text response
   */
  protected async executeText(
    prompt: string,
    context?: Record<string, any>
  ): Promise<string> {
    const startTime = Date.now();
    let status = 'SUCCESS';
    let outputData: string | null = null;
    let inputData = JSON.stringify({ prompt, context });

    try {
      const fullPrompt = context
        ? `${prompt}\n\nContext Context:\n${JSON.stringify(context, null, 2)}`
        : prompt;

      const result = await ask(this.systemPrompt, fullPrompt);
      outputData = result;
      return result;
    } catch (error) {
      status = 'ERROR';
      outputData = JSON.stringify({ error: (error as Error).message });
      throw error;
    } finally {
      this.logAction(inputData, outputData, status, Date.now() - startTime).catch(console.error);
    }
  }

  private async logAction(
    input: string,
    output: string | null,
    status: string,
    durationMs: number
  ) {
    try {
      await prisma.agentLog.create({
        data: {
          agentType: this.type,
          action: `Execute`,
          input: input.slice(0, 5000), // truncate to prevent massive logs
          output: output ? output.slice(0, 5000) : null,
          status,
          duration: durationMs,
        },
      });
    } catch (err) {
      console.error(`Failed to log agent action:`, err);
    }
  }
}
