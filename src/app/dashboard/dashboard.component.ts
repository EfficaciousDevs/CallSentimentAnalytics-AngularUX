import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Router} from "@angular/router";
import {AuthService} from "../HttpServices/auth.service";
import {RoleBasedService} from "../HttpServices/role-based.service";
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {of, switchMap} from "rxjs";
import {DomSanitizer} from "@angular/platform-browser";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit,AfterViewInit{

  constructor(private sanitizer: DomSanitizer, public authService: AuthService, private router: Router,public roleBasedService: RoleBasedService,private callService: CallAnalyticsProxiesService) { }
  negativeResults: any = [];
  // getReviewDetails(){
  //   this.callService.fetchStats().subscribe((data)=>{
  //     this.negativeResults = data;
  //     this.negativeResults  = this.negativeResults.filter((entry: { custSuppSentiment: string; }) => entry.custSuppSentiment === "Negative");
  //     console.log(this.negativeResults);
  //   })
  // }

  getReviewDetails(){

    this.callService.fetchManagers().pipe(
      switchMap((data: any) => {
        console.log(data);
        this.agentIds = data
          .filter((item: any) => item.managerId === this.authService.managerId && item.agentName !== null)
          .map((item: any) => item.userId.toString());

        // Return the agentIds as an observable
        return of(this.agentIds);
      })
    ).subscribe((agentIds: string[]) => {
      // Now, agentIds is available here after the first service call is completed
      this.callService.getReviewData(agentIds).subscribe((data) => {
        this.reviewData = data;
        // console.log(this.reviewData);

      });
    });
  }
  agentIds: any = [];
  reviewData: any = [];
  ngOnInit() {
    this.getReviewDetails();
    this.routeIsActive();
  }

  // src= this.sanitizer.bypassSecurityTrustResourceUrl("https://img.freepik.com/premium-vector/young-smiling-man-avatar-man-with-brown-beard-mustache-hair-wearing-yellow-sweater-sweatshirt-3d-vector-people-character-illustration-cartoon-minimal-style_365941-860.jpg?w=2000");
  // sidebarToggle: boolean = false;

  ngAfterViewInit() {
    const sideLinks: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('.sidebar .side-menu li a:not(.logout)');

    sideLinks.forEach(item => {
      const li: HTMLElement = item.parentElement as HTMLElement;
      item.addEventListener('click', () => {
        sideLinks.forEach(i => {
          i.parentElement?.classList.remove('active');
        });
        li.classList.add('active');
      });
    });

    const menuBar: HTMLElement = document.querySelector('.content nav .bx.bx-menu') as HTMLElement;
    const sideBar: HTMLElement = document.querySelector('.sidebar') as HTMLElement;

    menuBar.addEventListener('click', () => {
      sideBar.classList.toggle('close');
    });

    const searchBtn: HTMLElement = document.querySelector('.content nav form .form-input button') as HTMLElement;
    const searchBtnIcon: HTMLElement = document.querySelector('.content nav form .form-input button .bx') as HTMLElement;
    const searchForm: HTMLElement = document.querySelector('.content nav form') as HTMLElement;
    searchBtn.addEventListener('click', function (e: Event) {
      if (window.innerWidth < 576) {
        e.preventDefault();
        searchForm.classList.toggle('show');
        if (searchForm.classList.contains('show')) {
          searchBtnIcon.classList.replace('bx-search', 'bx-x');
        } else {
          searchBtnIcon.classList.replace('bx-x', 'bx-search');
        }
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth < 768) {
        sideBar.classList.add('close');
      } else {
        sideBar.classList.remove('close');
      }
      if (window.innerWidth > 576) {
        searchBtnIcon.classList.replace('bx-x', 'bx-search');
        searchForm.classList.remove('show');
      }
    });

    const toggler: HTMLInputElement = document.getElementById('theme-toggle') as HTMLInputElement;

    toggler.addEventListener('change', function () {
      if (this.checked) {

        document.body.classList.add('dark');

      } else {
        document.body.classList.remove('dark');
      }
    });

  }
  sentimentsActive: boolean = false;
  homeActive: boolean = false;
  adminActive:boolean = false;
  managerActive: boolean = false;
  userActive: boolean = false;
  reviewActive: boolean = false;
  actionActive: boolean = false;
  createRoleActive: boolean = false;
  searchActive: boolean = false;
  toggleDarkMode(){
    const toggler: HTMLInputElement = document.getElementById('theme-toggle') as HTMLInputElement;

    toggler.addEventListener('change', function () {
      if (!this.checked) {

        document.body.classList.add('dark');

      } else {
        document.body.classList.remove('dark');
      }
    });
  }
  routeIsActive(): string {
    if (this.router.url == '/dashboard/callSentimentsAnalytics') {
      this.sentimentsActive = true;
      this.homeActive = false;
      this.adminActive = false;
      this.managerActive = false;
      this.userActive = false;
      this.reviewActive = false;
      this.actionActive = false;
      this.createRoleActive = false;
      return 'Call Sentiment Analytics';
    } if (this.router.url == '/dashboard/adminAccess') {
      this.sentimentsActive = false;
      this.homeActive = false;
      this.adminActive = true;
      this.managerActive = false;
      this.userActive = false;
      this.reviewActive = false;
      this.actionActive = false;
      this.createRoleActive = false;
      return 'Admin Dashboard';
    }if (this.router.url == '/dashboard/managerAccess') {
      this.sentimentsActive = false;
      this.homeActive = false;
      this.adminActive = false
      this.managerActive = true;
      this.userActive = false;
      this.reviewActive = false;
      this.actionActive = false;
      this.createRoleActive = false;
      return 'Manager Dashboard';
    }if (this.router.url == '/dashboard/userAccess') {
      this.sentimentsActive = false;
      this.homeActive = false;
      this.adminActive = false;
      this.managerActive = false;
      this.userActive = true;
      this.reviewActive = false;
      this.actionActive = false;
      this.createRoleActive = false;
      return 'User Dashboard';
    }
    if (this.router.url == '/dashboard/review') {
      this.sentimentsActive = false;
      this.homeActive = false;
      this.adminActive = false;
      this.managerActive = false;
      this.userActive = false;
      this.reviewActive = true;
      this.actionActive = false;
      this.createRoleActive = false;
      return 'Review Page';
    }
    if (this.router.url == '/dashboard/ruleBasedAction') {
      this.sentimentsActive = false;
      this.homeActive = false;
      this.adminActive = false;
      this.managerActive = false;
      this.userActive = false;
      this.reviewActive = false;
      this.actionActive = true;
      this.createRoleActive = false;
      return 'Action Page';
    }
    if (this.router.url == '/dashboard/addNewRole') {
      this.sentimentsActive = false;
      this.homeActive = false;
      this.adminActive = false;
      this.managerActive = false;
      this.userActive = false;
      this.reviewActive = false;
      this.actionActive = false;
      this.createRoleActive = true;
      return 'User Management Interface';
    }
    if(this.router.url == '/dashboard/reportingDashboard'){
      return 'Reporting Window';
    }
    if(this.router.url == '/dashboard/searchTaggedAgents'){
      return 'Tagged Agent Search';
    }
    else {
      this.sentimentsActive = false;
      this.homeActive = true;
      return 'Home Page';
    }
  }

  openList(){
    return this.isOpenList != this.isOpenList;
  }
  isOpenList: boolean = false;

  isLoggedOut(){
    this.authService.clear();
    this.router.navigate(['/login']);
  }

  getUserRole():string{
    if(this.roleBasedService.roleMatch(['Admin'])){
      return 'Admin';
    }
    else if(this.roleBasedService.roleMatch(['Manager'])){
      return 'Manager'
    }else{
      return 'User';
    }
  }
}
