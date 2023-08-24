import {AfterViewInit, Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {RoleBasedService} from "../HttpServices/role-based.service";
import {UserRole} from "../create-roles/create-roles.component";

@Component({
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.scss']
})
export class EditUserDialogComponent {

  userName: string = this.data.userName;
  userFirstName: string = this.data.userFirstName;
  userLastName: string = this.data.userLastName;
  userPassword: string = this.data.userPassword;
  roleName: string = this.data.role[0].roleName;
  roleDescription: string = this.data.role[0].roleDescription;

  constructor(
    private service: RoleBasedService,
    public dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
  }

  roles = ['Admin','Manager','User'];
  resetForm() {
    this.userName = '';
    this.userFirstName = '';
    this.userLastName = '';
    this.userPassword = '';
    this.roleName = '';
    this.roleDescription = '';
  }

  updateHelper() {
    const result: UserRole = {
      userName: this.userName,
      userFirstName: this.userFirstName,
      userLastName: this.userLastName,
      userPassword: this.userPassword,
      role: [{
        roleName: this.roleName,
        roleDescription: this.roleDescription
      }]
    };

    this.service.updateRecord(result).subscribe(response => {
      console.log(response);
    });
    // if((this.data.role[0].roleName.toLowerCase() === 'admin' || this.data.role[0].roleName.toLowerCase() === 'user') && this.roleName.toLowerCase() == 'manager'){
    //
    // }
    this.dialogRef.close("Data has been updated Successfully");
  }
}
