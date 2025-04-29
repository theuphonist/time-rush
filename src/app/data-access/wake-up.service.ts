import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root',
})
export class WakeUpService {
  private readonly state = inject(StateService);

  private lastHeartbeat: number | undefined = undefined;

  // if any heartbeats were missed, consider the app to have been re-initialized
  private readonly heartbeat = interval(1000)
    .pipe(takeUntilDestroyed())
    .subscribe(() => {
      if (this.lastHeartbeat && Date.now() - this.lastHeartbeat > 1500) {
        this.state.dispatch(this.state.actions.appInitialized, undefined);
      }

      this.lastHeartbeat = Date.now();
    });
}
