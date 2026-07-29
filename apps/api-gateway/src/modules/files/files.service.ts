// apps/api-gateway/src/modules/files/files.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FileEntity } from '../../database/entities/file.entity';
import { S3ClientFactory } from './s3.client';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity) private files: Repository<FileEntity>,
    private s3: S3ClientFactory,
  ) {}

  async upload(
    userId: string, workflowId: string, kind: string,
    mime: string, data: Buffer,
  ): Promise<FileEntity> {
    const storageKey = `${workflowId}/${randomUUID()}`;
    await this.s3.client.send(new PutObjectCommand({
      Bucket: this.s3.bucket, Key: storageKey, Body: data, ContentType: mime,
    }));
    return this.files.save(
      this.files.create({
        ownerId: userId, workflowId, kind, storageKey, mime, size: data.length,
      }),
    );
  }

  async getDownloadUrl(file: FileEntity): Promise<string> {
    return getSignedUrl(
      this.s3.client,
      new GetObjectCommand({ Bucket: this.s3.bucket, Key: file.storageKey }),
      { expiresIn: 3600 },
    );
  }

  listByWorkflow(workflowId: string) {
    return this.files.find({ where: { workflowId } });
  }

  async findById(fileId: string): Promise<FileEntity> {
    const f = await this.files.findOne({ where: { id: fileId } });
    if (!f) throw new NotFoundException('file not found');
    return f;
  }
}
