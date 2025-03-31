import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL, COMMON_HEADERS } from '../util/constants';

type QueryParams =
  | HttpParams
  | Record<
      string,
      string | number | boolean | ReadonlyArray<string | number | boolean>
    >;

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);

  post<T>(
    endpointOrSegments: string | string[],
    body: any,
    queryParams?: QueryParams
  ): Observable<T> {
    let endpoint: string;

    if (Array.isArray(endpointOrSegments)) {
      endpoint = endpointOrSegments.join('/');
    } else {
      endpoint = endpointOrSegments;
    }

    const response = this.http.post<T>(
      `${API_URL}/${endpoint}`,
      JSON.stringify(body),
      {
        headers: COMMON_HEADERS,
        params: queryParams,
      }
    );

    return response;
  }

  get<T>(
    endpointOrSegments: string | string[],
    queryParams?: QueryParams
  ): Observable<T> {
    let endpoint: string;

    if (Array.isArray(endpointOrSegments)) {
      endpoint = endpointOrSegments.join('/');
    } else {
      endpoint = endpointOrSegments;
    }

    const response = this.http.get<T>(`${API_URL}/${endpoint}`, {
      headers: COMMON_HEADERS,
      params: queryParams,
    });

    return response;
  }

  update<T>(
    endpointOrSegments: string | string[],
    body: any,
    queryParams?: QueryParams
  ): Observable<T> {
    let endpoint: string;

    if (Array.isArray(endpointOrSegments)) {
      endpoint = endpointOrSegments.join('/');
    } else {
      endpoint = endpointOrSegments;
    }

    const response = this.http.put<T>(
      `${API_URL}/${endpoint}`,
      JSON.stringify(body),
      {
        headers: COMMON_HEADERS,
        params: queryParams,
      }
    );

    return response;
  }

  delete<T>(
    endpointOrSegments: string | string[],
    queryParams?: QueryParams
  ): Observable<T> {
    let endpoint: string;

    if (Array.isArray(endpointOrSegments)) {
      endpoint = endpointOrSegments.join('/');
    } else {
      endpoint = endpointOrSegments;
    }

    const response = this.http.delete<T>(`${API_URL}/${endpoint}`, {
      headers: COMMON_HEADERS,
      params: queryParams,
    });

    return response;
  }
}
