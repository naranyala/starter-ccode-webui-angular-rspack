import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
});

global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.localStorage = dom.window.localStorage;
global.sessionStorage = dom.window.sessionStorage;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;
global.Node = dom.window.Node;
global.Text = dom.window.Text;
global.DocumentFragment = dom.window.DocumentFragment;
global.HTMLBodyElement = dom.window.HTMLBodyElement;
global.HTMLDocument = dom.window.HTMLDocument;
global.history = dom.window.history;
global.location = dom.window.location;
global.MutationObserver = dom.window.MutationObserver;
global.getComputedStyle = dom.window.getComputedStyle;
global.matchMedia =
  dom.window.matchMedia ||
  (query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }));

import 'zone.js';
