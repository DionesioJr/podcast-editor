# TODO — separar Editor.dc.html em telas

> Nota de arquitetura: componentes `dc-import` só resolvem por nome sem
> barra (`./Nome.dc.html` na mesma pasta), então todas as telas ficam
> lado a lado com `Editor.dc.html`, sem subpastas.

- [x] 1. Criar `global.css` com reset, tipografia base e regras mobile compartilhadas por todas as telas.
- [x] 2. Criar `Upload.dc.html` (tela de envio de vídeo) com seu CSS próprio.
- [x] 3. Criar `Processando.dc.html` (tela de progresso) com seu CSS próprio.
- [x] 4. Criar `Edicao.dc.html` (tela principal: preview, ferramentas, IA, transcrição) com seu CSS próprio.
- [x] 5. Criar `Concluido.dc.html` (tela de download final) com seu CSS próprio.
- [x] 6. Reescrever `Editor.dc.html` como shell: cabeçalho + estado compartilhado, chamando cada tela via `dc-import`.
- [x] 7. Revisar as props repassadas a cada tela e validar visualmente o fluxo completo (upload → processando → edição → concluído).
- [x] 8. Padronizar com Bootstrap (via `global.css`) e criar `style.css` como arquivo único de tema (cores, raios, espaçamento, tipografia).
