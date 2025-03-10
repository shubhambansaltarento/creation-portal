import { ComponentFixture, TestBed,  } from '@angular/core/testing';
import {SuiModule} from 'ng2-semantic-ui-v9';

import {MergeAccountStatusComponent} from './merge-account-status.component';
import {ActivatedRoute, Router} from '@angular/router';
import {of as observableOf} from 'rxjs';
import {ResourceService} from '@sunbird/shared';

xdescribe('MergeAccountStatusComponent', () => {
  let component: MergeAccountStatusComponent;
  let fixture: ComponentFixture<MergeAccountStatusComponent>;

  const fakeActivatedRoute = {
    'queryParams': observableOf({isMergeSuccess: false, redirectUri: '/learn'}),
  };
  const resourceBundle = {
    languageSelected$: observableOf({})
  };



  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SuiModule],
      declarations: [MergeAccountStatusComponent],
      providers: [{provide: ActivatedRoute, useValue: fakeActivatedRoute},
        {provide: ResourceService, useValue: resourceBundle},
      ]
    })
      .compileComponents();
    fixture = TestBed.createComponent(MergeAccountStatusComponent);
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
