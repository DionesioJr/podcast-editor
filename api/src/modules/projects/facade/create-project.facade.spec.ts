import { CreateProjectFacade } from './create-project.facade';
import { CreateProjectCommand } from '../commands/create-project.command';

describe('CreateProjectFacade', () => {
  let facade: CreateProjectFacade;
  let commandMock: any;

  beforeEach(() => {
    commandMock = {
      execute: jest.fn().mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440000',
        token: 'abc123',
        partSize: 8388608,
      }),
    };
    facade = new CreateProjectFacade(commandMock);
  });

  it('deve chamar command.execute e retornar o resultado', async () => {
    const input = {
      originalName: 'test.mp4',
      sizeBytes: 100000,
      clientIp: '192.168.1.1',
    };

    const result = await facade.create(input);

    expect(commandMock.execute).toHaveBeenCalledWith(input);
    expect(result.id).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.partSize).toBe(8388608);
  });
});
