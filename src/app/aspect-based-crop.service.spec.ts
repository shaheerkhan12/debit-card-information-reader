import { TestBed } from '@angular/core/testing';

import { AspectBasedCropService } from './aspect-based-crop.service';

describe('AspectBasedCropService', () => {
  let service: AspectBasedCropService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AspectBasedCropService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
