# Minerva PDD Generator

Sistema oficial de geração de documentos PDD (Process Definition Document) da Minerva S.A.

## Estrutura do Projeto

```
minerva-pdd-generator/
├── index.html              # Página principal
├── README.md               # Documentação
└── src/
    ├── css/
    │   └── styles.css      # Estilos da aplicação
    └── js/
        ├── parser.js       # Módulo de análise de texto
        ├── docGenerator.js # Módulo de geração de documento Word
        └── app.js          # Controlador principal
```

## Funcionalidades

### Detecção Automática de Elementos

O sistema detecta automaticamente:

| Elemento | Descrição | Exemplo |
|----------|-----------|---------|
| **Seções Numeradas** | Hierarquia completa | `1.`, `1.1`, `1.2.3`, `6.4.5` |
| **RPAs** | Seções de automação | `RPA 1 - Nome`, `RPA 2: Desc` |
| **Tabelas TAB** | Separadas por TAB | Colunas separadas por TAB |
| **Tabelas Markdown** | Formato `\|` | `\| Col1 \| Col2 \|` |
| **Blocos de Código** | Qualquer linguagem | Python, SQL, Java, YAML... |
| **Diagramas ASCII** | Boxes visuais | `┌──┐ │ │ └──┘` |
| **Campos** | Chave: Valor | `Responsável: João` |
| **Checklists** | ✅ e ❌ | `✅ Aprovado` |
| **Listas** | Bullets e numeração | `- Item`, `1. Item` |

### Linguagens de Código Suportadas

O parser detecta código em 40+ linguagens:

- **Web**: JavaScript, TypeScript, HTML, CSS, SCSS, PHP
- **Backend**: Python, Java, C#, Go, Ruby, Rust, Kotlin, Swift
- **Banco de Dados**: SQL, PL/SQL
- **Config**: YAML, JSON, XML, TOML, INI
- **Shell**: Bash, PowerShell, Batch
- **Outros**: Markdown, Dockerfile, Makefile

### Geração de Documento Word

O documento gerado inclui:

1. **Capa** com logo Minerva, título e data
2. **Sumário** automático com links
3. **Seções** formatadas com hierarquia correta
4. **Tabelas** com headers coloridos e linhas alternadas
5. **Código** com fonte monospace e fundo destacado
6. **Diagramas** preservando layout ASCII
7. **Rodapé** com nome do projeto

## Como Usar

1. Abra `index.html` no navegador
2. Cole o texto do PDD na área de edição
3. Clique em **"Analisar"**
4. Verifique os elementos detectados no painel lateral
5. Ajuste nome do projeto e configurações
6. Clique em **"Gerar Documento Word"**

## Padrões de Detecção

### Código (detectado por)
```
python
Copiar código
def exemplo():
    pass
```

### Tabela com TAB
```
Coluna1[TAB]Coluna2[TAB]Coluna3
Valor1[TAB]Valor2[TAB]Valor3
```

### Diagrama ASCII
```
┌─────────────────────┐
│   COMPONENTE        │
└─────────────────────┘
```

## Tecnologias

- HTML5, CSS3, JavaScript ES6+
- [docx.js](https://docx.js.org/) - Geração de documentos Word
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/) - Download de arquivos
- [Google Fonts](https://fonts.google.com/) - Inter + JetBrains Mono

## Compatibilidade

- Chrome 80+
- Firefox 75+
- Edge 80+
- Safari 13+

## Desenvolvimento

O projeto é modular e fácil de estender:

- **parser.js**: Adicione novos padrões de detecção
- **docGenerator.js**: Customize formatação do Word
- **styles.css**: Ajuste visual da interface
- **app.js**: Modifique fluxo da aplicação

---

Desenvolvido para Minerva S.A. | 2026
