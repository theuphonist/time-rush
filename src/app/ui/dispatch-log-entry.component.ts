import { Component, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DispatchLogEntry } from '../util/state-types';

@Component({
  selector: 'time-rush-dispatch-log-entry',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <h3 class="text-base m-0">{{ logEntry().actionName }}</h3>
    <div class="flex justify-content-between align-items-center mt-3">
      <div class="flex flex-column gap-3">
        <p class="m-0">
          Dispatched: {{ logEntry().dispatchTimestamp.toLocaleString() }}
        </p>
        <p class="m-0">
          Resolved: {{ logEntry().resolveTimestamp.toLocaleString() }}
        </p>
      </div>
      <p-button
        ariaLabel="Show state in console"
        icon="pi pi-print"
        (click)="onLogButtonClick()"
      ></p-button>
    </div>
  `,
})
export class DispatchLogEntryComponent {
  readonly logEntry = input.required<DispatchLogEntry>();

  onLogButtonClick() {
    console.log(this.logEntry().diff);
  }
}
