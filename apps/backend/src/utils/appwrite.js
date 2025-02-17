import { sdk, Storage } from "node-appwrite";

const client = new sdk.Client();

client
    .setEndpoint(process.env.APPWRITE_HOSTNAME)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);


const storage = new Storage(sdk);

export {storage, client};
