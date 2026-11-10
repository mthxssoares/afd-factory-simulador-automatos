'use strict';

/**
 * AFD Factory — Protótipo didático, sem frameworks nem servidor.
 * Linguagem reconhecida: L = { w ∈ {0,1}* | w termina em 01 }.
 * M = (Q, Σ, δ, q₀, F), com Q={q₀,q₁,q₂}, Σ={0,1}, F={q₂}.
 * q₀: último símbolo não é 0 e o sufixo 01 ainda não foi formado;
 * q₁: último símbolo lido é 0; q₂: último par de símbolos é 01.
 */
const TRANSITIONS = Object.freeze({
  0: Object.freeze({ '0': 1, '1': 0 }),
  1: Object.freeze({ '0': 1, '1': 2 }),
  2: Object.freeze({ '0': 1, '1': 0 })
});
const INITIAL_STATE = 0;
const FINAL_STATE = 2;
const MAX_LENGTH = 24;
const EXAMPLE_ACCEPTED = ['01', '101', '001', '1101', '00001'];
const EXAMPLE_REJECTED = ['0', '1', '10', '11', '100'];

const $ = id => document.getElementById(id);
const el = {
  input: $('codeInput'), error: $('inputError'), auto: $('autoBtn'), step: $('stepBtn'), reset: $('resetBtn'),
  speed: $('speedSelect'), stage: $('factoryStage'), bottom: $('stageBottomRight'),
  botScreen: $('botScreen'), gate: $('gateResult'), status: $('productionStatus'), statusTag: $('statusTag'),
  count: $('stepCount'), chips: $('sequenceChips'), current: $('currentState'), last: $('lastTransition'),
  final: $('finalStateResult'), total: $('metricTotal'), accepted: $('metricAccepted'),
  rejected: $('metricRejected'), rate: $('metricRate'), rateBar: $('rateBar'),
  batch: $('batchBtn'), batchInfo: $('batchInfo'), history: $('historyBody'), clear: $('clearHistoryBtn'), export: $('exportBtn')
};

let code = '1101';
let currentState = INITIAL_STATE;
let position = 0;
let path = [INITIAL_STATE];
let records = [];
let nextRobotId = 1;
let mode = 'idle'; // idle | reading | accepted | rejected
let busy = false;
let token = 0;
let highlightedTransition = null;

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function isValidCode(value) { return typeof value === 'string' && /^[01]{1,24}$/.test(value); }
function formatState(n) { return `q${['₀','₁','₂'][n]}`; }
function nextState(state, symbol) { return TRANSITIONS[state][symbol]; }
function runPure(word) {
  if (!isValidCode(word)) throw new Error('Cadeia inválida. Use somente 0 e 1 (até 24 símbolos).');
  let s = INITIAL_STATE;
  const states = [s];
  for (const symbol of word) { s = nextState(s, symbol); states.push(s); }
  return { accepted: s === FINAL_STATE, state: s, path: states };
}

