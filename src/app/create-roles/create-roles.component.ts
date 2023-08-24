import {Component, OnInit, ViewChild} from '@angular/core';
import {RoleBasedService} from "../HttpServices/role-based.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {NgxSpinnerService} from "ngx-spinner";
import {MatTableDataSource} from "@angular/material/table";
import {MatSort} from "@angular/material/sort";
import {MatPaginator} from "@angular/material/paginator";
import {MatDialog} from "@angular/material/dialog";
import {EditUserDialogComponent} from "../edit-user-dialog/edit-user-dialog.component";
import {ThemePalette} from '@angular/material/core';
@Component({
  selector: 'app-create-roles',
  templateUrl: './create-roles.component.html',
  styleUrls: ['./create-roles.component.scss'],
})
export class CreateRolesComponent implements OnInit{

  ngOnInit() {
    this.fetchRoleHelperService();
    this.fetchManagers();
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

  constructor(private dialog: MatDialog, private roleBasedService: RoleBasedService, private snackBar: MatSnackBar,private spinner: NgxSpinnerService) {

  }
  @ViewChild(MatSort) sort: MatSort | undefined;
  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;
  userName: string = '';
  userFirstName: string = '';
  userLastName: string = '';
  userPassword: string = '';
  roleName: string = '';
  roleDescription: string = '';
  managers: any = [];
  selectedValue: any;
  dropdownEnable: boolean = true;
  roles = ['Admin','Manager','User'];
  updateDropdownState(){
    this.dropdownEnable = this.roleName.toLowerCase() !== 'user';
  };
  addRoleService(){
    const formData: UserRole = {
      userName: this.userName,
      userFirstName: this.userFirstName,
      userLastName: this.userLastName,
      userPassword: this.userPassword,
      role: [{
        roleName: this.roleName,
        roleDescription: this.roleDescription
      }]
    };

    // this.spinner.show();
    this.roleBasedService.createRoles(formData).subscribe((response: any)=>{
      console.log(response.userName);
      console.log(response.userPassword);
      this.snackBar.open('Role Added Successfully', 'close');
    });

    if(this.roleName.toLowerCase() === 'user' ) {
      const agentData = {
        "agentName": this.userFirstName + " " + this.userLastName,
        "managerId": this.selectedValue.managerId,
        "managerName": this.selectedValue.managerName
      };
      this.roleBasedService.tagManagerAgents(agentData).subscribe((response)=>{
        console.log(response);
      })
    }
    // this.spinner.hide();
    setTimeout((): void => {
      this.snackBar.dismiss();
    }, 1000);

  }

  resetForm(){
    this.userName = '';
    this.userFirstName= '';
    this.userLastName = '';
    this.userPassword = '';
    this.roleName = '';
    this.roleDescription = '';
  }
  usersDb: any;
  fetchRoleHelperService(){
    this.spinner.show();
    // @ts-ignore
    this.roleBasedService.getRolesList().subscribe((response):void=>{
      this.usersDb = response;
      // @ts-ignore
      this.dataSource.data = response;
      // @ts-ignore
      this.dataSource.paginator = this.paginator;
      // @ts-ignore
      this.dataSource.sort = this.sort;
      // console.log(response);
      this.spinner.hide();
    });
  }
  $filterClicked: boolean = false;
  isFilterClicked(){
    this.$filterClicked = !this.$filterClicked;
  }


  dataSource = new MatTableDataSource<UserRole>();
  displayedColumns: string[] = ['userName', 'userFirstName', 'userLastName','roleType'];
  applyFilter(filterValue: any) {
    filterValue = filterValue.target.value.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  deleteRecord(rowIndex: number){
    let deleted_record = this.usersDb[rowIndex];
    console.log(deleted_record.userName);
    this.roleBasedService.deleteRecord(deleted_record.userName).subscribe(response=>{
      console.log(response);
      this.fetchRoleHelperService();
    });
  }
  passedForm : any;
  updateRecord(rowIndex: number){
    this.passedForm = this.usersDb[rowIndex];
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
    this.roleBasedService.getManagers().subscribe(response=> {
      this.managers = response;
      // @ts-ignore
      // this.managers  = Array.from(new Set(response.map((item) => item.managerName)));
      console.log(response);

      this.managers.forEach((agent: { managerId: number; managerName: any; }) => {
        const managerExists = this.uniqueManagers.some(manager => manager.managerId === agent.managerId);

        if (!managerExists) {
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
