import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BUCKET_NAME,
  R2_ACCESS_ID,
  R2_ACCOUNT_ID,
  R2_PUBLIC_ENDPOINT,
  R2_SECRETE_ACCESS_KEY,
} from '$env/static/private';

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const SIGNED_URL_EXPIRY = 60; // 60 seconds

export const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/x-matroska',
  'audio/mpeg',
  'application/pdf',
]);

export const detectCategoryFromMime = (mime: string) => {
  if (mime.startsWith('image/')) return 'images';
  if (mime.startsWith('video/')) return 'videos';
  if (mime.startsWith('audio/')) return 'audios';
  if (mime.startsWith('application/pdf')) return 'documents';
  if (mime.startsWith('application/')) return 'miscellaneous';
  return 'other';
};

export const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_ID,
    secretAccessKey: R2_SECRETE_ACCESS_KEY,
  },
});

export const getPresignedUrl = async (key: string, contentType: string, expiresIn = 3600) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ACL: 'public-read',
  });
  return await getSignedUrl(S3, command, { expiresIn });
};

export const getFileHead = async (key: string) => {
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return await S3.send(command);
};

export const getFileRange = async (key: string, range: string) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Range: range,
  });
  const response = await S3.send(command);
  if (!response.Body) {
    throw new Error('No body in response');
  }
  // Convert stream to Buffer properly
  const byteArray = await response.Body.transformToByteArray();
  return Buffer.from(byteArray);
};

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
export const listFiles = async (filter: string) => {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: filter,
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
