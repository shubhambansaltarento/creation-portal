import {
  Component, OnInit, AfterViewInit, Output, Input, EventEmitter,
  OnChanges, AfterViewChecked, ChangeDetectorRef, ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService, ResourceService, IUserProfile, ToasterService, NavigationHelperService } from '@sunbird/shared';
import { PublicDataService, UserService, ActionService, ProgramsService } from '@sunbird/core';
import { TelemetryService } from '@sunbird/telemetry';
import { Validators, FormGroup, FormControl, NgForm, FormArray, FormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UUID } from 'angular2-uuid';
import * as _ from 'lodash-es';
import { SourcingService } from '../../services';
import { HelperService } from '../../services/helper.service';
import { ProgramTelemetryService } from '../../../program/services';

@Component({
  selector: 'app-question-creation',
  templateUrl: './question-creation.component.html',
  styleUrls: ['./question-creation.component.scss']
})
export class QuestionCreationComponent implements OnInit, AfterViewInit, OnChanges, AfterViewChecked {

  @Input() tabIndex: any;
  @Input() questionMetaData: any;
  @Output() questionStatus = new EventEmitter<any>();
  @Output() questionFormChangeStatus = new EventEmitter<any>();
  @Input() sessionContext: any;
  @Input() telemetryEventsInput: any;
  @Input() roles: any;
  @Input() editableFieldsACL: any;
  @ViewChild('author_names') authorName;
  @ViewChild('reuestChangeForm') ReuestChangeForm: NgForm;

  public userProfile: IUserProfile;
  public publicDataService: PublicDataService;
  private toasterService: ToasterService;
  public resourceService: ResourceService;
  public editorConfig: any;
  public isAssetBrowserReadOnly = false;
  public isQuestionFocused: boolean;
  public isAnswerFocused: boolean;
  public showPreview = false;
  public refresh = true;
  private prevShowPreview = true;
  public mediaArr = [];
  public userName: any;
  public showRequestChangesPopup = false;
  public formConfiguration: any;
  public textFields: Array<any>;
  public selectionFields: Array<any>;
  public multiSelectionFields: Array<any>;
  public rejectComment: string;
  public questionLimit: Number;
  questionMetaForm: FormGroup;
  initialized = false;
  showFormError = false;
  editor: any;
  selectedSolutionType: string;
  selectedSolutionTypeIndex: string;
  showSolutionDropDown = true;
  showSolution = false;
  videoSolutionName: string;
  videoSolutionData: any;
  editorState: any = {};
  solutionUUID: string;
  myAssets = [];
  allImages = [];
  showImagePicker: boolean;
  showImageUploadModal: boolean;
  showErrorMsg: boolean;
  errorMsg: string;
  topicName: string;
  learningOutcomeOptions = [];
  licencesOptions = [];
  updateStatus = 'update';
  bloomsLevelOptions = ['remember', 'understand', 'apply', 'analyse', 'evaluate', 'create'];
  isReadOnlyMode = false;
  questionRejected = false;
  commentCharLimit = 1000;
  allFormFields: Array<any>;
  selectOutcomeOption = {};
  disableFormField: boolean;
  videoShow: boolean;
  componentConfiguration: any;
  videoThumbnail: string;
  solutionTypes: any = [{
    'type': 'html',
    'value': 'Text+Image'
  },
  {
    'type': 'video',
    'value': 'video'
  }];
  telemetryImpression: any;
  public telemetryPageId = 'question-creation';
  public editableFields = [];

  constructor(
    private userService: UserService, private configService: ConfigService,
    private http: HttpClient, private sourcingService: SourcingService,
    private formBuilder: FormBuilder, publicDataService: PublicDataService,
    toasterService: ToasterService, resourceService: ResourceService, public telemetryService: TelemetryService,
    public actionService: ActionService, private cdr: ChangeDetectorRef, private helperService: HelperService,
    public programTelemetryService: ProgramTelemetryService, public activeRoute: ActivatedRoute,
    public router: Router, private navigationHelperService: NavigationHelperService, private programsService: ProgramsService
  ) {
    this.userService = userService;
    this.configService = configService;
    this.publicDataService = publicDataService;
    this.toasterService = toasterService;
    this.resourceService = resourceService;
  }

