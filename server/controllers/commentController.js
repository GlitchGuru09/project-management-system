

//add comment

import { prisma } from "../config/prisma.js";

export const addComment = async (req, res) => {
    try {
        const {userId} = req.auth()
        const {taskId, content} = req.body

        //check if user is project member
        const task = await prisma.task.findUnique({
            where: {id: taskId},
        });
        const project = await prisma.project.findUnique({
            where: {id: task.projectId},
            include: {members: {include: {user: true}}}
        });
        if(!project) {
            return res.status(404).json({message: 'Project not found'})
        }

        const member = project.members.find((member) => member.user.id === userId);
        if(!member) {
            return res.status(403).json({message: 'You do not have permission to comment on this task'})
        }

        const comment = await prisma.comment.create({
            data: {
                taskId,
                userId,
                content,
            }
        });

        res.json({comment, message: 'Comment added successfully'});
    } catch (error) {
        console.error(error);
        res.status(500).json({message:error.code || error.message});
    }
}

//get task comments
export const getComments = async (req, res) => {
    try {
        const {taskId} = req.params
        const comments = await prisma.comment.findMany({
            where: {taskId},
            include: {user: true},
            orderBy: {createdAt: 'desc'}
        });
        res.json({comments});
    } catch (error) {
        console.error(error);
        res.status(500).json({message:error.code || error.message});
    }
}