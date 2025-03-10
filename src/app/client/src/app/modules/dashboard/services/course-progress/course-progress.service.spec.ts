
import {of as observableOf,  Observable } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ConfigService, SharedModule } from '@sunbird/shared';
import { LearnerService, CoreModule } from '@sunbird/core';
import { TestBed, inject } from '@angular/core/testing';
import { CourseProgressService } from './course-progress.service';
import * as testData from './course-progress.service.spec.data';

xdescribe('CourseProgressService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, CoreModule, SharedModule.forRoot()],
      providers: [CourseProgressService]
    });
  });

  it('should call batch API', () => {
    const courseProgressService = TestBed.get(CourseProgressService);
    const learnerService = TestBed.get(LearnerService);
    spyOn(learnerService, 'post').and.returnValue(observableOf(testData.mockRes.getMyBatchesList));
    const params = {
      data: {
        'request': {
          'filters': {
            'courseId': 'do_112470675618004992181',
            'status': ['1', '2', '3'], 'createdBy': '123'
          }, 'sort_by': { 'createdDate': 'desc' }
        }
      }
    };
    courseProgressService.getBatches(params).subscribe(
      apiResponse => {
        expect(apiResponse.responseCode).toBe('OK');
        expect(apiResponse.result.response.count).toBe(2);
      }
    );
  });

  it('should call get Dashboard API', () => {
    const courseProgressService = TestBed.get(CourseProgressService);
    const learnerService = TestBed.get(LearnerService);
    spyOn(learnerService, 'post').and.returnValue(observableOf(testData.mockRes.courseProgressData.getBatchDetails));
    const params = {
      data: {
        'limit': 200,
        'offset': 0
      }
    };
    courseProgressService.getDashboardData(params).subscribe(
      apiResponse => {
        expect(apiResponse.response).toBe('SUCCESS');
        expect(apiResponse.result.count).toBe(9);
        expect(apiResponse.result.completedCount).toBe(2);
      }
    );
  });

  it('should call Download API', () => {
    const courseProgressService = TestBed.get(CourseProgressService);
    const learnerService = TestBed.get(LearnerService);
    spyOn(learnerService, 'post').and.returnValue(observableOf(testData.mockRes.downloadDashboardReport.getSuccessData));
    const params = {
      data: {
       'batchIdentifier': '01241050605165772817'
      }
    };
    courseProgressService.downloadDashboardData(params).subscribe(
      apiResponse => {
        expect(apiResponse.responseCode).toBe('OK');
        expect(apiResponse.result.requestId).toBe('01241050605165772817');
      }
    );
  });
});
