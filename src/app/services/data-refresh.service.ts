import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataRefreshService {
  private refreshSubject = new BehaviorSubject<boolean>(false);
  public refresh$ = this.refreshSubject.asObservable();

  triggerRefresh() {
    this.refreshSubject.next(true);
  }

  resetRefreshFlag() {
    this.refreshSubject.next(false);
  }
}