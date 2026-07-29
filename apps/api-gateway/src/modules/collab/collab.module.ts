// apps/api-gateway/src/modules/collab/collab.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CollabGateway } from './collab.gateway';
import { YjsDocService } from './yjs-doc.service';
import { VersionsModule } from '../versions/versions.module';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [
    VersionsModule,
    WorkflowsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({ secret: c.get<string>('jwt.secret') ?? 'dev-secret' }),
    }),
  ],
  providers: [CollabGateway, YjsDocService],
})
export class CollabModule {}
