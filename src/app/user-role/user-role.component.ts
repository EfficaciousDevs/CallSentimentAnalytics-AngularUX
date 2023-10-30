import {Component, OnInit} from '@angular/core';
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {NgxSpinnerService} from "ngx-spinner";
import {AuthService} from "../HttpServices/auth.service";
import {AudioDialog} from "../review/review.component";
import {MatDialog} from "@angular/material/dialog";
import {AgentDetails} from "./agentDetails.model";
import {animate, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'app-user-role',
  templateUrl: './user-role.component.html',
  styleUrls: ['./user-role.component.scss'],
  animations: [
    trigger('slide', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)' }),
        animate('500ms ease-in', style({ transform: 'translateY(0)' }))
      ])
    ])
  ],
})
export class UserRoleComponent implements OnInit{

  constructor(private dialog: MatDialog,private callService: CallAnalyticsProxiesService,private auth: AuthService,public spinnerService: NgxSpinnerService){}
ngOnInit() {
  const sideBar: HTMLElement = document.querySelector('.sidebar') as HTMLElement;
  if (sideBar.classList.contains('close')) {
    console.log("SideNav is closed already.");
  } else {
    sideBar.classList.toggle('close');
  }
  this.agentId = this.auth.userId.toString();
  this.getReviewDetails();
  document.body.classList.remove('dark');
  // let objRef1 = document.getElementById("legacyCalls");
  // let objRef2 = document.getElementById("reportingProgress");
  // let objRef3 = document.getElementById("totalQueries");
  // let objRef4 = document.getElementById("queriesSolved");
  // this.animateValue(objRef1, 1, 74, 1000);
  // this.animateValue(objRef2, 1, 71, 1000);
  // this.animateValue(objRef3, 1, 65, 1000);
  // this.animateValue(objRef4, 1, 44, 1000);
}

  // animateValue(obj : any, start: any, end: any, duration: any) {
  //   let startTimestamp: any = null;
  //   const step = (timestamp: any) => {
  //     if (!startTimestamp)
  //       startTimestamp = timestamp;
  //     const progress = Math.min((timestamp - startTimestamp) / duration, 1);
  //     obj.innerHTML = Math.floor(progress * (end - start) + start);
  //     if (progress < 1) {
  //       window.requestAnimationFrame(step);
  //     }
  //   };
  //   window.requestAnimationFrame(step);
  // }


  reviewData: any = [];
  agentId: string = '';
  trainingDetails: any = [];
  $filterClicked: boolean = false;
  isFilterClicked(){
    this.$filterClicked = !this.$filterClicked;
  }

  getReviewDetails(){
    this.spinnerService.show();
    this.callService.fetchAgentStats(this.agentId).subscribe((data: any)=>{
      this.reviewData = data;
      this.filteredReviewData = data;
      this.filteredReviewData.sort((a : any, b: any) => {
        const dateA = new Date(a.dateTime);
        const dateB = new Date(b.dateTime);
        // @ts-ignore
        return dateB - dateA;
      });
      // this.reviewData  = data.filter((entry: any) => entry.agentId == this.auth.userId.toString());
      console.log(this.reviewData);
      // this.spinnerService.hide();
    });

    // for(const agents of this.reviewData){
    //   this.agentDetails.push({
    //     name: agents.callCategory,
    //     series:[{
    //       name: agents.custSuppSentiment,
    //       value:
    //     }]
    //   })
    // }

    this.callService.getLearners().subscribe((response: any)=>{
      this.trainingDetails = response.filter((item: any)=> item.agentId == this.auth.userId && item.trainingCourse)
      console.log(this.trainingDetails);
      this.spinnerService.hide();
    })

  }

  searchValue: string = ''; // To store the search text
  filteredReviewData: any = []; // To store the filtered data

  applyFilter(searchValue: any) {
    this.searchValue = searchValue.target.value.trim();

    this.filteredReviewData = this.reviewData.filter((user : any) => {
      const searchString = this.searchValue.toLowerCase();
      return (
        user.callCategory.toLowerCase().includes(searchString) ||
        user.customerProblem.toLowerCase().includes(searchString)||
        user.custSuppSentiment.toLowerCase().includes(searchString) ||
        user.callHoldPermission.toLowerCase().includes(searchString) ||
        user.transferPermission.toLowerCase().includes(searchString) ||
        user.keyScore == Number(searchString)
      );
    });
  }


  openAudioDialog(callId: string): void {
    this.spinnerService.show();
    this.callService.getAudioURL(callId).subscribe((base64:string) => {
      const dialogRef = this.dialog.open(AudioDialog, {
        width: '400px',
        data: `data:audio/mpeg;base64,${base64}`,
      });
      this.spinnerService.hide();
    });
  };
}
