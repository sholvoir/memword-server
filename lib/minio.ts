import { Client } from 'minio';

export const minio = new Client({
    endPoint: 's3.us-east-005.backblazeb2.com',
    useSSL: true,
    accessKey: Deno.env.get('BACKBLAZE_KEY_ID'),
    secretKey: Deno.env.get('BACKBLAZE_APP_KEY')
});