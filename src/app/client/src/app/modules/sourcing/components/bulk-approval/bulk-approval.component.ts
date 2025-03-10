import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { UserService, ActionService, ProgramsService, LearnerService } from '@sunbird/core';
import { ConfigService, ResourceService, ToasterService } from '@sunbird/shared';
import { BulkJobService } from '../../services/bulk-job/bulk-job.service';
import { HelperService } from '../../services/helper.service';
import { ProgramTelemetryService } from '../../../program/services';
import { CacheService } from 'ng2-cache-service';
import * as _ from 'lodash-es';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ItemsetService } from '../../services/itemset/itemset.service';

@Component({
  selector: 'app-bulk-approval',
  templateUrl: './bulk-approval.component.html',
  styleUrls: ['./bulk-approval.component.scss']
})
export class BulkApprovalComponent implements OnInit, OnChanges {

  public showBulkApproveModal = false;
  public bulkApprovalComfirmation = false;
  public showBulkApprovalButton = false;
  public approvalPending: Array<any> = [];
  public folderData: Array<any> = [];
  public originFolderData: Array<any> = [];
  public dikshaContents: Array<any>;
  public unitsInLevel: Array<any> = [];
  public unitGroup: any;
  public bulkApprove: any;
  public processId: string;
  public successPercentage: number;
  public initialized: boolean;
  public telemetryInteractCdata: any;
  public telemetryInteractPdata: any;
  public telemetryInteractObject: any;
  public telemetryPageId: string;
  public disableBulkApprove = false;
  public buttonDisabled = false;
  @Input() programContext;
  @Input() sessionContext;
  @Input() storedCollectionData;
  @Input() originalCollectionData;
  @Input() programContents;
  @Output() updateToc = new EventEmitter<any>();

  constructor(public resourceService: ResourceService, public bulkJobService: BulkJobService,
    public cacheService: CacheService, public userService: UserService, public programsService: ProgramsService,
    public toasterService: ToasterService, public helperService: HelperService,
    public actionService: ActionService, public programTelemetryService: ProgramTelemetryService,
    public configService: ConfigService, public learnerService: LearnerService) { }

  ngOnInit() {
    this.checkBulkApproveHistory();
    if (!this.programContext.target_type || this.programContext.target_type === 'collections') {
      this.checkOriginFolderStatus([this.originalCollectionData]);
      this.approvalPendingContents([this.storedCollectionData]);
      this.buttonDisabled = !!(!this.originalCollectionData || this.originalCollectionData && this.originalCollectionData.status !== 'Draft')
    } else {
      this.getProgramaAprovalPendingContents(this.programContents);
    }

    this.initialized = true;
    this.telemetryInteractCdata = _.get(this.sessionContext, 'telemetryPageDetails.telemetryInteractCdata') || [];
    // tslint:disable-next-line:max-line-length
    this.telemetryInteractPdata = this.programTelemetryService.getTelemetryInteractPdata(this.userService.appId, this.configService.appConfig.TELEMETRY.PID );
    // tslint:disable-next-line:max-line-length
    this.telemetryInteractObject = this.programTelemetryService.getTelemetryInteractObject(this.sessionContext.collection, 'Content', '1.0', { l1: this.sessionContext.collection });
    this.telemetryPageId = this.sessionContext.telemetryPageDetails.telemetryPageId;
  }

  ngOnChanges() {
    if (this.initialized) {
      this.approvalPending = [];
      if (!this.programContext.target_type || this.programContext.target_type === 'collections') {
        this.approvalPendingContents([this.storedCollectionData]);
      }
      if (this.approvalPending && this.approvalPending.length) {
        if (!this.bulkApprove || this.bulkApprove && this.bulkApprove.status !== 'processing') {
          this.showBulkApprovalButton = true;
        }
      }
    }
  }

  getProgramaAprovalPendingContents(contents) {
    _.forEach(contents, obj => {
      if (obj.status === 'Live' && this.checkApprovalPending(obj)) {
        const content = _.pick(obj, ['name', 'channel', 'code', 'mimeType', 'framework', 'contentType', 'identifier', 'parent']);
        if (!_.find(this.approvalPending, cont => cont.identifier === content.identifier)) {
          this.approvalPending.push(content);
        }
      }
    });
  }

