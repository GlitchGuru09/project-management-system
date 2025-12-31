import express from 'express';
import { addMember, createProject, updateProject } from '../controllers/projectController.js';

const projectRouter = express.Router();

projectRouter.post('/', createProject);

projectRouter.put('/:id', updateProject);

projectRouter.post('/:projectId/addMember', addMember);


export default projectRouter
