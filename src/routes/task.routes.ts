import { Router } from 'express';
import { taskController } from '../controllers/task.controller';

const router = Router();

router.post('/', taskController.addTask);

router.get('/fetchAllTasks', taskController.getAllTasks);

export const taskRoutes = router;