  approvalPendingContents(hierarchy) {
    _.forEach(hierarchy, obj => {
      const isMainCollection = this.helperService.checkIfMainCollection(obj);
      const isCollectionFolder = this.helperService.checkIfCollectionFolder(obj);
      if (isMainCollection || isCollectionFolder) {
        const unit = _.pick(obj, ['identifier', 'origin']);
        if (isMainCollection) {
          const originUnit = _.find(this.originFolderData, o => o.identifier === unit.origin && o.status === 'Draft');
          if (originUnit) {
            this.folderData.push({identifier: obj.identifier, origin: obj.origin});
          }
        }
        if (isCollectionFolder) {
          const originUnit = _.find(this.originFolderData, o => o.identifier === unit.origin);
          if (originUnit) {
            this.folderData.push({identifier: obj.identifier, origin: obj.origin});
          }
        }
      }

      if (!isMainCollection && !isCollectionFolder && obj.status === 'Live' && this.checkApprovalPending(obj)) {
          const content = _.pick(obj, ['name', 'code', 'mimeType', 'framework', 'contentType', 'identifier', 'parent']);
          const unitData = _.find(this.folderData, data => data.identifier === content.parent);
          if (unitData) {
            content['originUnitId'] = unitData.origin;
            if (!_.find(this.approvalPending, cont => cont.identifier === content.identifier)) {
              this.approvalPending.push(content);
            }
          }
      }
      if (obj.children && obj.children.length) {
        this.approvalPendingContents(obj.children);
      }
    });
  }

  checkApprovalPending(content) {
    let reviewedContents;
    if (!this.programContext.target_type || this.programContext.target_type === 'collections') {
      reviewedContents = [...this.storedCollectionData.acceptedContents || [],
                                      ...this.storedCollectionData.rejectedContents || []];
    } else {
      reviewedContents = [...this.programContext.acceptedcontents || [],
                                      ...this.programContext.rejectedcontents || []];
    }
    if (reviewedContents && reviewedContents.length &&
      _.includes(reviewedContents, content.identifier)) {
         return false;
   } else {
     return true;
   }
  }

  checkOriginFolderStatus(hierarchy) {
    _.forEach(hierarchy, obj => {
      const isMainCollection = this.helperService.checkIfMainCollection(obj);
      const isCollectionFolder = this.helperService.checkIfCollectionFolder(obj);
      if (isMainCollection || isCollectionFolder) {
        this.originFolderData.push({identifier: obj.identifier, status: obj.status});
      }
      if (obj.children && obj.children.length) {
        this.checkOriginFolderStatus(obj.children);
      }
    });
  }
  showApproveBulkModal() {
    if (!this.disableBulkApprove) {
      this.showBulkApproveModal = true;
      this.bulkApprovalComfirmation = true;
    }
  }
  bulkApproval() {
    this.disableBulkApprove = true;
    this.sendContentForBulkApproval();
  }

