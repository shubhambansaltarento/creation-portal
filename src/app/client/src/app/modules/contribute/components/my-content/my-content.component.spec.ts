import { ComponentFixture, TestBed,  } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash-es';
import { SharedModule, ToasterService, ConfigService , ResourceService} from '@sunbird/shared';
import { PlayerHelperModule } from '@sunbird/player-helper';
import { TelemetryModule, TelemetryService, TELEMETRY_PROVIDER } from '@sunbird/telemetry';
import { ActionService, UserService, LearnerService, PlayerService, ProgramsService } from '@sunbird/core';
import { SourcingService, HelperService } from '../../../sourcing/services';
import { MyContentComponent } from './my-content.component';
import { mockData } from './my-content.component.spec.data';
import { of, throwError as observableThrowError } from 'rxjs';
import { QumlLibraryModule } from '@project-sunbird/sunbird-quml-player';
import { SunbirdVideoPlayerModule } from '@project-sunbird/sunbird-video-player-v9';
import { SuiPopupModule } from 'ng2-semantic-ui-v9';

describe('MyContentComponent', () => {
  let component: MyContentComponent;
  let fixture: ComponentFixture<MyContentComponent>;

  const fakeActivatedRoute = {
    snapshot: {
      data: {
        hideHeaderNFooter: 'true',
        telemetry: { env: 'creation-portal', type: 'list', subtype: 'paginate', pageid: 'contribution_my_content' }
      }
    }
  };
  const resourceServiceStub = {
    messages: {
      emsg: {
        m0079: 'There are no published contents'
      }
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, QumlLibraryModule, RouterTestingModule,
        SharedModule.forRoot(), TelemetryModule.forRoot(),
        PlayerHelperModule, SuiPopupModule, SunbirdVideoPlayerModule],
      declarations: [ MyContentComponent ],
      providers: [
        { provide: ActivatedRoute, useValue: fakeActivatedRoute },
        TelemetryService, { provide: TELEMETRY_PROVIDER, useValue: EkTelemetry },
        { provide: UserService, useValue: mockData.userServiceStub },
        { provide: ResourceService, useValue:  resourceServiceStub},
        ActionService, LearnerService, SourcingService, ConfigService, HelperService, ProgramsService
      ],
    })
    .compileComponents();
    fixture = TestBed.createComponent(MyContentComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call #initialize after calls ngOnInit', () => {
    spyOn(component, 'getPageId').and.callThrough();
    spyOn(component, 'initialize').and.callThrough();
    component.ngOnInit();
    expect(component.getPageId).toHaveBeenCalled();
    expect(component.initialize).toHaveBeenCalled();
  });

  it('#getPageId() should return #telemetryPageId', () => {
    const pageId = component.getPageId();
    expect(pageId).toEqual('contribution_my_content');
  });

  it('#initialize() should fetch content details when API success', () => {
    spyOn(component, 'getContents').and.callFake(() => of(mockData.contentListRes.result));
    spyOn(component, 'getAllTenantList').and.callFake(() => of({})as any) ;
    spyOn(component, 'getFrameworks').and.callFake(() => of(mockData.frameworkListRes.result));
    spyOn(component, 'getOriginForApprovedContents').and.callFake(() => of(mockData.publishedContentListRes.result));
    spyOn(component, 'getUserProfiles').and.callFake(() => of(mockData.userContentListRes.result));
    spyOn(component, 'prepareContributionDetails').and.callThrough();
    spyOn(component, 'createUserMap').and.callThrough();
    component.initialize();
    expect(component.createUserMap).toHaveBeenCalled();
    expect(component.prepareContributionDetails).toHaveBeenCalled();
    expect(component.showLoader).toBeFalsy();
  });

  it('#initialize() should not call #getUserProfiles when #publishedContents empty', () => {
    spyOn(component, 'getContents').and.callFake(() => of(mockData.contentListRes.result));
    spyOn(component, 'getAllTenantList').and.callFake(() => of({})as any);
    spyOn(component, 'getFrameworks').and.callFake(() => of(mockData.frameworkListRes.result));
    spyOn(component, 'getOriginForApprovedContents').and.callFake(() => of(mockData.publishedContentListRes));
    spyOn(component, 'getUserProfiles').and.callThrough();
    spyOn(component, 'prepareContributionDetails').and.callThrough();
    component.initialize();
    expect(component.getUserProfiles).toHaveBeenCalled();
    expect(component.prepareContributionDetails).toHaveBeenCalled();
    expect(component.showLoader).toBeFalsy();
  });

  it('#initialize() should throw error when API failed', () => {
    spyOn(component, 'getContents').and.callFake(() => observableThrowError({}));
    const toasterService: ToasterService = TestBed.inject(ToasterService);
    spyOn(toasterService, 'error').and.callThrough();
    component.initialize();
    expect(toasterService.error).toHaveBeenCalledWith('Something went wrong, try again later');
    expect(component.showLoader).toBeFalsy();
  });

  it('#createUserMap() should create user map', () => {
    component.createUserMap(mockData.userContentListRes.result);
    expect(Object.keys(component.userMap).length).toBe(2);
  });

  it('#prepareContributionDetails() should set contribution details', () => {
    component.framework = mockData.frameworkListRes.result.Framework;
    component.publishedContents = mockData.publishedContentListRes.result.content;
    component.contents = mockData.contentListRes.result.content;
    spyOn(component, 'setContentCount').and.callThrough();
    spyOn(component, 'getUniqValue').and.callThrough();
    component.prepareContributionDetails();
    expect(component.contributionDetails).toBeDefined();
    expect(component.setContentCount).toHaveBeenCalled();
    expect(component.getUniqValue).toHaveBeenCalled();
  });

  it('#prepareContributionDetails() should set not contribution details when #contents empty', () => {
    spyOn(component, 'setContentCount').and.callThrough();
    component.prepareContributionDetails();
    expect(component.contributionDetails).not.toBeDefined();
    expect(component.setContentCount).not.toHaveBeenCalled();
  });


  xit('#onCardClick() should set #selectedContributionDetails data', () => {
    component.contents = mockData.contentListRes.result.content;
    spyOn(component, 'setContentCount').and.callThrough();
    spyOn(component, 'loadTabComponent').and.callThrough();
    spyOn(component, 'getPublishedContentCount').and.callThrough();
    const data = {key : 'K-12', value: { published: 2, notPublished: 1}};
    component.onCardClick(data);
    expect(component.selectedFrameworkType).toEqual(data);
    expect(component.selectedContributionDetails).toBeDefined();
    expect(component.setContentCount).toHaveBeenCalled();
    expect(component.loadTabComponent).toHaveBeenCalledWith('frameworkTab');
    expect(component.getPublishedContentCount).toHaveBeenCalled();
  });

  it('#onFrameworkClick() should set #selectedContentDetails data', () => {
    spyOn(component, 'setContentCount').and.callThrough();
    spyOn(component, 'loadTabComponent').and.callThrough();
    const data = { published: 2, notPublished: 1};
    component.onFrameworkClick(data);
    expect(component.setContentCount).toHaveBeenCalledWith(data.published, data.notPublished);
    expect(component.loadTabComponent).toHaveBeenCalledWith('contentTab');
    expect(component.selectedContentDetails).toEqual(data);
  });

  it('#onPreview() should set #slectedContent data', () => {
    const helperService: HelperService = TestBed.inject(HelperService);
    spyOn(helperService, 'getContentOriginUrl').and.callThrough();
    spyOn(component, 'getConfigByContent').and.callThrough();
    const data = { origin: 123, identifier: '123'};
    component.onPreview(data);
    expect(component.getConfigByContent).toHaveBeenCalledWith(data.identifier);
    expect(helperService.getContentOriginUrl).toHaveBeenCalledWith(data.origin);
    expect(component.slectedContent).toEqual(data);
  });

  it('#onBack() should load framework tab', () => {
    spyOn(component, 'loadTabComponent').and.callThrough();
    spyOn(component, 'setContentCount').and.callThrough();
    component._selectedTab = 'contentTab';
    component.selectedFrameworkType = {key : 'K-12', value: { published: 2, notPublished: 1}};
    component.onBack();
    expect(component.setContentCount).toHaveBeenCalled();
    expect(component.loadTabComponent).toHaveBeenCalledWith('frameworkTab');
  });

  it('#onBack() should load content tab', () => {
    spyOn(component, 'loadTabComponent').and.callThrough();
    component._selectedTab = 'previewTab';
    component.selectedContentDetails = { published: 2, notPublished: 1};
    component.onBack();
    expect(component.loadTabComponent).toHaveBeenCalledWith('contentTab');
  });

  it('#setContentCount() should set content count ', () => {
    component.setContentCount(2, 3);
    expect(component.contentCountData).toEqual({total: 5, published: 2, notPublished: 3});
  });

  it('#loadTabComponent() should set tab', () => {
    component.loadTabComponent('previewTab');
    expect(component._selectedTab).toBe('previewTab');
  });

  it('#getPublishedContentCount() should return expected count ', () => {
    const result = component.getPublishedContentCount({published: 2}, {isPublished: true});
    expect(result).toBe(3);
    const result1 = component.getPublishedContentCount({}, {isPublished: true});
    expect(result1).toBe(1);
  });

  it('#getNotPublishedContentCount() shoud return expected count', () => {
    const result = component.getNotPublishedContentCount({}, {isPublished: false});
    expect(result).toBe(1);
    const result1 = component.getNotPublishedContentCount({notPublished: 1}, {isPublished: false});
    expect(result1).toBe(2);
  });

  it('#getUniqValue() shoud return unique category', () => {
    const result = component.getUniqValue({subject: ['Hindi']}, {subject: ['English']}, 'subject');
    expect(result).toEqual(['Hindi', 'English']);
    const result1 = component.getUniqValue({}, {subject: ['English']}, 'subject');
    expect(result1).toEqual(['English']);
  });

  it('#sortCollection() should show a sorted contribution table', () => {
    const programsService: ProgramsService = TestBed.inject(ProgramsService);
    spyOn(programsService, 'sortCollection').and.callThrough();
    component._selectedTab = 'frameworkTab';
    component.selectedContributionDetails = [{name: 'cbse'}, { name: 'xyz'}];
    component.sortCollection('name');
    expect(programsService.sortCollection).toHaveBeenCalled();
    expect(component.direction).toBe('desc');
    expect(component.sortColumn).toBe('name');
    expect(component.selectedContributionDetails).toEqual([{name: 'cbse'}, { name: 'xyz'}]);
  });

  it('#getContents() should fetch content details when API success', () => {
    const actionService: ActionService = TestBed.inject(ActionService);
    spyOn(actionService, 'post').and.returnValue(of(mockData.contentListRes));
    component.getContents().subscribe((apiResponse: any) => {
      expect(apiResponse.content.length).toBe(2);
    });
  });


  it('#getOriginForApprovedContents() should fetch published content details when API success', () => {
    const learnerService: LearnerService = TestBed.inject(LearnerService);
    spyOn(learnerService, 'post').and.returnValue(of(mockData.publishedContentListRes));
    component.getOriginForApprovedContents(['do_123']).subscribe((apiResponse: any) => {
      expect(apiResponse.content.length).toBe(3);
    });
  });

  it('#fetchAllgetOriginForApprovedContents() should return published content details when API success', () => {
    spyOn(component, 'getOriginForApprovedContents').and.callFake(() => of(mockData.publishedContentListRes.result));
    component.fetchAllgetOriginForApprovedContents(['do_123']).subscribe((contens: any) => {
      expect(contens.length).toBe(3);
    });
  });

  it('#getUserProfiles() should fetch user details when API success', () => {
    const learnerService: LearnerService = TestBed.inject(LearnerService);
    spyOn(learnerService, 'post').and.returnValue(of(mockData.userContentListRes));
    component.getUserProfiles(['123']).subscribe((apiResponse: any) => {
      expect(apiResponse.response.content.length).toBe(2);
    });
  });

  it('#getFrameworks() should fetch framework details when API success', () => {
    const learnerService: LearnerService = TestBed.inject(LearnerService);
    spyOn(learnerService, 'post').and.returnValue(of(mockData.frameworkListRes));
    component.getFrameworks().subscribe((apiResponse: any) => {
      expect(apiResponse.Framework.length).toBe(1);
    });
  });

  it('#getConfigByContent() should play content preview when API success', () => {
    const playerService: PlayerService = TestBed.inject(PlayerService);
    spyOn(playerService, 'getConfigByContent').and.returnValue(of({context: { pdata : { pid: ''}, cdata: {}}}) as any);
    spyOn(component, 'loadTabComponent').and.callThrough();
    component.getConfigByContent('do_123');
    expect(component.loadTabComponent).toHaveBeenCalledWith('previewTab');
  });

  it('#downloadReport() should download the report', () => {
    const programsService: ProgramsService = TestBed.inject(ProgramsService);
    spyOn(programsService, 'generateCSV').and.callThrough();
    component.contentCountData = {
      published: 10
    };
    spyOn(component, 'prepareContentUsageReportData').and.callThrough();
    component.selectedContributionDetails = [{contents: mockData.selectedContributionDetails}];
    component.downloadReport();
    expect(programsService.generateCSV).toHaveBeenCalled();
    expect(component.prepareContentUsageReportData).toHaveBeenCalled();
  });

  it('#downloadReport() should call download the report and show error toaster message when zero published content', () => {
    const programsService: ProgramsService = TestBed.inject(ProgramsService);
    spyOn(programsService, 'generateCSV').and.callThrough();
    spyOn(component['toasterService'], 'error').and.callThrough();
    component.contentCountData = {
      published: 0
    };
    spyOn(component, 'prepareContentUsageReportData').and.callThrough();
    component.selectedContributionDetails = [{contents: mockData.selectedContributionDetails}];
    component.downloadReport();
    expect(programsService.generateCSV).not.toHaveBeenCalled();
    expect(component['toasterService']['error']).toHaveBeenCalledWith(resourceServiceStub.messages.emsg.m0079);
    expect(component.prepareContentUsageReportData).toHaveBeenCalled();
  });

  it('#getCountData() should return expected result', () => {
    const result = component.getCountData(mockData.selectedContributionDetails[0], 'me_totalPlaySessionCount');
    expect(result).toBe(5796);
  });

  it('#getTelemetryInteractEdata() should return object with defined value', () => {
    spyOn(component, 'getTelemetryInteractEdata').and.callThrough();
    const returnObj = component.getTelemetryInteractEdata('download_report',
    'click', 'launch', 'sourcing_my_projects', undefined);
    expect(returnObj).not.toContain(undefined);
  });
});
