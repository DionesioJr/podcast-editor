# PROJETO: Editor de Vídeo Simples

> Documento de regras de negócio. Descreve **o que** o produto faz e **como deve funcionar** do ponto de vista do usuário e do negócio. Não trata de tecnologia nem de implementação.
>
> Nome do produto: a definir.
> Versão do documento: 1.1 (v1 do produto)

---

## 1. Visão geral

### 1.1 O problema
Quem grava podcasts, aulas e vídeos falados termina com um material bruto que:

- tem **pausas longas** (pensar, beber água, olhar anotações, escrever no quadro);
- tem **hesitações** ("é…", "hã", "hum");
- tem **erros e repetições** ("não, peraí, vou falar de novo…");
- tem **bastidores** ("tá gravando?", teste de som, combinados antes de começar);
- tem **trechos fora do assunto** que deixam o vídeo longo e cansativo;
- tem **volume baixo ou desigual** (um convidado fala mais baixo que o outro);
- **não tem legenda**, e a maioria das pessoas assiste no celular sem som;
- está em **um só formato** (normalmente horizontal), mas precisa ser publicado também no vertical.

Resolver isso num editor tradicional exige tempo, conhecimento técnico e paciência para cortar trecho por trecho numa linha do tempo. A maioria das pessoas desiste ou publica o vídeo sem editar.

### 1.2 A proposta
Um editor de vídeo **gratuito e sem cadastro**, que funciona no navegador do computador e também como aplicativo de celular (iPhone e Android), em que o usuário:

1. **envia o vídeo**;
2. **marca as ferramentas** que quer usar (cortar pausas, legendar, aumentar volume, cortar com IA, formato de saída);
3. **revisa** o resultado, se quiser;
4. **baixa** o vídeo pronto.

O produto faz automaticamente o trabalho braçal. O usuário só decide.

### 1.3 Foco 80/20
O produto **não** quer ser um editor completo. Ele se concentra nas poucas ferramentas que resolvem a maior parte da dor de quem edita vídeo falado:

| Ferramenta | Dor que resolve | Por que é essencial |
|---|---|---|
| Corte automático de pausas | Vídeo lento e arrastado | É a edição mais feita em vídeo falado e a mais cansativa de fazer à mão |
| Transcrição automática | Base para tudo | Permite editar pelo texto, legendar e usar a IA |
| Edição pelo texto | Cortar um trecho específico | Apagar uma frase é tão fácil quanto editar um documento |
| Corte inteligente com IA | Deixar só o conteúdo bom | Remove erros, repetições, bastidores e partes fora do assunto |
| Legendas automáticas | Público assiste sem som | Aumentam a retenção, principalmente no celular |
| Volume | Áudio baixo ou desigual | Um áudio ruim faz o público abandonar o vídeo |
| Formato horizontal/vertical | Publicar em várias plataformas | O mesmo conteúdo vai para o YouTube e para vídeos curtos |

O produto funciona igual no computador e no celular: as mesmas ferramentas, o mesmo projeto e o mesmo resultado.

Qualquer ferramenta fora dessa lista fica **fora da v1** (ver seção 11).

### 1.4 Público-alvo (personas)

**Podcaster.** Grava episódios de 30 min a 2 h, geralmente com 2 ou mais pessoas. Quer uma versão limpa, sem bastidores e com volume equilibrado, e também uma versão vertical para divulgar.

**Professor / criador de aulas.** Grava aulas e explicações com muitas pausas, erros de fala e "vou repetir essa parte". Quer uma aula mais curta e objetiva, com legenda para acessibilidade.

**Criador iniciante.** Não sabe usar editores profissionais. Quer publicar vídeos falados com aparência profissional sem aprender edição.

---

## 2. Princípios do produto

1. **Automático primeiro, revisão sempre possível.** Toda ferramenta funciona sozinha com bons padrões. O usuário pode revisar e ajustar, mas nunca é obrigado.
2. **A IA sugere, o usuário decide.** Nenhum corte feito pela IA é aplicado sem a confirmação do usuário.
3. **Nada é destrutivo.** O vídeo original nunca é alterado. Todo corte pode ser desfeito ou restaurado a qualquer momento antes de exportar.
4. **Poucas opções, padrões bons.** Em vez de números técnicos, o usuário escolhe entre níveis simples (ex.: Suave / Equilibrado / Agressivo).
5. **Linguagem simples.** Nenhum termo técnico de edição de vídeo na tela. Tudo é explicado em linguagem do dia a dia.
6. **Gratuito e sem cadastro.** O usuário usa na hora, sem criar conta e sem pagar.
7. **Privacidade por padrão.** O vídeo do usuário só é usado para a edição dele e é apagado automaticamente.
8. **Português.** Toda a interface, a transcrição e as legendas são em português do Brasil.

---

## 3. Glossário

| Termo | Significado |
|---|---|
| **Vídeo original** | O arquivo enviado pelo usuário. Nunca é modificado. |
| **Projeto** | A sessão de edição de um vídeo: o original, a transcrição, as escolhas do usuário e os arquivos exportados. |
| **Transcrição** | O texto de tudo o que foi falado, com cada palavra ligada ao momento exato em que aparece no vídeo. |
| **Trecho** | Um intervalo de tempo do vídeo (início e fim). |
| **Pausa** | Um trecho sem fala. |
| **Hesitação** | Som sem significado usado para "pensar em voz alta" ("é…", "hã", "hum", "ahn"). |
| **Corte** | Um trecho marcado para sair do vídeo final. Cada corte tem uma **origem**: Pausa, Hesitação, IA ou Manual. |
| **Restaurar** | Desfazer um corte específico, fazendo o trecho voltar ao vídeo final. |
| **Respiro** | Pequena margem de silêncio mantida antes e depois da fala para o corte não parecer brusco. |
| **Bloco de legenda** | Um pedaço de texto exibido na tela durante um intervalo de tempo. |
| **Enquadramento** | A parte da imagem que aparece no vídeo vertical. |
| **Área segura** | Região da tela vertical que não fica coberta pelos botões e textos das redes sociais. |
| **Exportar** | Gerar o arquivo final do vídeo com todas as edições aplicadas. |

---

## 4. Jornada do usuário

### 4.1 Fluxo principal

