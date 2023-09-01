import {AfterViewInit, Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RoleBasedService} from "../HttpServices/role-based.service";
import {UserRole} from "../create-roles/create-roles.component";

@Component({
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.scss']
})
export class EditUserDialogComponent implements OnInit{

  userName: string = this.data.userName;
  fullName: string = this.data.adminName? this.data.adminName :
    this.data.managerName && !this.data.agentName ?
      this.data.managerName : this.data.agentName;
  userPassword: string = 'Create New Password';
  roleType: string = this.data.roleType;
  adminId: number = this.data.adminId? this.data.adminId: 0;
  managerId: number = this.data.managerId? this.data.managerId: 0;
  selectedValue: any;
  dropdownEnable: boolean = true;
  activeManager: boolean = this.data.managerName && !this.data.agentName;
  activeAdmin: boolean = !!this.data.adminName;
  managerName: string = this.data.managerName ? this.data.managerName : '';
  constructor(
    private service: RoleBasedService,
    public dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
  }
  ngOnInit() {
    this.fetchManagers();
  }

  reflectId() {
    // @ts-ignore
    this.managerId = this.uniqueManagers.find(user => user.managerName === this.managerName)?.managerId;
  }
  roles = ['Admin','Manager','User'];
  resetForm(){
    this.fullName = this.data.adminName? this.data.adminName :
      this.data.managerName && !this.data.agentName ?
        this.data.managerName : this.data.agentName;
    this.userName= this.data.userName;
    this.userPassword = 'Create New Password';
    this.managerId = this.data.managerId;
    this.managerName = this.data.managerName;
  }
  managers: any = [];
  fetchManagers(){
    this.service.getUsersDB().subscribe(response=> {
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
  updateHelper() {
    if (this.roleType ==='User') {
      const agentData = {
        "userId" : this.data.userId,
        "agentName": this.fullName,
        "managerId": this.uniqueManagers.find(user => user.managerName === this.managerName)?.managerId,
        "managerName": this.uniqueManagers.find(user => user.managerName === this.managerName)?.managerName,
        "password": this.userPassword,
        "roleType": this.roleType,
        "userName": this.userName
      };

      this.service.updateOperation(agentData).subscribe(response => {
        console.log(response);
      });


    } else if (this.roleType.toLowerCase() === 'manager') {
      const managerData: any = {
        "userId" : this.data.userId,
        "managerId": this.managerId,
        "managerName": this.fullName,
        "password": this.userPassword,
        "roleType": this.roleType,
        "userName": this.userName
      };
      this.service.updateOperation(managerData).subscribe(response => {
        console.log(response);
      });
    } else {
      const adminData = {
        "userId" : this.data.userId,
        "adminId": this.adminId,
        "adminName": this.fullName,
        "userName": this.userName,
        "roleType": this.roleType,
        "password": this.userPassword

      };
      this.service.updateOperation(adminData).subscribe(response => {
        console.log(response);
      });
    }


    this.dialogRef.close("Data has been updated Successfully");
  }

}
