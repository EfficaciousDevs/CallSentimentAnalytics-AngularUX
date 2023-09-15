import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {AuthService} from "./auth.service";
import {UserRole} from "../create-roles/create-roles.component";

@Injectable({
  providedIn: 'root'
})
export class RoleBasedService {

  authenticationAPI: string = 'http://52.172.252.7:8080/Call-Sentiments-Analytics/authenticate';
  // userAPI: string = 'http://localhost:8089/forUser';
  // adminAPI: string = 'http://localhost:8089/forAdmin';
  createRolesAPI: string = 'http://52.172.252.7:8080/Call-Sentiments-Analytics/register-user';
  // getUsersAPI: string = 'http://localhost:8089/getUsers';
  getMainUsers: string = 'http://52.172.252.7:8080/Call-Sentiments-Analytics/get-users';
  deleteUserAPI: string = 'http://52.172.252.7:8080/Call-Sentiments-Analytics/delete-user';
  // updateUserAPI: string = 'http://localhost:8089/updateUser';
  updateUserDetailsAPI : string = 'http://52.172.252.7:8080/Call-Sentiments-Analytics/update-user';

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
    return this.httpclient.get('http://52.172.252.7:8080/Call-Sentiments-Analytics/agentManagers');
  }

  public tagManagerAgents(agent: any){
    return this.httpclient.post('http://52.172.252.7:8080/Call-Sentiments-Analytics/addNewAgents',agent,{
      headers: this.requestHeader,responseType: 'text'
    });
  }

  public getUsersDB(){
    return this.httpclient.get('http://52.172.252.7:8080/Call-Sentiments-Analytics/get-users');
  }

  public updateOperation(userObject: any){


    return this.httpclient.post(this.updateUserDetailsAPI,userObject,{
      headers: this.requestHeader,responseType: 'text'
    })
  }
}
