import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import * as d3 from "d3";
import {AuthService} from "../HttpServices/auth.service";
import {DomSanitizer} from "@angular/platform-browser";
import { Chart } from 'chart.js';
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {ChartsService} from "../charts.service";

export interface CallCategory{
  callCategory: string,
  frequency: number,

}
@Component({
  selector: 'app-reporting-dashboard',
  templateUrl: './reporting-dashboard.component.html',
  styleUrls: ['./reporting-dashboard.component.scss']
})
export class ReportingDashboardComponent implements OnInit{
  private closureCategoriesChart: any;
  private ASAChart: any;
  private agentMonthlySpendChart: any;
  private AHTChart: any;
  private callAbandonmentChart: any;

  constructor(private elementRef: ElementRef,private elRef: ElementRef,private chartService: ChartsService,private authService: AuthService, private defaultAnalyticsService: CallAnalyticsProxiesService, private safeURL: DomSanitizer) {
  }
  meanKeyScore: number[] = [];
  customerSentiment: CallCategory[] = [];
  parsedData: any = [];
  avgCallDuration: number = 0;
  maxCallDuration: number = 0;
  smallCallDuration: number = 0;

  mockdata = [
    {
      "callId": "6k0WcpYB6XFkcpoZg4QWB6ooAQSI1uWQ",
      "agentName": "Akshay Kumar",
      "customerSatisfaction": "Yes",
      "callHoldPermission": "The call was not put on hold",
      "transferPermission": "The call was not transferred",
      "customerProblem": "The customer wanted information about upgrading their credit card to a higher tier.",
      "custSuppSentiment": "Positive",
      "keyScore": 100,
      "summary": "The customer contacted customer support to inquire about upgrading their credit card. The support agent provided information about the available options, benefits, and annual fees. The customer provided their details for the upgrade, and the support agent assured them of further instructions via email. The conversation ended on a positive note with the customer expressing gratitude.",
      "agentId": "3",
      "callCategory": "credit card sales application",
      "dateTime": "2023-09-07T01:31:43.000+00:00",
      "callDuration": 106,
      "remark": null,
      "managerId": 100,
      "managerName": "Shashank Naik"
    },
    {
      "callId": "eCUoWj5IA7ZKTvL4TvDUwodMNEamE6vx",
      "agentName": "Akshay Kumar",
      "customerSatisfaction": "Yes",
      "callHoldPermission": "The call was not put on hold",
      "transferPermission": "The call was not transferred",
      "customerProblem": "Customer is interested in applying for a personal loan and wants details about the terms, interest rates, prerequisites, and documents required.",
      "custSuppSentiment": "Positive",
      "keyScore": 90,
      "summary": "The customer inquired about personal loan details, including interest rates, loan amounts, and repayment options. They expressed interest in obtaining a personal loan and requested in-person assistance for the application process. The support agent provided all the necessary information and scheduled a home visit for the customer.",
      "agentId": "3",
      "callCategory": "personal loan",
      "dateTime": "2023-09-08T01:15:58.000+00:00",
      "callDuration": 100,
      "remark": null,
      "managerId": 100,
      "managerName": "Shashank Naik"
    },
    {
      "callId": "qa2Dm2mTWjnsNHerVEnfp1JKOtIm7qUf",
      "agentName": "Akshay Kumar",
      "customerSatisfaction": "Yes",
      "callHoldPermission": "The call was not put on hold",
      "transferPermission": "The call was not transferred",
      "customerProblem": "The customer is interested in applying for a personal loan and wants details about the terms, interest rates, prerequisites, and documents required. The customer also requests in-person assistance for the application process.",
      "custSuppSentiment": "Positive",
      "keyScore": 90,
      "summary": "The customer inquired about personal loan details, including interest rates, loan amounts, and repayment options. They also expressed a preference for in-person assistance and scheduled a home visit for the application process.",
      "agentId": "3",
      "callCategory": "personal loan",
      "dateTime": "2023-09-04T01:17:08.000+00:00",
      "callDuration": 100,
      "remark": null,
      "managerId": 100,
      "managerName": "Shashank Naik"
    },
    {
      "callId": "qCFtfLM8Mz5YEFV6Q84xMDSqlMeyyz0w",
      "agentName": "Akshay Kumar",
      "customerSatisfaction": "Yes",
      "callHoldPermission": "The call was not put on hold",
      "transferPermission": "The call was not transferred",
      "customerProblem": "Customer is uncertain about the rewards program on their credit card",
      "custSuppSentiment": "Positive",
      "keyScore": 100,
      "summary": "The customer had questions about the rewards program on their platinum rewards card. The support agent provided a clear explanation of how the point system works and addressed the customer's concerns about limitations and expiration dates. The conversation ended on a positive note with the customer expressing gratitude for the explanation.",
      "agentId": "3",
      "callCategory": "credit card frequently asked questions",
      "dateTime": "2023-09-04T01:18:05.000+00:00",
      "callDuration": 69,
      "remark": null,
      "managerId": 100,
      "managerName": "Shashank Naik"
    },
    {
      "callId": "qpAB5rZPnAmpOPqWHncqnWfJuoOeCoGM",
      "agentName": "Akshay Kumar",
      "customerSatisfaction": "Uncertain",
      "callHoldPermission": "The call was not put on hold",
      "transferPermission": "The call was not transferred",
      "customerProblem": "Customer wants to understand more about home loan options and needs guidance through the application process",
      "custSuppSentiment": "Positive",
      "keyScore": 75,
      "summary": "The customer inquired about home loan options and the agent provided details about interest rates, loan amount, tenures, down payment requirements, and special schemes. The agent also informed the customer about the required documents for the application process. The customer requested in-person assistance, and a home visit was scheduled for Saturday at 11am.",
      "agentId": "3",
      "callCategory": "home loan",
      "dateTime": "2023-09-08T01:22:04.000+00:00",
      "callDuration": 117,
      "remark": null,
      "managerId": 100,
      "managerName": "Shashank Naik"
    },
    {
      "callId": "S6pIDXHaiBMpJzaNfcwFqdm4B2gl0Loh",
      "agentName": "Akshay Kumar",
      "customerSatisfaction": "Yes",
      "callHoldPermission": "The call was not put on hold",
      "transferPermission": "The call was not transferred",
      "customerProblem": "Understanding the dance order due and minimum due on the credit card statement",
      "custSuppSentiment": "Positive",
      "keyScore": 100,
      "summary": "The customer had a query about understanding the dance order due and minimum due on the credit card statement. The support agent provided a clear and concise explanation, resolving the customer's query. The conversation ended on a positive note.",
      "agentId": "3",
      "callCategory": "credit card frequently asked questions",
      "dateTime": "2023-09-08T01:19:55.000+00:00",
      "callDuration": 41,
      "remark": null,
      "managerId": 100,
      "managerName": "Shashank Naik"
    },
    {
      "callId": "xzu2i5J2uqIaKHPzT3dmko1Y9owbhabU",
      "agentName": "Akshay Kumar",
      "customerSatisfaction": "Yes",
      "callHoldPermission": "The call was not put on hold",
      "transferPermission": "The call was not transferred",
      "customerProblem": "Customer was charged an overdraft fee without receiving any notification",
      "custSuppSentiment": "Positive",
      "keyScore": 100,
      "summary": "The customer was frustrated with the lack of notification about the overdraft fee. The support agent apologized and waived the fee as a one-time courtesy. They also promised to update the customer's contact information to prevent future communication issues.",
      "agentId": "3",
      "callCategory": "banking frequently asked questions",
      "dateTime": "2023-09-05T01:13:08.000+00:00",
      "callDuration": 79,
      "remark": null,
      "managerId": 100,
      "managerName": "Shashank Naik"
    },
    {
      "callId": "ZEamOSVzvNd9YXJt7nhvu9Jt70XMIxOB",
      "agentName": "Akshay Kumar",
      "customerSatisfaction": "Yes",
      "callHoldPermission": "The call was not put on hold",
      "transferPermission": "The call was not transferred",
      "customerProblem": "The customer wanted information about upgrading their credit card to a higher tier.",
      "custSuppSentiment": "Positive",
      "keyScore": 100,
      "summary": "The customer contacted customer support to inquire about upgrading their credit card. The support agent provided information about the available options, benefits, and annual fees. The customer provided their details for the upgrade, and the support agent assured them of further instructions via email. The conversation ended on a positive note with the customer expressing gratitude.",
      "agentId": "3",
      "callCategory": "credit card sales application",
      "dateTime": "2023-09-04T01:31:48.000+00:00",
      "callDuration": 106,
      "remark": null,
      "managerId": 100,
      "managerName": "Shashank Naik"
    }
  ];

