# 📚 Repositório de Exemplos de PDD

Esta pasta contém exemplos de PDDs aprovados que são usados pelo sistema RAG (Retrieval Augmented Generation) para melhorar a qualidade das análises.

## Como adicionar novos exemplos

### Opção 1: Via Interface (Recomendado)
1. Abra o sistema PDD Generator
2. Clique no botão **📚 Exemplos** no canto superior
3. Clique em **+ Adicionar Exemplo**
4. Cole o texto do PDD ou descrição do projeto
5. O sistema vai extrair automaticamente as informações

### Opção 2: Arquivo JSON Manual
Crie um arquivo `.json` nesta pasta seguindo a estrutura:

```json
{
  "id": "identificador_unico",
  "keywords": ["palavra1", "palavra2", "palavra3"],
  "category": "FINANCEIRO|FISCAL|RH|COMPRAS|GESTAO|OPERACOES",
  "nome": "Nome do Projeto",
  "descricao_original": "Texto original que descreve o projeto...",
  "exemplo": {
    "projeto": {
      "nome": "Nome do Projeto",
      "objetivo": "Objetivo detalhado...",
      "beneficios": {
        "tangiveis": ["Benefício 1", "Benefício 2"],
        "intangiveis": ["Benefício 1", "Benefício 2"]
      }
    },
    "rpas": [{
      "nome": "Nome do RPA",
      "trigger": {
        "tipo": "AGENDAMENTO|MANUAL|EMAIL|EVENTO",
        "frequencia": "Diária/Semanal/etc",
        "volume_estimado": "X transações/dia"
      },
      "fluxo_execucao": [
        "Passo 1",
        "Passo 2",
        "Passo 3"
      ],
      "excecoes": [
        {"cenario": "Cenário de erro", "tratamento": "Como tratar"}
      ]
    }],
    "regras_negocio": [
      {
        "codigo": "RN-001",
        "tipo": "VAL|CALC|REST|INF|ACT|TIME",
        "titulo": "Título da Regra",
        "descricao": "Descrição da regra",
        "logica": "SE condição ENTÃO ação"
      }
    ]
  }
}
```

## Categorias Disponíveis

| Categoria | Descrição | Keywords típicas |
|-----------|-----------|------------------|
| FINANCEIRO | Processos financeiros, tesouraria | banco, conciliação, pagamento, cobrança |
| FISCAL | Notas fiscais, tributação | nfe, xml, sefaz, imposto, fiscal |
| RH | Recursos Humanos, folha | folha, salário, ponto, benefícios |
| COMPRAS | Procurement, fornecedores | compra, pedido, cotação, fornecedor |
| GESTAO | Relatórios, dashboards | relatório, kpi, dashboard, indicador |
| OPERACOES | Processos operacionais | logística, estoque, produção |

## Arquivos de Exemplo

- `conciliacao_bancaria.json` - Exemplo de conciliação
- `entrada_nfe.json` - Exemplo de entrada de NF-e
- `folha_pagamento.json` - Exemplo de processamento de folha

---
*Exemplos armazenados aqui são automaticamente carregados pelo sistema.*
