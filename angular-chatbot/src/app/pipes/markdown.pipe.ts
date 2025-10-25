import { Pipe, PipeTransform } from '@angular/core';
import { MarkdownService } from '../services/markdown.service';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {

  constructor(private markdownService: MarkdownService) {}

  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    
    // Use the synchronous method for pipes to avoid async issues in templates
    return this.markdownService.parseMarkdownSync(value);
  }
}