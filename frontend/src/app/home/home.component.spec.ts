import { describe, expect, it } from 'bun:test';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  it('should create', () => {
    const component = new HomeComponent();
    expect(component).toBeTruthy();
  });

  // Note: title and features are initialized in ngOnInit or template
  // For standalone component testing without TestBed, we test the class structure
  it('should have component class defined', () => {
    expect(HomeComponent).toBeDefined();
  });
});
