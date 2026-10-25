# Configuração da API

## Variáveis de Ambiente

A API requer as seguintes variáveis de ambiente para iniciar. Faltando alguma, a inicialização é bloqueada com uma mensagem clara.

### Variáveis obrigatórias

| Variável | Tipo | Exemplo | Descrição |
|---|---|---|---|
| `NODE_ENV` | string | `development` \| `staging` \| `production` | Ambiente de execução |
| `PORT` | number | `3000` | Porta da API HTTP |
| `DATABASE_URL` | string | `mysql://user:pass@localhost:3306/db` | Conexão MariaDB |
| `DATA_DIR` | string | `/data` | Caminho de armazenamento de arquivos (padrão: `/data`) |
| `FILE_URL_SECRET` | string | `chave-hmac-forte` | Chave para assinar URLs de download (HMAC-SHA256) |
| `OPENAI_API_KEY` | string | `sk-...` | Chave da API OpenAI |
| `OPENAI_TRANSCRIBE_MODEL` | string | `whisper-1` | Modelo para transcrição |
| `OPENAI_DIARIZE_MODEL` | string | `gpt-4-turbo` | Modelo para separação de falantes |
| `OPENAI_LLM_MODEL` | string | `gpt-4-turbo` | Modelo para IA de cortes |
| `MIN_FREE_DISK_GB` | number | `10` | Mínimo de espaço livre em GB antes de recusar upload |
| `EXPORT_CONCURRENCY` | number | `4` | Número de exportações simultâneas |

### Limites configuráveis (com padrões)

| Variável | Padrão | Descrição |
|---|---|---|
| `LIMIT_MAX_SIZE_BYTES` | `2147483648` (2 GB) | Tamanho máximo do vídeo em bytes |
| `LIMIT_MAX_DURATION_MS` | `7200000` (2h) | Duração máxima do vídeo em milissegundos |
| `LIMIT_RETENTION_HOURS` | `24` | Horas até o projeto expirar e ser apagado |
| `LIMIT_EXPORTS` | `10` | Número máximo de exportações por projeto |
| `LIMIT_AI_ANALYSES` | `5` | Número máximo de análises de IA por projeto |

### Throttling (antiabuso) — Valores por ambiente

| Variável | Desenvolvimento | Staging | Produção | Descrição |
|---|---|---|---|---|
| `THROTTLE_LIMIT` | `0` (desativado) | `100` | `50` | Requisições por IP em `THROTTLE_TTL` |
| `THROTTLE_TTL` | `60000` | `60000` | `60000` | Janela de tempo em milissegundos (60s) |

**Nota:** Com `THROTTLE_LIMIT=0`, o limitador fica desativado (útil em desenvolvimento).

## Validação na inicialização

Ao iniciar a API:

1. Todas as variáveis obrigatórias são validadas.
2. Se alguma faltar ou for inválida, a API não sobe e mostra:
   ```
   Configuração inválida. Variáveis de ambiente obrigatórias faltando ou inválidas: DATABASE_URL (obrigatória), OPENAI_API_KEY (obrigatória), ...
   ```
3. As variáveis com padrão usam seus valores se omitidas.

## Tratamento de erros

Todas as respostas de erro seguem o formato:

```json
{
  "statusCode": 422,
  "code": "VIDEO_TOO_LARGE",
  "message": "Esse vídeo tem 2,4 GB. O limite é 2 GB."
}
```

Erros de validação retornam HTTP 422 com `code: "VALIDATION_ERROR"`.

## Throttler global

O limitador de requisições por IP é ativado globalmente:

- **Desenvolvimento** (`THROTTLE_LIMIT=0`): desativado
- **Staging** (`THROTTLE_LIMIT=100`): máx. 100 req/min por IP
- **Produção** (`THROTTLE_LIMIT=50`): máx. 50 req/min por IP

Ao atingir o limite, a resposta é HTTP 429 (Too Many Requests).
