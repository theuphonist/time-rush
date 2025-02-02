import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'time-rush-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule],
  template: `
    <router-outlet />
    <p-toast position="top-center" />
    <p-confirmDialog [style]="{ width: '90%' }" />
  `,
  styles: `
  `,
})
export class AppComponent {
  title = 'time-rush';
}
