import {Component, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, map, Observable, of, startWith, switchMap} from "rxjs";
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {AuthService} from "../HttpServices/auth.service";
import {FormControl} from "@angular/forms";
import {MatAutocompleteTrigger} from "@angular/material/autocomplete";
import {AudioDialog} from "../review/review.component";
import {NgxSpinnerService} from "ngx-spinner";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-agent-search',
  templateUrl: './agent-search.component.html',
  styleUrls: ['./agent-search.component.scss']
})
export class AgentSearchComponent implements OnInit {

  constructor(private callService: CallAnalyticsProxiesService, private auth: AuthService, private spinner: NgxSpinnerService, private dialog: MatDialog) {
  }

  agentIds: any;
  reviewData: any;
  filteredReviewData: any;
  dateFilterData: any;

  ngOnInit() {
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
}
