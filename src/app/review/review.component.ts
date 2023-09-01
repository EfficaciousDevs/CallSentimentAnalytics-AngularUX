import {AfterViewInit, Component, Inject, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {NgxSpinnerService} from "ngx-spinner";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";
import {AuthService} from "../HttpServices/auth.service";
import {of, switchMap} from "rxjs";
import {ChipColor, UserRole} from "../create-roles/create-roles.component";
import * as moment from "moment/moment";
import {MatTableDataSource} from "@angular/material/table";
import {MatSort} from "@angular/material/sort";
import {MatPaginator} from "@angular/material/paginator";
import {animate, state, style, transition, trigger} from "@angular/animations";


@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1 })),
      transition('void => *', [style({ opacity: 0 }), animate(300)]),
      transition('* => void', [animate(300, style({ opacity: 0 }))]),
    ]),
  ],
})
export class ReviewComponent implements OnInit{
  $filterClicked: boolean = false;
  isFilterClicked(){
    this.$filterClicked = !this.$filterClicked;
  }


  // dataSource = new MatTableDataSource<any>();
  // displayedColumns: string[] =
  //   ['agentName', 'callCategory', 'customerQuery','summary','audioPlay',
  //     'keyScore','customerSupportSentiment','callHoldPermission','callTransferPermission','dateTime','action'];
  //
  // applyFilter(filterValue: any) {
  //   filterValue = filterValue.target.value.trim(); // Remove whitespace
  //   filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
  //   this.dataSource.filter = filterValue;
  // }

  ngOnInit() {
    let threeDaysAgo = this.startDate.getDate() - 3;
    this.startDate.setDate(threeDaysAgo);
    this.getReviewDetails();

    // this.spinner.show();
    // this.callService.fetchManagers().pipe(
    //   switchMap((data: any) => {
    //     console.log(data);
    //     this.agentIds = data
    //       .filter((item: any) => item.managerId === this.auth.managerId && item.agentName !== null)
    //       .map((item: any) => item.userId.toString());
    //
    //     // Return the agentIds as an observable
    //     return of(this.agentIds);
    //   })
    // ).subscribe((agentIds: string[]) => {
    //   // Now, agentIds is available here after the first service call is completed
    //   this.callService.getReviewData(agentIds).subscribe((data) => {
    //     this.reviewData = data;
    //     // console.log(this.reviewData);
    //   this.spinner.hide();
    //   });
    // });
  }

  constructor(private auth: AuthService,private sanitizer: DomSanitizer,public dialog: MatDialog,private callService: CallAnalyticsProxiesService,private spinner: NgxSpinnerService) {
  }
  reviewData: any = [];
  editedRemarkObject: any;
  agentIds : string[] = [];
  managerId: number = this.auth.managerId;
  @ViewChild(MatSort) sort: MatSort | undefined;
  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;
  // pagedReviewData: any = []; // Array for paged data
  // itemsPerPage: number = 10; // Number of items per page
  // currentPage: number = 1; // Current page number
  // pageSizeOptions: number[] = [5, 10, 20]; // Options for items per page

  // onPageChange(event: any) {
  //   this.currentPage = event.pageIndex + 1;
  //   this.updatePagedReviewData();
  // }

