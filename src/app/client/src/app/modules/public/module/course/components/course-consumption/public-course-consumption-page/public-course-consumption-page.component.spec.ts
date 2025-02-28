
import {of,  Observable } from 'rxjs';
import { CourseHierarchyGetMockResponse } from '../public-course-player/public-course-player.component.mock.data';
import { ComponentFixture, TestBed,  } from '@angular/core/testing';
import { PublicCourseConsumptionPageComponent } from './public-course-consumption-page.component';
import {SharedModule, ResourceService, ToasterService, ContentUtilsServiceService, NavigationHelperService } from '@sunbird/shared';
import { CoreModule, CoursesService } from '@sunbird/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import {CourseConsumptionService, CourseProgressService, CourseBatchService} from '@sunbird/learn';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

const resourceServiceMockData = {
  messages : {
    imsg: { m0027: 'Something went wrong'},
    fmsg: { m0001: 'error', m0003: 'error' },
    emsg: { m0005: 'error'}
  },
  frmelmnts: {
    btn: {
      tryagain: 'tryagain',
      close: 'close'
    },
    lbl: {
      description: 'description'
    }
  }
};
class ActivatedRouteStub {
  snapshot = {
    params: {},
    firstChild: { params : {}}
  };
}
class MockRouter {
  navigate = jasmine.createSpy('navigate');
  public navigationEnd = new NavigationEnd(1, '/learn', '/learn');
  public events = new Observable(observer => {
    observer.next(this.navigationEnd);
    observer.complete();
  });
}

describe('PublicCourseConsumptionPageComponent', () => {
  let component: PublicCourseConsumptionPageComponent;
  let fixture: ComponentFixture<PublicCourseConsumptionPageComponent>;
  let activatedRouteStub, courseService, toasterService, courseConsumptionService, navigationHelperService;


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, SharedModule.forRoot(), CoreModule],
      declarations: [ PublicCourseConsumptionPageComponent ],
      providers: [{ provide: ActivatedRoute, useClass: ActivatedRouteStub },
        { provide: ResourceService, useValue: resourceServiceMockData },
        CourseConsumptionService,  { provide: Router, useClass: MockRouter },
        CourseProgressService, CourseBatchService, ContentUtilsServiceService],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(PublicCourseConsumptionPageComponent);
    component = fixture.componentInstance;
    activatedRouteStub = TestBed.get(ActivatedRoute);
    courseService = TestBed.get(CoursesService);
    toasterService = TestBed.get(ToasterService);
    courseConsumptionService = TestBed.get(CourseConsumptionService);
    navigationHelperService = TestBed.get(NavigationHelperService);
    spyOn(navigationHelperService, 'navigateToResource').and.returnValue('');
    spyOn(toasterService, 'error').and.returnValue('');
  });
  afterEach(() => {
    fixture.destroy();
  });


  it('should fetch course details on page load', () => {
    activatedRouteStub.snapshot.firstChild.params = {courseId: 'do_212347136096788480178'};
    spyOn(courseConsumptionService, 'getCourseHierarchy').and.returnValue(of(CourseHierarchyGetMockResponse.result.content));
    courseService.initialize();
    component.ngOnInit();
    expect(component.courseHierarchy).toBeDefined();
    expect(component.showLoader).toBe(false);
  });

  it('should redirect to explore course page if course id not exists', () => {
    activatedRouteStub.snapshot.firstChild.params = {};
    spyOn(component, 'redirectToExplore').and.callThrough();
    component.ngOnInit();
    expect(component.redirectToExplore).toHaveBeenCalled();
    expect(component.navigationHelperService.navigateToResource).toHaveBeenCalledWith('explore-course');
  });

  it('should open share link popup and share url should be of anonymous explore course page', () => {
    activatedRouteStub.snapshot.firstChild.params = {courseId: 'do_212347136096788480178'};
    spyOn(courseConsumptionService, 'getCourseHierarchy').and.returnValue(of(CourseHierarchyGetMockResponse.result.content));
    spyOn(component, 'onShareLink').and.callThrough();
    courseService.initialize();
    component.ngOnInit();
    component.onShareLink();
    expect(component.sharelinkModal).toBe(true);
    expect(component.shareLink).toContain('explore-course/course/do_212347136096788480178');
  });
});
