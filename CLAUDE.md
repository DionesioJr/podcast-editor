# CLAUDE.md

Podcast Editor: editor de vídeo simples, gratuito e sem cadastro para quem grava podcasts e aulas. O usuário envia o vídeo, marca as ferramentas (cortar pausas e hesitações, transcrição e edição pelo texto, corte inteligente com IA, legendas, volume, formato horizontal e vertical), revisa se quiser e baixa o vídeo pronto.

Monorepo com dois projetos. Leia o CLAUDE.md do projeto em que você vai trabalhar:

- `api/`: NestJS + Prisma + MariaDB, na arquitetura do pust/api. Regras em [api/CLAUDE.md](api/CLAUDE.md)
- `app/`: Expo + React Native, na arquitetura do pust/mobile. Regras em [app/CLAUDE.md](app/CLAUDE.md)

## Documentos

Leia antes de implementar. As tarefas citam as regras por código (RN, RP, RC).

| Documento | O que tem |
|---|---|
| [docs/PROJETO.md](docs/PROJETO.md) | Regras de negócio: o que o produto faz e como deve funcionar |
| [docs/DOCUMENTO-TECNICO.md](docs/DOCUMENTO-TECNICO.md) | Como implementar: stack, banco, jobs, timeline, IA, FFmpeg, API, SSE, app, segurança, testes |
| [docs/template-editor/](docs/template-editor/) | Template de interface (HTML) com as telas e o tema que o app reproduz |

## Como você trabalha aqui

- Você faz parte de uma esteira automática. Ninguém responde perguntas durante a execução: decida pelo critério de aceite da tarefa e pelos documentos. Se faltar uma informação essencial, escreva no parecer exatamente o que falta, sem inventar regra de negócio.
- As skills em `api/.claude/skills/` e `app/.claude/skills/` têm uma seção de perguntas antes de criar algo. Responda essas perguntas sozinho a partir da ficha da tarefa.
- Faça só o que a tarefa pede. Cada tarefa tem no máximo 3 pontos de função. Se perceber que é maior, diga isso no parecer.
- Cada etapa da esteira tem um papel. Quem desenvolve não escreve testes (há uma etapa própria). Quem escreve testes não altera código de produção. Quem revisa não altera arquivos.
- Código, nomes de arquivo, tabelas, colunas, rotas e chaves em inglês. Interface, mensagens de erro, validação e logs em português do Brasil, com acentuação correta.
- No máximo 300 linhas por arquivo e o mínimo de comentários. O código se explica por nomes e estrutura.
- Nunca use travessão (—) em textos. Use ponto, vírgula, dois-pontos ou parênteses.
- O backend é a fonte única da verdade: toda regra de negócio e todo cálculo ficam na API. O app só mostra o que a API devolve.
- Não instale dependência que a tarefa não exige. Se instalar, registre no parecer o pacote e o motivo.
- Não crie arquivos `.md` de resumo. Atualize só a documentação que a regra do projeto exige (por exemplo `docs/API - [Modulo].md` quando muda controller ou DTO).
- Nunca grave segredo, token ou chave em arquivo versionado. Use variáveis de ambiente.

## Branches

- `developer` é a branch de integração: todo trabalho nasce dela e volta para ela.
- `production` só recebe o que já está estável em `developer`, fora da esteira. Nunca envie nada para `production`.