  ngOnInit() {
    this.initialized = true;
    this.telemetryPageId =  this.sessionContext.telemetryPageId;
    this.telemetryEventsInput.telemetryPageId = this.telemetryPageId;
    this.solutionUUID = UUID.UUID();
    this.initialize();
    if (this.questionMetaData && this.questionMetaData.data) {
      this.mediaArr = this.questionMetaData.data.media || [];
    }
    this.userName = this.setUserName();
  }

  ngAfterViewInit() {
    this.initializeDropdown();
    this.generateImpressionEvent();
  }

  generateImpressionEvent() {
    const buildNumber = (<HTMLInputElement>document.getElementById('buildNumber'));
    const version = buildNumber && buildNumber.value ? buildNumber.value.slice(0, buildNumber.value.lastIndexOf('.')) : '1.0';
    const telemetryCdata = this.telemetryEventsInput.telemetryInteractCdata;
     setTimeout(() => {
      this.telemetryImpression = {
        context: {
          env: this.activeRoute.snapshot.data.telemetry.env,
          cdata: telemetryCdata || [],
          pdata: {
            id: this.userService.appId,
            ver: version,
            pid: `${this.configService.appConfig.TELEMETRY.PID}`
          }
        },
        edata: {
          type: this.configService.telemetryLabels.pageType.view || _.get(this.activeRoute, 'snapshot.data.telemetry.type'),
          pageid: this.telemetryPageId,
          uri: this.userService.slug.length ? `/${this.userService.slug}${this.router.url}` : this.router.url,
          duration: this.navigationHelperService.getPageLoadTime()
        }
      };
     });
  }

  getTelemetryInteractObject(id: string, type: string) {
    return this.programTelemetryService.getTelemetryInteractObject(id, type, '1.0',
    { l1: this.sessionContext.collection, l2: this.sessionContext.textBookUnitIdentifier, l3: this.sessionContext.resourceIdentifier});
  }

  questionLimitReached() {
    let limit = _.get(this.sessionContext, 'contentMetadata.maxQuestions', undefined);
    let questionList = _.get(this.sessionContext, 'questionList', undefined);
    if(limit && questionList) return (limit === 1 ? true : questionList.length >= limit);
    return false;
  }

  ngOnChanges() {
    this.componentConfiguration =  _.get(this.sessionContext, 'practiceSetConfig');
    if (this.initialized) {
      this.initialize();
    }
  }

  ngAfterViewChecked() {
    if (!this.showPreview && this.prevShowPreview) {
      this.initializeDropdown();
    }
    this.prevShowPreview = this.showPreview;
  }

  initialize() {
    const config: any = _.get(this.sessionContext.practiceSetConfig, 'config');
    this.editorConfig = { 'mode': 'create',
    config,
    channel: this.sessionContext.channel
    };
    this.editorState= {
      question : this.configService.editorConfig.CONTENT_EDITOR.defaultStates.nonInteractiveQuestions[this.sessionContext.questionType].questionBody,
      answer : this.configService.editorConfig.CONTENT_EDITOR.defaultStates.nonInteractiveQuestions[this.sessionContext.questionType].answerBody,
      solutions: ''
    };
    this.manageFormConfiguration();
    if (this.questionMetaData && this.questionMetaData.data) {
      if(this.questionMetaData.data.editorState.question)
        this.editorState.question = this.questionMetaData.data.editorState.question;
      if(this.questionMetaData.data.editorState.answer)
        this.editorState.answer = this.questionMetaData.data.editorState.answer;
      if (!_.isEmpty(this.questionMetaData.data.editorState.solutions)) {
        const editor_state = this.questionMetaData.data.editorState;
        this.editorState.solutions = editor_state.solutions[0].value;
        this.solutionUUID = editor_state.solutions[0].id;
        this.selectedSolutionType = editor_state.solutions[0].type;
        this.showSolutionDropDown = false;
        this.showSolution = true;
        if (this.selectedSolutionType === 'video') {
          const index = _.findIndex(this.questionMetaData.data.media, (o) => {
            return o.type === 'video' && o.id === editor_state.solutions[0].value;
          });
          this.videoSolutionName = this.questionMetaData.data.media[index].name;
          this.videoThumbnail = this.questionMetaData.data.media[index].thumbnail;
        }
      } else {
        this.editorState.solutions = '';
        this.selectedSolutionType = '';
      }
      this.rejectComment = this.questionMetaData.data.rejectComment ? this.questionMetaData.data.rejectComment : '';
    }
    this.isReadOnlyMode = this.sessionContext.isReadOnlyMode;
  }