  sendContentForBulkApproval() {
    const baseUrl = (<HTMLInputElement>document.getElementById('portalBaseUrl'))
    ? (<HTMLInputElement>document.getElementById('portalBaseUrl')).value : window.location.origin;
    const contents = [];
    const questionSets = [];
    const temp = _.compact(_.map(this.approvalPending, item => {
      const reqFormat = {};
      if ((!this.programContext.target_type || this.programContext.target_type === 'collections') && item.originUnitId) {
        const channel =  _.get(this.storedCollectionData.originData, 'channel');
        if (_.isString(channel)) {
          item['createdFor'] = [channel];
        } else if (_.isArray(channel)) {
          item['createdFor'] = channel;
        }
        reqFormat['metadata'] = {..._.pick(this.storedCollectionData, ['framework']),
                        ..._.pick(_.get(this.storedCollectionData, 'originData'), ['channel']),
                          ..._.pick(item, ['name', 'code', 'mimeType', 'contentType', 'createdFor']),
                            ...{lastPublishedBy: this.userService.userProfile.userId}},
        reqFormat['collection'] =  [
          {
            identifier: this.storedCollectionData.origin,
            unitId: item.originUnitId
          }
        ];
      } else if(this.programContext.target_type === 'searchCriteria') {
        if (_.isString(item.channel)) {
          item['createdFor'] = [item.channel];
        } else if (_.isArray(item.channel)) {
          item['createdFor'] = item.channel;
        }
        reqFormat['metadata'] = {
          ..._.pick(item, ['framework', 'channel', 'name', 'code', 'mimeType', 'contentType', 'createdFor']),
          ...{lastPublishedBy: this.userService.userProfile.userId}}
      }
      if (!_.isEmpty(reqFormat)) {
        if (_.get(item, 'mimeType').toLowerCase() === 'application/vnd.sunbird.questionset') {
          reqFormat['source'] = `${baseUrl}/api/questionset/v1/read/${item.identifier}`;
          questionSets.push(reqFormat);
        } else {
          reqFormat['source'] = `${baseUrl}/api/content/v1/read/${item.identifier}`;
          contents.push(reqFormat);
        }
      }
    }));
    if (contents && contents.length) {
      const reqOption = {
        url: this.configService.urlConFig.URLS.BULKJOB.DOCK_IMPORT_V1,
        data: {
          request: {
            content: [
              ...contents
            ]
          }
        }
      };

      this.learnerService.post(reqOption).subscribe((res: any) => {
        if (res && res.result && res.result.processId) {
          this.processId = res.result.processId;
          if (questionSets && questionSets.length) {
            reqOption.url = this.configService.urlConFig.URLS.BULKJOB.DOCK_QS_IMPORT_V1;
            reqOption.data.request['processId'] = this.processId;
            reqOption.data.request['questionset'] = {};
            reqOption.data.request['questionset'] = [...questionSets];
            delete reqOption.data.request.content;

          this.learnerService.post(reqOption).subscribe((res: any) => {
            this.createBulkApprovalJob();
            this.updateCollection();
          });
        } else {
            this.createBulkApprovalJob();
            this.updateCollection();
          }
        }
      }, err => {
        this.disableBulkApprove = false;
        this.toasterService.error(this.resourceService.messages.emsg.bulkApprove.something);
      });
    } else if (questionSets && questionSets.length) {
      const reqOption = {
        url: this.configService.urlConFig.URLS.BULKJOB.DOCK_QS_IMPORT_V1,
        data: {
          request: {
            questionset: [
              ...questionSets
            ]
          }
        }
      };
      this.learnerService.post(reqOption).subscribe((res: any) => {
        this.processId = res.result.processId;
        this.createBulkApprovalJob();
        this.updateCollection();
      });
    } else {
      this.disableBulkApprove = false;
      this.toasterService.error(this.resourceService.messages.emsg.bulkApprove.something);
    }
  }

  createBulkApprovalJob() {
    const reqData = {
      process_id: this.processId,
      program_id: this.programContext.program_id,
      collection_id: this.sessionContext.collection,
      org_id: this.userService.userProfile.rootOrgId || '',
      type: 'bulk_approval',
      status: 'processing',
      overall_stats: {
        approve_success: 0,
        approve_failed: 0,
        approve_pending: this.approvalPending.length,
        total: this.approvalPending.length
      },
      createdby: this.userService.userProfile.userId,
      createdon: new Date()
    };
    if (_.get(this.programContext,'target_type') && this.programContext.target_type === 'searchCriteria') {
      delete(reqData.collection_id);
    }
    this.bulkJobService.createBulkJob(reqData).subscribe(res => {
      this.bulkApprove = reqData;
      this.bulkJobService.setProcess(this.bulkApprove);
      this.showBulkApprovalButton = false;
      this.toasterService.success(this.resourceService.messages.smsg.bulkApprove.create);
    }, err => {
      this.toasterService.error(this.resourceService.messages.emsg.bulkApprove.something);
    });
  }

