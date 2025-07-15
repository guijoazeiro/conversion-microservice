import { Schema, model } from 'mongoose';

const TaskSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    originalName: String,
    storedName: String,
    mimetype: String,
    path: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'done', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

export const Task = model('Task', TaskSchema);
