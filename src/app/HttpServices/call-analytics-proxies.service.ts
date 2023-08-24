import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {AuthService} from "./auth.service";

@Injectable({
  providedIn: 'root'
})
export class CallAnalyticsProxiesService {
  AUDIO_API_URL = "http://52.172.252.7:5010/analyse_chat";
  DEFAULT_ANALYSIS_API: string = "http://localhost:8089/default-analysis";
  addRemarksURL: string = 'http://localhost:8089/add-remarks';
  assignTrainingAPI: string = 'http://localhost:8089/assignTraining';
  agentManagersAPI: string = 'http://localhost:8089/agentManagers';
  audioFileURL: string = 'http://localhost:8089/getAudioFile';

  constructor(private httpClient: HttpClient) {
  }

  uploadAudio(file: File): Observable<any> {
    let formData = new FormData();

    formData.append("file", file);
    return this.httpClient.post<any>(this.AUDIO_API_URL, formData);
  }

  fetchStats(){
    return this.httpClient.get(this.DEFAULT_ANALYSIS_API);
  }
  requestHeader = new HttpHeaders({ 'No-Auth': 'True' });
  addRemarks(remarks: any){
    return this.httpClient.post(this.addRemarksURL,remarks,{
      headers: this.requestHeader,responseType: 'text'
    })
  }

  tagTrainingCourse(agentObject: any){
    return this.httpClient.post(this.assignTrainingAPI,agentObject,{
      headers: this.requestHeader,responseType: 'text'
    })
  }

  getAgentList(){
    return this.httpClient.get(this.agentManagersAPI);
  }

  getAudioURL(callId: string){
    const formData = new FormData();
    formData.append("callId",callId);
    return this.httpClient.post(this.audioFileURL,formData,{headers: this.requestHeader,responseType: 'text'});
}


  public deleteAgents(agentId: number){
    const formdata = new FormData();
    formdata.append("agentId", agentId.toString());
    return this.httpClient.post('http://localhost:8089/delete-agents',formdata,{
      headers: this.requestHeader,responseType: 'text'
    });
  }

  public addLearner(learner: any){
    const learnerObject = {
      "agentId": learner.agentId,
      "agentName": learner.agentName,
      "managerId": learner.managerId,
      "managerName": learner.managerName,
      "trainingStartDate": learner.trainingStartDate,
      "trainingEndDate": learner.trainingEndDate,
      "trainingDays": learner.trainingDays,
      "trainingCourse": learner.trainingCourse
    };
    return this.httpClient.post('http://localhost:8089/addLearners',learnerObject,{
      headers: this.requestHeader,responseType: 'text'
    });
  }

  public getLearners(){
    return this.httpClient.get('http://localhost:8089/get-learners');
  }
}
