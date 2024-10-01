import { booleanAttribute, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'turnt-header',
  standalone: true,
  imports: [RouterLink],
  template: ` <div
    class="flex fixed top-0 left-0 w-full h-6rem align-items-end background-blur pb-2 z-5"
    [class.header-border]="alwaysSmall()"
  >
    @if (!alwaysSmall()) {
    <h1 class="my-0 w-full large-header">{{ text() }}</h1>
    } @else {
    <div class="w-full grid">
      <div class="col-4 pl-5">
        @if (routeToPreviousPage()){
        <a [routerLink]="routeToPreviousPage()">
          <i class="pi pi-arrow-left text-primary"></i>
        </a>
        }
      </div>
      <div class="col-4 text-center">
        <h3 class="my-0 justify-self-center small-header">
          {{ text() }}
        </h3>
      </div>
    </div>

    }
  </div>`,
  styles: `
  .background-blur {
    backdrop-filter: blur(18px);
  }
  .large-header {
    margin-left: var(--base-x-padding-margin);
    margin-right: var(--base-x-padding-margin);
  }
  .header-border  {
    border-bottom: solid 1px var(--surface-border)
  }`,
})
export class HeaderComponent {
  readonly text = input.required<string>();
  readonly alwaysSmall = input(false, { transform: booleanAttribute });
  readonly routeToPreviousPage = input<string>();
}
