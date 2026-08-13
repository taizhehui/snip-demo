import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Link {
  code: string;
  url: string;
  shortUrl: string;
  hits: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class LinkService {
  private http = inject(HttpClient);
  // Same-origin: the bundle serves UI + API together; `ng serve` proxies /api (see proxy.conf.json).
  private base = '';

  list(): Observable<Link[]> {
    return this.http.get<Link[]>(`${this.base}/api/links`);
  }

  create(url: string): Observable<Link> {
    return this.http.post<Link>(`${this.base}/api/links`, { url });
  }
}
