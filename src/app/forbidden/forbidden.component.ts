import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {DomSanitizer} from "@angular/platform-browser";

@Component({
  selector: 'app-forbidden',
  templateUrl: './forbidden.component.html',
  styleUrls: ['./forbidden.component.scss']
})
export class ForbiddenComponent{

  constructor(private router: Router) {
  }


  routeHome(){
    this.router.navigate(['/login']);

  }
}
