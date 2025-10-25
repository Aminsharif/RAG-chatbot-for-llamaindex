import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-llm-output',
  standalone: true,
  imports: [CommonModule, MarkdownPipe],
  templateUrl: './llm-output.component.html',
  styleUrls: ['./llm-output.component.scss']
})
export class LlmOutputComponent implements OnInit, OnDestroy {
  @Input() markdownContent: string = '';
  @Input() isStreaming: boolean = false;
  @Input() showCopyButton: boolean = true;
  @Input() showWordCount: boolean = false;
  @Input() maxHeight: string = 'none';
  @Input() theme: 'light' | 'dark' | 'auto' = 'auto';

  wordCount: number = 0;
  characterCount: number = 0;
  copySuccess: boolean = false;
  private copyTimeout?: number;

  ngOnInit() {
    this.updateStats();
  }

  ngOnDestroy() {
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
    }
  }

  ngOnChanges() {
    this.updateStats();
  }

  private updateStats() {
    if (this.markdownContent) {
      this.characterCount = this.markdownContent.length;
      this.wordCount = this.markdownContent.trim().split(/\s+/).filter(word => word.length > 0).length;
    } else {
      this.characterCount = 0;
      this.wordCount = 0;
    }
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.markdownContent);
      this.copySuccess = true;
      
      if (this.copyTimeout) {
        clearTimeout(this.copyTimeout);
      }
      
      this.copyTimeout = window.setTimeout(() => {
        this.copySuccess = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      this.fallbackCopyTextToClipboard(this.markdownContent);
    }
  }

  private fallbackCopyTextToClipboard(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.copySuccess = true;
        if (this.copyTimeout) {
          clearTimeout(this.copyTimeout);
        }
        this.copyTimeout = window.setTimeout(() => {
          this.copySuccess = false;
        }, 2000);
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
  }

  getThemeClass(): string {
    if (this.theme === 'auto') {
      // Check system preference
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    return this.theme;
  }
}