# Podcast Editor

Editor de vídeo simples, gratuito e sem cadastro para podcasts e aulas.

## Estrutura

```
.
├── api/              NestJS backend + worker
├── app/              React Native + Expo frontend
└── docs/             Documentação de negócio e técnica
```

## Começar (API)

```bash
cd api
pnpm install
pnpm start
```

A API estará disponível em `http://localhost:3000` e documentação Swagger em `/docs`.

## Documentação

- [PROJETO.md](docs/PROJETO.md): Regras de negócio
- [DOCUMENTO-TECNICO.md](docs/DOCUMENTO-TECNICO.md): Decisões arquiteturais
- [API - FFmpeg.md](docs/API%20-%20FFmpeg.md): Módulo FFmpeg

## Módulos Implementados

### FFmpeg (PDE-11)

Módulo para executar FFmpeg com progresso, cancelamento e timeout.

```typescript
const observable = this.ffmpeg.run(
  ['-i', 'input.mp4', '-c:v', 'libx264', 'output.mp4'],
  { timeoutMs: 3600000 }
);

observable.subscribe({
  next: (event) => console.log(`Progresso: ${event.progress}%`),
  error: (err) => console.error(err),
  complete: () => console.log('Pronto'),
});
```

Ver [api/src/modules/ffmpeg/README.md](api/src/modules/ffmpeg/README.md).