  agents = [
    {
      id: 0,
      "Agent Name": "Aiden Rodriguez",
      "Recruitment Length": "4 years 5 months",
      "Recruitment Date": "September 2017",
      Rank: 15,
      Spend: "$56,935",
      "Spend Percent": "7.4%",
    },
    {
      id: 1,
      "Agent Name": "Alexa Wong",
      "Recruitment Length": "2 years 11 months",
      "Recruitment Date": "December 2019",
      Rank: 3,
      Spend: "$34,206",
      "Spend Percent": "4.5%",
    },
    {
      id: 2,
      "Agent Name": "Amanda Kim",
      "Recruitment Length": "1 year 10 months",
      "Recruitment Date": "September 2020",
      Rank: 9,
      Spend: "$44,782",
      "Spend Percent": "5.9%",
    },
    {
      id: 3,
      "Agent Name": "Benjamin Thompson",
      "Recruitment Length": "3 years 1 month",
      "Recruitment Date": "November 2017",
      Rank: 11,
      Spend: "$62,938",
      "Spend Percent": "8.2%",
    },
    {
      id: 4,
      "Agent Name": "Bryant Johnson",
      "Recruitment Length": "5 years 6 months",
      "Recruitment Date": "May 2017",
      Rank: 16,
      Spend: "$58,749",
      "Spend Percent": "7.7%",
    },
    {
      id: 5,
      "Agent Name": "Caitlyn Williams",
      "Recruitment Length": "1 year 4 months",
      "Recruitment Date": "September 2021",
      Rank: 5,
      Spend: "$40,000",
      "Spend Percent": "5.2%",
    },
    {
      id: 6,
      "Agent Name": "Cameron Davis",
      "Recruitment Length": "4 years 9 months",
      "Recruitment Date": "January 2018",
      Rank: 10,
      Spend: "$47,399",
      "Spend Percent": "6.2%",
    },
    {
      id: 7,
      "Agent Name": "Christopher Smith",
      "Recruitment Length": "2 years 8 months",
      "Recruitment Date": "January 2020",
      Rank: 4,
      Spend: "$33,678",
      "Spend Percent": "4.4%",
    },
    {
      id: 8,
      "Agent Name": "David Anderson",
      "Recruitment Length": "6 years 8 months",
      "Recruitment Date": "August 2015",
      Rank: 7,
      Spend: "$79,056",
      "Spend Percent": "10.4%",
    },
    {
      id: 9,
      "Agent Name": "Elizabeth Thompson",
      "Recruitment Length": "3 years 2 months",
      "Recruitment Date": "November 2017",
      Rank: 13,
      Spend: "$63,847",
      "Spend Percent": "8.3%",
    },
    {
      id: 10,
      "Agent Name": "Emily Davis",
      "Recruitment Length": "4 years 5 months",
      "Recruitment Date": "September 2017",
      Rank: 15,
      Spend: "$56,935",
      "Spend Percent": "7.4%",
    },
    {
      id: 11,
      "Agent Name": "James Anderson",
      "Recruitment Length": "6 years 1 month",
      "Recruitment Date": "December 2015",
      Rank: 8,
      Spend: "$75,123",
      "Spend Percent": "9.8%",
    },
    {
      id: 12,
      "Agent Name": "Jennifer Williams",
      "Recruitment Length": "1 year 7 months",
      "Recruitment Date": "February 2021",
      Rank: 6,
      Spend: "$40,921",
      "Spend Percent": "5.3%",
    },
    {
      id: 13,
      "Agent Name": "Jessica Thompson",
      "Recruitment Length": "3 years 1 month",
      "Recruitment Date": "November 2017",
      Rank: 11,
      Spend: "$62,938",
      "Spend Percent": "8.2%",
    },
    {
      id: 14,
      "Agent Name": "Jessica Williams",
      "Recruitment Length": "1 year 10 months",
      "Recruitment Date": "September 2020",
      Rank: 9,
      Spend: "$44,782",
      "Spend Percent": "5.9%",
    },
    {
      id: 15,
      "Agent Name": "John Smith",
      "Recruitment Length": "2 years 11 months",
      "Recruitment Date": "December 2019",
      Rank: 3,
      Spend: "$34,206",
      "Spend Percent": "4.5%",
    },
    {
      id: 16,
      "Agent Name": "Karen Thompson",
      "Recruitment Length": "3 years 3 months",
      "Recruitment Date": "October 2017",
      Rank: 18,
      Spend: "$66,942",
      "Spend Percent": "8.8%",
    },
    {
      id: 17,
      "Agent Name": "Lauren Davis",
      "Recruitment Length": "4 years 9 months",
      "Recruitment Date": "January 2018",
      Rank: 10,
      Spend: "$47,399",
      "Spend Percent": "6.2%",
    },
    {
      id: 18,
      "Agent Name": "Mark Johnson",
      "Recruitment Length": "5 years 6 months",
      "Recruitment Date": "May 2017",
      Rank: 16,
      Spend: "$58,749",
      "Spend Percent": "7.7%",
    },
    {
      id: 19,
      "Agent Name": "Michael Smith",
      "Recruitment Length": "2 years 10 months",
      "Recruitment Date": "January 2020",
      Rank: 2,
      Spend: "$32,845",
      "Spend Percent": "4.3%",
    },
    {
      id: 20,
      "Agent Name": "Nicole Davis",
      "Recruitment Length": "4 years 3 months",
      "Recruitment Date": "October 2017",
      Rank: 20,
      Spend: "$65,344",
      "Spend Percent": "8.6%",
    }];

