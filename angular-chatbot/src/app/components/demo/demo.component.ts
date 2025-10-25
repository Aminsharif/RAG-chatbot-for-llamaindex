import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LlmOutputComponent } from '../llm-output/llm-output.component';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [CommonModule, LlmOutputComponent],
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent {
  sampleMarkdown = `# LLM Response Demo

This is a demonstration of **markdown rendering** in Angular with syntax highlighting and proper styling.

## Features

- ✅ **Bold** and *italic* text
- ✅ Code blocks with syntax highlighting
- ✅ Lists and nested content
- ✅ Tables and blockquotes
- ✅ Links and images
- ✅ Dark/light mode support

### Code Example

Here's a TypeScript function:

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function createUser(userData: Partial<User>): User {
  return {
    id: Math.random(),
    name: userData.name || 'Anonymous',
    email: userData.email || 'user@example.com'
  };
}

const newUser = createUser({ name: 'John Doe' });
console.log('Created user:', newUser);
\`\`\`

### Python Example

\`\`\`python
def fibonacci(n):
    """Generate Fibonacci sequence up to n terms."""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    
    sequence = [0, 1]
    for i in range(2, n):
        sequence.append(sequence[i-1] + sequence[i-2])
    
    return sequence

# Generate first 10 Fibonacci numbers
fib_numbers = fibonacci(10)
print(f"Fibonacci sequence: {fib_numbers}")
\`\`\`

### SQL Example

\`\`\`sql
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (username, email) VALUES
    ('john_doe', 'john@example.com'),
    ('jane_smith', 'jane@example.com');

-- Query with JOIN
SELECT u.username, u.email, p.title
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.created_at > '2024-01-01'
ORDER BY u.username;
\`\`\`

## Lists and Tables

### Ordered List
1. First item
2. Second item
   - Nested bullet point
   - Another nested item
3. Third item

### Unordered List
- Feature A
- Feature B
  1. Sub-feature B.1
  2. Sub-feature B.2
- Feature C

### Table Example

| Language   | Type       | Use Case           | Popularity |
|------------|------------|--------------------|------------|
| TypeScript | Compiled   | Web Development    | ⭐⭐⭐⭐⭐     |
| Python     | Interpreted| Data Science/AI    | ⭐⭐⭐⭐⭐     |
| Rust       | Compiled   | Systems Programming| ⭐⭐⭐⭐       |
| Go         | Compiled   | Backend Services   | ⭐⭐⭐⭐       |

## Blockquotes and Links

> "The best way to predict the future is to invent it." - Alan Kay

This quote emphasizes the importance of innovation in technology. You can learn more about Alan Kay on [Wikipedia](https://en.wikipedia.org/wiki/Alan_Kay).

### Inline Code

Use \`npm install\` to install packages, or \`ng serve\` to start the development server.

---

## Mathematical Expressions

While this demo doesn't include LaTeX rendering, you can represent mathematical concepts:

- **Pythagorean theorem**: a² + b² = c²
- **Euler's identity**: e^(iπ) + 1 = 0
- **Quadratic formula**: x = (-b ± √(b² - 4ac)) / 2a

## Conclusion

This markdown renderer supports all common markdown features with:
- 🎨 Beautiful syntax highlighting
- 🌙 Dark/light mode themes
- 📱 Responsive design
- 🔒 XSS protection via DOMPurify
- ⚡ Fast rendering with marked.js

Perfect for displaying LLM responses, documentation, or any markdown content!`;

  streamingDemo = `# Streaming Response Demo

This demonstrates how the component handles streaming content...

## Current Features
- Real-time content updates
- Streaming indicator
- Progressive rendering`;

  isStreaming = false;
  currentTheme: 'light' | 'dark' | 'auto' = 'auto';

  toggleStreaming() {
    this.isStreaming = !this.isStreaming;
  }

  toggleTheme() {
    const themes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.currentTheme);
    this.currentTheme = themes[(currentIndex + 1) % themes.length];
  }
}