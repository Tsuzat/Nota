import { S3Client } from '@aws-sdk/client-s3';
import { R2_ACCESS_ID, R2_ACCOUNT_ID, R2_SECRETE_ACCESS_KEY } from '../constants';

export const storage = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_ID,
    secretAccessKey: R2_SECRETE_ACCESS_KEY,
  },
});
