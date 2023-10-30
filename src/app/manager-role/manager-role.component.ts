import {AfterViewInit, Component, OnInit, Pipe, PipeTransform} from '@angular/core';
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {AuthService} from "../HttpServices/auth.service";
import {of, switchMap} from "rxjs";
import {NgxSpinnerService} from "ngx-spinner";
import {animate, trigger, style,transition} from "@angular/animations";
import {RoleBasedService} from "../HttpServices/role-based.service";

@Pipe({ name: 'tooltipList' })
export class TooltipListPipe implements PipeTransform {

  transform(lines: any): string {

    let list: string = '';

    for(let index = 0; index < lines.length; index++){
      if(index == 4){
        break;
      }
      list += '• ' + lines[index].agentName + '\n';
    }

    return list;
  }
}

@Pipe({ name: 'tooltipAgents' })
export class TooltipAgentsPipe implements PipeTransform {

  transform(lines: any): string {

    let list: string = '';

    for(let index = 0; index < lines.length; index++){
      list += '• ' + lines[index].agentName + '\n';
    }

    return list;
  }
}
@Component({
  selector: 'app-manager-role',
  templateUrl: './manager-role.component.html',
  styleUrls: ['./manager-role.component.scss'],
  animations: [
    trigger('slide', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)' }),
        animate('500ms ease-in', style({ transform: 'translateY(0)' }))
      ])
    ])
  ],
})
export class ManagerRoleComponent implements OnInit{

  learnerList: any = [];
  constructor(private callService: CallAnalyticsProxiesService,private roleService: RoleBasedService,private auth: AuthService,private spinner: NgxSpinnerService) {
  }
  ngOnInit() {
    const sideBar: HTMLElement = document.querySelector('.sidebar') as HTMLElement;
    if (sideBar.classList.contains('close')) {
      console.log("SideNav is closed already.");
    } else {
      sideBar.classList.toggle('close');
    }
    document.body.classList.remove('dark');
  //  this.callService.getLearners().subscribe((data: any)=>{
  //    this.learnerList = data.filter((item : any)=> item.managerId == this.auth.managerId);
  //  });
  //
  //  console.log(this.learnerList);
  //  this.getReviewDetails();
  // this.spinner.show();
  //  this.callService.fetchManagers().subscribe((data: any)=>{
  //    this.unreviewedData = data.filter((item: any)=> this.agentIds.includes(item.userId.toString()));
  //    // console.log(this.unreviewedData);
  //    this.spinner.hide();
  //  })
    this.spinner.show();
    this.callService.getLearners().pipe(
      switchMap((data : any)=>{
        this.learnerList = data.filter((item : any)=> item.managerId == this.auth.managerId);

        return this.callService.fetchManagers();
      }),
      switchMap((data: any)=>{
        this.unreviewedData = data.filter((item: any)=> this.agentIds.includes(item.userId.toString()));
        return this.roleService.getRolesList();
      })
    ).subscribe((response: any)=>{
      this.taggedAgents = response.filter((item:any)=> item.agentName !== null && item.managerId == this.auth.managerId);
      this.getReviewDetails();
      this.spinner.hide();
    })
  }



  taggedAgents: any = [];
  agentIds : any = [];
  reviewData: any = [];
  unreviewedData : any = [];
  getReviewDetails(){
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
      this.callService.getReviewData(agentIds).subscribe((data) => {
        this.reviewData = data;
        console.log(this.reviewData);
        this.spinner.hide();
      });
    });
  }
}
