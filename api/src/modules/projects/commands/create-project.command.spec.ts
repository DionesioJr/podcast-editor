import { CreateProjectCommand } from './create-project.command';
import { IProjectsRepository } from '../repositories/projects.repository.interface';

describe('CreateProjectCommand', () => {
  let command: CreateProjectCommand;
  let repositoryMock: any;

  beforeEach(() => {
    repositoryMock = {
      create: jest.fn().mockResolvedValue({}),
      findByUuid: jest.fn(),
      delete: jest.fn(),
    };
    command = new CreateProjectCommand(repositoryMock);
  });

  it('deve gerar um token único com 256 bits', async () => {
    const input = {
      originalName: 'test.mp4',
      sizeBytes: 100000,
      clientIp: '192.168.1.1',
    };

    const result = await command.execute(input);

    expect(result.token).toBeDefined();
    expect(result.token).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(result.token)).toBe(true);
  });

  it('deve gerar um UUID único', async () => {
    const input = {
      originalName: 'test.mp4',
      sizeBytes: 100000,
      clientIp: '192.168.1.1',
    };

    const result = await command.execute(input);

    expect(result.id).toBeDefined();
    expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('deve retornar partSize = 8MB', async () => {
    const input = {
      originalName: 'test.mp4',
      sizeBytes: 100000,
      clientIp: '192.168.1.1',
    };

    const result = await command.execute(input);

    expect(result.partSize).toBe(8388608);
  });

  it('nunca deve guardar o token direto, apenas seu hash', async () => {
    const input = {
      originalName: 'test.mp4',
      sizeBytes: 100000,
      clientIp: '192.168.1.1',
    };

    await command.execute(input);

    const callArgs = repositoryMock.create.mock.calls[0][0];
    expect(callArgs.token_hash).toBeDefined();
    expect(callArgs.token_hash).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(callArgs.token_hash as string)).toBe(true);
  });

  it('deve guardar hash do IP', async () => {
    const input = {
      originalName: 'test.mp4',
      sizeBytes: 100000,
      clientIp: '192.168.1.1',
    };

    await command.execute(input);

    const callArgs = repositoryMock.create.mock.calls[0][0];
    expect(callArgs.ip_hash).toBeDefined();
    expect(callArgs.ip_hash).toHaveLength(64);
  });

  it('deve criar projeto com status UPLOADING', async () => {
    const input = {
      originalName: 'test.mp4',
      sizeBytes: 100000,
      clientIp: '192.168.1.1',
    };

    await command.execute(input);

    const callArgs = repositoryMock.create.mock.calls[0][0];
    expect(callArgs.status).toBe('UPLOADING');
  });

  it('deve expirar em 24 horas', async () => {
    const input = {
      originalName: 'test.mp4',
      sizeBytes: 100000,
      clientIp: '192.168.1.1',
    };

    const now = Date.now();
    await command.execute(input);
    const callArgs = repositoryMock.create.mock.calls[0][0];

    const expiresAt = new Date(callArgs.expires_at).getTime();
    const diffHours = (expiresAt - now) / (1000 * 60 * 60);

    expect(diffHours).toBeGreaterThan(23.9);
    expect(diffHours).toBeLessThan(24.1);
  });

  it('deve preservar nome e tamanho do vídeo', async () => {
    const input = {
      originalName: 'meu_podcast.mp4',
      sizeBytes: 524288000,
      clientIp: '192.168.1.1',
    };

    await command.execute(input);

    const callArgs = repositoryMock.create.mock.calls[0][0];
    expect(callArgs.original_name).toBe('meu_podcast.mp4');
    expect(callArgs.size_bytes).toBe(BigInt(524288000));
  });
});
