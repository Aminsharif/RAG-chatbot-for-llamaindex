import { Component, Input } from '@angular/core';
import { Message, Source } from '../../models/message.model';
import { InlineCitationComponent } from '../inline-citation/inline-citation';
import { SourceBubbleComponent } from '../source-bubble/source-bubble';
import { MarkdownService } from '../../services/markdown.service';

@Component({
  selector: 'app-chat-message-bubble',
  imports: [InlineCitationComponent, SourceBubbleComponent],
  templateUrl: './chat-message-bubble.html',
  styleUrl: './chat-message-bubble.css'
})
export class ChatMessageBubbleComponent {
  @Input() message!: Message;
  @Input() aiEmoji?: string;
  @Input() isMostRecent: boolean = false;
  @Input() messageCompleted: boolean = true;

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

  createAnswerHtml(content: string, filteredSources: Source[], sourceIndexMap: Map<number, number>): string {
    // Replace citation markers with inline-citation-like text; Angular template will render components
    return this.md.sanitizeHtml(content);
  }
}

}
