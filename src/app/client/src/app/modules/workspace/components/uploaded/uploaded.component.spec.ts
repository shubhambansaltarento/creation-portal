
import {throwError as observableThrowError, of as observableOf,  Observable } from 'rxjs';
import { ComponentFixture, TestBed, inject, tick, fakeAsync,  } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UploadedComponent } from './uploaded.component';
import { SharedModule, PaginationService, ToasterService, ResourceService } from '@sunbird/shared';
import { SearchService, ContentService } from '@sunbird/core';
import { WorkSpaceService } from '../../services';
import { UserService, LearnerService, CoursesService, PermissionService } from '@sunbird/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import * as mockData from './uploaded.component.spec.data';
import { TelemetryModule } from '@sunbird/telemetry';
import { NgInviewModule } from 'angular-inport';
import { APP_BASE_HREF,DatePipe } from '@angular/common';
const testData = mockData.mockRes;
xdescribe('UploadedComponent', () => {
  let component: UploadedComponent;
  let fixture: ComponentFixture<UploadedComponent>;
  const fakeActivatedRoute = {
    'params': observableOf({ 'pageNumber': 1 }),
    snapshot: {
      params: [
        {
          pageNumber: '1',
        }
      ],
      data: {
        telemetry: {
          env: 'workspace', pageid: 'workspace-content-draft', subtype: 'scroll', type: 'list',
          object: { type: '', ver: '1.0' }
        }
      }
    }
  };
  const resourceBundle = {
    'messages': {
      'fmsg': {
        'm0014': 'Fetching uploaded content failed, please try again',
        'm0022': 'Deleting content failed, please try again later..'
      },
      'stmsg': {
        'm0023': 'We are fetching uploaded content...',
        'm0008': 'no-results',
        'm0012': 'You dont have any uploaded content......'
      },
      'smsg': {
        'm0006': 'Content deleted successfully...'
      }
    }
  };


  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UploadedComponent],
      imports: [HttpClientTestingModule, RouterTestingModule, SharedModule.forRoot(),
        TelemetryModule.forRoot(), NgInviewModule],
      providers: [PaginationService, WorkSpaceService, UserService,
        SearchService, ContentService, LearnerService, CoursesService,
        PermissionService, ResourceService, ToasterService,
        { provide: ActivatedRoute, useValue: fakeActivatedRoute },
        { provide: ResourceService, useValue: resourceBundle },
        {provide: APP_BASE_HREF, useValue: '/'}
      ]
    })
      .compileComponents();
    fixture = TestBed.createComponent(UploadedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });


  it('should call search api and returns result count more than 1', inject([SearchService], (searchService) => {
    spyOn(searchService, 'compositeSearch').and.callFake(() => observableOf(testData.searchSuccessWithCountTwo));
    component.fetchUploaded(9, 1);
    fixture.detectChanges();
    expect(component.uploaded).toBeDefined();
  }));

  it('should call delete api and get success response', inject([WorkSpaceService, ActivatedRoute],
    (workSpaceService, activatedRoute, http) => {
      spyOn(workSpaceService, 'deleteContent').and.callFake(() => observableOf(testData.deleteSuccess));
      spyOn(component, 'contentClick').and.callThrough();
      const params = {
        action: {
          class: 'trash large icon', displayType: 'icon',
          eventName: 'delete'
        }, data: { metaData: { identifier: 'do_2124341006465925121871' } }
      };
      component.contentClick(params);
      const DeleteParam = {
        contentIds: ['do_2124645735080755201259']
      };
      workSpaceService.deleteContent(DeleteParam).subscribe(
        apiResponse => {
          expect(apiResponse.responseCode).toBe('OK');
          expect(apiResponse.params.status).toBe('successful');
        }
      );
      fixture.detectChanges();
    }));

  // if  search api's throw's error
  it('should throw error', inject([SearchService], (searchService) => {
    spyOn(searchService, 'compositeSearch').and.callFake(() => observableThrowError({}));
    component.fetchUploaded(9, 1);
    fixture.detectChanges();
    expect(component.uploaded.length).toBeLessThanOrEqual(0);
    expect(component.uploaded.length).toEqual(0);
  }));
  it('should call inview method for visits data', fakeAsync(() => {
    spyOn(component, 'inview').and.callThrough();
    component.ngAfterViewInit();
    tick(100);
    component.inview(testData.event.inview);
    expect(component.inview).toHaveBeenCalled();
    expect(component.inviewLogs).toBeDefined();
  }));
});


