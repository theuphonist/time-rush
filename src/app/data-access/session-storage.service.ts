import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SessionStorageService {
  setItem(key: string, value: string | object) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  getItem(key: string): string | object | null {
    const item = sessionStorage.getItem(key);

    if (item === null) {
      return null;
    }

    return JSON.parse(item);
  }
}