  // updatePagedReviewData() {
  //   const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  //   const endIndex = startIndex + this.itemsPerPage;
  //   this.pagedReviewData = this.reviewData.slice(startIndex, endIndex);
  // }
  getReviewDetails(){
    // this.spinner.show();
    // this.callService.getReviewData(this.agentIds).subscribe((data)=>{
    //   this.reviewData = data;
    //   // this.reviewData  = this.reviewData.filter((entry: any) => this.agentIds.includes(entry.agentId));
    //   console.log(this.reviewData);
    //   this.spinner.hide();
    // })




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
      this.callService.getReviewData(agentIds).subscribe((data:any) => {
        this.reviewData = data;
        this.filteredReviewData = data;
        this.filteredReviewData.sort((a : any, b: any) => {
          const dateA = new Date(a.dateTime);
          const dateB = new Date(b.dateTime);
          // @ts-ignore
          return dateB - dateA;
        });
        // console.log(this.reviewData);
        this.filteredReviewData = this.reviewData.filter((user:any) => {
          const userDate = new Date(user.dateTime);
          return userDate >= this.startDate && userDate <= this.endDate;
        });
        this.spinner.hide();
      });
    });
  }
  actionHelper(agentDetails: any){
    // this.editedRemarkObject = this.reviewData[agentIndex];
    console.log(agentDetails);

    this.openDialog(agentDetails);

  }
  searchValue: string = ''; // To store the search text
  filteredReviewData: any = []; // To store the filtered data

  applyFilter(searchValue: any) {
    this.searchValue = searchValue.target.value.trim(); // Remove whitespace

    this.filteredReviewData = this.reviewData.filter((user : any) => {
      const searchString = this.searchValue.toLowerCase();
      return (
        user.agentName.toLowerCase().includes(searchString) ||
        user.callCategory.toLowerCase().includes(searchString) ||
        user.customerProblem.toLowerCase().includes(searchString)||
         user.custSuppSentiment.toLowerCase().includes(searchString) ||
        user.callHoldPermission.toLowerCase().includes(searchString) ||
          user.transferPermission.toLowerCase().includes(searchString) ||
          user.keyScore == Number(searchString) ||
          user.agentId == Number(searchString)
      );
    });
  }
  startDate: Date = new Date();
  endDate: Date = new Date();
  // searchDate : any;
  // filterDataByDate(event: any): void {
  //   this.searchDate = event.target.value;
  //   // If the searchDate is not empty
  //   if (this.searchDate) {
  //     // Convert the input date string to a Date object
  //     const searchDateObj = new Date(this.searchDate);
  //
  //     // Filter the data based on the selected date
  //     this.filteredReviewData = this.filteredReviewData.filter((user: any) => {
  //       const userDate = new Date(user.dateTime);
  //
  //       // Check if the user's date matches the searchDate
  //       return userDate.toDateString() === searchDateObj.toDateString();
  //     });
  //   } else {
  //     // If searchDate is empty, show all data
  //     this.filteredReviewData = [...this.reviewData]; // Replace with your original data source
  //   }
  // }

  filterData() {
    // Convert startDate and endDate to Date objects
    // const startDateObj = new Date(this.startDate);
    // const endDateObj = new Date(this.endDate);

    // Filter the data based on the date range
    this.filteredReviewData = this.reviewData.filter((user:any) => {
      const userDate = new Date(user.dateTime);
      return userDate >= this.startDate && userDate <= this.endDate;
    });
  }

  openDialog(agentDetails: any): void {
    const dialogRef = this.dialog.open(ReviewDialog, {
      width: '600px',
      data: agentDetails,
    });

    dialogRef.afterClosed().subscribe(result=>{
      if(result){
        console.log(result);
        setTimeout(()=>{

          this.getReviewDetails();
        },2000)
      }
    })
  };
  url: any;


  openAudioDialog(callId: string): void {
    this.spinner.show();
    this.callService.getAudioURL(callId).subscribe((base64:string) => {
      const dialogRef = this.dialog.open(AudioDialog, {
        width: '400px',
        data: `data:audio/mpeg;base64,${base64}`,
      });
      this.spinner.hide();
    });
  };

}


@Component({
  selector: 'dialog-review',
  templateUrl: 'dialog-review.html',
  styleUrls: ['dialog-review.scss']
})
export class ReviewDialog {

  constructor(
    public dialogRef: MatDialogRef<ReviewDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private callService: CallAnalyticsProxiesService
  ) {}

  enableTraining: boolean = false;
  // editedRemark: string = this.data?.remark ? this.data.remark : 'Please enter your remarks.';

  chipList = [
    { label: 'Assign Training Program', value: 1 },
    { label: 'No Action', value: 2 },
  ];
  colors: ChipColor[] = [
    {name: 'Primary', color: 'primary'},
    {name: 'Accent', color: 'accent'},
  ];

  trainingProgram: string = '';
  trainingStartDate: any ;
  trainingEndDate: any;
  // trainingFlag : string = '';

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
  chipSelected(chip: any){
    this.enableTraining = chip.value == 1;
  }
  resetForm(){
    // this.editedRemark = 'Please enter your remarks.';
  }
  callerId: string = this.data.callId;
  onSubmit(): void {
    // const agentData = {
    //   "callId": this.data.callId,
    //   "callHoldPermission": this.data.callHoldPermission,
    //   "transferPermission": this.data.transferPermission,
    //   "customerProblem": this.data.customerProblem,
    //   "custSuppSentiment": this.data.custSuppSentiment,
    //   "summary": this.data.summary,
    //   "agentId": this.data.agentId,
    //   "callCategory": this.data.callCategory,
    //   "dateTime": this.data.dateTime,
    //   "remark": this.editedRemark
    // }
    // this.callService.addRemarks(agentData).subscribe((response)=>{
    //   console.log(response);
    // });

    // this.dialogRef.close("Remarks Added");


    const agentData = {
      "agentId": this.data.agentId,
      "agentName": this.data.agentName,
      "managerId": this.data.managerId,
      "managerName": this.data.managerName,
      "trainingStartDate": this.trainingStartDate,
      "trainingEndDate": this.trainingEndDate,
      "trainingCourse": this.trainingProgram,
      "lastLoggedIn": new Date()
    };
    // this.callService.tagTrainingCourse(agentData).subscribe((response)=>{
    //   console.log(response);
    // });
    this.callService.tagTrainingCourse(agentData).pipe(
      switchMap(()=>{
        return this.callService.deleteCallers(this.callerId);
      })
    ).subscribe((response)=>{
      console.log(response);
    })

    this.dialogRef.close("Training Details added");
  }

}

@Component({
  selector: 'dialog-audio',
  templateUrl: 'dialog-audio.html',
  styleUrls: ['dialog-audio.scss']
})
export class AudioDialog{
  constructor(
    public dialogRef: MatDialogRef<AudioDialog>,
    @Inject(MAT_DIALOG_DATA) public data: string,

  ) {}
  base64Data: string = this.data;

  dialogClose(){
    this.dialogRef.close(true);
  }
}
