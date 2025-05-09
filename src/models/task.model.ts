import mongoose, { Schema, Document } from 'mongoose';
import { Note } from '../types/task.types'; 
import { config } from '../config';

export interface ITaskDocument extends Omit<Note, 'id'>, Document {
  _id: string; 
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    _id: { type: String, required: true }, 
    content: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  {

    collection: config.mongo.collectionName,
    versionKey: false, 
  }
);

export const TaskModel = mongoose.model<ITaskDocument>('Task', TaskSchema);