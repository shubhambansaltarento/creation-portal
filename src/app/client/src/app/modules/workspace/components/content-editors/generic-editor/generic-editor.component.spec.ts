
import { ComponentFixture, TestBed, inject,  } from '@angular/core/testing';
import { GenericEditorComponent } from './generic-editor.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NavigationHelperService, ResourceService, ConfigService, ToasterService, BrowserCacheTtlService } from '@sunbird/shared';
import { ContentService, UserService, LearnerService, TenantService, CoreModule } from '@sunbird/core';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { mockRes } from './generic-editor.component.spec.data';
import { WorkSpaceService, EditorService } from '../../../services';
import { TelemetryModule } from '@sunbird/telemetry';
import { of as observableOf } from 'rxjs';

const mockResourceService = { messages: { emsg: { m0004: '1000' } } };
const mockActivatedRoute = {
  snapshot: {
    params: {
      'contentId': 'do_21247940906829414411032', 'state': 'upForReview', 'framework': 'framework'
    }
  }
};
class RouterStub {
  navigate = jasmine.createSpy('navigate');
}
class NavigationHelperServiceStub { }
const mockUserService = { userProfile: { userId: '68777b59-b28b-4aee-88d6-50d46e4c35090'} };
xdescribe('GenericEditorComponent', () => {
  let component: GenericEditorComponent;
  let fixture: ComponentFixture<GenericEditorComponent>;


  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GenericEditorComponent],
      imports: [HttpClientTestingModule, RouterTestingModule, CoreModule, TelemetryModule.forRoot()],
      providers: [
        UserService, LearnerService, ContentService, EditorService,
        ResourceService, ToasterService, ConfigService,
        BrowserCacheTtlService, WorkSpaceService,
        {provide: NavigationHelperService, useClass: NavigationHelperServiceStub},
        { provide: Router, useClass: RouterStub },
        { provide: ResourceService, useValue: mockResourceService },
        { provide: UserService, useValue: mockUserService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
    fixture = TestBed.createComponent(GenericEditorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });


  it('should fetch tenant and content details and set logo and collection details if api return data',
    inject([ ToasterService, TenantService, WorkSpaceService, EditorService],
    ( toasterService, tenantService, workspaceService, editorService) => {
      tenantService._tenantData$.next({ err: null, tenantData: mockRes.tenantMockData });
      spyOn(workspaceService, 'toggleWarning').and.callFake(() => { });
      spyOn(jQuery.fn, 'iziModal').and.callFake(() => { });
      spyOn(toasterService, 'error').and.callFake(() => {});
      spyOn(editorService, 'getContent').and.returnValue(observableOf(mockRes.successResult));
      spyOn(editorService, 'getOwnershipType').and.returnValue(observableOf(['CreatedBy', 'CreatedFor']));
      component.ngOnInit();
      expect(component.logo).toBeDefined();
      expect(component.showLoader).toBeFalsy();
      expect(jQuery.fn.iziModal).toHaveBeenCalled();
      expect(window.config).toBeDefined();
      expect(window.context).toBeDefined();
      expect(window.context.ownershipType).toEqual(['CreatedBy', 'CreatedFor']);
    }));

  it('should navigate to draft', inject([ NavigationHelperService], ( navigationHelperService) => () => {
    spyOn(navigationHelperService, 'navigateToWorkSpace').and.callFake(() => { });
    component.closeModal();
    expect(component.redirectToWorkSpace).toHaveBeenCalled();
    expect(navigationHelperService.navigateToWorkSpace).toHaveBeenCalledWith('workspace/content/draft/1');
  }));

  it('should call retire method', inject([Router, NavigationHelperService], (router, navigationHelperService) => () => {
    spyOn(component, 'retireLock');
    component.closeModal();
    expect(component.retireLock).toHaveBeenCalled();
  }));
});
