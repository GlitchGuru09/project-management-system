import { Inngest } from "inngest";
import {prisma} from "../config/prisma.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });

//inngest function to save user data into database
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk'},
  { event: 'clerk/user.created' },
  async ({ event }) => {
    const {data} = event;
    await prisma.user.create({
      id: data.id,
      email: data.email_addresses[0]?.email_address,
      name: data?.first_name+" "+data?.last_name,
      image: data?.image_url
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

// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserdeletion, syncUserUpdation];