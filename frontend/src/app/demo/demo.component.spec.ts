import '@angular/compiler';
import { describe, expect, it } from 'bun:test';
import { DemoComponent } from './demo.component';

describe('DemoComponent', () => {
  it('should create', () => {
    const component = new DemoComponent();
    expect(component).toBeTruthy();
  });

  it('should have cards array', () => {
    const component = new DemoComponent();
    expect(component.cards).toBeDefined();
    expect(component.cards.length).toBeGreaterThan(0);
  });

  it('should have searchQuery property', () => {
    const component = new DemoComponent();
    expect(component.searchQuery).toBe('');
  });

  it('should filter cards based on search query', () => {
    const component = new DemoComponent();
    component.searchQuery = 'angular';
    const filtered = component.filteredCards;
    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every(
        card =>
          card.title.toLowerCase().includes('angular') ||
          card.description.toLowerCase().includes('angular')
      )
    ).toBe(true);
  });

  it('should return all cards when search is empty', () => {
    const component = new DemoComponent();
    component.searchQuery = '';
    expect(component.filteredCards.length).toBe(component.cards.length);
  });

  it('should have openWindows array', () => {
    const component = new DemoComponent();
    expect(component.openWindows).toEqual([]);
  });

  it('should have activeWindowId property', () => {
    const component = new DemoComponent();
    expect(component.activeWindowId).toBe('');
  });
});
