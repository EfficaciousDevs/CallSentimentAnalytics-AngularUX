import {Component, ElementRef, ViewChild} from '@angular/core';
import {NgxSpinnerService} from "ngx-spinner";
import {MatSnackBar} from "@angular/material/snack-bar";
import {DomSanitizer} from "@angular/platform-browser";
import {CallAnalyticsProxiesService} from "../HttpServices/call-analytics-proxies.service";

@Component({
  selector: 'app-call-analytics',
  templateUrl: './call-analytics.component.html',
  styleUrls: ['./call-analytics.component.scss']
})
export class CallAnalyticsComponent {
  constructor(private fileUploadService: CallAnalyticsProxiesService, private sanitizer: DomSanitizer, private snackBar: MatSnackBar,private spinner: NgxSpinnerService) { }


  @ViewChild('fileUploader') fileUploader: ElementRef | undefined;
  // @ts-ignore
  documentData: any;

  chatKeys: string[] = [];
  file: null = null;
  url: any;
  // uploadedFileContent: string | null = null;
  loader = false;
  // @ts-ignore
  rawText: string[];
  audioSrc: any = null;

  ngOnInit(): void {
  }

  onUpload() {
    if (this.file) {
      if (!this.documentData) {
        this.loader = true;
        this.spinner.show();
        this.fileUploadService.uploadAudio(this.file).subscribe((response: any) => {
          this.documentData = response;
          this.chatKeys = Object.keys(response?.Chat_json);
          this.rawText = response?.RawText;
          if (!this.rawText) {
            this.snackBar.open('Error: Invalid Audio Format. Please select a correct file type to get things started.', 'close');
          }
          this.loader = false;
          this.spinner.hide();
          console.log(this.documentData);
        });
      }
    } else {
      this.spinner.hide();
      this.loader = false;
    }
  }

  onChange(event: any) {
    this.file = event.target.files[0];
    this.url = null;
    // @ts-ignore
    this.documentData = null;
    // @ts-ignore
    this.chatKeys = null;
    // @ts-ignore
    this.rawText = null;
    this.audioSrc = null;
    this.snackBar.open('Audio File selected successfully.', 'close');
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();

      reader.readAsDataURL(event.target.files[0]); // read file as data url

      // tslint:disable-next-line:no-shadowed-variable
      reader.onload = (event) => {
        this.url = event.target?.result;
        this.audioSrc = event.target?.result;
        this.url = this.sanitizer.bypassSecurityTrustUrl(this.url);
        this.audioSrc = this.sanitizer.bypassSecurityTrustUrl(this.audioSrc);
      };
    }

    setTimeout((): void => {
      this.snackBar.dismiss();
    }, 2000);
  }
  resetFileUploader() {
    // @ts-ignore
    this.fileUploader.nativeElement.value = null;
    // @ts-ignore
    this.documentData = null;
    this.url = null;
    this.file = null;
    this.audioSrc = null;
    this.loader = false;
  }

}
