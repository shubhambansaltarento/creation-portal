import { mockChartData } from './usage-reports.spec.data';
import { ComponentFixture, TestBed,  } from '@angular/core/testing';
import { Observable, of as observableOf } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UsageService } from './../../services';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToasterService, ResourceService } from '@sunbird/shared';
import { UserService } from '@sunbird/core';
import {SharedModule, NavigationHelperService } from '@sunbird/shared';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { UsageReportsComponent } from './usage-reports.component';
import { TelemetryModule } from '@sunbird/telemetry';
import { DataChartComponent } from '../data-chart/data-chart.component';
import { RouterTestingModule } from '@angular/router/testing';
import {APP_BASE_HREF} from '@angular/common';

xdescribe('UsageReportsComponent', () => {
  let component: UsageReportsComponent;
  let fixture: ComponentFixture<UsageReportsComponent>;
  const fakeActivatedRoute = {
    snapshot: { data: { telemetry: { pageid: 'org-admin-dashboard', env: 'dashboard', type: 'view' } } }
  };
  const routerStub = { url: '/dashBoard/organization' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, SharedModule.forRoot(), TelemetryModule.forRoot()],
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [UsageReportsComponent, DataChartComponent],
      providers: [ ToasterService, UserService, NavigationHelperService,
        { provide: ActivatedRoute, useValue: fakeActivatedRoute },
        { provide: Router, useValue: routerStub },
        { provide: APP_BASE_HREF, useValue: '/' }
      ]
    })
      .compileComponents();
    fixture = TestBed.createComponent(UsageReportsComponent);
    component = fixture.componentInstance;
  });
  afterEach(() => {
    fixture.destroy();
  });

  it('can load instance', () => {
    expect(component).toBeTruthy();
  });
  it('chartData defaults to: []', () => {
    expect(component.chartData).toEqual([]);
  });
  it('isTableDataLoaded defaults to: false', () => {
    expect(component.isTableDataLoaded).toEqual(false);
  });
  it('makes expected calls of ngOnInit and render the report ', () => {
    const usageService = TestBed.get(UsageService);
    component.slug = 'sunbird';
    spyOn(document, 'getElementById').and.returnValue('sunbird' as any);
    spyOn(component, 'renderReport').and.callThrough();
    spyOn(usageService, 'getData').and.returnValue(observableOf(mockChartData.configData));
    component.ngOnInit();
    expect(component.renderReport).toHaveBeenCalled();
    expect(component.noResult).toBeFalsy();
    expect(component.renderReport).toHaveBeenCalledWith(component.reportMetaData[0]);
    expect(component.reportMetaData).toBeDefined();
    expect(component.chartData.length).toBe(6);
  });
  it('should call downloadCSV method ', () => {
    const usageService = TestBed.get(UsageService);
    const toasterService = TestBed.get(ToasterService);
    component.slug = 'sunbird';
    spyOn(document, 'getElementById').and.returnValue('sunbird' as any);
    spyOn(usageService, 'getData').and.returnValue(observableOf(mockChartData.configData));
    spyOn(component, 'renderReport').and.callThrough();
    spyOn(component, 'downloadCSV').and.callThrough();
    spyOn(toasterService, 'error').and.callThrough();
    component.ngOnInit();
    component.downloadCSV();
    expect(usageService.getData).toHaveBeenCalled();
    });
});
