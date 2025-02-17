import { Client, Account, Storage, Functions, ID } from "appwrite";

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_HOSTNAME as string)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string);                

const account = new Account(client);
const storage = new Storage(client);
const functions = new Functions(client);

export { account, storage, ID, functions };
