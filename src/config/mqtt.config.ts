import mqtt, { MqttClient,IClientOptions } from 'mqtt';
import { config } from './index';
import { logger } from '../utils/logger';

import fs from 'fs'; // Import the 'fs' module
import path from 'path'; // Import the 'path' module
export let mqttClient: MqttClient;

export const connectMQTT = (): Promise<MqttClient> => {
  return new Promise((resolve, reject) => {
    logger.info(`Connecting to MQTT broker at ${config.mqtt.brokerUrl}`);

    const clientOptions: IClientOptions = {}; // Base options

    if (config.mqtt.brokerUrl.startsWith('mqtts://')) {
      try {
        // Adjust the path to where you store your CA certificate in your project
        // Ensure this file is copied to your deployment environment (e.g., included in Docker image or build)
        const caPath = path.join(__dirname, '../../certs/isrgrootx1.pem'); // Example path, adjust as needed

        // Check if the file exists before trying to read
        if (fs.existsSync(caPath)) {
            clientOptions.ca = [fs.readFileSync(caPath)];
            logger.info('Loaded CA certificate for MQTTS connection.');
        } else {
            logger.warn(`CA certificate not found at ${caPath}. Proceeding without custom CA.`);
            // Depending on strictness, you might want to reject here if CA is mandatory for you
        }
        
        // If you needed client certs (not for test.mosquitto.org typically)
        // clientOptions.key = fs.readFileSync(path.join(__dirname, '../../certs/client.key'));
        // clientOptions.cert = fs.readFileSync(path.join(__dirname, '../../certs/client.crt'));

        // This option might be needed if the server's certificate hostname doesn't exactly match
        // or for certain self-signed scenarios, but use with extreme caution.
        // clientOptions.rejectUnauthorized = true; // Keep this true for security with known CAs.
        // clientOptions.checkServerIdentity = (hostname, cert) => {
        //   // Implement custom server identity check if needed, otherwise default is fine
        //   // For example, allow subject alternative names (SANs)
        //   // const san = cert.subjectaltname; if (san && san.includes(...)) return undefined;
        //   // return Error(`Certificate for ${hostname} is not trusted`);
        //   return undefined; // Default behavior: successfully verified
        // };

      } catch (err) {
        logger.error('Error reading certificate files for MQTTS:', err);
        return reject(err); // Reject if cert reading fails and is critical
      }
    }

    mqttClient = mqtt.connect(config.mqtt.brokerUrl, clientOptions); // Pass options to connect
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