  ngOnInit() {
    const sideBar: HTMLElement = document.querySelector('.sidebar') as HTMLElement;
    if (sideBar.classList.contains('close')) {
      console.log("SideNav is closed already.");
    } else {
      sideBar.classList.toggle('close');
    }

    const select = document.getElementById('agentSelect') as HTMLSelectElement;
    this.agents.forEach((item, index) => {
      const option = document.createElement('option');
      option.value = index.toString();
      option.text = item['Agent Name'];
      select.add(option);
    });
    // document.body.classList.add('dark');
    // this.createChart();



    // this.defaultAnalyticsService.fetchAgentStats(this.agentId.toString()).subscribe((response: any) => {
      for (let i = 0;i < this.mockdata.length;i++) {
        const index = this.data.findIndex(call => call.callCategory === this.mockdata[i].callCategory);
        if (index !== -1) {
          this.data[index].frequency += 1;
        } else {
          this.data.push({callCategory: this.mockdata[i].callCategory,frequency: 1 });
        }
      }




      for (let i = 0;i < this.mockdata.length;i++) {
        const index = this.customerSentiment.findIndex(call => call.callCategory === this.mockdata[i].custSuppSentiment);
        if (index !== -1) {
          this.customerSentiment[index].frequency += 1;
        } else {
          this.customerSentiment.push({frequency: 1,callCategory: this.mockdata[i].custSuppSentiment });
        }
      }

      for (let i = 0;i < this.mockdata.length;i++) {
        const index = this.customerSatisfaction.findIndex(call => call.callCategory === this.mockdata[i].customerSatisfaction);
        if (index !== -1) {
          this.customerSatisfaction[index].frequency += 1;
        } else {
          this.customerSatisfaction.push({frequency: 1,callCategory: this.mockdata[i].customerSatisfaction });
        }
      }

      let keyScore = 0;
      for(let data of this.mockdata){
        keyScore += data.keyScore;
      }

      for(let category of this.data){
        this.dataset.push({name: category.callCategory,percent: Math.ceil((category.frequency/this.mockdata.length)*100) });
      }

      for(let sentiment of this.customerSentiment){
        this.datasetSentiment.push({name: sentiment.callCategory,percent: Math.ceil((sentiment.frequency/this.mockdata.length)*100) });
      }

      for(let satisfaction of this.customerSatisfaction){
        this.datasetSatisfaction.push({name: satisfaction.callCategory,percent: Math.ceil((satisfaction.frequency/this.mockdata.length)*100) });
      }

      this.meanKeyScore.push(Math.ceil(keyScore/this.mockdata.length));
    // });

    // setTimeout(()=>{
      this.createChart();
      this.createKeyScoreChart();
      this.createChart2();
      this.createChart3();
      this.createSvg();
      this.drawBars(this.data);

    // },1000);

  }

