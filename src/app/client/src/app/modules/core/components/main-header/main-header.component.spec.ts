
import { of as observableOf } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { mockUserData } from './../../services/user/user.mock.spec.data';
import { ComponentFixture, TestBed,  } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MainHeaderComponent } from './main-header.component';
import { ConfigService, ResourceService, ToasterService, SharedModule, BrowserCacheTtlService } from '@sunbird/shared';
import { UserService, LearnerService, PermissionService, TenantService, CoreModule } from '@sunbird/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { animate, AnimationBuilder, AnimationMetadata, AnimationPlayer, style } from '@angular/animations';
// import { WebExtensionModule } from '@project-sunbird/web-extensions';
import { TelemetryModule } from '@sunbird/telemetry';
import { CacheService } from 'ng2-cache-service';
import { APP_BASE_HREF,DatePipe } from '@angular/common'; 

describe('MainHeaderComponent', () => {
  let component: MainHeaderComponent;
  let fixture: ComponentFixture<MainHeaderComponent>;



  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, SharedModule.forRoot(), CoreModule,
        TelemetryModule.forRoot(), RouterTestingModule],
      declarations: [],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [ToasterService, TenantService, CacheService, BrowserCacheTtlService,
        ResourceService, PermissionService,DatePipe,
        UserService, ConfigService, AnimationBuilder,
        LearnerService]
    })
      .compileComponents();
    fixture = TestBed.createComponent(MainHeaderComponent);
    component = fixture.componentInstance;
    component.routerEvents  = observableOf({id: 1, url: '/explore', urlAfterRedirects: '/explore'});
  });

  afterEach(() => {
    fixture.destroy();
  });

  xit('should subscribe to user service', () => {
    spyOn(document, 'getElementById').and.returnValue('true' as any);
    const userService = TestBed.get(UserService);
    const learnerService = TestBed.get(LearnerService);
    userService._authenticated = true;
    spyOn(learnerService, 'getWithHeaders').and.returnValue(observableOf(mockUserData.success));
    userService.initialize(true);
    fixture.detectChanges();
    expect(component.userProfile).toBeTruthy();
  });

  it('Should subscribe to tenant service and update logo and tenant name', () => {
    spyOn(document, 'getElementById').and.returnValue('true' as any);
    const service = TestBed.get(TenantService);
    spyOn(service, 'get').and.returnValue(observableOf(mockUserData.tenantSuccess));
    service.getTenantInfo('Sunbird');
    component.ngOnInit();
    expect(component.tenantInfo.logo).toEqual(mockUserData.tenantSuccess.result.logo);
    expect(component.tenantInfo.titleName).toEqual(mockUserData.tenantSuccess.result.titleName);
  });

  it('Should not update logo unless tenant service returns it', () => {
    spyOn(document, 'getElementById').and.returnValue('true' as any);
    component.ngOnInit();
    expect(component.tenantInfo.logo).toBeUndefined();
    expect(component.tenantInfo.titleName).toBeUndefined();
  });

  xit('Should update the logo on initialization', () => {
    spyOn(document, 'getElementById').and.returnValue('true'as any);
    const service = TestBed.get(TenantService);
    spyOn(service, 'get').and.returnValue(observableOf(mockUserData.tenantSuccess));
    service.getTenantInfo('Sunbird');
    component.ngOnInit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').src).toEqual(mockUserData.tenantSuccess.result.logo);
  });

  it('All query param should be removed except key and language', () => {
    component.queryParam = { 'board': 'NCERT', 'medium': 'English' };
    component.onEnter('test');
    expect(component.queryParam).toEqual({ 'key': 'test' });
  });

  it('Should call getCacheLanguage if user is not login and cache exits', () => {
    const userService = TestBed.get(UserService);
    const cacheService = TestBed.get(CacheService);
    cacheService.set('portalLanguage', 'hi', { maxAge: 10 * 60 });
    userService._authenticated = false;
    component.ngOnInit();
    expect(cacheService.exists('portalLanguage')).toEqual(true);
  });

  it('Should call getCacheLanguage if user is not login and cache not exits', () => {
    const userService = TestBed.get(UserService);
    const cacheService = TestBed.get(CacheService);
    cacheService.set('portalLanguage', null);
    userService._authenticated = false;
    component.ngOnInit();
    expect(cacheService.exists('portalLanguage')).toEqual(false);
  });
  it('Should call getHeaderEmitter and assign value to showSubHeader', () => {
    component.showSubHeader = true;
    spyOn(component.programsService, 'getHeaderEmitter').and.returnValue(observableOf(false) as any);
    spyOn(component, 'ngOnInit').and.callThrough();
    component.ngOnInit();
    expect(component.showSubHeader).toBeFalsy();
  });
  it('Should call getHeaderEmitter and assign value to showSubHeader as true', () => {
    component.showSubHeader = false;
    spyOn(component.programsService, 'getHeaderEmitter').and.returnValue(observableOf(true)as any);
    spyOn(component, 'ngOnInit').and.callThrough();
    component.ngOnInit();
    expect(component.showSubHeader).toBeTruthy();
  });
  it('Should call getHeaderEmitter and assign value to showSubHeader as true', () => {
    component.unSubscribeShowSubHeader = {
      unsubscribe() {
      }
    };
    spyOn(component.unSubscribeShowSubHeader, 'unsubscribe').and.callThrough();
    spyOn(component, 'ngOnDestroy').and.callThrough();
    component.ngOnDestroy();
    expect(component.unSubscribeShowSubHeader.unsubscribe).toHaveBeenCalled();
  });

  it('#getLogoutInteractEdata() should return logout interact data', () => {
    component.pageId = 'my_projects';
    spyOn(component, 'getLogoutInteractEdata').and.callThrough();
    const interactData = component.getLogoutInteractEdata();
    expect(interactData.id).toEqual('logout');
  });

  it('getTelemetryInteractEdata should return object with defined value', () => {
    spyOn(component, 'getTelemetryInteractEdata').and.callThrough();
    const returnObj = component.getTelemetryInteractEdata('manage_users', 'click', 'launch', 'sourcing_my_projects', undefined);
    expect(returnObj).not.toContain(undefined);
  });

  it('#setInteractEventData() should define signUpInteractEdata and enterDialCodeInteractEdata', () => {
    component.signUpInteractEdata = undefined;
    component.enterDialCodeInteractEdata = undefined;
    spyOn(component, 'setInteractEventData').and.callThrough();
    component.setInteractEventData();
    expect(component.signUpInteractEdata).toBeDefined();
    expect(component.enterDialCodeInteractEdata).toBeDefined();
  });
});