  updateBulkApprovalJob() {
    if (!_.get(this.bulkApprove, 'overall_stats.approve_pending')) {
      this.bulkApprove.status = 'completed';
      this.bulkApprove['completedon'] = new Date();
    }
    const request = _.pick(this.bulkApprove, ['process_id', 'status', 'overall_stats', 'completedon']);
    request['updatedby'] = this.userService.userProfile.userId;
    this.bulkJobService.updateBulkJob(request).subscribe((res: any) => {
      if (this.bulkApprove.status === 'completed') {
        this.showBulkApprovalButton = true;
      }
      this.bulkJobService.setProcess(this.bulkApprove);
      this.toasterService.success(this.resourceService.messages.smsg.bulkApprove.update);
    }, err => {
      this.toasterService.error(this.resourceService.messages.emsg.bulkApprove.something);
    });
  }

  updateCollection() {
    if (!this.programContext.target_type || this.programContext.target_type === 'collections') {
      const option = {
        url: `${this.configService.urlConFig.URLS.DOCKCONTENT.GET}/${this.sessionContext.collection}`,
        param: { 'mode': 'edit', 'fields': 'acceptedContents,versionKey' }
      };
      this.actionService.get(option).pipe(map((res: any) => res.result.content)).subscribe((data) => {
        const request = {
          content: {
            'versionKey': data.versionKey
          }
        };
        // tslint:disable-next-line:max-line-length
        request.content['acceptedContents'] = _.compact(_.uniq([...this.storedCollectionData.acceptedContents || [],
                                            ..._.map(_.filter(this.approvalPending, content => content.originUnitId), 'identifier')]));
        this.helperService.updateContent(request, this.sessionContext.collection).subscribe(res => {
        this.updateToc.emit('bulkApproval_completed');
        this.showBulkApprovalButton = false;
        }, err => {
          this.toasterService.error(this.resourceService.messages.emsg.bulkApprove.updateToc);
        });
      });
    } else if (this.programContext.target_type === 'searchCriteria') {
        let request = {
          program_id: this.programContext.program_id
        };
          // tslint:disable-next-line:max-line-length
        request['acceptedcontents'] = _.compact(_.uniq([...this.programContext.acceptedcontents || [],
          ..._.map(this.approvalPending, 'identifier')]));
        this.programsService.updateProgram(request).subscribe(() => {
          this.updateToc.emit('bulkApproval_completed');
          this.showBulkApprovalButton = false;
        }, (err) => {
          this.toasterService.error(this.resourceService.messages.emsg.bulkApprove.updateToc);

        });
    }
  }

  viewBulkApprovalStatus() {
    if (this.bulkApprove && this.bulkApprove.status === 'processing') {
      this.bulkJobService.searchContentWithProcessId(this.bulkApprove.process_id, this.bulkApprove.type).subscribe((res: any) => {
        this.successPercentage = 0;
        if (res.result) {
          const contents = _.compact(_.concat(_.get(res.result, 'QuestionSet'), _.get(res.result, 'content')));
          if (contents.length) {
            const overallStats = this.bulkApprove && this.bulkApprove.overall_stats;
            this.dikshaContents = contents;
            overallStats['approve_success'] = _.filter(this.dikshaContents, content => content.status === 'Live').length;
            // tslint:disable-next-line:max-line-length
            overallStats['approve_failed'] = _.filter(this.dikshaContents, content => content.status === 'Failed').length;
            overallStats['approve_pending'] = overallStats.total - (overallStats['approve_success'] + overallStats['approve_failed']);
            this.bulkApprove.overall_stats = overallStats;
            // tslint:disable-next-line:max-line-length
            this.successPercentage = Math.round((this.bulkApprove.overall_stats.approve_success / this.bulkApprove.overall_stats.total) * 100);
            this.updateBulkApprovalJob();
          }
        }
      }, err => {
        this.toasterService.error(this.resourceService.messages.emsg.bulkApprove.something);
      });
    }
  }

  findFolderLevel({ children = [], ...object }, identifier) {
    let result;
    if (object.identifier === identifier) {
      return object;
    }
    return children.some(o => result = this.findFolderLevel(o, identifier)) && Object.assign({}, object, { chi: [result] });
  }

