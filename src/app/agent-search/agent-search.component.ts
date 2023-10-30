import {Component, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, map, Observable, of, startWith, switchMap} from "rxjs";
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {AuthService} from "../HttpServices/auth.service";
import {FormControl} from "@angular/forms";
import {MatAutocompleteTrigger} from "@angular/material/autocomplete";
import {AudioDialog} from "../review/review.component";
import {NgxSpinnerService} from "ngx-spinner";
import {MatDialog} from "@angular/material/dialog";
import {FilterDataPipe} from "./filterPipe.pipe";
import {DateAdapter} from "@angular/material/core";

@Component({
  selector: 'app-agent-search',
  templateUrl: './agent-search.component.html',
  styleUrls: ['./agent-search.component.scss']
})
export class AgentSearchComponent implements OnInit {

  constructor(private filterData: FilterDataPipe,private callService: CallAnalyticsProxiesService, private auth: AuthService, private spinner: NgxSpinnerService, private dialog: MatDialog) {
  }

  agentIds: any;
  reviewData: any;
  filteredReviewData: any;
  dateFilterData: any;
  startDate: any;
  endDate: any;

  agentNameFilter: any = '';

  callCategoryFilter: any = '';

  custSuppSentimentFilter: any = '';

  // @ts-ignore
  dateTimeFilter: Date;

  // @ts-ignore
  dateTimeFilterEnd: Date;

  ngOnInit() {
    const sideBar: HTMLElement = document.querySelector('.sidebar') as HTMLElement;
    if (sideBar.classList.contains('close')) {
      console.log("SideNav is closed already.");
    } else {
      sideBar.classList.toggle('close');
    }

    document.body.classList.remove('dark');
    this.getReviewDetails();

  }

  getReviewDetails() {
    this.callService.fetchManagers().pipe(
      switchMap((data: any) => {
        console.log(data);
        this.agentIds = data
          .filter((item: any) => item.managerId === this.auth.managerId && item.agentName !== null)
          .map((item: any) => item.userId.toString());

        return of(this.agentIds);
      })
    ).subscribe((agentIds: string[]) => {
      this.callService.getReviewData(agentIds).subscribe((data: any) => {
        this.reviewData = data;
        this.filteredReviewData = data;
        this.filteredReviewData.sort((a: any, b: any) => {
          const dateA = new Date(a.dateTime);
          const dateB = new Date(b.dateTime);
          // @ts-ignore
          return dateB - dateA;
        });

        this.dateFilterData = this.filteredReviewData;
      });
    });
  }
  $filterClicked: boolean = false;
  isFilterClicked(){
    this.$filterClicked = !this.$filterClicked;
  }

  searchValue: string = '';
  showAgents(searchValue: any) {
    this.searchValue = searchValue.target.value.trim();
    // @ts-ignore
    // this.dataSource.filter = this.searchValue.toLowerCase();
    this.filteredReviewData = this.reviewData.filter((user : any) => {
      const searchString = this.searchValue.toLowerCase();
      return (
        user.agentName.toLowerCase().includes(searchString)
      );
    });
  }

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



  applyFilters(){
    if(this.agentNameFilter && !this.callCategoryFilter && !this.custSuppSentimentFilter ){
      this.filteredReviewData = this.dateFilterData.filter((user : any)=>
        user.agentName.toLowerCase().includes(this.agentNameFilter?.toLowerCase())
      );
    }else if(this.agentNameFilter && this.callCategoryFilter && !this.custSuppSentimentFilter ){
      this.filteredReviewData = this.dateFilterData.filter((user : any)=>
        user.callCategory.toLowerCase().includes(this.callCategoryFilter?.toLowerCase()) &&
        user.agentName.toLowerCase().includes(this.agentNameFilter.toLowerCase())
      );
    }else if(this.agentNameFilter && !this.callCategoryFilter && this.custSuppSentimentFilter ){
      this.filteredReviewData = this.dateFilterData.filter((user : any)=>
        user.agentName.toLowerCase().includes(this.agentNameFilter?.toLowerCase()) &&
        user.custSuppSentiment.toLowerCase().includes(this.custSuppSentimentFilter.toLowerCase())
      );
    }else if(this.agentNameFilter && !this.callCategoryFilter && !this.custSuppSentimentFilter ){
      this.filteredReviewData = this.dateFilterData.filter((user : any)=>
        user.agentName.toLowerCase().includes(this.agentNameFilter?.toLowerCase())
        // user.dateTime >= this.dateTimeFilter.getDate() && user.dateTime <= this.dateTimeFilterEnd.getDate()
      );
    }else{
      this.filteredReviewData = this.dateFilterData.filter((user : any)=>
        user.agentName.toLowerCase().includes(this.agentNameFilter?.toLowerCase()) &&
        user.callCategory.toLowerCase().includes(this.callCategoryFilter.toLowerCase()) &&
        user.custSuppSentiment.toLowerCase().includes(this.custSuppSentimentFilter.toLowerCase())
        // user.dateTime >= this.dateTimeFilter.getDate() && user.dateTime <= this.dateTimeFilterEnd.getDate()
      );
    }
    // this.filteredMainData = this.inspectionData.filter((user : any)=>{
    //   return (
    //     user.loanNumber.includes(this.loanNumber?.toLowerCase()) ||
    //     user.entity.toLowerCase().includes(this.entity?.toLowerCase()) ||
    //     user.fileClass.toLowerCase().includes(this.docType?.trim().toLowerCase()) ||
    //     user.processingDate.includes(this.processingDate)
    //   );
    // });

  }

  filterDate() {
    // Filter the data based on the date range
    this.filteredReviewData = this.dateFilterData.filter((user:any) => {
      const userDate = new Date(user.dateTime);
      return userDate >= this.startDate && userDate <= this.endDate;
    });
  }
}
