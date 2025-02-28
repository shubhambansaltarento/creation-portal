import { ComponentFixture, TestBed,  } from '@angular/core/testing';
import {SuiModule} from 'ng2-semantic-ui-v9';
import {ResourceService} from '@sunbird/shared';
import {TelemetryModule} from '@sunbird/telemetry';
import {RouterTestingModule} from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import {AccountMergeModalComponent} from './account-merge-modal.component';
import {of as observableOf} from 'rxjs';
import {InterpolatePipe} from './../../pipes';

xdescribe('AccountMergeModalComponent', () => {
  let component: AccountMergeModalComponent;
  let fixture: ComponentFixture<AccountMergeModalComponent>;

  const resourceBundle = {
    languageSelected$: observableOf({})
  };



  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SuiModule, TelemetryModule.forRoot(), RouterTestingModule, HttpClientTestingModule],
      declarations: [AccountMergeModalComponent, InterpolatePipe],
      providers: [
        {provide: ResourceService, useValue: resourceBundle}]
    })
      .compileComponents();
    fixture = TestBed.createComponent(AccountMergeModalComponent);
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
