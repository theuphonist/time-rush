import {
  APP_INITIALIZER,
  ApplicationConfig,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';
import { ConfirmationService, MessageService } from 'primeng/api';
import { routes } from './app.routes';
import { StateService } from './data-access/state.service';

function notifyStateOfInitialization(state: StateService) {
  return (): void => state.dispatch(state.actions.appInitialized, undefined);
}

export const appConfig: ApplicationConfig = {
  providers: [
    // PrimeNG
    MessageService,
    ConfirmationService,

    // Initialization
    {
      provide: APP_INITIALIZER,
      useFactory: notifyStateOfInitialization,
      deps: [StateService],
      multi: true,
    },

    // Other
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
    provideAnimationsAsync(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideHttpClient(),
  ],
};
