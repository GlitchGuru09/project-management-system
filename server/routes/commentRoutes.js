import express from 'express';

import { addComment, getComments } from '../controllers/commentController.js';

const commentRouter = express.Router();

commentRouter.post('/', addComment);
commentRouter.get('/:taskId', getComments);

export default commentRouter