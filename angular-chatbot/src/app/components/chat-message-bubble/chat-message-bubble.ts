import { Component, Input } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { Message, Source } from '../../models/message.model';
import { SourceBubbleComponent } from '../source-bubble/source-bubble';
import { InlineCitationComponent } from '../inline-citation/inline-citation';
import { MarkdownService } from '../../services/markdown.service';

@Component({
  selector: 'app-chat-message-bubble',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, SourceBubbleComponent, InlineCitationComponent],
  templateUrl: './chat-message-bubble.html',
  styleUrl: './chat-message-bubble.css'
})
export class ChatMessageBubbleComponent {
  @Input() message!: Message;
  @Input() aiEmoji?: string;
  @Input() isMostRecent: boolean = false;
  @Input() messageCompleted: boolean = true;

  highlightedSourceLinkStates: boolean[] = [];

  constructor(private md: MarkdownService) {}

  filterSources(sources: Source[]): { filtered: Source[]; indexMap: Map<number, number> } {
    const filtered: Source[] = [];
    const urlMap = new Map<string, number>();
    const indexMap = new Map<number, number>();
    sources.forEach((source, i) => {
      const { url } = source;
      const index = urlMap.get(url);
      if (index === undefined) {
        urlMap.set(url, i);
        indexMap.set(i, filtered.length);
        filtered.push(source);
      } else {
        const resolvedIndex = indexMap.get(index);
        if (resolvedIndex !== undefined) {
          indexMap.set(i, resolvedIndex);
        }
      }
    });
    return { filtered, indexMap };
  }

  createAnswerElements(content: string, filteredSources: Source[], sourceIndexMap: Map<number, number>): any[] {
    console.debug('[ChatMessageBubble] createAnswerElements called with:', {
      contentLength: content?.length || 0,
      contentPreview: content?.slice(0, 100) + '...',
      filteredSourcesLength: filteredSources?.length || 0,
      sourceIndexMapSize: sourceIndexMap?.size || 0
    });
    
    // Match Next.js citation pattern: [^$?{?(\d+)}?^?]
    const citationRegex = /\[\^?\$?\{?(\d+)\}?\^?\]/g;
    const matches = Array.from(content.matchAll(citationRegex));
    const elements: any[] = [];
    let prevIndex = 0;

    matches.forEach((match) => {
      const sourceNum = parseInt(match[1], 10);
      const resolvedNum = sourceIndexMap.get(sourceNum) ?? 10;
      if (match.index !== null && resolvedNum < filteredSources.length) {
        // Add content before citation
        if (match.index > prevIndex) {
          const contentSlice = content.slice(prevIndex, match.index);
          elements.push({
            type: 'content',
            html: this.md.sanitizeHtml(contentSlice)
          });
        }
        // Add citation component
        elements.push({
          type: 'citation',
          source: filteredSources[resolvedNum],
          sourceNumber: resolvedNum,
          highlighted: this.highlightedSourceLinkStates[resolvedNum] || false
        });
        prevIndex = (match?.index ?? 0) + match[0].length;
      }
    });
    
    // Add remaining content
    if (prevIndex < content.length) {
      const remainingContent = content.slice(prevIndex);
      elements.push({
        type: 'content',
        html: this.md.sanitizeHtml(remainingContent)
      });
    }
    
    console.debug('[ChatMessageBubble] createAnswerElements result:', {
      elementsCount: elements.length,
      elements: elements.map(el => ({
        type: el.type,
        htmlLength: el.html?.length || 0,
        htmlPreview: el.html?.slice(0, 50) + '...' || 'N/A'
      }))
    });
    
    return elements;
  }

  setHighlightedSourceLinkStates(states: boolean[]) {
    this.highlightedSourceLinkStates = states;
  }

  onCitationMouseEnter(resolvedNum: number, filteredSources: Source[]) {
    this.setHighlightedSourceLinkStates(
      filteredSources.map((_, i) => i === resolvedNum)
    );
  }

  onCitationMouseLeave(filteredSources: Source[]) {
    this.setHighlightedSourceLinkStates(filteredSources.map(() => false));
  }

  safeHtml(content: any): string {
    console.debug('[ChatMessageBubble] safeHtml called with:', {
      contentType: typeof content,
      contentLength: content?.length || 0,
      contentPreview: content?.slice ? content.slice(0, 100) + '...' : 'No slice method',
      isString: typeof content === 'string',
      actualContent: content
    });
    
    // Ensure content is a string before processing
    let stringContent: string;
    if (typeof content === 'string') {
      stringContent = content;
    } else if (content && typeof content === 'object') {
      // If it's an object, try to extract meaningful content
      if (content.html) {
        stringContent = content.html;
      } else if (content.content) {
        stringContent = content.content;
      } else {
        // Last resort: convert to JSON string but warn about it
        stringContent = JSON.stringify(content);
        console.warn('[ChatMessageBubble] Converting object to JSON string:', content);
      }
    } else {
      stringContent = String(content || '');
    }
    
    const sanitized = this.md.sanitizeHtml(stringContent);
    console.debug('[ChatMessageBubble] safeHtml result:', {
      sanitizedLength: sanitized?.length || 0,
      sanitizedPreview: sanitized?.slice(0, 100) + '...'
    });
    return sanitized;
  }
}

