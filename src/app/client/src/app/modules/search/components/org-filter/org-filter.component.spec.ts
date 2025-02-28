import {of as observableOf,  Observable } from 'rxjs';
import { ComponentFixture, TestBed, inject,  } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
  SharedModule, ServerResponse, PaginationService, ResourceService,
  ConfigService, ToasterService, INoResultMessage
} from '@sunbird/shared';
import { SearchService, UserService, LearnerService, ContentService } from '@sunbird/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import * as _ from 'lodash-es';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { OrgFilterComponent } from './org-filter.component';
import { OrgSearchComponent } from './../org-search/org-search.component';
import { Response } from './org-filter.component.spec.data';
import {APP_BASE_HREF} from '@angular/common';

xdescribe('OrgFilterComponent', () => {
  let component: OrgFilterComponent;
  let fixture: ComponentFixture<OrgFilterComponent>;
  let parentcomponent: OrgSearchComponent;
  let parentfixture: ComponentFixture<OrgSearchComponent>;
  const fakeActivatedRoute = {
    'params': observableOf({ pageNumber: '1' }),
    'queryParams': observableOf({ OrgType: ['012352495007170560157'] })
  };
  class RouterStub {
    navigate = jasmine.createSpy('navigate');
  }


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, SharedModule.forRoot(), RouterTestingModule],
      declarations: [OrgFilterComponent, OrgSearchComponent],
      providers: [ResourceService, SearchService, PaginationService, UserService,
        LearnerService, ContentService, ConfigService, ToasterService,
        { provide: Router, useClass: RouterStub },
        { provide: ActivatedRoute, useValue: fakeActivatedRoute },
        { provide: APP_BASE_HREF, useValue: '/' }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
    fixture = TestBed.createComponent(OrgFilterComponent);
    component = fixture.componentInstance;
    parentfixture = TestBed.createComponent(OrgSearchComponent);
    parentcomponent = parentfixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });


  it('should call resetFilters method ', inject([ConfigService, Router],
    (configService, route) => {
      component.resetFilters();
      expect(route.navigate).toHaveBeenCalledWith(['/search/Organisations', 1]);
      fixture.detectChanges();
    }));

  // xit('should take input of query param ', inject([ConfigService, OrgTypeService, Router],
  //   (configService, orgTypeService, route) => {
  //     component.queryParams = { OrgType: '0123462652405350403' };
  //     spyOn(orgTypeService, 'getOrgTypes').and.callFake(() => observableOf(Response.successData));
  //     fixture.detectChanges();
  // }));

  // xit('should call removeFilterSelection ', inject([ConfigService, OrgTypeService, Router],
  //   (configService, orgTypeService, route) => {
  //     component.queryParams = { OrgType: '0123462652405350403' };
  //     component.removeFilterSelection('OrgType', '01243890163646464054');
  //     fixture.detectChanges();
  // }));
});
