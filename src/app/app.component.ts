import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { WebcamImage, WebcamModule } from 'ngx-webcam';
import { AspectBasedCropService } from './aspect-based-crop.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HttpClientModule,
    FormsModule,
    WebcamModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'card-read';
  private apiUrl = 'https://dev-apps.paysky.io/card-reader/detect_card_info';
  private trigger: Subject<any> = new Subject();
  public webcamImage!: WebcamImage;
  private nextWebcam: Subject<any> = new Subject();
  sysImage = '';
  condition: boolean = false;
  croppedImage: string | undefined;
  data: any;
  ratio = window.devicePixelRatio || 1;
  captured: any;
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private renderer: Renderer2,
    private el: ElementRef,
    private imageCropService: AspectBasedCropService
  ) {
    this.checkWidth(window.innerWidth);
  }

  ngOnInit() {}
  public getSnapshot(): void {
    this.trigger.next(void 0);
  }
  public captureImg(webcamImage: WebcamImage): void {
    // this.uploadImage(webcamImage!.imageAsDataUrl);

    this.webcamImage = webcamImage;
    this.sysImage = webcamImage!.imageAsDataUrl;
    console.info('got webcam image', this.sysImage);
    // this.uploadImage(this.sysImage);
    const sourceImageUrl = this.sysImage;
    const aspectRatio = 0.8; // Set your desired aspect ratio
    this.imageCropService
      .cropCenterBase64(webcamImage!.imageAsDataUrl, 300, 200, 2.0)
      .then((croppedBase64Image) => {
        this.croppedImage = croppedBase64Image;
        this.uploadImage(this.croppedImage);
      })
      .catch((error) => console.error('Error cropping image:', error));
  }
  public get invokeObservable(): Observable<any> {
    return this.trigger.asObservable();
  }
  public get nextWebcamObservable(): Observable<any> {
    return this.nextWebcam.asObservable();
  }
  uploadImage(capture: any): void {
    const img = new Image();
    img.src = capture;

    // Draw the image on a canvas
    const canvas = document.createElement('canvas');
    const ctx: any = canvas.getContext('2d');
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Get the image data from the canvas
      const imageData = ctx.getImageData(0, 0, img.width, img.height);

      // Apply image processing
      let processedImageData = this.imageCropService.setGrayscale(imageData);
      // processedImageData= this.imageProcessingService.removeNoise(processedImageData);

      const blurRadius = 5; // Adjust the blur radius as needed
      const adaptiveThreshold = 120; // Adjust the adaptive threshold as needed
      const sharpeningFactor = 0.1; // Adjust the sharpening factor as needed

      // processedImageData = this.imageProcessingService.applyBlur(processedImageData, blurRadius);
      // processedImageData = this.imageProcessingService.applyAdaptiveThreshold(processedImageData, adaptiveThreshold);
      processedImageData = this.imageCropService.applySharpening(
        processedImageData,
        sharpeningFactor
      );

      // Draw the processed image on a new canvas
      const processedCanvas = document.createElement('canvas');
      const processedCtx: any = processedCanvas.getContext('2d');
      processedCanvas.width = img.width;
      processedCanvas.height = img.height;
      processedCtx.putImageData(processedImageData, 0, 0);

      // Set the processed image as the source for the processedImage variable
      capture = processedCanvas.toDataURL();
      this.captured = capture
    };
    if (capture) {
      const formData = new FormData();
      formData.append('file', this.dataURItoBlob(capture));

      this.http.post(this.apiUrl, formData).subscribe({
        next: (data) => {
          console.log(data);
          this.data = data;
        },
        error: (error) => {
          // Handle error
        },
      });
    }
  }
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkWidth(window.innerWidth);
  }

  private checkWidth(width: number): void {
    if (width < 600) {
      // Do something when the window width is less than 600 pixels
      this.condition = true;
    } else {
      this.condition = false;

      // Do something else when the window width is greater than or equal to 600 pixels
    }
  }
  private dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
  }
}
