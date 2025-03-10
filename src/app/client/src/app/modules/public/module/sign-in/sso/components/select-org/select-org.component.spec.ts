import { ComponentFixture, TestBed,  } from '@angular/core/testing';
import { SelectOrgComponent } from './select-org.component';
import { SuiModule } from 'ng2-semantic-ui-v9';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SharedModule } from '@sunbird/shared';
import { CoreModule } from '@sunbird/core';
import { TelemetryModule } from '@sunbird/telemetry';
import { RouterTestingModule } from '@angular/router/testing';

describe('SelectOrgComponent', () => {
  let component: SelectOrgComponent;
  let fixture: ComponentFixture<SelectOrgComponent>;
  const fakeActivatedRoute = {
    snapshot: {
      data: {
        telemetry: {
          env: 'sso-sign-in', pageid: 'select-org', uri: '/select-org',
          type: 'view', mode: 'self', uuid: 'hadfisgefkjsdvv'
        }
      }
    }
  };


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule.forRoot(), CoreModule, HttpClientTestingModule, SuiModule, TelemetryModule.forRoot(),
        RouterTestingModule],
      declarations: [ SelectOrgComponent ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: ActivatedRoute, useValue: fakeActivatedRoute }]
    })
    .compileComponents();
    fixture = TestBed.createComponent(SelectOrgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
