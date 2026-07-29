// apps/api-gateway/src/modules/files/files.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '../../database/entities/file.entity';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { S3ClientFactory } from './s3.client';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity])],
  controllers: [FilesController],
  providers: [FilesService, S3ClientFactory],
  exports: [FilesService],
})
export class FilesModule {}
