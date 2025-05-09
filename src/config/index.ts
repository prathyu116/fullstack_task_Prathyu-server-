import dotenv from 'dotenv';
dotenv.config();

const {
  NODE_ENV,
  PORT,
  MONGO_URI,
  MONGO_DB_NAME,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_USERNAME,
  REDIS_PASSWORD,
  MQTT_BROKER_URL,
} = process.env;
const MY_FIRST_NAME = "Prathyu"

if (!PORT || !MONGO_URI || !MONGO_DB_NAME || !REDIS_HOST || !REDIS_PORT || !REDIS_PASSWORD || !MQTT_BROKER_URL ) {
  console.error("FATAL ERROR: Missing critical environment variables.");
  process.exit(1);
}

export const config = {
  nodeEnv: NODE_ENV || 'development',
  port: parseInt(PORT, 10),
  mongo: {
    uri: MONGO_URI,
    dbName: MONGO_DB_NAME,
    collectionName: `assignment_${MY_FIRST_NAME}`,
  },
  redis: {
    host: REDIS_HOST,
    port: parseInt(REDIS_PORT, 10),
    username: REDIS_USERNAME === 'default' ? undefined : REDIS_USERNAME, 
    password: REDIS_PASSWORD,
    cacheKey: `FULLSTACK_TASK_${MY_FIRST_NAME}`,
  },
  mqtt: {
    brokerUrl: MQTT_BROKER_URL,
    topics: {
      addTask: `/todo/${MY_FIRST_NAME}/add`,
    },
  },
  firstName: MY_FIRST_NAME,
  maxCacheItems: 50,
};