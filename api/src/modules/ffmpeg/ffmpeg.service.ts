import { Injectable } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import { Observable } from 'rxjs';
import { ExecOptions } from './types/exec.options';
import { ProgressEvent } from './types/progress.event';
import { ExecError } from './exceptions/exec.error';
import { TimeoutError } from './exceptions/timeout.error';
import { CanceledError } from './exceptions/canceled.error';

@Injectable()
export class FfmpegService {
  private readonly DEFAULT_TIMEOUT_MS = 3600000;
  private readonly DEFAULT_CHECK_CANCEL_INTERVAL_MS = 1000;

  run(command: string[], options: ExecOptions = {}): Observable<ProgressEvent> {
    const timeoutMs = options.timeoutMs ?? this.DEFAULT_TIMEOUT_MS;
    const checkCancelIntervalMs =
      options.checkCancelIntervalMs ?? this.DEFAULT_CHECK_CANCEL_INTERVAL_MS;
    const shouldCancel = options.shouldCancel ?? (() => false);

    return new Observable<ProgressEvent>(observer => {
      let process: ChildProcess | null = null;
      let timeoutId: NodeJS.Timeout | null = null;
      let cancelCheckId: NodeJS.Timeout | null = null;
      let stderrOutput = '';
      const progressMetrics: Record<string, string | number> = {};
      let lastProgressTime = 0;

      try {
        const args = [
          '-protocol_whitelist',
          'file,pipe',
          '-progress',
          'pipe:1',
          ...command,
        ];

        process = spawn('ffmpeg', args, {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdoutBuffer = '';

        if (process.stdout) {
          process.stdout.on('data', chunk => {
            stdoutBuffer += chunk.toString();
            const lines = stdoutBuffer.split('\n');
            stdoutBuffer = lines[lines.length - 1];

            for (let i = 0; i < lines.length - 1; i++) {
              const line = lines[i].trim();
              if (!line) continue;

              const [key, value] = line.split('=');
              if (key && value) {
                progressMetrics[key] = value;
              }

              if (key === 'progress') {
                const now = Date.now();
                if (now - lastProgressTime >= 500) {
                  const progress = this.calculateProgress(progressMetrics);
                  if (progress >= 0) {
                    observer.next({ progress });
                    lastProgressTime = now;
                  }
                }
              }
            }
          });
        }

        if (process.stderr) {
          process.stderr.on('data', chunk => {
            stderrOutput += chunk.toString();
          });
        }

        timeoutId = setTimeout(() => {
          if (process) {
            process.kill('SIGTERM');
          }
          observer.error(new TimeoutError(timeoutMs));
        }, timeoutMs);

        cancelCheckId = setInterval(() => {
          if (shouldCancel()) {
            if (process) {
              process.kill('SIGTERM');
            }
            observer.error(new CanceledError());
          }
        }, checkCancelIntervalMs);

        if (process) {
          process.on('error', err => {
            observer.error(
              new ExecError(
                'spawn_error',
                err.message || '',
                `Erro ao iniciar FFmpeg: ${err.message}`,
              ),
            );
          });

          process.on('close', code => {
            if (code !== 0) {
              observer.error(new ExecError('ffmpeg_error', stderrOutput));
            } else {
              observer.next({ progress: 100 });
              observer.complete();
            }
          });
        }
      } catch (err) {
        observer.error(
          new ExecError(
            'exec_error',
            err instanceof Error ? err.message : String(err),
            `Erro ao executar FFmpeg: ${err instanceof Error ? err.message : String(err)}`,
          ),
        );
      }

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (cancelCheckId) clearInterval(cancelCheckId);
        if (process) {
          process.kill('SIGTERM');
        }
      };
    });
  }

  private calculateProgress(metrics: Record<string, string | number>): number {
    if (metrics.progress === 'end') {
      return 100;
    }

    const timeStr = metrics.out_time_ms;
    const durationStr = metrics.progress_duration;

    if (!timeStr || !durationStr) {
      return -1;
    }

    const time = parseInt(String(timeStr), 10);
    const duration = parseInt(String(durationStr), 10);

    if (duration <= 0 || isNaN(time) || isNaN(duration)) {
      return -1;
    }

    return Math.min(100, Math.round((time / duration) * 100));
  }
}
