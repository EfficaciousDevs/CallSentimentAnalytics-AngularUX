import { Component} from '@angular/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],

})
export class AppComponent {
  title = 'CallSentimentAnalytics';
  // constructor(private httpProxy: CallAnalyticsProxiesService,private darkModeService: DarkModeService) {
  // }
  // agentId: number = 0;
  // agentName: string = '';
  // managerName: string = '';
  // managerId: number = 0;
  // audioFile: File | null = null;
  // analyticsReport: File | null = null;
  // audioTimestamp: Date = new Date();
  // roleList: any;
  // addRoles(){
  //   const roleObject = {
  //     "agentId" : this.agentId,
  //     "agentName": this.agentName,
  //     "managerId": this.managerId,
  //     "managerName": this.managerName,
  //     "audioFile": this.audioFile,
  //     "audioTimestamp": this.audioTimestamp,
  //     "analyticsReport": this.analyticsReport
  //   };
  //
  //   this.httpProxy.RoleAdd(roleObject).subscribe((data)=>{
  //     console.log("RolesAdd Service ",data);
  //   });
  // }
  //
  // getRoleList(){
  //   this.httpProxy.getListRoles().subscribe((data)=>{
  //     this.roleList = data;
  //   })
  // }
  //
  //
  // ngOnInit(): void {
  //
  // }
  //
  // ngAfterViewInit(){
  //   const sideLinks: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('.sidebar .side-menu li a:not(.logout)');
  //
  //   sideLinks.forEach(item => {
  //     const li: HTMLElement = item.parentElement as HTMLElement;
  //     item.addEventListener('click', () => {
  //       sideLinks.forEach(i => {
  //         i.parentElement?.classList.remove('active');
  //       });
  //       li.classList.add('active');
  //     });
  //   });
  //
  //   const menuBar: HTMLElement = document.querySelector('.content nav .bx.bx-menu') as HTMLElement;
  //   const sideBar: HTMLElement = document.querySelector('.sidebar') as HTMLElement;
  //
  //   menuBar.addEventListener('click', () => {
  //     sideBar.classList.toggle('close');
  //   });
  //
  //   const searchBtn: HTMLElement = document.querySelector('.content nav form .form-input button') as HTMLElement;
  //   const searchBtnIcon: HTMLElement = document.querySelector('.content nav form .form-input button .bx') as HTMLElement;
  //   const searchForm: HTMLElement = document.querySelector('.content nav form') as HTMLElement;
  //
  //   searchBtn.addEventListener('click', function (e: Event) {
  //     if (window.innerWidth < 576) {
  //       e.preventDefault();
  //       searchForm.classList.toggle('show');
  //       if (searchForm.classList.contains('show')) {
  //         searchBtnIcon.classList.replace('bx-search', 'bx-x');
  //       } else {
  //         searchBtnIcon.classList.replace('bx-x', 'bx-search');
  //       }
  //     }
  //   });
  //
  //   window.addEventListener('resize', () => {
  //     if (window.innerWidth < 768) {
  //       sideBar.classList.add('close');
  //     } else {
  //       sideBar.classList.remove('close');
  //     }
  //     if (window.innerWidth > 576) {
  //       searchBtnIcon.classList.replace('bx-x', 'bx-search');
  //       searchForm.classList.remove('show');
  //     }
  //   });
  //
  //   const toggler: HTMLInputElement = document.getElementById('theme-toggle') as HTMLInputElement;
  //
  //   toggler.addEventListener('change', function () {
  //     if (this.checked) {
  //       document.body.classList.add('dark');
  //     } else {
  //       document.body.classList.remove('dark');
  //     }
  //   });
  //
  //
  //
  //
  //
  // }
  //
  //
  //


}