function setError(message) {
  el.error.textContent = message || '';
  el.error.hidden = !message;
  el.input.setAttribute('aria-invalid', message ? 'true' : 'false');
}
function codeFromInput() {
  const value = el.input.value.trim();
  if (!value) { setError('Digite um código binário antes de executar.'); return null; }
  if (value.length > MAX_LENGTH) { setError('O código pode conter no máximo 24 símbolos.'); return null; }
  if (!isValidCode(value)) { setError('Código inválido: utilize somente os símbolos 0 e 1.'); return null; }
  setError('');
  return value;
}
function setControls(running) {
  busy = running;
  el.auto.disabled = running;
  el.step.disabled = running;
  el.batch.disabled = running;
  el.input.disabled = running;
  el.speed.disabled = running;
  document.querySelectorAll('[data-code]').forEach(button => { button.disabled = running; });
  // Reiniciar continua disponível para interromper uma execução.
}
function renderChips() {
  el.chips.replaceChildren();
  for (let i = 0; i < code.length; i++) {
    const span = document.createElement('span');
    span.className = 'sequence-chip';
    if (i < position) span.classList.add('read');
    else if (i === position) span.classList.add('current');
    span.textContent = code[i];
    span.setAttribute('aria-label', `Símbolo ${i + 1}: ${code[i]}${i < position ? ', lido' : ', não lido'}`);
    el.chips.append(span);
  }
  el.count.textContent = `${position} / ${code.length} símbolos`;
}
function renderDiagram() {
  for (let s = 0; s < 3; s++) {
    $(`state${s}`).classList.toggle('active', s === currentState);
    $(`tr${s}`).classList.toggle('active', s === currentState);
  }
  document.querySelectorAll('.edge').forEach(edge => {
    edge.classList.toggle('active', !!highlightedTransition &&
      Number(edge.dataset.from) === highlightedTransition.from &&
      edge.dataset.symbol === highlightedTransition.symbol);
  });
  el.current.textContent = formatState(currentState);
  el.last.textContent = highlightedTransition
    ? `${formatState(highlightedTransition.from)} + ${highlightedTransition.symbol} → ${formatState(currentState)}` : '—';
  el.final.textContent = mode === 'accepted' ? 'ACEITA' : mode === 'rejected' ? 'REJEITADA' : 'AGUARDANDO';
}
function renderStage() {
  el.stage.dataset.phase = mode === 'idle' ? 'idle' : 'reading';
  el.stage.dataset.result = mode === 'accepted' ? 'accepted' : mode === 'rejected' ? 'rejected' : 'idle';
  el.botScreen.textContent = code.length > 6 ? `${code.slice(0, 5)}…` : code;
  el.gate.querySelector('.gate-icon').textContent = mode === 'accepted' ? '✓' : mode === 'rejected' ? '×' : '?';
  el.gate.querySelector('.gate-label').textContent = mode === 'accepted' ? 'APROVADO' : mode === 'rejected' ? 'REJEITADO' : 'AGUARDANDO';
  el.bottom.textContent = mode === 'accepted' ? 'DESTINO: APROVAÇÃO' : mode === 'rejected' ? 'DESTINO: DESCARTE' :
    mode === 'reading' ? 'INSPEÇÃO EM ANDAMENTO' : 'AGUARDANDO CÓDIGO';
  el.status.textContent = mode === 'accepted' ? 'ROBÔ APROVADO • SUFIXO 01' :
    mode === 'rejected' ? 'ROBÔ REJEITADO • SUFIXO INVÁLIDO' :
    mode === 'reading' ? 'ANALISANDO CÓDIGO BINÁRIO...' : 'PRONTO PARA INICIAR';
  el.statusTag.className = `status-tag ${mode}`;
  el.statusTag.textContent = mode === 'accepted' ? 'ACEITA' : mode === 'rejected' ? 'REJEITA' :
    mode === 'reading' ? 'PROCESSANDO' : 'EM ESPERA';
}
function render() { renderChips(); renderDiagram(); renderStage(); el.step.disabled = busy || position === code.length && mode !== 'idle'; }

