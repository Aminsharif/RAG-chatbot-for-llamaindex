import { Injectable } from '@angular/core';
import { marked, Renderer } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

@Injectable({
  providedIn: 'root'
})
export class MarkdownService {
  private renderer: Renderer;

  constructor() {
    this.renderer = new Renderer();
    this.setupRenderer();
    marked.setOptions({ renderer: this.renderer });
  }

  private setupRenderer(): void {
    this.renderer.paragraph = (text) => {
      return text + '\n';
    };

    this.renderer.list = (text) => {
      return `${text}\n\n`;
    };

    this.renderer.listitem = (text) => {
      return `\n• ${text}`;
    };

    this.renderer.code = (code: string, language?: string) => {
      const validLanguage = hljs.getLanguage(language || '') ? language : 'plaintext';
      const highlightedCode = hljs.highlight(code, { language: validLanguage || 'plaintext' }).value;
      return `<pre class="highlight bg-gray-700" style="padding: 5px; border-radius: 5px; overflow: auto; overflow-wrap: anywhere; white-space: pre-wrap; max-width: 100%; display: block; line-height: 1.2"><code class="${language}" style="color: #d6e2ef; font-size: 12px; ">${highlightedCode}</code></pre>`;
    };
  }

  parseMarkdown(content: string): string {
    const parsed = marked.parse(content);
    return DOMPurify.sanitize(parsed);
  }

  sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html);
  }
}