export type MediaType = 'audio' | 'image' | 'video';

export type Task = {
  id: string;
  storedName: string;
  mimetype: string;
  path: string;
  format: string;
  inputPath: string;
  outputPath: string;
  outputName: string;
  status: string;
  fileSize: number;
};