  setUserName() {
    let userName = '';
    if (this.userService.userProfile.firstName) {
      userName = this.userService.userProfile.firstName;
    }
    if (this.userService.userProfile.lastName) {
      userName += (' ' + this.userService.userProfile.lastName);
    }
    return userName;
  }

  selectSolutionType(data: any) {
    const index = _.findIndex(this.solutionTypes, (sol: any) => {
      return sol.value === data;
    });
    this.selectedSolutionType = this.solutionTypes[index].type;
    if (this.selectedSolutionType === 'video') {
      const showVideo = true;
      this.videoShow = showVideo;
    } else {
      this.showSolutionDropDown = false;
    }
  }

  videoDataOutput(event) {
    if (event) {
      this.videoSolutionData = event;
      this.videoSolutionName = event.name;
      this.editorState.solutions = event.identifier;
      this.videoThumbnail = event.thumbnail;
      const videoMedia: any = {};
      videoMedia.id = event.identifier;
      videoMedia.src = event.src;
      videoMedia.type = 'video';
      videoMedia.assetId = event.identifier;
      videoMedia.name = event.name;
      videoMedia.thumbnail = this.videoThumbnail;
      if (videoMedia.thumbnail) {
        const thumbnailMedia: any = {};
        thumbnailMedia.src = this.videoThumbnail;
        thumbnailMedia.type = 'image';
        thumbnailMedia.id = `video_${event.identifier}`;
        this.mediaArr.push(thumbnailMedia);
      }
      this.mediaArr.push(videoMedia);
      if (videoMedia.thumbnail) {
        const thumbnailMedia: any = {};
        thumbnailMedia.src = this.videoThumbnail;
        thumbnailMedia.type = 'image';
        thumbnailMedia.id = `video_${event.identifier}`;
        this.mediaArr.push(thumbnailMedia);
      }
      this.showSolutionDropDown = false;
      this.showSolution = true;
    } else {
      this.deleteSolution();
    }
    this.videoShow = false;
  }

  deleteSolution() {
    if (this.selectedSolutionType === 'video') {
      this.mediaArr = _.filter(this.mediaArr, (item: any) => item.id !== this.editorState.solutions);
      console.log(this.mediaArr);
    }
    this.showSolutionDropDown = true;
    this.selectedSolutionType = '';
    this.videoSolutionName = '';
    this.editorState.solutions = '';
    this.videoThumbnail = '';
    this.showSolution = false;
  }

  initializeDropdown() {
    (<any>$('.ui.checkbox')).checkbox();
  }

  handleReviewrStatus(event) {
    this.updateQuestion([{ key: 'status', value: event.status }, { key: 'rejectComment', value: event.rejectComment }]);
  }

  buttonTypeHandler(event) {
    this.updateStatus = event;
    if (event === 'preview') {
      if (this.sessionContext.resourceStatus === 'Draft') {
        this.handleSubmit(this.questionMetaForm);
      } else {
        this.showPreview = true;
      }
    } else if (event === 'edit') {
      this.refreshEditor();
      this.showPreview = false;
    } else {
      this.handleSubmit(this.questionMetaForm);
    }
  }

  handleSubmit(questionMetaForm) {
    if (this.editorState.question !== ''
      && this.editorState.answer !== '') {
      this.showFormError = false;
      if (this.questionMetaData.mode !== 'create') {
        this.updateQuestion();
      }
    } else {
      this.showFormError = true;
      this.showPreview = false;
    }
  }

  validateCurrentQuestion() {
    if (_.isEmpty(this.editorState.question) || _.isEmpty(this.editorState.answer)) {
        this.showFormError = true;
        this.showPreview = false;
        return false;
    } else {
      return true;
    }
  }

  /**
   * @param optionalParams  {Array of Objects }  -Key and Value to add in metadata
   */

