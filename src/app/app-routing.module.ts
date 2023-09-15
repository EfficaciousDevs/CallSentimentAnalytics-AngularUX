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
import {ForbiddenComponent} from "./forbidden/forbidden.component";
import {AgentSearchComponent} from "./agent-search/agent-search.component";

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login', component: LoginComponent
  },
  {
    path: 'dashboard', component: DashboardComponent,canActivate: [AuthGuard],data:{roles:['Admin','Manager','User']},
    children: [
      {
        path: 'callSentimentsAnalytics', component: CallAnalyticsComponent,canActivate: [AuthGuard],data:{roles:['Admin','Manager','User']},
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
        path: 'reportingDashboard', component: ReportingDashboardComponent,canActivate: [AuthGuard],data:{roles:['Admin','Manager','User']}
      },
      {
        path: 'addNewRole', component: CreateRolesComponent,canActivate: [AuthGuard],data:{roles:['Admin']}
      },
      {
        path: 'searchTaggedAgents', component: AgentSearchComponent, canActivate: [AuthGuard], data: {roles : ['Manager']}
      }
    ]
  },
  {
    path: 'forbidden',component: ForbiddenComponent
  },
  {
    path: '**', redirectTo: '/forbidden'
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
