import {Component, OnInit} from '@angular/core';
import {AlertDialogWindowComponent} from "../alert-dialog-window/alert-dialog-window.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-admin-role',
  templateUrl: './admin-role.component.html',
  styleUrls: ['./admin-role.component.scss']
})
export class AdminRoleComponent implements OnInit{
  constructor(public dialog: MatDialog) {}

  // openDialog(): void {
  //   this.dialog.open(AlertDialogWindowComponent, {
  //     width: '450px'
  //   });
  // }

  ngOnInit(): void {
    // this.openDialog();
  }
}
