import { Injectable, computed, signal } from '@angular/core';

export interface PlatformInfo {
  isBrowser: boolean;
  isServer: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
  isChromium: boolean;
  screen: {
    width: number;
    height: number;
    pixelRatio: number;
    orientation?: string;
  };
  viewport: {
    width: number;
    height: number;
  };
  language: string;
  online: boolean;
  touchPoints: number;
}

export interface BreakpointState {
  xs: boolean; // < 640px
  sm: boolean; // >= 640px
  md: boolean; // >= 768px
  lg: boolean; // >= 1024px
  xl: boolean; // >= 1280px
  xxl: boolean; // >= 1536px
}

/**
 * Platform Service
 * Provides platform detection and reactive viewport information
 */
@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private viewportSignal = signal({ width: 0, height: 0 });
  private onlineSignal = signal(true);

  readonly breakpoints = computed<BreakpointState>(() => {
    const width = this.viewportSignal().width;
    return {
      xs: width < 640,
      sm: width >= 640,
      md: width >= 768,
      lg: width >= 1024,
      xl: width >= 1280,
      xxl: width >= 1536,
    };
  });

  readonly isMobile = computed(() => this.viewportSignal().width < 768);
  readonly isTablet = computed(() => {
    const width = this.viewportSignal().width;
    return width >= 768 && width < 1024;
  });
  readonly isDesktop = computed(() => this.viewportSignal().width >= 1024);

  private platformInfo: PlatformInfo | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.viewportSignal.set({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      this.onlineSignal.set(navigator.onLine);

      window.addEventListener('resize', () => {
        this.viewportSignal.set({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      });

      window.addEventListener('online', () => this.onlineSignal.set(true));
      window.addEventListener('offline', () => this.onlineSignal.set(false));
    }
  }

  /**
   * Get comprehensive platform information
   */
  getPlatformInfo(): PlatformInfo {
    if (this.platformInfo) {
      return this.platformInfo;
    }

    const isBrowser = typeof window !== 'undefined';
    const nav = isBrowser ? navigator : null;
    const ua = nav?.userAgent || '';

    const platformInfo: PlatformInfo = {
      isBrowser,
      isServer: !isBrowser,
      isMobile: this.isMobile(),
      isTablet: this.isTablet(),
      isDesktop: this.isDesktop(),
      isIOS: /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream,
      isAndroid: /Android/.test(ua),
      isMac: /Macintosh/.test(ua),
      isWindows: /Windows/.test(ua),
      isLinux: /Linux/.test(ua) && !/Android/.test(ua),
      isChrome: /Chrome/.test(ua) && !/Edg/.test(ua),
      isFirefox: /Firefox/.test(ua),
      isSafari: /Safari/.test(ua) && !/Chrome/.test(ua) && !/Edg/.test(ua),
      isEdge: /Edg/.test(ua),
      isChromium: /Chrome/.test(ua),
      screen: isBrowser
        ? {
            width: screen.width,
            height: screen.height,
            pixelRatio: window.devicePixelRatio,
            orientation: (screen.orientation as any)?.type,
          }
        : { width: 0, height: 0, pixelRatio: 1 },
      viewport: this.viewportSignal(),
      language: nav?.language || 'en',
      online: nav?.onLine ?? true,
      touchPoints: nav?.maxTouchPoints || 0,
    };

    this.platformInfo = platformInfo;
    return platformInfo;
  }

  /**
   * Get current viewport size
   */
  getViewport(): { width: number; height: number } {
    return this.viewportSignal();
  }

  /**
   * Get reactive viewport signal
   */
  watchViewport() {
    return this.viewportSignal.asReadonly();
  }

  /**
   * Get reactive breakpoint state
   */
  watchBreakpoints() {
    return this.breakpoints;
  }

  /**
   * Check if current breakpoint matches
   */
  isBreakpoint(bp: keyof BreakpointState): boolean {
    return this.breakpoints()[bp];
  }

  /**
   * Get CSS class for current breakpoint
   */
  getBreakpointClass(): string {
    const bp = this.breakpoints();
    if (bp.xxl) return 'bp-xxl';
    if (bp.xl) return 'bp-xl';
    if (bp.lg) return 'bp-lg';
    if (bp.md) return 'bp-md';
    if (bp.sm) return 'bp-sm';
    return 'bp-xs';
  }

  /**
   * Check if device has touch support
   */
  hasTouch(): boolean {
    return this.getPlatformInfo().touchPoints > 0;
  }

  /**
   * Check if device is touch-capable (touch or hybrid)
   */
  isTouchCapable(): boolean {
    const info = this.getPlatformInfo();
    return info.touchPoints > 0 || info.isMobile || info.isTablet;
  }

  /**
   * Get OS name
   */
  getOS(): string {
    const info = this.getPlatformInfo();
    if (info.isIOS) return 'iOS';
    if (info.isAndroid) return 'Android';
    if (info.isMac) return 'macOS';
    if (info.isWindows) return 'Windows';
    if (info.isLinux) return 'Linux';
    return 'Unknown';
  }

  /**
   * Get browser name
   */
  getBrowser(): string {
    const info = this.getPlatformInfo();
    if (info.isEdge) return 'Edge';
    if (info.isChrome) return 'Chrome';
    if (info.isFirefox) return 'Firefox';
    if (info.isSafari) return 'Safari';
    return 'Unknown';
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.onlineSignal();
  }

  /**
   * Watch online status
   */
  watchOnlineStatus() {
    return this.onlineSignal.asReadonly();
  }
}
