import { ComponentFixture, TestBed, inject,  } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClientModule } from '@angular/common/http';
import { By } from '@angular/platform-browser';

import { NO_ERRORS_SCHEMA } from '@angular/core';
// Import services
import { ResourceService, ConfigService, BrowserCacheTtlService } from '../../services/index';
import { CacheService } from 'ng2-cache-service';
import { DateFormatPipe } from '../../pipes/index';
import { Announcement } from '../../interfaces/index';
import { AnnouncementInboxCardComponent } from './announcement-inbox-card.component';
// Test data
import * as mockData from './announcement-inbox-card.component.spec.data';
const testData = mockData.mockRes;
describe('AnnouncementInboxCardComponent', () => {
  let component: AnnouncementInboxCardComponent;
  let fixture: ComponentFixture<AnnouncementInboxCardComponent>;



  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, HttpClientModule],
      declarations: [AnnouncementInboxCardComponent, DateFormatPipe],
      providers: [ ResourceService, ConfigService , CacheService, BrowserCacheTtlService ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
    fixture = TestBed.createComponent(AnnouncementInboxCardComponent);
    component = fixture.componentInstance;
  });

  it('should show TEST INPUT for circular type', () => {
    component.announcement = testData.successData;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('div .segment-heading').innerText.trim()).toEqual('abc');
    expect(fixture.nativeElement.querySelector('div .announcement-type').innerText.trim()).toEqual('CIRCULAR');
    expect(fixture.nativeElement.querySelector('div .announcement-org-name').innerText.trim()).toEqual('for');
    expect(fixture.nativeElement.querySelector('div .announcement-description').innerText.trim()).toEqual('');
    expect(fixture.nativeElement.querySelector('div.last span.announcement-extra-data').innerText.trim()).toEqual('1 more weblink(s)');
  });

  it('should show TEST INPUT for news type', () => {
    component.announcement = testData.parseSuccessData;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('div .announcement-type').innerText.trim()).toEqual('NEWS');
    expect(fixture.nativeElement.querySelector('div .expand-or-minimize')).toEqual(null);
    expect(fixture.nativeElement.querySelector('div .announcement-link-or-attachment').innerText.trim()).toEqual('');
    expect(fixture.nativeElement.querySelector('div .announcement-description').innerText.trim()).toEqual('hi');
  });
});
