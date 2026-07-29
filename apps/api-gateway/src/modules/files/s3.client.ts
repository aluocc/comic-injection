// apps/api-gateway/src/modules/files/s3.client.ts
import { S3Client, CreateBucketCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class S3ClientFactory implements OnModuleInit {
  client!: S3Client;
  bucket!: string;
  private logger = new Logger('S3Client');
  constructor(private config: ConfigService) {}

  async onModuleInit() {
    this.client = new S3Client({
      endpoint: this.config.get<string>('s3.endpoint'),
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.config.get<string>('s3.accessKey') ?? 'minio',
        secretAccessKey: this.config.get<string>('s3.secretKey') ?? 'minio_dev',
      },
      forcePathStyle: true,
    });
    this.bucket = this.config.get<string>('s3.bucket') ?? 'mdp-assets';
    try {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    } catch (e) {
      this.logger.debug(`bucket ${this.bucket} already exists: ${(e as Error).message}`);
    }
  }
}
