import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private searchSubject: Subject<string> = new Subject<string>();
  public search$: Observable<string> = this.searchSubject.asObservable();

  constructor() {}

  setSearch(query: string): void {
    this.searchSubject.next(query);
  }
}
