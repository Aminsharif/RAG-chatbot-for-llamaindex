import { Component, Input } from '@angular/core';
import { Source } from '../../models/message.model';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-source-bubble',
  standalone: true,
  imports: [],
  templateUrl: './source-bubble.html',
  styleUrl: './source-bubble.css'
})
export class SourceBubbleComponent {
  @Input() source!: Source;
  @Input() highlighted: boolean = false;
  @Input() runId?: string;

  constructor(private chat: ChatService) {}

  async onClick() {
    window.open(this.source.url, '_blank');
    if (this.runId) {
      await this.chat.sendFeedback({
        key: 'user_click',
        runId: this.runId,
        value: this.source.url,
        isExplicit: false,
      } as any);
    }
  }
}
