
import { of as observableOf, throwError as observableThrowError, Observable } from 'rxjs';
import { ComponentFixture, TestBed, inject,  } from '@angular/core/testing';
import { ReviewsubmissionsContentplayerComponent } from './reviewsubmissions-contentplayer.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule, ToasterService, ResourceService, NavigationHelperService } from '@sunbird/shared';
import { PlayerService, UserService, LearnerService, ContentService, CoreModule } from '@sunbird/core';
import * as mockData from './reviewsubmissions-contentplayer.component.spec.data';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PlayerHelperModule } from '@sunbird/player-helper';
import { TelemetryService } from '@sunbird/telemetry';


const testData = mockData.mockRes;
xdescribe('ReviewsubmissionsContentplayerComponent', () => {
  let component: ReviewsubmissionsContentplayerComponent;
  let fixture: ComponentFixture<ReviewsubmissionsContentplayerComponent>;
  const resourceBundle = {
    messages: {
      imsg: { m0027: 'Something went wrong' },
      stmsg: { m0025: 'error' },
      fmsg: { m0025: 'error', m0015: 'error' }
    },
    frmelmnts: {
      btn: {
        tryagain: 'tryagain',
        close: 'close'
      },
      lbl: {
        description: 'description'
      }
    },
    languageSelected$: observableOf({})
  };


  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [ReviewsubmissionsContentplayerComponent],
      imports: [HttpClientTestingModule, PlayerHelperModule, CoreModule,
        RouterTestingModule, SharedModule.forRoot()],
      providers: [ResourceService, ToasterService, NavigationHelperService, TelemetryService,
        { provide: ResourceService, useValue: resourceBundle }
      ]
    })
      .compileComponents();
    fixture = TestBed.createComponent(ReviewsubmissionsContentplayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture.destroy();
  });

  it('should throw error if content api throws error', () => {
    const playerService = TestBed.get(PlayerService);
    const resourceService = TestBed.get(ResourceService);
    resourceService.messages = resourceBundle.messages;
    resourceService.frmelmnts = resourceBundle.frmelmnts;
    spyOn(playerService, 'getContent').and.returnValue(observableThrowError(testData.errorRes));
    component.getContent();
    expect(component.playerConfig).toBeUndefined();
    expect(component.showError).toBeTruthy();
    expect(component.errorMessage).toBe(resourceService.messages.stmsg.m0009);
  });

  it('should call  content api and return content data', () => {
    const playerService = TestBed.get(PlayerService);
    const userService = TestBed.get(UserService);
    const resourceService = TestBed.get(ResourceService);
    resourceService.messages = resourceBundle.messages;
    resourceService.frmelmnts = resourceBundle.frmelmnts;
    spyOn(playerService, 'getContent').and.returnValue(observableOf(testData.sucessRes));
    userService._userProfile = { 'organisations': ['01229679766115942443'] };
    component.getContent();
    fixture.detectChanges();
    expect(component.contentData).toBeDefined();
    expect(component.showError).toBeFalsy();
    expect(component.showLoader).toBeFalsy();
  });

});
