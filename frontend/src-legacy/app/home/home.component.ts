import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
<div class="home-container">
  <h1>Angular Rspack Demo</h1>
  <p class="subtitle">A minimal Angular 19 application bundled with Rspack</p>
  <a routerLink="/demo" class="btn">View Accordion Demo →</a>
</div>
  `,
  styles: [`
    .home-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 60px 20px;
      text-align: center;
    }
    .home-container h1 {
      font-size: 2.5rem;
      color: #1a1a2e;
      margin-bottom: 16px;
    }
    .subtitle {
      font-size: 1.2rem;
      color: #666;
      margin-bottom: 32px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #0f3460;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #16213e;
    }
  `],
})
export class HomeComponent {}