```
[1. Enviar vídeo] → [2. Processamento automático] → [3. Escolher ferramentas]
        → [4. Revisar (opcional)] → [5. Exportar] → [6. Baixar]
```

1. **Enviar vídeo.** No computador, o usuário arrasta o arquivo para a página ou clica em "Escolher vídeo". No celular, escolhe o vídeo na galeria ou nos arquivos.
2. **Processamento automático.** O sistema extrai o áudio e gera a transcrição sem que o usuário precise pedir. Enquanto isso, a tela mostra o andamento de cada etapa.
3. **Escolher ferramentas.** O usuário vê o **Painel de Ferramentas**: uma lista com caixas de marcar, cada uma com uma frase explicando o que faz.
4. **Revisar (opcional).** O usuário assiste ao resultado, confere os cortes, corrige a transcrição, ajusta a legenda e o enquadramento.
5. **Exportar.** O usuário vê um resumo do que será aplicado e confirma.
6. **Baixar.** O arquivo fica disponível para download.

### 4.2 Fluxo expresso
Para quem não quer revisar nada:

1. Envia o vídeo.
2. Deixa as ferramentas marcadas no padrão (ou marca as que quer).
3. Clica em **"Editar e exportar"**.
4. Baixa o vídeo pronto.

Regra: o fluxo expresso **não inclui o Corte inteligente com IA**, porque ele sempre exige a confirmação do usuário (Princípio 2). Se a IA estiver marcada, o sistema leva o usuário à tela de revisão das sugestões antes de exportar.

### 4.3 Painel de Ferramentas

O painel é a tela central do produto. Cada ferramenta aparece com nome, descrição curta e estado padrão:

| Ferramenta | Descrição exibida | Padrão |
|---|---|---|
| Cortar pausas | "Remove silêncios e deixa o vídeo mais dinâmico." | ✅ Marcado (Equilibrado) |
| ↳ Remover hesitações | "Tira os 'é…', 'hã' e 'hum'." | ⬜ Desmarcado |
| Corte inteligente com IA | "A IA sugere o que cortar para deixar só o conteúdo bom." | ⬜ Desmarcado |
| Legendas automáticas | "Coloca legenda no vídeo automaticamente." | ✅ Marcado |
| Nivelar volume | "Deixa o volume das vozes parecido e agradável." | ✅ Marcado |
| Aumentar volume | "Deixa o som mais alto." | ⬜ Desmarcado |
| Formato horizontal (PC/YouTube) | "Vídeo deitado, 16:9." | ✅ Marcado |
| Formato vertical (celular) | "Vídeo em pé, 9:16, para Reels, TikTok e Shorts." | ⬜ Desmarcado |

Regras do painel:

- **RP-01.** Pelo menos um formato de saída (horizontal ou vertical) precisa estar marcado para exportar.
- **RP-02.** Marcar ou desmarcar uma ferramenta atualiza a pré-visualização e o resumo de duração na hora, sem nova espera de processamento, sempre que possível.
- **RP-03.** Ferramentas que dependem da fala (pausas, hesitações, IA, legendas) ficam desativadas, com a explicação do motivo, se o vídeo não tiver fala detectada.
- **RP-04.** O painel mostra sempre o resumo: **"Duração original: 58:12 → Duração final: 41:37 (−16:35)"**.
- **RP-05.** Todas as ferramentas podem ser desmarcadas. Desmarcar uma ferramenta de corte remove todos os cortes daquela origem, mas **não** afeta cortes de outras origens.

---

## 5. Regras de negócio por módulo

### RN-01: Envio do vídeo

**Objetivo:** receber o vídeo do usuário de forma simples e segura.

**Como funciona:**
- No computador, o usuário arrasta o arquivo para a área de envio ou clica em "Escolher vídeo". No celular, escolhe o vídeo na galeria ou nos arquivos.
- A tela mostra o progresso do envio (percentual e tempo estimado).
- Ao final do envio, o processamento começa automaticamente (RN-03).

**Regras:**
- **RN-01.1.** Aceitar os formatos de vídeo mais comuns de celulares, câmeras e gravadores de tela (ex.: MP4, MOV, MKV, WEBM, AVI).
- **RN-01.2.** Um projeto tem **um único vídeo**. Para editar outro vídeo, o usuário inicia um novo projeto.
- **RN-01.3.** Respeitar os limites de tamanho e duração da seção 8. A validação acontece **antes** do envio sempre que possível, para o usuário não esperar à toa.
- **RN-01.4.** Recusar vídeo sem trilha de áudio, com mensagem clara (ver seção 9).
- **RN-01.5.** Recusar arquivo corrompido ou que não seja vídeo.
- **RN-01.6.** O usuário pode **cancelar** o envio a qualquer momento; o que já foi enviado é descartado.
- **RN-01.7.** Se a conexão cair, o sistema tenta retomar o envio de onde parou. Se não conseguir, informa e oferece "Tentar novamente".
- **RN-01.8.** Antes do primeiro envio, a tela informa em uma linha: "Seu vídeo é privado e será apagado automaticamente em 24 horas."

**Critérios de aceite:**
- [ ] Um vídeo válido dentro dos limites é enviado e o processamento começa sozinho.
- [ ] Um arquivo acima do limite é recusado antes do envio, com o limite informado.
- [ ] Um vídeo sem áudio é recusado com mensagem explicativa.
- [ ] Cancelar o envio descarta o arquivo e volta para a tela inicial.

---

### RN-02: Sessão sem conta

**Objetivo:** permitir o uso imediato, sem cadastro, garantindo privacidade.

