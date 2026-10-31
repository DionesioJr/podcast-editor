import { spawnSync } from 'child_process';

export interface ResultadoDeComando {
  status: number | null;
  stdout: string;
  stderr: string;
}

// Os scripts desta tarefa são bash e dependem de userland POSIX (gzip, find,
// date) na VPS Linux. Sem Linux com bash, a execução real é pulada com aviso
// em vez de falhar por diferença de ambiente.
function temShellPosix(): boolean {
  if (process.platform !== 'linux') {
    return false;
  }

  const resultado = spawnSync('bash', ['--version'], { encoding: 'utf8' });

  return resultado.error === undefined && resultado.status === 0;
}

export const SHELL_POSIX = temShellPosix();

export function descreverComShellPosix(nome: string, definir: () => void): void {
  if (SHELL_POSIX) {
    describe(nome, definir);
  } else {
    describe.skip(
      `${nome} (pulado: é preciso Linux com bash para executar os scripts)`,
      definir,
    );
  }
}
