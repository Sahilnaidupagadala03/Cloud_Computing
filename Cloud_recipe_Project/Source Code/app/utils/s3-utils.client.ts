import { v4 as uuidv4 } from "uuid";
import path from "path";
import invariant from "tiny-invariant";

declare global {
  interface Window {
    ENV: {
      AWS_REGION: string;
      AWS_BUCKET: string;
    };
  }
}

const REGION = window.ENV.AWS_REGION;
const BUCKET = window.ENV.AWS_BUCKET;

invariant(REGION, "Missing AWS_REGION");
invariant(BUCKET, "Missing AWS_BUCKET");

/**
 * Returns a unique filename for S3
 */
export function getUniqueS3Key(
  originalFilename: string,
  extension?: string
): string {
  let _extension = extension ? extension : path.extname(originalFilename);
  let baseName = path.basename(originalFilename, extension);
  let safeFilename = baseName.replace(/[^a-zA-Z0-9]/g, "_");
  let uniqueId = uuidv4();
  return `${safeFilename}_${uniqueId}${_extension}`;
}

interface S3UrlOptions {
  bucket: string;
  region: string;
}

/**
 * Default options for the S3 Url function
 */
const defaultS3UrlOptions: S3UrlOptions = {
  bucket: BUCKET,
  region: REGION,
};

/**
 * Generates a URL for accessing an object in an S3 bucket.
 */
export function getS3Url(
  key: string,
  options: Partial<S3UrlOptions> = defaultS3UrlOptions
): string {
  const { bucket, region } = { ...defaultS3UrlOptions, ...options };
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