**Regras:**
- **RN-02.1.** Cada projeto recebe um **link único e privado**. Quem tem o link acessa o projeto.
- **RN-02.2.** O aparelho em que o projeto foi criado lembra o projeto, seja no navegador ou no aplicativo. Ao voltar, o usuário vê "Continuar editando: nome-do-video". Pelo link, o mesmo projeto também abre em outro aparelho.
- **RN-02.3.** O projeto e todos os arquivos (original, áudio, transcrição e exportações) são **apagados automaticamente 24 horas após o envio** (prazo configurável, ver seção 8).
- **RN-02.4.** A tela mostra sempre o tempo restante: "Este projeto expira em 18 h".
- **RN-02.5.** O usuário pode apagar o projeto a qualquer momento com o botão **"Descartar projeto"**, com confirmação. A exclusão é imediata e definitiva.
- **RN-02.6.** No navegador, ao tentar fechar a página com edições não exportadas, o sistema avisa: "Você ainda não exportou seu vídeo. Suas edições ficam salvas por X horas neste link." No aplicativo o aviso não aparece, porque o projeto continua salvo em "Continuar editando".
- **RN-02.7.** As escolhas do usuário (ferramentas marcadas, cortes restaurados, correções na transcrição, estilo da legenda, enquadramento) são salvas automaticamente durante a edição. Não existe botão "Salvar".
- **RN-02.8.** Ao expirar, o link mostra "Este projeto expirou e foi apagado" e oferece "Começar novo projeto".
- **RN-02.9.** A tela avisa que o link não deve ser compartilhado com terceiros, pois dá acesso ao vídeo.

**Critérios de aceite:**
- [ ] Fechar e reabrir o navegador mantém o projeto e todas as escolhas.
- [ ] Após 24 h, o projeto fica inacessível e os arquivos são apagados.
- [ ] "Descartar projeto" apaga tudo na hora.

---

### RN-03: Processamento inicial

**Objetivo:** preparar o vídeo para todas as ferramentas sem que o usuário precise pedir.

**Como funciona:** após o envio, o sistema executa automaticamente, nesta ordem:

1. **Verificar o vídeo** (duração, formato, presença de áudio).
2. **Extrair o áudio.**
3. **Transcrever a fala** (RN-04).
4. **Detectar pausas e hesitações** (RN-05).

**Regras:**
- **RN-03.1.** A tela mostra cada etapa com seu status (aguardando / em andamento / concluída) e um tempo estimado.
- **RN-03.2.** O usuário pode **sair da página ou fechar o aplicativo** durante o processamento. Ele continua, e o usuário retoma pelo link ou pelo aplicativo.
- **RN-03.3.** Enquanto processa, o usuário já pode ver o Painel de Ferramentas e fazer escolhas. Elas são aplicadas quando o processamento terminar.
- **RN-03.4.** Se uma etapa falhar, o sistema mostra a mensagem correspondente (seção 9) e o botão **"Tentar novamente"**, que refaz só a etapa que falhou.
- **RN-03.5.** O processamento inicial é feito **uma única vez** por projeto. Mudar as ferramentas depois não exige processar de novo.

**Critérios de aceite:**
- [ ] Após o envio, as 4 etapas rodam sem ação do usuário.
- [ ] O usuário vê o andamento de cada etapa.
- [ ] Uma falha na transcrição permite tentar novamente sem reenviar o vídeo.

---

### RN-04: Transcrição automática

**Objetivo:** transformar a fala em texto sincronizado, que serve de base para edição pelo texto, legendas e IA.

**Regras:**
- **RN-04.1.** Idioma: **somente português do Brasil**.
- **RN-04.2.** Cada palavra fica ligada ao momento exato (início e fim) em que é falada.
- **RN-04.3.** A transcrição tem **pontuação e letras maiúsculas** automáticas e é dividida em parágrafos por mudança de assunto ou pausa longa.
- **RN-04.4.** A transcrição **identifica quem fala**: o texto indica a troca de falante ("Pessoa 1", "Pessoa 2") e o usuário pode renomear ("Pessoa 1" → "Ana"). Em gravações de uma pessoa só, ou quando as vozes forem indistinguíveis, tudo fica como um único falante, e as demais ferramentas funcionam do mesmo jeito.
- **RN-04.5.** O usuário pode **corrigir palavras** (ex.: um nome próprio transcrito errado). A correção muda só o texto; o tempo da palavra continua o mesmo. As correções aparecem na legenda e são consideradas pela IA.
- **RN-04.6.** Corrigir o texto **não** cria fala nova no vídeo. Só é possível corrigir o que já foi dito, nunca acrescentar palavras que não existem no áudio.
- **RN-04.7.** Hesitações ("é…", "hã", "hum", "ahn") são identificadas e marcadas visualmente na transcrição.
- **RN-04.8.** Se nenhuma fala for detectada, o sistema avisa e desativa as ferramentas que dependem de fala (RP-03). Volume e formato continuam disponíveis.
- **RN-04.9.** Se a transcrição tiver baixa confiabilidade (ex.: vídeo em outro idioma, áudio muito ruim), o sistema avisa: "A transcrição pode conter muitos erros. O vídeo está em português? O áudio está claro?", e permite continuar mesmo assim.
- **RN-04.10.** O usuário pode **baixar a transcrição** como texto simples.

**Critérios de aceite:**
- [ ] Clicar em uma palavra leva o vídeo para aquele momento.
- [ ] Durante a reprodução, a palavra falada fica destacada no texto.
- [ ] Corrigir uma palavra altera a legenda, sem alterar o tempo.

---

### RN-05: Corte automático de pausas (e hesitações)

**Objetivo:** remover os silêncios que deixam o vídeo lento, mantendo um ritmo natural.

**Como funciona:** o sistema identifica os trechos sem fala e os reduz, mantendo um pequeno respiro antes e depois de cada fala para que a transição não fique robótica.

**Níveis de sensibilidade** (o usuário escolhe um; o padrão é Equilibrado):

| Nível | Pausas consideradas | Respiro mantido | Indicado para |
|---|---|---|---|
| **Suave** | Mais de 1,2 s | 0,3 s de cada lado | Aulas, conteúdo reflexivo, entrevistas |
| **Equilibrado** | Mais de 0,7 s | 0,2 s de cada lado | Uso geral, podcasts |
| **Agressivo** | Mais de 0,4 s | 0,1 s de cada lado | Vídeos curtos, ritmo acelerado |

*Valores de referência, ajustáveis pelo negócio após testes com usuários.*

