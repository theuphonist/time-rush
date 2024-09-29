import { Component, input } from '@angular/core';

@Component({
  selector: 'turnt-header',
  standalone: true,
  imports: [],
  template: '<h1 class="fixed top-0 left-0 my-0 w-full">{{text()}}</h1>',
  styles: `h1 {
    padding-left: var(--base-x-padding-margin);
    padding-right: var(--base-x-padding-margin);
    padding-top: var(--base-top-padding-margin);
    padding-bottom: 0.5rem;
    backdrop-filter: blur(4px);
  }`,
})
export class HeaderComponent {
  readonly text = input.required<string>();
}
