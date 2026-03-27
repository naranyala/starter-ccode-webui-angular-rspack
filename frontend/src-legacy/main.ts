import 'zone.js';
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DemoComponent } from './app/demo/demo.component';

bootstrapApplication(DemoComponent, {
  providers: [provideAnimations()],
}).catch((err) => console.error(err));
