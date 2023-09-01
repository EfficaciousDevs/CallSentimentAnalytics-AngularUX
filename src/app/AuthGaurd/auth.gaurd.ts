import { Injectable } from '@angular/core';
import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    UrlTree,
    Router,
} from '@angular/router';
import { Observable } from 'rxjs';
import {AuthService} from "../HttpServices/auth.service";
import {RoleBasedService} from "../HttpServices/role-based.service";

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    constructor(
        private userAuthService: AuthService,
        private router: Router,
        private roleBasedService: RoleBasedService
    ) {}
    authorizedRoles: string[] = ['Admin','Manager','User'];
    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ):
        | Observable<boolean | UrlTree>
        | Promise<boolean | UrlTree>
        | boolean
        | UrlTree {
        if (this.userAuthService.getToken() != null && this.userAuthService.fullName.length > 0) {
            const role = route.data['roles'];
            if (role) {
                const match = this.authorizedRoles.includes(role[0]);
                if (match) {
                    return true;
                } else {
                    this.router.navigate(['/forbidden']);
                    return false;
                }
            }
        }

        this.router.navigate(['/login']);
        return false;
    }
}
