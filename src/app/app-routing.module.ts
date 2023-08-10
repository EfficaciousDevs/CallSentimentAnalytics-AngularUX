import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DashboardComponent} from "./dashboard/dashboard.component";
import {CallAnalyticsComponent} from "./call-analytics/call-analytics.component";
import {ManagerRoleComponent} from "./manager-role/manager-role.component";
import {AdminRoleComponent} from "./admin-role/admin-role.component";
import {UserRoleComponent} from "./user-role/user-role.component";
import {LoginComponent} from "./login/login.component";
import {ReviewComponent} from "./review/review.component";
import {RulesBasedActionComponent} from "./rules-based-action/rules-based-action.component";
import {AuthGuard} from "./AuthGaurd/auth.gaurd";
import {ReportingDashboardComponent} from "./reporting-dashboard/reporting-dashboard.component";
import {CreateRolesComponent} from "./create-roles/create-roles.component";

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'dashboard', component: DashboardComponent,
    children: [
      {
        path: 'callSentimentsAnalytics', component: CallAnalyticsComponent
      },
      {
        path: 'adminAccess', component: AdminRoleComponent, canActivate: [AuthGuard],data:{roles:['Admin']}
      },
      {
        path: 'managerAccess', component: ManagerRoleComponent, canActivate: [AuthGuard],data:{roles:['Manager']}
      },
      {
        path: 'userAccess', component: UserRoleComponent, canActivate: [AuthGuard],data:{roles:['User']}
      },
      {
        path: 'review', component: ReviewComponent, canActivate: [AuthGuard],data:{roles:['Manager']}
      },
      {
        path: 'rulesBasedAction', component: RulesBasedActionComponent, canActivate: [AuthGuard],data:{roles:['Manager']}
      },
      {
        path: 'reportingDashboard', component: ReportingDashboardComponent
      },
      {
        path: 'addNewRole', component: CreateRolesComponent,canActivate: [AuthGuard],data:{roles:['Admin']}
      }
    ]
  },
  {
    path: 'login', component: LoginComponent
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
