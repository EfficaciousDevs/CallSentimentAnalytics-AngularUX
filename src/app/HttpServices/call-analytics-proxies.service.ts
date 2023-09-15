import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {AuthService} from "./auth.service";

@Injectable({
  providedIn: 'root'
})
export class CallAnalyticsProxiesService {
  AUDIO_API_URL = "http://52.172.252.7:5010/analyse_chat";
  DEFAULT_ANALYSIS_API: string = "http://52.172.252.7:8080/Call-Sentiments-Analytics/default-analysis";
  addRemarksURL: string = 'http://52.172.252.7:8080/Call-Sentiments-Analytics/add-remarks';
  // assignTrainingAPI: string = 'http://localhost:8089/assignTraining';
  agentManagersAPI: string = 'http://52.172.252.7:8080/Call-Sentiments-Analytics/agentManagers';
  audioFileURL: string = 'http://52.172.252.7:8080/Call-Sentiments-Analytics/getAudioFile';

  getMainDbUsers: string = 'http://52.172.252.7:8080/Call-Sentiments-Analytics/get-users';
  getReviewDataURL: string = 'http://52.172.252.7:8080/Call-Sentiments-Analytics/getManagerReviewData';
  // updateUserDetailsAPI : string = 'http://localhost:8089/update-user';

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
  fetchManagers(){
    return this.httpClient.get(this.getMainDbUsers);
  }

  getReviewData(passedIds: any){
    const agentIds = new FormData();
    agentIds.append("agentIds",passedIds)
    return this.httpClient.post(this.getReviewDataURL,agentIds,{
      headers: this.requestHeader
    })
  }
  fetchAgentStats(agentId: string){
    const agentData = new FormData();
    agentData.append("agentId",agentId);
    return this.httpClient.post("http://52.172.252.7:8080/Call-Sentiments-Analytics/getAgentAnalytics",agentData,{
      headers: this.requestHeader
    })
  }
  requestHeader = new HttpHeaders({ 'No-Auth': 'True' });
  addRemarks(remarks: any){
    return this.httpClient.post(this.addRemarksURL,remarks,{
      headers: this.requestHeader,responseType: 'text'
    })
  }

  tagTrainingCourse(agentObject: any){
    return this.httpClient.post('http://52.172.252.7:8080/Call-Sentiments-Analytics/addLearners',agentObject,{
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
    formdata.append("userId", agentId.toString());
    return this.httpClient.post('http://52.172.252.7:8080/Call-Sentiments-Analytics/delete-user',formdata,{
      headers: this.requestHeader,responseType: 'text'
    });
  }

  public addLearner(learner: any){
    const learnerObject = {
      "agentId": learner.userId,
      "agentName": learner.agentName,
      "managerId": learner.managerId,
      "managerName": learner.managerName,
      "trainingStartDate": learner.trainingStartDate,
      "trainingEndDate": learner.trainingEndDate,
      "trainingDays": learner.trainingDays,
      "trainingCourse": learner.trainingProgram
    };
    return this.httpClient.post('http://52.172.252.7:8080/Call-Sentiments-Analytics/addLearners',learnerObject,{
      headers: this.requestHeader,responseType: 'text'
    });
  }

  public getLearners(){
    return this.httpClient.get('http://52.172.252.7:8080/Call-Sentiments-Analytics/get-learners');
  }

  public deleteCallers(callId: string){
    const formData = new FormData();
    formData.append("callId",callId);
    return this.httpClient.post('http://52.172.252.7:8080/Call-Sentiments-Analytics/remove-agent',formData,{
      headers: this.requestHeader,responseType: 'text'
    })
  }
}
