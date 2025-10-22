import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Source } from '../../models/message.model';

@Component({
  selector: 'app-inline-citation',
  imports: [],
  templateUrl: './inline-citation.html',
  styleUrl: './inline-citation.css'
})
export class InlineCitationComponent {
  @Input() source!: Source;
  @Input() sourceNumber!: number;
  @Input() highlighted: boolean = false;
  @Output() mouseEnter = new EventEmitter<void>();
  @Output() mouseLeave = new EventEmitter<void>();

  onMouseEnter() { this.mouseEnter.emit(); }
  onMouseLeave() { this.mouseLeave.emit(); }
}
