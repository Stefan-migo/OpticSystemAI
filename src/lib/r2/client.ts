import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 Client Configuration
 *
 * This module exports a configured S3 client for Cloudflare R2.
 * If the required environment variables are not set, it returns null,
 * allowing for fallback to other storage providers (like Supabase Storage).
 */

const getR2Config = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const region = process.env.R2_REGION || "auto";
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    region,
    publicUrl,
  };
};

export const r2Config = getR2Config();

/**
 * AWS S3 Client configured for Cloudflare R2
 */
export const r2Client = r2Config
  ? new S3Client({
      region: r2Config.region,
      endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    })
  : null;

/**
 * Utility to check if R2 is configured
 */
export const isR2Configured = (): boolean => {
  return r2Client !== null;
};
