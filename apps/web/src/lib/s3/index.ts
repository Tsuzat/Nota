import { DeleteObjectsCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  BUCKET_NAME,
  R2_ACCESS_ID,
  R2_ACCOUNT_ID,
  R2_PUBLIC_ENDPOINT,
  R2_SECRETE_ACCESS_KEY,
} from '$env/static/private';

export const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_ID,
    secretAccessKey: R2_SECRETE_ACCESS_KEY,
  },
});



export const uploadFile = async (buffer: Buffer<ArrayBuffer>, key: string, contentType: string) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  });
  try {
    const data = await S3.send(command);
    if (data.$metadata.httpStatusCode !== 200) {
      throw new Error('Failed to upload file');
    }
    return `${R2_PUBLIC_ENDPOINT}/${key}`;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * Delete a file from the bucket
 * @param key file key that starts with the bucket name
 */
export const deleteFiles = async (keys: string[]) => {
  const command = new DeleteObjectsCommand({
    Bucket: BUCKET_NAME,
    Delete: {
      Objects: keys.map((key) => ({ Key: key })),
    },
  });
  const data = await S3.send(command);
  if (data.$metadata.httpStatusCode !== 200) {
    throw new Error('Failed to delete file');
  }
};

/**
 * List all files in the bucket that match the filter
 * @param filter filter by file type
 * @returns list of file keys that match the filter
 */
export const listFiles = async () => {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
  });
  const data = await S3.send(command);
  if (data.$metadata.httpStatusCode !== 200) {
    throw new Error('Failed to list files');
  }
  const files: string[] = [];
  for (const item of data.Contents || []) {
    const key = item.Key;
    if (key) {
      files.push(`${R2_PUBLIC_ENDPOINT}/${key}`);
    }
  }
  return files;
};
