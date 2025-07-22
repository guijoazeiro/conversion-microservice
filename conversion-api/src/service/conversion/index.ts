import { HttpError } from '../../errors/HttpError';
import { AudioService } from './AudioService';
import { ImageService } from './ImageService';
import { VideoService } from './VideoService';

export class ConversionService {
  constructor(
    private imageService = new ImageService(),
    private videoService = new VideoService(),
    private audioService = new AudioService(),
  ) {
    this.imageService = imageService;
    this.videoService = videoService;
    this.audioService = audioService;
  }

  async process({
    file,
    format,
  }: {
    file: Express.Multer.File;
    format: string;
  }) {
    const type = file.mimetype.split('/')[0];
    if (type === 'image') return this.imageService.process({ file, format });
    if (type === 'video') return this.videoService.process({ file, format });
    if (type === 'audio') return this.audioService.process({ file, format });

    throw new HttpError(`Arquivo não pode ser convertido`, 400);
  }
}
