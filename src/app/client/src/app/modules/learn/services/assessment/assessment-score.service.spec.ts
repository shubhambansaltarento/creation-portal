import { CoreModule } from '@sunbird/core';
import { CourseProgressService } from '@sunbird/learn';
import { TestBed } from '@angular/core/testing';
import { SharedModule } from '@sunbird/shared';
import { AssessmentScoreService } from './assessment-score.service';
import { RouterTestingModule } from '@angular/router/testing';

xdescribe('AssessmentScoreService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [SharedModule.forRoot(), CoreModule, RouterTestingModule],
    providers: [CourseProgressService, AssessmentScoreService]
  }));

  it('should be created', () => {
    const service: AssessmentScoreService = TestBed.get(AssessmentScoreService);
    expect(service).toBeTruthy();
  });
});
