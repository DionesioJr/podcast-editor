# Validação Global da API

Este documento explica como a validação global, tratamento de erros e configuração funcionam na API.

## Componentes implementados

### 1. ConfigModule com validação de variáveis de ambiente

**Localização:** `api/src/common/config/config.schema.ts`

O ConfigModule valida automaticamente as variáveis de ambiente no início da aplicação. Faltando qualquer variável obrigatória, a API não sobe.

**Variáveis obrigatórias (14 total):**
- `DATABASE_URL`
- `FILE_URL_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_TRANSCRIBE_MODEL`
- `OPENAI_DIARIZE_MODEL`
- `OPENAI_LLM_MODEL`
- `MIN_FREE_DISK_GB`
- `EXPORT_CONCURRENCY`

**Com padrão:**
- `NODE_ENV` (padrão: `development`)
- `PORT` (padrão: `3000`)
- `DATA_DIR` (padrão: `/data`)
- `LIMIT_MAX_SIZE_BYTES` (padrão: `2147483648`)
- `LIMIT_MAX_DURATION_MS` (padrão: `7200000`)
- `LIMIT_RETENTION_HOURS` (padrão: `24`)
- `LIMIT_EXPORTS` (padrão: `10`)
- `LIMIT_AI_ANALYSES` (padrão: `5`)
- `THROTTLE_LIMIT` (padrão: `50`)
- `THROTTLE_TTL` (padrão: `60000`)

### 2. ValidationPipe global com status 422

**Localização:** `api/src/main.ts`

Toda requisição com dados inválidos (DTO com erros de validação) retorna:

```json
{
  "statusCode": 422,
  "code": "VALIDATION_ERROR",
  "message": "name should not be empty; value must be a number conforming to the following constraints: minimum value is 1"
}
```

### 3. HttpExceptionFilter global

**Localização:** `api/src/common/filters/http-exception.filter.ts`

Formata automaticamente todas as exceções HTTP em:

```json
{
  "statusCode": <status>,
  "code": "<CODE>",
  "message": "Mensagem em português"
}
```

**Mapeamento de codes:**
- `400 / 422` → `VALIDATION_ERROR`
- `401` → `UNAUTHORIZED`
- `403` → `FORBIDDEN`
- `404` → `NOT_FOUND`
- `409` → `CONFLICT`
- `429` → `RATE_LIMIT_EXCEEDED`
- Outro → `INTERNAL_ERROR`

### 4. ThrottlerModule global por IP

**Localização:** `api/src/app.module.ts`

Limita requisições por IP com valores configuráveis:

| Ambiente | THROTTLE_LIMIT | THROTTLE_TTL |
|---|---|---|
| Desenvolvimento | `0` (desativado) | 60 s |
| Staging | `100` req/min | 60 s |
| Produção | `50` req/min | 60 s |

Ao atingir o limite, retorna HTTP 429:

```json
{
  "statusCode": 429,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Muitas requisições. Tente novamente em alguns segundos."
}
```

## Teste rápido

### Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores obrigatórios:

```bash
cp api/.env.example api/.env
```

### Testar validação de config

Remova uma variável obrigatória (ex.: `OPENAI_API_KEY`) e tente iniciar:

```bash
npm run start:dev
```

Você verá:
```
Configuração inválida. Variáveis de ambiente obrigatórias faltando ou inválidas: OPENAI_API_KEY (obrigatória)
```

### Testar ValidationPipe

Crie um DTO com class-validator e envie dados inválidos via POST:

```bash
curl -X POST http://localhost:3000/test \
  -H "Content-Type: application/json" \
  -d '{"value": "not_a_number"}'
```

Resposta:
```json
{
  "statusCode": 422,
  "code": "VALIDATION_ERROR",
  "message": "value must be a number"
}
```

### Testar Throttler

Faça 51 requisições rápidas no mesmo IP. A 51ª retorna:

```json
{
  "statusCode": 429,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Muitas requisições"
}
```

(Com `THROTTLE_LIMIT=50` em produção)

## Padrão de erro customizado

Para lançar um erro customizado com `code` específico:

```typescript
throw new HttpException(
  {
    code: 'VIDEO_TOO_LARGE',
    message: 'Esse vídeo tem 2,4 GB. O limite é 2 GB.'
  },
  HttpStatus.UNPROCESSABLE_ENTITY
);
```

O filtro global formata como:

```json
{
  "statusCode": 422,
  "code": "VIDEO_TOO_LARGE",
  "message": "Esse vídeo tem 2,4 GB. O limite é 2 GB."
}
```

## Codes de erro (da seção 9 do PROJETO.md)

- `FORMAT_NOT_SUPPORTED` — Formato não suportado
- `FILE_TOO_LARGE` — Arquivo grande demais
- `VIDEO_TOO_LONG` — Vídeo longo demais
- `NO_AUDIO` — Vídeo sem áudio
- `CORRUPTED_FILE` — Arquivo corrompido
- `CONNECTION_LOST` — Conexão caiu no envio
- `NO_SPEECH_DETECTED` — Nenhuma fala detectada
- `LOW_QUALITY_TRANSCRIPT` — Transcrição de baixa qualidade
- `TRANSCRIPTION_FAILED` — Falha na transcrição
- `AI_UNAVAILABLE` — IA indisponível
- `AI_ANALYSIS_LIMIT_REACHED` — Limite de análises da IA atingido
- `OUT_OF_SCOPE` — Pedido fora do escopo da IA
- `INVALID_TARGET_DURATION` — Duração alvo inválida
- `OUTPUT_TOO_SHORT` — Vídeo final curto demais
- `NO_FORMAT_SELECTED` — Nenhum formato marcado
- `EXPORT_LIMIT_REACHED` — Limite de exportações atingido
- `EXPORT_FAILED` — Falha na exportação
- `NO_SPACE_AVAILABLE` — Sem espaço disponível
- `PROJECT_EXPIRED` — Projeto expirado
