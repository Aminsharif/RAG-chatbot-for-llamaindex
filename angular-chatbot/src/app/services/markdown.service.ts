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
    marked.setOptions({ renderer: this.renderer, async: false });
  }

  private setupRenderer(): void {
    // Configure paragraph rendering
    this.renderer.paragraph = (token: any) => {
      const text = this.parseTokens(token.tokens);
      return `<p class="mb-4 leading-relaxed">${text}</p>`;
    };

    // Configure list rendering
    this.renderer.list = (token: any) => {
      const { ordered, items } = token;
      const tag = ordered ? 'ol' : 'ul';
      const className = ordered ? 'list-decimal list-inside' : 'list-disc list-inside';
      const body = items.map((item: any) => this.parseTokens(item.tokens)).join('');
      return `<${tag} class="${className} mb-4 ml-4">${body}</${tag}>`;
    };

    this.renderer.listitem = (token: any) => {
      const text = this.parseTokens(token.tokens);
      return `<li class="mb-1">${text}</li>`;
    };

    // Configure heading rendering
    this.renderer.heading = (token: any) => {
      const { tokens, depth: level } = token;
      const text = this.parseTokens(tokens);
      const sizes = ['', 'text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm'];
      const margins = ['', 'mb-6 mt-8', 'mb-5 mt-7', 'mb-4 mt-6', 'mb-3 mt-5', 'mb-2 mt-4', 'mb-2 mt-3'];
      const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
      return `<h${level} id="${escapedText}" class="font-bold ${sizes[level]} ${margins[level]} text-gray-900 dark:text-gray-100">${text}</h${level}>`;
    };

    // Configure blockquote rendering
    this.renderer.blockquote = (token: any) => {
      const quote = this.parseTokens(token.tokens);
      return `<blockquote class="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-gray-50 dark:bg-gray-800 italic">${quote}</blockquote>`;
    };

    // Configure table rendering
    this.renderer.table = (token: any) => {
      const { header, body } = token;
      return `<div class="overflow-x-auto mb-4">
        <table class="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
          <thead class="bg-gray-100 dark:bg-gray-700">${header}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
    };

    this.renderer.tablerow = (token: any) => {
      const content = this.parseTokens(token.tokens);
      return `<tr>\n${content}</tr>\n`;
    };

    this.renderer.tablecell = (token: any) => {
      const { text, header, align } = token;
      const tag = header ? 'th' : 'td';
      const alignAttr = align ? ` style="text-align: ${align}"` : '';
      return `<${tag}${alignAttr}>${text}</${tag}>\n`;
    };

    // Configure code block rendering with syntax highlighting
    this.renderer.code = (token: any) => {
      const { text: code, lang: language } = token;
      if (language && hljs.getLanguage(language)) {
        try {
          const highlighted = hljs.highlight(code, { language }).value;
          return `<pre class="hljs mb-4 p-4 rounded-lg overflow-x-auto bg-gray-900 text-gray-100"><code class="language-${language}">${highlighted}</code></pre>`;
        } catch (err) {
          console.warn('Syntax highlighting failed:', err);
        }
      }
      
      // Fallback for unknown languages or highlighting errors
      const escaped = code.replace(/[&<>"']/g, (match: string) => {
        const escapeMap: { [key: string]: string } = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return escapeMap[match];
      });
      
      return `<pre class="hljs mb-4 p-4 rounded-lg overflow-x-auto bg-gray-900 text-gray-100"><code>${escaped}</code></pre>`;
    };

    // Configure inline code rendering
    this.renderer.codespan = (token: any) => {
      const { text: code } = token;
      return `<code class="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">${code}</code>`;
    };

    // Configure link rendering with security
    this.renderer.link = (token: any) => {
      const { href, title, text } = token;
      const titleAttr = title ? ` title="${title}"` : '';
      const isExternal = href.startsWith('http') && !href.includes(window.location.hostname);
      const securityAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${href}"${titleAttr}${securityAttrs} class="text-blue-600 dark:text-blue-400 hover:underline">${text}</a>`;
    };

    // Configure image rendering
    this.renderer.image = (token: any) => {
      const { href, title, text } = token;
      const titleAttr = title ? ` title="${title}"` : '';
      return `<img src="${href}" alt="${text}"${titleAttr} class="max-w-full h-auto rounded-lg mb-4" loading="lazy">`;
    };

    // Configure horizontal rule rendering
    this.renderer.hr = () => {
      return `<hr class="my-8 border-gray-300 dark:border-gray-600">`;
    };

    // Configure strong text rendering
    this.renderer.strong = (token: any) => {
      const text = this.parseTokens(token.tokens);
      return `<strong class="font-bold">${text}</strong>`;
    };

    this.renderer.em = (token: any) => {
      const text = this.parseTokens(token.tokens);
      return `<em class="italic">${text}</em>`;
    };

    // Configure strikethrough rendering
    this.renderer.del = (token: any) => {
      const text = this.parseTokens(token.tokens);
      return `<del class="line-through">${text}</del>`;
    };
  }

  private parseTokens(tokens: any[]): string {
    if (!tokens || !Array.isArray(tokens)) {
      return '';
    }
    
    return tokens.map(token => {
      if (typeof token === 'string') {
        return token;
      }
      
      if (token.type === 'text') {
        return token.text || '';
      }
      
      // For other token types, return their text content
      return token.text || token.raw || '';
    }).join('');
  }

  async parseMarkdown(content: string): Promise<string> {
    const parsed = await marked.parse(content);
    const html = typeof parsed === 'string' ? parsed : String(parsed);
    
    // Configure DOMPurify to return a string, not TrustedHTML or DocumentFragment
    const sanitized = DOMPurify.sanitize(html, { 
      RETURN_TRUSTED_TYPE: false,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false
    });
    
    // Extract content properly from the DOMPurify result
    let result: string;
    if (typeof sanitized === 'string') {
      result = sanitized;
    } else if (sanitized && typeof sanitized === 'object') {
      // If it's a DOM node, get its textContent or innerHTML
      if ('textContent' in sanitized) {
        result = (sanitized as any).textContent || '';
      } else if ('innerHTML' in sanitized) {
        result = (sanitized as any).innerHTML || '';
      } else if ('outerHTML' in sanitized) {
        result = (sanitized as any).outerHTML || '';
      } else {
        // Last resort: convert to string
        result = String(sanitized);
      }
    } else {
      result = String(sanitized || '');
    }
    
    return result;
  }

  parseMarkdownSync(content: string): string {
    // For synchronous parsing, use marked with sync option
    const parsed = marked.parse(content, { async: false });
    const html = typeof parsed === 'string' ? parsed : String(parsed);
    
    // Configure DOMPurify to return a string, not TrustedHTML or DocumentFragment
    const sanitized = DOMPurify.sanitize(html, { 
      RETURN_TRUSTED_TYPE: false,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false
    });
    
    // Extract content properly from the DOMPurify result
    let result: string;
    if (typeof sanitized === 'string') {
      result = sanitized;
    } else if (sanitized && typeof sanitized === 'object') {
      // If it's a DOM node, get its textContent or innerHTML
      if ('textContent' in sanitized) {
        result = (sanitized as any).textContent || '';
      } else if ('innerHTML' in sanitized) {
        result = (sanitized as any).innerHTML || '';
      } else if ('outerHTML' in sanitized) {
        result = (sanitized as any).outerHTML || '';
      } else {
        // Last resort: convert to string
        result = String(sanitized);
      }
    } else {
      result = String(sanitized || '');
    }
    
    return result;
  }

  sanitizeHtml(html: string): string {
    // Configure DOMPurify to return a string, not TrustedHTML or DocumentFragment
    const sanitized = DOMPurify.sanitize(html, { 
      RETURN_TRUSTED_TYPE: false,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false
    });
    
    // Extract content properly from the DOMPurify result
    let result: string;
    if (typeof sanitized === 'string') {
      result = sanitized;
    } else if (sanitized && typeof sanitized === 'object') {
      // If it's a DOM node, get its textContent or innerHTML
      if ('textContent' in sanitized) {
        result = (sanitized as any).textContent || '';
      } else if ('innerHTML' in sanitized) {
        result = (sanitized as any).innerHTML || '';
      } else if ('outerHTML' in sanitized) {
        result = (sanitized as any).outerHTML || '';
      } else {
        // Last resort: convert to string
        result = String(sanitized);
      }
    } else {
      result = String(sanitized || '');
    }
    
    return result;
  }
}