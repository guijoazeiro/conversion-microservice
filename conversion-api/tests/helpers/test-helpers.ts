export interface MockTask {
  id: string;
  original_name: string;
  stored_name: string;
  input_path: string;
  mimetype: string;
  format: string;
  file_size: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MockConversionData {
  inputPath: string;
  mimetype: string;
  format: string;
  fileSize: number;
  originalName: string;
  storedName: string;
  status: string;
}

export const TestDataFactory = {
  createMockMulterFile(
    overrides: Partial<Express.Multer.File> = {},
  ): Express.Multer.File {
    return {
      fieldname: 'file',
      originalname: 'test-image.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: '/tmp/uploads',
      filename: 'test-image-123456.jpg',
      path: '/tmp/uploads/test-image-123456.jpg',
      size: 1024,
      buffer: Buffer.from('fake-image-content'),
      stream: {} as any,
      ...overrides,
    };
  },

  createMockTask(overrides: Partial<MockTask> = {}): MockTask {
    return {
      id: 'test-task-id-123',
      original_name: 'test-file.jpg',
      stored_name: 'stored-test-file.jpg',
      input_path: '/uploads/stored-test-file.jpg',
      mimetype: 'image/jpeg',
      format: 'png',
      file_size: 1024,
      status: 'pending',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      ...overrides,
    };
  },

  createMockConversionData(overrides: Partial<MockConversionData> = {}): MockConversionData {
    return {
      inputPath: '/tmp/uploads/test-file.jpg',
      mimetype: 'image/jpeg',
      format: 'png',
      fileSize: 1024,
      originalName: 'test-file.jpg',
      storedName: 'stored-test-file.jpg',
      status: 'pending',
      ...overrides,
    };
  },

  createMockTaskBatch(count: number, baseOverrides: Partial<MockTask> = {}): MockTask[] {
    return Array.from({ length: count }, (_, index) => 
      this.createMockTask({
        id: `task-${index + 1}`,
        original_name: `file-${index + 1}.jpg`,
        stored_name: `stored-file-${index + 1}.jpg`,
        ...baseOverrides,
      })
    );
  },

  createMockPaginationParams(overrides: any = {}) {
    return {
      query: {},
      skip: 0,
      limit: 10,
      page: 1,
      ...overrides,
    };
  },
};

export const TestConstants = {
  MEDIA_TYPES: {
    IMAGE_JPEG: 'image/jpeg',
    IMAGE_PNG: 'image/png',
    AUDIO_MP3: 'audio/mpeg',
    AUDIO_WAV: 'audio/wav',
    VIDEO_MP4: 'video/mp4',
    TEXT_PLAIN: 'text/plain',
  },

  FORMATS: {
    IMAGE: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    AUDIO: ['mp3', 'wav', 'flac', 'ogg', 'wma', 'aac'],
    VIDEO: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv'],
  },

  STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    DONE: 'done',
    FAILED: 'failed',
  },

  HTTP_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },

  SAMPLE_PATHS: {
    UPLOAD_DIR: '/tmp/uploads',
    OUTPUT_DIR: '/tmp/outputs',
    TEST_IMAGE: '/tmp/test-image.jpg',
    TEST_AUDIO: '/tmp/test-audio.mp3',
    TEST_VIDEO: '/tmp/test-video.mp4',
  },

  SAMPLE_SIZES: {
    SMALL: 1024,      
    MEDIUM: 1048576,  
    LARGE: 10485760,  
  },
};

