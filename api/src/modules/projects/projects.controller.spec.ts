import { ProjectsController } from './projects.controller';
import { CreateProjectFacade } from './facade/create-project.facade';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let facadeMock: any;

  beforeEach(() => {
    facadeMock = {
      create: jest.fn().mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440000',
        token: 'abc123',
        partSize: 8388608,
      }),
    };
    controller = new ProjectsController(facadeMock);
  });

  it('deve criar um projeto e retornar id, token e partSize', async () => {
    const request = {
      originalName: 'test.mp4',
      sizeBytes: 100000,
    };

    const mockReq = { ip: '192.168.1.1' } as any;

    const result = await controller.create(request, mockReq);

    expect(result.id).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.partSize).toBe(8388608);
  });

  it('deve chamar facade.create com dados corretos', async () => {
    const request = {
      originalName: 'test.mp4',
      sizeBytes: 100000,
    };

    const mockReq = { ip: '192.168.1.1' } as any;

    await controller.create(request, mockReq);

    expect(facadeMock.create).toHaveBeenCalledWith({
      originalName: 'test.mp4',
      sizeBytes: 100000,
      clientIp: '192.168.1.1',
    });
  });

  it('deve extrair IP do request', async () => {
    const request = {
      originalName: 'test.mp4',
      sizeBytes: 100000,
    };

    const mockReq = { ip: '10.0.0.5' } as any;

    await controller.create(request, mockReq);

    expect(facadeMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientIp: '10.0.0.5',
      }),
    );
  });

  it('deve usar IP padrão se não conseguir extrair', async () => {
    const request = {
      originalName: 'test.mp4',
      sizeBytes: 100000,
    };

    const mockReq = { ip: null } as any;

    await controller.create(request, mockReq);

    expect(facadeMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientIp: '0.0.0.0',
      }),
    );
  });
});
