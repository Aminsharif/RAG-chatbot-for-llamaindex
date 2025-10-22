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
      if (Array.isArray(streamedResponse?.logs?.[sourceStepName]?.final_output?.output)) {
        sources = streamedResponse.logs[sourceStepName].final_output.output.map((doc: Record<string, any>) => ({
          url: doc.metadata.source,
          title: doc.metadata.title,
        }));
      }
      if (streamedResponse.id !== undefined) {
        runId = streamedResponse.id;
      }
      if (Array.isArray(streamedResponse?.streamed_output)) {
        accumulatedMessage = streamedResponse.streamed_output.join('');
      }

      const parsedResult = this.md.parseMarkdown(accumulatedMessage);

      const message: Message = {
        id: uuidv4(),
        content: parsedResult.trim(),
        role: 'assistant',
        runId: runId,
        sources: sources,
      };
      this.messageSubject.next(message);
    }
  }
}