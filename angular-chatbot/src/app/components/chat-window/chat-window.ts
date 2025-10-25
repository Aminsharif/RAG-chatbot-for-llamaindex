import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { v4 as uuidv4 } from 'uuid';
import { ChatService } from '../../services/chat.service';
import { Message, ChatHistory } from '../../models/message.model';
import { AutoResizeTextareaComponent } from '../auto-resize-textarea/auto-resize-textarea';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { ChatMessageBubbleComponent } from '../chat-message-bubble/chat-message-bubble';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { MarkdownService } from '../../services/markdown.service';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoResizeTextareaComponent, EmptyStateComponent, ChatMessageBubbleComponent],
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

  constructor(private chat: ChatService, private cdr: ChangeDetectorRef, private md: MarkdownService) {
    this.chat.message$.subscribe((msg) => {
      console.log('[ChatWindow] Received message:', {
        role: msg.role,
        contentLength: msg.content?.length || 0,
        contentPreview: msg.content?.slice(0, 100) + '...',
        hasSources: !!msg.sources?.length,
        messageId: msg.id
      });
      
      this.isLoading = false;
      
      // Match Next.js behavior: update the last assistant message in place
      let messageIndex: number | null = null;
      const lastIndex = this.messages.length - 1;
      
      if (lastIndex >= 0 && this.messages[lastIndex].role === 'assistant') {
        messageIndex = lastIndex;
        this.messages[lastIndex] = { ...this.messages[lastIndex], ...msg };
        console.log('[ChatWindow] Updated existing assistant message at index:', msg);
      } else {
        messageIndex = this.messages.length;
        this.messages = [...this.messages, msg];
        console.log('[ChatWindow] Added new message at index:', messageIndex);
      }
      
      console.log('[ChatWindow] Current messages array:', this.messages.map(m => ({
        role: m.role,
        contentLength: m.content?.length || 0,
        id: m.id
      })));
      
      this.cdr.detectChanges();
    });
  }

  async sendMessage(message?: string) {
    if (this.isLoading) return;
    const messageValue = message ?? this.input;
    if (!messageValue) return;

    this.input = '';
    
    // Add user message - match Next.js structure
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

  onInputKeyDown($event: KeyboardEvent) {
    if ($event.key === 'Enter' && !$event.shiftKey) {
      $event.preventDefault();
      this.sendMessage();
    } else if ($event.key === 'Enter' && $event.shiftKey) {
      $event.preventDefault();
      this.input = (this.input ?? '') + '\n';
    }
  }
}

