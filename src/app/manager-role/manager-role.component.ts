import {AfterViewInit, Component, OnInit} from '@angular/core';
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {AuthService} from "../HttpServices/auth.service";
import {of, switchMap} from "rxjs";
import {NgxSpinnerService} from "ngx-spinner";
import {animate, trigger, style,transition} from "@angular/animations";

@Component({
  selector: 'app-manager-role',
  templateUrl: './manager-role.component.html',
  styleUrls: ['./manager-role.component.scss'],
  animations: [
    trigger('slide', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)' }),
        animate('500ms ease-in', style({ transform: 'translateY(0)' }))
      ])
    ])
  ],
})
export class ManagerRoleComponent implements OnInit{

  learnerList: any = [];
  constructor(private callService: CallAnalyticsProxiesService,private auth: AuthService,private spinner: NgxSpinnerService) {
  }
  ngOnInit() {
   this.callService.getLearners().subscribe((data: any)=>{
     this.learnerList = data.filter((item : any)=> item.managerId == this.auth.managerId);
   });

   console.log(this.learnerList);
   this.getReviewDetails();
  this.spinner.show();
   this.callService.fetchManagers().subscribe((data: any)=>{
     this.unreviewedData = data.filter((item: any)=> this.agentIds.includes(item.userId.toString()));
     // console.log(this.unreviewedData);
     this.spinner.hide();
   })
  }




  agentIds : any = [];
  reviewData: any = [];
  unreviewedData : any = [];
  getReviewDetails(){
    this.spinner.show();
    this.callService.fetchManagers().pipe(
      switchMap((data: any) => {
        console.log(data);
        this.agentIds = data
          .filter((item: any) => item.managerId === this.auth.managerId && item.agentName !== null)
          .map((item: any) => item.userId.toString());

        return of(this.agentIds);
      })
    ).subscribe((agentIds: string[]) => {
      this.callService.getReviewData(agentIds).subscribe((data) => {
        this.reviewData = data;
        console.log(this.reviewData);
        this.spinner.hide();
      });
    });
  }
}
