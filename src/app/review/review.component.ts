import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Inject,
  OnChanges,
  OnInit, Pipe, PipeTransform,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {NgxSpinnerService} from "ngx-spinner";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";
import {AuthService} from "../HttpServices/auth.service";
import {Observable, of, Subject, switchMap} from "rxjs";
import {ChipColor, UserRole} from "../create-roles/create-roles.component";
import * as moment from "moment/moment";
import {MatTableDataSource} from "@angular/material/table";
import {MatSort} from "@angular/material/sort";
import {MatPaginator} from "@angular/material/paginator";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {MatDatepickerInputEvent} from "@angular/material/datepicker";
import {MatSnackBar} from "@angular/material/snack-bar";


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
    this.$dateFilterClicked = false;
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

    const sideBar: HTMLElement = document.querySelector('.sidebar') as HTMLElement;
    if (sideBar.classList.contains('close')) {
      console.log("SideNav is closed already.");
    } else {
      sideBar.classList.toggle('close');
    }
    this.getReviewDetails();
    document.body.classList.remove('dark');
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

  constructor(private snackBar: MatSnackBar,private auth: AuthService,private sanitizer: DomSanitizer,public dialog: MatDialog,private callService: CallAnalyticsProxiesService,private spinner: NgxSpinnerService) {
  }
  reviewData: any = [];
  // editedRemarkObject: any;
  agentIds : string[] = [];
  managerId: number = this.auth.managerId;
  @ViewChild(MatSort) sort: MatSort | undefined;
  // @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  // dataSource: MatTableDataSource<any> | undefined;
  // @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator | undefined;
  // dataObs$: Observable<any> | undefined;

  // setPagination(tableData : any) {
  //   this.dataSource = new MatTableDataSource<any>(tableData);
  //   this._changeDetectorRef.detectChanges();
  //   // @ts-ignore
  //   this.dataSource.paginator = this.paginator;
  //   this.dataObs$ = this.dataSource.connect();
  // }

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

        this.dateFilterData = this.filteredReviewData;
        this.spinner.hide();
      });
    });
  }

  dateFilterData: any;
  actionHelper(agentDetails: any){
    console.log(agentDetails);

    this.openDialog(agentDetails);

  }
  searchValue: string = ''; // To store the search text
  filteredReviewData: any = []; // To store the filtered data

  applyFilter(searchValue: any) {
    this.searchValue = searchValue.target.value.trim(); // Remove whitespace
    this.startDate = null;
    this.endDate = null;
    // @ts-ignore
    // this.dataSource.filter = this.searchValue.toLowerCase();
    this.filteredReviewData = this.reviewData.filter((user : any) => {
      const searchString = this.searchValue.toLowerCase();
      return (
        user.agentName.toLowerCase().includes(searchString) ||
        user.callCategory.toLowerCase().includes(searchString) ||
        user.customerProblem.toLowerCase().includes(searchString)||
        user.custSuppSentiment.toLowerCase().includes(searchString) ||
        // user.callHoldPermission.toLowerCase().includes(searchString) ||
        // user.transferPermission.toLowerCase().includes(searchString) ||
        user.keyScore == Number(searchString)
      );
    });
  }
  startDate: any;
  endDate: any;
  enableSearch: boolean = true;
  enableDateSearch: boolean = true;

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


  pageSize = 5;
  currentPage = 0;
  pageSizeOptions: number[] = [5, 10, 20, 50, 100];

  get pagedData() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredReviewData?.slice(startIndex, endIndex);
  }

  onPageChange(event: any) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  isDateFilterClicked(){
    this.$dateFilterClicked = !this.$dateFilterClicked;
    this.$filterClicked = false;
  }



  $dateFilterClicked = false;
  filterData() {
    // Filter the data based on the date range
    this.filteredReviewData = this.dateFilterData.filter((user:any) => {
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
  ) {
    this.minDateToFinish.subscribe(r => {
      this.minDate = new Date(r);
    })
  }

  enableTraining: boolean = false;
  // editedRemark: string = this.data?.remark ? this.data.remark : 'Please enter your remarks.';

  chipList = [
    { label: 'Assign Training Program', value: 1 },
    { label: 'No Action', value: 2 },
  ];
  colors: ChipColor[] = [
    {name: 'Accent', color: 'accent'},
    {name: 'Warn', color: 'warn'},
  ];
  noAction: boolean = false;
  trainingProgram: string = '';
  trainingStartDate: any ;
  trainingEndDate: any;
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
    if(chip.value == 1){
      this.enableTraining = true;
      this.noAction = false;
    }else{
      this.enableTraining = false;
      this.noAction = true;
    }
  }

  minFromDate: any;
  maxFromDate: any ;
  minToDate: any;
  maxToDate: any;
  startDate: any;
  stopDate: any;

  resetForm(){
    this.trainingProgram = '';
    this.trainingStartDate = null;
    this.trainingEndDate = null;
  }
  minDateToFinish = new Subject<string>();
  minDate: any;

  dateChange(event: any) {
    this.minDateToFinish.next(event.value.toString());
    this.startDate = new Date(event.value.toString());
    console.log(this.startDate);
  }

  dateSet(event: any){
    this.stopDate = new Date(event.value.toString());
    console.log(this.stopDate);
  }
  callerId: string = this.data.callId;
  onSubmit(): void {
    if (this.enableTraining) {
      const agentData = {
        "agentId": this.data.agentId,
        "agentName": this.data.agentName,
        "managerId": this.data.managerId,
        "managerName": this.data.managerName,
        "trainingStartDate": this.startDate,
        "trainingEndDate": this.stopDate,
        "trainingCourse": this.trainingProgram,
        "lastLoggedIn": new Date()
      };

        this.callService.tagTrainingCourse(agentData).pipe(
          switchMap(() => {
            return this.callService.deleteCallers(this.callerId);
          })
        ).subscribe((response) => {
          console.log(response);
        });
      // else {
      //   this.callService.deleteCallers(this.callerId).subscribe((response: any) => {
      //     console.log(response);
      //   })
      // }
      this.dialogRef.close("Training Details added");
    }else{
      this.callService.deleteCallers(this.callerId).subscribe((response: any)=>{
        console.log(response);
      });
      this.dialogRef.close(true);
    }
  }

  onClose(){
    this.dialogRef.close();
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
