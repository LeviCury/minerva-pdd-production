/**
 * MINERVA PDD GENERATOR - Parser Module v2.0
 * Análise INTELIGENTE com detecção semântica de código
 */

const PDDParser = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // PADRÕES DE DETECÇÃO DE CÓDIGO
    // ═══════════════════════════════════════════════════════════════════════════

    // Palavras-chave que indicam código
    const CODE_KEYWORDS = [
        // Funções
        'function', 'def', 'sub', 'end function', 'end sub', 'endfunc',
        'return', 'yield', 'async', 'await', 'lambda',
        // Controle de fluxo
        'if', 'else', 'elif', 'elseif', 'endif', 'end if', 'then',
        'for', 'foreach', 'while', 'do', 'loop', 'next', 'endfor', 'endwhile',
        'switch', 'case', 'default', 'break', 'continue',
        'try', 'catch', 'except', 'finally', 'throw', 'raise',
        // Declarações
        'var', 'let', 'const', 'dim', 'set', 'global', 'local', 'static',
        'class', 'struct', 'interface', 'enum', 'type',
        'import', 'from', 'require', 'include', 'using', 'namespace',
        'public', 'private', 'protected', 'internal',
        // SQL
        'select', 'insert', 'update', 'delete', 'create', 'alter', 'drop',
        'from', 'where', 'join', 'inner', 'left', 'right', 'outer',
        'group by', 'order by', 'having', 'limit', 'offset',
        'index', 'constraint', 'primary key', 'foreign key',
        'table', 'view', 'procedure', 'trigger',
        // Operadores lógicos
        'and', 'or', 'not', 'in', 'is', 'null', 'true', 'false', 'none'
    ];

    // Padrões regex que indicam código
    const CODE_PATTERNS = [
        // Definição de função
        /^(function|def|sub|func)\s+\w+\s*\(/i,
        /^(public|private|protected)?\s*(static\s+)?(function|void|int|string|bool|async)\s+\w+/i,
        /^\w+\s*=\s*function\s*\(/i,
        /^(end\s+)?(function|sub|if|for|while|select|try)/i,
        
        // Atribuição com estruturas
        /^\w+\s*=\s*[\{\[\(]/,
        /^\w+\s*=\s*\{$/,
        /^\w+\s*=\s*\[$/,
        
        // Chamada de função/método
        /^\w+\.\w+\s*\(/,
        /^\w+\s*\([^)]*\)\s*$/,
        /^\s*\w+\([^)]*\)/,
        
        // Return/yield
        /^return\s+/i,
        /^yield\s+/i,
        
        // Controle de fluxo
        /^if\s+.+:/i,
        /^if\s+.+\s+then/i,
        /^(else|elif|elseif)(\s*:|\s+)/i,
        /^for\s+\w+\s+(in|=)/i,
        /^while\s+/i,
        /^try\s*:/i,
        /^(except|catch)\s*/i,
        
        // SQL
        /^(select|insert|update|delete|create|alter|drop)\s+/i,
        /^\s*(from|where|join|and|or|order\s+by|group\s+by)\s+/i,
        /^\s*(inner|left|right|outer)\s+join/i,
        /^\s*values\s*\(/i,
        /^\s*set\s+\w+\s*=/i,
        
        // Dicionário/objeto (chave: valor)
        /^["'][\w\s@\.\-]+["']\s*:\s*["']/,
        /^\s*["'][\w\s@\.\-]+["']\s*:\s*/,
        /^\s*\w+\s*:\s*["']/,
        
        // Array/lista elementos
        /^\s*["'][^"']+["']\s*,?\s*$/,
        
        // Fechamento de estruturas
        /^\s*[\}\]\)]\s*,?\s*$/,
        /^\s*[\}\]\)];?\s*$/,
        
        // Imports
        /^(import|from|require|include|using)\s+/i,
        
        // Comentários
        /^\s*(#|\/\/|--|\/\*|\*|'''|""")/,
        
        // Variáveis com operadores
        /^\w+\s*(==|!=|>=|<=|<>|:=|\+=|-=|\*=|\/=)\s*/,
        /^\w+\s*=\s*.+$/,
        
        // Indentação típica de código
        /^(\t|    ){1,}\w/,
        
        // Print/log
        /^(print|console\.|log|echo|write|debug)\s*\(/i,
        
        // Self/this
        /^(self|this|me)\.\w+/i,
        
        // Decorators
        /^@\w+/,
        
        // Operadores de linha
        /^\s*[\+\-\*\/\%\&\|]\s*\w/
    ];

    // Linguagens conhecidas (para marcador explícito)
    const KNOWN_LANGUAGES = [
        'python', 'sql', 'java', 'javascript', 'typescript', 'csharp', 'c#',
        'vb', 'vbnet', 'vba', 'vbscript', 'powershell', 'bash', 'shell',
        'php', 'ruby', 'go', 'rust', 'kotlin', 'swift', 'scala', 'perl',
        'r', 'matlab', 'lua', 'dart', 'groovy', 'yaml', 'json', 'xml',
        'html', 'css', 'scss', 'less', 'markdown', 'dockerfile', 'makefile',
        'batch', 'cmd', 'text', 'plaintext', 'pseudocode', 'pseudocódigo'
    ];

    const CODE_MARKERS = ['copiar código', 'copiar codigo', 'copy code', 'executar código', 'executar codigo'];

    // ═══════════════════════════════════════════════════════════════════════════
    // ANÁLISE DE LINHA
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Calcula score de "código" para uma linha
     * Quanto maior o score, mais provável ser código
     */
    function getCodeScore(line) {
        const trimmed = line.trim();
        const lower = trimmed.toLowerCase();
        
        if (!trimmed) return 0;
        
        let score = 0;

        // Padrões regex (+3 cada)
        for (const pattern of CODE_PATTERNS) {
            if (pattern.test(trimmed) || pattern.test(lower)) {
                score += 3;
            }
        }

        // Palavras-chave no início da linha (+2)
        for (const keyword of CODE_KEYWORDS) {
            const regex = new RegExp(`^${keyword}\\b`, 'i');
            if (regex.test(lower)) {
                score += 2;
                break;
            }
        }

        // Características de código
        if (/[{}\[\]();]/.test(trimmed)) score += 1;  // Brackets
        if (/\w+\s*\(/.test(trimmed)) score += 1;     // Chamada de função
        if (/^\s{2,}/.test(line)) score += 1;         // Indentação
        if (/^[\t]/.test(line)) score += 1;           // Tab no início
        if (/["'].*["']/.test(trimmed)) score += 0.5; // Strings
        if (/\w+\s*=\s*\w+/.test(trimmed)) score += 1; // Atribuição simples
        if (/\.\w+\(/.test(trimmed)) score += 2;      // Método
        if (/_\w+/.test(trimmed)) score += 0.5;       // Underscore (snake_case)
        if (/[A-Z][a-z]+[A-Z]/.test(trimmed)) score += 0.5; // CamelCase
        if (/^\s*#/.test(trimmed)) score += 2;        // Comentário Python
        if (/^\s*\/\//.test(trimmed)) score += 2;     // Comentário JS
        if (/^\s*--/.test(trimmed)) score += 2;       // Comentário SQL
        if (/\bNULL\b|\bNone\b|\bnil\b/i.test(trimmed)) score += 1;
        if (/\bTRUE\b|\bFALSE\b/i.test(trimmed)) score += 1;

        // Penalidades para texto natural
        if (trimmed.length > 100 && !/[{}\[\]();=]/.test(trimmed)) score -= 2; // Linha muito longa sem símbolos
        if (/^[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ\s]{5,}$/.test(trimmed) && trimmed.length < 60) score -= 3; // Título em maiúsculas
        if (/^\d+(\.\d+)*\s+[A-Z]/.test(trimmed)) score -= 3; // Seção numerada
        if (/^(Responsável|Autor|Data|Versão|Status|Nome|Email|Área):/i.test(trimmed)) score -= 3; // Campo
        if (/^(RPA\s*\d+|Objetivo|Escopo|Requisitos|Benefícios)/i.test(trimmed)) score -= 3; // Seção PDD

        return score;
    }

    /**
     * Determina se uma linha é código
     */
    function isCodeLine(line, context = {}) {
        const score = getCodeScore(line);
        const trimmed = line.trim();
        
        // Score alto = definitivamente código
        if (score >= 3) return true;
        
        // Se estamos dentro de um bloco de código, ser mais permissivo
        if (context.inCodeBlock && score >= 0) {
            // Verificar se não é claramente um título/seção
            if (/^\d+(\.\d+)*\s+[A-Z]/.test(trimmed)) return false;
            if (/^[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ\s]{10,}$/.test(trimmed) && !/[_=(){}\[\]]/.test(trimmed)) return false;
            if (/^(RPA\s*\d+)/i.test(trimmed)) return false;
            return true;
        }
        
        return score >= 2;
    }

    /**
     * Detecta a linguagem do código pelo conteúdo
     */
    function detectLanguage(codeLines) {
        const code = codeLines.join('\n').toLowerCase();
        
        // SQL
        if (/\b(select|insert|update|delete)\s+.*(from|into|set)/i.test(code)) return 'sql';
        if (/\b(create|alter|drop)\s+(table|index|view|procedure)/i.test(code)) return 'sql';
        
        // Python
        if (/\bdef\s+\w+\s*\(.*\)\s*:/i.test(code)) return 'python';
        if (/\bclass\s+\w+.*:/i.test(code)) return 'python';
        if (/\bimport\s+\w+|\bfrom\s+\w+\s+import/i.test(code)) return 'python';
        if (/\bself\.\w+/i.test(code)) return 'python';
        if (/\belif\b|\bexcept\b/i.test(code)) return 'python';
        
        // VBA/VBScript/VB
        if (/\b(function|sub)\s+\w+\s*\(/i.test(code) && /\bend\s+(function|sub)/i.test(code)) return 'vba';
        if (/\bdim\s+\w+/i.test(code)) return 'vba';
        
        // JavaScript/TypeScript
        if (/\bfunction\s+\w+\s*\(|\bconst\s+\w+\s*=|\blet\s+\w+\s*=/i.test(code)) return 'javascript';
        if (/\bconsole\.(log|error|warn)/i.test(code)) return 'javascript';
        if (/=>\s*{/i.test(code)) return 'javascript';
        
        // Java/C#
        if (/\b(public|private)\s+(static\s+)?(void|int|string|bool)/i.test(code)) return 'java';
        
        // PowerShell
        if (/\$\w+\s*=/i.test(code)) return 'powershell';
        if (/\bGet-\w+|\bSet-\w+/i.test(code)) return 'powershell';
        
        // YAML
        if (/^\s*\w+:\s*$/m.test(code) && /^\s+-\s+\w+/m.test(code)) return 'yaml';
        
        // JSON
        if (/^\s*\{[\s\S]*"[\w]+":\s*["\d\[\{]/m.test(code)) return 'json';
        
        // Bash
        if (/^#!\/bin\/(bash|sh)/m.test(code)) return 'bash';
        if (/\becho\s+|\bexport\s+/i.test(code)) return 'bash';
        
        return 'pseudocode';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FUNÇÕES AUXILIARES
    // ═══════════════════════════════════════════════════════════════════════════

    function countTabs(line) {
        return (line.match(/\t/g) || []).length;
    }

    function isUpperCase(text) {
        const cleaned = text.replace(/[^a-zA-ZÀ-ÿ]/g, '');
        return cleaned.length > 2 && cleaned === cleaned.toUpperCase();
    }

    function hasBoxCharacters(text) {
        return /[┌┐└┘│├┤┬┴┼─═║╔╗╚╝╠╣╦╩╬▼▲►◄→←↑↓]/.test(text);
    }

    function isTableLine(line) {
        return countTabs(line) >= 2 || /^\|.*\|$/.test(line.trim());
    }

    function isSectionHeader(line) {
        const trimmed = line.trim();
        
        // Seção numerada (1., 1.1, 6.4.5)
        if (/^\d+(\.\d+)*\.?\s+[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ]/.test(trimmed)) return true;
        
        // RPA
        if (/^RPA\s*\d+/i.test(trimmed)) return true;
        
        // Título em maiúsculas (mas não código)
        if (isUpperCase(trimmed) && 
            trimmed.length > 5 && 
            trimmed.length < 80 &&
            !/[_=(){}\[\];]/.test(trimmed) &&
            !/^(RETURN|END|FUNCTION|SELECT|INSERT|UPDATE|DELETE|CREATE|IF|ELSE|FOR|WHILE)/i.test(trimmed)) {
            return true;
        }
        
        // Markdown headers
        if (/^#{1,3}\s+\w/.test(trimmed)) return true;
        
        return false;
    }

    function isFieldLine(line) {
        const trimmed = line.trim();
        const fieldPattern = /^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-_\/\(\)]{1,40}):\s+[^{=\[\(]/;
        const match = trimmed.match(fieldPattern);
        
        if (match) {
            const key = match[1].toLowerCase();
            const fieldKeywords = [
                'responsável', 'responsavel', 'autor', 'data', 'versão', 'versao',
                'status', 'prioridade', 'nome', 'email', 'e-mail', 'área', 'area',
                'empresa', 'sponsor', 'gerente', 'líder', 'lider', 'tipo', 'vm',
                'banco', 'tecnologia', 'duração', 'duracao', 'trigger', 'projeto',
                'cliente', 'sistema', 'módulo', 'modulo', 'descrição', 'descricao',
                'frequência', 'frequencia', 'objetivo', 'meta', 'impacto', 'ganho',
                'papel', 'input', 'output', 'categoria', 'severidade', 'fornecedor'
            ];
            return fieldKeywords.some(kw => key.includes(kw));
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PARSER PRINCIPAL - ANÁLISE EM MÚLTIPLAS PASSADAS
    // ═══════════════════════════════════════════════════════════════════════════

    function parse(text) {
        const lines = text.split('\n');
        const n = lines.length;
        
        // ═══════════════════════════════════════════════════════════════
        // PASSADA 1: Classificar cada linha
        // ═══════════════════════════════════════════════════════════════
        const lineTypes = new Array(n).fill(null);
        const codeScores = lines.map(l => getCodeScore(l));
        
        for (let i = 0; i < n; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            if (!trimmed) {
                lineTypes[i] = 'empty';
                continue;
            }
            
            // Verificar marcador explícito de linguagem
            const lowerTrimmed = trimmed.toLowerCase();
            if (KNOWN_LANGUAGES.includes(lowerTrimmed)) {
                if (i + 1 < n && CODE_MARKERS.some(m => lines[i + 1].toLowerCase().includes(m))) {
                    lineTypes[i] = 'code_marker';
                    lineTypes[i + 1] = 'code_marker';
                    continue;
                }
            }
            if (CODE_MARKERS.some(m => lowerTrimmed.includes(m))) {
                lineTypes[i] = 'code_marker';
                continue;
            }
            
            // Diagrama ASCII
            if (hasBoxCharacters(trimmed)) {
                lineTypes[i] = 'ascii';
                continue;
            }
            
            // Tabela
            if (isTableLine(line)) {
                lineTypes[i] = 'table';
                continue;
            }
            
            // Separador
            if (/^[═─\-\*_]{5,}$/.test(trimmed)) {
                lineTypes[i] = 'separator';
                continue;
            }
            
            // Checklist
            if (/^[✅✓☑✔]/.test(trimmed)) {
                lineTypes[i] = 'check_yes';
                continue;
            }
            if (/^[❌✗☐✘]/.test(trimmed)) {
                lineTypes[i] = 'check_no';
                continue;
            }
            
            // Seção/Título (verificar ANTES de código para não confundir)
            if (isSectionHeader(trimmed) && codeScores[i] < 2) {
                lineTypes[i] = 'section';
                continue;
            }
            
            // Campo: Valor
            if (isFieldLine(line) && codeScores[i] < 2) {
                lineTypes[i] = 'field';
                continue;
            }
            
            // Lista bullet
            if (/^[\-\*\•\◦\▪\▸\▹]\s/.test(trimmed) && codeScores[i] < 2) {
                lineTypes[i] = 'bullet';
                continue;
            }
            
            // Não classificado ainda
            lineTypes[i] = 'unknown';
        }
        
        // ═══════════════════════════════════════════════════════════════
        // PASSADA 2: Detectar blocos de código
        // ═══════════════════════════════════════════════════════════════
        
        // Primeiro, propagar código a partir de marcadores explícitos
        for (let i = 0; i < n; i++) {
            if (lineTypes[i] === 'code_marker') {
                // Marcar linhas seguintes como código até encontrar seção
                let j = i + 1;
                while (j < n && lineTypes[j] === 'code_marker') j++; // Pular marcadores
                
                while (j < n) {
                    if (lineTypes[j] === 'section' || lineTypes[j] === 'separator') break;
                    if (lineTypes[j] === 'empty') {
                        // Verificar se próxima não-vazia é código
                        let k = j + 1;
                        while (k < n && lineTypes[k] === 'empty') k++;
                        if (k < n && (lineTypes[k] === 'section' || codeScores[k] < 0)) break;
                    }
                    if (lineTypes[j] === 'unknown' || lineTypes[j] === 'empty') {
                        lineTypes[j] = 'code';
                    }
                    j++;
                }
            }
        }
        
        // Detectar blocos de código pelo score
        for (let i = 0; i < n; i++) {
            if (lineTypes[i] !== 'unknown') continue;
            
            // Se tem score alto, é código
            if (codeScores[i] >= 3) {
                lineTypes[i] = 'code';
                
                // Propagar para linhas adjacentes com score moderado
                // Para trás
                let j = i - 1;
                while (j >= 0 && (lineTypes[j] === 'unknown' || lineTypes[j] === 'empty')) {
                    if (lineTypes[j] === 'unknown' && codeScores[j] >= 1) {
                        lineTypes[j] = 'code';
                    } else if (lineTypes[j] === 'empty') {
                        // Linha vazia entre código = ainda código
                    } else {
                        break;
                    }
                    j--;
                }
                
                // Para frente
                j = i + 1;
                while (j < n && (lineTypes[j] === 'unknown' || lineTypes[j] === 'empty')) {
                    if (lineTypes[j] === 'unknown' && codeScores[j] >= 1) {
                        lineTypes[j] = 'code';
                    } else if (lineTypes[j] === 'empty') {
                        // Verificar se próxima linha é código
                        let k = j + 1;
                        while (k < n && lines[k].trim() === '') k++;
                        if (k < n && lineTypes[k] !== 'code' && codeScores[k] < 2) break;
                    } else {
                        break;
                    }
                    j++;
                }
            }
        }
        
        // Classificar linhas restantes
        for (let i = 0; i < n; i++) {
            if (lineTypes[i] === 'unknown') {
                const trimmed = lines[i].trim();
                
                // Lista numerada
                if (/^(\d+|[a-z])[\.\)]\s+.+/i.test(trimmed) && trimmed.length < 200) {
                    lineTypes[i] = 'numbered';
                } else if (trimmed.length > 15) {
                    lineTypes[i] = 'paragraph';
                } else {
                    lineTypes[i] = 'paragraph';
                }
            }
        }
        
        // ═══════════════════════════════════════════════════════════════
        // PASSADA 3: Agrupar e gerar elementos
        // ═══════════════════════════════════════════════════════════════
        
        const elements = [];
        let i = 0;
        
        while (i < n) {
            const type = lineTypes[i];
            const line = lines[i];
            const trimmed = line.trim();
            
            if (type === 'empty' || type === 'code_marker') {
                i++;
                continue;
            }
            
            // ─────────────────────────────────────────────────────────────
            // CÓDIGO: Agrupar linhas consecutivas
            // ─────────────────────────────────────────────────────────────
            if (type === 'code') {
                const codeLines = [];
                while (i < n && (lineTypes[i] === 'code' || lineTypes[i] === 'empty' || lineTypes[i] === 'code_marker')) {
                    if (lineTypes[i] !== 'code_marker') {
                        codeLines.push(lines[i]);
                    }
                    i++;
                }
                
                // Limpar linhas vazias do início e fim
                while (codeLines.length && !codeLines[0].trim()) codeLines.shift();
                while (codeLines.length && !codeLines[codeLines.length - 1].trim()) codeLines.pop();
                
                if (codeLines.length > 0) {
                    elements.push({
                        type: 'code',
                        language: detectLanguage(codeLines),
                        content: codeLines.join('\n')
                    });
                }
                continue;
            }
            
            // ─────────────────────────────────────────────────────────────
            // DIAGRAMA ASCII: Agrupar linhas consecutivas
            // ─────────────────────────────────────────────────────────────
            if (type === 'ascii') {
                const asciiLines = [];
                while (i < n && (lineTypes[i] === 'ascii' || (lineTypes[i] === 'empty' && i + 1 < n && lineTypes[i + 1] === 'ascii'))) {
                    asciiLines.push(lines[i]);
                    i++;
                }
                elements.push({
                    type: 'ascii_diagram',
                    content: asciiLines.join('\n')
                });
                continue;
            }
            
            // ─────────────────────────────────────────────────────────────
            // TABELA: Agrupar linhas consecutivas
            // ─────────────────────────────────────────────────────────────
            if (type === 'table') {
                const tableLines = [];
                while (i < n && lineTypes[i] === 'table') {
                    tableLines.push(lines[i]);
                    i++;
                }
                
                // Parsear tabela
                const table = parseTable(tableLines);
                if (table) {
                    elements.push({
                        type: 'table',
                        headers: table.headers,
                        rows: table.rows
                    });
                }
                continue;
            }
            
            // ─────────────────────────────────────────────────────────────
            // SEÇÃO/TÍTULO
            // ─────────────────────────────────────────────────────────────
            if (type === 'section') {
                const section = parseSection(trimmed);
                elements.push(section);
                i++;
                continue;
            }
            
            // ─────────────────────────────────────────────────────────────
            // CAMPO: VALOR
            // ─────────────────────────────────────────────────────────────
            if (type === 'field') {
                const match = trimmed.match(/^([^:]+):\s*(.+)$/);
                if (match) {
                    elements.push({
                        type: 'field',
                        key: match[1].trim(),
                        value: match[2].trim()
                    });
                }
                i++;
                continue;
            }
            
            // ─────────────────────────────────────────────────────────────
            // OUTROS TIPOS
            // ─────────────────────────────────────────────────────────────
            if (type === 'separator') {
                elements.push({ type: 'separator' });
                i++;
                continue;
            }
            
            if (type === 'check_yes') {
                elements.push({ type: 'checklist_yes', content: trimmed.replace(/^[✅✓☑✔]\s*/, '') });
                i++;
                continue;
            }
            
            if (type === 'check_no') {
                elements.push({ type: 'checklist_no', content: trimmed.replace(/^[❌✗☐✘]\s*/, '') });
                i++;
                continue;
            }
            
            if (type === 'bullet') {
                elements.push({ type: 'bullet', content: trimmed.replace(/^[\-\*\•\◦\▪\▸\▹]\s*/, '') });
                i++;
                continue;
            }
            
            if (type === 'numbered') {
                const match = trimmed.match(/^(\d+|[a-z])[\.\)]\s*(.+)/i);
                if (match) {
                    elements.push({ type: 'numbered', number: match[1], content: match[2] });
                }
                i++;
                continue;
            }
            
            if (type === 'paragraph' && trimmed.length > 0) {
                elements.push({ type: 'paragraph', content: trimmed });
            }
            
            i++;
        }
        
        return elements;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PARSERS AUXILIARES
    // ═══════════════════════════════════════════════════════════════════════════

    function parseSection(line) {
        // RPA
        const rpaMatch = line.match(/^RPA\s*(\d+)\s*[\:\-\–]?\s*(.*)/i);
        if (rpaMatch) {
            return {
                type: 'rpa',
                number: rpaMatch[1],
                title: rpaMatch[2] || '',
                fullTitle: line
            };
        }
        
        // Seção numerada
        const numMatch = line.match(/^(\d+(?:\.\d+)*)\s*[\.\-\):]?\s*(.+)/);
        if (numMatch) {
            const depth = numMatch[1].split('.').length;
            let type = 'h3';
            if (depth === 1) type = 'h1';
            else if (depth === 2) type = 'h2';
            
            return {
                type: type,
                number: numMatch[1],
                title: numMatch[2].trim(),
                fullTitle: `${numMatch[1]}. ${numMatch[2].trim()}`
            };
        }
        
        // Markdown
        if (line.startsWith('###')) {
            return { type: 'h3', title: line.replace(/^###\s*/, ''), fullTitle: line.replace(/^###\s*/, '') };
        }
        if (line.startsWith('##')) {
            return { type: 'h2', title: line.replace(/^##\s*/, ''), fullTitle: line.replace(/^##\s*/, '') };
        }
        if (line.startsWith('#')) {
            return { type: 'h1', title: line.replace(/^#\s*/, ''), fullTitle: line.replace(/^#\s*/, '') };
        }
        
        // Título em maiúsculas ou keyword
        return {
            type: 'h1',
            title: line,
            fullTitle: line
        };
    }

    function parseTable(tableLines) {
        if (tableLines.length < 2) return null;
        
        // Detectar se é Markdown ou TAB
        const isMarkdown = tableLines.some(l => /^\|.*\|$/.test(l.trim()));
        
        let rows = [];
        
        if (isMarkdown) {
            tableLines.forEach(line => {
                const trimmed = line.trim();
                if (/^[\|\-\:]+$/.test(trimmed.replace(/\s/g, ''))) return; // Linha separadora
                const cells = trimmed.split('|').map(c => c.trim()).filter(c => c);
                if (cells.length > 0) rows.push(cells);
            });
        } else {
            // TAB separated
            tableLines.forEach(line => {
                if (line.trim()) {
                    const cells = line.split('\t').map(c => c.trim());
                    if (cells.some(c => c !== '')) rows.push(cells);
                }
            });
        }
        
        if (rows.length < 2) return null;
        
        // Normalizar colunas
        const maxCols = Math.max(...rows.map(r => r.length));
        rows.forEach(row => {
            while (row.length < maxCols) row.push('');
        });
        
        return {
            headers: rows[0],
            rows: rows.slice(1)
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // API PÚBLICA
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        parse: parse,
        getCodeScore: getCodeScore,
        isCodeLine: isCodeLine,
        detectLanguage: detectLanguage
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDDParser;
}
