import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-user-role',
  templateUrl: './user-role.component.html',
  styleUrls: ['./user-role.component.scss']
})
export class UserRoleComponent implements OnInit{

ngOnInit() {
  let objRef1 = document.getElementById("legacyCalls");
  let objRef2 = document.getElementById("reportingProgress");
  let objRef3 = document.getElementById("totalQueries");
  let objRef4 = document.getElementById("queriesSolved");
  this.animateValue(objRef1, 1, 74, 1000);
  this.animateValue(objRef2, 1, 71, 1000);
  this.animateValue(objRef3, 1, 65, 1000);
  this.animateValue(objRef4, 1, 44, 1000);
}

  animateValue(obj : any, start: any, end: any, duration: any) {
    let startTimestamp: any = null;
    const step = (timestamp: any) => {
      if (!startTimestamp)
        startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      obj.innerHTML = Math.floor(progress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }
}