**Regras:**
- **RN-05.1.** Uma pausa que atinge o nível escolhido é **encurtada**: sobra apenas o respiro antes e depois da fala. O resto é cortado.
- **RN-05.2.** **Nunca** cortar no meio de uma palavra.
- **RN-05.3.** Pausas no **início e no fim** do vídeo (antes da primeira fala e depois da última) são removidas por completo, sobrando só o respiro.
- **RN-05.4.** Mudar o nível de sensibilidade recalcula os cortes de pausa na hora, **preservando** as decisões manuais do usuário (restaurações e cortes manuais).
- **RN-05.5.** O sistema mostra o resultado: "38 pausas cortadas, 6 min 12 s economizados".
- **RN-05.6.** Cada corte de pausa aparece na linha do tempo e pode ser **restaurado** individualmente, ou todos de uma vez ("Restaurar todas as pausas").
- **RN-05.7.** Silêncio com algo relevante acontecendo na imagem é uma limitação conhecida (ex.: o professor escrevendo no quadro em silêncio). O sistema não entende a imagem na v1, então a solução é o usuário restaurar o trecho ou escolher o nível Suave. A tela de ajuda deve explicar isso.

**Subopção: remover hesitações**
- **RN-05.8.** Remove automaticamente as **hesitações** marcadas na transcrição ("é…", "éé", "hã", "hum", "ahn").
- **RN-05.9.** A palavra **"é" como verbo** ("isso é importante") **nunca** é tratada como hesitação. Só conta como hesitação o "é" alongado ou isolado entre pausas, sem função na frase.
- **RN-05.10.** **Muletas de linguagem** que também podem ser palavras legítimas ("né", "tipo", "então", "aí", "sabe") **não são removidas automaticamente**. Elas ficam apenas destacadas na transcrição, e o usuário decide se corta cada uma (RN-06) ou pede para a IA avaliar (RN-07).
- **RN-05.11.** Desmarcada por padrão. Quando marcada, mostra quantas hesitações foram removidas.

**Critérios de aceite:**
- [ ] Com Equilibrado, nenhuma pausa maior que 0,7 s + respiros permanece no vídeo final, exceto as restauradas pelo usuário.
- [ ] Nenhuma palavra é cortada pela metade.
- [ ] Trocar de nível não desfaz restaurações manuais.
- [ ] O verbo "é" nunca é removido como hesitação.

---

### RN-06: Edição pelo texto

**Objetivo:** permitir cortar qualquer trecho tão facilmente quanto apagar texto em um documento.

**Como funciona:** o usuário seleciona palavras, frases ou parágrafos na transcrição e clica em **"Cortar trecho"** (ou usa a tecla de apagar). O trecho correspondente sai do vídeo.

**Regras:**
- **RN-06.1.** O texto cortado **não desaparece**: fica **riscado** e esmaecido, para o usuário ver o que saiu e poder restaurar.
- **RN-06.2.** Clicar em um trecho riscado mostra a opção **"Restaurar"**.
- **RN-06.3.** Cortes pelo texto têm origem **Manual**.
- **RN-06.4.** A seleção sempre se ajusta ao início da primeira palavra e ao fim da última palavra selecionadas. Não existe corte de meia palavra.
- **RN-06.5.** O sistema diferencia claramente duas ações:
  - **Corrigir texto** (RN-04.5): muda só o que está escrito; o vídeo não muda.
  - **Cortar trecho**: remove o trecho do vídeo.
- **RN-06.6.** O usuário também pode cortar um trecho **pela linha do tempo**, selecionando um intervalo e clicando em "Cortar trecho". Útil para partes sem fala que o corte de pausas não pegou.
- **RN-06.7.** Também existe o inverso: restaurar um trecho cortado por qualquer origem (Pausa, Hesitação, IA) torna aquele trecho **protegido**, e nenhum corte automático posterior o remove de novo.

**Critérios de aceite:**
- [ ] Selecionar uma frase e cortá-la remove exatamente aquela frase do vídeo.
- [ ] A frase fica riscada e pode ser restaurada.
- [ ] Um trecho restaurado não é cortado de novo ao reprocessar pausas ou pedir nova análise da IA.

---

### RN-07: Corte inteligente com IA

**Objetivo:** usar uma IA que entende o conteúdo falado para sugerir cortes que deixem **apenas o conteúdo bom**.

**Como funciona:**
1. O usuário marca **"Corte inteligente com IA"**.
2. Escolhe o **tipo de conteúdo** (Podcast / Aula / Outro), o que ajuda a IA a entender o que é importante.
3. Escolhe um **modo** (abaixo) e clica em **"Analisar"**.
4. A IA lê a transcrição e devolve uma **lista de sugestões de corte**, cada uma com o motivo.
5. O usuário revisa e **aceita ou recusa** cada sugestão, ou todas de uma vez.
6. Só as sugestões aceitas viram cortes (origem **IA**).

**Modos:**

**(a) Limpar conteúdo** (padrão). A IA procura e sugere cortar:

| Categoria | Exemplos |
|---|---|
| Bastidores | "Tá gravando?", teste de som, "pode começar?", combinados antes ou depois da gravação |
| Erros e regravações | "Não, peraí, vou falar de novo", "corta essa parte", frase interrompida e recomeçada |
| Repetições | A mesma ideia dita duas vezes seguidas. Mantém a versão mais clara, normalmente a última |
| Falsos começos | Frases começadas e abandonadas |
| Fora do assunto | Digressões longas sem relação com o tema do vídeo |
| Muletas excessivas | "né", "tipo", "então" usados como enchimento (RN-05.10) |

Regras específicas por tipo de conteúdo:
- **Podcast:** preservar a conversa natural, o humor e as reações que fazem parte do conteúdo. Ser mais conservador com "fora do assunto".
- **Aula:** preservar explicações, exemplos, passos e respostas a perguntas. Ser mais rigoroso com erros, regravações e digressões.

**(b) Duração alvo.** O usuário informa a duração desejada (ex.: "quero um vídeo de ~20 minutos"). A IA sugere cortes para chegar próximo desse tempo, **priorizando manter as ideias centrais** e removendo primeiro o que é menos importante.
- A duração alvo deve estar entre **20% e 90%** da duração atual do vídeo (já descontados os cortes existentes).
- O resultado é aproximado (tolerância de ±10%). A tela mostra a duração que as sugestões atingem.
- Se não for possível chegar ao alvo sem perder conteúdo essencial, a IA informa e sugere a menor duração razoável.

**(c) Instrução livre.** O usuário escreve o que quer, com até 500 caracteres. Exemplos:
- "Remova a parte em que falamos do patrocinador."
- "Tire tudo antes da introdução oficial."
- "Corte as perguntas dos alunos que não foram respondidas."

Se o pedido estiver fora do que a ferramenta faz (ex.: "adicione música", "mude a cor do vídeo"), a IA responde que isso não é possível nesta ferramenta e não sugere cortes.

