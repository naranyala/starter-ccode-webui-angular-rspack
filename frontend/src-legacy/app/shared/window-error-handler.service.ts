import { Inject, Injectable, NgZone, PLATFORM_ID } from "@angular/core";

@Injectable({ providedIn: "root" })
export class WindowErrorHandlerService {
  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  init(): void {}
  destroy(): void {}
}
