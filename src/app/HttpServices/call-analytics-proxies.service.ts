import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {AuthService} from "./auth.service";

@Injectable({
  providedIn: 'root'
})
export class CallAnalyticsProxiesService {
  AUDIO_API_URL = "http://52.172.252.7:5010/analyse_chat";


  constructor(private httpClient: HttpClient) {
  }

  uploadAudio(file: File): Observable<any> {
    let formData = new FormData();

    formData.append("file", file);
    return this.httpClient.post<any>(this.AUDIO_API_URL, formData);
  }


}
