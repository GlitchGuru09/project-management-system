import { Inngest } from "inngest";
import { prisma } from "../config/prisma.js";
import sendEmail from "../config/nodemailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });

//USER EVENTS
//inngest function to save user data into database
const syncUserCreation = inngest.createFunction(
  { id: 'sync-user-from-clerk' },
  { event: 'clerk/user.created' },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.create({
      data: {
        id: data.id,
        email: data.email_addresses[0]?.email_address,
        name: data?.first_name + " " + data?.last_name,
        image_url: data?.image_url
      }
    })
  }
);

//inngest function to delete user data from database
const syncUserdeletion = inngest.createFunction(
  { id: 'delete-user-from-clerk' },
  { event: 'clerk/user.deleted' },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.delete({
      where: {
        id: data.id
      }
    })
  }
);

//inngest function to update user data into database
const syncUserUpdation = inngest.createFunction(
  { id: 'update-user-from-clerk' },
  { event: 'clerk/user.updated' },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.update({
      where: {
        id: data.id
      },
      data: {
        email: data.email_addresses[0]?.email_address,
        name: data?.first_name + " " + data?.last_name,
        image_url: data?.image_url
      }
    })
  }
);

//ORGANIZATION EVENTS
//inngest function to save workspace data into database
const syncWorkspaceCreation = inngest.createFunction(
  { id: 'sync-workspace-from-clerk' },
  { event: 'clerk/organization.created' },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image_url: data.image_url
      }
    })

    //add creator as ADMIN member
    await prisma.workspaceMember.create({
      data: {
        userId: data.created_by,
        workspaceId: data.id,
        role: 'ADMIN'
      }
    })
  })

//inngest function to update workspace data into database
const syncWorkspaceUpdation = inngest.createFunction(
  { id: 'update-workspace-from-clerk' },
  { event: 'clerk/organization.updated' },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.update({
      where: {
        id: data.id
      },
      data: {
        name: data.name,
        slug: data.slug,
        image_url: data.image_url
      }
    })
  }
);

//inngest function to delete workspace data from database
const syncWorkspaceDeletion = inngest.createFunction(
  { id: 'delete-workspace-from-clerk' },
  { event: 'clerk/organization.deleted' },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspace.delete({
      where: {
        id: data.id
      }
    })
  }
);

//Inngest function to save workspace member data into database
const syncWorkspaceMemberCreation = inngest.createFunction(
  { id: 'sync-workspace-member-from-clerk' },
  { event: 'clerk/organizationInvitation.accepted' },
  async ({ event }) => {
    const { data } = event;
    await prisma.workspaceMember.create({
      data: {
        userId: data.user_id,
        workspaceId: data.organization_id,
        role: String(data.role_name).toUpperCase()
      }
    })
  }
);

//Inngest fnction to  send email on task creation
const sendTaskAssignmentEmail = inngest.createFunction(
  { id: 'send-task-assignment-email' },
  { event: 'app/task.assigned' },
  async ({ event, step }) => {
    const { taskId, origin } = event.data;
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        project: true
      }
    })
    await sendEmail({
      to: task.assignee.email,
      subject: `New Task Assignment in ${task.project.name}`,
      body: `<div style="max-width:600px; margin:40px auto; background:#ffffff; padding:24px; border-radius:6px;">
      
      <p style="margin:0 0 12px; font-size:16px; color:#333;">
        Hi <strong>${task.assignee.name}</strong>,
      </p>

      <p style="margin:0 0 12px; font-size:14px; color:#444;">
        You have been assigned a new task:
      </p>

      <h2 style="margin:0 0 8px; font-size:18px; color:#111;">
        ${task.title}
      </h2>

      <p style="margin:0 0 20px; font-size:14px; color:#666;">
        Due Date: ${new Date(task.due_date).toLocaleDateString()}
      </p>

      <a
        href="${origin}"
        style="
          display:inline-block;
          padding:10px 16px;
          background:#2563eb;
          color:#ffffff;
          text-decoration:none;
          border-radius:4px;
          font-size:14px;
        "
      >
        View Task
      </a>

    </div>`
    })
    if (new Date(task.due_date).toLocaleDateString() !== new Date().toLocaleDateString()) {
      await step.sleepUntil('wait-for-the-due-date', new Date(task.due_date));

      await step.run('check-if-task-is-completed', async () => {
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          include: { assignee: true, project: true }
        })

        if (!task) return;

        if (task.status !== "DONE") {
          await step.run('send-task-reminder-email', async () => {
            await sendEmail({
              to: task.assignee.email,
              subject: `Reminder: Task "${task.project.name}" is Due Today`,
              body: `<div style="max-width:600px; margin:40px auto; background:#ffffff; padding:24px; border-radius:6px;">`
            });
          });
        }
      });
    }
  });

  // Create an empty array where we'll export future Inngest functions
  export const functions = [
    syncUserCreation,
    syncUserdeletion,
    syncUserUpdation,
    syncWorkspaceCreation,
    syncWorkspaceUpdation,
    syncWorkspaceDeletion,
    syncWorkspaceMemberCreation,
    sendTaskAssignmentEmail
  ];