import { Component, signal, afterNextRender, ElementRef, inject, viewChild, OnDestroy } from '@angular/core';
import { SVG, type Svg } from '@svgdotjs/svg.js';

interface DemoItem {
  name: string;
  icon: string;
}

interface DemoGroup {
  title: string;
  demos: DemoItem[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div class="split-screen">
      <!-- Left: Pills Selector -->
      <div class="pills-panel">
        <h2 class="panel-title">SVG.js Demos</h2>
        
        @for (group of demoGroups; track group.title) {
          <div class="demo-group">
            <h3 class="group-title">{{ group.title }}</h3>
            <div class="pill-container">
              @for (demo of group.demos; track demo.name) {
                <span
                  class="pill"
                  [class.active]="selectedDemo() === demo.name"
                  (click)="selectDemo(demo.name)">
                  <span class="pill-icon">{{ demo.icon }}</span>
                  <span class="pill-label">{{ demo.name }}</span>
                </span>
              }
            </div>
          </div>
        }
      </div>

      <!-- Right: SVG Canvas (Sliding Modal on Mobile) -->
      <div class="canvas-panel" [class.open]="selectedDemo()">
        @if (selectedDemo(); as demoName) {
          <button class="close-btn" (click)="closeCanvas()" aria-label="Close">×</button>
          <div class="canvas-header">
            <h1 class="canvas-title">{{ demoName }}</h1>
            <p class="canvas-description">{{ getDemoDescription(demoName) }}</p>
          </div>
          <div #svgContainer class="svg-container"></div>
          <div class="controls">
            <button class="control-btn" (click)="runAnimation()">
              <span class="btn-icon">▶</span>
              <span>Run Animation</span>
            </button>
            <button class="control-btn" (click)="resetCanvas()">
              <span class="btn-icon">↻</span>
              <span>Reset</span>
            </button>
          </div>
        } @else {
          <div class="placeholder">
            <div class="placeholder-icon">🎨</div>
            <p>Select a demo from the left panel to view SVG.js in action</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      height: 100vh;
      width: 100%;
      background: #0f0f0f;
      color: #e5e5e5;
    }

    .split-screen {
      display: flex;
      height: 100%;
      width: 100%;
    }

    .pills-panel {
      width: 320px;
      min-width: 320px;
      padding: 1.25rem;
      background: #1a1a1a;
      border-right: 1px solid #2a2a2a;
      overflow-y: auto;
    }

    .pills-panel::-webkit-scrollbar {
      width: 8px;
    }

    .pills-panel::-webkit-scrollbar-track {
      background: #1a1a1a;
    }

    .pills-panel::-webkit-scrollbar-thumb {
      background: #3a3a3a;
      border-radius: 4px;
    }

    .pills-panel::-webkit-scrollbar-thumb:hover {
      background: #4a4a4a;
    }

    .panel-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: #f5f5f5;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #2a2a2a;
    }

    .demo-group {
      margin-bottom: 1rem;
      background: #252525;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 0.75rem;
    }

