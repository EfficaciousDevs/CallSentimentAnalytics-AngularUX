import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {AuthService} from "./auth.service";

@Injectable({
  providedIn: 'root'
})
export class RoleBasedService {

  authenticationAPI: string = 'http://localhost:8089/authenticate';
  userAPI: string = 'http://localhost:8089/forUser';
  adminAPI: string = 'http://localhost:8089/forAdmin';
  createRolesAPI: string = 'http://localhost:8089/registerNewUser';
  getUsersAPI: string = 'http://localhost:8089/getUsers';

  requestHeader = new HttpHeaders({ 'No-Auth': 'True' });
  constructor(
      private httpclient: HttpClient,
      private userAuthService: AuthService
  ) {}

  public login(loginData:any) {
    return this.httpclient.post(this.authenticationAPI, loginData, {
      headers: this.requestHeader,
    });
  }

  public forUser() {
    return this.httpclient.get(this.userAPI, {
      responseType: 'text',
    });
  }


  public forAdmin() {
    return this.httpclient.get(this.adminAPI, {
      responseType: 'text',
    });
  }

  public createRoles(roleDetails: any) {
    return this.httpclient.post(this.createRolesAPI, roleDetails, {
      headers: this.requestHeader,
    });
  }

  public getRolesList(){
    return this.httpclient.get(this.getUsersAPI);
  }

  public roleMatch(allowedRoles : any): boolean {
    let isMatch = false;
    const userRoles: any = this.userAuthService.getRoles();

    if (userRoles != null && userRoles) {
      for (let i = 0; i < userRoles.length; i++) {
        for (let j = 0; j < allowedRoles.length; j++) {
          if (userRoles[i].roleName === allowedRoles[j]) {
            isMatch = true;
            return isMatch;
          } else {
            return isMatch;
          }
        }
      }
    }
    return isMatch;
  }
}
