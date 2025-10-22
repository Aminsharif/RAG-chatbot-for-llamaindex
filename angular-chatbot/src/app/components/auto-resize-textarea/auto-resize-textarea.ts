import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-auto-resize-textarea',
  imports: [FormsModule],
  templateUrl: './auto-resize-textarea.html',
  styleUrl: './auto-resize-textarea.css'
})
export class AutoResizeTextareaComponent implements AfterViewInit {
  @Input() value: string = '';
  @Input() placeholder: string = '';
  @Input() maxRows: number = 5;
  @Input() textColor: string = 'white';
  @Input() borderColor: string = 'rgb(58, 58, 61)';
  @Input() marginRight: string = '56px';
  
  @Output() valueChange = new EventEmitter<string>();
  @Output() keyDown = new EventEmitter<KeyboardEvent>();
  
  @ViewChild('textarea', { static: true }) textarea!: ElementRef<HTMLTextAreaElement>;

  ngAfterViewInit() {
    this.adjustHeight();
  }

  onInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.valueChange.emit(this.value);
    this.adjustHeight();
  }

  onKeyDown(event: KeyboardEvent) {
    this.keyDown.emit(event);
  }

  private adjustHeight() {
    const textarea = this.textarea.nativeElement;
    textarea.style.height = 'auto';
    
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const maxHeight = lineHeight * this.maxRows;
    
    if (textarea.scrollHeight <= maxHeight) {
      textarea.style.height = textarea.scrollHeight + 'px';
      textarea.style.overflowY = 'hidden';
    } else {
      textarea.style.height = maxHeight + 'px';
      textarea.style.overflowY = 'auto';
    }
  }
}