  customerSatisfaction: CallCategory[] = [];

  // data: CallCategory[] = [];
  theme: string = 'dark';
  agentId: number = this.authService.userId;
  managerId: number = this.authService.roleType == 'Manager' ? this.authService.managerId : 0;

  roleName: string = this.authService.roleType;
  adminStreamLitURL: any = this.safeURL.bypassSecurityTrustResourceUrl(`http://52.172.252.7:5011/?admin=1`);
  agentStreamLitURL: any = this.safeURL.bypassSecurityTrustResourceUrl(`http://52.172.252.7:5011/?aid=${this.agentId}&theme=${this.theme}`);
  managerStreamLitURL: any = this.safeURL.bypassSecurityTrustResourceUrl(`http://52.172.252.7:5011/?mid=${this.managerId}&theme=${this.theme}`);

  @ViewChild('chart', {static: true}) private chartContainer: ElementRef | undefined;
  @ViewChild('chart2', {static: true}) private chartContainer2: ElementRef | undefined;
  @ViewChild('chart3', {static: true}) private chartContainer3: ElementRef | undefined;
  @ViewChild('keyScore', {static: true}) private keyScoreContainer: ElementRef | undefined;

  private dataset : any = [];
  private datasetSentiment: any = [];
  private datasetSatisfaction: any = []

  private width = 300;
  private height = 300;
  private outerRadius = this.width / 2;
  private innerRadius = 100;


  private createChart(): void {
    // @ts-ignore
    const element = this.chartContainer.nativeElement;

    const pie = d3.pie<any>()
      .value((d: any) => d.percent)
      .sort(null)
      .padAngle(0.03);

    const color = d3.scaleOrdinal<string>()
      .range(['#697060', '#4a433d']);

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
      .attr('fill', (d, i) => color(d.data.name) as string);

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

    setTimeout(() => this.restOfTheData(svg, pie, arc, color), 1000);
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
      .style('font-size', '14px');

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


  private createChart2(): void {
    // @ts-ignore
    const element = this.chartContainer2.nativeElement;

    const pie = d3.pie<any>()
      .value((d: any) => d.percent)
      .sort(null)
      .padAngle(0.03);

    const color = d3.scaleOrdinal<string>()
      .range(['#697060', '#4a433d']);

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
      .data(pie(this.datasetSentiment))
      .enter()
      .append('path')
      .attr('d', arc as any)
      .attr('fill', (d, i) => color(d.data.name) as string);

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
      .style('font-size', '14px');

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

    const pie = d3.pie<any>()
      .value((d: any) => d.percent)
      .sort(null)
      .padAngle(0.03);

    const color = d3.scaleOrdinal<string>()
      .range(['#697060', '#4a433d']);

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
      .data(pie(this.datasetSatisfaction))
      .enter()
      .append('path')
      .attr('d', arc as any)
      .attr('fill', (d, i) => color(d.data.name) as string);

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
      .style('font-size', '14px');

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

  private createKeyScoreChart() {
    // @ts-ignore
    const element = this.keyScoreContainer.nativeElement;

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
      .attr('fill', '#DC143C')
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
      .attr('font-size', '0.6em')
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


  // private data = callData;
  private svg: any;
  private margin = 50;
  private width2 = 568 - (this.margin * 2);
  private height2 = 400 - (this.margin * 2);



  private createSvg(): void {
    this.svg = d3.select('figure#bar')
      .append('svg')
      .attr('width', this.width2 + (this.margin * 2))
      .attr('height', this.height2 + (this.margin * 2))
      .append('g')
      .attr('transform', 'translate(' + this.margin + ',' + this.margin + ')');
  }

  // private drawBars(data: any[]): void {
  //   const x = d3.scaleBand()
  //     .range([0, this.width2])
  //     .domain(this.data.map(d => d.callCategory))
  //     .padding(0.2);
  //
  //   this.svg.append('g')
  //     .attr('transform', 'translate(0,' + this.height2 + ')')
  //     .call(d3.axisBottom(x))
  //     .selectAll('text')
  //     .attr('transform', 'translate(-10,0)rotate(-45)')
  //     .style('text-anchor', 'end');
  //
  //   const y = d3.scaleLinear()
  //     .domain([0, 4])
  //     .range([this.height2, 0]);
  //
  //   this.svg.append('g')
  //     .call(d3.axisLeft(y));
  //
  //   // Create tooltip
  //   const tooltip = d3.select('body').append('div')
  //     .attr('class', 'tooltip')
  //     .style('opacity', 0);
  //
  //   // Add bars with animations
  //   this.svg.selectAll('bars')
  //     .data(data)
  //     .enter()
  //     .append('rect')
  //     .attr('x', (d:any) => x(d.callCategory))
  //     .attr('width', x.bandwidth())
  //     .attr('fill', '#FFB6C1')
  //     .attr('height', 0) // Initial height 0 for animation
  //     .attr('y', this.height2) // Initial y at the bottom for animation
  //     .transition()
  //     .duration(800)
  //     .attr('y', (d: any) => y(d.frequency))
  //     .attr('height', (d: any) => this.height - y(d.frequency));
  // }


  private drawBars(data: any[]): void {
    const x = d3.scaleBand()
      .range([0, this.width2])
      .domain(this.data.map(d => d.callCategory.toUpperCase()))
      .padding(0.2);

    this.svg.append('g')
      .attr('transform', 'translate(0,' + this.height2 + ')')
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'middle')
      .attr('x', 0)
      .attr('y', 10)
      .style('font-size', '12px'); // Adjust font size if needed

    const y = d3.scaleLinear()
      .domain([0, 4])
      .range([this.height2, 0]);

    this.svg.append('g')
      .call(d3.axisLeft(y));

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    // Add bars with animations
    this.svg.selectAll('bars')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d:any) => x(d.callCategory.toUpperCase()))
      .attr('width', x.bandwidth())
      .attr('fill', '#FFB6C1')
      .attr('height', 0) // Initial height 0 for animation
      .attr('y', this.height2) // Initial y at the bottom for animation
      .transition()
      .duration(800)
      .attr('y', (d: any) => y(d.frequency))
      .attr('height', (d: any) => this.height2 - y(d.frequency));
  }


