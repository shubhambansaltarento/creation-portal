import { ComponentFixture, TestBed,  } from '@angular/core/testing';
import * as _ from 'lodash-es';
import { ChapterListComponent } from './chapter-list.component';
import { RecursiveTreeComponent } from '../recursive-tree/recursive-tree.component';
import { ResourceTemplateComponent } from '../../../shared-feature/components/resource-template/resource-template.component';
import { TelemetryModule, TelemetryService } from '@sunbird/telemetry';
import { ToasterService, SharedModule, ResourceService, ConfigService, NavigationHelperService} from '@sunbird/shared';
import { CoreModule, ActionService, UserService, PublicDataService, ProgramsService, FrameworkService} from '@sunbird/core';
import { RouterTestingModule } from '@angular/router/testing';
import { of as observableOf, throwError as observableError, of } from 'rxjs';
import { SuiModule, SuiTabsModule } from 'ng2-semantic-ui-v9';
import { ProgramStageService } from '../../../program/services';
import { CollectionHierarchyService } from '../../services/collection-hierarchy/collection-hierarchy.service';
import { DatePipe } from '@angular/common';
import { ProgramTelemetryService } from '../../../program/services';
import { SourcingService } from '../../services';
import { chapterListComponentInput, responseSample, frameWorkData,
  fetchedQueCount, templateSelectionEvent, programDetailsTargetCollection,
  objectCategoryDefinition, contextualHelpConfig } from './chapter-list.component.spec.data';
import { DebugElement, NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DynamicModule } from 'ng-dynamic-component';
import { ProgramComponentsService } from '../../../program/services/program-components/program-components.service';
import { HelperService } from '../../services/helper.service';

