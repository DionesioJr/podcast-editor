import { Test, TestingModule } from '@nestjs/testing';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('deve devolver status ok', () => {
    expect(controller.check()).toEqual({ status: 'ok' });
  });

  it('deve sempre devolver só a chave status, sem campos extras', () => {
    const resultado = controller.check();

    expect(Object.keys(resultado)).toEqual(['status']);
  });

  it('deve devolver o mesmo resultado em chamadas sucessivas', () => {
    expect(controller.check()).toEqual(controller.check());
  });
});
