import {AfterViewInit, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-manager-role',
  templateUrl: './manager-role.component.html',
  styleUrls: ['./manager-role.component.scss']
})
export class ManagerRoleComponent implements OnInit,AfterViewInit{

  ngOnInit() {
    // let objRef1 = document.getElementById("legacyCalls");
    // let objRef2 = document.getElementById("reportingProgress");
    // let objRef3 = document.getElementById("totalQueries");
    // let objRef4 = document.getElementById("queriesSolved");
    // this.animateValue(objRef1, 1, 74, 1000);
    // this.animateValue(objRef2, 1, 71, 1000);
    // this.animateValue(objRef3, 1, 65, 1000);
    // this.animateValue(objRef4, 1, 44, 1000);
  }
  ngAfterViewInit(){
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
      if(obj) {
        obj.innerHTML = Math.floor(progress * (end - start) + start);
      }
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }
}
