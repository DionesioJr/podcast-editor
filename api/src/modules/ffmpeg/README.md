# Módulo FFmpeg

Módulo para executar FFmpeg e ffprobe com segurança, suportando progresso em tempo real, cancelamento e timeout.

## Uso

```typescript
import { FfmpegService } from '@/modules/ffmpeg/ffmpeg.service';

// Injetar o serviço
constructor(private readonly ffmpeg: FfmpegService) {}

// Executar comando
const observable = this.ffmpeg.run([
  '-i', 'input.mp4',
  '-c:v', 'libx264',
  '-c:a', 'aac',
  'output.mp4'
], {
  timeoutMs: 3600000,
  durationMs: 120000,
  shouldCancel: () => jobCanceledInDatabase,
});

// Escutar progresso
observable.subscribe({
  next: (event) => {
    console.log(`Progresso: ${event.progress}%`);
  },
  error: (err) => {
    if (err instanceof TimeoutError) {
      console.error('Timeout');
    } else if (err instanceof CanceledError) {
      console.error('Cancelado');
    } else if (err instanceof ExecError) {
      console.error('Erro FFmpeg:', err.stderr);
    }
  },
  complete: () => {
    console.log('Concluído');
  }
});
```

## Interface

### `run(command: string[], options?: ExecOptions): Observable<ProgressEvent>`

Executa um comando FFmpeg com spawn direto (sem shell) e retorna um Observable que emite eventos de progresso.

#### Parâmetros

- `command`: Array de argumentos do FFmpeg (sem incluir 'ffmpeg' ou 'ffprobe')
- `options`: Configurações opcionais
  - `timeoutMs`: Timeout em milissegundos (padrão: 3600000)
  - `durationMs`: Duração em milissegundos do vídeo de entrada (necessário para calcular progresso 0-100)
  - `shouldCancel`: Função callback que retorna true para cancelar
  - `checkCancelIntervalMs`: Intervalo em ms para verificar cancelamento (padrão: 1000)

#### Retorna

Observable que emite:
- `ProgressEvent`: { progress: 0-100, step?: string }

#### Exceções

- `ExecError`: Erro ao executar FFmpeg, contém stderr
- `TimeoutError`: Timeout atingido
- `CanceledError`: Execução cancelada

## Segurança

- Sem shell: spawn direto com argumentos separados
- `-protocol_whitelist file,pipe`: Restringe protocolos
- Entrada presume validação feita no ffprobe (etapa checking)
