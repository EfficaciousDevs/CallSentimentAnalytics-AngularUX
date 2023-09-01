import {AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import * as d3 from "d3";
import {AuthService} from "../HttpServices/auth.service";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {DashboardComponent} from "../dashboard/dashboard.component";

@Component({
  selector: 'app-reporting-dashboard',
  templateUrl: './reporting-dashboard.component.html',
  styleUrls: ['./reporting-dashboard.component.scss']
})
export class ReportingDashboardComponent {

  constructor(private authService: AuthService,private safeURL: DomSanitizer) {
  }

  theme: string = 'dark';
  agentId: number = this.authService.userId;
  managerId: number = this.authService.roleType == 'Manager'? this.authService.managerId : 0;
  roleName: string = this.authService.roleType;
  adminStreamLitURL: any = this.safeURL.bypassSecurityTrustResourceUrl(`http://52.172.252.7:5011/?admin=1`);
  agentStreamLitURL : any = this.safeURL.bypassSecurityTrustResourceUrl(`http://52.172.252.7:5011/?aid=${this.agentId}&theme=${this.theme}`);
  managerStreamLitURL : any = this.safeURL.bypassSecurityTrustResourceUrl(`http://52.172.252.7:5011/?mid=${this.managerId}&theme=${this.theme}`);
}
