import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {AuthService} from "./auth.service";
import {UserRole} from "../create-roles/create-roles.component";

@Injectable({
  providedIn: 'root'
})
export class RoleBasedService {

  authenticationAPI: string = 'http://localhost:8089/authenticate';
  userAPI: string = 'http://localhost:8089/forUser';
  adminAPI: string = 'http://localhost:8089/forAdmin';
  createRolesAPI: string = 'http://localhost:8089/registerNewUser';
  getUsersAPI: string = 'http://localhost:8089/getUsers';
  deleteUserAPI: string = 'http://localhost:8089/deleteUser';
  updateUserAPI: string = 'http://localhost:8089/updateUser';

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

  public deleteRecord(recordUserName: string) {

    // @ts-ignore
    return this.httpclient.post(this.deleteUserAPI, recordUserName,{
      headers: this.requestHeader, responseType: 'text'
    },);
  }

  public updateRecord(user : any){
    const updatedUser = {
      "userName": user.userName,
      "userFirstName": user.userFirstName,
      "userLastName": user.userLastName,
      "userPassword": user.userPassword,
      "role": [
      {
        "roleName": user.role[0].roleName,
        "roleDescription": user.role[0].roleDescription
      }
    ]
    };

    return this.httpclient.post(this.updateUserAPI,updatedUser,{
      headers: this.requestHeader,responseType: 'text'
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

  public getManagers(){
    return this.httpclient.get('http://localhost:8089/agentManagers');
  }

  public tagManagerAgents(agent: any){
    return this.httpclient.post('http://localhost:8089/addNewAgents',agent,{
      headers: this.requestHeader,responseType: 'text'
    });
  }


}
