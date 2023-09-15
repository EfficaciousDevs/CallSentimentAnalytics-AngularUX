import {Component, OnInit} from '@angular/core';
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {AuthService} from "../HttpServices/auth.service";
import {Router} from "@angular/router";
import {RoleBasedService} from "../HttpServices/role-based.service";
import {NgxSpinnerService} from "ngx-spinner";
import {DomSanitizer} from "@angular/platform-browser";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit{

  constructor(private spinner: NgxSpinnerService,private roleService: RoleBasedService,private authService: AuthService,private pageRouter: Router) {
  }
  username: string = '';
  password: string = '';

  ngOnInit() {
  }
  // authState: string = '';
  invalidCredentials: string = '';

 invalidChanger() {
   this.invalidCredentials = '';
 }
  loginHelper(){
    console.log(this.username, this.password);
    const loginData = {
      "userName": this.username,
      "userPassword": this.password
    };
    this.spinner.show();
    this.roleService.login(loginData).subscribe(
        (response: any) => {
          this.authService.setRoles(response.user.roleType);
          this.authService.setToken(response.jwtToken);
          this.authService.fullName =
            response.user.roleType == 'Admin'? response.user.adminName :
              response.user.roleType == 'Manager'? response.user.managerName : response.user.agentName;
          this.authService.userId = response.user.userId;
          this.authService.managerId = response.user.managerId? response.user.managerId : 0;
          this.authService.roleType = response.user.roleType;
          const role = response.user.roleType;
          if (role == 'Admin') {
            this.pageRouter.navigateByUrl('/dashboard/adminAccess');
          }
          else if (role == 'Manager') {
                this.pageRouter.navigate(['/dashboard/managerAccess']);
            }
          else {
            this.pageRouter.navigate(['/dashboard/userAccess']);
          }
          this.spinner.hide();
          this.invalidCredentials = '';
        },
        (error) => {
          console.log(error);
          this.invalidCredentials = '*** INVALID CREDENTIALS ***'
          this.spinner.hide();
        }


    );
  }
}
