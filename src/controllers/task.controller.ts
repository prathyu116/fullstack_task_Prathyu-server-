import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { mqttClient } from '../config/mqtt.config'; 
import { taskService } from '../services/task.service';
import { Note } from '../types/task.types';
import { logger } from '../utils/logger';

const ADD_TASK_TOPIC = "/add"; 

export const taskController = {
  async addTask(req: Request, res: Response): Promise<void> {
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      res.status(400).json({ message: 'Task content cannot be empty.' });
      return;
    }

    const newTask: Note = {
      id: uuidv4(),
      content: content.trim(),
      createdAt: new Date(),
    };

    if (!mqttClient || !mqttClient.connected) {
        logger.error('MQTT client not connected. Cannot publish task.');
        res.status(500).json({ message: 'Error adding task: MQTT service unavailable.' });
        return;
    }

    try {
      
      mqttClient.publish(ADD_TASK_TOPIC, JSON.stringify(newTask), { qos: 1 }, (err) => {
        if (err) {
          logger.error('MQTT publish error:', err);
          res.status(500).json({ message: 'Failed to queue task for addition.' });
        } else {
          logger.info(`Task ${newTask.id} published to MQTT topic ${ADD_TASK_TOPIC}`);
          
          res.status(202).json(newTask); 
        }
      });
    } catch (error) {
      logger.error('Error in addTask controller:', error);
      res.status(500).json({ message: 'Internal server error while adding task.' });
    }
  },

  async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
      const tasks = await taskService.getAllCombinedTasks();
      const tasksWithStringDate = tasks.map(task => ({
        ...task,
        createdAt: task.createdAt.toISOString(),
      }));
      res.status(200).json(tasksWithStringDate);
    } catch (error) {
      logger.error('Error fetching all tasks:', error);
      res.status(500).json({ message: 'Failed to fetch tasks.' });
    }
  },
};