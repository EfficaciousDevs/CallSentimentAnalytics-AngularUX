import {AfterViewInit, Component, OnInit} from '@angular/core';
import {AlertDialogWindowComponent} from "../alert-dialog-window/alert-dialog-window.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-admin-role',
  templateUrl: './admin-role.component.html',
  styleUrls: ['./admin-role.component.scss']
})
export class AdminRoleComponent implements OnInit{



  ngOnInit(): void {
    this.animateValues();
  }

  animateValues() {
    this.animateValue("legacyCalls", 1, 74, 1000);
    this.animateValue("reportingProgress", 1, 71, 1000);
    this.animateValue("totalQueries", 1, 65, 1000);
    this.animateValue("queriesSolved", 1, 44, 1000);
  }

  animateValue(elementId: string, start: number, end: number, duration: number) {
    const obj = document.getElementById(elementId);
    if (!obj) {
      console.error(`Element with ID '${elementId}' not found.`);
      return;
    }

    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp)
        startTimestamp = timestamp;

      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      obj.innerHTML = Math.floor(progress * (end - start) + start).toString();

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }
}
