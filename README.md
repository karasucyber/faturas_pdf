# faturas-pdf

Projeto simples para leitura de faturas em PDF com apoio de LLM, extraindo os principais campos do documento e consolidando o resultado em arquivos tabulares.

## O que este projeto faz

O objetivo deste projeto e automatizar o processo de leitura de faturas em PDF. O fluxo atual:

1. Le os arquivos PDF de uma pasta local.
2. Extrai o texto bruto de cada documento com `pdfplumber`.
3. Envia esse conteudo para uma crew do CrewAI, pensada para identificar os dados importantes da fatura.
4. Converte o retorno em JSON estruturado.
5. Salva os dados em um arquivo `base_faturas.csv`.
6. Gera uma planilha Excel consolidada em `outputs/faturas_consolidadas.xlsx`.

Os campos extraidos hoje sao:

- `empresa`
- `cnpj`
- `emissao`
- `vencimento`
- `valor`
- `descricao`
- `arquivo`

## Ideia do projeto

Esse projeto foi pensado para usar um modelo de linguagem para interpretar faturas que nem sempre seguem o mesmo layout. Em vez de depender apenas de regras fixas por fornecedor, a proposta e usar o modelo para entender o texto extraido do PDF e montar uma estrutura padrao com os dados necessarios para controle financeiro.

Na pratica, ele funciona bem como uma base para:

- organizacao de contas e despesas
- consolidacao de faturas de varios fornecedores
- preparacao de dados para analise financeira
- futura integracao com banco de dados ou dashboard

## Como o fluxo funciona

### 1. Leitura do PDF

O arquivo [src/faturas_pdf/tools/leitor_pdf.py](C:\Users\marqu\Desktop\ProjetoPessoais\faturas_pdf\src\faturas_pdf\tools\leitor_pdf.py) usa `pdfplumber` para extrair o texto das paginas.

### 2. Extracao com CrewAI

A crew esta em [src/faturas_pdf/crew.py](C:\Users\marqu\Desktop\ProjetoPessoais\faturas_pdf\src\faturas_pdf\crew.py) e recebe o texto bruto do PDF como entrada.

As instrucoes do agente e da tarefa ficam em:

- [src/faturas_pdf/config/agents.yaml](C:\Users\marqu\Desktop\ProjetoPessoais\faturas_pdf\src\faturas_pdf\config\agents.yaml)
- [src/faturas_pdf/config/tasks.yaml](C:\Users\marqu\Desktop\ProjetoPessoais\faturas_pdf\src\faturas_pdf\config\tasks.yaml)

Essa etapa tenta identificar os dados mais importantes da fatura e devolver um JSON estrito.

### 3. Persistencia dos dados

O arquivo [main.py](C:\Users\marqu\Desktop\ProjetoPessoais\faturas_pdf\main.py) recebe o retorno da crew, extrai o JSON e salva os registros em `base_faturas.csv`.

### 4. Geracao da planilha

Depois do CSV ser atualizado, o script [scripts/gerar_planilha_faturas.mjs](C:\Users\marqu\Desktop\ProjetoPessoais\faturas_pdf\scripts\gerar_planilha_faturas.mjs) cria uma planilha Excel com:

- aba `Resumo`, com indicadores consolidados
- aba `Faturas`, com os dados completos extraidos

## Estrutura do projeto

```text
faturas_pdf/
├── main.py
├── base_faturas.csv
├── scripts/
│   └── gerar_planilha_faturas.mjs
├── src/
│   └── faturas_pdf/
│       ├── crew.py
│       ├── config/
│       │   ├── agents.yaml
│       │   └── tasks.yaml
│       └── tools/
│           └── leitor_pdf.py
└── outputs/
    └── faturas_consolidadas.xlsx
```

## Requisitos

- Python 3.13+
- `uv` para instalar dependencias
- configuracao funcional do CrewAI
- um modelo LLM configurado no ambiente para a crew processar o texto

As dependencias principais do projeto sao:

- `crewai`
- `pandas`
- `pdfplumber`

## Como rodar

Instale as dependencias:

```bash
uv sync
```

Depois execute:

```bash
python main.py
```

## Caminho atual dos PDFs

No momento, o projeto busca os arquivos PDF nesta pasta fixa dentro do [main.py](C:\Users\SeuUSER\Desktop\faturas_pdf\main.py):

```python
pasta_pdfs = "C:/Users/marqu/Desktop/ProjetoPessoais/teste_faturas"
```

Se quiser usar outra pasta, basta alterar esse valor.

## Saidas geradas

Ao final do processamento, o projeto gera:

- `base_faturas.csv`: base consolidada em formato tabular
- `outputs/faturas_consolidadas.xlsx`: planilha Excel com resumo e detalhamento

## Proximos passos possiveis

Algumas evolucoes naturais para esse projeto seriam:

- permitir configurar a pasta dos PDFs por variavel de ambiente ou argumento
- evitar duplicidade de faturas ja processadas
- salvar direto em banco de dados
- adicionar validacoes para CNPJ, datas e valores
- permitir diferentes prompts para tipos diferentes de fatura
- gerar dashboard ou relatorios a partir da planilha