**Regras gerais da IA:**
- **RN-07.1.** **A IA nunca aplica cortes sozinha.** Toda sugestão precisa ser aceita pelo usuário (Princípio 2).
- **RN-07.2.** Cada sugestão mostra: o texto do trecho, a duração, a categoria e o motivo em linguagem simples (ex.: "Repetição: essa explicação é repetida logo em seguida de forma mais clara").
- **RN-07.3.** O usuário pode **ouvir e ver** cada trecho sugerido antes de decidir.
- **RN-07.4.** Botões **"Aceitar todas"** e **"Recusar todas"**, além de aceitar ou recusar individualmente.
- **RN-07.5.** Os cortes da IA **sempre começam e terminam em limites de frase**, com respiro. A IA não sugere cortar só metade de uma frase, exceto em falsos começos.
- **RN-07.6.** A tela mostra o impacto em tempo real: "Aceitando as sugestões selecionadas: 41:37 → 29:05".
- **RN-07.7.** A IA analisa o vídeo **considerando os cortes já existentes** (não sugere cortar o que já foi cortado) e **respeitando os trechos protegidos** (RN-06.7).
- **RN-07.8.** Um novo pedido à IA **descarta as sugestões ainda não decididas** do pedido anterior. As sugestões já aceitas continuam como cortes.
- **RN-07.9.** Sugestões aceitas podem ser restauradas depois, como qualquer outro corte.
- **RN-07.10.** Existe um **limite de pedidos à IA por projeto** (seção 8). A tela mostra quantos restam: "Você ainda pode fazer 3 análises neste projeto".
- **RN-07.11.** A IA recebe **apenas o texto da transcrição** (com as correções do usuário e as marcações de tempo). Ela não recebe o vídeo nem o áudio.
- **RN-07.12.** A tela exibe o aviso: "A IA pode errar. Revise as sugestões antes de aceitar."
- **RN-07.13.** Se a IA estiver indisponível, o restante do editor continua funcionando normalmente e o usuário pode tentar de novo depois.

**Critérios de aceite:**
- [ ] Nenhum corte da IA entra no vídeo sem o usuário aceitar.
- [ ] Toda sugestão tem motivo e pode ser pré-visualizada.
- [ ] No modo Duração alvo, as sugestões chegam a ±10% da duração pedida ou a IA explica por que não chegou.
- [ ] Trechos protegidos nunca aparecem como sugestão.

---

### RN-08: Legendas automáticas

**Objetivo:** colocar legendas no vídeo automaticamente, legíveis e sincronizadas, sem que o usuário precise digitar nada.

**Como funciona:** as legendas são geradas a partir da transcrição (já com as correções do usuário) e sincronizadas com o **vídeo final**, depois de todos os cortes.

**Regras de conteúdo e sincronia:**
- **RN-08.1.** Trechos cortados **não** aparecem na legenda. A legenda sempre reflete exatamente o que é falado no vídeo final.
- **RN-08.2.** Correções feitas na transcrição (RN-04.5) aparecem automaticamente na legenda.
- **RN-08.3.** Hesitações não aparecem na legenda, mesmo que o usuário tenha optado por mantê-las no vídeo.
- **RN-08.4.** O usuário pode editar o texto de um bloco de legenda diretamente. Isso equivale a corrigir a transcrição (RN-04.5).

**Regras de quebra de texto:**

| Regra | Horizontal | Vertical |
|---|---|---|
| Linhas por bloco | Máx. 2 | Máx. 2 |
| Caracteres por linha | Máx. 42 | Máx. 22 |
| Duração mínima do bloco | 1 s | 0,7 s |
| Duração máxima do bloco | 6 s | 3 s |

- **RN-08.5.** A quebra respeita a leitura natural: não separa artigo do substantivo ("o / carro"), preposição do complemento, nem nomes compostos. Prefere quebrar em pontuação.
- **RN-08.6.** Um bloco não atravessa uma troca de falante nem um corte.
- **RN-08.7.** Um bloco some da tela quando a fala termina. Não fica legenda "sobrando" durante silêncios longos.

**Estilos prontos** (o usuário escolhe um):

| Estilo | Descrição | Padrão para |
|---|---|---|
| **Clássico** | Texto branco com contorno escuro, frases completas | Horizontal |
| **Palavra em destaque** | Poucas palavras por vez, a palavra falada no momento muda de cor | Vertical |
| **Caixa** | Texto sobre uma faixa escura semitransparente | (opcional) |

**Personalização (mínima, de propósito):**
- **RN-08.8.** Tamanho: **P / M / G** (padrão M).
- **RN-08.9.** Posição: **Inferior** ou **Centro** (padrão: Inferior no horizontal, Centro-inferior no vertical).
- **RN-08.10.** Cor de destaque (só no estilo Palavra em destaque): 4 opções prontas (amarelo, verde, azul, rosa). Padrão amarelo.
- **RN-08.11.** Nenhuma outra personalização na v1 (sem escolha de fonte, sem cor livre, sem animações), para manter a simplicidade.

**Formato de entrega:**
- **RN-08.12.** A legenda é **gravada na imagem do vídeo** exportado.
- **RN-08.13.** Opcionalmente, o usuário pode baixar também um **arquivo de legenda separado** (formato SRT, aceito pelo YouTube e pela maioria dos players), sincronizado com o vídeo final.
- **RN-08.14.** No vertical, a legenda fica sempre dentro da **área segura**, fora da faixa inferior e da lateral direita, onde as redes sociais colocam botões, nome e descrição.

**Critérios de aceite:**
- [ ] A legenda acompanha a fala no vídeo final, mesmo depois de dezenas de cortes.
- [ ] Nenhum texto de trecho cortado aparece na legenda.
- [ ] Nenhum bloco ultrapassa o limite de linhas e caracteres do formato.
- [ ] No vertical, a legenda nunca fica sob os botões das redes sociais.

---

### RN-09: Áudio e volume

**Objetivo:** garantir que o público ouça bem, sem que o usuário entenda de áudio.

**Nivelar volume** (marcado por padrão):
- **RN-09.1.** Deixa o volume geral do vídeo em um nível confortável e padronizado, adequado para internet.
- **RN-09.2.** Equilibra partes baixas e altas: quem fala mais baixo é realçado e quem fala mais alto é suavizado. Isso resolve o caso comum de podcasts com duas pessoas em volumes diferentes.

