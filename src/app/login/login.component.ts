import {Component, OnInit} from '@angular/core';
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {AuthService} from "../HttpServices/auth.service";
import {Router} from "@angular/router";
import {RoleBasedService} from "../HttpServices/role-based.service";
import {NgxSpinnerService} from "ngx-spinner";

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
  authState: string = '';
  invalidCredentials: string = '';
  loginHelper(){
    console.log(this.username, this.password);
    const loginData = {
      "userName": this.username,
      "userPassword": this.password
    };
    this.spinner.show();
    this.roleService.login(loginData).subscribe(
        (response: any) => {
          this.authService.setRoles(response.user.role);
          this.authService.setToken(response.jwtToken);
          this.authService.authFirstName = response.user.userFirstName;
          this.authService.authLastName = response.user.userLastName;
          const role = response.user.role[0].roleName;
          if (role === 'Admin') {
            this.pageRouter.navigateByUrl('/dashboard/adminAccess');
          }
          else if (role === 'Manager') {
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
          this.invalidCredentials = '***INVALID CREDENTIALS***'
          this.spinner.hide();
        }


    );
  }
}
