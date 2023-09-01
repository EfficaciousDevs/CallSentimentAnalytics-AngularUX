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
  createRolesAPI: string = 'http://localhost:8089/register-user';
  // getUsersAPI: string = 'http://localhost:8089/getUsers';
  getMainUsers: string = 'http://localhost:8089/get-users';
  deleteUserAPI: string = 'http://localhost:8089/delete-user';
  updateUserAPI: string = 'http://localhost:8089/updateUser';
  updateUserDetailsAPI : string = 'http://localhost:8089/update-user';

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

  public deleteRecord(userId: number) {
    const deleteId = new FormData();
    deleteId.append("userId",userId.toString())
    // @ts-ignore
    return this.httpclient.post(this.deleteUserAPI, deleteId,{
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
      headers: this.requestHeader,responseType: 'text'
    });
  }

  public getRolesList(){
    return this.httpclient.get(this.getMainUsers);
  }


  public roleMatch(allowedRoles : any): boolean {
    let isMatch = false;
    const userRoles: any = this.userAuthService.getRoles();

    if (userRoles != null && userRoles) {
      for (let i = 0; i < userRoles.length; i++) {
        for (let j = 0; j < allowedRoles.length; j++) {
          if (userRoles == allowedRoles[j]) {
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

  public getUsersDB(){
    return this.httpclient.get('http://localhost:8089/get-users');
  }

  public updateOperation(userObject: any){


    return this.httpclient.post(this.updateUserDetailsAPI,userObject,{
      headers: this.requestHeader,responseType: 'text'
    })
  }
}
