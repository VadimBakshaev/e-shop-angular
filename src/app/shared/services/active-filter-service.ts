import { inject, Injectable } from '@angular/core';
import { ActiveParamsType } from '../../../types/active-params.type';
import { BehaviorSubject, Observable } from 'rxjs';
import { ActivatedRoute, Params, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ActiveFilterService {
  private router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  private activeFilter = new BehaviorSubject<ActiveParamsType>({ types: [] });
  public activeFilter$: Observable<ActiveParamsType> = this.activeFilter.asObservable();

  constructor() {
    this.updateFilter(this.activatedRoute.snapshot.queryParams);
    // this.activatedRoute.queryParams.subscribe(data => {
    //   console.log('QueryParams изменились:', data);
    //   this.updateFilter(data);
    // });
  }

  private updateFilter(params: Params) {
    const activeParams: ActiveParamsType = { types: [] };

    if (params['types']) activeParams.types = Array.isArray(params['types']) ? params['types'] : [params['types']];
    if (params.hasOwnProperty('heightTo')) activeParams.heightTo = params['heightTo'];
    if (params.hasOwnProperty('heightFrom')) activeParams.heightFrom = params['heightFrom'];
    if (params.hasOwnProperty('diameterFrom')) activeParams.diameterFrom = params['diameterFrom'];
    if (params.hasOwnProperty('diameterTo')) activeParams.diameterTo = params['diameterTo'];
    if (params.hasOwnProperty('sort')) activeParams.sort = params['sort'];
    if (params.hasOwnProperty('page')) activeParams.page = Number(params['page']);

    this.activeFilter.next(activeParams);
  }

  public setActiveFilter(params: ActiveParamsType | Params) {
    this.updateFilter(params);
    this.router.navigate(['/catalog'], {
      queryParams: params
    });
  }

  public getActiveFilter(): ActiveParamsType {
    return this.activeFilter.getValue();
  }
}
