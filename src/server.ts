import app from './app';
import { config } from './config';
import { connectDB } from './config/db.config';
import { connectRedis, redisClient } from './config/redis.config'; 
import { connectMQTT, mqttClient as globalMqttClientVar } from './config/mqtt.config'; 
import { initializeMqttHandlers } from './services/mqtt.handler';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    // Connect to databases and message broker
    await connectDB();
    await connectRedis(); 
    
    const mqttClientInstance = await connectMQTT(); 
    initializeMqttHandlers(mqttClientInstance);

    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode.`);
      logger.info(`Access API at http://localhost:${config.port}`);
    });

    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach(signal => {
      process.on(signal, async () => {
        logger.info(`\n${signal} received. Shutting down gracefully...`);
        server.close(async () => {
          logger.info('HTTP server closed.');
          if (globalMqttClientVar && globalMqttClientVar.connected) {
            globalMqttClientVar.end(false, () => { 
              logger.info('MQTT client disconnected.');
            });
          }
          if (redisClient.status === 'ready' || redisClient.status === 'connecting') {
             await redisClient.quit();
             logger.info('Redis client disconnected.');
          }
          process.exit(0);
        });
      });
    });

  } catch (error) {
    logger.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();