**Aumentar volume:**
- **RN-09.3.** Níveis simples: **+25%**, **+50%**, **+100% (dobrar)**. O padrão, quando marcado, é +50%.
- **RN-09.4.** Pode ser usado junto com o Nivelar volume. Nesse caso, o aumento é aplicado depois do nivelamento.

**Regras comuns:**
- **RN-09.5.** **Proteção contra distorção:** em nenhuma combinação o som pode "estourar" (chiar ou distorcer). Se o aumento pedido fosse causar distorção, o sistema limita o volume no máximo seguro e avisa: "Aumentamos o máximo possível sem distorcer o som."
- **RN-09.6.** O usuário pode **ouvir** o resultado antes de exportar, numa amostra curta do próprio vídeo, alternando entre "Original" e "Com ajuste" para comparar.
- **RN-09.7.** O ajuste de volume vale para o vídeo inteiro. Não há ajuste por trecho na v1.

**Critérios de aceite:**
- [ ] Com Nivelar volume, vozes em volumes diferentes ficam perceptivelmente parecidas.
- [ ] Nenhuma combinação de opções gera som distorcido.
- [ ] O usuário consegue comparar original e ajustado antes de exportar.

---

### RN-10: Formato de saída (horizontal e vertical)

**Objetivo:** entregar o vídeo pronto para o lugar onde será publicado.

**Formatos:**

| Formato | Proporção | Uso |
|---|---|---|
| **Horizontal** | 16:9 (deitado) | Computador, YouTube, aulas online |
| **Vertical** | 9:16 (em pé) | Celular: Reels, TikTok, Shorts, Status |

**Regras:**
- **RN-10.1.** O usuário pode escolher **um ou os dois** formatos. Escolhendo os dois, a exportação gera **dois arquivos** com as mesmas edições (cortes, áudio), cada um com a legenda adaptada ao seu formato.
- **RN-10.2.** Se o vídeo original **já está no formato escolhido**, a imagem não é alterada.

**Horizontal → Vertical (corte central + ajuste manual):**
- **RN-10.3.** O vídeo vertical é um **recorte** do vídeo horizontal. Por padrão, o recorte fica **no centro** da imagem.
- **RN-10.4.** Na pré-visualização vertical, o usuário vê o quadro de recorte sobre a imagem e pode **arrastá-lo para a esquerda ou para a direita** para enquadrar quem fala.
- **RN-10.5.** Na v1, o enquadramento é **único para o vídeo inteiro** (uma posição só). O recorte não acompanha o movimento das pessoas.
- **RN-10.6.** Para ajudar a escolher, o usuário pode navegar pelo vídeo enquanto ajusta o quadro, e conferir se o enquadramento funciona em momentos diferentes.
- **RN-10.7.** A tela avisa: "No vertical, as laterais do vídeo são cortadas. Confira se quem fala está dentro do quadro."
- **RN-10.8.** A legenda é reposicionada automaticamente para a área segura do vertical (RN-08.14) e usa as regras de quebra do vertical (RN-08).

**Vertical → Horizontal:**
- **RN-10.9.** Se o original for vertical e o usuário escolher horizontal, o vídeo é exibido inteiro no centro, com **faixas pretas nas laterais**. Nada da imagem é cortado.

**Outros formatos de origem (ex.: quadrado):**
- **RN-10.10.** Para gerar vertical, vale a regra de recorte com ajuste manual (RN-10.3 a RN-10.7). Para gerar horizontal, vale a regra das faixas laterais (RN-10.9).

**Critérios de aceite:**
- [ ] Escolher os dois formatos gera dois arquivos com os mesmos cortes.
- [ ] O usuário consegue mover o enquadramento vertical e o resultado exportado respeita a posição escolhida.
- [ ] Um original vertical exportado como horizontal não perde nenhuma parte da imagem.

---

### RN-11: Revisão e pré-visualização

**Objetivo:** permitir que o usuário confira e ajuste o resultado antes de exportar, se quiser.

**Tela de revisão**, composta por:
1. **Player**: mostra o vídeo **como ficará** (cortes, volume, legenda e formato aplicados).
2. **Transcrição**: com trechos cortados riscados e hesitações e muletas destacadas (RN-04, RN-06).
3. **Linha do tempo**: barra com a duração total, mostrando os trechos cortados em cores diferentes por origem.

| Origem do corte | Identificação na linha do tempo |
|---|---|
| Pausa | Cor 1 |
| Hesitação | Cor 2 |
| IA | Cor 3 |
| Manual | Cor 4 |

**Regras:**
- **RN-11.1.** O player pode alternar entre **"Resultado final"** (padrão) e **"Original"**, para comparação.
- **RN-11.2.** Clicar em um corte na linha do tempo ou na transcrição mostra: origem, duração e o botão **"Restaurar"**.
- **RN-11.3.** **Desfazer / Refazer** valem para qualquer ação de edição (cortar, restaurar, aceitar sugestão, corrigir texto, trocar estilo, mover enquadramento).
- **RN-11.4.** Filtros rápidos: "Mostrar só cortes de: Pausa / Hesitação / IA / Manual", e restaurar todos de uma origem.
- **RN-11.5.** O resumo de duração (RP-04) fica sempre visível.
- **RN-11.6.** No modo "Resultado final", o player pula os trechos cortados de forma contínua, como no vídeo exportado.
- **RN-11.7.** Com os dois formatos marcados, o usuário alterna a pré-visualização entre Horizontal e Vertical.

**Critérios de aceite:**
- [ ] O que o usuário vê na pré-visualização é igual ao que recebe na exportação.
- [ ] Qualquer corte pode ser identificado pela origem e restaurado.
- [ ] Desfazer reverte a última ação, qualquer que seja.

---

### RN-12: Exportação e download

**Objetivo:** gerar o arquivo final com todas as escolhas aplicadas e entregá-lo ao usuário.

**Como funciona:**
1. O usuário clica em **"Exportar"**.
2. Vê um **resumo** antes de confirmar:
   - ferramentas aplicadas (ex.: "Pausas: Equilibrado · Legendas: Clássico · Nivelar volume");
   - quantidade de cortes por origem;
   - duração original → duração final;
   - formatos que serão gerados;
   - aviso, se houver sugestões da IA ainda não decididas: "Existem 5 sugestões da IA não revisadas. Elas não serão aplicadas."
