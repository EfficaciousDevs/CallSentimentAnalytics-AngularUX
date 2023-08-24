import { Component } from '@angular/core';
import {MatDialogRef} from "@angular/material/dialog";
import {Router} from "@angular/router";

@Component({
  selector: 'app-alert-dialog-window',
  templateUrl: './alert-dialog-window.component.html',
  styleUrls: ['./alert-dialog-window.component.scss']
})
export class AlertDialogWindowComponent {
  constructor(public dialogRef: MatDialogRef<AlertDialogWindowComponent>) {
  }

}
