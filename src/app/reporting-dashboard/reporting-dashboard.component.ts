import {
  Component,
  ElementRef,
  OnInit, signal,
  ViewChild
} from '@angular/core';
import * as d3 from "d3";
import {AuthService} from "../HttpServices/auth.service";
import {DomSanitizer} from "@angular/platform-browser";
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import {NgxSpinnerService} from "ngx-spinner";
import {of, switchMap} from "rxjs";
import mockData from "./mockData.json";
import {RoleBasedService} from "../HttpServices/role-based.service";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {CrossSellDialogComponent} from "../cross-sell-dialog/cross-sell-dialog.component";
import {
  AgentCommentsDialogComponentComponent
} from "../agent-comments-dialog-component/agent-comments-dialog-component.component";

interface CallCategory{
  callCategory: string,
  frequency: number,

}

interface Sentiment {
  sentimentType: string;
  selected: boolean;
}

interface Category {
  categoryDomain: string;
  selected: boolean;
}

interface AgentNames {
  agentName: string;
  selected: boolean;
}
@Component({
  selector: 'app-reporting-dashboard',
  templateUrl: './reporting-dashboard.component.html',
  styleUrls: ['./reporting-dashboard.component.scss']
})
export class ReportingDashboardComponent implements OnInit {

  constructor(private fb: FormBuilder,private elementRef: ElementRef,private elRef: ElementRef,private spinner: NgxSpinnerService,private authService: AuthService, private defaultAnalyticsService: CallAnalyticsProxiesService, private safeURL: DomSanitizer,public matDialog: MatDialog) {
    this.form = this.fb.group({
      start: [null],
      end: [null]
    });

    this.adminId = this.authService.roleType == 'Admin' ? this.authService.adminId : 0;

  }
  meanKeyScore: number[] = [];
  customerSentiment: CallCategory[] = [];
  avgCallDuration: number = 0;
  maxCallDuration: number = 0;
  smallCallDuration: number = 1000000000;


  // @ts-ignore
  form: FormGroup ;
  filteredCalls:any[] = [];
  totalCalls : number = 0;

  openCrossSellingTableDialog(remarks: any){
    this.matDialog.open(CrossSellDialogComponent,{
      width: 'auto',
      height: 'auto',
      data: remarks
    });
  }

