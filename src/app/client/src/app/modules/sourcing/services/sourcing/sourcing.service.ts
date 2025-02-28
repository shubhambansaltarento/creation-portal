import { Injectable } from '@angular/core';
import { ConfigService, ToasterService } from '@sunbird/shared';
import { TelemetryService } from '@sunbird/telemetry';
import { ActionService, ContentService, LearnerService, PublicDataService } from '@sunbird/core';
import { map, mergeMap, catchError, tap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import * as _ from 'lodash-es';
import { themeObject, stageObject, questionSetObject, questionObject, questionSetConfigCdataObject } from './data';
import { UUID } from 'angular2-uuid';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SourcingService {

  constructor(
    private httpClient: HttpClient,
    private configService: ConfigService,
    public actionService: ActionService,
    public contentService: ContentService,
    public toasterService: ToasterService,
    public telemetryService: TelemetryService,
    public learnerService: LearnerService,
    public publicDataService: PublicDataService
    ) { }

  public postCertData(file: any, certType: any, userId: any, rootOrgId: any): Observable<any> {
    const formData = new FormData();
    formData.append('users', file);
    formData.append('cert-type', certType);
    formData.append('userId', userId);
    formData.append('rootOrgId', rootOrgId);
    return this.httpClient.post('/certificate/user/upload', formData);
  }

  getQuestionDetails(questionId) {
    const req = {
      url: `${this.configService.urlConFig.URLS.ASSESSMENT.READ}/${questionId}`
    };
    return this.actionService.get(req);
  }

  getQuestionPluginConfig(res, questionSetConfigCdata, collections, roles) {
    const question = _.cloneDeep(questionObject);
    const questionConfigCdata: any = {};
    question.id = UUID.UUID();
    questionConfigCdata.question = _.get(res, 'result.assessment_item.body');
    const media = _.map(_.get(res, 'result.assessment_item.media'), (mediaObj) => {
      delete mediaObj.baseUrl;
      return mediaObj;
    });
    questionConfigCdata.media = media;
    if (_.get(res, 'result.assessment_item.type') === 'reference') {
      questionConfigCdata.answer = _.get(res, 'result.assessment_item.responseDeclaration.responseValue.correct_response.value');
    }
    if (_.get(res, 'result.assessment_item.type') === 'mcq') {
      questionSetConfigCdata.show_feedback = true;
      questionSetConfigCdata.shuffle_questions = false;
      questionConfigCdata.responseDeclaration = _.get(res, 'result.assessment_item.responseDeclaration');
    }
    if (!roles.includes('CONTRIBUTOR')) {
      questionSetConfigCdata.total_items = collections.length;
    }
    questionConfigCdata.options = res.result.assessment_item.options || [];

    if (res.result.assessment_item.solutions && res.result.assessment_item.solutions !== '') {
      questionConfigCdata.solutions = _.get(res, 'result.assessment_item.solutions');
    }
    question.config.__cdata.metadata = {};
    const blacklist = ['media', 'options', 'body', 'question', 'editorState', 'solutions'];
    question.config.__cdata.max_score = _.get(res, 'result.assessment_item.maxScore') || 1;
    question.config.__cdata.metadata = _.cloneDeep(_.omit(res.result.assessment_item, blacklist));
    questionConfigCdata.questionCount = 0;
    question.data.__cdata = JSON.stringify(questionConfigCdata);
    question.config.__cdata = JSON.stringify(question.config.__cdata);
    return question;
  }

  getECMLJSON(collections: Array<string> , roles:Array<string>=[], previewQuestionData ?: any) {
    const theme = _.cloneDeep(themeObject);
    const stage = _.cloneDeep(stageObject);
    const questionSet = _.cloneDeep(questionSetObject);
    stage.id = UUID.UUID();
    theme.startStage = stage.id;
    questionSet.id = UUID.UUID();
    questionSet.data.__cdata.push({
      identifier: questionSet.id
    });
    const questionSetConfigCdata = questionSetConfigCdataObject;

    return of(collections)
      .pipe(mergeMap((collectionIds: Array < string > ) => {
        if ((collectionIds && collectionIds.length > 0) || (roles.includes('CONTRIBUTOR'))) {
          if (!roles.includes('CONTRIBUTOR')) {
            return forkJoin(_.map(collectionIds, (collectionId: string) => {
              const req = {
                url: `${this.configService.urlConFig.URLS.ASSESSMENT.READ}/${collectionId}`
              };
              /**
               * - If role is CONTRIBUTOR don't make read API call
               * - For the above user role only do local preview
               */

              return this.actionService.get(req).pipe(
                map(res => {
                  return this.getQuestionPluginConfig(res, questionSetConfigCdata, collections, roles);
                }),
                catchError(err => of(err))
              );
            }));
          } else {
            return of(this.getQuestionPluginConfig(previewQuestionData, questionSetConfigCdata, collections, roles));
          }
        }
        // else {
        //   console.log('Telemetry error has to log - collection length is 0');
        // }
      }))
      .pipe(
        map(questions => {
          const questionMedia = _.flattenDeep(_.map(questions, question => {
            return (question.data && JSON.parse(question.data.__cdata).media) ? JSON.parse(question.data.__cdata).media : [];
          }));
          theme.manifest.media = _.uniqBy(_.concat(theme.manifest.media, questionMedia), 'id');
          questionSet.config.__cdata = JSON.stringify(questionSetConfigCdata);
          questionSet.data.__cdata = JSON.stringify(questionSet.data.__cdata);
          questionSet['org.ekstep.question'] = questions;
          stage['org.ekstep.questionset'].push(questionSet);
          theme.stage.push(stage);
          return {
            'theme': theme
          };
        })
      );
  }

  apiErrorHandling(err, errorInfo) {
    if (_.get(err, 'error.params.errmsg') || errorInfo.errorMsg) {
      this.toasterService.error(_.get(err, 'error.params.errmsg') || errorInfo.errorMsg);
    }
    const telemetryErrorData = {
      context: {
        env: _.get(errorInfo, 'env') || 'cbse_program',
        cdata: _.get(errorInfo, 'telemetryCdata') || [],
      },
      edata: {
        err: _.toString(err.status),
        errtype: 'SYSTEM',
        stacktrace: JSON.stringify({response: _.pick(err, ['error', 'url']), request: _.get(errorInfo, 'request')}) || errorInfo.errorMsg
      }
    };
    if (errorInfo && errorInfo.telemetryPageId) {
      telemetryErrorData.edata['pageid'] = _.get(errorInfo, 'telemetryPageId');
    }
    if (errorInfo && errorInfo.telemetryObject) {
      telemetryErrorData['object'] = _.get(errorInfo, 'telemetryObject');
    }
    this.telemetryService.error(telemetryErrorData);
  }

  getAssetMedia(req?: object) {
    const reqParam = {
      url: `${this.configService.urlConFig.URLS.COMPOSITE.SEARCH}`,
      data: {
        'request': {
          filters: {
            contentType: 'Asset',
            compatibilityLevel: {
              min: 1,
              max: 2
            },
            status: ['Live'],
          },
          limit: 50,
        }
      }
    };
    reqParam.data.request = req ? _.merge({}, reqParam.data.request, req) : reqParam;
    return this.contentService.post(reqParam);
  }

  createMediaAsset(req?: object) {
    const reqParam = {
      url: this.configService.urlConFig.URLS.ASSET.CREATE,
      data: {
        'request': {
          asset: {
            primaryCategory: 'asset',
            language: ['English'],
            code: 'org.ekstep0.5375271337424472',
          }
        }
      }
    };
    reqParam.data.request = req ? _.merge({}, reqParam.data.request, req) : reqParam;
    return this.actionService.post(reqParam);
  }

  createAsset(req?: object) {
    const reqParam = {
      url: this.configService.urlConFig.URLS.ASSET.CREATE,
      data: {
        'request': {
          asset: {
            code: 'org.ekstep0.5375271337424472',
            channel: 'sunbird'
          }
        }
      }
    };
    reqParam.data.request = req ? _.merge({}, reqParam.data.request, req) : reqParam;
    return this.actionService.post(reqParam);
  }

  readAsset(assetId) {
    const reqParam = {
      url: `${this.configService.urlConFig.URLS.ASSET.READ}/${assetId}`,
    };
    return this.actionService.get(reqParam);
  }

  updateAsset(req: object, assetId) {
    const reqParam = {
      url: `${this.configService.urlConFig.URLS.ASSET.UPDATE}/${assetId}`,
      data: {
        'request': {
          asset: {
            code: 'org.ekstep0.5375271337424472',
            channel: 'sunbird'
          }
        }
      }
    };
    reqParam.data.request = req ? _.merge({}, reqParam.data.request, req) : reqParam;
    return this.actionService.patch(reqParam);
  }

  uploadMedia(req, assetId: any) {
    let reqParam = {
      url: `${this.configService.urlConFig.URLS.DOCKCONTENT.UPLOAD}/${assetId}`,
      data: req.data
    };
    reqParam = req ? _.merge({}, reqParam, req) : reqParam;
    return this.actionService.post(reqParam);
  }
  uploadAsset(req, assetId: any) {
    let reqParam = {
      url: `${this.configService.urlConFig.URLS.ASSET.UPLOAD}/${assetId}`,
      data: req.data
    };
    reqParam = req ? _.merge({}, reqParam, req) : reqParam;
    return this.actionService.post(reqParam);
  }
  generatePreSignedUrl(req, contentId: any) {
    const reqParam = {
      url: `${this.configService.urlConFig.URLS.DOCKCONTENT.PRE_SIGNED_UPLOAD_URL}/${contentId}`,
      data: {
        request: req
      }
    };
    return this.actionService.post(reqParam);
  }
  getVideo(videoId) {
    const reqParam = {
      url: `${this.configService.urlConFig.URLS.DOCKCONTENT.GET}/${videoId}`
    };
    return this.actionService.get(reqParam);
  }
  generateAssetCreateRequest(fileName, fileType, mediaType, creator) {
    return {
      asset: {
        name: fileName,
        mediaType: mediaType,
        mimeType: fileType,
        createdBy: creator.userId,
        creator: `${creator.firstName} ${creator.lastName ? creator.lastName : ''}`,
        channel: 'sunbird'
      }
    };
  }

  duplicateQuestionSet(req, questionSetId) {
    const reqParam = {
      url: `${this.configService.urlConFig.URLS.QUESTIONSET.COPY + questionSetId}`,
      data: {
        request: {
          questionset: req
        }
      }
    };
    return this.actionService.post(reqParam);
  }
}