  updateQuestion(optionalParams?: Array<{}>) {
    forkJoin([this.getConvertedLatex(this.editorState.question), this.getConvertedLatex(this.editorState.answer)])
      .subscribe((res) => {
        const rendererBody = res[0];
        const rendererAnswer = res[1];
        const option = {
          url: this.configService.urlConFig.URLS.ASSESSMENT.UPDATE + '/' + this.questionMetaData.data.identifier,
          data: {
            'request': {
              'assessment_item': {
                'objectType': 'AssessmentItem',
                'metadata': {
                  // tslint:disable-next-line:max-line-length
                  'category': this.sessionContext.questionType === 'curiosity' ? 'CuriosityQuestion' : this.sessionContext.questionType.toUpperCase(),
                  'editorState': {
                    'question': this.editorState.question,
                    'answer': this.editorState.answer
                  },
                  'body': rendererBody,
                  'responseDeclaration': {
                    'responseValue': {
                      'cardinality': 'single',
                      'type': 'string',
                      'correct_response': {
                        'value': rendererAnswer
                      }
                    }
                  },
                  // 'qlevel': this.questionMetaForm.value.qlevel,
                  // 'maxScore': Number(this.questionMetaForm.value.maxScore),
                  'status': 'Draft',
                  'name': this.sessionContext.questionType + '_' + this.sessionContext.framework,
                  'type': 'reference',
                  'code': UUID.UUID(),
                  'template_id': 'NA',
                  'media': this.mediaArr
                }
              }
            }
          }
        };

        let solutionObj: any;
        if (!_.isUndefined(this.selectedSolutionType) && !_.isEmpty(this.selectedSolutionType)) {
          solutionObj = {};
          solutionObj.id = this.solutionUUID;
          solutionObj.type = this.selectedSolutionType;
          solutionObj.value = this.editorState.solutions;
          option.data.request.assessment_item.metadata.editorState['solutions'] = [solutionObj];
          option.data.request.assessment_item.metadata['solutions'] = [solutionObj];
        }

        // tslint:disable-next-line:max-line-length
        option.data.request.assessment_item.metadata = _.pickBy(_.assign(option.data.request.assessment_item.metadata, this.questionMetaForm.value), _.identity);
        if (optionalParams) {
          _.forEach(optionalParams, (param) => {
            option.data.request.assessment_item.metadata[param.key] = param.value;
            if (param.key === 'status') {
              this.updateStatus = param.value;
            }
            if (param.key === 'rejectComment' && param.value !== '') {
              this.questionRejected = true;
            }
          });
        } else {
          option.data.request.assessment_item.metadata['rejectComment'] = '';
        }

        if (_.isEmpty(this.editorState.solutions)) {
          option.data.request.assessment_item.metadata['solutions'] = '';
        }

        this.actionService.patch(option).pipe(catchError(err => {
          const errInfo = {
            errorMsg: 'Question updation failed',
            telemetryPageId: this.telemetryPageId, telemetryCdata : this.telemetryEventsInput.telemetryInteractCdata,
            env : this.activeRoute.snapshot.data.telemetry.env, request: option };
          return throwError(this.sourcingService.apiErrorHandling(err, errInfo));
        })).subscribe((apiRes) => {
          if (this.updateStatus === 'Live') {
            this.toasterService.success('Question Accepted');
          } else if (this.updateStatus === 'Draft' && this.questionRejected) {
            this.toasterService.success('Question Rejected');
            this.showRequestChangesPopup = false;
            this.questionMetaData.data.rejectComment = this.rejectComment;
          } else if (this.updateStatus === 'preview') {
            this.showPreview = true;
          }
          // tslint:disable-next-line:max-line-length
          this.questionStatus.emit({ 'status': 'success', 'type': this.updateStatus, 'identifier': apiRes.result.node_id, 'isRejectedQuestion' : this.questionRejected });
        });
      });
  }

  editorDataHandler(event, type) {
    if (type === 'question') {
      this.editorState.question = event.body;
    } else if (type === 'answer') {
      this.editorState.answer = event.body;
    } else if (type === 'solution') {
      this.editorState.solutions = event.body;
    }

    if (event.mediaobj) {
      const media = event.mediaobj;
      const value = _.find(this.mediaArr, ob => {
        return ob.id === media.id;
      });
      if (value === undefined) {
        this.mediaArr.push(event.mediaobj);
      }
    }
    this.onFormValueChange(true);
  }

