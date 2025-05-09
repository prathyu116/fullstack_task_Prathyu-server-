import { redisClient } from '../config/redis.config';
import { TaskModel, ITaskDocument } from '../models/task.model';
import { Note } from '../types/task.types';
import { config } from '../config';
import { logger } from '../utils/logger';

const CACHE_KEY = config.redis.cacheKey;
const MAX_CACHE_ITEMS = config.maxCacheItems;

async function getNotesFromCache(): Promise<Note[]> {
  const stringifiedNotes = await redisClient.get(CACHE_KEY);
  if (!stringifiedNotes) {
    return [];
  }
  const parsedNotes: Array<Omit<Note, 'createdAt'> & { createdAt: string }> = JSON.parse(stringifiedNotes);
  return parsedNotes.map(note => ({
    ...note,
    createdAt: new Date(note.createdAt), 
  }));
}

async function saveNotesToCache(notes: Note[]): Promise<void> {
  await redisClient.set(CACHE_KEY, JSON.stringify(notes));
}

// Moves tasks from cache to MongoDB
async function moveTasksFromCacheToDB(notesToMove: Note[]): Promise<void> {
  if (notesToMove.length === 0) return;

  const tasksForDB = notesToMove.map(note => ({
    _id: note.id,
    content: note.content,
    createdAt: note.createdAt, 
  }));

  try {
    await TaskModel.insertMany(tasksForDB, { ordered: false });
    logger.info(`${tasksForDB.length} tasks moved from cache to MongoDB.`);
  } catch (error) {
    logger.error('Error moving tasks to MongoDB:', error);
    throw error;
  }
}

export const taskService = {
  async processNewTask(newTask: Note): Promise<void> { 
    let currentNotes = await getNotesFromCache(); 
    currentNotes.push(newTask); 

    if (currentNotes.length > MAX_CACHE_ITEMS) {
      logger.info(`Cache limit (${MAX_CACHE_ITEMS}) reached. Moving ${currentNotes.length} tasks to DB.`);
      try {
        await moveTasksFromCacheToDB(currentNotes);
        await redisClient.del(CACHE_KEY);
        logger.info('Cache flushed after moving tasks to DB.');
      } catch (dbError) {
        logger.error('Failed to move tasks to DB. Tasks will remain in cache for now.', dbError);
        await saveNotesToCache(currentNotes); 
      }
    } else {
      await saveNotesToCache(currentNotes); 
    }
    logger.info(`Task ${newTask.id} processed. Cache size: ${currentNotes.length > MAX_CACHE_ITEMS ? (await getNotesFromCache()).length : currentNotes.length}`);
  },

  async getAllCombinedTasks(): Promise<Note[]> {
    const dbTasksDocs = await TaskModel.find({}).sort({ createdAt: 'asc' }).lean<ITaskDocument[]>();
    const dbNotes: Note[] = dbTasksDocs.map(doc => ({
      id: doc._id.toString(),
      content: doc.content,
      createdAt: doc.createdAt, 
    }));

    const cacheNotes: Note[] = await getNotesFromCache();

    const allNotes: Note[] = [...dbNotes, ...cacheNotes];
    
    allNotes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    return allNotes; 
  },
};