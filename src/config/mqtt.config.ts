import mqtt, { MqttClient } from 'mqtt';
import { config } from './index';
import { logger } from '../utils/logger';


export let mqttClient: MqttClient;

export const connectMQTT = (): Promise<MqttClient> => {
  return new Promise((resolve, reject) => {
    logger.info(`Connecting to MQTT broker at ${config.mqtt.brokerUrl}`);
    mqttClient = mqtt.connect(config.mqtt.brokerUrl);

    mqttClient.on('connect', () => {
      logger.info('MQTT connected successfully.');
      resolve(mqttClient);
    });

    mqttClient.on('error', (err) => {
      logger.error('MQTT connection error:', err);
      reject(err); 
    });

    mqttClient.on('close', () => {
      logger.warn('MQTT connection closed.');
    });

    mqttClient.on('reconnect', () => {
      logger.info('MQTT attempting to reconnect...');
    });
  });
};