    .group-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #737373;
      margin-bottom: 0.5rem;
      padding-left: 0.25rem;
    }

    .pill-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.65rem;
      border-radius: 8px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #2a2a2a;
      border: 1px solid #3a3a3a;
      color: #d4d4d4;
      flex: 0 0 auto;
    }

    .pill:hover {
      background: #323232;
      border-color: #4a4a4a;
      transform: translateY(-1px);
    }

    .pill.active {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border-color: #3b82f6;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }

    .pill-icon {
      font-size: 0.95rem;
      line-height: 1;
    }

    .pill-label {
      font-weight: 500;
      white-space: nowrap;
    }

    .canvas-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 2rem;
      background: #0f0f0f;
      overflow: hidden;
      min-height: 0;
    }

    .canvas-header {
      margin-bottom: 1rem;
      flex-shrink: 0;
    }

    .canvas-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #f5f5f5;
      margin-bottom: 0.5rem;
    }

    .canvas-description {
      color: #737373;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .svg-container {
      flex: 1;
      min-height: 300px;
      background: #141414;
      border-radius: 16px;
      border: 1px solid #2a2a2a;
      overflow: hidden;
      position: relative;
    }

    .svg-container svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .controls {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #2a2a2a;
    }

    .control-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      border: 1px solid #333;
      background: #1f1f1f;
      color: #e5e5e5;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .control-btn:hover {
      background: #2a2a2a;
      border-color: #444;
    }

    .control-btn:active {
      transform: scale(0.98);
    }

    .btn-icon {
      font-size: 1rem;
    }

    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #525252;
      text-align: center;
    }

    .placeholder-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .placeholder p {
      font-size: 1.1rem;
      max-width: 400px;
      line-height: 1.6;
    }

    .close-btn {
      display: none;
    }

    /* Mobile styles */
    @media (max-width: 768px) {
      .split-screen {
        flex-direction: column;
        position: relative;
        overflow: hidden;
      }

      .pills-panel {
        width: 100%;
        min-width: 100%;
        padding: 0.75rem;
        border-right: none;
        overflow-y: auto;
        height: 100%;
      }

      .panel-title {
        font-size: 1rem;
        margin-bottom: 0.75rem;
      }

      .demo-group {
        padding: 0.6rem;
        margin-bottom: 0.75rem;
      }

      .group-title {
        font-size: 0.7rem;
        margin-bottom: 0.4rem;
      }

      .pill {
        padding: 0.4rem 0.55rem;
        font-size: 0.75rem;
        gap: 0.4rem;
      }

      .pill-icon {
        font-size: 0.85rem;
      }

      .canvas-panel {
        position: fixed;
        top: 100%;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        padding: 1rem;
        background: #0f0f0f;
        overflow-y: auto;
        transition: top 0.3s ease-out;
      }

      .canvas-panel.open {
        top: 0;
      }

      .canvas-title {
        font-size: 1.4rem;
      }

      .canvas-description {
        font-size: 0.85rem;
      }

      .svg-container {
        min-height: 300px;
      }

      .controls {
        flex-wrap: wrap;
      }

      .control-btn {
        flex: 1;
        min-width: 140px;
        justify-content: center;
      }

      .close-btn {
        position: fixed;
        top: 1rem;
        right: 1rem;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #252525;
        border: 1px solid #333;
        color: #e5e5e5;
        font-size: 1.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 1001;
      }

      .close-btn:hover {
        background: #2a2a2a;
        border-color: #444;
      }
    }

    @media (min-width: 769px) {
      .close-btn {
        display: none;
      }
    }
  `]
})
export class AppComponent implements OnDestroy {
  svgContainer = viewChild<ElementRef>('svgContainer');
  private draw: Svg | null = null;
  private animations: any[] = [];
  private animationFrameId: number | null = null;
  private progressTimeoutId: any = null;

  demoGroups: DemoGroup[] = [
    {
      title: 'Basic Drawing',
      demos: [
        { name: 'Basic Shapes', icon: '□' },
        { name: 'Gradients', icon: '◧' },
        { name: 'Text Effects', icon: 'A' }
      ]
    },
    {
      title: 'Animation',
      demos: [
        { name: 'Animations', icon: '◐' },
        { name: 'Particles', icon: '✦' },
        { name: 'Solar System', icon: '☀' }
      ]
    },
    {
      title: 'Interactive',
      demos: [
        { name: 'Transforms', icon: '⤡' },
        { name: 'Interactive', icon: '☛' }
      ]
    }
  ];

  selectedDemo = signal<string | null>(null);

  private demoDescriptions: { [key: string]: string } = {
    'Basic Shapes': 'Draw rectangles, circles, ellipses, lines, and polygons with SVG.js',
    'Animations': 'Animate position, size, color, and opacity with smooth transitions',
    'Gradients': 'Create stunning linear and radial gradients for fills and strokes',
    'Transforms': 'Rotate, scale, skew, and translate elements with ease',
    'Text Effects': 'Style and animate text with custom fonts and effects',
    'Interactive': 'Handle click, hover, and drag events on SVG elements',
    'Particles': 'Generate animated particle systems with physics',
    'Solar System': 'Animated solar system with orbiting planets'
  };

  getDemoDescription(name: string): string {
    return this.demoDescriptions[name] || '';
  }

  selectDemo(demoName: string) {
    this.selectedDemo.set(demoName);
    afterNextRender(() => {
      this.initCanvas();
    });
  }

  closeCanvas() {
    this.selectedDemo.set(null);
  }

  private initCanvas() {
    this.clearCanvas();

    const container = this.svgContainer()?.nativeElement;
    if (!container) {
      console.warn('SVG container not found');
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    console.log('Initializing SVG canvas:', width, height, container);

    try {
      this.draw = SVG().addTo(container).size(width, height);
      console.log('SVG draw instance created:', this.draw);
    } catch (error) {
      console.error('Failed to create SVG instance:', error);
      return;
    }

    const demo = this.selectedDemo();
    if (demo === 'Basic Shapes') this.drawBasicShapes();
    else if (demo === 'Animations') this.drawAnimations();
    else if (demo === 'Gradients') this.drawGradients();
    else if (demo === 'Transforms') this.drawTransforms();
    else if (demo === 'Text Effects') this.drawTextEffects();
    else if (demo === 'Interactive') this.drawInteractive();
    else if (demo === 'Particles') this.drawParticles();
    else if (demo === 'Solar System') this.drawSolarSystem();
    
    console.log('Demo initialized:', demo);
  }

  private clearCanvas() {
    // Cancel animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clear progress timeout
    if (this.progressTimeoutId !== null) {
      clearTimeout(this.progressTimeoutId);
      this.progressTimeoutId = null;
    }

    // Stop all SVG animations
    this.animations.forEach(anim => anim.stop());
    this.animations = [];

    // Clear SVG canvas and remove instance
    if (this.draw) {
      this.draw.clear();
      this.draw.remove();
      this.draw = null;
    }

    // Reset particle and planet arrays
    this.particles = [];
    this.planets = [];
    this.sun = null;
    this.ball = null;
    this.progressRing = null;
  }

  ngOnDestroy() {
    this.clearCanvas();
  }

  runAnimation() {
    const demo = this.selectedDemo();
    if (demo === 'Basic Shapes') this.animateBasicShapes();
    else if (demo === 'Animations') this.runAnimationSequence();
    else if (demo === 'Transforms') this.animateTransforms();
    else if (demo === 'Particles') this.animateParticles();
    else if (demo === 'Solar System') this.animateSolarSystem();
  }

  resetCanvas() {
    this.initCanvas();
  }

  private drawBasicShapes() {
    if (!this.draw) return;
    const draw = this.draw;
    const cx = Number(draw.width()) / 2;
    const cy = Number(draw.height()) / 2;

    // Rectangle
    draw.rect(120, 80).move(cx - 180, cy - 120).fill('#3b82f6').radius(10);

    // Circle
    draw.circle(100).move(cx - 50, cy - 50).fill('#10b981');

    // Ellipse
    draw.ellipse(140, 80).move(cx + 80, cy - 40).fill('#f59e0b');

    // Polygon
    draw.polygon('0,-50 43,-25 43,25 0,50 -43,25 -43,-25').move(cx, cy + 80).fill('#ef4444');

    // Line with stroke
    draw.line(cx - 200, cy + 100, cx + 200, cy + 100).stroke({ width: 4, color: '#8b5cf6' });
  }

  private animateBasicShapes() {
    if (!this.draw) return;
    const draw = this.draw;
    const shapes = draw.children();

    shapes.forEach((shape: any, i: number) => {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      const animation = shape.animate().duration(600).fill(colors[(i + 1) % colors.length]);
      this.animations.push(animation);
    });
  }

  private drawAnimations() {
    if (!this.draw) return;
    const draw = this.draw;
    const cx = Number(draw.width()) / 2;
    const cy = Number(draw.height()) / 2;

    // Bouncing ball
    const ball = draw.circle(40).fill('#3b82f6');
    this.ball = ball;
    this.ballPos = { x: cx, y: cy, vx: 3, vy: 2 };

    // Progress ring
    const ring = draw.circle(80).fill('none').stroke({ width: 8, color: '#10b981' });
    ring.move(cx + 100, cy);
    this.progressRing = ring;
    this.progress = 0;
  }

  private ball: any = null;
  private ballPos: any = null;
  private progressRing: any = null;
  private progress: number = 0;
  private particles: any[] = [];
  private planets: any[] = [];
  private sun: any = null;

  private runAnimationSequence() {
    if (!this.draw) return;
    
    // Cancel any existing animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Animate bouncing ball
    const animate = () => {
      if (!this.ball || this.selectedDemo() !== 'Animations') return;

      const draw = this.draw;
      if (!draw) return;

      const width = Number(draw.width());
      const height = Number(draw.height());

      this.ballPos.x += this.ballPos.vx;
      this.ballPos.y += this.ballPos.vy;

      if (this.ballPos.x <= 20 || this.ballPos.x >= width - 20) {
        this.ballPos.vx *= -1;
      }
      if (this.ballPos.y <= 20 || this.ballPos.y >= height - 20) {
        this.ballPos.vy *= -1;
      }

      this.ball.move(this.ballPos.x - 20, this.ballPos.y - 20);
      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Clear existing progress timeout
    if (this.progressTimeoutId !== null) {
      clearTimeout(this.progressTimeoutId);
      this.progressTimeoutId = null;
    }

    // Animate progress ring
    this.progress = 0;
    const animateProgress = () => {
      if (!this.progressRing || this.selectedDemo() !== 'Animations') return;

      this.progress += 2;
      if (this.progress > 360) this.progress = 0;

      const dasharray = (2 * Math.PI * 40) * (this.progress / 360);
      this.progressRing.stroke({
        width: 8,
        color: '#10b981',
        dasharray: `${dasharray} ${2 * Math.PI * 40 - dasharray}`
      });

      this.progressTimeoutId = setTimeout(animateProgress, 50);
    };

    animateProgress();
  }

  private drawGradients() {
    if (!this.draw) return;
    const draw = this.draw;
    const cx = Number(draw.width()) / 2;
    const cy = Number(draw.height()) / 2;

    // Linear gradient
    const linearGrad = draw.gradient('linear', (stop: any) => {
      stop.at(0, '#3b82f6');
      stop.at(50, '#8b5cf6');
      stop.at(100, '#ec4899');
    });

    draw.rect(200, 150).move(cx - 250, cy - 75).fill(linearGrad).radius(15);

    // Radial gradient
    const radialGrad = draw.gradient('radial', (stop: any) => {
      stop.at(0, '#10b981');
      stop.at(60, '#059669');
      stop.at(100, '#047857');
    });

    draw.circle(120).move(cx + 50, cy - 60).fill(radialGrad);

    // Gradient on stroke - use fill instead for gradient stroke effect
    const strokeGrad = draw.gradient('linear', (stop: any) => {
      stop.at(0, '#f59e0b');
      stop.at(100, '#ef4444');
    });

    draw.ellipse(180, 100).move(cx - 90, cy + 50).fill(strokeGrad);
  }

  private drawTransforms() {
    if (!this.draw) return;
    const draw = this.draw;
    const cx = Number(draw.width()) / 2;
    const cy = Number(draw.height()) / 2;

    // Original
    draw.rect(80, 80).move(cx - 150, cy - 40).fill('#6b7280');
    draw.text('Original').move(cx - 140, cy + 50).fill('#9ca3af').font({ size: 14 });

    // Rotated
    draw.rect(80, 80).move(cx - 40, cy - 40).fill('#3b82f6').rotate(30, cx, cy);
    draw.text('Rotate 30°').move(cx - 35, cy + 50).fill('#9ca3af').font({ size: 14 });

    // Scaled
    draw.rect(80, 80).move(cx + 70, cy - 40).fill('#10b981').scale(1.3, cx + 110, cy);
    draw.text('Scale 1.3x').move(cx + 75, cy + 50).fill('#9ca3af').font({ size: 14 });

    // Skewed
    draw.rect(80, 80).move(cx - 150, cy + 80).fill('#f59e0b').skew(15, 0);
    draw.text('Skew').move(cx - 135, cy + 180).fill('#9ca3af').font({ size: 14 });

    // Combined
    draw.rect(80, 80).move(cx + 70, cy + 80).fill('#ef4444')
      .rotate(15).scale(1.2).translate(cx + 110, cy + 120);
    draw.text('Combined').move(cx + 75, cy + 180).fill('#9ca3af').font({ size: 14 });
  }

  private animateTransforms() {
    if (!this.draw) return;
    const draw = this.draw;
    const shapes = draw.children().filter((s: any) => s.type === 'rect');

    shapes.forEach((shape: any, i: number) => {
      const animation = shape.animate().duration(1000).loop(true, true);
      if (i === 1) animation.rotate(360);
      else if (i === 2) animation.scale(1.5);
      else if (i === 4) animation.rotate(180).scale(1.3);
      this.animations.push(animation);
    });
  }

  private drawTextEffects() {
    if (!this.draw) return;
    const draw = this.draw;
    const cx = Number(draw.width()) / 2;
    const cy = Number(draw.height()) / 2;

    // Basic styled text
    draw.text('SVG.js').move(cx - 80, cy - 60)
      .fill('#3b82f6')
      .font({ size: 48, weight: 'bold' });

    // Gradient text
    const textGrad = draw.gradient('linear', (stop: any) => {
      stop.at(0, '#10b981');
      stop.at(100, '#3b82f6');
    });

    draw.text('Gradient').move(cx - 70, cy)
      .fill(textGrad)
      .font({ size: 36 });

    // Outlined text
    draw.text('Outlined').move(cx - 75, cy + 50)
      .fill('none')
      .stroke({ width: 2, color: '#f59e0b' })
      .font({ size: 32 });

    // Text with opacity
    for (let i = 0; i < 5; i++) {
      draw.text('Echo').move(cx - 50 + i * 8, cy + 100 + i * 5)
        .fill('#8b5cf6')
        .font({ size: 28 })
        .opacity(1 - i * 0.15);
    }
  }

  private drawInteractive() {
    if (!this.draw) return;
    const draw = this.draw;
    const cx = Number(draw.width()) / 2;
    const cy = Number(draw.height()) / 2;

    draw.text('Click or hover on shapes!').move(cx - 120, cy - 150)
      .fill('#6b7280')
      .font({ size: 16 });

    // Clickable circles
    for (let i = 0; i < 5; i++) {
      const circle = draw.circle(60)
        .move(cx - 150 + i * 75, cy)
        .fill('#3b82f6')
        .css('cursor', 'pointer');

      circle.on('click', function(this: any) {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        this.animate().duration(300).fill(randomColor);
      });

      circle.on('mouseover', function(this: any) {
        this.animate().duration(200).scale(1.2);
      });

      circle.on('mouseout', function(this: any) {
        this.animate().duration(200).scale(1);
      });
    }
  }

  private drawParticles() {
    if (!this.draw) return;
    const draw = this.draw;
    const width = Number(draw.width());
    const height = Number(draw.height());
    this.particles = [];

    // Create particles
    for (let i = 0; i < 50; i++) {
      const size = Math.random() * 6 + 2;
      const particle = draw.circle(size)
        .fill(`hsl(${Math.random() * 360}, 70%, 60%)`)
        .move(Math.random() * width, Math.random() * height);

      this.particles.push({
        element: particle,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    }
  }

  private animateParticles() {
    if (!this.draw) return;
    
    // Cancel any existing animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    const animate = () => {
      if (this.selectedDemo() !== 'Particles') return;

      const draw = this.draw;
      if (!draw) return;

      const width = Number(draw.width());
      const height = Number(draw.height());

      this.particles.forEach(p => {
        let x = parseFloat(p.element.attr('x')) + p.vx;
        let y = parseFloat(p.element.attr('y')) + p.vy;

        if (x <= 0 || x >= width - parseFloat(p.element.attr('width'))) p.vx *= -1;
        if (y <= 0 || y >= height - parseFloat(p.element.attr('height'))) p.vy *= -1;

        p.element.move(x, y);
      });

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  private drawSolarSystem() {
    if (!this.draw) return;
    const draw = this.draw;
    const cx = Number(draw.width()) / 2;
    const cy = Number(draw.height()) / 2;

    // Sun
    this.sun = draw.circle(60).move(cx - 30, cy - 30).fill('#fbbf24');
    this.sun.glow(20, '#fbbf24');

    // Planet data: [orbitRadius, size, color, speed]
    const planetData = [
      [80, 8, '#9ca3af', 0.04],    // Mercury
      [110, 12, '#d4a574', 0.03],  // Venus
      [140, 14, '#3b82f6', 0.02],  // Earth
      [175, 10, '#ef4444', 0.016], // Mars
      [220, 28, '#d4a574', 0.01],  // Jupiter
      [270, 24, '#f59e0b', 0.008], // Saturn
    ];

    // Draw orbit paths
    planetData.forEach(([orbitRadius]: any) => {
      draw.circle(orbitRadius * 2)
        .move(cx - orbitRadius, cy - orbitRadius)
        .fill('none')
        .stroke({ width: 1, color: '#333' });
    });

    // Create planets
    this.planets = planetData.map(([orbitRadius, size, color]: any) => {
      const planet = draw.circle(size).fill(color as string);
      return {
        element: planet,
        orbitRadius: orbitRadius as number,
        angle: Math.random() * Math.PI * 2,
        speed: planetData.find((d: any) => d[0] === orbitRadius)?.[3] || 0.02
      };
    });
  }

  private animateSolarSystem() {
    if (!this.draw) return;
    
    // Cancel any existing animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    const animate = () => {
      if (this.selectedDemo() !== 'Solar System') return;

      const draw = this.draw;
      if (!draw) return;

      const cx = Number(draw.width()) / 2;
      const cy = Number(draw.height()) / 2;

      // Animate sun glow
      if (this.sun) {
        const glowSize = 15 + Math.sin(Date.now() / 200) * 5;
        this.sun.glow(glowSize, '#fbbf24');
      }

      // Animate planets
      this.planets.forEach(planet => {
        planet.angle += planet.speed;
        const x = cx + Math.cos(planet.angle) * planet.orbitRadius - planet.element.attr('width') / 2;
        const y = cy + Math.sin(planet.angle) * planet.orbitRadius - planet.element.attr('height') / 2;
        planet.element.move(x, y);
      });

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }
}
