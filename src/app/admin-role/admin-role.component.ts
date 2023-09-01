import {AfterViewInit, Component, OnInit} from '@angular/core';
import {AlertDialogWindowComponent} from "../alert-dialog-window/alert-dialog-window.component";
import {MatDialog} from "@angular/material/dialog";
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {NgxSpinnerService} from "ngx-spinner";
import {animate, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'app-admin-role',
  templateUrl: './admin-role.component.html',
  styleUrls: ['./admin-role.component.scss'],
  animations: [
    trigger('slide', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)' }),
        animate('500ms ease-in', style({ transform: 'translateY(0)' }))
      ])
    ])
  ],
})
export class AdminRoleComponent implements OnInit{

  constructor(private callService: CallAnalyticsProxiesService,private ngxSpinner: NgxSpinnerService) {
  }

  learnerList: any = [];

  ngOnInit(): void {
    this.ngxSpinner.show();
    // this.animateValues();
    this.callService.getLearners().subscribe((data: any)=>{
      this.learnerList = data;
      this.filteredLearnerData = data;
      this.ngxSpinner.hide();
    });
  }

  // animateValues() {
  //   this.animateValue("legacyCalls", 1, 74, 1000);
  //   this.animateValue("reportingProgress", 1, 71, 1000);
  //   this.animateValue("totalQueries", 1, 65, 1000);
  //   this.animateValue("queriesSolved", 1, 44, 1000);
  // }

  // animateValue(elementId: string, start: number, end: number, duration: number) {
  //   const obj = document.getElementById(elementId);
  //   if (!obj) {
  //     console.error(`Element with ID '${elementId}' not found.`);
  //     return;
  //   }
  //
  //   let startTimestamp: number | null = null;
  //
  //   const step = (timestamp: number) => {
  //     if (!startTimestamp)
  //       startTimestamp = timestamp;
  //
  //     const progress = Math.min((timestamp - startTimestamp) / duration, 1);
  //     obj.innerHTML = Math.floor(progress * (end - start) + start).toString();
  //
  //     if (progress < 1) {
  //       window.requestAnimationFrame(step);
  //     }
  //   };
  //
  //   window.requestAnimationFrame(step);
  // }

  $filterClicked: boolean = false;
  isFilterClicked(){
    this.$filterClicked = !this.$filterClicked;
  }

  searchValue: string = ''; // To store the search text
  filteredLearnerData: any = []; // To store the filtered data

  applyFilter(searchValue: any) {
    this.searchValue = searchValue.target.value.trim(); // Remove whitespace

    this.filteredLearnerData = this.learnerList.filter((user : any) => {
      const searchString = this.searchValue.toLowerCase();
      return (
        user.agentName.toLowerCase().includes(searchString) ||
        user.managerName.toLowerCase().includes(searchString)
      );
    });
  }
}