function loadCode(value) {
  token++;
  setControls(false);
  el.input.value = value;
  code = value;
  currentState = INITIAL_STATE;
  position = 0;
  path = [INITIAL_STATE];
  highlightedTransition = null;
  mode = 'idle';
  setError('');
  document.querySelectorAll('[data-code]').forEach(button => button.classList.toggle('active', button.dataset.code === value));
  render();
}
function reset() {
  token++;
  setControls(false);
  const valid = codeFromInput();
  if (valid === null) {
    // Preserve a valid internal machine and allow the user to correct the input.
    currentState = INITIAL_STATE; position = 0; path = [INITIAL_STATE]; mode = 'idle'; highlightedTransition = null;
    render(); return;
  }
  loadCode(valid);
  el.batchInfo.textContent = 'Pronto para testar os 10 exemplos.';
}
function stepOnce() {
  if (position >= code.length) return false;
  const symbol = code[position];
  const previous = currentState;
  currentState = nextState(previous, symbol);
  highlightedTransition = { from: previous, symbol };
  path.push(currentState);
  position++;
  mode = 'reading';
  if (position === code.length) finish();
  render();
  return true;
}
function finish() {
  const accepted = currentState === FINAL_STATE;
  mode = accepted ? 'accepted' : 'rejected';
  addRecord(code, accepted, path);
}
function addRecord(word, accepted, states) {
  records.unshift({ id: nextRobotId++, word, accepted, states: [...states], timestamp: new Date() });
  renderMetrics();
  renderHistory();
}
function renderMetrics() {
  const total = records.length;
  const acceptedCount = records.filter(record => record.accepted).length;
  const rate = total ? Math.round(100 * acceptedCount / total) : 0;
  el.total.textContent = String(total).padStart(2, '0');
  el.accepted.textContent = String(acceptedCount).padStart(2, '0');
  el.rejected.textContent = String(total - acceptedCount).padStart(2, '0');
  el.rate.textContent = `${rate}%`;
  el.rateBar.style.width = `${rate}%`;
}
function renderHistory() {
  el.history.replaceChildren();
  if (!records.length) {
    const tr = document.createElement('tr'); tr.className = 'history-empty';
    const td = document.createElement('td'); td.colSpan = 4; td.textContent = 'Nenhuma inspeção registrada ainda.';
    tr.append(td); el.history.append(tr); return;
  }
  for (const r of records.slice(0, 60)) {
    const row = document.createElement('tr');
    const values = [`R-${String(r.id).padStart(3, '0')}`, r.word, r.states.map(formatState).join(' → '), r.accepted ? 'ACEITA' : 'REJEITA'];
    for (let i = 0; i < values.length; i++) {
      const td = document.createElement('td');
      td.textContent = values[i];
      if (i === 3) td.className = r.accepted ? 'accepted' : 'rejected';
      row.append(td);
    }
    el.history.append(row);
  }
}
async function runAuto() {
  if (busy) return;
  const value = codeFromInput();
  if (value === null) return;
  // Continue from a partially executed manual run, otherwise start a fresh run.
  if (value !== code || position === code.length) loadCode(value);
  const myToken = ++token;
  setControls(true);
  while (position < code.length && myToken === token) {
    await sleep(Number(el.speed.value));
    if (myToken !== token) break;
    stepOnce();
  }
  if (myToken === token) setControls(false);
  render();
}
function runStep() {
  if (busy) return;
  const value = codeFromInput();
  if (value === null) return;
  if (value !== code || position === code.length) loadCode(value);
  stepOnce();
}
async function runBatch() {
  if (busy) return;
  const myToken = ++token;
  setControls(true);
  const samples = [...EXAMPLE_ACCEPTED, ...EXAMPLE_REJECTED];
  let count = 0, verified = 0;
  for (const sample of samples) {
    if (myToken !== token) break;
    code = sample;
    el.input.value = sample;
    currentState = INITIAL_STATE; position = 0; path = [INITIAL_STATE]; mode = 'reading'; highlightedTransition = null;
    render();
    // Test mode: execute each symbol without the long guided animation.
    for (const symbol of sample) {
      const from = currentState;
      currentState = nextState(from, symbol);
      highlightedTransition = { from, symbol };
      position++;
      path.push(currentState);
    }
    finish(); render();
    const expected = sample.endsWith('01');
    if ((currentState === FINAL_STATE) === expected) verified++;
    count++;
    el.batchInfo.textContent = `Verificados ${count}/10 exemplos • ${verified} resultados corretos.`;
    await sleep(260);
  }
  if (myToken !== token) return;
  setControls(false);
  render();
  el.batchInfo.textContent = `${verified}/10 verificações corretas. Todos os resultados foram registrados no histórico.`;
}
function exportCsv() {
  if (!records.length) { el.batchInfo.textContent = 'Execute pelo menos um teste antes de exportar.'; return; }
  const rows = [['Robo', 'Codigo', 'Percurso', 'Resultado', 'Data e hora'],
    ...records.map(r => [`R-${String(r.id).padStart(3, '0')}`, r.word, r.states.map(formatState).join(' > '), r.accepted ? 'ACEITA' : 'REJEITA', r.timestamp.toLocaleString('pt-BR')])];
  const csv = '\ufeff' + rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'afd-factory-historico.csv';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

el.input.addEventListener('input', () => {
  // A edição invalida o percurso anterior; nenhum resultado é criado só por digitar.
  token++;
  setControls(false);
  code = el.input.value.trim();
  currentState = INITIAL_STATE; position = 0; path = [INITIAL_STATE]; mode = 'idle'; highlightedTransition = null;
  setError(code && !isValidCode(code) ? 'Use somente 0 e 1 (até 24 símbolos).' : '');
  document.querySelectorAll('[data-code]').forEach(button => button.classList.toggle('active', button.dataset.code === code));
  render();
});
el.input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); runAuto(); } });
document.querySelectorAll('[data-code]').forEach(button => button.addEventListener('click', () => loadCode(button.dataset.code)));
el.auto.addEventListener('click', runAuto);
el.step.addEventListener('click', runStep);
el.reset.addEventListener('click', reset);
el.batch.addEventListener('click', runBatch);
el.clear.addEventListener('click', () => { records = []; nextRobotId = 1; renderMetrics(); renderHistory(); el.batchInfo.textContent = 'Histórico limpo.'; });
el.export.addEventListener('click', exportCsv);

// Autoteste determinístico interno: valida alfabeto, transições e 10 exemplos do projeto.
function selfCheck() {
  for (const sample of EXAMPLE_ACCEPTED) if (!runPure(sample).accepted) throw new Error(`Falha: ${sample} deveria ser aceita.`);
  for (const sample of EXAMPLE_REJECTED) if (runPure(sample).accepted) throw new Error(`Falha: ${sample} deveria ser rejeitada.`);
  for (const state of [0, 1, 2]) for (const symbol of ['0', '1']) {
    if (![0, 1, 2].includes(nextState(state, symbol))) throw new Error(`Transição inválida em ${state}, ${symbol}.`);
  }
}
selfCheck();
loadCode('1101');
renderMetrics();
renderHistory();
