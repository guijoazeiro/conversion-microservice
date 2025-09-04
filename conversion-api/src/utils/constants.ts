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

export const ERRORS = {
  CREATE_CONVERSION: 'Conversion creation failed',
  GET_TASK_BY_ID: 'Task retrieval failed',
  GET_TASK_FILES: 'Task files retrieval failed',
  GET_TASK_STATUS: 'Task status retrieval failed',
  GET_FILES: 'Files retrieval failed',
  DOWNLOAD_FILE: 'File download failed',

  FILE_REQUIRED: 'File is required',
  FILE_NOT_FOUND: 'File not found',
  FILE_NOT_COMPLETED: 'File conversion not completed',
  OUTPUT_FILE_NOT_FOUND: 'Output file not found',

  UNSUPPORTED_MEDIA_FORMAT: 'Unsupported source format',
  UNSUPPORTED_TARGET_FORMAT: 'Unsupported target format',
  SAME_FORMAT: 'Source and target formats cannot match',

  INTERNAL_SERVER: 'Internal server error'
};

