# Projects API

## Visão geral

O módulo de projetos gerencia a criação, consulta e exclusão de projetos de edição de vídeo. Cada projeto é uma sessão de trabalho com um vídeo único, acessível via token privado.

---

## Autenticação

O acesso a projetos segue o padrão:
- **POST /v1/projects**: sem autenticação, devolve um token privado
- **Demais rotas**: cabeçalho `Authorization: Bearer <token>`, validado pelo guard do NestJS

O token nunca é armazenado no banco. Apenas seu hash SHA-256 é guardado.

---

## Rotas

### POST /v1/projects

**Descrição:** Criar novo projeto  
**Regras:** RN-01.2, RN-02.1  
**Autenticação:** não requerida

**Request Body:**
```json
{
  "originalName": "meu_podcast_episodio_1.mp4",
  "sizeBytes": 524288000
}
```

| Campo | Tipo | Descrição | Restrições |
|---|---|---|---|
| `originalName` | string | Nome do arquivo original | obrigatório |
| `sizeBytes` | integer | Tamanho em bytes | min: 1, max: 2147483648 (2 GB) |

**Response 201:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1",
  "partSize": 8388608
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string (UUID) | Identificador do projeto |
| `token` | string (hex) | Token privado de 256 bits em hexadecimal, entregue uma única vez |
| `partSize` | integer | Tamanho de cada parte do upload: 8 MB (8388608 bytes) |

**Response 400:**
```json
{
  "statusCode": 400,
  "message": "Validação falhou",
  "error": "Bad Request"
}
```

**Possíveis erros de validação:**
- `sizeBytes` menor que 1 byte
- `sizeBytes` maior que 2.147.483.648 bytes (2 GB): "Esse vídeo tem {sizeBytes} bytes. O limite é 2 GB."
- `originalName` não é string
- `sizeBytes` não é inteiro

**Notas de implementação:**
- O token gerado é aleatório com 256 bits de entropia
- Apenas o hash SHA-256 do token é persistido no banco
- O IP do cliente também tem seu hash SHA-256 registrado para rastreamento de limites
- O projeto expira automaticamente 24 horas após a criação

---

## Modelo de dados

### projects

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | CHAR(36) | UUID do projeto |
| `token_hash` | CHAR(64) | Hash SHA-256 do token (nunca o token direto) |
| `ip_hash` | CHAR(64) | Hash SHA-256 do IP do cliente |
| `status` | VARCHAR | Estado: `UPLOADING`, `PROCESSING`, `READY`, `EXPORTING`, `DONE`, `ERROR`, `EXPIRED` |
| `error_code` | VARCHAR | Código de erro se status for `ERROR` |
| `original_name` | VARCHAR | Nome do arquivo original |
| `size_bytes` | BIGINT | Tamanho original em bytes |
| `duration_ms` | UNSIGNED INT | Duração em milissegundos (preenchido no processamento) |
| `width` | UNSIGNED INT | Largura em pixels (preenchido no processamento) |
| `height` | UNSIGNED INT | Altura em pixels (preenchido no processamento) |
| `has_speech` | BOOLEAN | Se foi detectada fala no vídeo |
| `low_quality` | BOOLEAN | Se a qualidade da transcrição é baixa |
| `settings` | LONGTEXT (JSON) | Configurações de edição |
| `manual_cuts` | LONGTEXT (JSON) | Cortes manuais |
| `protected_ranges` | LONGTEXT (JSON) | Trechos restaurados e protegidos |
| `history_cursor` | UNSIGNED INT | Posição no histórico de edições |
| `ai_analyses_used` | UNSIGNED INT | Contagem de análises de IA usadas |
| `exports_used` | UNSIGNED INT | Contagem de exportações realizadas |
| `expires_at` | DATETIME | Data e hora de expiração (criação + 24 h) |

---

## Segurança

### Token privado
- Gerado com `randomBytes(32)` do Node.js (256 bits de entropia)
- Entregue **uma única vez** na resposta de criação
- **Nunca** é registrado em logs
- **Nunca** é armazenado no banco, apenas seu hash SHA-256
- Deve ser incluído no link do projeto: `https://<dominio>/p/{id}#t={token}`
- O `#` garante que não aparece nos logs do servidor

### Limite por IP
- O hash do IP do cliente é registrado para rastreamento
- Usado para implementar limites de requisição por IP (throttler)

---

## Observações

1. **Privacidade:** O vídeo do usuário é privado e será apagado automaticamente em 24 horas (RN-02.3)
2. **UUID:** Gerado com `uuid v4`
3. **Token:** Aleatório com 256 bits de entropia, representado em hexadecimal (64 caracteres)
4. **Hash:** SHA-256 para token e IP
5. **Tamanho máximo:** 2 GB (2147483648 bytes) — validado antes e durante o upload
6. **Part size:** Fixo em 8 MB (8388608 bytes) para upload em partes
