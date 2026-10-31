import * as fs from 'fs';
import * as path from 'path';

const RAIZ_DA_API = path.resolve(__dirname, '..');
const CAMINHO_SCHEMA_JOBS = path.join(RAIZ_DA_API, 'src/modules/jobs/prisma/jobs.prisma');

describe('Schema Prisma do módulo jobs', () => {
  const schemaJobs = fs.readFileSync(CAMINHO_SCHEMA_JOBS, 'utf8');

  it('declara o model jobs', () => {
    expect(schemaJobs).toMatch(/model jobs \{/);
  });

  it('não declara generator nem datasource (regra do schema modular)', () => {
    expect(schemaJobs).not.toMatch(/generator\s+client/);
    expect(schemaJobs).not.toMatch(/datasource\s+db/);
  });

  it('declara as colunas da fila', () => {
    const colunas = [
      'project_id',
      'payload',
      'progress',
      'step',
      'attempts',
      'error_code',
      'locked_at',
      'created_at',
    ];

    for (const coluna of colunas) {
      expect(schemaJobs).toContain(coluna);
    }

    expect(schemaJobs).toMatch(/job_type\s+JobType\s+@map\("type"\)/);
  });

  it('define o status inicial queued e os cinco status da fila', () => {
    expect(schemaJobs).toMatch(/status\s+JobStatus\s+@default\(queued\)/);

    const bloco = schemaJobs.match(/enum JobStatus \{([\s\S]*?)\}/)?.[1] ?? '';
    const status = bloco.trim().split(/\s+/);

    expect(status).toEqual(
      expect.arrayContaining(['queued', 'running', 'done', 'failed', 'canceled']),
    );
    expect(status).toHaveLength(5);
  });

  it('define os tipos de job, com export mapeado para export_job', () => {
    const bloco = schemaJobs.match(/enum JobType \{([\s\S]*?)\}/)?.[1] ?? '';

    expect(bloco).toMatch(/process/);
    expect(bloco).toMatch(/ai_analysis/);
    expect(bloco).toMatch(/audio_sample/);
    expect(bloco).toMatch(/export_job\s+@map\("export"\)/);
  });

  it('cria o índice de busca do próximo job por status e id', () => {
    expect(schemaJobs).toMatch(/@@index\(\[status, id\]\)/);
  });

  it('o schema compilado contém o model jobs vindo do módulo', () => {
    const schemaCompilado = fs.readFileSync(
      path.join(RAIZ_DA_API, 'prisma/schema.prisma'),
      'utf8',
    );

    expect(schemaCompilado).toMatch(/model jobs \{/);
    expect(schemaCompilado).toMatch(/enum JobStatus \{/);
  });
});
