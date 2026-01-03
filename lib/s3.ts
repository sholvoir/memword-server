import {
   DeleteObjectCommand,
   GetObjectCommand,
   PutObjectCommand,
   S3Client,
} from "@aws-sdk/client-s3";
import { B2_BUCKET } from "@sholvoir/memword-common/common";

const s3 = new S3Client({
   endpoint: "https://s3.us-east-005.backblazeb2.com",
   region: "us-east-005",
   credentials: {
      accessKeyId: Deno.env.get("BACKBLAZE_KEY_ID")!,
      secretAccessKey: Deno.env.get("BACKBLAZE_APP_KEY")!,
   },
});

export const getObject = async (key: string) => {
   const command = new GetObjectCommand({ Bucket: B2_BUCKET, Key: key });
   const response = await s3.send(command);
   if (!response.Body) throw new Error("No body");
   return await response.Body.transformToString();
};

export const putObject = async (
   key: string,
   body: string,
   contentType = "text/plain",
) => {
   const command = new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
   });
   await s3.send(command);
};

export const deleteObject = async (key: string) => {
   const command = new DeleteObjectCommand({ Bucket: B2_BUCKET, Key: key });
   await s3.send(command);
};

if (import.meta.main) {
   await putObject("test.txt", "test");
   console.log(await getObject("test.txt"));
   await deleteObject("test.txt");
}
