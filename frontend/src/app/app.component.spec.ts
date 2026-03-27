import '@angular/compiler';
import { describe, expect, it } from 'bun:test';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('should create', () => {
    const app = new AppComponent();
    expect(app).toBeTruthy();
  });

  it('should have title property', () => {
    const app = new AppComponent();
    expect(app.title).toBe('angular-rspack-demo');
  });
});
