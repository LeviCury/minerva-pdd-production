/**
 * MINERVA PDD GENERATOR - Main Application v2.0
 * Sistema inteligente de construção de PDD
 */

const App = (function() {
    'use strict';

    // Estado da aplicação
    let state = {
        apiKey: '',
        rawText: '',
        pddData: null,
        isAnalyzing: false
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        // Carregar API key salva
        state.apiKey = localStorage.getItem('minerva_openai_key') || '';
        if (state.apiKey) {
            const input = document.getElementById('apiKey');
            if (input) input.value = state.apiKey;
            showApiStatus(true);
        }

        // Event listeners
        document.getElementById('projectText')?.addEventListener('input', updateStats);
        document.getElementById('apiKey')?.addEventListener('change', saveApiKey);
        
        updateStats();
        console.log('Minerva PDD Generator v2.0 initialized');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // API KEY MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    function saveApiKey() {
        const key = document.getElementById('apiKey')?.value?.trim() || '';
        state.apiKey = key;
        if (key) {
            localStorage.setItem('minerva_openai_key', key);
            showApiStatus(true);
            showToast('API Key salva!', 'success');
        } else {
            localStorage.removeItem('minerva_openai_key');
            showApiStatus(false);
        }
    }

    function showApiStatus(connected) {
        const indicator = document.getElementById('apiStatus');
        if (indicator) {
            indicator.className = `api-status ${connected ? 'connected' : ''}`;
            indicator.title = connected ? 'IA Conectada' : 'IA Desconectada';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UI HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = `toast show ${type}`;
            setTimeout(() => toast.classList.remove('show'), 3500);
        }
    }

    function showLoading(title, subtitle) {
        const loading = document.getElementById('loading');
        const titleEl = document.getElementById('loadingTitle');
        const subtitleEl = document.getElementById('loadingSubtitle');
        
        if (titleEl) titleEl.textContent = title;
        if (subtitleEl) subtitleEl.textContent = subtitle;
        if (loading) loading.classList.add('active');
    }

    function hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.remove('active');
    }

    function updateStats() {
        const text = document.getElementById('projectText')?.value || '';
        const chars = text.length;
        const words = text.split(/\s+/).filter(w => w).length;

        const charCount = document.getElementById('charCount');
        const wordCount = document.getElementById('wordCount');
        
        if (charCount) charCount.textContent = `${chars.toLocaleString()} caracteres`;
        if (wordCount) wordCount.textContent = `${words.toLocaleString()} palavras`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ANÁLISE COM IA
    // ═══════════════════════════════════════════════════════════════════════════

    async function analyzeProject() {
        const text = document.getElementById('projectText')?.value?.trim();
        
        if (!text) {
            showToast('Cole a descrição do projeto primeiro', 'error');
            return;
        }

        if (text.length < 50) {
            showToast('Texto muito curto. Descreva melhor o projeto.', 'error');
            return;
        }

        if (!state.apiKey) {
            showToast('Configure a API Key primeiro', 'error');
            document.getElementById('apiKey')?.focus();
            return;
        }

        state.rawText = text;
        state.isAnalyzing = true;
        
        showLoading('Analisando com IA', 'Extraindo informações do projeto...');

        try {
            const pddData = await AIAnalyzer.analyze(text, state.apiKey);
            state.pddData = pddData;
            
            hideLoading();
            showToast('Análise concluída! Revise os dados extraídos.', 'success');
            
            // Mostrar formulário de revisão
            showReviewForm(pddData);
            
        } catch (error) {
            console.error('Erro na análise:', error);
            hideLoading();
            showToast(error.message || 'Erro na análise', 'error');
        }
        
        state.isAnalyzing = false;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FORMULÁRIO DE REVISÃO
    // ═══════════════════════════════════════════════════════════════════════════

    function showReviewForm(pddData) {
        const modal = document.getElementById('reviewModal');
        const content = document.getElementById('reviewContent');
        
        if (!modal || !content) return;

        let html = `
            <div class="review-section">
                <h3>📋 Informações do Projeto</h3>
                <div class="review-field">
                    <label>Nome do Projeto</label>
                    <input type="text" id="edit_projeto_nome" value="${escapeHtml(pddData.projeto?.nome || '')}" />
                </div>
                <div class="review-field">
                    <label>Objetivo</label>
                    <textarea id="edit_projeto_objetivo" rows="3">${escapeHtml(pddData.projeto?.objetivo || '')}</textarea>
                </div>
                <div class="review-field">
                    <label>Escopo</label>
                    <textarea id="edit_projeto_escopo" rows="2">${escapeHtml(pddData.projeto?.escopo || '')}</textarea>
                </div>
                <div class="review-field">
                    <label>Benefícios (um por linha)</label>
                    <textarea id="edit_projeto_beneficios" rows="3">${(pddData.projeto?.beneficios || []).join('\n')}</textarea>
                </div>
                <div class="review-field">
                    <label>Sistemas Envolvidos (separados por vírgula)</label>
                    <input type="text" id="edit_projeto_sistemas" value="${(pddData.projeto?.sistemas_envolvidos || []).join(', ')}" />
                </div>
            </div>
        `;

        // RPAs
        if (pddData.rpas?.length > 0) {
            html += `<div class="review-section"><h3>🤖 RPAs Identificados</h3>`;
            
            pddData.rpas.forEach((rpa, i) => {
                html += `
                    <div class="rpa-card">
                        <div class="rpa-header">RPA ${i + 1}</div>
                        <div class="review-field">
                            <label>Nome</label>
                            <input type="text" id="edit_rpa_${i}_nome" value="${escapeHtml(rpa.nome || '')}" />
                        </div>
                        <div class="review-field">
                            <label>Descrição</label>
                            <textarea id="edit_rpa_${i}_descricao" rows="2">${escapeHtml(rpa.descricao || '')}</textarea>
                        </div>
                        <div class="review-row">
                            <div class="review-field">
                                <label>Trigger</label>
                                <input type="text" id="edit_rpa_${i}_trigger" value="${escapeHtml(rpa.trigger || '')}" />
                            </div>
                            <div class="review-field">
                                <label>Frequência</label>
                                <input type="text" id="edit_rpa_${i}_frequencia" value="${escapeHtml(rpa.frequencia || '')}" />
                            </div>
                        </div>
                        <div class="review-field">
                            <label>Input (separados por vírgula)</label>
                            <input type="text" id="edit_rpa_${i}_input" value="${(rpa.input || []).join(', ')}" />
                        </div>
                        <div class="review-field">
                            <label>Output (separados por vírgula)</label>
                            <input type="text" id="edit_rpa_${i}_output" value="${(rpa.output || []).join(', ')}" />
                        </div>
                        <div class="review-field">
                            <label>Passos do Fluxo (um por linha)</label>
                            <textarea id="edit_rpa_${i}_passos" rows="4">${(rpa.passos || []).join('\n')}</textarea>
                        </div>
                        <div class="review-field">
                            <label>Exceções (uma por linha)</label>
                            <textarea id="edit_rpa_${i}_excecoes" rows="2">${(rpa.excecoes || []).join('\n')}</textarea>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }

        // Infraestrutura
        html += `
            <div class="review-section">
                <h3>🖥️ Infraestrutura</h3>
                <div class="review-field">
                    <label>Servidores (formato: SERVIDOR - Função, um por linha)</label>
                    <textarea id="edit_infra_servidores" rows="3">${(pddData.infraestrutura?.servidores || []).map(s => `${s.nome} - ${s.funcao}`).join('\n')}</textarea>
                </div>
                <div class="review-field">
                    <label>Bancos de Dados (formato: banco@SERVIDOR - Função, um por linha)</label>
                    <textarea id="edit_infra_bancos" rows="3">${(pddData.infraestrutura?.bancos_dados || []).map(b => `${b.nome}@${b.servidor} - ${b.funcao}`).join('\n')}</textarea>
                </div>
                <div class="review-field">
                    <label>Tecnologias (separadas por vírgula)</label>
                    <input type="text" id="edit_infra_tecnologias" value="${(pddData.infraestrutura?.tecnologias || []).join(', ')}" />
                </div>
            </div>
        `;

        // Stakeholders
        html += `
            <div class="review-section">
                <h3>👥 Stakeholders</h3>
                <div class="review-row">
                    <div class="review-field">
                        <label>Sponsor</label>
                        <input type="text" id="edit_stake_sponsor" value="${escapeHtml(pddData.stakeholders?.sponsor || '')}" />
                    </div>
                    <div class="review-field">
                        <label>Responsável Negócio</label>
                        <input type="text" id="edit_stake_negocio" value="${escapeHtml(pddData.stakeholders?.responsavel_negocio || '')}" />
                    </div>
                    <div class="review-field">
                        <label>Responsável Técnico</label>
                        <input type="text" id="edit_stake_tecnico" value="${escapeHtml(pddData.stakeholders?.responsavel_tecnico || '')}" />
                    </div>
                </div>
            </div>
        `;

        // Riscos
        html += `
            <div class="review-section">
                <h3>⚠️ Riscos (formato: Risco | Mitigação, um por linha)</h3>
                <textarea id="edit_riscos" rows="4">${(pddData.riscos || []).map(r => `${r.risco} | ${r.mitigacao}`).join('\n')}</textarea>
            </div>
        `;

        // Observações
        html += `
            <div class="review-section">
                <h3>📝 Observações</h3>
                <textarea id="edit_observacoes" rows="3">${escapeHtml(pddData.observacoes || '')}</textarea>
            </div>
        `;

        content.innerHTML = html;
        modal.classList.add('active');
    }

    function closeReview() {
        document.getElementById('reviewModal')?.classList.remove('active');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COLETA DE DADOS DO FORMULÁRIO
    // ═══════════════════════════════════════════════════════════════════════════

    function collectFormData() {
        const getValue = (id) => document.getElementById(id)?.value?.trim() || '';
        const getArray = (id) => getValue(id).split('\n').map(s => s.trim()).filter(s => s);
        const getCommaArray = (id) => getValue(id).split(',').map(s => s.trim()).filter(s => s);

        const pddData = {
            projeto: {
                nome: getValue('edit_projeto_nome'),
                objetivo: getValue('edit_projeto_objetivo'),
                escopo: getValue('edit_projeto_escopo'),
                beneficios: getArray('edit_projeto_beneficios'),
                sistemas_envolvidos: getCommaArray('edit_projeto_sistemas')
            },
            rpas: [],
            infraestrutura: {
                servidores: [],
                bancos_dados: [],
                tecnologias: getCommaArray('edit_infra_tecnologias')
            },
            stakeholders: {
                sponsor: getValue('edit_stake_sponsor'),
                responsavel_negocio: getValue('edit_stake_negocio'),
                responsavel_tecnico: getValue('edit_stake_tecnico')
            },
            riscos: [],
            observacoes: getValue('edit_observacoes')
        };

        // Coletar RPAs
        let rpaIndex = 0;
        while (document.getElementById(`edit_rpa_${rpaIndex}_nome`)) {
            pddData.rpas.push({
                numero: rpaIndex + 1,
                nome: getValue(`edit_rpa_${rpaIndex}_nome`),
                descricao: getValue(`edit_rpa_${rpaIndex}_descricao`),
                trigger: getValue(`edit_rpa_${rpaIndex}_trigger`),
                frequencia: getValue(`edit_rpa_${rpaIndex}_frequencia`),
                input: getCommaArray(`edit_rpa_${rpaIndex}_input`),
                output: getCommaArray(`edit_rpa_${rpaIndex}_output`),
                passos: getArray(`edit_rpa_${rpaIndex}_passos`),
                excecoes: getArray(`edit_rpa_${rpaIndex}_excecoes`)
            });
            rpaIndex++;
        }

        // Parsear servidores
        getArray('edit_infra_servidores').forEach(line => {
            const parts = line.split('-').map(s => s.trim());
            if (parts.length >= 2) {
                pddData.infraestrutura.servidores.push({
                    nome: parts[0],
                    funcao: parts.slice(1).join(' - ')
                });
            }
        });

        // Parsear bancos
        getArray('edit_infra_bancos').forEach(line => {
            const match = line.match(/^(.+?)@(.+?)\s*-\s*(.+)$/);
            if (match) {
                pddData.infraestrutura.bancos_dados.push({
                    nome: match[1].trim(),
                    servidor: match[2].trim(),
                    funcao: match[3].trim()
                });
            }
        });

        // Parsear riscos
        getArray('edit_riscos').forEach(line => {
            const parts = line.split('|').map(s => s.trim());
            if (parts.length >= 2) {
                pddData.riscos.push({
                    risco: parts[0],
                    mitigacao: parts[1]
                });
            }
        });

        return pddData;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GERAÇÃO DO DOCUMENTO
    // ═══════════════════════════════════════════════════════════════════════════

    async function generateDocument() {
        const pddData = collectFormData();
        
        if (!pddData.projeto.nome) {
            showToast('Informe o nome do projeto', 'error');
            return;
        }

        showLoading('Gerando PDD', 'Criando documento Word profissional...');

        try {
            const doc = PDDBuilder.build(pddData, {
                incluirCapa: true,
                incluirSumario: true,
                incluirCronograma: true,
                incluirRiscos: true
            });

            const blob = await docx.Packer.toBlob(doc);
            
            const fileName = `PDD_${pddData.projeto.nome.replace(/[^a-zA-Z0-9À-ÿ]/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`;
            saveAs(blob, fileName);

            hideLoading();
            closeReview();
            showToast('PDD gerado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar:', error);
            hideLoading();
            showToast('Erro ao gerar documento', 'error');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FUNÇÕES AUXILIARES
    // ═══════════════════════════════════════════════════════════════════════════

    function clearAll() {
        const textArea = document.getElementById('projectText');
        if (textArea) textArea.value = '';
        state.pddData = null;
        state.rawText = '';
        updateStats();
        showToast('Conteúdo limpo', 'info');
    }

    function showHelp() {
        alert(`MINERVA PDD GENERATOR v2.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMO USAR:

1. Configure sua API Key da OpenAI
2. Cole a descrição do seu projeto
3. Clique em "Analisar com IA"
4. Revise e complete as informações extraídas
5. Clique em "Gerar PDD"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O QUE A IA EXTRAI:

• Nome e objetivo do projeto
• Quantidade e detalhes dos RPAs
• Sistemas e bancos de dados
• Fluxos de execução
• Infraestrutura necessária
• Riscos potenciais

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DICAS:

• Quanto mais detalhada a descrição, 
  melhor será a extração
• Mencione nomes de sistemas, 
  servidores e bancos
• Descreva o que cada RPA faz
• Inclua triggers e frequências`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // API PÚBLICA
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        init,
        analyzeProject,
        generateDocument,
        closeReview,
        clearAll,
        showHelp,
        saveApiKey
    };

})();

document.addEventListener('DOMContentLoaded', App.init);
