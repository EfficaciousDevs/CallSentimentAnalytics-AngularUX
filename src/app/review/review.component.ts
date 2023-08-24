import {AfterViewInit, Component, Inject, OnChanges, OnInit} from '@angular/core';
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";
import {NgxSpinnerService} from "ngx-spinner";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";


@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss']
})
export class ReviewComponent implements OnInit{

  ngOnInit() {
    this.getReviewDetails();
  }

  constructor(private sanitizer: DomSanitizer,public dialog: MatDialog,private callService: CallAnalyticsProxiesService,private spinner: NgxSpinnerService) {
  }
  reviewData: any = [];
  editedRemarkObject: any;

  getReviewDetails(){
    this.spinner.show();
    this.callService.fetchStats().subscribe((data)=>{
      this.reviewData = data;
      // this.reviewData  = this.reviewData.filter((entry: { custSuppSentiment: string; }) => entry.custSuppSentiment === "Negative");
      // console.log(this.reviewData);
      this.spinner.hide();
    })
  }
  editRemark(agentIndex: number){
    this.editedRemarkObject = this.reviewData[agentIndex];
    console.log(this.editedRemarkObject);

    this.openDialog(this.editedRemarkObject);

  }


  openDialog(remarkObject: any): void {
    const dialogRef = this.dialog.open(ReviewDialog, {
      width: '600px',
      data: remarkObject,
    });

    dialogRef.afterClosed().subscribe(result=>{
      if(result){
        console.log(result);
        setTimeout(()=>{
          this.getReviewDetails();
        },2000)
      }
    })
  };
  url: any;


  openAudioDialog(callId: string): void {
    this.spinner.show();
    this.callService.getAudioURL(callId).subscribe((base64:string) => {
      const dialogRef = this.dialog.open(AudioDialog, {
        width: '400px',
        data: `data:audio/mpeg;base64,${base64}`,
      });
      this.spinner.hide();
    });
  };

}


@Component({
  selector: 'dialog-review',
  templateUrl: 'dialog-review.html',
  styleUrls: ['dialog-review.scss']
})
export class ReviewDialog {

  constructor(
    public dialogRef: MatDialogRef<ReviewDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private callService: CallAnalyticsProxiesService
  ) {}
  editedRemark: string = this.data?.remark ? this.data.remark : 'Please enter your remarks.';
  resetForm(){
    this.editedRemark = 'Please enter your remarks.';
  }

  onSubmit(): void {
    const agentData = {
      "callId": this.data.callId,
      "callHoldPermission": this.data.callHoldPermission,
      "transferPermission": this.data.transferPermission,
      "customerProblem": this.data.customerProblem,
      "custSuppSentiment": this.data.custSuppSentiment,
      "summary": this.data.summary,
      "agentId": this.data.agentId,
      "callCategory": this.data.callCategory,
      "dateTime": this.data.dateTime,
      "remark": this.editedRemark
    }
    this.callService.addRemarks(agentData).subscribe((response)=>{
      console.log(response);
    });

    this.dialogRef.close("Remarks Added");
  }
}

@Component({
  selector: 'dialog-audio',
  templateUrl: 'dialog-audio.html',
  styleUrls: ['dialog-audio.scss']
})
export class AudioDialog{
  constructor(
    public dialogRef: MatDialogRef<AudioDialog>,
    @Inject(MAT_DIALOG_DATA) public data: string,

  ) {}
  base64Data: string = this.data;

  dialogClose(){
    this.dialogRef.close(true);
  }
}
