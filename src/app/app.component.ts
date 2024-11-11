import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Button } from 'primeng/button';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'time-rush-root',
  standalone: true,
  imports: [RouterOutlet, Button, ToastModule],
  template: '<router-outlet/> <p-toast position="top-center"/>',
})
export class AppComponent {
  title = 'time-rush';
}
