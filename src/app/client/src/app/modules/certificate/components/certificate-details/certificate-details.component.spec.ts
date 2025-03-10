import { ProgramsService } from './../../../core/services/programs/programs.service';
import { RouterTestingModule } from '@angular/router/testing';
import { MainHeaderComponent } from './../../../core/components/main-header/main-header.component';
import { PublicPlayerService } from '@sunbird/public';
import { CertificateService } from '@sunbird/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { CacheService } from 'ng2-cache-service';
import { Router, ActivatedRoute } from '@angular/router';
import { ComponentFixture, TestBed,  } from '@angular/core/testing';
import { CertificateDetailsComponent } from './certificate-details.component';
import { FormsModule } from '@angular/forms';
import { SharedModule, ResourceService, ConfigService, BrowserCacheTtlService } from '@sunbird/shared';
import { SuiModule } from 'ng2-semantic-ui-v9';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TelemetryModule } from '@sunbird/telemetry';
import { PlayerHelperModule } from '@sunbird/player-helper';
import { throwError as observableThrowError, of as observableOf } from 'rxjs';
import { validateCertMockResponse } from './certificate-details.component.spec.data';
import { DatePipe, Location } from '@angular/common';

xdescribe('CertificateDetailsComponent', () => {
  let component: CertificateDetailsComponent;
  let fixture: ComponentFixture<CertificateDetailsComponent>;

  class RouterStub {
    navigate = jasmine.createSpy('navigate');
  }

  const fakeActivatedRoute = {
    snapshot: {
      data: {
        telemetry: {
          env: 'course', pageid: 'validate-certificate', type: 'view'
        }
      },
      params: {
        uuid: '9545879'
      },
      queryParams: {
        clientId: 'android'
      }
    }
  };


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, FormsModule, SharedModule.forRoot(), SuiModule, TelemetryModule.forRoot(), PlayerHelperModule],
      declarations: [CertificateDetailsComponent],
      providers: [DatePipe, ProgramsService, ResourceService, ConfigService, CacheService, BrowserCacheTtlService, DeviceDetectorService,
        { provide: Router, useClass: RouterStub}, Location,
        { provide: ActivatedRoute, useValue: fakeActivatedRoute }
      ]
    })
      .compileComponents();
    fixture = TestBed.createComponent(CertificateDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });
  

  it('should verify the certificate', () => {
    component.loader = true;
    const certificateService = TestBed.get(CertificateService);
    spyOn(certificateService, 'validateCertificate').and.returnValue(observableOf(validateCertMockResponse.successResponse));
    const certData = validateCertMockResponse.successResponse;
    component.certificateVerify();
    expect(component.loader).toBe(false);
    expect(component.viewCertificate).toBe(true);
    expect(component.recipient).toBe(certData.result.response.json.recipient.name);
    expect(component.courseName).toBe(certData.result.response.json.badge.name);
  });

  it('should not verify the certificate', () => {
    component.loader = true;
    const certificateService = TestBed.get(CertificateService);
    spyOn(certificateService, 'validateCertificate').and.callFake(() => observableThrowError(validateCertMockResponse.errorRespone));
    const certData = validateCertMockResponse.errorRespone;
    component.certificateVerify();
    expect(component.loader).toBe(false);
    expect(component.wrongCertificateCode).toBe(true);
    expect(component.enableVerifyButton).toBe(false);
  });

  it('should get content id', () => {
    const playerService = TestBed.get(PublicPlayerService);
    spyOn(playerService, 'getCollectionHierarchy').and.returnValue(observableOf(validateCertMockResponse.getCourseIdResponse));
    component.watchVideoLink = validateCertMockResponse.getCourseIdResponse.result.content.certVideoUrl;
    component.getCourseVideoUrl('do_1126972203209768961327');
    expect(component.contentId).toBe('do_112831862871203840114');
  });

  it('should play the content', () => {
    component.showVideoThumbnail = false;
    const playerService = TestBed.get(PublicPlayerService);
    spyOn(playerService, 'getContent').and.returnValue(observableOf(validateCertMockResponse.getContentResponse));
    component.playContent('do_112831862871203840114');
  });
});
