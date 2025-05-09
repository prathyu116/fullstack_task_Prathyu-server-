import express from 'express';
import cors from 'cors';
import { taskRoutes } from './routes/task.routes';
import { logger } from './utils/logger';

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Routes
app.use('/api/tasks', taskRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled Express error:', err.stack);
  res.status(500).send('Something broke!');
});

export default app;