import { MqttClient, ISubscriptionGrant } from 'mqtt';
import { taskService } from './task.service';
import { Note } from '../types/task.types';
import { logger } from '../utils/logger';

const ADD_TASK_TOPIC = "/add"; 

export const initializeMqttHandlers = (client: MqttClient) => {
  client.on('message', async (topic, message) => {
    logger.info(`MQTT message received on topic ${topic}: ${message.toString()}`);
    if (topic === ADD_TASK_TOPIC) {
      try {
        const notePayload: unknown = JSON.parse(message.toString());
        
        if (typeof notePayload === 'object' && notePayload !== null &&
            'id' in notePayload && typeof (notePayload as any).id === 'string' &&
            'content' in notePayload && typeof (notePayload as any).content === 'string' &&
            'createdAt' in notePayload && typeof (notePayload as any).createdAt === 'string') { 
            
            const newNote: Note = {
              id: (notePayload as any).id,
              content: (notePayload as any).content,
              createdAt: new Date((notePayload as any).createdAt) 
            };
            await taskService.processNewTask(newNote);
        } else {
            logger.warn(`Invalid note payload received on ${ADD_TASK_TOPIC}: ${message.toString()}`);
        }
      } catch (error) {
        logger.error(`Error processing MQTT message from ${ADD_TASK_TOPIC}:`, error);
      }
    }
  });

  client.subscribe(ADD_TASK_TOPIC, { qos: 1 }, (err, granted?: ISubscriptionGrant[]) => {
    if (err) {
      logger.error('MQTT subscription error:', err);
      return;
    }
    if (granted && granted.length > 0) {
      // console.log(granted[0].qos)
        logger.info(`Successfully subscribed to MQTT topic: ${granted[0].topic} with QoS ${granted[0].qos}`);
    } else {
        logger.warn(`MQTT subscription to ${ADD_TASK_TOPIC} might have issues or no grant info returned.`);
    }
  });
};