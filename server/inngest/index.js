import { Inngest } from "inngest";
import {prisma} from "../config/prisma.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });

//USER EVENTS
//inngest function to save user data into database
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk'},
  { event: 'clerk/user.created' },
  async ({ event }) => {
    const {data} = event;
    await prisma.user.create({
      data:{
        id: data.id,
        email: data.email_addresses[0]?.email_address,
        name: data?.first_name+" "+data?.last_name,
        image: data?.image_url
      }
    })
  }
);

//inngest function to delete user data from database
const syncUserdeletion = inngest.createFunction(
    { id: 'delete-user-from-clerk'},
  { event: 'clerk/user.deleted' },
  async ({ event }) => {
    const {data} = event;
    await prisma.user.delete({
      where: {
        id: data.id
      }
    })
  }
);

//inngest function to update user data into database
const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk'},
  { event: 'clerk/user.updated' },
  async ({ event }) => {
    const {data} = event;
    await prisma.user.update({
      where: {
        id: data.id
      },
      data: {
        email: data.email_addresses[0]?.email_address,
        name: data?.first_name+" "+data?.last_name,
        image: data?.image_url
      }
    })
  }
);

//ORGANIZATION EVENTS
//inngest function to save workspace data into database
const syncWorkspaceCreation = inngest.createFunction(
    { id: 'sync-workspace-from-clerk'},
  { event: 'clerk/organization.created' },
  async ({ event }) => {
    const {data} = event;
    await prisma.workspace.create({
      data:{
        id: data.id,
        name: data.name,
        slug: data.slug,
        ownerId: data.created_by,
        image: data.image_url
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
    { id: 'update-workspace-from-clerk'},
  { event: 'clerk/organization.updated' },
  async ({ event }) => {
    const {data} = event;
    await prisma.workspace.update({
      where: {
        id: data.id
      },
      data: {
        name: data.name,
        slug: data.slug,
        image: data.image_url
      }
    })
  }
);

//inngest function to delete workspace data from database
const syncWorkspaceDeletion = inngest.createFunction(
    { id: 'delete-workspace-from-clerk'},
  { event: 'clerk/organization.deleted' },
  async ({ event }) => {
    const {data} = event;
    await prisma.workspace.delete({
      where: {
        id: data.id
      }
    })
  }
);

//Inngest function to save workspace member data into database
const syncWorkspaceMemberCreation = inngest.createFunction(
    { id: 'sync-workspace-member-from-clerk'},
  { event: 'clerk/organizationInvitation.accepted' },
  async ({ event }) => {
    const {data} = event;
    await prisma.workspaceMember.create({
      data: {
        userId: data.user_id,
        workspaceId: data.organization_id,
        role: String(data.role_name).toUpperCase()
      }
    })
  }
);

// Create an empty array where we'll export future Inngest functions
export const functions = [
  syncUserCreation,
  syncUserdeletion,
  syncUserUpdation,
  syncWorkspaceCreation,
  syncWorkspaceUpdation,
  syncWorkspaceDeletion,
  syncWorkspaceMemberCreation
];