  filterByDate(){
    // @ts-ignore
    this.mainData = this.mainData.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    const { start, end } = this.form.value;
    this.totalCalls = 0;

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      this.filteredCalls = this.mainData.filter((call: any) => {
        const callDate = new Date(call.dateTime);
        return callDate >= startDate && callDate <= endDate;
      });

      if (this.filteredCalls.length > 0) {
        this.data = [];
        this.resolutionStatus = [];
        this.resolutionStatusDataset = [];
        this.avgCallDuration = 0;
        this.avgCallsPerDay = 0;
        this.maxCallDuration = 0;
        this.smallCallDuration = 1000000000;
        this.totalCalls = this.filteredCalls.length;

        const callFrequencyMap = new Map<string, number>();
        this.filteredCalls.forEach(call => {
          if (callFrequencyMap.has(call.callCategory)) {
            callFrequencyMap.set(call.callCategory, callFrequencyMap.get(call.callCategory)! + 1);
          } else {
            callFrequencyMap.set(call.callCategory, 1);
          }
        });

        // Update this.data using the frequency map
        callFrequencyMap.forEach((frequency, callCategory) => {
          const index = this.data.findIndex(call => call.callCategory === callCategory);
          if (index !== -1) {
            this.data[index].frequency += frequency;
          } else {
            this.data.push({ callCategory, frequency });
          }
        });

        const resolutionStatusFrequencyMap = new Map<string, number>();

        // First, build a frequency map for call categories
        this.filteredCalls.forEach((call:any) => {
          const resolutionStatus = call.resolutionStatus;
          if (resolutionStatusFrequencyMap.has(resolutionStatus)) {
            resolutionStatusFrequencyMap.set(resolutionStatus, resolutionStatusFrequencyMap.get(resolutionStatus)! + 1);
          } else {
            resolutionStatusFrequencyMap.set(resolutionStatus, 1);
          }
        });

// Then, update this.data based on the frequency map
        resolutionStatusFrequencyMap.forEach((frequency, resolutionStatus) => {
          const index = this.resolutionStatus.findIndex((call:any) => call.resolutionStatus === resolutionStatus);
          if (index !== -1) {
            this.resolutionStatus[index].frequency += frequency;
          } else {
            this.resolutionStatus.push({ resolutionStatus, frequency });
          }
        });


        this.beginDate = this.filteredCalls[0].dateTime;
        this.endDate = this.filteredCalls[this.filteredCalls.length - 1].dateTime;
        const beginDate = new Date(this.filteredCalls[0].dateTime);
        const endDate = new Date(this.filteredCalls[this.filteredCalls.length - 1].dateTime);
        const normalizedBeginDate = new Date(Date.UTC(beginDate.getUTCFullYear(), beginDate.getUTCMonth(), beginDate.getUTCDate()));
        const normalizedEndDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

// Calculate the difference in milliseconds
        const differenceInTime = normalizedEndDate.getTime() - normalizedBeginDate.getTime();

// Convert milliseconds to days
        let differenceInDays = differenceInTime / (1000 * 3600 * 24);

// Handle cases where differenceInDays is 0 or negative (if beginDate is after endDate)
        if (differenceInDays <= 0) {
          differenceInDays = 1; // Ensure at least 1 day to avoid division by zero
        }

        // Calculate the average calls per day
        this.avgCallsPerDay = Math.ceil(this.totalCalls / differenceInDays);

        for(let maxDuration of this.filteredCalls){
          if(this.maxCallDuration < maxDuration.callDuration){
            this.maxCallDuration = maxDuration.callDuration;
          }
        }

        for(let minDuration of this.filteredCalls){
          if(this.smallCallDuration > minDuration.callDuration){
            this.smallCallDuration = minDuration.callDuration;
          }
        }


        for(let duration of this.filteredCalls){
          this.avgCallDuration += duration.callDuration;
        }

        this.durationSum = this.avgCallDuration;
        this.avgCallDuration = this.avgCallDuration/this.filteredCalls.length;
        this.avgCallDuration = Number((this.avgCallDuration/60).toFixed(1));
        this.maxCallDuration = Number((this.maxCallDuration/60).toFixed(1));
        this.smallCallDuration = Number((this.smallCallDuration/60).toFixed(1));

        this.customerSentiment = [];
        this.customerSatisfaction = [];
        this.meanKeyScore = [];
        this.dataset = [];
        this.datasetSentiment = [];
        this.datasetSatisfaction = [];


        const sentimentMap = new Map<string, number>();

        // Populate the map with sentiment frequencies
        this.filteredCalls.forEach(call => {
          const sentiment = call.custSuppSentiment;
          if (sentimentMap.has(sentiment)) {
            sentimentMap.set(sentiment, sentimentMap.get(sentiment)! + 1);
          } else {
            sentimentMap.set(sentiment, 1);
          }
        });

       // Update customerSentiment array using the map
        sentimentMap.forEach((frequency, sentiment) => {
          const index = this.customerSentiment.findIndex(call => call.callCategory === sentiment);
          if (index !== -1) {
            this.customerSentiment[index].frequency += frequency;
          } else {
            this.customerSentiment.push({ frequency, callCategory: sentiment });
          }
        });


        const satisfactionMap = new Map<string, number>();

        // Build the map with customer satisfaction frequencies
        this.filteredCalls.forEach(call => {
          const satisfaction = call.customerSatisfaction;
          if (satisfactionMap.has(satisfaction)) {
            satisfactionMap.set(satisfaction, satisfactionMap.get(satisfaction)! + 1);
          } else {
            satisfactionMap.set(satisfaction, 1);
          }
        });

        // Update customerSatisfaction array using the map
        satisfactionMap.forEach((frequency, satisfaction) => {
          const index = this.customerSatisfaction.findIndex(call => call.callCategory === satisfaction);
          if (index !== -1) {
            this.customerSatisfaction[index].frequency += frequency;
          } else {
            this.customerSatisfaction.push({ frequency, callCategory: satisfaction });
          }
        });


        let keyScore = 0;
        for (let data of this.filteredCalls) {
          keyScore += data.keyScore;
        }

        for (let category of this.data) {
          this.dataset.push({
            name: category.callCategory,
            percent: Math.ceil((category.frequency / this.filteredCalls.length) * 100)
          });
        }

        for (let callData of this.resolutionStatus) {
          this.resolutionStatusDataset.push({
            name: callData.resolutionStatus,
            percent: Math.ceil((callData.frequency / this.resolutionStatus.length) * 100)
          });
        }

        for (let sentiment of this.customerSentiment) {
          this.datasetSentiment.push({
            name: sentiment.callCategory,
            percent: Math.ceil((sentiment.frequency / this.filteredCalls.length) * 100)
          });
        }

        for (let satisfaction of this.customerSatisfaction) {
          this.datasetSatisfaction.push({
            name: satisfaction.callCategory,
            percent: Math.ceil((satisfaction.frequency / this.filteredCalls.length) * 100)
          });
        }

        this.meanKeyScore.push(Math.ceil(keyScore / this.filteredCalls.length));
        // });

        // setTimeout(()=>{

        this.createChart();
        this.createKeyScoreChart();
        this.createChart2();
        this.createChart3();
        this.createChart4();
        this.createMaxDurationChart();
        this.createMinDurationChart();
        this.createAvgDurationChart();
        this.createTotalCallsChart();
        this.createAvgCallsPerDayChart();
        this.createSvg();
        this.drawBars(this.data);
      } else {
        this.filteredCalls = this.mainData;
      }
    }
  }

  filterRecords: any[] = [];
  avgCallsPerDay: number = 0;

  filterBySentiment(){
      const selectedSentiments = this.sentiments
        .filter(sentiment => sentiment.selected)
        .map(sentiment => sentiment.sentimentType);

      this.filterRecords = this.mainData.filter((calls: any) =>
        selectedSentiments.includes(calls.custSuppSentiment)
      );

    // @ts-ignore
    this.filterRecords = this.filterRecords.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

      if(this.filterRecords.length > 0) {
        this.customerSentiment = [];
        this.customerSatisfaction = [];
        this.meanKeyScore = [];
        this.dataset = [];
        this.datasetSentiment = [];
        this.datasetSatisfaction = [];
        this.data = [];
        this.resolutionStatus = [];
        this.resolutionStatusDataset = [];
        this.avgCallDuration = 0;
        this.maxCallDuration = 0;
        this.avgCallsPerDay = 0;
        this.smallCallDuration = 1000000000;
        this.totalCalls = this.filterRecords.length;

        const callFrequencyMap = new Map<string, number>();
        this.filterRecords.forEach(call => {
          if (callFrequencyMap.has(call.callCategory)) {
            callFrequencyMap.set(call.callCategory, callFrequencyMap.get(call.callCategory)! + 1);
          } else {
            callFrequencyMap.set(call.callCategory, 1);
          }
        });

        // Update this.data using the frequency map
        callFrequencyMap.forEach((frequency, callCategory) => {
          const index = this.data.findIndex(call => call.callCategory === callCategory);
          if (index !== -1) {
            this.data[index].frequency += frequency;
          } else {
            this.data.push({ callCategory, frequency });
          }
        });

        const resolutionStatusFrequencyMap = new Map<string, number>();

        // First, build a frequency map for call categories
        this.filterRecords.forEach((call:any) => {
          const resolutionStatus = call.resolutionStatus;
          if (resolutionStatusFrequencyMap.has(resolutionStatus)) {
            resolutionStatusFrequencyMap.set(resolutionStatus, resolutionStatusFrequencyMap.get(resolutionStatus)! + 1);
          } else {
            resolutionStatusFrequencyMap.set(resolutionStatus, 1);
          }
        });

// Then, update this.data based on the frequency map
        resolutionStatusFrequencyMap.forEach((frequency, resolutionStatus) => {
          const index = this.resolutionStatus.findIndex((call:any) => call.resolutionStatus === resolutionStatus);
          if (index !== -1) {
            this.resolutionStatus[index].frequency += frequency;
          } else {
            this.resolutionStatus.push({ resolutionStatus, frequency });
          }
        });


        this.beginDate = this.filterRecords[0].dateTime;
        this.endDate = this.filterRecords[this.filterRecords.length - 1].dateTime;
        const beginDate = new Date(this.filterRecords[0].dateTime);
        const endDate = new Date(this.filterRecords[this.filterRecords.length - 1].dateTime);
        const normalizedBeginDate = new Date(Date.UTC(beginDate.getUTCFullYear(), beginDate.getUTCMonth(), beginDate.getUTCDate()));
        const normalizedEndDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

// Calculate the difference in milliseconds
        const differenceInTime = normalizedEndDate.getTime() - normalizedBeginDate.getTime();

// Convert milliseconds to days
        let differenceInDays = differenceInTime / (1000 * 3600 * 24);

// Handle cases where differenceInDays is 0 or negative (if beginDate is after endDate)
        if (differenceInDays <= 0) {
          differenceInDays = 1; // Ensure at least 1 day to avoid division by zero
        }

// Calculate the average calls per day
        this.avgCallsPerDay = Math.ceil(this.totalCalls / differenceInDays);

        for (let maxDuration of this.filterRecords) {
          if (this.maxCallDuration < maxDuration.callDuration) {
            this.maxCallDuration = maxDuration.callDuration;
          }
        }

        for (let minDuration of this.filterRecords) {
          if (this.smallCallDuration > minDuration.callDuration) {
            this.smallCallDuration = minDuration.callDuration;
          }
        }


        for (let duration of this.filterRecords) {
          this.avgCallDuration += duration.callDuration;
        }

        this.durationSum = this.avgCallDuration;
        this.avgCallDuration = this.avgCallDuration / this.filterRecords.length;
        this.avgCallDuration = Number((this.avgCallDuration / 60).toFixed(1));
        this.maxCallDuration = Number((this.maxCallDuration / 60).toFixed(1));
        this.smallCallDuration = Number((this.smallCallDuration / 60).toFixed(1));


        const sentimentMap = new Map<string, number>();

        // Populate the map with sentiment frequencies
        this.filterRecords.forEach(call => {
          const sentiment = call.custSuppSentiment;
          if (sentimentMap.has(sentiment)) {
            sentimentMap.set(sentiment, sentimentMap.get(sentiment)! + 1);
          } else {
            sentimentMap.set(sentiment, 1);
          }
        });

        // Update customerSentiment array using the map
        sentimentMap.forEach((frequency, sentiment) => {
          const index = this.customerSentiment.findIndex(call => call.callCategory === sentiment);
          if (index !== -1) {
            this.customerSentiment[index].frequency += frequency;
          } else {
            this.customerSentiment.push({ frequency, callCategory: sentiment });
          }
        });

        const satisfactionMap = new Map<string, number>();

        // Build the map with customer satisfaction frequencies
        this.filterRecords.forEach(call => {
          const satisfaction = call.customerSatisfaction;
          if (satisfactionMap.has(satisfaction)) {
            satisfactionMap.set(satisfaction, satisfactionMap.get(satisfaction)! + 1);
          } else {
            satisfactionMap.set(satisfaction, 1);
          }
        });

        // Update customerSatisfaction array using the map
        satisfactionMap.forEach((frequency, satisfaction) => {
          const index = this.customerSatisfaction.findIndex(call => call.callCategory === satisfaction);
          if (index !== -1) {
            this.customerSatisfaction[index].frequency += frequency;
          } else {
            this.customerSatisfaction.push({ frequency, callCategory: satisfaction });
          }
        });


        let keyScore = 0;
        for (let data of this.filterRecords) {
          keyScore += data.keyScore;
        }

        for (let category of this.data) {
          this.dataset.push({
            name: category.callCategory,
            percent: Math.ceil((category.frequency / this.filterRecords.length) * 100)
          });
        }

        for (let callData of this.resolutionStatus) {
          this.resolutionStatusDataset.push({
            name: callData.resolutionStatus,
            percent: Math.ceil((callData.frequency / this.filterRecords.length) * 100)
          });
        }

        for (let sentiment of this.customerSentiment) {
          this.datasetSentiment.push({
            name: sentiment.callCategory,
            percent: Math.ceil((sentiment.frequency / this.filterRecords.length) * 100)
          });
        }

        for (let satisfaction of this.customerSatisfaction) {
          this.datasetSatisfaction.push({
            name: satisfaction.callCategory,
            percent: Math.ceil((satisfaction.frequency / this.filterRecords.length) * 100)
          });
        }

        this.meanKeyScore.push(Math.ceil(keyScore / this.filterRecords.length));
        // });

        setTimeout(() => {
          this.createChart();
          this.createKeyScoreChart();
          this.createChart2();
          this.createChart3();
          this.createChart4();
          this.createMaxDurationChart();
          this.createMinDurationChart();
          this.createAvgDurationChart();
          this.createTotalCallsChart();
          this.createAvgCallsPerDayChart();
          this.createSvg();
          this.drawBars(this.data);
        }, 100);
      }
  }

  categories: Category[] = [];

  filterByCategory(){
    const selectedCategories = this.categories
      .filter(category => category.selected)
      .map(category => category.categoryDomain);


    this.filterRecords = this.mainData.filter((calls: any) =>
      selectedCategories.includes(calls.callCategory)
    );

    // @ts-ignore
    this.filterRecords = this.filterRecords.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    if(this.filterRecords.length > 0) {
      this.customerSentiment = [];
      this.customerSatisfaction = [];
      this.meanKeyScore = [];
      this.dataset = [];
      this.datasetSentiment = [];
      this.datasetSatisfaction = [];
      this.data = [];
      this.resolutionStatus = [];
      this.resolutionStatusDataset = [];
      this.avgCallsPerDay = 0;
      this.avgCallDuration = 0;
      this.maxCallDuration = 0;
      this.smallCallDuration = 1000000000;
      this.totalCalls = this.filterRecords.length;

      const callFrequencyMap = new Map<string, number>();
      this.filterRecords.forEach(call => {
        if (callFrequencyMap.has(call.callCategory)) {
          callFrequencyMap.set(call.callCategory, callFrequencyMap.get(call.callCategory)! + 1);
        } else {
          callFrequencyMap.set(call.callCategory, 1);
        }
      });

      // Update this.data using the frequency map
      callFrequencyMap.forEach((frequency, callCategory) => {
        const index = this.data.findIndex(call => call.callCategory === callCategory);
        if (index !== -1) {
          this.data[index].frequency += frequency;
        } else {
          this.data.push({ callCategory, frequency });
        }
      });

      const resolutionStatusFrequencyMap = new Map<string, number>();

      // First, build a frequency map for call categories
      this.filterRecords.forEach((call:any) => {
        const resolutionStatus = call.resolutionStatus;
        if (resolutionStatusFrequencyMap.has(resolutionStatus)) {
          resolutionStatusFrequencyMap.set(resolutionStatus, resolutionStatusFrequencyMap.get(resolutionStatus)! + 1);
        } else {
          resolutionStatusFrequencyMap.set(resolutionStatus, 1);
        }
      });

// Then, update this.data based on the frequency map
      resolutionStatusFrequencyMap.forEach((frequency, resolutionStatus) => {
        const index = this.resolutionStatus.findIndex((call:any) => call.resolutionStatus === resolutionStatus);
        if (index !== -1) {
          this.resolutionStatus[index].frequency += frequency;
        } else {
          this.resolutionStatus.push({ resolutionStatus, frequency });
        }
      });


      this.beginDate = this.filterRecords[0].dateTime;
      this.endDate = this.filterRecords[this.filterRecords.length - 1].dateTime;
      const beginDate = new Date(this.filterRecords[0].dateTime);
      const endDate = new Date(this.filterRecords[this.filterRecords.length - 1].dateTime);
      const normalizedBeginDate = new Date(Date.UTC(beginDate.getUTCFullYear(), beginDate.getUTCMonth(), beginDate.getUTCDate()));
      const normalizedEndDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

// Calculate the difference in milliseconds
      const differenceInTime = normalizedEndDate.getTime() - normalizedBeginDate.getTime();

// Convert milliseconds to days
      let differenceInDays = differenceInTime / (1000 * 3600 * 24);

// Handle cases where differenceInDays is 0 or negative (if beginDate is after endDate)
      if (differenceInDays <= 0) {
        differenceInDays = 1; // Ensure at least 1 day to avoid division by zero
      }

// Calculate the average calls per day
      this.avgCallsPerDay = Math.ceil(this.totalCalls / differenceInDays);




      for (let maxDuration of this.filterRecords) {
        if (this.maxCallDuration < maxDuration.callDuration) {
          this.maxCallDuration = maxDuration.callDuration;
        }
      }

      for (let minDuration of this.filterRecords) {
        if (this.smallCallDuration > minDuration.callDuration) {
          this.smallCallDuration = minDuration.callDuration;
        }
      }


      for (let duration of this.filterRecords) {
        this.avgCallDuration += duration.callDuration;
      }

      this.durationSum = this.avgCallDuration;
      this.avgCallDuration = this.avgCallDuration / this.filterRecords.length;
      this.avgCallDuration = Number((this.avgCallDuration / 60).toFixed(1));
      this.maxCallDuration = Number((this.maxCallDuration / 60).toFixed(1));
      this.smallCallDuration = Number((this.smallCallDuration / 60).toFixed(1));


      const sentimentMap = new Map<string, number>();

    // Populate the map with sentiment frequencies
      this.filterRecords.forEach(call => {
        const sentiment = call.custSuppSentiment;
        if (sentimentMap.has(sentiment)) {
          sentimentMap.set(sentiment, sentimentMap.get(sentiment)! + 1);
        } else {
          sentimentMap.set(sentiment, 1);
        }
      });

     // Update customerSentiment array using the map
      sentimentMap.forEach((frequency, sentiment) => {
        const index = this.customerSentiment.findIndex(call => call.callCategory === sentiment);
        if (index !== -1) {
          this.customerSentiment[index].frequency += frequency;
        } else {
          this.customerSentiment.push({ frequency, callCategory: sentiment });
        }
      });


      const satisfactionMap = new Map<string, number>();

      // Build the map with customer satisfaction frequencies
      this.filterRecords.forEach(call => {
        const satisfaction = call.customerSatisfaction;
        if (satisfactionMap.has(satisfaction)) {
          satisfactionMap.set(satisfaction, satisfactionMap.get(satisfaction)! + 1);
        } else {
          satisfactionMap.set(satisfaction, 1);
        }
      });

      // Update customerSatisfaction array using the map
      satisfactionMap.forEach((frequency, satisfaction) => {
        const index = this.customerSatisfaction.findIndex(call => call.callCategory === satisfaction);
        if (index !== -1) {
          this.customerSatisfaction[index].frequency += frequency;
        } else {
          this.customerSatisfaction.push({ frequency, callCategory: satisfaction });
        }
      });


      let keyScore = 0;
      for (let data of this.filterRecords) {
        keyScore += data.keyScore;
      }

      for (let category of this.data) {
        this.dataset.push({
          name: category.callCategory,
          percent: Math.ceil((category.frequency / this.filterRecords.length) * 100)
        });
      }

      for (let callData of this.resolutionStatus) {
        this.resolutionStatusDataset.push({
          name: callData.resolutionStatus,
          percent: Math.ceil((callData.frequency / this.filterRecords.length) * 100)
        });
      }

      for (let sentiment of this.customerSentiment) {
        this.datasetSentiment.push({
          name: sentiment.callCategory,
          percent: Math.ceil((sentiment.frequency / this.filterRecords.length) * 100)
        });
      }

      for (let satisfaction of this.customerSatisfaction) {
        this.datasetSatisfaction.push({
          name: satisfaction.callCategory,
          percent: Math.ceil((satisfaction.frequency / this.filterRecords.length) * 100)
        });
      }

      this.meanKeyScore.push(Math.ceil(keyScore / this.filterRecords.length));
      // });

      setTimeout(() => {
        this.createChart();
        this.createKeyScoreChart();
        this.createChart2();
        this.createChart3();
        this.createChart4();
        this.createMaxDurationChart();
        this.createMinDurationChart();
        this.createAvgDurationChart();
        this.createTotalCallsChart();
        this.createAvgCallsPerDayChart();
        this.createSvg();
        this.drawBars(this.data);
      }, 100);
    }
  }

  filterByAgent(){
    const selectedAgents = this.agentNames
      .filter(agents => agents.selected)
      .map(agents => agents.agentName);


    this.filterRecords = this.mainData.filter((calls: any) =>
      selectedAgents.includes(calls.agentName)
    );

    // @ts-ignore
    this.filterRecords = this.filterRecords.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    if(this.filterRecords.length > 0) {
      this.customerSentiment = [];
      this.customerSatisfaction = [];
      this.meanKeyScore = [];
      this.dataset = [];
      this.datasetSentiment = [];
      this.datasetSatisfaction = [];
      this.data = [];
      this.resolutionStatus = [];
      this.resolutionStatusDataset = [];
      this.avgCallsPerDay = 0;
      this.avgCallDuration = 0;
      this.maxCallDuration = 0;
      this.smallCallDuration = 1000000000;
      this.totalCalls = this.filterRecords.length;

      const callFrequencyMap = new Map<string, number>();
      this.filterRecords.forEach(call => {
        if (callFrequencyMap.has(call.callCategory)) {
          callFrequencyMap.set(call.callCategory, callFrequencyMap.get(call.callCategory)! + 1);
        } else {
          callFrequencyMap.set(call.callCategory, 1);
        }
      });

      // Update this.data using the frequency map
      callFrequencyMap.forEach((frequency, callCategory) => {
        const index = this.data.findIndex(call => call.callCategory === callCategory);
        if (index !== -1) {
          this.data[index].frequency += frequency;
        } else {
          this.data.push({ callCategory, frequency });
        }
      });


      const resolutionStatusFrequencyMap = new Map<string, number>();

      // First, build a frequency map for call categories
      this.filterRecords.forEach((call:any) => {
        const resolutionStatus = call.resolutionStatus;
        if (resolutionStatusFrequencyMap.has(resolutionStatus)) {
          resolutionStatusFrequencyMap.set(resolutionStatus, resolutionStatusFrequencyMap.get(resolutionStatus)! + 1);
        } else {
          resolutionStatusFrequencyMap.set(resolutionStatus, 1);
        }
      });

// Then, update this.data based on the frequency map
      resolutionStatusFrequencyMap.forEach((frequency, resolutionStatus) => {
        const index = this.resolutionStatus.findIndex((call:any) => call.resolutionStatus === resolutionStatus);
        if (index !== -1) {
          this.resolutionStatus[index].frequency += frequency;
        } else {
          this.resolutionStatus.push({ resolutionStatus, frequency });
        }
      });


      this.beginDate = this.filterRecords[0].dateTime;
      this.endDate = this.filterRecords[this.filterRecords.length - 1].dateTime;

      const beginDate = new Date(this.filterRecords[0].dateTime);
      const endDate = new Date(this.filterRecords[this.filterRecords.length - 1].dateTime);
      const normalizedBeginDate = new Date(Date.UTC(beginDate.getUTCFullYear(), beginDate.getUTCMonth(), beginDate.getUTCDate()));
      const normalizedEndDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

// Calculate the difference in milliseconds
      const differenceInTime = normalizedEndDate.getTime() - normalizedBeginDate.getTime();

// Convert milliseconds to days
      let differenceInDays = differenceInTime / (1000 * 3600 * 24);

// Handle cases where differenceInDays is 0 or negative (if beginDate is after endDate)
      if (differenceInDays <= 0) {
        differenceInDays = 1;
      }

// Calculate the average calls per day
      this.avgCallsPerDay = Math.ceil(this.totalCalls / differenceInDays);

      for (let maxDuration of this.filterRecords) {
        if (this.maxCallDuration < maxDuration.callDuration) {
          this.maxCallDuration = maxDuration.callDuration;
        }
      }

      for (let minDuration of this.filterRecords) {
        if (this.smallCallDuration > minDuration.callDuration) {
          this.smallCallDuration = minDuration.callDuration;
        }
      }


      for (let duration of this.filterRecords) {
        this.avgCallDuration += duration.callDuration;
      }

      this.durationSum = this.avgCallDuration;
      this.avgCallDuration = this.avgCallDuration / this.filterRecords.length;
      this.avgCallDuration = Number((this.avgCallDuration / 60).toFixed(1));
      this.maxCallDuration = Number((this.maxCallDuration / 60).toFixed(1));
      this.smallCallDuration = Number((this.smallCallDuration / 60).toFixed(1));



      const sentimentMap = new Map<string, number>();

      // Populate the map with sentiment frequencies
      this.filterRecords.forEach(call => {
        const sentiment = call.custSuppSentiment;
        if (sentimentMap.has(sentiment)) {
          sentimentMap.set(sentiment, sentimentMap.get(sentiment)! + 1);
        } else {
          sentimentMap.set(sentiment, 1);
        }
      });

      // Update customerSentiment array using the map
      sentimentMap.forEach((frequency, sentiment) => {
        const index = this.customerSentiment.findIndex(call => call.callCategory === sentiment);
        if (index !== -1) {
          this.customerSentiment[index].frequency += frequency;
        } else {
          this.customerSentiment.push({ frequency, callCategory: sentiment });
        }
      });

      const satisfactionMap = new Map<string, number>();

      // Build the map with customer satisfaction frequencies
      this.filterRecords.forEach(call => {
        const satisfaction = call.customerSatisfaction;
        if (satisfactionMap.has(satisfaction)) {
          satisfactionMap.set(satisfaction, satisfactionMap.get(satisfaction)! + 1);
        } else {
          satisfactionMap.set(satisfaction, 1);
        }
      });

      // Update customerSatisfaction array using the map
      satisfactionMap.forEach((frequency, satisfaction) => {
        const index = this.customerSatisfaction.findIndex(call => call.callCategory === satisfaction);
        if (index !== -1) {
          this.customerSatisfaction[index].frequency += frequency;
        } else {
          this.customerSatisfaction.push({ frequency, callCategory: satisfaction });
        }
      });


      let keyScore = 0;
      for (let data of this.filterRecords) {
        keyScore += data.keyScore;
      }

      for (let category of this.data) {
        this.dataset.push({
          name: category.callCategory,
          percent: Math.ceil((category.frequency / this.filterRecords.length) * 100)
        });
      }

      for (let callData of this.resolutionStatus) {
        this.resolutionStatusDataset.push({
          name: callData.resolutionStatus,
          percent: Math.ceil((callData.frequency / this.filterRecords.length) * 100)
        });
      }

      for (let sentiment of this.customerSentiment) {
        this.datasetSentiment.push({
          name: sentiment.callCategory,
          percent: Math.ceil((sentiment.frequency / this.filterRecords.length) * 100)
        });
      }

      for (let satisfaction of this.customerSatisfaction) {
        this.datasetSatisfaction.push({
          name: satisfaction.callCategory,
          percent: Math.ceil((satisfaction.frequency / this.filterRecords.length) * 100)
        });
      }

      this.meanKeyScore.push(Math.ceil(keyScore / this.filterRecords.length));
      // });

      setTimeout(() => {
        this.createChart();
        this.createKeyScoreChart();
        this.createChart2();
        this.createChart3();
        this.createChart4();
        this.createMaxDurationChart();
        this.createMinDurationChart();
        this.createAvgDurationChart();
        this.createTotalCallsChart();
        this.createAvgCallsPerDayChart();
        this.createSvg();
        this.drawBars(this.data);
      }, 100);
    }
  }


  beginDate: Date = new Date();
  endDate:Date = new Date();
  sortedDate: any = [];
  mainData: any = [];
  durationSum: number = 0;
  resolutionStatus: any = [];
  adminId: number = 0;

  uniqueCallCategories = [];
  selectedCategories: string[] = [];
  allSelectedDropdown: boolean = false;
  selectAllLabelDropdown: string = 'Select All';

  toggleSelectAllDropdown() {
    this.allSelectedDropdown = !this.allSelectedDropdown;
    if (this.allSelectedDropdown) {
      this.selectedCategories = this.uniqueCallCategories.slice();
      this.selectAllLabelDropdown = 'Deselect All';
    } else {
      this.selectedCategories = [];
      this.selectAllLabelDropdown = 'Select All';
    }
  }

  ngOnInit() {
    const sideBar: HTMLElement = document.querySelector('.sidebar') as HTMLElement;
    if (sideBar.classList.contains('close')) {
      console.log("SideNav is closed already.");
    } else {
      sideBar.classList.toggle('close');
    }

    // if(this.adminId > 0 || this.managerId > 0) {
      // @ts-ignore
      // const optionMenu = document.querySelector(".select-menu"),
      //   // @ts-ignore
      //   selectBtn = optionMenu.querySelector(".select-btn"),
      //   // @ts-ignore
      //   options = optionMenu.querySelectorAll(".option"),
      //   // @ts-ignore
      //   sBtn_text = optionMenu.querySelector(".sBtn-text");
      //
      // // @ts-ignore
      // if (optionMenu.classList.contains('active')) {
      //   // @ts-ignore
      //   optionMenu.classList.remove("active");
      // }
      //
      // // @ts-ignore
      // selectBtn.addEventListener("click", () =>
      //   // @ts-ignore
      //   optionMenu.classList.toggle("active")
      // );
      //
      // options.forEach((option) => {
      //   option.addEventListener("click", () => {
      //     // @ts-ignore
      //     let selectedOption = option.querySelector(".option-text").innerText;
      //     // @ts-ignore
      //     sBtn_text.innerText = selectedOption;
      //
      //     // @ts-ignore
      //     optionMenu.classList.remove("active");
      //   });
      // });
    // }





    // document.body.classList.add('dark');


    this.spinner.show();
      if (this.agentId > 0 && this.adminId == 0) {
        this.defaultAnalyticsService.fetchAgentStats(this.agentId.toString()).subscribe((response: any) => {
          this.mainData = response;
          this.totalCalls = response.length;
          const frequencyMap = new Map<string, number>();

          // First, build a frequency map for call categories
          response.forEach((call: any) => {
            const callCategory = call.callCategory;
            if (frequencyMap.has(callCategory)) {
              frequencyMap.set(callCategory, frequencyMap.get(callCategory)! + 1);
            } else {
              frequencyMap.set(callCategory, 1);
              this.categories.push({categoryDomain: callCategory, selected: true});
            }
          });

          // Then, update this.data based on the frequency map
          frequencyMap.forEach((frequency, callCategory) => {
            const index = this.data.findIndex(call => call.callCategory === callCategory);
            if (index !== -1) {
              this.data[index].frequency += frequency;
            } else {
              this.data.push({callCategory, frequency});
            }
          });

          const resolutionStatusFrequencyMap = new Map<string, number>();

          // First, build a frequency map for call categories
          response.forEach((call: any) => {
            const resolutionStatus = call.resolutionStatus;
            if (resolutionStatusFrequencyMap.has(resolutionStatus)) {
              resolutionStatusFrequencyMap.set(resolutionStatus, resolutionStatusFrequencyMap.get(resolutionStatus)! + 1);
            } else {
              resolutionStatusFrequencyMap.set(resolutionStatus, 1);
            }
          });

          // Then, update this.data based on the frequency map
          resolutionStatusFrequencyMap.forEach((frequency, resolutionStatus) => {
            const index = this.resolutionStatus.findIndex((call: any) => call.resolutionStatus === resolutionStatus);
            if (index !== -1) {
              this.resolutionStatus[index].frequency += frequency;
            } else {
              this.resolutionStatus.push({resolutionStatus, frequency});
            }
          });

          // @ts-ignore
          this.sortedDate = response.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

          this.beginDate = this.sortedDate[0]?.dateTime;
          this.endDate = this.sortedDate[this.sortedDate.length - 1]?.dateTime;

          const beginDate = new Date(this.sortedDate[0]?.dateTime);
          const endDate = new Date(this.sortedDate[this.sortedDate.length - 1]?.dateTime);
          const normalizedBeginDate = new Date(Date.UTC(beginDate.getUTCFullYear(), beginDate.getUTCMonth(), beginDate.getUTCDate()));
          const normalizedEndDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

       // Calculate the difference in milliseconds
          const differenceInTime = normalizedEndDate.getTime() - normalizedBeginDate.getTime();

       // Convert milliseconds to days
          let differenceInDays = differenceInTime / (1000 * 3600 * 24);

       // Handle cases where differenceInDays is 0 or negative (if beginDate is after endDate)
          if (differenceInDays <= 0) {
            differenceInDays = 1; // Ensure at least 1 day to avoid division by zero
          }

          // Calculate the average calls per day
          this.avgCallsPerDay = Math.ceil(this.totalCalls / differenceInDays);

          this.form.patchValue({
            start: new Date(this.beginDate),
            end: new Date(this.endDate)
          });

          for (let maxDuration of response) {
            if (this.maxCallDuration < maxDuration.callDuration) {
              this.maxCallDuration = maxDuration.callDuration;
            }
          }

          for (let minDuration of response) {
            if (this.smallCallDuration > minDuration.callDuration) {
              this.smallCallDuration = minDuration.callDuration;
            }
          }


          for (let duration of response) {
            this.avgCallDuration += duration.callDuration;
          }

          this.durationSum = this.avgCallDuration;
          this.avgCallDuration = this.avgCallDuration / response.length;
          this.avgCallDuration = Number((this.avgCallDuration / 60).toFixed(1));
          this.maxCallDuration = Number((this.maxCallDuration / 60).toFixed(1));
          this.smallCallDuration = Number((this.smallCallDuration / 60).toFixed(1));


          //sentiment
          const sentimentMap = new Map<string, number>();

          // Populate the sentimentMap with frequencies
          response.forEach((call: any) => {
            const sentiment = call.custSuppSentiment;
            if (sentimentMap.has(sentiment)) {
              sentimentMap.set(sentiment, sentimentMap.get(sentiment)! + 1);
            } else {
              sentimentMap.set(sentiment, 1);
            }
          });

          // Update the customerSentiment array using the sentimentMap
          sentimentMap.forEach((frequency, sentiment) => {
            const index = this.customerSentiment.findIndex(call => call.callCategory === sentiment);
            if (index !== -1) {
              this.customerSentiment[index].frequency += frequency;
            } else {
              this.customerSentiment.push({frequency, callCategory: sentiment});
            }
          });

          // Create a Set to track existing sentiment types
          const existingSentiments = new Set(this.sentiments.map(call => call.sentimentType));

          // Add new sentiment types from the response if they are not in the Set
          response.forEach((call: any) => {
            const sentimentType = call.custSuppSentiment;
            if (!existingSentiments.has(sentimentType)) {
              this.sentiments.push({sentimentType, selected: true});
              existingSentiments.add(sentimentType); // Update the Set with the new sentiment type
            }
          });


          const satisfactionMap = new Map<string, number>();

          // Populate the satisfactionMap with frequencies
          response.forEach((call: any) => {
            const satisfaction = call.customerSatisfaction;
            if (satisfactionMap.has(satisfaction)) {
              satisfactionMap.set(satisfaction, satisfactionMap.get(satisfaction)! + 1);
            } else {
              satisfactionMap.set(satisfaction, 1);
            }
          });

        // Update the customerSatisfaction array using the satisfactionMap
          satisfactionMap.forEach((frequency, satisfaction) => {
            const index = this.customerSatisfaction.findIndex(call => call.callCategory === satisfaction);
            if (index !== -1) {
              this.customerSatisfaction[index].frequency += frequency;
            } else {
              this.customerSatisfaction.push({frequency, callCategory: satisfaction});
            }
          });


          let keyScore = 0;
          for (let data of response) {
            console.log(data.keyScore);
            keyScore += data.keyScore;
          }


          for (let category of this.data) {
            this.dataset.push({
              name: category.callCategory,
              percent: Math.ceil((category.frequency / response.length) * 100)
            });
          }

          for (let callData of this.resolutionStatus) {
            this.resolutionStatusDataset.push({
              name: callData.resolutionStatus,
              percent: Math.ceil((callData.frequency / response.length) * 100)
            });
          }

          for (let sentiment of this.customerSentiment) {
            this.datasetSentiment.push({
              name: sentiment.callCategory,
              percent: Math.ceil((sentiment.frequency / response.length) * 100)
            });
          }

          for (let satisfaction of this.customerSatisfaction) {
            this.datasetSatisfaction.push({
              name: satisfaction.callCategory,
              percent: Math.ceil((satisfaction.frequency / response.length) * 100)
            });
          }
          this.meanKeyScore.push(Math.ceil(keyScore / response.length));
        });


        setTimeout(() => {
          // this.createSunburstChart();
          this.createChart();
          this.createKeyScoreChart();
          this.createMaxDurationChart();
          this.createMinDurationChart();
          this.createAvgDurationChart();
          this.createTotalCallsChart();
          this.createAvgCallsPerDayChart();
          this.createChart2();
          this.createChart3();
          this.createChart4();
          this.createSvg();
          this.drawBars(this.data);
          this.spinner.hide();
        }, 1000);
      }

      if (this.managerId > 0 && this.adminId == 0) {
        this.carInsuranceSalesData = [];
        this.creditCardFaqData = [];
        this.creditCardSalesData = [];
        this.homeLoansData = [];
        this.vehicleLoansData = [];
        this.bankingFaqData = [];
        this.lineData = [];
        this.formattedData = [];

        this.defaultAnalyticsService.fetchManagers().pipe(
          switchMap((data: any) => {
            this.agentIds = data
              .filter((item: any) => item.managerId === this.managerId && item.agentName !== null)
              .map((item: any) => item.userId.toString());

            return of(this.agentIds);
          })
        ).subscribe((agentIds: string[]) => {
          this.defaultAnalyticsService.getReviewData(agentIds).subscribe((response: any) => {
            // this.reviewData = data;
            this.mainData = response;
            this.mainData.sort((a: any, b: any) => {
              const dateA = new Date(a.dateTime);
              const dateB = new Date(b.dateTime);
              // @ts-ignore
              return dateB - dateA;
            });

          // @ts-ignore
            this.uniqueCallCategories = [...new Set(response.map((call: { callCategory: any; }) => call.callCategory))];

            // this.dateFilterData = this.filteredReviewData;
            const personalLoanFrequency: { [key: string]: number } = {};

            //@ts-ignore
            const parsedData = response.map(d => {
              const date = new Date(d.dateTime);
              return {
                callCategory: d.callCategory,
                month: date.toLocaleString('default', { month: 'short' }),
                year: date.getFullYear()
              };
            });

            // Group by callCategory and month-year
            // @ts-ignore
            const groupedData = d3.group(parsedData, d => d.callCategory, d => `${d.month}-${d.year}`);

            // Prepare data for visualization
            this.formattedData = Array.from(groupedData).map(([category, monthData]) => ({
              callCategory: category,
              months: Array.from(monthData).map(([monthYear, entries]) => ({
                monthYear,
                frequency: entries.length
              }))
            }));

            response.forEach((call: any) => {
              if (call.callCategory === "personal loan") {
                const date = new Date(call.dateTime).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
                if (!personalLoanFrequency[date]) {
                  personalLoanFrequency[date] = 0;
                }
                personalLoanFrequency[date]++;
              }
            });

            // Convert to array format for lineData
            this.lineData = [{
              // @ts-ignore
              values: Object.keys(personalLoanFrequency).map(date => ({
                date: date.replace(/-/g, "/"),
                total: personalLoanFrequency[date]
              }))
            }];

            console.log("FromManager: ",this.lineData);

            const creditCardSalesFrequency: { [key: string]: number } = {};

            response.forEach((call: any) => {
              if (call.callCategory === "credit card sales") {
                const date = new Date(call.dateTime).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
                if (!creditCardSalesFrequency[date]) {
                  creditCardSalesFrequency[date] = 0;
                }
                creditCardSalesFrequency[date]++;
              }
            });
            this.creditCardSalesData = [{
              // @ts-ignore
              values: Object.keys(creditCardSalesFrequency).map(date => ({
                date: date.replace(/-/g, "/"),
                total: creditCardSalesFrequency[date]
              }))
            }];

            const carInsuranceSalesFrequency: { [key: string]: number } = {};

            response.forEach((call: any) => {
              if (call.callCategory === "car insurance sales") {
                const date = new Date(call.dateTime).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
                if (!carInsuranceSalesFrequency[date]) {
                  carInsuranceSalesFrequency[date] = 0;
                }
                carInsuranceSalesFrequency[date]++;
              }
            });
            this.carInsuranceSalesData = [{
              // @ts-ignore
              values: Object.keys(carInsuranceSalesFrequency).map(date => ({
                date: date.replace(/-/g, "/"),
                total: carInsuranceSalesFrequency[date]
              }))
            }];

            const bankFaqFrequency: { [key: string]: number } = {};

            response.forEach((call: any) => {
              if (call.callCategory === "banking faq") {
                const date = new Date(call.dateTime).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
                if (!bankFaqFrequency[date]) {
                  bankFaqFrequency[date] = 0;
                }
                bankFaqFrequency[date]++;
              }
            });
            this.bankingFaqData = [{
              // @ts-ignore
              values: Object.keys(bankFaqFrequency).map(date => ({
                date: date.replace(/-/g, "/"),
                total: bankFaqFrequency[date]
              }))
            }];


            const homeLoanFrequency: { [key: string]: number } = {};

            response.forEach((call: any) => {
              if (call.callCategory === "home loan") {
                const date = new Date(call.dateTime).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
                if (!homeLoanFrequency[date]) {
                  homeLoanFrequency[date] = 0;
                }
                homeLoanFrequency[date]++;
              }
            });

            // Convert to array format for lineData

            this.homeLoansData = [{
              // @ts-ignore
              values: Object.keys(homeLoanFrequency).map(date => ({
                date: date.replace(/-/g, "/"),
                total: homeLoanFrequency[date]
              }))
            }];


            const vehicleLoanFrequency: { [key: string]: number } = {};

            response.forEach((call: any) => {
              if (call.callCategory === "vehicle loan") {
                const date = new Date(call.dateTime).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
                if (!vehicleLoanFrequency[date]) {
                  vehicleLoanFrequency[date] = 0;
                }
                vehicleLoanFrequency[date]++;
              }
            });

            // Convert to array format for lineData

            this.vehicleLoansData = [{
              // @ts-ignore
              values: Object.keys(vehicleLoanFrequency).map(date => ({
                date: date.replace(/-/g, "/"),
                total: vehicleLoanFrequency[date]
              }))
            }];


            const creditCardFaqFrequency: { [key: string]: number } = {};

            response.forEach((call: any) => {
              if (call.callCategory === "credit card faq") {
                const date = new Date(call.dateTime).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
                if (!creditCardFaqFrequency[date]) {
                  creditCardFaqFrequency[date] = 0;
                }
                creditCardFaqFrequency[date]++;
              }
            });

            // Convert to array format for lineData
            this.creditCardFaqData = [{
              // @ts-ignore
              values: Object.keys(creditCardFaqFrequency).map(date => ({
                date: date.replace(/-/g, "/"),
                total: creditCardFaqFrequency[date]
              }))
            }];



            this.totalCalls = response.length;
            for (let i = 0; i < response.length; i++) {
              const index = this.agentNames.findIndex((call: any) => call.agentName === response[i].agentName);
              if (index == -1) {
                this.agentNames.push({agentName: response[i].agentName, selected: true});
              }
            }

            const frequencyMap = new Map<string, number>();

            // First, build a frequency map for call categories
            response.forEach((call: any) => {
              const callCategory = call.callCategory;
              if (frequencyMap.has(callCategory)) {
                frequencyMap.set(callCategory, frequencyMap.get(callCategory)! + 1);
              } else {
                frequencyMap.set(callCategory, 1);
                this.categories.push({categoryDomain: callCategory, selected: true});
              }
            });

          // Then, update this.data based on the frequency map
            frequencyMap.forEach((frequency, callCategory) => {
              const index = this.data.findIndex(call => call.callCategory === callCategory);
              if (index !== -1) {
                this.data[index].frequency += frequency;
              } else {
                this.data.push({callCategory, frequency});
              }
            });

            const resolutionStatusFrequencyMap = new Map<string, number>();

            // First, build a frequency map for call categories
            response.forEach((call: any) => {
              const resolutionStatus = call.resolutionStatus;
              if (resolutionStatusFrequencyMap.has(resolutionStatus)) {
                resolutionStatusFrequencyMap.set(resolutionStatus, resolutionStatusFrequencyMap.get(resolutionStatus)! + 1);
              } else {
                resolutionStatusFrequencyMap.set(resolutionStatus, 1);
              }
            });

            // Then, update this.data based on the frequency map
            resolutionStatusFrequencyMap.forEach((frequency, resolutionStatus) => {
              const index = this.resolutionStatus.findIndex((call: any) => call.resolutionStatus === resolutionStatus);
              if (index !== -1) {
                this.resolutionStatus[index].frequency += frequency;
              } else {
                this.resolutionStatus.push({resolutionStatus, frequency});
              }
            });


            // @ts-ignore
            this.sortedDate = response.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

            this.beginDate = this.sortedDate[0]?.dateTime;
            this.endDate = this.sortedDate[this.sortedDate.length - 1]?.dateTime;

            const beginDate = new Date(this.sortedDate[0]?.dateTime);
            const endDate = new Date(this.sortedDate[this.sortedDate.length - 1]?.dateTime);
            const normalizedBeginDate = new Date(Date.UTC(beginDate.getUTCFullYear(), beginDate.getUTCMonth(), beginDate.getUTCDate()));
            const normalizedEndDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

            // Calculate the difference in milliseconds
            const differenceInTime = normalizedEndDate.getTime() - normalizedBeginDate.getTime();

           // Convert milliseconds to days
            let differenceInDays = differenceInTime / (1000 * 3600 * 24);

           // Handle cases where differenceInDays is 0 or negative (if beginDate is after endDate)
            if (differenceInDays <= 0) {
              differenceInDays = 1; // Ensure at least 1 day to avoid division by zero
            }

          // Calculate the average calls per day
            this.avgCallsPerDay = Math.ceil(this.totalCalls / differenceInDays);

            this.form.patchValue({
              start: new Date(this.beginDate),
              end: new Date(this.endDate)
            });

            for (let maxDuration of response) {
              if (this.maxCallDuration < maxDuration.callDuration) {
                this.maxCallDuration = maxDuration.callDuration;
              }
            }

            for (let minDuration of response) {
              if (this.smallCallDuration > minDuration.callDuration) {
                this.smallCallDuration = minDuration.callDuration;
              }
            }

            this.avgCallDuration = 0;
            for (let duration of response) {
              this.avgCallDuration += duration.callDuration;
            }

            this.durationSum = this.avgCallDuration;
            this.avgCallDuration = this.durationSum / this.totalCalls;
            this.avgCallDuration = Number((this.avgCallDuration / 60).toFixed(1));
            this.maxCallDuration = Number((this.maxCallDuration / 60).toFixed(1));
            this.smallCallDuration = Number((this.smallCallDuration / 60).toFixed(1));


            //sentiment
            const sentimentMap = new Map<string, number>();

            // Populate the sentimentMap with frequencies
            response.forEach((call: any) => {
              const sentiment = call.custSuppSentiment;
              if (sentimentMap.has(sentiment)) {
                sentimentMap.set(sentiment, sentimentMap.get(sentiment)! + 1);
              } else {
                sentimentMap.set(sentiment, 1);
              }
            });

            // Update the customerSentiment array using the sentimentMap
            sentimentMap.forEach((frequency, sentiment) => {
              const index = this.customerSentiment.findIndex(call => call.callCategory === sentiment);
              if (index !== -1) {
                this.customerSentiment[index].frequency += frequency;
              } else {
                this.customerSentiment.push({frequency, callCategory: sentiment});
              }
            });

            // Create a Set to track existing sentiment types
            const existingSentiments = new Set(this.sentiments.map(call => call.sentimentType));

            // Add new sentiment types from the response if they are not in the Set
            response.forEach((call: any) => {
              const sentimentType = call.custSuppSentiment;
              if (!existingSentiments.has(sentimentType)) {
                this.sentiments.push({sentimentType, selected: true});
                existingSentiments.add(sentimentType); // Update the Set with the new sentiment type
              }
            });

            const satisfactionMap = new Map<string, number>();

            // Populate the satisfactionMap with frequencies
            response.forEach((call: any) => {
              const satisfaction = call.customerSatisfaction;
              if (satisfactionMap.has(satisfaction)) {
                satisfactionMap.set(satisfaction, satisfactionMap.get(satisfaction)! + 1);
              } else {
                satisfactionMap.set(satisfaction, 1);
              }
            });

            // Update the customerSatisfaction array using the satisfactionMap
            satisfactionMap.forEach((frequency, satisfaction) => {
              const index = this.customerSatisfaction.findIndex(call => call.callCategory === satisfaction);
              if (index !== -1) {
                this.customerSatisfaction[index].frequency += frequency;
              } else {
                this.customerSatisfaction.push({frequency, callCategory: satisfaction});
              }
            });


            let keyScore = 0;
            for (let data of response) {
              keyScore += data.keyScore;
            }

            for (let category of this.data) {
              this.dataset.push({
                name: category.callCategory,
                percent: Math.ceil((category.frequency / response.length) * 100)
              });
            }

            for (let callData of this.resolutionStatus) {
              this.resolutionStatusDataset.push({
                name: callData.resolutionStatus,
                percent: Math.ceil((callData.frequency / response.length) * 100)
              });
            }

            for (let sentiment of this.customerSentiment) {
              this.datasetSentiment.push({
                name: sentiment.callCategory,
                percent: Math.ceil((sentiment.frequency / response.length) * 100)
              });
            }

            for (let satisfaction of this.customerSatisfaction) {
              this.datasetSatisfaction.push({
                name: satisfaction.callCategory,
                percent: Math.ceil((satisfaction.frequency / response.length) * 100)
              });
            }
              const meanValue: number = Math.ceil(keyScore / this.totalCalls);
              this.meanKeyScore = [];
              this.meanKeyScore.push(meanValue);
          });
        });

        setTimeout(() => {
          // this.getCreditCardSalesTrend();
          // this.getCarInsuranceSalesTrend();
          // this.getBankingFaqTrend();
          // this.getPersonalLoansTrend();
          // this.getHomeLoansTrend();
          // this.getVehicleLoansTrend();
          // this.getCreditCardFaqTrend();
          this.createChart();
          this.createKeyScoreChart();
          this.createMaxDurationChart();
          this.createMinDurationChart();
          this.createAvgDurationChart();
          this.createTotalCallsChart();
          this.createChart2();
          this.createChart3();
          this.createChart4();
          this.createSvg();
          this.drawBars(this.data);
          // this.createGroupedColumnChart();
          this.spinner.hide();
        }, 1000);
      }

      if(this.adminId > 0){
        this.getCrossSellingData();
        this.defaultAnalyticsService.getAgentPerformanceComments().pipe(
          switchMap((performanceData: any) => {
            this.agentPerformanceComments.push(performanceData);
            return this.defaultAnalyticsService.getCategoryCommonProblems();
          }),
          switchMap((categoryProblems: any) => {
            this.categoryCommonProblems.push(categoryProblems);
            return this.defaultAnalyticsService.fetchStats();
          })
        ).subscribe((response: any) => {
          const groupedData = response.reduce((acc: any, cur: any) => {
            const date = cur.dateTime.split("T")[0];
            const category = cur.callCategory;

            if (!acc[date]) {
              acc[date] = {};
            }

            if (!acc[date][category]) {
              acc[date][category] = 0;
            }

            acc[date][category] += 1;
            return acc;
          }, {});

          Object.keys(groupedData).forEach(date => {
            Object.keys(groupedData[date]).forEach(category => {
              this.raceData.push({
                date,
                category,
                frequency: groupedData[date][category]
              });
            });
          });

          // Sort the data by date for the bar chart race
          // @ts-ignore
          this.raceData.sort((a, b) => new Date(a.date) - new Date(b.date));
          console.log("CategoryProblems: ",this.categoryCommonProblems);

          // this.dateFilterData = this.filteredReviewData;
          const personalLoanFrequency: { [key: string]: number } = {};

          response.forEach((call: any) => {
            if (call.callCategory === "personal loan") {
              const date = new Date(call.dateTime).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
              if (!personalLoanFrequency[date]) {
                personalLoanFrequency[date] = 0;
              }
              personalLoanFrequency[date]++;
            }
          });

          this.lineData = [{
            // @ts-ignore
            values: Object.keys(personalLoanFrequency).map(date => ({
              date: date.replace(/-/g, "/"),
              total: personalLoanFrequency[date]
            }))
          }];

          const creditCardSalesFrequency: { [key: string]: number } = {};
          response.forEach((call: any) => {
            if (call.callCategory === "credit card sales") {
              const date = new Date(call.dateTime).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
              if (!creditCardSalesFrequency[date]) {
                creditCardSalesFrequency[date] = 0;
              }
              creditCardSalesFrequency[date]++;
            }
          });
          this.creditCardSalesData = [{
            // @ts-ignore
            values: Object.keys(creditCardSalesFrequency).map(date => ({
              date: date.replace(/-/g, "/"),
              total: creditCardSalesFrequency[date]
            }))
          }];

          const carInsuranceSalesFrequency: { [key: string]: number } = {};
          response.forEach((call: any) => {
            if (call.callCategory === "car insurance sales") {
              const date = new Date(call.dateTime).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
              if (!carInsuranceSalesFrequency[date]) {
                carInsuranceSalesFrequency[date] = 0;
              }
              carInsuranceSalesFrequency[date]++;
            }
          });
          this.carInsuranceSalesData = [{
            // @ts-ignore
            values: Object.keys(carInsuranceSalesFrequency).map(date => ({
              date: date.replace(/-/g, "/"),
              total: carInsuranceSalesFrequency[date]
            }))
          }];

          const bankFaqFrequency: { [key: string]: number } = {};

          response.forEach((call: any) => {
            if (call.callCategory === "banking faq") {
              const date = new Date(call.dateTime).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
              if (!bankFaqFrequency[date]) {
                bankFaqFrequency[date] = 0;
              }
              bankFaqFrequency[date]++;
            }
          });
          this.bankingFaqData = [{
            // @ts-ignore
            values: Object.keys(bankFaqFrequency).map(date => ({
              date: date.replace(/-/g, "/"),
              total: bankFaqFrequency[date]
            }))
          }];


          const homeLoanFrequency: { [key: string]: number } = {};
          // @ts-ignore
          const parsedData = response.map(d => {
            return {
              callCategory: d.callCategory,
              date: new Date(d.dateTime).toISOString().split('T')[0]  // Extract the date in 'YYYY-MM-DD' format
            };
          });


          response.forEach((call: any) => {
            if (call.callCategory === "home loan") {
              const date = new Date(call.dateTime).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
              if (!homeLoanFrequency[date]) {
                homeLoanFrequency[date] = 0;
              }
              homeLoanFrequency[date]++;
            }
          });

          // Convert to array format for lineData
          this.homeLoansData = [{
            // @ts-ignore
            values: Object.keys(homeLoanFrequency).map(date => ({
              date: date.replace(/-/g, "/"),
              total: homeLoanFrequency[date]
            }))
          }];


          const vehicleLoanFrequency: { [key: string]: number } = {};
          response.forEach((call: any) => {
            if (call.callCategory === "vehicle loan") {
              const date = new Date(call.dateTime).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
              if (!vehicleLoanFrequency[date]) {
                vehicleLoanFrequency[date] = 0;
              }
              vehicleLoanFrequency[date]++;
            }
          });

          // Convert to array format for lineData
          this.vehicleLoansData = [{
            // @ts-ignore
            values: Object.keys(vehicleLoanFrequency).map(date => ({
              date: date.replace(/-/g, "/"),
              total: vehicleLoanFrequency[date]
            }))
          }];


          const creditCardFaqFrequency: { [key: string]: number } = {};
          response.forEach((call: any) => {
            if (call.callCategory === "credit card faq") {
              const date = new Date(call.dateTime).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
              if (!creditCardFaqFrequency[date]) {
                creditCardFaqFrequency[date] = 0;
              }
              creditCardFaqFrequency[date]++;
            }
          });

          // Convert to array format for lineData
          this.creditCardFaqData = [{
            // @ts-ignore
            values: Object.keys(creditCardFaqFrequency).map(date => ({
              date: date.replace(/-/g, "/"),
              total: creditCardFaqFrequency[date]
            }))
          }];

        })

        setTimeout(()=>{
          // this.createRaceChartSvg();
          // this.updateRaceChart();
          // this.getCreditCardFaqTrend();
          // this.getPersonalLoansTrend();
          // this.getBankingFaqTrend();
          // this.getCreditCardSalesTrend();
          // this.getVehicleLoansTrend();
          // this.getHomeLoansTrend();
          // this.getCarInsuranceSalesTrend();
          // this.createSunburstChart();
          // this.createCustomSunburstChart();
          this.spinner.hide();
        },1000);
      }
  }

  formattedData: any = [];
  private raceData: any[] = [];
  private raceSvg: any;
  private marginRaceChart = { top: 20, right: 30, bottom: 40, left: 150 };
  private widthRaceChart = 800 - this.marginRaceChart.left - this.marginRaceChart.right;
  private heightRaceChart = 500 - this.marginRaceChart.top - this.marginRaceChart.bottom;
  private categoriesRaceChart: string[] = [];
  crossSellingData: any = [];

  // Transition duration
  private duration = 1000;

  private createRaceChartSvg(): void {
    const element = document.getElementById('bar-chart');
    this.raceSvg = d3.select(element)
      .append('svg')
      .attr('width', this.widthRaceChart + this.marginRaceChart.left + this.marginRaceChart.right)
      .attr('height', this.heightRaceChart + this.marginRaceChart.top + this.marginRaceChart.bottom)
      .append('g')
      .attr('transform', `translate(${this.marginRaceChart.left},${this.marginRaceChart.top})`);
  }

  private getCrossSellingData(){
    this.defaultAnalyticsService.getCrossSellingData().subscribe((crossSellingData)=>{
      this.crossSellingData = crossSellingData;
      console.log("Cross Sellinng Data", crossSellingData);
    })
  }

  private updateRaceChart(): void {
    const parseDate = d3.timeParse("%Y-%m-%d"); // Assuming the date format is YYYY-MM-DD
    const formatMonth = d3.timeFormat("%Y-%m"); // Format for displaying months (e.g., 2024-09)

    // Convert the date to month and group data by month and category


    const monthGroupedData = d3.rollup(
      this.raceData,
      v => d3.sum(v, d => d.frequency),
      // @ts-ignore
      d => formatMonth(parseDate(d.date)), // Group by month
      d => d.category // Then group by category
    );

    // Extract the unique months
    const dateValues = Array.from(monthGroupedData.keys());
    const x = d3.scaleLinear().range([0, this.widthRaceChart]);
    const y = d3.scaleBand().range([0, this.heightRaceChart]).padding(0.1);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    this.raceData.forEach(d => {
      if (!this.categoriesRaceChart.includes(d.category)) {
        this.categoriesRaceChart.push(d.category);
      }
    });

    // Function to rank categories by frequency for a given month and sort in ascending order
    const rank = (month: string) => {
      const dataForMonth = Array.from(monthGroupedData.get(month) ?? new Map())
        .map(([category, frequency]) => ({ category, frequency }))
        .sort((a, b) => a.frequency - b.frequency);

      return dataForMonth;
    };

    // Function to update the chart per month
    const update = (month: string) => {
      const rankedData = rank(month);

      // Update the x-domain based on the max frequency for the current month
      x.domain([0, d3.max(rankedData, d => d.frequency) as number]);

      // Update the y-domain to reflect the categories in the current sorted order
      y.domain(rankedData.map(d => d.category));

      // JOIN new data with old elements
      const bars = this.raceSvg.selectAll('.bar')
        .data(rankedData, (d: any) => d.category);

      // EXIT old elements not present in new data
      bars.exit()
        .transition()
        .duration(this.duration)
        .attr('width', 0) // Smooth transition when bars exit
        .remove();

      // ENTER new elements present in new data
      const enterBars = bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        //@ts-ignore
        .attr('y', d => y(d.category) as number)
        .attr('width', 0) // Bars grow from 0 width
        .attr('height', y.bandwidth())
        //@ts-ignore
        .attr('fill', d => color(d.category));

      // ENTER + UPDATE old elements present in new data
      enterBars.merge(bars)
        .transition()
        .duration(this.duration)
        //@ts-ignore
        .attr('y', d => y(d.category) as number)
        //@ts-ignore
        .attr('width', d => x(d.frequency)) // Bar width represents frequency
        .attr('height', y.bandwidth());

      // Update category labels
      const labels = this.raceSvg.selectAll('.label')
        .data(rankedData, (d: any) => d.category);

      labels.exit()
        .transition()
        .duration(this.duration)
        .attr('x', 0)
        .remove();

      labels.enter()
        .append('text')
        .attr('class', 'label')
        //@ts-ignore
        .attr('x', d => x(d.frequency) - 5)
        //@ts-ignore
        .attr('y', d => y(d.category) + y.bandwidth() / 2)
        .attr('text-anchor', 'end')
        .attr('dy', '0.35em')
        //@ts-ignore
        .text(d => d.category)
        .merge(labels)
        .transition()
        .duration(this.duration)
        //@ts-ignore
        .attr('x', d => x(d.frequency) - 5)
        //@ts-ignore
        .attr('y', d => y(d.category) + y.bandwidth() / 2)
        //@ts-ignore
        .text(d => d.category);

      // Update frequency labels
      const freqLabels = this.raceSvg.selectAll('.frequency')
        .data(rankedData, (d: any) => d.category);

      freqLabels.exit()
        .transition()
        .duration(this.duration)
        .attr('x', 0)
        .remove();

      freqLabels.enter()
        .append('text')
        .attr('class', 'frequency')
        //@ts-ignore
        .attr('x', d => x(d.frequency) + 5) // Position frequency count at the end of the bar
        //@ts-ignore
        .attr('y', d => y(d.category) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        //@ts-ignore
        .text(d => d.frequency)
        .merge(freqLabels)
        .transition()
        .duration(this.duration)
        //@ts-ignore
        .attr('x', d => x(d.frequency) + 5) // Update the position with the bar transition
        //@ts-ignore
        .attr('y', d => y(d.category) + y.bandwidth() / 2)
        //@ts-ignore
        .text(d => d.frequency); // Update the text with the current frequency value
    };

    // Animate through the months
    let i = 0;
    const interval = d3.interval(() => {
      update(dateValues[i]);
      i += 1;
      if (i >= dateValues.length) {
        interval.stop();
      }
    }, this.duration);
  }

  getCreditCardFaqTrend(){
    const element = document.getElementById('creditCardFaqTrend');

    const margin = { top: 10, right: 20, bottom: 40, left: 50 }; // Increased bottom margin for x-axis labels
    // @ts-ignore
    const containerWidth = element.parentElement ? element.parentElement.clientWidth : window.innerWidth;
    // @ts-ignore
    const containerHeight = element.parentElement ? element.parentElement.clientHeight : window.innerHeight;
    const width = containerWidth/2 - margin.left - margin.right;
    const height = containerHeight/2 - margin.top - margin.bottom;


    // Parsing timestamps
    const parseTime = d3.timeParse('%Y/%m/%d');


    const parsedData = this.creditCardFaqData.map(item => ({
      values: item.values.map(val => ({
        //@ts-ignore
        total: val.total,
        //@ts-ignore
        date: parseTime(val.date)
        //@ts-ignore
      })).sort((a: any, b: any) => a.date - b.date) // Sort by date
    }));

    const svg = d3.select(element)
      .append('svg')
      .attr('width', containerWidth / 2)
      .attr('height', containerHeight / 2)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    svg.append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("CREDIT CARD FAQs TREND");


    const xScale = d3.scaleTime()
      .domain([
        d3.min(parsedData, (d) => d3.min(d.values, (v) => v.date)) as Date,
        d3.max(parsedData, (d) => d3.max(d.values, (v) => v.date)) as Date
      ])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 10])
      .range([height, 0]);


    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      // @ts-ignore
      .call(d3.axisBottom(xScale)
        // @ts-ignore
        .tickFormat(d3.timeFormat("%b %Y"))
        // @ts-ignore
        .ticks(d3.timeMonth.every(1)));

    svg.append("g")
      .call(d3.axisLeft(yScale));

    const chartSvg = svg.selectAll('.line')
      .data(parsedData)
      .enter();

    const line = d3.line()
      //@ts-ignore
      .x(d => xScale(d.date))
      //@ts-ignore
      .y(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const area = d3.area()
      //@ts-ignore
      .x(d => xScale(d.date))

      .y0(height)
      //@ts-ignore
      .y1(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const path = chartSvg.append('path')
      //@ts-ignore
      .attr('d', d => line(d.values))
      .attr('stroke-width', '2')
      .style('fill', 'none')
      .attr('stroke', '#088F8F');

    chartSvg.append("path")
      //@ts-ignore
      .attr("d", d => area(d.values))
      .style('fill', 'rgba(8, 143, 143, 0.15)');

    const zeroArea = d3.area()
      //@ts-ignore
      .x(d => xScale(d.date))
      .y0(height)
      .y1(() => 0)
      .curve(d3.curveCatmullRom.alpha(0.5));

    chartSvg.append("path")
      //@ts-ignore
      .attr("d", d => zeroArea(d.values))
      .style('fill', 'rgba(8, 143, 143, 0.15)')
      .transition()
      .duration(1500)
      //@ts-ignore
      .attr("d", d => area(d.values))
      .style('fill', 'rgba(8, 143, 143, 0.15)');

    //@ts-ignore
    const length = path.node().getTotalLength();

    path.attr("stroke-dasharray", length + " " + length)
      .attr("stroke-dashoffset", length)
      .transition()
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0)
      .delay(1500)
      .duration(3000);
  }

  getHomeLoansTrend(){
    const element = document.getElementById('homeLoansTrend');
    const margin = { top: 10, right: 20, bottom: 40, left: 50 }; // Increased bottom margin for x-axis labels
    // @ts-ignore
    const containerWidth = element.parentElement ? element.parentElement.clientWidth : window.innerWidth;
    // @ts-ignore
    const containerHeight = element.parentElement ? element.parentElement.clientHeight : window.innerHeight;
    const width = containerWidth/2 - margin.left - margin.right;
    const height = containerHeight/2 - margin.top - margin.bottom;


    // Parsing timestamps
    const parseTime = d3.timeParse('%Y/%m/%d');

    const parsedData = this.homeLoansData.map(item => ({
      values: item.values.map(val => ({
        //@ts-ignore
        total: val.total,
        //@ts-ignore
        date: parseTime(val.date)
        //@ts-ignore
      })).sort((a, b) => a.date - b.date) // Sort by date
    }));

    const svg = d3.select(element)
      .append('svg')
      .attr('width', containerWidth / 2)
      .attr('height', containerHeight / 2)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    svg.append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("HOME LOANS TREND");


    const xScale = d3.scaleTime()
      .domain([
        d3.min(parsedData, (d) => d3.min(d.values, (v) => v.date)) as Date,
        d3.max(parsedData, (d) => d3.max(d.values, (v) => v.date)) as Date
      ])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 8])
      .range([height, 0]);


    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      // @ts-ignore
      .call(d3.axisBottom(xScale)
        // @ts-ignore
        .tickFormat(d3.timeFormat("%b %Y"))
        // @ts-ignore
        .ticks(d3.timeMonth.every(1)));

    svg.append("g")
      .call(d3.axisLeft(yScale));

    const chartSvg = svg.selectAll('.line')
      .data(parsedData)
      .enter();

    const line = d3.line()
      //@ts-ignore
      .x(d => xScale(d.date))
      //@ts-ignore
      .y(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const area = d3.area()
      //@ts-ignore
      .x(d => xScale(d.date))

      .y0(height)
      //@ts-ignore
      .y1(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const path = chartSvg.append('path')
      //@ts-ignore
      .attr('d', d => line(d.values))
      .attr('stroke-width', '2')
      .style('fill', 'none')
      .attr('stroke', '#702963');

    chartSvg.append("path")
      //@ts-ignore
      .attr("d", d => area(d.values))
      .style('fill', 'rgba(207,159,255,0.15)');

    const zeroArea = d3.area()
      //@ts-ignore
      .x(d => xScale(d.date))
      .y0(height)
      .y1(() => 0)
      .curve(d3.curveCatmullRom.alpha(0.5));

    chartSvg.append("path")
      //@ts-ignore
      .attr("d", d => zeroArea(d.values))
      .style('fill', 'rgba(207,159,255,0.15)')
      .transition()
      .duration(1500)
      //@ts-ignore
      .attr("d", d => area(d.values))
      .style('fill', 'rgba(207,159,255,0.15)');

    //@ts-ignore
    const length = path.node().getTotalLength();

    path.attr("stroke-dasharray", length + " " + length)
      .attr("stroke-dashoffset", length)
      .transition()
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0)
      .delay(1500)
      .duration(3000);
  }

  getVehicleLoansTrend(){
    const element = document.getElementById('vehicleLoansTrend');

    const margin = { top: 10, right: 20, bottom: 40, left: 50 }; // Increased bottom margin for x-axis labels
    // @ts-ignore
    const containerWidth = element.parentElement ? element.parentElement.clientWidth : window.innerWidth;
    // @ts-ignore
    const containerHeight = element.parentElement ? element.parentElement.clientHeight : window.innerHeight;
    const width = containerWidth/2 - margin.left - margin.right;
    const height = containerHeight/2 - margin.top - margin.bottom;


    // Parsing timestamps
    const parseTime = d3.timeParse('%Y/%m/%d');

    const parsedData = this.vehicleLoansData.map(item => ({
      values: item.values.map(val => ({
        //@ts-ignore
        total: val.total,
        //@ts-ignore
        date: parseTime(val.date)
        //@ts-ignore
      })).sort((a, b) => a.date - b.date) // Sort by date
    }));
    const svg = d3.select(element)
      .append('svg')
      .attr('width', containerWidth / 2)
      .attr('height', containerHeight / 2)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    svg.append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("VEHICLE LOANS TREND");


    const xScale = d3.scaleTime()
      .domain([
        d3.min(parsedData, (d) => d3.min(d.values, (v) => v.date)) as Date,
        d3.max(parsedData, (d) => d3.max(d.values, (v) => v.date)) as Date
      ])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 4])
      .range([height, 0]);


    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      // @ts-ignore
      .call(d3.axisBottom(xScale)
        // @ts-ignore
        .tickFormat(d3.timeFormat("%b %Y"))
        // @ts-ignore
        .ticks(d3.timeMonth.every(1)));

    svg.append("g")
      .call(d3.axisLeft(yScale));

    const chartSvg = svg.selectAll('.line')
      .data(parsedData)
      .enter();

    const line = d3.line()
      //@ts-ignore
      .x(d => xScale(d.date))
      //@ts-ignore
      .y(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const area = d3.area()
      //@ts-ignore
      .x(d => xScale(d.date))

      .y0(height)
      //@ts-ignore
      .y1(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const path = chartSvg.append('path')
      //@ts-ignore
      .attr('d', d => line(d.values))
      .attr('stroke-width', '2')
      .style('fill', 'none')
      .attr('stroke', '#6E260E');

    chartSvg.append("path")
      //@ts-ignore
      .attr("d", d => area(d.values))
      .style('fill', 'rgba(110, 38, 14, 0.15)');

    const zeroArea = d3.area()
      //@ts-ignore
      .x(d => xScale(d.date))
      .y0(height)
      .y1(() => 0)
      .curve(d3.curveCatmullRom.alpha(0.5));

    chartSvg.append("path")
      //@ts-ignore
      .attr("d", d => zeroArea(d.values))
      .style('fill', 'rgba(110, 38, 14, 0.15)')
      .transition()
      .duration(1500)
      //@ts-ignore
      .attr("d", d => area(d.values))
      .style('fill', 'rgba(110, 38, 14, 0.15)');

    //@ts-ignore
    const length = path.node().getTotalLength();

    path.attr("stroke-dasharray", length + " " + length)
      .attr("stroke-dashoffset", length)
      .transition()
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0)
      .delay(1500)
      .duration(3000);
  }

  getCarInsuranceSalesTrend(){
    const element = document.getElementById('carInsuranceTrend');
    const margin = { top: 10, right: 20, bottom: 40, left: 50 }; // Increased bottom margin for x-axis labels
    // @ts-ignore
    const containerWidth = element.parentElement ? element.parentElement.clientWidth : window.innerWidth;
    // @ts-ignore
    const containerHeight = element.parentElement ? element.parentElement.clientHeight : window.innerHeight;
    const width = containerWidth/2 - margin.left - margin.right;
    const height = containerHeight/2 - margin.top - margin.bottom;
    // Parsing timestamps
    const parseTime = d3.timeParse('%Y/%m/%d');


    const parsedData = this.carInsuranceSalesData.map(item => ({
      values: item.values.map(val => ({
        //@ts-ignore
        total: val.total,
        //@ts-ignore
        date: parseTime(val.date)
        //@ts-ignore
      })).sort((a, b) => a.date - b.date) // Sort by date
    }));

    const svg = d3.select(element)
      .append('svg')
      .attr('width', containerWidth / 2)
      .attr('height', containerHeight / 2)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    svg.append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("CARD INSURANCE SALES TREND");


    const xScale = d3.scaleTime()
      .domain([
        d3.min(parsedData, (d) => d3.min(d.values, (v) => v.date)) as Date,
        d3.max(parsedData, (d) => d3.max(d.values, (v) => v.date)) as Date
      ])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 8])
      .range([height, 0]);


    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      // @ts-ignore
      .call(d3.axisBottom(xScale)
        // @ts-ignore
        .tickFormat(d3.timeFormat("%b %Y"))
        // @ts-ignore
        .ticks(d3.timeMonth.every(1)));

    svg.append("g")
      .call(d3.axisLeft(yScale));

    const chartSvg = svg.selectAll('.line')
      .data(parsedData)
      .enter();

    const line = d3.line()
      //@ts-ignore
      .x(d => xScale(d.date))
      //@ts-ignore
      .y(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const area = d3.area()
      //@ts-ignore
      .x(d => xScale(d.date))

      .y0(height)
      //@ts-ignore
      .y1(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const path = chartSvg.append('path')
      //@ts-ignore
      .attr('d', d => line(d.values))
      .attr('stroke-width', '2')
      .style('fill', 'none')
      .attr('stroke', '#FFBF00');

    chartSvg.append("path")
      //@ts-ignore
      .attr("d", d => area(d.values))
      .style('fill', 'rgba(255,191,0,0.15)');

    const zeroArea = d3.area()
      //@ts-ignore
      .x(d => xScale(d.date))
      .y0(height)
      .y1(() => 0)
      .curve(d3.curveCatmullRom.alpha(0.5));

    chartSvg.append("path")
      //@ts-ignore
      .attr("d", d => zeroArea(d.values))
      .style('fill', 'rgba(255,191,0,0.15)')
      .transition()
      .duration(1500)
      //@ts-ignore
      .attr("d", d => area(d.values))
      .style('fill', 'rgba(255,191,0,0.15)');

    //@ts-ignore
    const length = path.node().getTotalLength();

    path.attr("stroke-dasharray", length + " " + length)
      .attr("stroke-dashoffset", length)
      .transition()
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0)
      .delay(1500)
      .duration(3000);
  }

  getBankingFaqTrend(){
    const element = document.getElementById('bankingFaqTrend');

    const margin = { top: 10, right: 20, bottom: 40, left: 50 }; // Increased bottom margin for x-axis labels
    // @ts-ignore
    const containerWidth = element.parentElement ? element.parentElement.clientWidth : window.innerWidth;
    // @ts-ignore
    const containerHeight = element.parentElement ? element.parentElement.clientHeight : window.innerHeight;
    const width = containerWidth/2 - margin.left - margin.right;
    const height = containerHeight/2 - margin.top - margin.bottom;


    // Parsing timestamps
    const parseTime = d3.timeParse('%Y/%m/%d');


    const parsedData = this.bankingFaqData.map(item => ({
      values: item.values.map(val => ({
        //@ts-ignore
        total: val.total,
        //@ts-ignore
        date: parseTime(val.date)
        //@ts-ignore
      })).sort((a, b) => a.date - b.date) // Sort by date
    }));


    // Appending svg to a selected element
    const svg = d3.select(element)
      .append('svg')
      .attr('width', containerWidth / 2)
      .attr('height', containerHeight / 2)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    svg.append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("BANKING FAQs TREND");


    const xScale = d3.scaleTime()
      .domain([
        d3.min(parsedData, (d) => d3.min(d.values, (v) => v.date)) as Date,
        d3.max(parsedData, (d) => d3.max(d.values, (v) => v.date)) as Date
      ])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 8])
      .range([height, 0]);


    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      // @ts-ignore
      .call(d3.axisBottom(xScale)
        // @ts-ignore
        .tickFormat(d3.timeFormat("%b %Y"))
        // @ts-ignore
        .ticks(d3.timeMonth.every(1)));

    svg.append("g")
      .call(d3.axisLeft(yScale));

    const chartSvg = svg.selectAll('.line')
      .data(parsedData)
      .enter();

    const line = d3.line()
      //@ts-ignore
      .x(d => xScale(d.date))
      //@ts-ignore
      .y(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const area = d3.area()
      //@ts-ignore
      .x(d => xScale(d.date))

      .y0(height)
      //@ts-ignore
      .y1(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const path = chartSvg.append('path')
      //@ts-ignore
      .attr('d', d => line(d.values))
      .attr('stroke-width', '2')
      .style('fill', 'none')
      .attr('stroke', '#4682B4');

    chartSvg.append("path")
      //@ts-ignore
      .attr("d", d => area(d.values))
      .style('fill', 'rgba(1,186,239,0.15)');

    const zeroArea = d3.area()
      //@ts-ignore
      .x(d => xScale(d.date))
      .y0(height)
      .y1(() => 0)
      .curve(d3.curveCatmullRom.alpha(0.5));

    chartSvg.append("path")
      //@ts-ignore
      .attr("d", d => zeroArea(d.values))
      .style('fill', 'rgba(1,186,239,0.15)')
      .transition()
      .duration(1500)
      //@ts-ignore
      .attr("d", d => area(d.values))
      .style('fill', 'rgba(1,186,239,0.15)');

    //@ts-ignore
    const length = path.node().getTotalLength();

    path.attr("stroke-dasharray", length + " " + length)
      .attr("stroke-dashoffset", length)
      .transition()
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0)
      .delay(1500)
      .duration(3000);
  }

  getCreditCardSalesTrend() {
    const element = document.getElementById('creditCardSalesTrend');

    const margin = { top: 10, right: 20, bottom: 40, left: 50 };
    //@ts-ignore
    const containerWidth = element.parentElement ? element.parentElement.clientWidth : window.innerWidth;
    //@ts-ignore
    const containerHeight = element.parentElement ? element.parentElement.clientHeight : window.innerHeight;
    const width = containerWidth / 2 - margin.left - margin.right;
    const height = containerHeight / 2 - margin.top - margin.bottom;

    const parseTime = d3.timeParse('%Y/%m/%d');

    const parsedData = this.creditCardSalesData.map(item => ({
      values: item.values.map(val => ({
        //@ts-ignore
        total: val.total,
        //@ts-ignore
        date: parseTime(val.date)
        //@ts-ignore
      })).sort((a, b) => a.date - b.date) // Sort by date
    }));

    // Appending svg to a selected element
    const svg = d3.select(element)
      .append('svg')
      .attr('width', containerWidth / 2)
      .attr('height', containerHeight / 2)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    svg.append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("CREDIT CARD SALES TREND");


    const xScale = d3.scaleTime()
      .domain([
        d3.min(parsedData, (d) => d3.min(d.values, (v) => v.date)) as Date,
        d3.max(parsedData, (d) => d3.max(d.values, (v) => v.date)) as Date
      ])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 8])
      .range([height, 0]);


    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      //@ts-ignore
      .call(d3.axisBottom(xScale)
        //@ts-ignore
        .tickFormat(d3.timeFormat("%b %Y"))
        //@ts-ignore
        .ticks(d3.timeMonth.every(1)));

    svg.append("g")
      .call(d3.axisLeft(yScale));

    const chartSvg = svg.selectAll('.line')
      .data(parsedData)
      .enter();

    const line = d3.line()
      //@ts-ignore
      .x(d => xScale(d.date))
      //@ts-ignore
      .y(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const area = d3.area()
      //@ts-ignore
      .x(d => xScale(d.date))
      .y0(height)
      //@ts-ignore
      .y1(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Append the path for the line and wait until it's appended
    const path = chartSvg.append('path')
      //@ts-ignore
      .attr('d', d => line(d.values))
      .attr('stroke-width', '2')
      .style('fill', 'none')
      .attr('stroke', '#ff6f3c');

    // Ensure the path is appended before attempting to access the length
    path.each(function () {
      const thisPath = d3.select(this);
      // @ts-ignore
      const length = thisPath.node().getTotalLength(); // Now the path exists, so this won't be null

      thisPath.attr("stroke-dasharray", length + " " + length)
        .attr("stroke-dashoffset", length)
        .transition()
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .delay(1500)
        .duration(3000);
    });

    chartSvg.append("path")
      //@ts-ignore
      .attr("d", d => area(d.values))
      .style('fill', 'rgba(255,111,60,0.155)');

    const zeroArea = d3.area()
      //@ts-ignore
      .x(d => xScale(d.date))
      .y0(height)
      .y1(() => 0)
      .curve(d3.curveCatmullRom.alpha(0.5));

    chartSvg.append("path")
      //@ts-ignore
      .attr("d", d => zeroArea(d.values))
      .style('fill', 'rgba(255,111,60,0.15)')
      .transition()
      .duration(1500)
      //@ts-ignore
      .attr("d", d => area(d.values))
      .style('fill', 'rgba(255,111,60,0.15)');
  }


  getPersonalLoansTrend() {
    const element = document.getElementById('personalLoanTrend');

    const margin = {top: 10, right: 20, bottom: 40, left: 50};
    //@ts-ignore
    const containerWidth = element.parentElement ? element.parentElement.clientWidth : window.innerWidth;
    //@ts-ignore
    const containerHeight = element.parentElement ? element.parentElement.clientHeight : window.innerHeight;
    const width = containerWidth / 2 - margin.left - margin.right;
    const height = containerHeight / 2 - margin.top - margin.bottom;

    const parseTime = d3.timeParse('%Y/%m/%d');

    const parsedData = this.lineData.map(item => ({
      values: item.values.map(val => ({
        //@ts-ignore
        total: val.total,
        //@ts-ignore
        date: parseTime(val.date)
        //@ts-ignore
      })).sort((a, b) => a.date - b.date) // Sort by date
    }));

// Appending svg to a selected element
    const svg = d3.select(element)
      .append('svg')
      .attr('width', containerWidth / 2)
      .attr('height', containerHeight / 2)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    svg.append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("PERSONAL LOAN TREND");


    const xScale = d3.scaleTime()
      .domain([
        d3.min(parsedData, (d) => d3.min(d.values, (v) => v.date)) as Date,
        d3.max(parsedData, (d) => d3.max(d.values, (v) => v.date)) as Date
      ])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 12])
      .range([height, 0]);


    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      // @ts-ignore
      .call(d3.axisBottom(xScale)
        // @ts-ignore
        .tickFormat(d3.timeFormat("%b %Y"))
        // @ts-ignore
        .ticks(d3.timeMonth.every(1)));

    svg.append("g")
      .call(d3.axisLeft(yScale));

    const chartSvg = svg.selectAll('.line')
      .data(parsedData)
      .enter();

    const line = d3.line()
      //@ts-ignore
      .x(d => xScale(d.date))
      //@ts-ignore
      .y(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const area = d3.area()
      //@ts-ignore
      .x(d => xScale(d.date))

      .y0(height)
      //@ts-ignore
      .y1(d => yScale(d.total))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const path = chartSvg.append('path')
      //@ts-ignore
      .attr('d', d => line(d.values))
      .attr('stroke-width', '2')
      .style('fill', 'none')
      .attr('stroke', '#DC143C');

    chartSvg.append("path")
      //@ts-ignore
      .attr("d", d => area(d.values))
      .style('fill', 'rgba(220, 20, 60, 0.15)');

    const zeroArea = d3.area()
      //@ts-ignore
      .x(d => xScale(d.date))
      .y0(height)
      .y1(() => 0)
      .curve(d3.curveCatmullRom.alpha(0.5));

    chartSvg.append("path")
      //@ts-ignore
      .attr("d", d => zeroArea(d.values))
      .style('fill', 'rgba(220, 20, 60, 0.15)')
      .transition()
      .duration(1500)
      //@ts-ignore
      .attr("d", d => area(d.values))
      .style('fill', 'rgba(220, 20, 60, 0.15)');

    //@ts-ignore
    const length = path.node().getTotalLength();

    path.attr("stroke-dasharray", length + " " + length)
      .attr("stroke-dashoffset", length)
      .transition()
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0)
      .delay(1500)
      .duration(3000);
  }

  createGroupedColumnChart(): void {
    const margin = { top: 40, right: 30, bottom: 70, left: 40 },
      width = 1700 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#groupedColumnChart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const data = this.formattedData;

    // Extract unique months for the x-axis
    // @ts-ignore
    const allMonths = Array.from(new Set(data.flatMap(d => d.months.map(m => m.monthYear))));
    // @ts-ignore
    const callCategories = Array.from(new Set(data.map(d => d.callCategory.toUpperCase())));

    // Create x and y scales
    const x0 = d3.scaleBand()
      // @ts-ignore
      .domain(callCategories)
      .range([0, width])
      .padding(0.2);

    const x1 = d3.scaleBand()
      // @ts-ignore
      .domain(allMonths)
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      // @ts-ignore
      .domain([0, d3.max(data, d => d3.max(d.months, m => m.frequency))])
      .nice()
      .range([height, 0]);

    // Add x-axis for call categories
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .style("font-size", "12px")
      .style("text-anchor", "middle")
      .style('font-weight', 'bold')
      .attr("dx", "-.8em")
      .attr("dy", ".65em")
      .attr("transform", "rotate(0)");

    // Add y-axis
    svg.append("g")
      .call(d3.axisLeft(y));

    // Add bars
    svg.append("g")
      .selectAll("g")
      .data(data)
      .enter()
      .append("g")
      // @ts-ignore
      .attr("transform", d => `translate(${x0(d.callCategory.toUpperCase())},0)`)
      .selectAll("rect")
      // @ts-ignore
      .data(d => d.months)
      .enter()
      .append("rect")
      // @ts-ignore
      .attr("x", d => x1(d.monthYear))
      // @ts-ignore
      .attr("y", d => y(d.frequency))
      .attr("width", x1.bandwidth())
      // @ts-ignore
      .attr("height", d => height - y(d.frequency))
      .attr('fill', 'url(#barGradient)');

    // Add labels for the grouped bars
    svg.append("g")
      .selectAll("g")
      .data(data)
      .enter()
      .append("g")
      // @ts-ignore
      .attr("transform", d => `translate(${x0(d.callCategory.toUpperCase())},0)`)
      .selectAll("text")
      // @ts-ignore
      .data(d => d.months)
      .enter()
      .append("text")
      // @ts-ignore
      .attr("x", d => x1(d.monthYear) + x1.bandwidth() / 2)
      // @ts-ignore
      .attr("y", d => y(d.frequency) - 5)
       .attr("text-anchor", "middle")
      // @ts-ignore
      .text(d => d.frequency);
  }


  agentIds: any = [];
  showPersonalLoanTrend: boolean = false;
  showHomeLoanTrend: boolean = false;
  showVehicleLoanTrend: boolean = false;
  showCreditCardSalesTrend: boolean = false;
  showCreditCardFaqTrend: boolean = false;
  showBankingFaqTrend:boolean = false;
  showCarInsuranceTrend: boolean = false;
  customerSatisfaction: CallCategory[] = [];
  resolutionStatusDataset: any = [];
  agentNames: AgentNames[] = [];
  theme: string = 'dark';
  agentId: number = this.authService.userId;
  managerId: number = this.authService.roleType == 'Manager' ? this.authService.managerId : 0;

  pageSizeCrossSelling = 5;
  currentPageCrossSelling = 0;

  get pagedDataCrossSelling() {
    const startIndex = this.currentPageCrossSelling * this.pageSizeCrossSelling;
    const endIndex = startIndex + this.pageSizeCrossSelling;
    return this.crossSellingData.slice(startIndex, endIndex);
  }

  onPageChangeCrossSelling(event: any) {
    this.currentPageCrossSelling = event.pageIndex;
    this.pageSizeCrossSelling = event.pageSize;
  }

  pageSize = 5;
  currentPage = 0;
  pageSizeOptions: number[] = [5, 10, 20, 50, 100];

  get pagedData() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.agentPerformanceComments[0]?.slice(startIndex, endIndex);
  }

  onPageChange(event: any) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  pageSize2 = 5;
  currentPage2 = 0;
  pageSizeOptions2: number[] = [5, 10, 20, 50, 100];

  get pagedData2() {
    const startIndex = this.currentPage2 * this.pageSize2;
    const endIndex = startIndex + this.pageSize2;
    return this.categoryCommonProblems[0]?.slice(startIndex, endIndex);
  }

  onPageChange2(event: any) {
    this.currentPage2 = event.pageIndex;
    this.pageSize2 = event.pageSize;
  }

  lineData = [{values: []}];
  creditCardSalesData = [{values: []}];
  bankingFaqData = [{values: []}];
  carInsuranceSalesData = [{values: []}];
  creditCardFaqData = [{values: []}];
  homeLoansData = [{values: []}];
  vehicleLoansData =[{values: []}];

  roleName: string = this.authService.roleType;
  adminStreamLitURL: any = this.safeURL.bypassSecurityTrustResourceUrl(`http://52.172.252.7:5011/?admin=1`);
  agentStreamLitURL: any = this.safeURL.bypassSecurityTrustResourceUrl(`http://52.172.252.7:5011/?aid=${this.agentId}&theme=${this.theme}`);
  managerStreamLitURL: any = this.safeURL.bypassSecurityTrustResourceUrl(`http://52.172.252.7:5011/?mid=${this.managerId}&theme=${this.theme}`);

  @ViewChild('chart', {static: true}) private chartContainer: ElementRef | undefined;
  @ViewChild('chart2', {static: true}) private chartContainer2: ElementRef | undefined;
  @ViewChild('chart3', {static: true}) private chartContainer3: ElementRef | undefined;
  @ViewChild('chart4', {static: true}) private chartContainer4: ElementRef | undefined;
  @ViewChild('keyScore', {static: true}) private keyScoreContainer: ElementRef | undefined;
  @ViewChild('maxDuration', {static: true}) private maxDurationContainer: ElementRef | undefined;
  @ViewChild('minDuration', {static: true}) private minDurationContainer: ElementRef | undefined;
  @ViewChild('avgDuration', {static: true}) private avgDurationContainer: ElementRef | undefined;
  @ViewChild('totalCalls', {static: true}) private callsContainer: ElementRef | undefined;
  @ViewChild('avgCallsPerDay', {static: true}) private AvgCallsPerDayContainer: ElementRef | undefined;


  private dataset : any = [];
  private datasetSentiment: any = [];
  private datasetSatisfaction: any = []
  private width = 300;
  private height = 300;
  private outerRadius = this.width / 2;
  private innerRadius = 100;

  sentiments: Sentiment[] = [];
  agentPerformanceComments: any = [];
  categoryCommonProblems: any = [];

  get allSelectedAgents(): boolean {
    return this.agentNames.every(category => category.selected);
  }

  partiallySelectedAgents(): boolean {
    return this.agentNames.some(category => category.selected) && !this.allSelectedAgents;
  }

  toggleAllAgents(selected: boolean): void {
    this.agentNames.forEach(category => category.selected = selected);
    this.filterByAgent();
  }

  toggleAgents(selected: boolean, index: number): void {
    this.agentNames[index].selected = selected;
    this.filterByAgent();
  }


  get allSelectedCategory(): boolean {
    return this.categories.every(category => category.selected);
  }

  partiallySelectedCategory(): boolean {
    return this.categories.some(category => category.selected) && !this.allSelectedCategory;
  }

  toggleAllCategory(selected: boolean): void {
    this.categories.forEach(category => category.selected = selected);
    this.filterByCategory();
  }

  toggleCategory(selected: boolean, index: number): void {
    this.categories[index].selected = selected;
    this.filterByCategory();
  }


  get allSelected(): boolean {
    return this.sentiments.every(sentiment => sentiment.selected);
  }

  partiallySelected(): boolean {
    return this.sentiments.some(sentiment => sentiment.selected) && !this.allSelected;
  }

  toggleAll(selected: boolean): void {
    this.sentiments.forEach(sentiment => sentiment.selected = selected);
    this.filterBySentiment();
  }

  toggleSentiment(selected: boolean, index: number): void {
    this.sentiments[index].selected = selected;
    this.filterBySentiment();
  }

  formatLabel(keyScore: number) {
    return `${keyScore}%`;
  }


  filterByKeyScore(keyScoreThreshold: string){
    this.filterRecords = [];
    this.filterRecords = this.mainData.filter((calls: any) => calls.keyScore <= Number(keyScoreThreshold));
    // @ts-ignore
    this.filterRecords = this.filterRecords.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    if(this.filterRecords.length > 0) {
      this.customerSentiment = [];
      this.customerSatisfaction = [];
      this.meanKeyScore = [];
      this.dataset = [];
      this.datasetSentiment = [];
      this.datasetSatisfaction = [];
      this.data = [];
      this.avgCallDuration = 0;
      this.maxCallDuration = 0;
      this.smallCallDuration = 1000000000;
      this.totalCalls = this.filterRecords.length;

      for (let i = 0; i < this.filterRecords.length; i++) {
        const index = this.data.findIndex(call => call.callCategory === this.filterRecords[i].callCategory);
        if (index !== -1) {
          this.data[index].frequency += 1;
        } else {
          this.data.push({callCategory: this.filterRecords[i].callCategory, frequency: 1});
        }
      }

      this.beginDate = this.filterRecords[0].dateTime;
      this.endDate = this.filterRecords[this.filterRecords.length - 1].dateTime;

      for (let maxDuration of this.filterRecords) {
        if (this.maxCallDuration < maxDuration.callDuration) {
          this.maxCallDuration = maxDuration.callDuration;
        }
      }

      for (let minDuration of this.filterRecords) {
        if (this.smallCallDuration > minDuration.callDuration) {
          this.smallCallDuration = minDuration.callDuration;
        }
      }


      for (let duration of this.filterRecords) {
        this.avgCallDuration += duration.callDuration;
      }

      this.durationSum = this.avgCallDuration;
      this.avgCallDuration = this.avgCallDuration / this.filterRecords.length;
      this.avgCallDuration = Number((this.avgCallDuration / 60).toFixed(1));
      this.maxCallDuration = Number((this.maxCallDuration / 60).toFixed(1));
      this.smallCallDuration = Number((this.smallCallDuration / 60).toFixed(1));


      for (let i = 0; i < this.filterRecords.length; i++) {
        const index = this.customerSentiment.findIndex(call => call.callCategory === this.filterRecords[i].custSuppSentiment);
        if (index !== -1) {
          this.customerSentiment[index].frequency += 1;
        } else {
          this.customerSentiment.push({frequency: 1, callCategory: this.filterRecords[i].custSuppSentiment});
        }
      }

      for (let i = 0; i < this.filterRecords.length; i++) {
        const index = this.customerSatisfaction.findIndex(call => call.callCategory === this.filterRecords[i].customerSatisfaction);
        if (index !== -1) {
          this.customerSatisfaction[index].frequency += 1;
        } else {
          this.customerSatisfaction.push({frequency: 1, callCategory: this.filterRecords[i].customerSatisfaction});
        }
      }

      let keyScore = 0;
      for (let data of this.filterRecords) {
        keyScore += data.keyScore;
      }

      for (let category of this.data) {
        this.dataset.push({
          name: category.callCategory,
          percent: Math.ceil((category.frequency / this.filterRecords.length) * 100)
        });
      }

      for (let sentiment of this.customerSentiment) {
        this.datasetSentiment.push({
          name: sentiment.callCategory,
          percent: Math.ceil((sentiment.frequency / this.filterRecords.length) * 100)
        });
      }

      for (let satisfaction of this.customerSatisfaction) {
        this.datasetSatisfaction.push({
          name: satisfaction.callCategory,
          percent: Math.ceil((satisfaction.frequency / this.filterRecords.length) * 100)
        });
      }

      this.meanKeyScore.push(Math.ceil(keyScore / this.filterRecords.length));

      setTimeout(() => {
        this.createChart();
        this.createKeyScoreChart();
        this.createChart2();
        this.createChart3();
        this.createChart4();
        this.createMaxDurationChart();
        this.createMinDurationChart();
        this.createAvgDurationChart();
        this.createTotalCallsChart();
        this.createAvgCallsPerDayChart();
        this.createSvg();
        this.drawBars(this.data);
      }, 1000);
    }
  }

  private createChart(): void {
    // @ts-ignore
    const element = this.chartContainer.nativeElement;
    d3.select(element).select('svg').remove();

    const pie = d3.pie<any>()
      .value((d: any) => d.percent)
      .sort(null)
      .padAngle(0.03);

    const color = d3.scaleOrdinal<string>()
      .range([ '#58508d','#bc5090','#ff6361','#ffa600','#47B39C','#00A36C']);

    const arc = d3.arc<any>()
      .outerRadius(this.outerRadius)
      .innerRadius(this.innerRadius);

    const svg = d3.select(element)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('class', 'shadow')
      .append('g')
      .attr('transform', `translate(${this.width / 2}, ${this.height / 2})`);

    const path = svg.selectAll('path')
      .data(pie(this.dataset))
      .enter()
      .append('path')
      .attr('d', arc as any)
      .attr('fill', (d, i) => color(d.data.name) as string)
      .on('mouseover', function(event, d) {
        const [x, y] = d3.pointer(event);
        tooltip
          .style('left', `${x + 15}px`)
          .style('top', `${y - 28}px`)
          .style('opacity', 0.9)
          .html(`<strong>${d.data.name.toUpperCase()}</strong>: ${d.data.percent}%`);
      })
      .on('mouseout', function() {
        tooltip.style('opacity', 0);
      });

    path.transition()
      .duration(1000)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate(
          {startAngle: 0, endAngle: 0},
          d
        );
        return function(t) {
          return arc(interpolate(t)) as string;
        };
      });

    setTimeout(() => this.restOfTheData(svg, pie, arc, color), 1000);

    let tooltip = d3.select(element)
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '5px')
      .style('background', 'rgba(0, 0, 0, 0.7)')
      .style('color', '#fff')
      .style('border-radius', '3px')
      .style('pointer-events', 'none')
      .style('opacity', 0);
  }

  private restOfTheData(svg: any, pie: any, arc: any, color: any): void {
    const text = svg.selectAll('text')
      .data(pie(this.dataset))
      .enter()
      .append('text')
      .transition()
      .duration(200)
      .attr('transform', (d: any) => `translate(${arc.centroid(d)})`)
      .attr('dy', '.4em')
      .attr('text-anchor', 'middle')
      .text((d: any) => `${d.data.percent}%`)
      .style('fill', '#fff')
      .style('font-size', '18px');

    // const legendRectSize = 20;
    // const legendSpacing = 7;
    // const legendHeight = legendRectSize + legendSpacing;

  }

  private createChart2(): void {

    // @ts-ignore
    const element = this.chartContainer2.nativeElement;
    d3.select(element).select('svg').remove();

    const pie = d3.pie<any>()
      .value((d: any) => d.percent)
      .sort(null)
      .padAngle(0.03);

    const color = d3.scaleOrdinal<string>()
      .range(['#00A36C','#FFC154','#EC6B56']);

    const arc = d3.arc<any>()
      .outerRadius(this.outerRadius)
      .innerRadius(this.innerRadius);

    const svg = d3.select(element)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('class', 'shadow')
      .append('g')
      .attr('transform', `translate(${this.width / 2}, ${this.height / 2})`);

     const tooltip = d3.select(element)
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '5px')
      .style('background', 'rgba(0, 0, 0, 0.7)')
      .style('color', '#fff')
      .style('border-radius', '3px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    const path = svg.selectAll('path')
      .data(pie(this.datasetSentiment))
      .enter()
      .append('path')
      .attr('d', arc as any)
      .attr('fill', (d, i) => color(d.data.name) as string)
      .on('mouseover', function(event, d) {
      const [x, y] = d3.pointer(event);
      tooltip
        .style('left', `${x + 15}px`)
        .style('top', `${y - 28}px`)
        .style('opacity', 0.9)
        .html(`<strong>${d.data.name.toUpperCase()}</strong>: ${d.data.percent}%`);
    })
      .on('mouseout', function() {
        tooltip.style('opacity', 0);
      });

    path.transition()
      .duration(1000)
      .attrTween('d', function (d) {
        const interpolate = d3.interpolate(
          {startAngle: 0, endAngle: 0},
          d
        );
        return function (t) {
          return arc(interpolate(t)) as string;
        };
      });

    setTimeout(() => this.restOfTheData2(svg, pie, arc, color), 1000);
  }

  private restOfTheData2(svg: any, pie: any, arc: any, color: any): void {
    const text = svg.selectAll('text')
      .data(pie(this.datasetSentiment))
      .enter()
      .append('text')
      .transition()
      .duration(200)
      .attr('transform', (d: any) => `translate(${arc.centroid(d)})`)
      .attr('dy', '.4em')
      .attr('text-anchor', 'middle')
      .text((d: any) => `${d.data.percent}%`)
      .style('fill', '#fff')
      .style('font-size', '18px');

    const legendRectSize = 20;
    const legendSpacing = 7;
    const legendHeight = legendRectSize + legendSpacing;

    const legend = svg.selectAll('.legend')
      .data(color.domain())
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d: any, i: any) => `translate(-35, ${(i * legendHeight) - 65})`);

    legend.append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .attr('rx', 20)
      .attr('ry', 20)
      .style('fill', color)
      .style('stroke', color);

    legend.append('text')
      .attr('x', 30)
      .attr('y', 15)
      .text((d: any) => d)
      .style('fill', '#16140d')
      .style('font-size', '16px');
  }

  private createChart3(): void {
    // @ts-ignore
    const element = this.chartContainer3.nativeElement;
    d3.select(element).select('svg').remove();

    const pie = d3.pie<any>()
      .value((d: any) => d.percent)
      .sort(null)
      .padAngle(0.03);

    const color = d3.scaleOrdinal<string>()
      .range(['#EC6B56', '#FFC154','#47B39C']);

    const arc = d3.arc<any>()
      .outerRadius(this.outerRadius)
      .innerRadius(this.innerRadius);

    const svg = d3.select(element)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('class', 'shadow')
      .append('g')
      .attr('transform', `translate(${this.width / 2}, ${this.height / 2})`);

    const tooltip = d3.select(element)
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '5px')
      .style('background', 'rgba(0, 0, 0, 0.7)')
      .style('color', '#fff')
      .style('border-radius', '3px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    const path = svg.selectAll('path')
      .data(pie(this.datasetSatisfaction))
      .enter()
      .append('path')
      .attr('d', arc as any)
      .attr('fill', (d, i) => color(d.data.name) as string)
  .on('mouseover', function(event, d) {
      const [x, y] = d3.pointer(event);
      tooltip
        .style('left', `${x + 15}px`)
        .style('top', `${y - 28}px`)
        .style('opacity', 0.9)
        .html(`<strong>${d.data.name.toUpperCase()}</strong>: ${d.data.percent}%`);
    })
      .on('mouseout', function() {
        tooltip.style('opacity', 0);
      });

    path.transition()
      .duration(1000)
      .attrTween('d', function (d) {
        const interpolate = d3.interpolate(
          { startAngle: 0, endAngle: 0 },
          d
        );
        return function (t) {
          return arc(interpolate(t)) as string;
        };
      });

    setTimeout(() => this.restOfTheData3(svg, pie, arc, color), 1000);
  }

  private restOfTheData3(svg: any, pie: any, arc: any, color: any): void {
    const text = svg.selectAll('text')
      .data(pie(this.datasetSatisfaction))
      .enter()
      .append('text')
      .transition()
      .duration(200)
      .attr('transform', (d: any) => `translate(${arc.centroid(d)})`)
      .attr('dy', '.4em')
      .attr('text-anchor', 'middle')
      .text((d: any) => `${d.data.percent}%`)
      .style('fill', '#fff')
      .style('font-size', '18px');

    const legendRectSize: number = 20;
    const legendSpacing: number = 7;
    let legendHeight = legendRectSize + legendSpacing;

    const legend = svg.selectAll('.legend')
      .data(color.domain())
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d: any, i: any) => `translate(-35, ${(i * legendHeight) - 65})`);

    legend.append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .attr('rx', 20)
      .attr('ry', 20)
      .style('fill', color)
      .style('stroke', color);

    legend.append('text')
      .attr('x', 30)
      .attr('y', 15)
      .text((d: any) => d)
      .style('fill', '#16140d')
      .style('font-size', '16px');
  }

  private createChart4(): void {
    // @ts-ignore
    const element = this.chartContainer4.nativeElement;
    d3.select(element).select('svg').remove();

    const pie = d3.pie<any>()
      .value((d: any) => d.percent)
      .sort(null)
      .padAngle(0.03);

    const color = d3.scaleOrdinal<string>()
      .range(['#009900', '#c70052','#FFC154','#003f5c']);

    const arc = d3.arc<any>()
      .outerRadius(this.outerRadius)
      .innerRadius(this.innerRadius);

    const svg = d3.select(element)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('class', 'shadow')
      .append('g')
      .attr('transform', `translate(${this.width / 2}, ${this.height / 2})`);

    const tooltip = d3.select(element)
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '5px')
      .style('background', 'rgba(0, 0, 0, 0.7)')
      .style('color', '#fff')
      .style('border-radius', '3px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    const path = svg.selectAll('path')
      .data(pie(this.resolutionStatusDataset))
      .enter()
      .append('path')
      .attr('d', arc as any)
      .attr('fill', (d, i) => color(d.data.name) as string)
      .on('mouseover', function(event, d) {
        const [x, y] = d3.pointer(event);
        tooltip
          .style('left', `${x + 15}px`)
          .style('top', `${y - 28}px`)
          .style('opacity', 0.9)
          .html(`<strong>${d.data.name.toUpperCase()}</strong>: ${d.data.percent}%`);
      })
      .on('mouseout', function() {
        tooltip.style('opacity', 0);
      });

    path.transition()
      .duration(1000)
      .attrTween('d', function (d) {
        const interpolate = d3.interpolate(
          { startAngle: 0, endAngle: 0 },
          d
        );
        return function (t) {
          return arc(interpolate(t)) as string;
        };
      });

    setTimeout(() => this.restOfTheData4(svg, pie, arc, color), 1000);
  }

  private restOfTheData4(svg: any, pie: any, arc: any, color: any): void {
    const text = svg.selectAll('text')
      .data(pie(this.resolutionStatusDataset))
      .enter()
      .append('text')
      .transition()
      .duration(200)
      .attr('transform', (d: any) => `translate(${arc.centroid(d)})`)
      .attr('dy', '.4em')
      .attr('text-anchor', 'middle')
      .text((d: any) => `${d.data.percent}%`)
      .style('fill', '#fff')
      .style('font-size', '18px');

    const legendRectSize = 20;
    const legendSpacing = 7;
    const legendHeight = legendRectSize + legendSpacing;

    const legend = svg.selectAll('.legend')
      .data(color.domain())
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d: any, i: any) => `translate(-35, ${(i * legendHeight) - 65})`);

    legend.append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .attr('rx', 20)
      .attr('ry', 20)
      .style('fill', color)
      .style('stroke', color);

    legend.append('text')
      .attr('x', 30)
      .attr('y', 15)
      .text((d: any) => d)
      .style('fill', '#16140d')
      .style('font-size', '16px');
  }

  private widthKeyScore = 100;
  private heightKeyScore = 100;
  private outerRadiusKeyScore = this.widthKeyScore / 2;
  private innerRadiusKeyScore = 30;
  private data : CallCategory[] = [];




  private createSunburstChart(): void {
    const width = 928;
    const height = width;
    const radius = width / 6;

    // Create the color scale.
    const color = d3.scaleOrdinal(
      // @ts-ignore
      d3.quantize(d3.interpolateRainbow, mockData.children.length + 1)
    );

    // Compute the layout.
    const hierarchy = d3
      .hierarchy(mockData)
      // @ts-ignore
      .sum((d) => d.value)
      // @ts-ignore
      .sort((a, b) => b.value - a.value);

    // @ts-ignore
    const root = d3.partition().size([2 * Math.PI, hierarchy.height + 1])(hierarchy);
    // @ts-ignore
    root.each((d) => (d.current = d));

    // Create the arc generator.
    const arc = d3
      .arc()
      // @ts-ignore
      .startAngle((d) => d.x0)
      // @ts-ignore
      .endAngle((d) => d.x1)
      // @ts-ignore
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      // @ts-ignore
      .innerRadius((d) => d.y0 * radius)
      // @ts-ignore
      .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1));

    // Create the SVG container.
    const svg = d3
      .create('svg')
      .attr('viewBox', [-width / 2, -height / 2, width, width])
      .style('font', '12.5px sans-serif');

    // Append the arcs.
    const path = svg
      .append('g')
      .selectAll('path')
      .data(root.descendants().slice(1))
      .join('path')
      .attr('fill', (d) => {
        // @ts-ignore
        while (d.depth > 1) d = d.parent;
        // @ts-ignore
        return color(d.data.name);
      })
      .attr('fill-opacity', (d) =>
        // @ts-ignore
        arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0
      )
      // @ts-ignore
      .attr('pointer-events', (d) => (arcVisible(d.current) ? 'auto' : 'none'))
      // @ts-ignore
      .attr('d', (d) => arc(d.current));

    // Make them clickable if they have children.
    path
      // @ts-ignore
      .filter((d) => d.children)
      .style('cursor', 'pointer')
      .on('click', clicked);

    const format = d3.format(',d');
    // Tooltip (box if you hover over a chart)
    path.append('title').text(
      (d) =>
        `${d
          .ancestors()
          // @ts-ignore
          .map((d) => d.data.name)
          .reverse()
          // @ts-ignore
          .join('/')}\n${format(d.value)}`
    );

    const label = svg
      .append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .selectAll('text')
      .data(root.descendants().slice(1))
      .join('text')
      .attr('dy', '0.35em')
      // @ts-ignore
      .attr('fill-opacity', (d) => +labelVisible(d.current))
      // @ts-ignore
      .attr('transform', (d) => labelTransform(d.current))
      // @ts-ignore
      .text((d) => d.data.name);

    const parent = svg
      .append('g')
      .datum({})
      .attr('pointer-events', 'all')
      .on('click', clicked);

    const backIconSVGString = `<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path opacity="1" fill="#1E3050" d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160zm352-160l-160 160c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L301.3 256 438.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0z"/></svg>`;

    const backIconWidth = 16;
    const backIconHeight = 16;

    const backIcon = parent
      .append('image')
      .attr(
        'xlink:href',
        'data:image/svg+xml,' + encodeURIComponent(backIconSVGString)
      )
      .attr('width', backIconWidth)
      .attr('height', backIconHeight)
      .attr('x', -backIconWidth / 2)
      .attr('y', -backIconHeight / 2)
      .style('cursor', 'pointer');

    const backText = parent
      .append('text')
      .text('Back')
      .attr('text-anchor', 'middle')
      .attr('dy', backIconHeight / 2 + 10);

    hideBack();
    parent.on('click', null);

    // Handle zoom on click.
    // @ts-ignore
    function clicked(event, p) {
      parent.datum(p.parent || root);

      root.each(
        (d) =>
          // @ts-ignore
          (d.target = {
            x0:
              Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) *
              2 *
              Math.PI,
            x1:
              Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) *
              2 *
              Math.PI,
            y0: Math.max(0, d.y0 - p.depth),
            y1: Math.max(0, d.y1 - p.depth),
          })
      );

      const t = svg.transition().duration(750);

      // Transition the data on all arcs, even the ones that aren’t visible,
      // so that if this transition is interrupted, entering arcs will start
      // the next transition from the desired position.
      // @ts-ignore
      path
        // @ts-ignore
        .transition(t)
        .tween('data', (d) => {
          // @ts-ignore
          const i = d3.interpolate(d.current, d.target);
          // @ts-ignore
          return (t) => (d.current = i(t));
        })
        // @ts-ignore
        .filter(function (d) {
          // @ts-ignore
          return +this.getAttribute('fill-opacity') || arcVisible(d.target);
        })
        .attr('fill-opacity', (d) =>
          // @ts-ignore
          arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0
        )
        // @ts-ignore
        .attr('pointer-events', (d) => (arcVisible(d.target) ? 'auto' : 'none'))
        // @ts-ignore
        .attrTween('d', (d) => () => arc(d.current));

      label
        // @ts-ignore
        .filter(function (d) {
          // @ts-ignore
          return +this.getAttribute('fill-opacity') || labelVisible(d.target);
        })
        // @ts-ignore
        .transition(t)
        // @ts-ignore
        .attr('fill-opacity', (d) => +labelVisible(d.target))
        // @ts-ignore
        .attrTween('transform', (d) => () => labelTransform(d.current));

      if (p === root) {
        hideBack();
      } else {
        showBack();
      }
    }

    function hideBack() {
      parent
        .select('image')
        .attr(
          'xlink:href',
          root.parent === null
            ? ''
            : 'data:image/svg+xml,' + encodeURIComponent(backIconSVGString)
        );
      parent.select('text').text(root.parent === null ? '' : 'Back');

      parent.select('image').style('cursor', 'default');
      parent.select('text').style('cursor', 'default');
      parent.on('click', null);
    }

    function showBack() {
      parent
        .select('image')
        .attr(
          'xlink:href',
          root.parent !== null
            ? ''
            : 'data:image/svg+xml,' + encodeURIComponent(backIconSVGString)
        );
      parent.select('text').text(root.parent !== null ? '' : 'Back');

      parent.select('image').style('cursor', 'pointer');
      parent.select('text').style('cursor', 'pointer');
      parent.on('click', clicked);
    }

    // @ts-ignore
    function arcVisible(d) {
      return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    // @ts-ignore
    function labelVisible(d) {
      return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    // @ts-ignore
    function labelTransform(d) {
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      const y = ((d.y0 + d.y1) / 2) * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    // @ts-ignore
    // document.getElementById('sunburst').appendChild(svg.node());
    this.chartSunburstContainer.nativeElement.appendChild(svg.node());
  }

  private createKeyScoreChart() {
    // @ts-ignore
    const element = this.keyScoreContainer.nativeElement;
    d3.select(element).select('svg').remove();

    const pie = d3.pie<number>().value((d) => d);
    const endAng = (d: number) => (d / 100) * Math.PI * 2;

    const bgArc = d3.arc<any>()
      .innerRadius(this.innerRadiusKeyScore)
      .outerRadius(this.outerRadiusKeyScore)
      .startAngle(0)
      .endAngle(Math.PI * 2);

    const dataArc = d3.arc<any>()
      .innerRadius(this.innerRadiusKeyScore)
      .outerRadius(this.outerRadiusKeyScore)
      .cornerRadius(15)
      .startAngle(0);

    const svg = d3.select(element)
      .append('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '0 0 100 100')
      .attr('class', 'shadow')
      .classed('svg-content', true);

    const path = svg.selectAll('g')
      .data(pie(this.meanKeyScore))
      .enter()
      .append('g')
      .attr('transform', `translate(${this.widthKeyScore / 2}, ${this.heightKeyScore / 2})`);

    path.append('path')
      .attr('d', bgArc as any)
      .style('stroke-width', 5)
      .attr('fill', 'rgba(0,0,0,0.2)');

    path.append('path')
      .attr('fill', '#009900')
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attrTween('d', (d) => this.arcTween(d, dataArc, endAng));

    path.append('text')
      .attr('fill', '#fff')
      .attr('font-size', '1.3em')
      .attr('text-anchor', 'middle')
      .attr('x', -13)
      .attr('y', 8)
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attr('fill', '#000')
      .text(this.meanKeyScore[0]);

    path.append('text')
      .attr('fill', '#fff')
      .attr('class', 'ratingtext')
      .attr('font-size', '1.0em')
      .attr('text-anchor', 'middle')
      .attr('x', 10)
      .attr('y', 8)
      .text('%')
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attr('fill', '#000');
  }


  private arcTween(d: any, dataArc: any, endAng: any): (t: number) => string {
    const interpolate = d3.interpolate(d.startAngle, endAng(d.data));
    return (t) => {
      d.endAngle = interpolate(t);
      return dataArc(d);
    };
  }


  private createMaxDurationChart() {
    // @ts-ignore
    const element = this.maxDurationContainer.nativeElement;
    d3.select(element).select('svg').remove();

    const pie = d3.pie<number>().value((d) => d);
    const endAng = (d: number) => (d / 100) * Math.PI * 2;

    const bgArc = d3.arc<any>()
      .innerRadius(this.innerRadiusKeyScore)
      .outerRadius(this.outerRadiusKeyScore)
      .startAngle(0)
      .endAngle(Math.PI * 2);

    const dataArc = d3.arc<any>()
      .innerRadius(this.innerRadiusKeyScore)
      .outerRadius(this.outerRadiusKeyScore)
      .cornerRadius(15)
      .startAngle(0);

    const svg = d3.select(element)
      .append('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '0 0 100 100')
      .attr('class', 'shadow')
      .classed('svg-content', true);

    const path = svg.selectAll('g')
      .data(pie([90]))
      .enter()
      .append('g')
      .attr('transform', `translate(${this.widthKeyScore / 2}, ${this.heightKeyScore / 2})`);

    path.append('path')
      .attr('d', bgArc as any)
      .style('stroke-width', 5)
      .attr('fill', 'rgba(0,0,0,0.2)');

    path.append('path')
      .attr('fill', '#01BAEF')
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attrTween('d', (d) => this.arcTween(d, dataArc, endAng));

    path.append('text')
      .attr('fill', '#fff')
      .attr('font-size', '1.0em')
      .attr('text-anchor', 'middle')
      .attr('x', -13)
      .attr('y', 8)
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attr('fill', '#000')
      .text(this.maxCallDuration);

    path.append('text')
      .attr('fill', '#fff')
      .attr('class', 'ratingtext')
      .attr('font-size', '0.6em')
      .attr('text-anchor', 'middle')
      .attr('x', 10)
      .attr('y', 8)
      .text('Min.')
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attr('fill', '#000');
  }


  private createAvgDurationChart() {
    // @ts-ignore
    const element = this.avgDurationContainer.nativeElement;
    d3.select(element).select('svg').remove();

    const pie = d3.pie<number>().value((d) => d);
    const endAng = (d: number) => (d / 100) * Math.PI * 2;

    const bgArc = d3.arc<any>()
      .innerRadius(this.innerRadiusKeyScore)
      .outerRadius(this.outerRadiusKeyScore)
      .startAngle(0)
      .endAngle(Math.PI * 2);

    const dataArc = d3.arc<any>()
      .innerRadius(this.innerRadiusKeyScore)
      .outerRadius(this.outerRadiusKeyScore)
      .cornerRadius(15)
      .startAngle(0);

    const svg = d3.select(element)
      .append('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '0 0 100 100')
      .attr('class', 'shadow')
      .classed('svg-content', true);

    const path = svg.selectAll('g')
      .data(pie([60]))
      .enter()
      .append('g')
      .attr('transform', `translate(${this.widthKeyScore / 2}, ${this.heightKeyScore / 2})`);

    path.append('path')
      .attr('d', bgArc as any)
      .style('stroke-width', 5)
      .attr('fill', 'rgba(0,0,0,0.2)');

    path.append('path')
      .attr('fill', '#FF5733')
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attrTween('d', (d) => this.arcTween(d, dataArc, endAng));

    path.append('text')
      .attr('fill', '#fff')
      .attr('font-size', '1.0em')
      .attr('text-anchor', 'middle')
      .attr('x', -13)
      .attr('y', 8)
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attr('fill', '#000')
      .text(this.avgCallDuration);

    path.append('text')
      .attr('fill', '#fff')
      .attr('class', 'ratingtext')
      .attr('font-size', '0.6em')
      .attr('text-anchor', 'middle')
      .attr('x', 10)
      .attr('y', 8)
      .text('Min.')
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attr('fill', '#000');
  }

  private createTotalCallsChart() {
    // @ts-ignore
    const element = this.callsContainer.nativeElement;
    d3.select(element).select('svg').remove();

    const pie = d3.pie<number>().value((d) => d);
    const endAng = (d: number) => (d / 100) * Math.PI * 2;

    const bgArc = d3.arc<any>()
      .innerRadius(this.innerRadiusKeyScore)
      .outerRadius(this.outerRadiusKeyScore)
      .startAngle(0)
      .endAngle(Math.PI * 2);

    const dataArc = d3.arc<any>()
      .innerRadius(this.innerRadiusKeyScore)
      .outerRadius(this.outerRadiusKeyScore)
      .cornerRadius(15)
      .startAngle(0);

    const svg = d3.select(element)
      .append('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '0 0 100 100')
      .attr('class', 'shadow')
      .classed('svg-content', true);

    const path = svg.selectAll('g')
      .data(pie([95]))
      .enter()
      .append('g')
      .attr('transform', `translate(${this.widthKeyScore / 2}, ${this.heightKeyScore / 2})`);

    path.append('path')
      .attr('d', bgArc as any)
      .style('stroke-width', 5)
      .attr('fill', 'rgba(0,0,0,0.2)');

    path.append('path')
      .attr('fill', '#c70052')
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attrTween('d', (d) => this.arcTween(d, dataArc, endAng));

    path.append('text')
      .attr('fill', '#fff')
      .attr('font-size', '1.3em')
      .attr('text-anchor', 'middle')
      .attr('x', -4)
      .attr('y', 8)
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attr('fill', '#000')
      .text(this.totalCalls);
  }


  private createMinDurationChart() {
    // @ts-ignore
    const element = this.minDurationContainer.nativeElement;
    d3.select(element).select('svg').remove();

    const pie = d3.pie<number>().value((d) => d);
    const endAng = (d: number) => (d / 100) * Math.PI * 2;

    const bgArc = d3.arc<any>()
      .innerRadius(this.innerRadiusKeyScore)
      .outerRadius(this.outerRadiusKeyScore)
      .startAngle(0)
      .endAngle(Math.PI * 2);

    const dataArc = d3.arc<any>()
      .innerRadius(this.innerRadiusKeyScore)
      .outerRadius(this.outerRadiusKeyScore)
      .cornerRadius(15)
      .startAngle(0);

    const svg = d3.select(element)
      .append('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '0 0 100 100')
      .attr('class', 'shadow')
      .classed('svg-content', true);

    const path = svg.selectAll('g')
      .data(pie([30]))
      .enter()
      .append('g')
      .attr('transform', `translate(${this.widthKeyScore / 2}, ${this.heightKeyScore / 2})`);

    path.append('path')
      .attr('d', bgArc as any)
      .style('stroke-width', 5)
      .attr('fill', 'rgba(0,0,0,0.2)');

    path.append('path')
      .attr('fill', '#DC143C')
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attrTween('d', (d) => this.arcTween(d, dataArc, endAng));

    path.append('text')
      .attr('fill', '#fff')
      .attr('font-size', '1.0em')
      .attr('text-anchor', 'middle')
      .attr('x', -13)
      .attr('y', 8)
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attr('fill', '#000')
      .text(this.smallCallDuration);

    path.append('text')
      .attr('fill', '#fff')
      .attr('class', 'ratingtext')
      .attr('font-size', '0.6em')
      .attr('text-anchor', 'middle')
      .attr('x', 10)
      .attr('y', 8)
      .text('Min.')
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attr('fill', '#000');
  }


  private createAvgCallsPerDayChart() {
    // @ts-ignore
    const element = this.AvgCallsPerDayContainer.nativeElement;
    d3.select(element).select('svg').remove();

    const pie = d3.pie<number>().value((d) => d);
    const endAng = (d: number) => (d / 100) * Math.PI * 2;


    const bgArc = d3.arc<any>()
      .innerRadius(this.innerRadiusKeyScore)
      .outerRadius(this.outerRadiusKeyScore)
      .startAngle(0)
      .endAngle(Math.PI * 2);

    const dataArc = d3.arc<any>()
      .innerRadius(this.innerRadiusKeyScore)
      .outerRadius(this.outerRadiusKeyScore)
      .cornerRadius(15)
      .startAngle(0);

    const svg = d3.select(element)
      .append('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '0 0 100 100')
      .attr('class', 'shadow')
      .classed('svg-content', true);

    const path = svg.selectAll('g')
      .data(pie([55]))
      .enter()
      .append('g')
      .attr('transform', `translate(${this.widthKeyScore / 2}, ${this.heightKeyScore / 2})`);

    path.append('path')
      .attr('d', bgArc as any)
      .style('stroke-width', 5)
      .attr('fill', 'rgba(0,0,0,0.2)');

    path.append('path')
      .attr('fill', '#FFBF00')
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attrTween('d', (d) => this.arcTween(d, dataArc, endAng));

    path.append('text')
      .attr('fill', '#fff')
      .attr('font-size', '1.5em')
      .attr('text-anchor', 'middle')
      .attr('x', -4)
      .attr('y', 8)
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attr('fill', '#000')
      .text(this.avgCallsPerDay);

    path.append('text')
      .attr('fill', '#fff')
      .attr('class', 'ratingtext')
      .attr('font-size', '0.6em')
      .attr('text-anchor', 'middle')
      .attr('x', 10)
      .attr('y', 8)
      .transition()
      .ease(d3.easeSinInOut)
      .duration(750)
      .attr('fill', '#000');
  }

  private svg: any;
  private margin = 50;
  private width2 = 1580 - (this.margin * 2);
  private height2 = 400 - (this.margin * 2);

  readonly panelOpenState = signal(false);

  private createSvg(): void {
    const svgContainer = d3.select('figure#bar');

    // Remove previous SVG if any
    svgContainer.select('svg').remove();

    // Create the SVG container
    this.svg = svgContainer.append('svg')
      .attr('width', this.width2 + this.margin * 2)
      .attr('height', this.height2 + this.margin * 2)
      .append('g')
      .attr('transform', `translate(${this.margin},${this.margin})`);

    // Define the gradient
    const gradient = this.svg.append('defs')
      .append('linearGradient')
      .attr('id', 'barGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ffa600')
      .attr('stop-opacity', 1);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#003f5c')
      .attr('stop-opacity', 1);
  }

  private drawBars(data: any[]): void {
    this.createSvg();

    // Add chart title
    this.svg.append('text')
      .attr('x', this.width2 / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-size', '26px')
      .style('font-weight', 'bold')
      .text('CALL CATEGORY VS FREQUENCY');

    // Scales and axes
    const x = d3.scaleBand()
      .range([0, this.width2])
      .domain(data.map(d => d.callCategory.substring(0, 18).toUpperCase()))
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.frequency)! + 40])
      .range([this.height2, 0]);

    this.svg.append('g')
      .attr('transform', `translate(0,${this.height2})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold');

    this.svg.append('g').call(d3.axisLeft(y));

    // Bars with gradient fill
    this.svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      // @ts-ignore
      .attr('x', d => x(d.callCategory.substring(0, 18).toUpperCase())!)
      .attr('width', x.bandwidth())
      .attr('fill', 'url(#barGradient)')
      .attr('y', this.height2)
      .attr('height', 0)
      .transition()
      .duration(800)
      // @ts-ignore
      .attr('y', d => y(d.frequency))
      // @ts-ignore
      .attr('height', d => this.height2 - y(d.frequency));

    // Line chart
    const line = d3.line<any>()
      .x(d => x(d.callCategory.substring(0, 18).toUpperCase())! + x.bandwidth() / 2)
      .y(d => y(d.frequency));

    this.svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#C70039')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add data points and labels
    const points = this.svg.selectAll('.dot')
      .data(data)
      .enter();

    points.append('circle')
      .attr('class', 'dot')
      // @ts-ignore
      .attr('cx', d => x(d.callCategory.substring(0, 18).toUpperCase())! + x.bandwidth() / 2)
      // @ts-ignore
      .attr('cy', d => y(d.frequency))
      .attr('r', 5)
      .attr('fill', '#C70039');

    points.append('text')
      .attr('class', 'label')
      // @ts-ignore
      .attr('x', d => x(d.callCategory.substring(0, 18).toUpperCase())! + x.bandwidth() / 2)
      // @ts-ignore
      .attr('y', d => y(d.frequency) - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      // @ts-ignore
      .text(d => d.frequency);
  }


}

