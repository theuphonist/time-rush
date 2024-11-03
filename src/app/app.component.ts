import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Button } from 'primeng/button';
import { HeaderComponent } from './shared/header.component';

@Component({
  selector: 'time-rush-root',
  standalone: true,
  imports: [RouterOutlet, Button, HeaderComponent],
  template: '<router-outlet/>',
})
export class AppComponent {
  title = 'time-rush';
}
