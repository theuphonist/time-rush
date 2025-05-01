import {
  APP_INITIALIZER,
  ApplicationConfig,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';
import { ConfirmationService, MessageService } from 'primeng/api';
import { routes } from './app.routes';
import { StateService } from './data-access/state.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // PrimeNG
    MessageService,
    ConfirmationService,

    // Initialization
    {
      provide: APP_INITIALIZER,
      useFactory: (state: StateService) => {
        return (): void => {
          // initialize app on startup
          state.dispatch(state.actions.appInitialized, undefined);

          // re-initialize app when user leaves and comes back. some browsers
          // won't automatically initialize on sleep/wake, so we force it here
          if (!isDevMode()) {
            document.addEventListener('visibilitychange', () => {
              if (!document.hidden) {
                state.dispatch(state.actions.appInitialized, undefined);
              }
            });
          }
        };
      },
      deps: [StateService],
      multi: true,
    },

    // Other
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideHttpClient(),
  ],
};
