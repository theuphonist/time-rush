import { FormControl, FormGroup } from '@angular/forms';

export type AutogeneratedProperties =
  | 'id'
  | 'joinCode'
  | 'createdAt'
  | 'sessionId'
  | 'position';

export type OmitAutogeneratedProperties<T> = Omit<T, AutogeneratedProperties>;

export type ToFormGroup<T> = FormGroup<{
  [K in keyof T]: FormControl<T[K] | null>;
}>;