xdescribe('ChapterListComponent', () => {
  let component: ChapterListComponent;
  let fixture: ComponentFixture<ChapterListComponent>;
  let errorInitiate, de: DebugElement;
  let unitLevelResponse;
  let ResourceServiceMock: ResourceService;
  class RouterStub {
    navigate = jasmine.createSpy('navigate');
    url = jasmine.createSpy('url');
  };
  const routerStub = { url: '/sourcing' };
  const frameworkServiceStub = {
    initialize() {
      return null;
    },
    frameworkData$:  of(frameWorkData)
  };
  const actionServiceStub = {
    get() {
      if (errorInitiate) {
        return observableError({ result: { responseCode: 404 } });
      } else if (unitLevelResponse) {
        return observableOf({result: {content: responseSample.result.content.children[2]}});
      } else {
        return observableOf(responseSample);
      }
    },
    post() {
      if (errorInitiate) {
        return observableError({ result: { responseCode: 404 } });
      } else {
        return observableOf({result: {identifier: 'do_123', node_id: 'do_1234', versionKey: '123456'}});
      }
    },
    patch() {
      return observableOf('success');
    },
    delete() {
      return observableOf('success');
    }
  };

  const activatedRouteStub = {
    data: of({
      config: {
        question_categories: [
          'vsa',
          'sa',
          'la',
          'mcq'
        ]
      }
    }),
    snapshot: {
      root: { firstChild: { data: { telemetry: { env: 'env' } } } },
      data: {
        telemetry: { env: 'env' }
      }
    }
  };

  const UserServiceStub = {
    userid: '874ed8a5-782e-4f6c-8f36-e0288455901e',
    userProfile: {
      firstName: 'Creator',
      lastName: 'ekstep'
    },
    isContributingOrgAdmin: () => {
      return true;
    },
    isSourcingOrgReviewer: () => {
      return true;
    },
    isContributingOrgContributor: () => {
      return true;
    },
    isContributingOrgReviewer: () => {
      return true;
    },
    userData$: of({
      user: {
        userProfile: {
          firstName: 'Creator',
          lastName: 'ekstep'
        },
      }
    })
  };
  const PublicDataServiceStub = {
    post() {
      return observableOf(fetchedQueCount);
    }
  };
  const compState = 'chapterListComponent';

 
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule.forRoot(), CoreModule, RouterTestingModule, TelemetryModule.forRoot(), SuiModule,
        SuiTabsModule, FormsModule, DynamicModule],
      declarations: [ChapterListComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
            { provide: ActionService, useValue: actionServiceStub }, 
            { provide: UserService, useValue: UserServiceStub },
            { provide: PublicDataService, useValue: PublicDataServiceStub }, 
            { provide: FrameworkService, useValue: frameworkServiceStub },
            { provide: ActivatedRoute, useValue: activatedRouteStub},
            { provide: Router, useValue: routerStub },
            ToasterService, ConfigService, ProgramTelemetryService, TelemetryService, SourcingService,
            ProgramComponentsService, NavigationHelperService, HelperService, ProgramStageService,
            ProgramsService, CollectionHierarchyService, ResourceService, DatePipe,]
    })
    .compileComponents();
    fixture = TestBed.createComponent(ChapterListComponent);
    component = fixture.debugElement.componentInstance;
    de = fixture.debugElement;
    component.chapterListComponentInput = chapterListComponentInput;
    errorInitiate = false;
    unitLevelResponse = false;
    component.sessionContext = chapterListComponentInput.sessionContext;
    ResourceServiceMock = TestBed.get(ResourceService);
    ResourceServiceMock.frmelmnts = {lbl: {reviewInProgess: 'Review in progress', allFirstLevelFolders: '{FIRST_LEVEL_FOLDER}'}};
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture.destroy();
  });
    it('Component created', () => {
      expect(component).toBeDefined();
    });

    it('stageSubscription should get subcribe on component initialize', () => {
      expect(component.stageSubscription).toBeDefined();
    });

    it('Default it should show all Chapters', () => {
      expect(component.selectedChapterOption).toMatch('all');
    });

    it('dynamicOuts should be registered on initialize', () => {
      expect(_.get(component.dynamicOutputs, 'uploadedContentMeta')).toBeDefined();
    });

    xit('should call updateAccordianView on componet initialize', () => {
      spyOn(component, 'updateAccordianView');
      component.ngOnInit();
      expect(component.updateAccordianView).toHaveBeenCalled();
    });

    it('sessionContext should be updated if session in chapterListComponentInput changes', () => {
      component.chapterListComponentInput.sessionContext.subject = ['dummyValue'];
      component.ngOnChanges({});
      expect(component.sessionContext).toEqual(jasmine.objectContaining({subject: ['dummyValue']}));
    });

    it('uploadHandler should call updateAccordianView function', () => {
      spyOn(component, 'updateAccordianView').and.callThrough();
      spyOn(component, 'uploadHandler').and.callThrough();
      component.uploadHandler({contentId: 'do_1234567'});
      expect(component.updateAccordianView).toHaveBeenCalled();
    });

    it('should call changeView on stage change', () => {
       // const programStageSpy = jasmine.createSpyObj('programStageService', ['getStage']);
       // programStageSpy.getStage.and.returnValue('stubValue');
       component.state.stages = [{stageId: 1, stage: 'chapterListComponent'}, {stageId: 2, stage: 'uploadComponent'}]

       spyOn(component, 'changeView');
       component.changeView();
       expect(component.changeView).toHaveBeenCalled();
    });

    it('should call getHierarchy with second parameter as undefined', () => {
      spyOn(component, 'getCollectionHierarchy');
      component.getCollectionHierarchy('d0_123467890', undefined);
      expect(component.getCollectionHierarchy).toHaveBeenCalledWith(jasmine.any(String), undefined);
    });

    it('should emit output on execution of emitQuestionTypeTopic', () => {
      let mockData;
      component.selectedQuestionTypeTopic.subscribe((outputData) => {
          mockData = outputData;
      });
      component.emitQuestionTypeTopic('mcq', 'topic', 'do_123', 'do_1234', 'dummyResource');
      expect(mockData).toEqual(jasmine.objectContaining({questionType: 'mcq'}));
    });

    it('should have mandatory input objects to other dynamic components', () => {
      component.initiateInputs();
      // All assertions are related to single feature
      expect(_.has(component.dynamicInputs, 'contentUploadComponentInput.config')).toBeTruthy();
      expect(_.has(component.dynamicInputs, 'contentUploadComponentInput.sessionContext')).toBeTruthy();
      expect(_.has(component.dynamicInputs, 'contentUploadComponentInput.unitIdentifier')).toBeTruthy();
      expect(_.has(component.dynamicInputs, 'contentUploadComponentInput.templateDetails')).toBeTruthy();
      expect(_.has(component.dynamicInputs, 'contentUploadComponentInput.selectedSharedContext')).toBeTruthy();
      expect(_.has(component.dynamicInputs, 'contentUploadComponentInput.contentId')).toBeTruthy();
      expect(_.has(component.dynamicInputs, 'contentUploadComponentInput.action')).toBeTruthy();
      expect(_.has(component.dynamicInputs, 'contentUploadComponentInput.programContext')).toBeTruthy();
      expect(_.has(component.dynamicInputs, 'practiceQuestionSetComponentInput.sessionContext')).toBeTruthy();
      expect(_.has(component.dynamicInputs, 'practiceQuestionSetComponentInput.templateDetails')).toBeTruthy();
    });

    it('should call updateAccordianView only if current stage is chapterlist', () => {
      component.unitIdentifier = 'do_1234567890';
      component.state = { stages: [{stage: 'collectionComponent'}, {stage: 'chapterListComponent'}]};
      spyOn(component, 'updateAccordianView');
      component.changeView();
      expect(component.updateAccordianView).toHaveBeenCalledWith(jasmine.any(String));
    });

    it('drop-down should contain only first level of units', () => {
      const firstLevelUnitLength = _.filter(responseSample.result.content.children, {contentType: 'TextBookUnit'}).length;
      expect(firstLevelUnitLength).toEqual(1);
    });

    it('on selecting unit in drop-down of chapterlist', () => {
      spyOn(component, 'updateAccordianView');
      component.onSelectChapterChange();
      expect(component.updateAccordianView).toHaveBeenCalledWith(undefined, jasmine.any(Boolean));
    });

    it('on selecting unit in drop-down of chapterlist which should be in opened state', async() => {
      component.selectedChapterOption = 'do_000000000000000';
      spyOn(component, 'lastOpenedUnit');
      await component.lastOpenedUnit('do_1127639059664650241140');
      expect(component.lastOpenedUnit).toHaveBeenCalled();
    });

    xit('collectionHierarchy length should be one after selecting unit from drop-down', async() => {
      component.selectedChapterOption = 'do_000000';
      unitLevelResponse = true;
      await component.updateAccordianView();
      expect(component.collectionHierarchy.length).toEqual(1);
    });

    it('should close template selection-popup on successful selection', () => {
      component.handleTemplateSelection({});
      expect(component.showResourceTemplatePopup).toBeFalsy();
    });
  
    it('templateDetails should be defined on successful template selection', () => {
      // tslint:disable-next-line:prefer-const
      component.selectedSharedContext = {framework: 'NCFCOPY', topic: ['Topic 2 child']};
      spyOn(component, 'componentLoadHandler');
      component.componentLoadHandler('creation', jasmine.any(Function), 'uploadComponent');
      expect(component.componentLoadHandler).toHaveBeenCalledWith('creation', jasmine.any(Function), 'uploadComponent');
    });

    it('should add selected component to stage', () => {
      component.programStageService.addStage = jasmine.createSpy('addStage() spy').and.callFake(() => {
        return observableOf({stages: []});
       });
      // tslint:disable-next-line:prefer-const
      component.selectedSharedContext = {framework: 'NCFCOPY', topic: ['Topic 2 child']};
      // spyOn(component.programStageService, 'addStage');
      component.handleTemplateSelection(templateSelectionEvent);
      expect(component.programStageService.addStage).toHaveBeenCalled();
    });

    it('should show confirmation Modal when delete event comes', () => {
      component.programContext = { content_types: ['eTextbook']};
      spyOn(component, 'showResourceTemplate').and.callThrough();
      // tslint:disable-next-line:max-line-length
      component.showResourceTemplate({action: 'delete', content: {identifier: 'do_12345'}, collection: {identifier: 'do_12345', sharedContext: {framework: 'NCFCOPY'}}});
      expect(component.showConfirmationModal).toBeTruthy();
    });

    it('should define prevUnitSelect beforeMove the content to other unit', () => {
      component.programContext = { content_types: ['eTextbook']};
      spyOn(component, 'showResourceTemplate').and.callThrough();
      // tslint:disable-next-line:max-line-length
      component.showResourceTemplate({action: 'beforeMove', content: {identifier: 'do_12345'}, collection: {identifier: 'do_12345', sharedContext: {framework: 'NCFCOPY'}}});
      expect(component.prevUnitSelect).toBeDefined();
    });

    it('should updateAccordianView after successful move of content', () => {
      component.programContext = { content_types: ['eTextbook']};
      spyOn(component, 'showResourceTemplate').and.callThrough();
      spyOn(component, 'updateAccordianView');
      // tslint:disable-next-line:max-line-length
      component.showResourceTemplate({action: 'afterMove', content: {identifier: 'do_12345'}, collection: {identifier: 'do_12345', sharedContext: {framework: 'NCFCOPY'}}});
      expect(component.updateAccordianView).toHaveBeenCalledWith(jasmine.any(String));
    });

    it('should clear assigned unitIdentifier and contentIdentifier', () => {
      component.programContext = { content_types: ['eTextbook']};
      spyOn(component, 'showResourceTemplate').and.callThrough();
      // tslint:disable-next-line:max-line-length
      component.showResourceTemplate({action: 'cancelMove', content: {identifier: 'do_12345'}, collection: {identifier: 'do_12345', sharedContext: {framework: 'NCFCOPY'}}});
      expect(component.unitIdentifier).toEqual('');
    });

    it('should call handlePreview on preview event', () => {
      component.programContext = { content_types: ['eTextbook']};
      spyOn(component, 'showResourceTemplate').and.callThrough();
      spyOn(component, 'handlePreview');
      // tslint:disable-next-line:max-line-length
      component.showResourceTemplate({action: 'preview', content: {identifier: 'do_12345', contentType: 'ExplanationResource'}, collection: {identifier: 'do_12345', sharedContext: {framework: 'NCFCOPY'}}});
      expect(component.handlePreview).toHaveBeenCalled();
    });

    it('should call componentHandler on preview of content', () => {
      spyOn(component, 'componentLoadHandler');
      component.componentLoadHandler('preview', {identifier: 'do_12345', contentType: 'UnkonwnXYZ'},
      {identifier: 'do_12345'},  {framework: 'NCFCOPY'});
      // tslint:disable-next-line:max-line-length
      component.handlePreview({action: 'preview', content: {identifier: 'do_12345', contentType: 'ExplanationResource'}, collection: {identifier: 'do_12345', sharedContext: {framework: 'NCFCOPY'}}});
      expect(component.componentLoadHandler).toHaveBeenCalled();
    });

    it('should call updateAccordian on uploadHandler', () => {
      component.unitIdentifier = 'do_0000000000';
      spyOn(component, 'updateAccordianView');
      component.uploadHandler({contentId: 'do_1234567890'});
      expect(component.updateAccordianView).toHaveBeenCalled();
    });

    it('should lastOpenedUnitParent be defined with parent do_id of given child-unit', () => {
      component.lastOpenedUnit('do_112931801879011328152'); // do_id of child-unit
      expect(component.sessionContext.lastOpenedUnitParent).toEqual('do_1127639059664486401136');
    });

    it('should updateAccordianView after successful removal of content', () => {
      component.unitIdentifier = 'do_0000000000';
      ResourceServiceMock = TestBed.get(ResourceService);
      ResourceServiceMock.messages = {smsg: {m0064: 'Content is successfully removed'}};
      spyOn(component, 'updateAccordianView');
      component.removeResourceFromHierarchy();
      expect(component.showConfirmationModal).toBeFalsy();
      expect(component.updateAccordianView).toHaveBeenCalledWith(jasmine.any(String));
    });

    it('should unsubscribe subject', () => {
      component.ngOnDestroy();
    });

    it('setUserAccess should set userAccess value', () => {
      component.sessionContext.currentRoles = ['CONTRIBUTOR'];
      spyOn(component, 'setUserAccess').and.callThrough();
      component.setUserAccess();
      expect(component.hasAccessForContributor).toBeTruthy();
      expect(component.hasAccessForReviewer).toBeFalsy();
      expect(component.hasAccessForBoth).toBeTruthy();
    });

    it ('#setTargetCollectionValue() should set targetCollection values', () => {
      const  service  = TestBed.get(ProgramsService);
      spyOn(service, 'setTargetCollectionName').and.returnValue('Digital Textbook');
      component.programContext = programDetailsTargetCollection;
      spyOn(component, 'setTargetCollectionValue').and.returnValue('some value' as any);
      component.setTargetCollectionValue();
      expect(component.targetCollection).not.toBeUndefined();
    });

    it ('#setTargetCollectionValue() should not set targetCollection values in chapter-list', () => {
      component.targetCollection = undefined;
      component.programContext = undefined;
      const  programsService  = TestBed.get(ProgramsService);
      spyOn(programsService, 'setTargetCollectionName').and.returnValue(undefined);
      spyOn(component, 'setTargetCollectionValue').and.callThrough();
      component.setTargetCollectionValue();
      expect(component.targetCollection).toBeUndefined();
    });


    it ('#setTargetCollectionValue() should call programsService.setTargetCollectionName()', () => {
      const  programsService  = TestBed.get(ProgramsService);
      component.programContext = programDetailsTargetCollection;
      spyOn(component, 'setTargetCollectionValue').and.callThrough();
      spyOn(programsService, 'setTargetCollectionName').and.callThrough();
      component.setTargetCollectionValue();
      expect(programsService.setTargetCollectionName).toHaveBeenCalled();
    });

    it('#getCollectionCategoryDefinition() Should call programsService.getCategoryDefinition() method', () => {
      component.programContext = {rootorg_id: '12345', target_collection_category: 'Course'};
      component.blueprintTemplate = undefined;
      component.firstLevelFolderLabel = undefined;
      component['programsService'] = TestBed.get(ProgramsService);
      spyOn(component['programsService'], 'getCategoryDefinition').and.returnValue(of(objectCategoryDefinition));
      component.getCollectionCategoryDefinition();
      expect(component['programsService'].getCategoryDefinition).toHaveBeenCalled();
      expect(component.blueprintTemplate).toBeDefined();
      expect(component.firstLevelFolderLabel).toBeDefined();
    });
    xit('#getCollectionCategoryDefinition() Should not call programsService.getCategoryDefinition() method', () => {
      component.collection = {primaryCategory: undefined};
      component.programContext = {rootorg_id: undefined, target_collection_category: undefined};
      component.blueprintTemplate = undefined;
      component.firstLevelFolderLabel = undefined;
      component['programsService'] = TestBed.get(ProgramsService);
      spyOn(component['programsService'], 'getCategoryDefinition').and.returnValue(of(objectCategoryDefinition));
      component.getCollectionCategoryDefinition();
      expect(component['programsService'].getCategoryDefinition).not.toHaveBeenCalled();
    });
    xit('#setContextualHelpConfig should set reviewHelpSectionConfig and contributeHelpSectionConfig', () => {
      component.reviewHelpSectionConfig = undefined;
      component.contributeHelpSectionConfig = undefined;
      const helperService = TestBed.get(HelperService);
      spyOn(helperService, 'getContextualHelpConfig').and.returnValue(contextualHelpConfig);
      spyOn(component, 'setContextualHelpConfig').and.callThrough();
      component.setContextualHelpConfig();
      expect(component.reviewHelpSectionConfig).toBeDefined();
      expect(component.contributeHelpSectionConfig).toBeDefined();
    });
});
