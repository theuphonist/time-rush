import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

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
  private readonly router = inject(Router);

  @HostListener('document:keydown', ['$event'])
  navigateToDispatchLog(event: KeyboardEvent) {
    if (event.key === 'D' && event.ctrlKey && event.altKey && event.shiftKey) {
      this.router.navigate(['/log']);
    }
  }
}
