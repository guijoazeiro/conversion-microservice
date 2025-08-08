import { MediaType } from './types';

export const STATUS_PENDING = 'pending';
export const STATUS_PROCESSING = 'processing';
export const STATUS_DONE = 'done';
export const STATUS_FAILED = 'failed';

export const OK_CODE = 200;
export const CREATED_CODE = 201;
export const NOT_FOUND_CODE = 404;
export const BAD_REQUEST_CODE = 400;
export const INTERNAL_SERVER_ERROR_CODE = 500;

export const VIDEO_ALLOWED_FORMATS = [
  'mp3',
  'wav',
  'avi',
  'mp4',
  'mkv',
  'mov',
  'wmv',
  'flv',
  'gif',
  'images',
];
export const IMAGE_ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];

export const AUDIO_ALLOWED_FORMATS = [
  'mp3',
  'wav',
  'flac',
  'ogg',
  'wma',
  'aac',
];

export const ALLOWED_FORMATS_MAP: Record<MediaType, string[]> = {
  audio: ['mp3', 'wav', 'flac', 'ogg', 'wma', 'aac'],
  image: ['jpg', 'jpeg', 'png', 'webp'],
  video: [
    'mp3',
    'wav',
    'avi',
    'mp4',
    'mkv',
    'mov',
    'wmv',
    'flv',
    'gif',
    'images',
  ],
};
