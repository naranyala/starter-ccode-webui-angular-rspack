import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DevtoolsComponent } from './devtools/devtools.component';
import { ErrorBoundaryComponent } from './shared/error-boundary.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, DevtoolsComponent, ErrorBoundaryComponent],
  template: `
    <router-outlet></router-outlet>
    <app-error-boundary></app-error-boundary>
    <app-devtools></app-devtools>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `],
})
export class AppComponent {
  title = 'angular-rspack-demo';
}