  canViewContentType() {
    return !!(this.sessionContext.currentRoles.includes('REVIEWER') && this.userService.userid !== _.get(this.questionMetaData, 'data.createdBy'));
  }

  getConvertedLatex(body) {
    const getLatex = (encodedMath) => {
      return this.http.get('https://www.wiris.net/demo/editor/mathml2latex?mml=' + encodedMath, {
        responseType: 'text'
      });
    };
    let latexBody;
    const isMathML = body && body.match(/((<math("[^"]*"|[^\/">])*)(.*?)<\/math>)/gi);
    if (isMathML && isMathML.length > 0) {
      latexBody = isMathML.map(math => {
        const encodedMath = encodeURIComponent(math);
        return getLatex(encodedMath);
      });
    }
    if (latexBody) {
      return forkJoin(latexBody).pipe(
        map((res) => {
          _.forEach(res, (latex, i) => {
            body = latex.includes('Error') ? body : body.replace(isMathML[i], '<span class="mathText">' + latex + '</span>');
          });
          return body;
        })
      );
    } else {
      return of(body);
    }
  }

  // getConvertedSVG(body) {
  //   const getLatex = (encodedMath) => {
  //     return this.http.get('https://www.wiris.net/demo/editor/render?mml=' + encodedMath + '&backgroundColor=%23fff&format=svg', {
  //       responseType: 'text'
  //     });
  //   };
  //   let latexBody;
  //   const isMathML = body.match(/((<math("[^"]*"|[^\/">])*)(.*?)<\/math>)/gi);
  //   if (isMathML && isMathML.length > 0) {
  //     latexBody = isMathML.map(math => {
  //       const encodedMath = encodeURIComponent(math);
  //       return getLatex(encodedMath);
  //     });
  //   }
  //   if (latexBody) {
  //     return forkJoin(latexBody).pipe(
  //       map((res) => {
  //         _.forEach(res, (latex, i) => {
  //           body = latex.includes('Error') ? body : body.replace(isMathML[i], latex);
  //         });
  //         return body;
  //       })
  //     );
  //   } else {
  //     return of(body);
  //   }
  // }

  private refreshEditor() {
    this.refresh = false;
    this.cdr.detectChanges();
    this.refresh = true;
  }

  requestChanges() {
    if (this.ReuestChangeForm.value.rejectComment) {
      this.handleReviewrStatus({ 'status' : 'Draft', 'rejectComment':  this.ReuestChangeForm.value.rejectComment});
    }
  }

  closeRequestChangeModal() {
    this.showRequestChangesPopup = false;
    this.rejectComment = this.questionMetaData.data.rejectComment ? this.questionMetaData.data.rejectComment : '';
  }

  manageFormConfiguration() {
    const controller = {};
    this.questionMetaForm = this.formBuilder.group(controller);
    if (this.questionMetaData) {
      this.formConfiguration = this.componentConfiguration.config.formConfiguration;
      this.allFormFields = _.filter(this.formConfiguration, {'visible': true});
      this.textFields = _.filter(this.formConfiguration, {'inputType': 'text', 'visible': true});

      // tslint:disable-next-line:max-line-length
      this.disableFormField = (this.sessionContext.currentRoles.includes('CONTRIBUTOR') && this.sessionContext.resourceStatus === 'Draft') ? false : true ;
      const formFields = _.map(this.formConfiguration, (formData) => {
        if (!formData.defaultValue) {
          return formData.code;
        }
        this.selectOutcomeOption[formData.code] = formData.defaultValue;
      });

      this.selectOutcomeOption['license'] = this.sessionContext.licencesOptions;
      if ( _.isArray(this.sessionContext.topic)) {
        this.sessionContext.topic = _.first(this.sessionContext.topic);
      }
      if (this.sessionContext.topic) {
        // tslint:disable-next-line:max-line-length
        this.sessionContext.topic = _.isArray(this.sessionContext.topic) ? this.sessionContext.topic : _.split(this.sessionContext.topic, ',');
      }
      if (_.isUndefined(this.sessionContext.topicList)) {
        this.sessionContext.topicList = _.get(_.find(this.sessionContext.frameworkData, { code: 'topic' }), 'terms');
      }
      const topicTerm = _.find(this.sessionContext.topicList, { name: _.first(this.sessionContext.topic) });
      if (topicTerm && topicTerm.associations) {
        this.selectOutcomeOption['learningOutcome'] = _.map(topicTerm.associations, (learningOutcome) => {
          return learningOutcome.name;
        });
      }
      _.map(this.allFormFields, (obj) => {
        const code = obj.code;
        const preSavedValues = {};
        if (this.questionMetaData) {
          if (obj.inputType === 'select') {
            // tslint:disable-next-line:max-line-length
            preSavedValues[code] = (this.questionMetaData.data[code]) ? (_.isArray(this.questionMetaData.data[code]) ? this.questionMetaData.data[code][0] : this.questionMetaData.data[code]) : '';
            // tslint:disable-next-line:max-line-length
            obj.required ? controller[obj.code] = [preSavedValues[code], [Validators.required]] : controller[obj.code] = preSavedValues[code];
          } else if (obj.inputType === 'multiselect') {
            // tslint:disable-next-line:max-line-length
            preSavedValues[code] = (this.questionMetaData.data[code] && this.questionMetaData.data[code].length) ? this.questionMetaData.data[code] : [];
            // tslint:disable-next-line:max-line-length
            obj.required ? controller[obj.code] = [preSavedValues[code], [Validators.required]] : controller[obj.code] = [preSavedValues[code]];
          } else if (obj.inputType === 'text') {
            if (obj.dataType === 'list') {
              const listValue = (this.questionMetaData.data[code]) ? this.questionMetaData.data[code] : '';
              preSavedValues[code] = _.isArray(listValue) ? listValue.toString() : '';
            } else {
              preSavedValues[code] = (this.questionMetaData.data[code]) ? this.questionMetaData.data[code] : '';
            }
            // tslint:disable-next-line:max-line-length
            obj.required ? controller[obj.code] = [{value: preSavedValues[code], disabled: this.disableFormField}, Validators.required] : controller[obj.code] = preSavedValues[code];
          } else if (obj.inputType === 'checkbox') {
            // tslint:disable-next-line:max-line-length
            preSavedValues[code] = (this.questionMetaData.data[code]) ? this.questionMetaData.data[code] : false;
            // tslint:disable-next-line:max-line-length
            obj.required ? controller[obj.code] = [{value:preSavedValues[code], disabled: this.questionMetaData.data[code]}, [Validators.requiredTrue]] : controller[obj.code] = preSavedValues[code];
          }
        }
      });
      this.editableFields = this.helperService.getEditableFields(this.editableFieldsACL, this.allFormFields, this.questionMetaData);
      this.questionMetaForm = this.formBuilder.group(controller);
      this.onFormValueChange();
    }
  }

  changePolicyCheckValue (event) {
    if ( event.target.checked ) {
      this.questionMetaForm.controls.contentPolicyCheck.setValue(true);
    }
    else {
      this.questionMetaForm.controls.contentPolicyCheck.setValue(false);
    }
  }

  onFormValueChange(isQuestionChanged?: boolean) {
    if (isQuestionChanged) {
      this.questionFormChangeStatus.emit({'status': false});
      return false;
    }

    this.questionMetaForm.valueChanges.subscribe(() => {
      this.questionFormChangeStatus.emit({'status': false});
    });
  }

  markFormGroupTouched(formGroup: FormGroup) {
    (<any>Object).values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control.controls) {
        this.markFormGroupTouched(control);
      }
    });
  }

  canReviewContent() {
    return !!(this.sessionContext.currentRoles.includes('REVIEWER')
      && this.sessionContext.resourceStatus === 'Review'
      && this.programsService.checkForContentSubmissionDate(this.sessionContext.programContext)
      && this.router.url.includes('/contribute')
      && this.userService.userid !== _.get(this.sessionContext, 'contentMetadata.createdBy'))
      && !this.questionLimitReached();
  }

  getEditableFields() {
    this.editableFields = this.helperService.getEditableFields(this.editableFieldsACL, this.allFormFields, this.questionMetaData);
  }

  getMetaData() {
    return this.helperService.getFormattedData(this.questionMetaForm.value, this.textFields);
  }
}
