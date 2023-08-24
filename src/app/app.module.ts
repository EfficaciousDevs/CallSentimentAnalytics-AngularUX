import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CallAnalyticsComponent } from './call-analytics/call-analytics.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatBadgeModule} from "@angular/material/badge";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {MatStepperModule} from "@angular/material/stepper";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatDividerModule} from "@angular/material/divider";
import {MatChipsModule} from "@angular/material/chips";
import {MatNativeDateModule, MatRippleModule} from "@angular/material/core";
import {MatDialogModule} from "@angular/material/dialog";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {NgxSpinnerModule} from "ngx-spinner";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {CommonModule} from "@angular/common";
import { ManagerRoleComponent } from './manager-role/manager-role.component';
import { AdminRoleComponent } from './admin-role/admin-role.component';
import { UserRoleComponent } from './user-role/user-role.component';
import { AlertDialogWindowComponent } from './alert-dialog-window/alert-dialog-window.component';
import { LoginComponent } from './login/login.component';
import {AudioDialog, ReviewComponent, ReviewDialog} from './review/review.component';
import {RulesBasedActionComponent, TrainingDialog} from './rules-based-action/rules-based-action.component';
import {AuthGuard} from "./AuthGaurd/auth.gaurd";
import {AuthInterceptor} from "./AuthGaurd/auth.interceptor";
import {RoleBasedService} from "./HttpServices/role-based.service";
import { ReportingDashboardComponent } from './reporting-dashboard/reporting-dashboard.component';
import { CreateRolesComponent } from './create-roles/create-roles.component';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatCardModule} from '@angular/material/card';
import {MatTableModule} from '@angular/material/table';
import { MatSortModule} from "@angular/material/sort";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatMenuModule} from '@angular/material/menu';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import {MatSidenavModule} from "@angular/material/sidenav";
import { EditUserDialogComponent } from './edit-user-dialog/edit-user-dialog.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { NgxChartsModule } from '@swimlane/ngx-charts';
@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    CallAnalyticsComponent,
    ManagerRoleComponent,
    AdminRoleComponent,
    UserRoleComponent,
    AlertDialogWindowComponent,
    LoginComponent,
    ReviewComponent,
    RulesBasedActionComponent,
    ReportingDashboardComponent,
    CreateRolesComponent,
    ForbiddenComponent,
    EditUserDialogComponent,
    ReviewDialog,TrainingDialog,AudioDialog
  ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        NgxSpinnerModule,
        MatFormFieldModule,
        MatSelectModule,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        BrowserModule,
        AppRoutingModule,
        CommonModule,
        ReactiveFormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        MatProgressSpinnerModule,
        MatBadgeModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatStepperModule,
        MatProgressBarModule,
        MatToolbarModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatDividerModule,
        MatChipsModule,
        MatRippleModule,
        MatDialogModule,
        MatStepperModule,
        MatDatepickerModule, MatCardModule, MatTableModule,NgxChartsModule,
        MatNativeDateModule, MatSlideToggleModule, MatExpansionModule,
        MatPaginatorModule, MatSortModule, MatMenuModule, MatSidenavModule, MatCheckboxModule
    ],
  providers: [
      AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
      RoleBasedService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