  //
  // ngAfterViewInit() {
  //   // Handling chart resizing and sidebar functionality
  //   window.addEventListener('resize', () => {
  //     this.resizeCharts2();
  //     this.agentChartsDimensions();
  //   });
  //
  //   const charts = document.getElementById('mainCharts');
  //   const agentCharts = document.getElementById('agentCharts');
  //   const sidebarIcons = document.querySelectorAll('.sidebar-icon');
  //   const menuSwitches = [sidebarIcons[0], sidebarIcons[1]];
  //
  //   menuSwitches[0].addEventListener('click', (e) => {
  //     if (!menuSwitches[0].classList.contains('active')) {
  //       menuSwitches[1].classList.remove('active');
  //       menuSwitches[0].classList.add('active');
  //       // @ts-ignore
  //       charts.classList.remove('hidden');
  //       // @ts-ignore
  //       agentCharts.classList.remove('active');
  //     }
  //   });
  //
  //   menuSwitches[1].addEventListener('click', (e) => {
  //     if (!menuSwitches[1].classList.contains('active')) {
  //       menuSwitches[0].classList.remove('active');
  //       menuSwitches[1].classList.add('active');
  //       // @ts-ignore
  //       charts.classList.add('hidden');
  //       // @ts-ignore
  //       agentCharts.classList.add('active');
  //       this.agentChartsDimensions();
  //     }
  //   });
  //
  //   const select = document.getElementById('agentSelect') as HTMLSelectElement;
  //   select.addEventListener('change', () => {
  //     this.updateAgentDetails(select.value);
  //   });
  //
  //   this.resizeCharts2();
  //   this.initializeCallVolumesChart();
  //   this.initAgentMonthlySpendChart();
  //   this.initClosureCategoriesChart();
  //   this.initializeAHTChart();
  //   this.initializeASAChart();
  //   this.initializeCallAbandonmentChart();
  //   this.initializeClosureCategoriesChart();
  //
  //   // Set interval for the recoveryCost element
  //   setInterval(() => {
  //     const recoveryCost = document.getElementById('recoveryCost');
  //     if (recoveryCost && recoveryCost.parentElement) {
  //       recoveryCost.style.height = recoveryCost.parentElement.clientHeight * 0.85 + 'px';
  //     }
  //   }, 1000);
  // }
  //
  //
  // updateAgentDetails(index: string) {
  //   const agent = this.agents[parseInt(index, 10)];
  //   (document.getElementById('agentName') as HTMLElement).innerText = agent['Agent Name'];
  //   (document.getElementById('tenureValue') as HTMLElement).innerText = agent['Recruitment Length'];
  //   (document.getElementById('recruitedValue') as HTMLElement).innerText = agent['Recruitment Date'];
  //   (document.getElementById('rankValue') as HTMLElement).innerText = String(agent.Rank);
  //   (document.getElementById('spendValue') as HTMLElement).innerText = agent.Spend;
  //   (document.getElementById('spendPercent') as HTMLElement).innerText = agent['Spend Percent'];
  //   (document.getElementById('progressBarContent') as HTMLElement).style.width = agent['Spend Percent'];
  //
  //   // Update charts
  //   // this.updateCharts(agent);
  // }
  //
  //
  //
  //
  // callVolumesChart: any;
  //
  // initializeCallVolumesChart() {
  //   const callVolumesCTX = document.getElementById('callVolumes') as HTMLCanvasElement;
  //
  //   const lineOptions = {
  //     responsive: true,
  //     scales: {
  //       x: {
  //         type: 'time',
  //         time: {
  //           unit: 'day'
  //         }
  //       }
  //     }
  //   };
  //
  //
  //   this.callVolumesChart = new Chart(callVolumesCTX, {
  //     type: 'line',
  //     data: {
  //       datasets: [
  //         {
  //           data: this.generateData(200, 400),
  //           cubicInterpolationMode: 'monotone',
  //           label: 'Calls Received Daily',
  //           borderColor: '#ab3c4f',
  //           backgroundColor: '#ab3c4f4a',
  //         },
  //       ],
  //     },
  //     // @ts-ignore
  //     options: lineOptions,
  //   });
  // }
  //
  // initializeASAChart() {
  //   const ASACTX = document.getElementById('ASA') as HTMLCanvasElement;
  //   const lineOptions = this.getLineOptions();
  //
  //   this.ASAChart = new Chart(ASACTX, {
  //     type: 'line',
  //     data: {
  //       datasets: [
  //         {
  //           data: this.generateData(200, 400),
  //           cubicInterpolationMode: 'monotone',
  //           label: 'Calls Received Daily',
  //           borderColor: '#ab3c4f',
  //           backgroundColor: '#ab3c4f4a',
  //         },
  //       ],
  //     },
  //     // @ts-ignore
  //     options: lineOptions,
  //   });
  // }
  //
  // initializeAHTChart() {
  //   const AHTCTX = document.getElementById('AHT') as HTMLCanvasElement;
  //   const lineOptions = this.getLineOptions();
  //
  //   this.AHTChart = new Chart(AHTCTX, {
  //     type: 'line',
  //     data: {
  //       datasets: [
  //         {
  //           data: this.generateData(200, 400),
  //           cubicInterpolationMode: 'monotone',
  //           label: 'Calls Received Daily',
  //           borderColor: '#d58b48',
  //           backgroundColor: '#d58b484a',
  //         },
  //       ],
  //     },
  //     // @ts-ignore
  //     options: lineOptions,
  //   });
  // }
  //
  // initializeCallAbandonmentChart() {
  //   const callAbandonmentCTX = document.getElementById('callAbandonment') as HTMLCanvasElement;
  //   const lineOptions = this.getLineOptions();
  //
  //   this.callAbandonmentChart = new Chart(callAbandonmentCTX, {
  //     type: 'line',
  //     data: {
  //       datasets: [
  //         {
  //           data: this.generateData(200, 400),
  //           cubicInterpolationMode: 'monotone',
  //           label: 'Calls Received Daily',
  //           borderColor: '#d58b48',
  //           backgroundColor: '#d58b484a',
  //         },
  //       ],
  //     },
  //     // @ts-ignore
  //     options: lineOptions,
  //   });
  // }
  //
  //
  // initializeAgentMonthlySpendChart() {
  //   const agentMonthlySpendCTX = document.getElementById('agentMonthlySpend') as HTMLCanvasElement;
  //
  //   this.agentMonthlySpendChart = new Chart(agentMonthlySpendCTX, {
  //     type: 'bar',
  //     data: {
  //       labels: this.getMonths(),
  //       datasets: [
  //         {
  //           label: 'Monthly Spend',
  //           data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  //           backgroundColor: 'rgba(255, 99, 132, 0.2)',
  //           borderColor: 'rgba(255, 99, 132, 1)',
  //           borderWidth: 1,
  //         },
  //       ],
  //     },
  //     options: {
  //       //@ts-ignore
  //       maxBarThickness: 18,
  //       responsive: true,
  //       maintainAspectRatio: false,
  //       plugins: {
  //         legend: {
  //           display: false,
  //         },
  //       },
  //       scales: {
  //         y: {
  //           display: false,
  //         },
  //         x: {
  //           grid: {
  //             display: false,
  //           },
  //           ticks: {
  //             color: '#8a8ca4',
  //           },
  //         },
  //       },
  //     },
  //   });
  // }
  //
  // initializeClosureCategoriesChart() {
  //   const closureCategoriesCTX = document.getElementById('closureCategories') as HTMLCanvasElement;
  //
  //   this.closureCategoriesChart = new Chart(closureCategoriesCTX, {
  //     type: 'bar',
  //     data: {
  //       labels: ['Complaints', 'Compliments', 'Product Queries', 'Sales Calls', 'Sign-ups'],
  //       datasets: [
  //         {
  //           data: [[], [], [], [], []], // Initialize with empty data
  //           backgroundColor: '#ab3c4f',
  //         },
  //       ],
  //     },
  //     options: {
  //       //@ts-ignore
  //       maxBarThickness: 75,
  //       responsive: true,
  //       maintainAspectRatio: false,
  //       plugins: {
  //         legend: {
  //           display: false,
  //         },
  //       },
  //       scales: {
  //         y: {
  //           grid: {
  //             display: false,
  //           },
  //           ticks: {
  //             color: '#8a8ca4',
  //           },
  //         },
  //         x: {
  //           ticks: {
  //             color: '#8a8ca4',
  //           },
  //         },
  //       },
  //     },
  //   });
  // }
  //
  // getMonths(): string[] {
  //   return [
  //     'January', 'February', 'March', 'April', 'May', 'June',
  //     'July', 'August', 'September', 'October', 'November', 'December'
  //   ];
  // }
  //
  //
  //
  // getLineOptions() {
  //   return {
  //     responsive: true,
  //     scales: {
  //       x: {
  //         type: 'time',
  //         time: {
  //           unit: 'day'
  //         }
  //       }
  //     }
  //   };
  // }
  // generateData(min: number, max: number) {
  //   // Replace this with your logic to generate data
  //   const data = [];
  //   for (let i = 0; i < 30; i++) {
  //     data.push({
  //       x: new Date(2023, 7, i + 1), // Assuming you're generating data for August 2023
  //       y: Math.floor(Math.random() * (max - min + 1)) + min
  //     });
  //   }
  //   return data;
  // }
  //
  // initializeEventListeners() {
  //   const sidebarIcons = document.querySelectorAll('.sidebar-icon') as NodeListOf<HTMLElement>;
  //   const menuSwitches = Array.from(sidebarIcons);
  //
  //   menuSwitches[0].addEventListener('click', (e) => this.switchToMainCharts(menuSwitches));
  //   menuSwitches[1].addEventListener('click', (e) => this.switchToAgentCharts(menuSwitches));
  // }
  //
  // @HostListener('window:resize', ['$event'])
  // onResize() {
  //   this.resizeCharts2();
  //   this.agentChartsDimensions();
  // }
  //
  // resizeCharts() {
  //   const TOP_CHART_HEIGHT_PERCENTAGE = 0.45;
  //   const MID_CHART_HEIGHT_PERCENTAGE = 0.9;
  //   const canvases = document.querySelectorAll('canvas');
  //
  //   canvases.forEach((canvas) => {
  //     if (canvas.parentElement?.classList.contains('top-chart')) {
  //       const segmentHeight = canvas.parentElement.clientHeight;
  //       canvas.style.height = segmentHeight * TOP_CHART_HEIGHT_PERCENTAGE + 'px';
  //       canvas.style.width = '100%';
  //     } else if (canvas.parentElement?.classList.contains('mid-chart')) {
  //       const segmentHeight = canvas.parentElement.clientHeight;
  //       canvas.style.height = segmentHeight * MID_CHART_HEIGHT_PERCENTAGE + 'px';
  //       canvas.style.width = '100%';
  //     }
  //   });
  // }
  //
  // resizeCharts2() {
  //   const canvases = document.querySelectorAll('canvas');
  //
  //   canvases.forEach((canvas) => {
  //     const canvasID = canvas.id;
  //     const segmentHeight = canvas.parentElement?.clientHeight || 0;
  //
  //     switch (canvasID) {
  //       case 'recoveryCost':
  //         canvas.style.height = segmentHeight * 0.85 + 'px';
  //         break;
  //       case 'callType':
  //         canvas.style.height = segmentHeight * 0.9 + 'px';
  //         break;
  //       case 'agentMonthlySpend':
  //         canvas.style.height = segmentHeight * 0.95 + 'px';
  //         break;
  //       case 'callVolumes':
  //       case 'ASA':
  //       case 'AHT':
  //       case 'callAbandonment':
  //         canvas.style.height = segmentHeight * 0.45 + 'px';
  //         break;
  //       default:
  //         canvas.style.height = segmentHeight + 'px';
  //     }
  //     canvas.style.width = '100%';
  //   });
  // }
  //
  // setFontSizeDynamically() {
  //   document.body.style.fontSize = document.body.clientHeight * 0.018 + 'px';
  // }
  //
  // agentChartsDimensions() {
  //   const agentCharts = document.getElementById('agentCharts') as HTMLElement;
  //   const sidebar = document.getElementById('sidebar') as HTMLElement;
  //   const charts = document.getElementById('mainCharts') as HTMLElement;
  //
  //   if (agentCharts && sidebar && charts) {
  //     agentCharts.style.height = sidebar.clientHeight + 'px';
  //     const rect = sidebar.getBoundingClientRect();
  //     const distanceFromLeft = rect.left;
  //     const sidebarWidth = rect.width;
  //     agentCharts.style.left = distanceFromLeft + sidebarWidth + 22 + 'px';
  //     agentCharts.style.width = charts.clientWidth + 'px';
  //   }
  // }
  // generateFivePairArrays(max: number): number[][] {
  //   let result: number[][] = [];
  //   let current = 0;
  //
  //   for (let i = 0; i < 5; i++) {
  //     let increment = Math.floor(Math.random() * (max - current)) + 1;
  //     current += increment;
  //     result.push([current - increment, current]);
  //   }
  //
  //   return result;
  // }
  //
  // switchToMainCharts(menuSwitches: HTMLElement[]) {
  //   const charts = document.getElementById('mainCharts') as HTMLElement;
  //   const agentCharts = document.getElementById('agentCharts') as HTMLElement;
  //
  //   if (!menuSwitches[0].classList.contains('active')) {
  //     menuSwitches[1].classList.remove('active');
  //     menuSwitches[0].classList.add('active');
  //     charts.classList.remove('hidden');
  //     agentCharts.classList.remove('active');
  //   }
  // }
  //
  // switchToAgentCharts(menuSwitches: HTMLElement[]) {
  //   const charts = document.getElementById('mainCharts') as HTMLElement;
  //   const agentCharts = document.getElementById('agentCharts') as HTMLElement;
  //
  //   if (!menuSwitches[1].classList.contains('active')) {
  //     menuSwitches[0].classList.remove('active');
  //     menuSwitches[1].classList.add('active');
  //     charts.classList.add('hidden');
  //     agentCharts.classList.add('active');
  //     this.agentChartsDimensions();
  //   }
  // }
  // selectedAgent: any;
  //
  //
  // initializeAgents() {
  //   // Example agents data initialization. Replace this with actual data
  //   this.agents = [
  //     { id: 0, 'Agent Name': 'Agent 1', 'Recruitment Length': '1 year', 'Recruitment Date': '2023-01-01', Rank: 1, Spend: '5000', 'Spend Percent': '50%' },
  //     { id: 1, 'Agent Name': 'Agent 2', 'Recruitment Length': '2 years', 'Recruitment Date': '2022-01-01', Rank: 2, Spend: '6000', 'Spend Percent': '60%' }
  //     // Add more agents as needed
  //   ];
  //   this.selectedAgent = this.agents[0];
  // }
  //
  // onAgentSelect(event: any) {
  //   const agentId = event.target.value;
  //   this.selectedAgent = this.agents[agentId];
  //
  //   // Update the charts when an agent is selected
  //   this.updateAgentMonthlySpendChart();
  //   this.updateClosureCategoriesChart();
  // }
  //
  // initAgentMonthlySpendChart() {
  //   const agentMonthlySpendCTX = document.getElementById('agentMonthlySpend') as HTMLCanvasElement;
  //   this.agentMonthlySpendChart = new Chart(agentMonthlySpendCTX, {
  //     type: 'bar',
  //     data: {
  //       labels: this.getMonths(),
  //       datasets: [
  //         {
  //           label: 'Monthly Spend',
  //           data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  //           backgroundColor: 'rgba(255, 99, 132, 0.2)',
  //           borderColor: 'rgba(255, 99, 132, 1)',
  //           borderWidth: 1
  //         }
  //       ]
  //     },
  //     options: {
  //       //@ts-ignore
  //       maxBarThickness: 18,
  //       responsive: true,
  //       maintainAspectRatio: false,
  //       plugins: {
  //         legend: {
  //           display: false
  //         }
  //       },
  //       scales: {
  //         y: {
  //           display: false
  //         },
  //         x: {
  //           grid: {
  //             display: false
  //           },
  //           ticks: {
  //             color: '#8a8ca4'
  //           }
  //         }
  //       }
  //     }
  //   });
  // }
  //
  // updateAgentMonthlySpendChart() {
  //   const min = Math.floor(Math.random() * 200);
  //   const max = Math.floor(Math.random() * 9500);
  //   this.agentMonthlySpendChart.data.datasets[0].data = this.generateCurve(min, max);
  //   this.agentMonthlySpendChart.update();
  // }
  //
  // initClosureCategoriesChart() {
  //   const closureCategoriesCTX = document.getElementById('closureCategories') as HTMLCanvasElement;
  //   this.closureCategoriesChart = new Chart(closureCategoriesCTX, {
  //     type: 'bar',
  //     data: {
  //       labels: ['Complaints', 'Compliments', 'Product Queries', 'Sales Calls', 'Sign-ups'],
  //       datasets: [
  //         {
  //           data: [[], [], [], [], []],
  //           backgroundColor: '#ab3c4f'
  //         }
  //       ]
  //     },
  //     options: {
  //       //@ts-ignore
  //       maxBarThickness: 75,
  //       responsive: true,
  //       maintainAspectRatio: false,
  //       plugins: {
  //         legend: {
  //           display: false
  //         }
  //       },
  //       scales: {
  //         y: {
  //           grid: {
  //             display: false
  //           },
  //           ticks: {
  //             color: '#8a8ca4'
  //           }
  //         },
  //         x: {
  //           ticks: {
  //             color: '#8a8ca4'
  //           }
  //         }
  //       }
  //     }
  //   });
  // }
  //
  // updateClosureCategoriesChart() {
  //   const closuresMin = Math.floor(Math.random() * 200);
  //   const closuresMax = Math.floor(Math.random() * 500);
  //   this.closureCategoriesChart.data.datasets[0].data = this.generateFivePairArrays(closuresMax - closuresMin + closuresMin);
  //   this.closureCategoriesChart.update();
  // }
  //
  // // Utility functions for generating data
  // generateCurve(min: number, max: number): number[] {
  //   const data = [];
  //   for (let i = 0; i < 12; i++) {
  //     data.push(Math.floor(Math.random() * (max - min + 1)) + min);
  //   }
  //   return data;
  // }


}

