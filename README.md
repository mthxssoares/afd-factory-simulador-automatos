# AFD Factory — Fábrica de Robôs

**Protótipo didático de Linguagens Formais e Autômatos — Braz Cubas**

Uma fábrica automatizada fictícia recebe robôs com códigos binários. Cada robô passa por uma esteira de inspeção e é **aprovado somente se seu código termina em `01`**. O processamento é feito por um Autômato Finito Determinístico (AFD), com visualização das transições e resultados.

## Como abrir no VS Code

1. Descompacte `AFD-Factory-Prototipo.zip`.
2. Abra a pasta `afd-factory` no **Visual Studio Code** (Arquivo > Abrir Pasta).
3. Abra `index.html` no seu navegador (duplo clique no arquivo no Explorador de Arquivos também funciona).
4. Opcional: instale a extensão **Live Server** no VS Code e use **Open with Live Server** para atualizar a página automaticamente enquanto edita.

**Não é necessário instalar Node.js, dependências, banco de dados ou executar comandos.** A aplicação usa apenas HTML, CSS, JavaScript e SVG. Fonte web opcional; se estiver sem internet, usará fontes locais.

## Funcionalidades

- Interface de fábrica futurista, com robô, esteira animada, braços mecânicos e scanner.
- Campo para inserir qualquer código contendo 1 a 24 símbolos (`0` e `1`).
- Exemplos rápidos de cadeias aceitas e rejeitadas.
- Execução **automática** com três velocidades e execução **passo a passo**.
- Diagrama do AFD com realce do estado atual e da última transição.
- Tabela de transições destacando a linha do estado atual.
- Indicador visual **ACEITA / REJEITA** e deslocamento do robô na esteira.
- Painel de desempenho com contagem de aprovados e rejeitados.
- Bateria de 10 testes baseada nos exemplos do enunciado.
- Histórico da sessão e exportação CSV para evidências do relatório.
- Layout responsivo para notebook, computador e celular.

## Fundamentação: o AFD

Linguagem: `L = { w ∈ {0,1}* | w termina em 01 }`

Definição formal: `M = (Q, Σ, δ, q₀, F)`

- `Q = {q₀, q₁, q₂}`
- `Σ = {0, 1}`
- `q₀`: estado inicial
- `F = {q₂}`: conjunto dos estados de aceitação
- `δ`: função de transição definida pela tabela abaixo

| Estado | Lê 0 | Lê 1 |
|---|---|---|
| → q₀ | q₁ | q₀ |
| q₁ | q₁ | q₂ |
| ★ q₂ | q₁ | q₀ |

Interpretação: `q₁` indica que o último símbolo lido é `0`. `q₂` indica que o sufixo da palavra lida é `01`. `q₀` indica que nenhum desses dois sufixos está presente. **Somente o estado após o consumo de toda a entrada determina a aceitação**.

### Exemplo de simulação

Código `1101`:

`q₀ --1--> q₀ --1--> q₀ --0--> q₁ --1--> q₂` → **ACEITA**.

Código `1010`:

`q₀ --1--> q₀ --0--> q₁ --1--> q₂ --0--> q₁` → **REJEITA**.

### Testes do enunciado

| Aceitos | Rejeitados |
|---|---|
| 01 | 0 |
| 101 | 1 |
| 001 | 10 |
| 1101 | 11 |
| 00001 | 100 |

## Estrutura dos arquivos

```text
afd-factory/
├── index.html      # Interface completa e diagrama SVG
├── styles.css      # Layout, animações e responsividade
├── script.js       # Transições do AFD, simulador, estatísticas e testes
├── README.md       # Este guia
└── DOCUMENTACAO.md # Texto-base de apoio ao relatório
```

## Como demonstrar ao professor

1. Abra a fábrica e explique que cada robô recebe uma palavra do alfabeto `{0,1}`.
2. Selecione `1101` e clique em **PASSO A PASSO** quatro vezes.
3. A cada símbolo, mostre o estado atual no diagrama e na tabela de transição.
4. Demonstre que o robô é aprovado porque terminou em `q₂`.
5. Selecione `1010` e repita: a palavra passa por `q₂`, mas termina em `q₁`, então é rejeitada.
6. Execute **10 TESTES** e apresente o painel de desempenho e o histórico; exporte os dados para o relatório, se desejar.

## Aviso sobre o enunciado

O documento do professor solicita um **protótipo físico ou visual** e diz que **não é necessário programar**, além de requerer relatório simplificado. Este projeto é uma **implementação digital interativa adicional**, realizada em VS Code. Confirmem com o professor se a execução em navegador pode ser entregue como protótipo, ou utilizem as telas/diagrama como referência para um painel visual com simulação manual.

## Créditos da equipe (preencher na apresentação)

Gabriel Anastácio Pereira; Karen Gabrielle Justino; Marcos Antônio da Silva Souza; Matheus Silva Soares; Miguel da Silva Pereira.

Projeto acadêmico, sem dependências externas de execução.
