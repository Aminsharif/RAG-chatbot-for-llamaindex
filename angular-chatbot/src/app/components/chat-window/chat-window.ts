import { Component } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { ChatService } from '../../services/chat.service';
import { Message, ChatHistory, Source } from '../../models/message.model';
import { AutoResizeTextareaComponent } from '../auto-resize-textarea/auto-resize-textarea';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { ChatMessageBubbleComponent } from '../chat-message-bubble/chat-message-bubble';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-window',
  imports: [FormsModule, AutoResizeTextareaComponent, EmptyStateComponent, ChatMessageBubbleComponent],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.css'
})
export class ChatWindowComponent {
  messages: Message[] = [];
  input = '';
  isLoading = false;
  llm = 'qwen3';
  llmIsLoading = false;
  conversationId = uuidv4();
  chatHistory: ChatHistory[] = [];

  constructor(private chat: ChatService) {
    this.chat.message$.subscribe((msg) => {
      this.isLoading = false;
      // Replace or append most recent assistant message
      const lastIdx = this.messages.findIndex(m => m.role === 'assistant' && !m.id.startsWith('placeholder'));
      this.messages = [...this.messages, msg];
    });
  }

  async sendMessage(message?: string) {
    if (this.isLoading) return;
    const messageValue = message ?? this.input;
    if (!messageValue) return;

    this.input = '';
    this.messages = [
      ...this.messages,
      { id: Math.random().toString(), content: messageValue, role: 'user' },
    ];
    this.isLoading = true;

    await this.chat.streamMessage(messageValue, this.chatHistory, this.llm, this.conversationId);
    this.chatHistory = [...this.chatHistory, { human: messageValue, ai: '' }];
  }

  async sendInitialQuestion(q: string) {
    await this.sendMessage(q);
  }
}

}
