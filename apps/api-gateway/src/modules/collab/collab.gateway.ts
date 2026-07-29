// apps/api-gateway/src/modules/collab/collab.gateway.ts
import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { YjsDocService } from './yjs-doc.service';
import { WorkflowsService } from '../workflows/workflows.service';

@WebSocketGateway({ cors: { origin: true, credentials: true }, namespace: '/collab' })
export class CollabGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private logger = new Logger('Collab');
  private connWorkflows = new Map<string, string>();

  constructor(
    private jwt: JwtService,
    private docs: YjsDocService,
    private workflows: WorkflowsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      const payload = this.jwt.verify(token.replace(/^Bearer /, ''));
      (client.data as any).userId = payload.sub;
      const workflowId = client.handshake.query.workflowId as string;
      const ok = await this.workflows.canAccess(workflowId, payload.sub);
      if (!ok) throw new UnauthorizedException();
      this.connWorkflows.set(client.id, workflowId);
      client.join(`wf:${workflowId}`);
      const doc = await this.docs.getDoc(workflowId);
      const update = Y.encodeStateAsUpdate(doc);
      client.emit('yjs:init', Buffer.from(update).toString('base64'));
    } catch (e) {
      this.logger.warn(`reject: ${(e as Error).message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.connWorkflows.delete(client.id);
  }

  @SubscribeMessage('yjs:update')
  async onUpdate(
    @MessageBody() body: { update: string },
    @ConnectedSocket() client: Socket,
  ) {
    const workflowId = this.connWorkflows.get(client.id);
    if (!workflowId) return;
    const update = Buffer.from(body.update, 'base64');
    const doc = await this.docs.getDoc(workflowId);
    Y.applyUpdate(doc, update, 'local');
    client.to(`wf:${workflowId}`).emit('yjs:update', { update: body.update });
  }

  @SubscribeMessage('yjs:persist')
  async onPersist(@ConnectedSocket() client: Socket) {
    const workflowId = this.connWorkflows.get(client.id);
    if (!workflowId) return;
    const userId = (client.data as any).userId;
    if (!(await this.workflows.canEdit(workflowId, userId))) return;
    const v = await this.docs.persistSnapshot(workflowId);
    this.server.to(`wf:${workflowId}`).emit('yjs:version', { versionNo: v });
  }
}
