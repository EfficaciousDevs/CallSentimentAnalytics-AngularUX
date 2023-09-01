import {HostListener, Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

    // authFirstName: string = '';
    // authLastName: string = '';
    fullName: string = '';
    userId: number = 0;
    managerId: number = 0;
    roleType: string = '';
    public setRoles(roles: any[]) {
        localStorage.setItem('roles', JSON.stringify(roles));
    }

    public getRoles(): any[] {
        // @ts-ignore
        return JSON.parse(localStorage.getItem('roles'));
    }

    public setToken(jwtToken: string) {
        localStorage.setItem('jwtToken', jwtToken);
    }

    public getToken(): string {
        // @ts-ignore
        return localStorage.getItem('jwtToken');
    }

    public clear() {
        localStorage.clear();
    }

    public isLoggedIn() {
        return this.getRoles() && this.getToken();
    }

}
