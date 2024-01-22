import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AspectBasedCropService {

  cropCenterBase64(base64Image: string, cropWidth: number, cropHeight: number, devicePixelRatio: number = 1.0): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const context:any = canvas.getContext('2d');

        // Calculate crop dimensions
        cropWidth = cropWidth * 1.1;
        cropHeight =cropHeight* 1.1;
        const cropX1 = (image.width - cropWidth) / 2;
        const cropY1 = (image.height - cropHeight) / 2;

        // Resize dimensions based on device pixel ratio
        const resizedWidth = cropWidth * devicePixelRatio;
        const resizedHeight = cropHeight * devicePixelRatio;

        // Set canvas dimensions
        canvas.width = resizedWidth;
        canvas.height = resizedHeight;

        // Draw the cropped and resized image on the canvas
        context.drawImage(image, cropX1, cropY1, cropWidth, cropHeight, 0, 0, resizedWidth, resizedHeight);

        // Convert the canvas content to base64
        const croppedImageBase64 = canvas.toDataURL('image/png');
        resolve(croppedImageBase64);
      };

      // Set the image source
      image.src = base64Image;

      // Handle image loading error
      image.onerror = (error) => {
        reject(error);
      };
    });
  }
  setGrayscale(imageData: ImageData): ImageData {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);

      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    return imageData;
  }

  removeNoise(imageData: ImageData): ImageData {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const isDark = data[i] < 162 && data[i + 1] < 162 && data[i + 2] < 162;

      if (isDark) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
      } else {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      }
    }

    return imageData;
  }

  applyBlur(imageData: ImageData, radius: number): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newImageData = new ImageData(width, height);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let totalR = 0, totalG = 0, totalB = 0, count = 0;

        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -radius; dy <= radius; dy++) {
            const nx = Math.min(width - 1, Math.max(0, x + dx));
            const ny = Math.min(height - 1, Math.max(0, y + dy));

            const index = (ny * width + nx) * 4;

            totalR += data[index];
            totalG += data[index + 1];
            totalB += data[index + 2];

            count++;
          }
        }

        const currentIndex = (y * width + x) * 4;

        newImageData.data[currentIndex] = totalR / count;
        newImageData.data[currentIndex + 1] = totalG / count;
        newImageData.data[currentIndex + 2] = totalB / count;
        newImageData.data[currentIndex + 3] = data[currentIndex + 3];
      }
    }

    return newImageData;
  }

  applyAdaptiveThreshold(imageData: ImageData, threshold: number): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newImageData = new ImageData(width, height);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const currentIndex = (y * width + x) * 4;

        const gray = data[currentIndex];
        const newColor = gray > threshold ? 255 : 0;

        newImageData.data[currentIndex] = newColor;
        newImageData.data[currentIndex + 1] = newColor;
        newImageData.data[currentIndex + 2] = newColor;
        newImageData.data[currentIndex + 3] = data[currentIndex + 3];
      }
    }

    return newImageData;
  }

  applySharpening(imageData: ImageData, factor: number): ImageData {
    const kernel = [
      [-1, -1, -1],
      [-1, 9 + factor, -1],
      [-1, -1, -1],
    ];

    const newImageData = this.applyConvolutionFilter(imageData, kernel);

    return newImageData;
  }

  private applyConvolutionFilter(imageData: ImageData, kernel: number[][]): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newImageData = new ImageData(width, height);

    const halfKernelSize = Math.floor(kernel.length / 2);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let totalR = 0, totalG = 0, totalB = 0;

        for (let dx = -halfKernelSize; dx <= halfKernelSize; dx++) {
          for (let dy = -halfKernelSize; dy <= halfKernelSize; dy++) {
            const nx = Math.min(width - 1, Math.max(0, x + dx));
            const ny = Math.min(height - 1, Math.max(0, y + dy));

            const index = (ny * width + nx) * 4;
            const kernelValue = kernel[dx + halfKernelSize][dy + halfKernelSize];

            totalR += data[index] * kernelValue;
            totalG += data[index + 1] * kernelValue;
            totalB += data[index + 2] * kernelValue;
          }
        }

        const currentIndex = (y * width + x) * 4;

        newImageData.data[currentIndex] = Math.min(255, Math.max(0, totalR));
        newImageData.data[currentIndex + 1] = Math.min(255, Math.max(0, totalG));
        newImageData.data[currentIndex + 2] = Math.min(255, Math.max(0, totalB));
        newImageData.data[currentIndex + 3] = data[currentIndex + 3];
      }
    }

    return newImageData;
  }
  
}
