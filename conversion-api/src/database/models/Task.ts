import { Schema, model, Document } from 'mongoose';
import { v7 as uuidv7 } from 'uuid';

interface ITask extends Document {
  _id: string;
  originalName?: string;
  storedName?: string;
  mimetype?: string;
  path?: string;
  format?: string;
  inputPath?: string;
  outputPath?: string;
  outputName?: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    _id: {
      type: String,
      default: () => uuidv7(),
    },
    originalName: String,
    storedName: String,
    mimetype: String,
    path: String,
    format: String,
    inputPath: String,
    outputPath: String,
    outputName: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'done', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    id: false,
    toJSON: {
      virtuals: true,
      transform: function (doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const Task = model<ITask>('Task', TaskSchema);
