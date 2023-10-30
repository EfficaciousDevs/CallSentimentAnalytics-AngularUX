import {ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {RoleBasedService} from "../HttpServices/role-based.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {NgxSpinnerService} from "ngx-spinner";
import {MatTableDataSource} from "@angular/material/table";
import {MatSort} from "@angular/material/sort";
import {MatPaginator} from "@angular/material/paginator";
import {MatDialog} from "@angular/material/dialog";
import {EditUserDialogComponent} from "../edit-user-dialog/edit-user-dialog.component";
import {ThemePalette} from '@angular/material/core';
import {Observable} from "rxjs";
@Component({
  selector: 'app-create-roles',
  templateUrl: './create-roles.component.html',
  styleUrls: ['./create-roles.component.scss'],
})
export class CreateRolesComponent implements OnInit{

  ngOnInit() {
    const sideBar: HTMLElement = document.querySelector('.sidebar') as HTMLElement;
    if (sideBar.classList.contains('close')) {
      console.log("SideNav is closed already.");
    } else {
      sideBar.classList.toggle('close');
    }
    this.fetchRoleHelperService();
    this.fetchManagers();
    document.body.classList.remove('dark');
    // this.extractUniqueManagers();
  }
  chipList = [
    { label: 'Create New Roles', value: 1 },
    { label: 'View Existing Users', value: 2 },
    { label: 'Search/Filter Users', value: 3 },
    { label: 'Modify Users', value: 4 },
  ];


  createRoleActive: boolean = false;
  viewRole: boolean = true;
  searchRoles: boolean = false;
  modifyRoles: boolean = false;

  chipSelected(chip: any){
    if(chip.value === 1){
      this.createRoleActive = true;
      this.modifyRoles = false;
      this.searchRoles = false;
      this.viewRole = false;
    }else if(chip.value === 2){
      this.fetchRoleHelperService();
      this.createRoleActive = false;
      this.modifyRoles = false;
      this.searchRoles = false;
      this.viewRole = true;
    }else if(chip.value === 3){
      this.fetchRoleHelperService();
      this.createRoleActive = false;
      this.modifyRoles = false;
      this.searchRoles = true;
      this.viewRole = false;
    }else{
      this.fetchRoleHelperService();
      this.createRoleActive = false;
      this.modifyRoles = true;
      this.searchRoles = false;
      this.viewRole = false;
    }
  }


    colors: ChipColor[] = [
      {name: 'Primary', color: 'primary'},
      {name: 'Accent', color: 'accent'},
      {name: 'Primary', color: 'primary'},
      {name: 'Warn', color: 'warn'},
    ];

  viewDataSource: MatTableDataSource<any> | undefined;
  @ViewChild(MatPaginator, { static: true }) viewPaginator: MatPaginator | undefined;
  dataObs$: Observable<any> | undefined;

  setPagination(tableData : any) {
    this.viewDataSource = new MatTableDataSource<any>(tableData);
    this._changeDetectorRef.detectChanges();
    // @ts-ignore
    this.viewDataSource.paginator = this.paginator;
    this.dataObs$ = this.viewDataSource.connect();
  }
  constructor(private _changeDetectorRef: ChangeDetectorRef,private dialog: MatDialog,
              private roleBasedService: RoleBasedService,
              private snackBar: MatSnackBar,private spinner: NgxSpinnerService) {

  }
  @ViewChild(MatSort) sort: MatSort | undefined;
  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;
  userName: string = '';
  // @ts-ignore
  agentName: string = null;
  // @ts-ignore
  adminName: string = null;
  // @ts-ignore
  managerName: string = null;
  userPassword: string = '';
  roleType: string = '';
  adminId: number = 0;
  managerId: number = 0;
  fullName: string = '';
  managers: any = [];
  selectedValue: any;
  dropdownEnable: boolean = true;
  activeManagerId: boolean = false;
  activeAdminId: boolean = false;
  roles = ['Admin','Manager','User'];
  updateDropdownState(){
    this.dropdownEnable = this.roleType.toLowerCase() !== 'user';
    this.activeAdminId  = this.roleType.toLowerCase() === 'admin';
    this.activeManagerId = this.roleType.toLowerCase() === 'manager';
  };
  addRoleService(){

    if(this.roleType.toLowerCase() === 'user' ) {
      const agentData = {
        "agentName": this.fullName,
        "managerId": this.selectedValue.managerId,
        "managerName": this.selectedValue.managerName,
        "password": this.userPassword,
        "roleType": this.roleType,
        "userName": this.userName
      };
      this.spinner.show();
      this.roleBasedService.createRoles(agentData).subscribe((response: any)=>{
        console.log(response);

        this.spinner.hide();
        this.snackBar.open('User Role Added Successfully', 'close',{
          duration: 2000
        });
      });

    }
    else if(this.roleType.toLowerCase() === 'manager') {
      const managerData: any = {
        "managerId": this.managerId,
        "managerName": this.fullName,
        "password": this.userPassword,
        "roleType": this.roleType,
        "userName": this.userName
      };
      this.spinner.show();
      this.roleBasedService.createRoles(managerData).subscribe((response: any)=>{
        console.log(response);
        this.snackBar.open('Manager Role Added Successfully', 'close',{
          duration: 2000
        });
        this.spinner.hide();
      });

    }else{
      const adminData = {
        "adminId": this.adminId,
        "adminName": this.fullName,
        "userName": this.userName,
        "roleType": this.roleType,
        "password": this.userPassword

      };
      this.spinner.show();
      this.roleBasedService.createRoles(adminData).subscribe((response: any)=>{
        console.log(response);
        this.snackBar.open('Admin Role Added Successfully', 'close',{
          duration: 2000
        });
        this.spinner.hide();
      });
    }
    // this.spinner.show();
    // this.roleBasedService.createRoles(formData).subscribe((response: any)=>{
    //   console.log(response.userName);
    //   console.log(response.userPassword);
    //   this.snackBar.open('Role Added Successfully', 'close');
    // });

    // if(this.roleType.toLowerCase() === 'user' ) {
    //   const agentData = {
    //     "agentName": this.fullName,
    //     "managerId": this.selectedValue.managerId,
    //     "managerName": this.selectedValue.managerName
    //   };
    //   this.roleBasedService.tagManagerAgents(agentData).subscribe((response)=>{
    //     console.log(response);
    //   })
    // }
    // this.spinner.hide();


  }

  resetForm(){
    this.fullName = '';
    this.userName= '';
    this.userPassword = '';
    this.roleType = '';
    this.activeManagerId = false;
    this.activeAdminId = false;
    this.selectedValue = null;
    this.adminId = 0;
    this.managerId = 0;
  }
  usersDb: any;
  fetchRoleHelperService(){
    this.spinner.show();
    // @ts-ignore
    this.roleBasedService.getRolesList().subscribe((response):void=>{
      this.usersDb = response;
      // @ts-ignore
      this.dataSource.data = response.filter((user)=> user.roleType !== 'Admin');
      // @ts-ignore
      this.dataSource.paginator = this.paginator;
      // @ts-ignore
      this.dataSource.sort = this.sort;
      // console.log(response);

      this.setPagination(this.usersDb);
      this.spinner.hide();
    });
  }
  $filterClicked: boolean = false;
  isFilterClicked(){
    this.$filterClicked = !this.$filterClicked;
  }


  dataSource = new MatTableDataSource<UserRole>();
  displayedColumns: string[] = ['userName', 'fullName', 'managerName','roleType'];
  applyFilter(filterValue: any) {
    filterValue = filterValue.target.value.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  deleteRecord(rowIndex: number){
    let deleted_record = this.usersDb[rowIndex];

    if(deleted_record.managerName && deleted_record.agentName) {
      console.log(deleted_record.userName);

      this.roleBasedService.deleteRecord(deleted_record.userId).subscribe(response => {
        console.log(response);
        this.fetchRoleHelperService();
      });
    }else{
            this.snackBar.open('You cannot remove Managers directly until reassignment of its reporting agents is completed.','close',{
              duration: 3000
            });
          }
  }
  passedForm : any;
  updateRecord(userEntity: any){
    this.passedForm = userEntity;
    this.openEditDialog(this.passedForm);

  }

  openEditDialog(formData: any): void {
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '600px',
      data: formData
    });

    dialogRef.afterClosed().subscribe(result=>{
      if(result){
        console.log(result);
        setTimeout(()=>{
          this.fetchRoleHelperService();
        },2000);
      }
    });

  }

  fetchManagers(){
    this.roleBasedService.getUsersDB().subscribe(response=> {
      this.managers = response;
      console.log(response);

      this.managers.forEach((agent: { managerId: number; managerName: any; }) => {
        const managerExists = this.uniqueManagers.some(manager => manager.managerId === agent.managerId);

        if (!managerExists && agent.managerId !== 0 && agent.managerName.length > 0) {
          this.uniqueManagers.push({
            managerId: agent.managerId,
            managerName: agent.managerName
          });
        }
      });
      console.log(this.uniqueManagers);

    })
  };

  uniqueManagers: { managerId: number, managerName: string }[] = [];

}

export interface UserRole{
  userName: string;
  userPassword: string;
  userFirstName: string;
  userLastName: string;
  role: Role[];
}

export interface Role{
  roleName: string;
  roleDescription:string;
}

export interface Manager{
managerId: number;
managerName: string
}

export interface ChipColor {
  name: string;
  color: ThemePalette;
}



