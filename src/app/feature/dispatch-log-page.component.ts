import { Component, inject } from '@angular/core';
import { StateService } from '../data-access/state.service';
import { DispatchLogEntryComponent } from '../ui/dispatch-log-entry.component';
import { HeaderComponent } from '../ui/header.component';

@Component({
  selector: 'time-rush-dispatch-log-page',
  standalone: true,
  imports: [HeaderComponent, DispatchLogEntryComponent],
  template: `
    <div class="flex flex-column gap-3 mt-3">
      @for (entry of dispatchLog(); track entry.id) {
      <time-rush-dispatch-log-entry [logEntry]="entry" />
      <div style="border-bottom: 1px solid" class="border-200"></div>
      }
    </div>
  `,
})
export class DispatchLogPageComponent {
  private readonly state = inject(StateService);

  dispatchLog = this.state.dispatchLog;
}
