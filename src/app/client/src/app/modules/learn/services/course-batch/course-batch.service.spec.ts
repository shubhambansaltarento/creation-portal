import { TestBed, inject } from '@angular/core/testing';

import { CourseBatchService } from './course-batch.service';

import { CoreModule } from '@sunbird/core';

import { SharedModule } from '@sunbird/shared';

import { HttpClientTestingModule } from '@angular/common/http/testing';

xdescribe('BatchService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, SharedModule.forRoot(), CoreModule],
      providers: [CourseBatchService]
    });
  });
});
