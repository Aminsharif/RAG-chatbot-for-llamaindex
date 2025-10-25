import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Message, ChatHistory, Source } from '../models/message.model';
import { v4 as uuidv4 } from 'uuid';
import { RemoteRunnable } from '@langchain/core/runnables/remote';
import { applyPatch } from '@langchain/core/utils/json_patch';
import { MarkdownService } from './markdown.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiBaseUrl = environment.apiBaseUrl;
  private messageSubject = new Subject<Message>();
  public message$ = this.messageSubject.asObservable();

  constructor(private md: MarkdownService) {}

  async streamMessage(
    question: string,
    chatHistory: ChatHistory[],
    llm: string,
    conversationId: string
  ): Promise<void> {
    let accumulatedMessage = '';
    let runId: string | undefined = undefined;
    let sources: Source[] | undefined = undefined;

    const sourceStepName = 'FindDocs';
    let streamedResponse: Record<string, any> = {};

    const remoteChain = new RemoteRunnable({
      url: this.apiBaseUrl + '/chat',
      options: { timeout: 60000 },
    });

    const llmDisplayName = llm ?? 'qwen3';

    const streamLog = await remoteChain.streamLog(
      { question, chat_history: chatHistory },
      {
        configurable: { llm: llmDisplayName },
        tags: ['model:' + llmDisplayName],
        metadata: { conversation_id: conversationId, llm: llmDisplayName },
      },
      { includeNames: [sourceStepName] }
    );

    for await (const chunk of streamLog) {
      streamedResponse = applyPatch(streamedResponse, chunk.ops, undefined, false).newDocument;

      const docs = streamedResponse?.['logs']?.[sourceStepName]?.['final_output']?.['output'];
      if (Array.isArray(docs)) {
        sources = docs.map((doc: Record<string, any>) => ({
          url: doc?.['metadata']?.['source'],
          title: doc?.['metadata']?.['title'],
        }));
      }

      if (streamedResponse?.['id'] !== undefined) {
        runId = streamedResponse['id'];
      }

      // Debug: log the raw streaming response structure
      console.log('[ChatService] Raw streaming response:', {
        hasStreamedOutputStr: 'streamed_output_str' in streamedResponse,
        hasStreamedOutput: 'streamed_output' in streamedResponse,
        streamedOutputStrType: typeof streamedResponse?.['streamed_output_str'],
        streamedOutputType: typeof streamedResponse?.['streamed_output'],
        streamedOutputIsArray: Array.isArray(streamedResponse?.['streamed_output']),
        accumulatedMessage: accumulatedMessage
      });

      // Prefer string version of streamed output if available
      const streamedStr = streamedResponse?.['streamed_output_str'];
      if (typeof streamedStr === 'string') {
        accumulatedMessage = streamedStr;
      } else if (Array.isArray(streamedResponse?.['streamed_output'])) {
        // Filter out non-string elements and join only strings
        const stringElements = streamedResponse['streamed_output'].filter((item: any) => {
          const isString = typeof item === 'string';
          if (!isString) {
            console.log('[ChatService] Filtering out non-string item:', typeof item, item);
          }
          return isString;
        });
        accumulatedMessage = stringElements.join('');
        
        console.log('[ChatService] Filtered streamed_output:', {
          originalLength: streamedResponse['streamed_output'].length,
          filteredLength: stringElements.length,
          nonStringItems: streamedResponse['streamed_output'].filter((item: any) => typeof item !== 'string').length,
          finalMessage: accumulatedMessage
        });
      }

      // Ensure accumulatedMessage is always a string
      const safeMessage = typeof accumulatedMessage === 'string' ? accumulatedMessage : String(accumulatedMessage || '');
      
      // Only parse and emit if we have actual content
      if (safeMessage.trim()) {
        // Use marked.parse like Next.js instead of custom markdown service
        const parsedResult = this.md.parseMarkdownSync(safeMessage);
        console.log(".........................",safeMessage,'..................')
        // Create message object matching Next.js structure
        const messageObj: Message = {
          id: uuidv4(),
          content: parsedResult.trim(),
          role: 'assistant',
          runId: runId,
          sources: sources
        };
        
        console.log('[ChatService] Emitting message:', {
          contentLength: messageObj.content.length,
          contentPreview: messageObj.content.slice(0, 100) + '...',
          role: messageObj.role,
          hasSources: !!messageObj.sources?.length
        });
        
        this.messageSubject.next(messageObj);
      }
    }
  }

  async sendFeedback({
    key,
    runId,
    score,
    value,
    comment,
    feedbackId,
    isExplicit,
  }: {
    key: string;
    runId: string;
    score?: number;
    value?: string;
    comment?: string;
    feedbackId?: string;
    isExplicit: boolean;
  }): Promise<{ feedbackId: string; code: number; result: string }> {
    const feedback_id = feedbackId ?? uuidv4();
    const response = await fetch(this.apiBaseUrl + '/feedback', {
      method: feedbackId ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        score,
        run_id: runId,
        key,
        value,
        feedback_id,
        comment,
        source_info: {
          is_explicit: isExplicit,
        },
      }),
    });

    const data = await response.json();
    return {
      ...data,
      feedbackId: feedback_id,
    } as { feedbackId: string; code: number; result: string };
  }
}