  tree(ob) {
    _.forEach(ob.chi, bb => {
      if (this.helperService.checkIfCollectionFolder(bb)) {
        this.unitGroup.push({name: bb.name, identifier: bb.identifier});
      }
      if (bb.chi) {
        this.tree(bb);
      }
    });
  }

  prepareTableData() {
    const failedContent = _.filter(this.dikshaContents, content => content.status === 'Failed');
    if (!this.programContext.target_type || this.programContext.target_type === 'collections') {
      this.unitsInLevel = _.map(failedContent, content => {
        return this.findFolderLevel(this.storedCollectionData, content.origin);
      });
    }

    try {
      const headers = ['identifier', 'name', 'contentType'];
      if (!this.programContext.target_type || this.programContext.target_type === 'collections') {
        headers.push('Level 1 Textbook Unit');
        headers.push('Level 2 Textbook Unit');
        headers.push('Level 3 Textbook Unit');
        headers.push('Level 4 Textbook Unit');
      }
      const tableData = _.map(failedContent, (con, i) => {
        const result = _.pick(con, ['identifier', 'name', 'primaryCategory']);
        if (!this.programContext.target_type || this.programContext.target_type === 'collections') {
          const folderStructure = this.unitsInLevel[i];
          this.unitGroup = [];
          this.tree(folderStructure);
          if (this.unitGroup && this.unitGroup.length) {
            result['Level 1 Textbook Unit'] = this.unitGroup[0] && this.unitGroup[0].name || '';
            result['Level 2 Textbook Unit'] = this.unitGroup[1] && this.unitGroup[1].name || '';
            result['Level 3 Textbook Unit'] = this.unitGroup[2] && this.unitGroup[2].name || '';
            result['Level 4 Textbook Unit'] = this.unitGroup[3] && this.unitGroup[3].name || '';
          }
        }
        return result;
      });

      const csvDownloadConfig = {
        filename: `Bulk Approval Failed Content Report Of Book - ${this.storedCollectionData.name.trim()}`,
        tableData: tableData,
        headers: headers,
        showTitle: false
      };
        this.programsService.generateCSV(csvDownloadConfig);
      } catch (err) {
        this.toasterService.error(this.resourceService.messages.emsg.bulkApprove.something);
      }
  }

  downloadFailedContentReport() {
    if (!this.dikshaContents) {
      this.bulkJobService.searchContentWithProcessId(this.bulkApprove.process_id, this.bulkApprove.type).subscribe((res: any) => {
        if (res.result && res.result.content && res.result.content.length) {
          this.dikshaContents = _.get(res, 'result.content');
          this.prepareTableData();
        }
      });
    } else {
      this.prepareTableData();
    }
  }

  checkBulkApproveHistory() {
    let bulkApproveParam;
    if (!this.programContext.target_type || this.programContext.target_type === 'collections') {
      bulkApproveParam = 'bulk_approval_' + this.sessionContext.collection;
    } else if (this.programContext.target_type === 'searchCriteria') {
      bulkApproveParam = 'bulk_approval_' + this.sessionContext.programId;
    }
    this.bulkApprove = this.cacheService.get(bulkApproveParam);
    if (this.bulkApprove) {
      if (this.bulkApprove.status === 'processing') {
      } else {
        this.showBulkApprovalButton = true;
      }
    } else {
      const reqData = {
        filters: {
          program_id: this.programContext.program_id        }
      };

      if (!this.programContext.target_type || this.programContext.target_type === 'collections') {
        reqData.filters['collection_id'] = this.sessionContext.collection;
      }

      this.bulkJobService.getBulkOperationStatus(reqData).subscribe(res => {
        if (res.result && res.result.process && res.result.process.length) {
          this.bulkApprove = this.cacheService.get(bulkApproveParam);
        }
        if (!this.bulkApprove || this.bulkApprove && this.bulkApprove.status !== 'processing') {
          this.showBulkApprovalButton = true;
        }
      }, err => {
        this.toasterService.error(this.resourceService.messages.emsg.bulkApprove.something);
      });
    }
  }
}
