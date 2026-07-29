// apps/api-gateway/src/modules/collab/yjs-doc.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Y from 'yjs';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { VersionsService } from '../versions/versions.service';

@Injectable()
export class YjsDocService implements OnModuleInit {
  private redis!: Redis;
  private docs = new Map<string, Y.Doc>();

  constructor(private config: ConfigService, private versions: VersionsService) {}

  onModuleInit() {
    this.redis = new Redis(this.config.get<string>('redis.url') ?? 'redis://localhost:6379');
  }

  async getDoc(workflowId: string): Promise<Y.Doc> {
    if (this.docs.has(workflowId)) return this.docs.get(workflowId)!;
    const doc = new Y.Doc();
    const latest = await this.versions.getLatest(workflowId);
    if (latest) {
      Y.applyUpdate(doc, latest.yjsSnapshot);
    }
    const sub = this.redis.duplicate();
    await sub.subscribe(`yjs:${workflowId}`);
    sub.on('message', (_ch, msg) => {
      const update = Buffer.from(msg, 'base64');
      Y.applyUpdate(doc, update, 'remote');
    });
    doc.on('update', (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote') return;
      this.redis.publish(`yjs:${workflowId}`, Buffer.from(update).toString('base64'));
    });
    this.docs.set(workflowId, doc);
    return doc;
  }

  async persistSnapshot(workflowId: string): Promise<number> {
    const doc = this.docs.get(workflowId);
    if (!doc) throw new Error('doc not loaded');
    const snapshot = Y.encodeStateAsUpdate(doc);
    return this.versions.saveSnapshot(workflowId, Buffer.from(snapshot));
  }
}