3. Confirma, e a exportação começa, com progresso e tempo estimado.
4. Ao terminar, aparecem os botões de download.

**Regras:**
- **RN-12.1.** **Qualidade:** o vídeo exportado mantém a qualidade de imagem e a fluidez do original, respeitando a resolução máxima da seção 8. O produto não pode piorar visivelmente a qualidade.
- **RN-12.2.** No vertical feito a partir de um horizontal, a nitidez pode ser menor, porque a imagem é um recorte (RN-10.7).
- **RN-12.3.** **Sem marca d'água.**
- **RN-12.4.** **Nome do arquivo:** `nome-original_editado_horizontal` e `nome-original_editado_vertical`.
- **RN-12.5.** Com dois formatos, cada arquivo tem seu próprio botão de download, e há também o botão "Baixar todos".
- **RN-12.6.** Se o usuário pediu, o arquivo de legenda (RN-08.13) e a transcrição (RN-04.10) aparecem junto dos downloads.
- **RN-12.7.** A exportação **continua mesmo se o usuário fechar a página ou o aplicativo**. Com a tela aberta, o progresso aparece em tempo real; ao voltar depois, pelo link ou pelo aplicativo, os downloads estão disponíveis. O sistema não envia aviso quando termina (ver seção 11).
- **RN-12.8.** O usuário pode **cancelar** a exportação em andamento.
- **RN-12.9.** Depois de exportar, o usuário pode **voltar a editar e exportar de novo**, dentro do limite de exportações (seção 8). A nova exportação substitui a anterior do mesmo formato.
- **RN-12.10.** Os arquivos exportados ficam disponíveis **até o projeto expirar** (RN-02.3).
- **RN-12.11.** **Duração mínima:** a exportação é bloqueada se o vídeo final tiver menos de 3 segundos, com a mensagem: "Seu vídeo ficou curto demais. Restaure alguns trechos."
- **RN-12.12.** No aplicativo de celular, além de baixar, o usuário pode **salvar o vídeo direto na galeria** e compartilhá-lo com outros aplicativos.

**Critérios de aceite:**
- [ ] O arquivo baixado reflete exatamente a pré-visualização.
- [ ] Fechar a página durante a exportação não a interrompe.
- [ ] Os arquivos seguem o padrão de nome definido.
- [ ] Sugestões da IA não aceitas não são aplicadas.

---

## 6. Regras de combinação e ordem de aplicação

As ferramentas são aplicadas sempre **nesta ordem**, independentemente da ordem em que o usuário as marcou:

```
1. Transcrição (base de tudo)
2. Cortes: Pausas + Hesitações + IA (aceitos) + Manuais (somados)
3. Áudio: Nivelar volume → Aumentar volume
4. Enquadramento: formato horizontal e/ou vertical
5. Legendas: geradas sobre o resultado final, no formato de cada saída
```

**Regras de convivência entre cortes:**
- **RC-01.** Cortes de origens diferentes **se somam**. Se dois cortes se sobrepõem, o vídeo final perde a união dos dois trechos.
- **RC-02.** **A decisão manual sempre prevalece.** Um trecho restaurado pelo usuário fica protegido e nenhum corte automático (pausa, hesitação, IA) o remove de novo (RN-06.7).
- **RC-03.** Um corte manual feito pelo usuário não é desfeito por nenhuma ferramenta automática.
- **RC-04.** Recalcular uma ferramenta automática (trocar o nível de pausa, nova análise da IA) só afeta os cortes **daquela origem** e respeita RC-02 e RC-03.
- **RC-05.** Desmarcar uma ferramenta de corte remove só os cortes daquela origem (RP-05).
- **RC-06.** Depois de um corte, o respiro entre as falas que ficam lado a lado segue a regra do nível de pausa escolhido, para que o vídeo final tenha ritmo uniforme.
- **RC-07.** A legenda é **sempre** a última etapa e, portanto, sempre reflete os cortes finais.

---

## 7. Estados do projeto

| Estado | Significado | O que o usuário pode fazer |
|---|---|---|
| **Enviando** | O arquivo está sendo enviado | Acompanhar, cancelar |
| **Processando** | Extração de áudio, transcrição e detecção de pausas | Acompanhar, escolher ferramentas, sair e voltar depois |
| **Pronto para editar** | Tudo preparado | Usar todas as ferramentas, revisar, exportar |
| **Exportando** | Gerando os arquivos finais | Acompanhar, cancelar, sair e voltar depois |
| **Concluído** | Arquivos prontos para download | Baixar, voltar a editar, exportar de novo |
| **Erro** | Alguma etapa falhou | Tentar novamente, descartar |
| **Expirado** | Prazo de retenção passou e tudo foi apagado | Começar novo projeto |

**Transições permitidas:**

```
Enviando ──► Processando ──► Pronto para editar ──► Exportando ──► Concluído
   │              │                 ▲                   │              │
   │              │                 └───────────────────┴──────────────┘
   │              │                   (cancelar exportação / voltar a editar)
   └──────────────┴──► Erro ──► (Tentar novamente: volta à etapa que falhou)

Qualquer estado ──► Expirado (fim do prazo) ou apagado (Descartar projeto)
```

---

## 8. Limites de uso (produto gratuito)

Como o produto é gratuito, os limites existem para controlar custo e garantir uma boa experiência para todos. **Todos são parâmetros configuráveis pelo negócio.** Os valores abaixo são sugestões iniciais.

| Parâmetro | Valor sugerido | Observação |
|---|---|---|
| Tamanho máximo do arquivo | 2 GB | Validado antes do envio |
| Duração máxima do vídeo | 2 horas | Cobre a maioria dos podcasts e aulas |
| Resolução máxima de exportação | Full HD (1080p) | Originais maiores são exportados em Full HD |
| Retenção do projeto | 24 horas após o envio | Depois disso, tudo é apagado |
| Exportações por projeto | 10 | Cada formato conta como uma exportação |
| Análises da IA por projeto | 5 | Cada clique em "Analisar" conta como uma |
| Tamanho da instrução livre da IA | 500 caracteres | Modo (c) da RN-07 |
| Projetos processando ao mesmo tempo | 1 por aparelho | Um novo envio aguarda o anterior terminar o processamento |

