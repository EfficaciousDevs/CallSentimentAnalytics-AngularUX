import {Component, Inject, OnInit} from '@angular/core';
import {agentDetails} from "./data";
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {NgxSpinnerService} from "ngx-spinner";
import {AuthService} from "../HttpServices/auth.service";
import {of, switchMap} from "rxjs";
import moment from 'moment';

@Component({
  selector: 'app-rules-based-action',
  templateUrl: './rules-based-action.component.html',
  styleUrls: ['./rules-based-action.component.scss']
})
export class RulesBasedActionComponent implements OnInit {

  public agentData: any = [];

  constructor(private auth: AuthService,private callProxy: CallAnalyticsProxiesService,private dialog: MatDialog,public spinner: NgxSpinnerService) {
    Object.assign(this, { agentDetails })
  }
  agentList: any = [];
  chipList = [
    { label: 'Negative Sentiment', value: 1 },
    { label: 'Call Hold Permission Asked', value: 2 },
    { label: 'Call Transfer Permission Asked', value: 3 },
  ];


  rulesReviewData: any = [];

  chipSelected(chip: any){
    if(chip.value === 1){
      this.rulesReviewData = this.filteredReviewData;
      this.rulesReviewData = this.filteredReviewData.filter((entity: any)=>
        entity.custSuppSentiment == 'Negative'
      );

    }else if(chip.value === 2) {
      this.rulesReviewData = this.filteredReviewData;
      this.rulesReviewData = this.filteredReviewData.filter((entity: any)=>
        entity.callHoldPermission.contains('was put on hold')
      );
    }else{
      this.rulesReviewData = this.filteredReviewData;
      this.rulesReviewData = this.filteredReviewData.filter((entity: any)=>
        entity.transferPermission.contains('was not asked')
      );
    }
  }
  tempList: any = [];
  getAgentList(){
    this.spinner.show();
    this.callProxy.fetchManagers().subscribe((agentList: any)=>{
      this.agentList = agentList.filter((entity : any)=> entity.managerName == this.auth.fullName && entity.agentName)
      this.spinner.hide();
    });

  }
  ngOnInit(): void {
    const sideBar: HTMLElement = document.querySelector('.sidebar') as HTMLElement;
    if (sideBar.classList.contains('close')) {
      console.log("SideNav is closed already.");
    } else {
      sideBar.classList.toggle('close');
    }
    document.body.classList.remove('dark');
    this.getAgentList();
    this.getReviewDetails();
    this.callProxy.fetchStats().subscribe((response: any) => {
      this.agentData = response;

    // console.log(this.agentData);
      const extractedData = response.map((call:any) => {
        return {
          agentId: call.agentId,
          custSuppSentiment: call.custSuppSentiment,
          callCategory: call.callCategory
        };
      });

      console.log(extractedData);
    for (const call of response) {
      const value = Number(call.agentId);
      const name = call.custSuppSentiment;


      this.agentSentimentArray.push({ name ,value});
    }


    console.log(this.agentSentimentArray);
    });
    // this.getLearnerDetails();
  }

  learnerList: any = [];
  agentSentimentArray: { name: string; value: number;  }[] = [];
  addTrainingProgram(user: any){
    this.openDialog(user);
  }
  openDialog(agentObject: any): void {
    const dialogRef = this.dialog.open(TrainingDialog, {
      width: '600px',
      data: agentObject,
    });

    dialogRef.afterClosed().subscribe(result=>{
      if(result){
        console.log(result);
        setTimeout(()=>{
          this.getAgentList();
        },2000)
      }
    })
  };


  agentIds: any = [];
  reviewData: any = [];
  filteredReviewData: any = [];
  getReviewDetails(){

    this.spinner.show();
    this.callProxy.fetchManagers().pipe(
      switchMap((data: any) => {
        console.log(data);
        this.agentIds = data
          .filter((item: any) => item.managerId === this.auth.managerId && item.agentName !== null)
          .map((item: any) => item.userId.toString());

        return of(this.agentIds);
      })
    ).subscribe((agentIds: string[]) => {
      this.callProxy.getReviewData(agentIds).subscribe((data:any) => {
        this.reviewData = data;
        this.filteredReviewData = data;
        this.filteredReviewData.sort((a : any, b: any) => {
          const dateA = new Date(a.dateTime);
          const dateB = new Date(b.dateTime);
          // @ts-ignore
          return dateB - dateA;
        });
        // console.log(this.reviewData);
        // this.filteredReviewData = this.reviewData.filter((user:any) => {
        //   const userDate = new Date(user.dateTime);
        //   return userDate >= this.startDate && userDate <= this.endDate;
        // });
        this.spinner.hide();
      });
    });
  }
  swipeHelper(omitUser: any){
    // console.log(omitUser);
    this.spinner.show();
    this.callProxy.addLearner(omitUser).pipe(
      switchMap((data)=>{
        return of(data);
      }),
      switchMap(()=>{
        return this.callProxy.deleteAgents(omitUser.userId);
      })
    ).subscribe(()=>{
      this.getAgentList();
      this.spinner.hide();
    });
  }



  // protected readonly agentDetails = agentDetails;
}


@Component({
  selector: 'dialog-training',
  templateUrl: 'dialog-training.html',
  styleUrls: ['dialog-training.scss']
})
export class TrainingDialog {
  constructor(
    public dialogRef: MatDialogRef<TrainingDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private callService: CallAnalyticsProxiesService
  ) {}

  trainingProgram: string = this.data.trainingProgram ? this.data.trainingProgram : '';
  trainingStartDate: any =  this.data.trainingStartDate ? this.data.trainingStartDate : '';
  trainingEndDate: any = this.data.trainingEndDate ? this.data.trainingEndDate: '';
  trainingFlag : string = this.data.trainingFlag;
  trainingDays: number = this.data.trainingDays;

  calculateDays() {
    const startingDate = new Date(this.trainingStartDate);
    const endingDate : Date = new Date(this.trainingEndDate);

    let momentLib = moment(endingDate);

    this.trainingDays = momentLib.diff(startingDate,"days");
    this.trainingFlag = 'Active';
  }

  trainingPrograms: string[] = [
    "Service Excellence Training",
    "Customer Care Mastery",
    "SupportPro Training",
    "Empathy and Communication Skills Workshop",
    "Client-Centric Training Program",
    "Effective Problem Solving for Support Agents",
    "Building Customer Relationships",
    "Mastering Multichannel Support",
    "Advanced Troubleshooting Techniques",
    "Navigating Difficult Customer Interactions"
  ];

  onSubmit(): void {
    const agentData = {
      "userId": this.data.userId,
      "trainingFlag": this.trainingEndDate ? this.trainingFlag : 'Not Active',
      "trainingStartDate": this.trainingStartDate,
      "trainingEndDate": this.trainingEndDate,
      "trainingDays": this.trainingDays,
      "trainingProgram": this.trainingProgram

    };
    this.callService.tagTrainingCourse(agentData).subscribe((response)=>{
      console.log(response);
    });

    this.dialogRef.close("Training Details added");
  }
}
