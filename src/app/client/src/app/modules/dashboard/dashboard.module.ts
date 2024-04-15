// Angular modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// Modules
//import { ChartsModule } from 'ng2-charts';
import { SuiModule } from '@project-sunbird/ng2-semantic-ui';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { TelemetryModule } from '@sunbird/telemetry';
// Custome component(s) and services
import {
  UsageService
} from './services';

import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
// SB core and shared services
import { SearchService } from '@sunbird/core';
import { SharedModule } from '@sunbird/shared';

@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    //ChartsModule,
    SuiModule,
    SharedModule,
    TelemetryModule,
    NgxDaterangepickerMd.forRoot()
  ],
  declarations: [],
  exports: [],
  providers: [
    SearchService,
    UsageService]
})
export class DashboardModule { }
