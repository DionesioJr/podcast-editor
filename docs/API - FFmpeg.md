# FFmpeg Module

## Responsabilidade

O módulo FFmpeg (`@/modules/ffmpeg`) é responsável pela execução segura de FFmpeg e ffprobe com suporte a:
- Spawn direto sem shell
- Leitura de progresso em tempo real
- Cancelamento via callback
- Timeout configurável
- Exceções tipadas

## Interface Pública

### `FfmpegService.run(command: string[], options: ExecOptions): Observable<ProgressEvent>`

Executa um comando FFmpeg com argumentos validados e separados.

**Nota sobre progresso**: O Observable só emite progresso (0-100) quando `durationMs` é fornecido em ExecOptions. FFmpeg emite `out_time_ms` (tempo decorrido), e a duração é necessária para calcular a percentagem. Se `durationMs` não for fornecido, o Observable não emitirá eventos de progresso intermediários (apenas 0% no início e 100% ao fim).

## Integração com a Fila de Jobs

O job handler (em `PDE-19`) chama o módulo FFmpeg e recebe um Observable:

```typescript
const observable = this.ffmpeg.run(args, {
  timeoutMs: 3600000,
  durationMs: videoDurationMs,
  shouldCancel: () => jobStatus === 'canceled',
});

observable.subscribe({
  next: (event) => {
    // Atualizar MariaDB com progresso
    await updateJobProgress(jobId, event.progress);
    // Disparar POST /internal/events
    await publishProgress(jobId, event.progress);
  },
  error: (err) => {
    // Atualizar job como failed
    await markJobFailed(jobId, err);
  },
  complete: () => {
    // Atualizar job como done
    await markJobDone(jobId);
  },
});
```

## Integração com SSE

A API repassará eventos ao app através do stream SSE (implementado em `PDE-38`):

```typescript
// No projeto SSE
this.eventEmitter.emit('job:progress', {
  projectId: job.projectId,
  progress: event.progress,
  step: event.step,
});
```

## Segurança

- **Sem shell**: FFmpeg é executado com `spawn()` direto, não via shell
- **Argumentos separados**: Cada argumento é passado separadamente no array
- **Protocol whitelist**: Todos os comandos incluem `-protocol_whitelist file,pipe`
- **Validação**: Entrada presume validação feita pela camada acima (etapa checking em `PDE-12`)

## Exceções

```typescript
export class ExecError extends Error {
  code: string;
  stderr: string;
}

export class TimeoutError extends Error {
  timeoutMs: number;
}

export class CanceledError extends Error {}
```

## Métodos Não Inclusos

Conforme descrito na tarefa, este módulo é só a primitiva `run()`. Os métodos a seguir são responsabilidade de tarefas posteriores:
- `probe(filePath)`: Leitura e validação de vídeo (PDE-12)
- `exportVideo()`: Montagem e execução de exportação (PDE-17+)

Esses métodos devem ficar em módulos específicos (ffprobe, exports) ou em Commands que usam este serviço.
