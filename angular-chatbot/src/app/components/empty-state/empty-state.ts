import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css'
})
export class EmptyStateComponent {
  @Output() onChoice = new EventEmitter<string>();

  handleClick(text: string) {
    this.onChoice.emit(text);
  }
}
