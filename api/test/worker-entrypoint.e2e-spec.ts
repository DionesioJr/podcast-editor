import * as fs from 'fs';
import * as path from 'path';

describe('Entrypoint do worker', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'),
  );
  const workerSource = fs.readFileSync(path.resolve(__dirname, '../src/worker.ts'), 'utf8');

  it('start:worker executa o worker compilado em dist/src/worker', () => {
    expect(packageJson.scripts['start:worker']).toMatch(/dist\/src\/worker/);
  });

  it('worker.ts nunca chama app.listen, só app.init', () => {
    expect(workerSource).not.toMatch(/\.listen\(/);
    expect(workerSource).toMatch(/\.init\(\)/);
  });

  it('worker.ts cria o contexto Nest a partir do AppModule', () => {
    expect(workerSource).toMatch(/AppModule/);
    expect(workerSource).toMatch(/NestFactory\.create\(/);
  });
});
