import { ImageService } from './ImageService';
import { VideoService } from './VideoService';

export class ConversionService {
  constructor(
    private imageService = new ImageService(),
    private videoService = new VideoService(),
  ) {
    this.imageService = imageService;
    this.videoService = videoService;
  }

  async process({ file, format }: { file: Express.Multer.File; format: string }) {
    const type = file.mimetype.split('/')[0];
    if(type === 'image') return this.imageService.process({ file, format });    
    if (type === 'video') return this.videoService.process({ file, format });
    throw new Error('Formato de arquivo inválido');
  }
}
