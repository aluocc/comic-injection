// apps/api-gateway/src/common/crypto/aes.service.spec.ts
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AesService } from './aes.service';

describe('AesService', () => {
  let svc: AesService;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AesService,
        { provide: ConfigService, useValue: { get: () => 'base64:ZGV2LW1hc3Rlci1rZXktMTYtYnl0ZXM=' } },
      ],
    }).compile();
    svc = moduleRef.get(AesService);
  });

  it('encrypt then decrypt returns original', () => {
    const plain = 'sk-secret-api-key-123';
    const enc = svc.encrypt(plain);
    expect(enc).not.toBe(plain);
    expect(svc.decrypt(enc)).toBe(plain);
  });

  it('decrypt of different plaintext throws', () => {
    expect(() => svc.decrypt('not-valid-token')).toThrow();
  });
});