---

## 9. Mensagens e tratamento de erros

As mensagens usam linguagem simples, dizem **o que aconteceu** e **o que o usuário pode fazer**.

| Situação | Mensagem ao usuário | Ação oferecida |
|---|---|---|
| Formato não suportado | "Não conseguimos abrir esse arquivo. Envie um vídeo em MP4, MOV, MKV, WEBM ou AVI." | Escolher outro arquivo |
| Arquivo grande demais | "Esse vídeo tem X GB. O limite é 2 GB." | Escolher outro arquivo |
| Vídeo longo demais | "Esse vídeo tem 2 h 35 min. O limite é 2 horas." | Escolher outro arquivo |
| Vídeo sem áudio | "Esse vídeo não tem som. As ferramentas deste editor precisam de áudio." | Escolher outro arquivo |
| Arquivo corrompido | "Esse arquivo parece estar danificado e não pôde ser lido." | Escolher outro arquivo |
| Conexão caiu no envio | "A conexão caiu. Estamos tentando continuar de onde parou…" | Aguardar / Tentar novamente |
| Nenhuma fala detectada | "Não encontramos fala neste vídeo. Legendas, cortes de pausa e IA ficam indisponíveis." | Continuar com volume e formato |
| Transcrição de baixa qualidade | "A transcrição pode ter muitos erros. O vídeo está em português? O áudio está claro?" | Continuar mesmo assim / Descartar |
| Falha na transcrição | "Não conseguimos transcrever o áudio agora." | Tentar novamente |
| IA indisponível | "A IA está indisponível no momento. O restante do editor continua funcionando." | Tentar novamente mais tarde |
| Limite de análises da IA atingido | "Você usou as 5 análises da IA deste projeto." | Continuar editando manualmente |
| Pedido fora do escopo da IA | "Isso não é possível aqui. A IA deste editor só sugere cortes." | Reescrever a instrução |
| Duração alvo inválida | "Escolha uma duração entre X min e Y min." | Ajustar valor |
| Vídeo final curto demais | "Seu vídeo ficou curto demais. Restaure alguns trechos." | Voltar à revisão |
| Nenhum formato marcado | "Escolha pelo menos um formato: horizontal ou vertical." | Marcar formato |
| Limite de exportações atingido | "Você atingiu o limite de exportações deste projeto." | Baixar os arquivos já exportados |
| Falha na exportação | "Algo deu errado ao gerar seu vídeo. Suas edições estão salvas." | Tentar novamente |
| Serviço sem espaço para novos vídeos | "Estamos com muita demanda agora. Tente de novo em alguns minutos." | Tentar mais tarde |
| Projeto expirado | "Este projeto expirou e foi apagado para proteger sua privacidade." | Começar novo projeto |

---

## 10. Privacidade e uso dos dados

- **PV-01.** Nenhum cadastro, e-mail ou dado pessoal é pedido.
- **PV-02.** O projeto só pode ser acessado pelo link privado (RN-02.1).
- **PV-03.** Todos os arquivos são apagados automaticamente ao fim do prazo de retenção, ou imediatamente em "Descartar projeto".
- **PV-04.** O vídeo, o áudio e a transcrição do usuário **não são reutilizados** para nenhum outro fim (nem treinamento, nem divulgação, nem análise de terceiros).
- **PV-05.** A IA recebe apenas o texto da transcrição, e somente quando o usuário pede uma análise (RN-07.11).
- **PV-06.** A página inicial explica essas regras em linguagem simples, em no máximo 3 frases.

---

## 11. Fora do escopo da v1 (próximas versões)

Para manter o foco 80/20, estes itens **não fazem parte da v1**. Ficam registrados como candidatos para versões futuras:

| Item | Por que fica para depois |
|---|---|
| Juntar vários vídeos em um | Muda o modelo de "um vídeo por projeto" |
| Trilha sonora e efeitos sonoros | Não é a dor principal de vídeo falado |
| Transições, zoom e efeitos visuais | Aumentam a complexidade da interface |
| Redução de ruído de fundo | Muito pedida; forte candidata à v2 |
| Outros idiomas e tradução de legendas | v1 é só português |
| Geração automática de clipes curtos (melhores momentos) | Forte candidata à v2, combinando IA e vertical |
| Enquadramento vertical que segue o rosto | v1 usa enquadramento fixo com ajuste manual |
| Enquadramento vertical por trecho | v1 usa uma posição para o vídeo todo |
| Contas, histórico e projetos salvos | v1 é sem cadastro |
| Colaboração (várias pessoas no mesmo projeto) | Depende de contas |
| Publicação direta nas redes sociais | v1 entrega o arquivo para download |
| Personalização avançada da legenda (fontes, cores livres, animações) | Contraria o princípio de poucas opções |
| Ajuste de volume por trecho ou por pessoa | v1 ajusta o vídeo inteiro |
| Inserir imagens, logos, títulos e telas finais | Fora do núcleo "limpar o conteúdo falado" |
| Aviso no celular quando o vídeo fica pronto | v1 não envia notificações; o usuário acompanha na tela ou volta pelo link |

---

## 12. Métricas de sucesso

| Métrica | O que indica | Meta inicial sugerida |
|---|---|---|
| Tempo entre o envio e o download | Se o produto é realmente rápido e simples | Menos de 2× a duração do vídeo |
| % de projetos que chegam à exportação | Se o fluxo é claro e sem atrito | Acima de 60% |
| % de uso do fluxo expresso | Se os padrões são bons o suficiente | Acompanhar, sem meta fixa |
| % de cortes automáticos restaurados | Qualidade da detecção de pausas e hesitações (quanto menor, melhor) | Abaixo de 5% |
| % de sugestões da IA aceitas | Qualidade das sugestões da IA | Acima de 70% |
| Redução média de duração | Quanto "conteúdo ruim" o produto remove | Acompanhar por tipo (Podcast/Aula) |
| % de projetos com vertical exportado | Relevância do formato celular | Acompanhar |
| Taxa de erro na exportação | Confiabilidade | Abaixo de 1% |
| Usuários que voltam com um novo vídeo | Se o produto resolveu a dor | Acompanhar |
