import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DemoComponent } from './components/demo/demo.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DemoComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('angular-chatbot');
}
