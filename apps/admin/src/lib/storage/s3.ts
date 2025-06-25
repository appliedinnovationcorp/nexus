import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
  GetObjectCommandOutput
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export interface StorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

export interface UploadOptions {
  bucket: string;
  key?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write';
}

export interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface ListFilesOptions {
  bucket: string;
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface ListFilesResult {
  files: FileInfo[];
  isTruncated: boolean;
  nextContinuationToken?: string;
}

export class StorageManager {
  private s3: S3Client;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
    this.s3 = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle || false,
    });
  }

  async uploadFile(file: Buffer | Uint8Array, options: UploadOptions): Promise<string> {
    const key = options.key || this.generateUniqueKey();
    
    const command = new PutObjectCommand({
      Bucket: options.bucket,
      Key: key,
      Body: file,
      ContentType: options.contentType || 'application/octet-stream',
      Metadata: options.metadata,
      Tagging: options.tags ? this.formatTags(options.tags) : undefined,
      ACL: options.acl || 'private',
    });

    try {
      await this.s3.send(command);
      return key;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadFile(bucket: string, key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    try {
      const response = await this.s3.send(command);
      
      if (!response.Body) {
        throw new Error('File not found or empty');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const reader = response.Body.transformToWebStream().getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFileInfo(bucket: string, key: string): Promise<FileInfo> {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    try {
      const response = await this.s3.send(command);
      
      return {
        key,
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        etag: response.ETag || '',
        contentType: response.ContentType,
        metadata: response.Metadata,
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    try {
      await this.s3.send(command);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listFiles(options: ListFilesOptions): Promise<ListFilesResult> {
    const command = new ListObjectsV2Command({
      Bucket: options.bucket,
      Prefix: options.prefix,
      MaxKeys: options.maxKeys || 1000,
      ContinuationToken: options.continuationToken,
    });

    try {
      const response = await this.s3.send(command);
      
      const files: FileInfo[] = (response.Contents || []).map(obj => ({
        key: obj.Key || '',
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        etag: obj.ETag || '',
      }));

      return {
        files,
        isTruncated: response.IsTruncated || false,
        nextContinuationToken: response.NextContinuationToken,
      };
    } catch (error) {
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async copyFile(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: destBucket,
      Key: destKey,
      CopySource: `${sourceBucket}/${sourceKey}`,
    });

    try {
      await this.s3.send(command);
    } catch (error) {
      throw new Error(`Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generatePresignedUrl(
    bucket: string, 
    key: string, 
    operation: 'get' | 'put' = 'get',
    expiresIn: number = 3600
  ): Promise<string> {
    const command = operation === 'get' 
      ? new GetObjectCommand({ Bucket: bucket, Key: key })
      : new PutObjectCommand({ Bucket: bucket, Key: key });

    try {
      return await getSignedUrl(this.s3, command, { expiresIn });
    } catch (error) {
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fileExists(bucket: string, key: string): Promise<boolean> {
    try {
      await this.getFileInfo(bucket, key);
      return true;
    } catch {
      return false;
    }
  }

  private generateUniqueKey(): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const uuid = uuidv4();
    return `${timestamp}/${uuid}`;
  }

  private formatTags(tags: Record<string, string>): string {
    return Object.entries(tags)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }

  async getStorageStats(bucket: string, prefix?: string): Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
  }> {
    let totalFiles = 0;
    let totalSize = 0;
    let continuationToken: string | undefined;

    do {
      const result = await this.listFiles({
        bucket,
        prefix,
        maxKeys: 1000,
        continuationToken,
      });

      totalFiles += result.files.length;
      totalSize += result.files.reduce((sum, file) => sum + file.size, 0);
      continuationToken = result.nextContinuationToken;
    } while (continuationToken);

    return {
      totalFiles,
      totalSize,
      averageSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0,
    };
  }
}

// Factory function to create storage manager
export function createStorageManager(): StorageManager {
  const config: StorageConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  };

  if (!config.accessKeyId || !config.secretAccessKey) {
    throw new Error('AWS credentials missing. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
  }

  return new StorageManager(config);
}

// Singleton instance
let storageManagerInstance: StorageManager | null = null;

export function getStorageManager(): StorageManager {
  if (!storageManagerInstance) {
    storageManagerInstance = createStorageManager();
  }
  return storageManagerInstance;
}
