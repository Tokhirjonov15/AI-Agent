import { Injectable } from '@nestjs/common';
import { ChatHistoryItem, ChatResponse, Resource } from '../libs/types/chat.types';
import { SmsResponse } from '../libs/types/sms.types';
import { ResourceSearchService } from './resource-search.service';

@Injectable()
export class AgentService {
  constructor(private readonly resourceSearchService: ResourceSearchService) {}

  private async generateAnswer(
    question: string,
    goal: string,
    history: ChatHistoryItem[],
  ): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    const model =
      process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || 'openai/gpt-4o-mini';

    if (!apiKey) {
      return [
        `Question: "${question}"`,
        `Goal: "${goal || 'not set'}".`,
        'OPENROUTER_API_KEY is missing, so this is a demo fallback answer.',
      ].join(' ');
    }

    const context = history
      .slice(-6)
      .map((item) => `${item.role || 'unknown'}: ${item.text || ''}`)
      .join('\n');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Agent',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a practical AI assistant. Respond in English with concise actionable guidance.',
          },
          {
            role: 'user',
            content: [
              `Agent goal: ${goal || 'unknown'}`,
              `Conversation history:\n${context || '(empty)'}`,
              `User question: ${question}`,
            ].join('\n\n'),
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter error: ${text}`);
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();
    return answer || 'Sorry, I could not generate a valid answer.';
  }

  async askAgent(
    question: string,
    goal: string,
    history: ChatHistoryItem[] = [],
  ): Promise<ChatResponse> {
    const [answer, resources] = await Promise.all([
      this.generateAnswer(question, goal, history),
      this.resourceSearchService.searchResources(question),
    ]);

    return { answer, resources };
  }

  async search(query: string): Promise<{ resources: Resource[] }> {
    const resources = await this.resourceSearchService.searchResources(query);
    return { resources };
  }

  async sendSms(to: string, message: string): Promise<SmsResponse> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return {
        ok: true,
        mock: true,
        preview: { to, message },
      };
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const payload = new URLSearchParams({
      To: to.trim(),
      From: fromNumber.trim(),
      Body: message.trim(),
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Failed to send SMS via Twilio');
    }

    return {
      ok: true,
      mock: false,
      sid: data?.sid,
      status: data?.status,
    };
  }
}
