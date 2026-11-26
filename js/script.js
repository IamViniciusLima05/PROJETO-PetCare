/* PetCare — pets, vacinas, consultas, remédios, alimentação e alertas de datas */

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const banco = {
  ler(k, padrao) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? padrao; } catch { return padrao; } },
  salvar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem storage */ } }
};

const ESPECIES = { cao: ['🐶', 'Cachorro'], gato: ['🐱', 'Gato'], ave: ['🦜', 'Ave'], outro: ['🐰', 'Outro'] };
const TIPOS = {
  vacina: { ic: '💉', nome: 'Vacina', cor: '#7048e8', sug: ['V10 (polivalente)', 'Antirrábica', 'Gripe canina', 'Giárdia', 'V4 felina', 'V5 felina', 'Leishmaniose'] },
  consulta: { ic: '🩺', nome: 'Consulta', cor: '#1c7ed6', sug: ['Check-up anual', 'Retorno', 'Dermatologista', 'Exame de sangue', 'Limpeza de tártaro', 'Castração'] },
  remedio: { ic: '💊', nome: 'Remédio', cor: '#e8590c', sug: ['Vermífugo', 'Antipulgas', 'Antibiótico', 'Anti-inflamatório', 'Suplemento'] },
  alimentacao: { ic: '🥣', nome: 'Alimentação', cor: '#2f9e44', sug: ['Ração adulto', 'Ração filhote', 'Ração light', 'Sachê', 'Petisco'] }
};
const hoje = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const iso = (d) => new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const somaDias = (n) => { const d = hoje(); d.setDate(d.getDate() + n); return iso(d); };
const dataBR = (s, op = { day: '2-digit', month: 'short', year: 'numeric' }) => new Date(s + 'T12:00').toLocaleDateString('pt-BR', op);
const diasAte = (s) => Math.round((new Date(s + 'T00:00') - hoje()) / 864e5);

function exemplos() {
  return {
    pets: [
      { id: 1, nome: 'Thor', especie: 'cao', raca: 'Golden Retriever', nasc: somaDias(-365 * 4 - 40), peso: 31.5, sexo: 'Macho', castrado: 'Sim', pesos: [[somaDias(-300), 29.8], [somaDias(-200), 30.6], [somaDias(-90), 31.9], [somaDias(-10), 31.5]] },
      { id: 2, nome: 'Mia', especie: 'gato', raca: 'SRD', nasc: somaDias(-365 * 2 - 100), peso: 4.2, sexo: 'Fêmea', castrado: 'Sim', pesos: [[somaDias(-150), 3.9], [somaDias(-20), 4.2]] }
    ],
    regs: [
      { id: 1, pet: 1, tipo: 'vacina', titulo: 'V10 (polivalente)', data: somaDias(-360), prox: somaDias(5), obs: 'Clínica Patas & Cia' },
      { id: 2, pet: 1, tipo: 'vacina', titulo: 'Antirrábica', data: somaDias(-375), prox: somaDias(-10), obs: '' },
      { id: 3, pet: 1, tipo: 'remedio', titulo: 'Antipulgas', data: somaDias(-28), prox: somaDias(2), dose: '1 comprimido mastigável', freq: 720, fim: '', obs: '' },
      { id: 4, pet: 1, tipo: 'consulta', titulo: 'Check-up anual', data: somaDias(-45), prox: somaDias(320), vet: 'Dra. Paula Reis', valor: 180, obs: 'Tudo certo. Manter peso.' },
      { id: 5, pet: 1, tipo: 'alimentacao', titulo: 'Ração adulto raças grandes', data: somaDias(-60), prox: '', qtd: '250 g', horarios: '8h e 19h', obs: 'Trocar o saco de 15 kg a cada ~30 dias.' },
      { id: 6, pet: 1, tipo: 'remedio', titulo: 'Vermífugo', data: somaDias(-95), prox: somaDias(-5), dose: '1 comprimido', freq: 0, fim: '', obs: '' },
      { id: 7, pet: 2, tipo: 'vacina', titulo: 'V5 felina', data: somaDias(-200), prox: somaDias(165), obs: '' },
      { id: 8, pet: 2, tipo: 'consulta', titulo: 'Exame de sangue', data: somaDias(-20), prox: somaDias(12), vet: 'Clínica Miau', valor: 140, obs: 'Retorno para ver resultado.' },
      { id: 9, pet: 2, tipo: 'alimentacao', titulo: 'Ração castrados + sachê', data: somaDias(-30), prox: '', qtd: '55 g', horarios: '3 vezes ao dia', obs: '' }
    ]
  };
}
let dados = banco.ler('pc_dados', null) ?? exemplos();
let petAtual = banco.ler('pc_atual', dados.pets[0]?.id ?? null);
let aba = 'todos', editPet = null, editReg = null;
const salvar = () => { banco.salvar('pc_dados', dados); banco.salvar('pc_atual', petAtual); };
const pet = () => dados.pets.find((p) => p.id === petAtual);

function idade(nasc) {
  if (!nasc) return '—';
  const n = new Date(nasc + 'T12:00'), h = new Date();
  let meses = (h.getFullYear() - n.getFullYear()) * 12 + h.getMonth() - n.getMonth(); if (h.getDate() < n.getDate()) meses--;
  if (meses < 12) return `${Math.max(0, meses)} ${meses === 1 ? 'mês' : 'meses'}`;
  const a = Math.floor(meses / 12);
  return `${a} ${a === 1 ? 'ano' : 'anos'}${meses % 12 ? ` e ${meses % 12} m` : ''}`;
}

/* ---------- Desenho ---------- */
function alertasDe(petId) {
  return dados.regs.filter((r) => (petId == null || r.pet === petId) && r.prox && diasAte(r.prox) <= 7 && !r.feito)
    .sort((a, b) => a.prox.localeCompare(b.prox));
}
function desenharPets() {
  $('#pets').innerHTML = dados.pets.map((p) => `<button class="pet-btn" data-pet="${p.id}" aria-pressed="${p.id === petAtual}"><span class="emoji">${ESPECIES[p.especie][0]}</span>${escapar(p.nome)}${alertasDe(p.id).some((r) => diasAte(r.prox) < 0) ? '<span class="ponto" title="Tem pendência atrasada"></span>' : ''}</button>`).join('') +
    '<button class="pet-btn novo" id="novo-pet">+ Pet</button>';
}
function desenharPerfil() {
  const p = pet();
  if (!p) { $('#perfil').innerHTML = '<div class="avatar">🐾</div><h2>Bem-vindo!</h2><p class="sub">Cadastre seu primeiro pet para começar.</p>'; return; }
  const pesos = (p.pesos || []).slice(-8);
  let graf = '';
  if (pesos.length > 1) {
    const vs = pesos.map((x) => x[1]), mn = Math.min(...vs), mx = Math.max(...vs), amp = mx - mn || 1;
    const pts = pesos.map((x, i) => [(i / (pesos.length - 1)) * 280 + 10, 60 - ((x[1] - mn) / amp) * 46]);
    graf = `<div class="peso-hist"><h3>Histórico de peso</h3><svg viewBox="0 0 300 70" preserveAspectRatio="none"><polyline points="${pts.map((q) => q.join(',')).join(' ')}" fill="none" stroke="#f07a2c" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>${pts.map((q, i) => `<circle cx="${q[0]}" cy="${q[1]}" r="4" fill="#fff" stroke="#f07a2c" stroke-width="2"><title>${dataBR(pesos[i][0])}: ${pesos[i][1]} kg</title></circle>`).join('')}</svg></div>`;
  }
  $('#perfil').innerHTML = `<div class="avatar" aria-hidden="true">${ESPECIES[p.especie][0]}</div>
    <h2>${escapar(p.nome)}</h2><p class="sub">${escapar(p.raca || ESPECIES[p.especie][1])}</p>
    <div class="fichas">
      <div class="ficha"><small>Idade</small><b>${idade(p.nasc)}</b></div>
      <div class="ficha"><small>Peso</small><b>${p.peso ? `${String(p.peso).replace('.', ',')} kg` : '—'}</b></div>
      <div class="ficha"><small>Sexo</small><b>${escapar(p.sexo || '—')}</b></div>
      <div class="ficha"><small>Castrado</small><b>${escapar(p.castrado || '—')}</b></div>
    </div>${graf}
    <button class="editar-pet" id="editar-pet">Editar dados de ${escapar(p.nome)}</button>`;
}
function desenharAlertas() {
  const lista = pet() ? alertasDe(petAtual) : [];
  $('#alertas').innerHTML = lista.length ? lista.map((r) => {
    const d = diasAte(r.prox), t = TIPOS[r.tipo];
    const quando = d < 0 ? `${r.tipo === 'consulta' ? 'atrasado' : 'atrasada'} há ${-d} ${d === -1 ? 'dia' : 'dias'}` : d === 0 ? 'é hoje' : d === 1 ? 'é amanhã' : `em ${d} dias`;
    return `<div class="alerta ${d < 0 ? 'atrasado' : 'breve'}"><span class="ic" aria-hidden="true">${t.ic}</span><div><b>${escapar(r.titulo)}</b><small>${t.nome === 'Consulta' ? 'Retorno' : 'Próxima dose'} ${quando} · ${dataBR(r.prox, { day: '2-digit', month: '2-digit' })}</small></div><button class="acao" data-feito="${r.id}">✓ Feito</button></div>`;
  }).join('') : pet() ? '<div class="alerta ok"><span class="ic">✅</span><div><b>Tudo em dia!</b><small>Nada vencendo nos próximos 7 dias.</small></div></div>' : '';
}
function detalhes(r) {
  const p = [];
  if (r.tipo === 'remedio') { if (r.dose) p.push(r.dose); const f = $(`#r-freq option[value="${r.freq}"]`); if (f) p.push(f.textContent.toLowerCase()); if (r.fim) p.push(`até ${dataBR(r.fim, { day: '2-digit', month: '2-digit' })}`); }
  if (r.tipo === 'consulta') { if (r.vet) p.push(r.vet); if (r.valor) p.push(Number(r.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })); }
  if (r.tipo === 'alimentacao') { if (r.qtd) p.push(r.qtd); if (r.horarios) p.push(r.horarios); }
  if (r.obs) p.push(r.obs);
  let txt = p.map(escapar).join(' · ');
  if (r.prox && !r.feito) { const d = diasAte(r.prox); txt += ` <span class="prox ${d < 0 ? 'atrasado' : ''}">${r.tipo === 'consulta' ? 'retorno' : 'próxima'} ${dataBR(r.prox, { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>`; }
  return txt;
}
function desenharLinha() {
  const regs = dados.regs.filter((r) => r.pet === petAtual && (aba === 'todos' || r.tipo === aba)).sort((a, b) => b.data.localeCompare(a.data));
  if (!regs.length) { $('#linha').innerHTML = `<li class="vazio">${pet() ? 'Nenhum registro aqui ainda.' : ''}</li>`; return; }
  let mesAnt = '', html = '';
  regs.forEach((r) => {
    const mes = dataBR(r.data, { month: 'long', year: 'numeric' });
    if (mes !== mesAnt) { html += `<li class="mes">${mes}</li>`; mesAnt = mes; }
    const t = TIPOS[r.tipo];
    html += `<li class="reg" style="--c:${t.cor}" data-reg="${r.id}" tabindex="0"><b>${t.ic} ${escapar(r.titulo)}</b><span class="data">${dataBR(r.data, { day: '2-digit', month: 'short' })}</span><span class="det">${detalhes(r)}</span></li>`;
  });
  $('#linha').innerHTML = html;
}
function desenhar() { desenharPets(); desenharPerfil(); desenharAlertas(); desenharLinha(); }

/* ---------- Eventos gerais ---------- */
$('#pets').addEventListener('click', (e) => {
  if (e.target.closest('#novo-pet')) { abrirPet(null); return; }
  const b = e.target.closest('[data-pet]'); if (!b) return;
  petAtual = +b.dataset.pet; salvar(); desenhar();
});
$('#perfil').addEventListener('click', (e) => { if (e.target.id === 'editar-pet') abrirPet(pet()); });
$$('[data-aba]').forEach((b) => b.addEventListener('click', () => { aba = b.dataset.aba; $$('[data-aba]').forEach((x) => x.setAttribute('aria-selected', x === b)); desenharLinha(); }));
$('#alertas').addEventListener('click', (e) => {
  const b = e.target.closest('[data-feito]'); if (!b) return;
  const r = dados.regs.find((x) => x.id === +b.dataset.feito);
  // marca o antigo como concluído e já cria o registro de hoje, sugerindo a próxima data no mesmo intervalo
  r.feito = true;
  const intervalo = Math.round((new Date(r.prox) - new Date(r.data)) / 864e5);
  const novo = { ...r, id: Date.now(), data: iso(hoje()), prox: intervalo > 0 ? somaDias(intervalo) : '', feito: false };
  dados.regs.push(novo); salvar(); desenhar();
  toast(novo.prox ? `Registrado! Próxima em ${dataBR(novo.prox, { day: '2-digit', month: '2-digit', year: 'numeric' })}` : 'Registrado!');
});
$('#linha').addEventListener('click', (e) => { const li = e.target.closest('[data-reg]'); if (li) abrirReg(dados.regs.find((r) => r.id === +li.dataset.reg)); });
$('#linha').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.dataset.reg) abrirReg(dados.regs.find((r) => r.id === +e.target.dataset.reg)); });

/* ---------- Pet ---------- */
$('#p-especies').innerHTML = Object.entries(ESPECIES).map(([id, [ic, nome]]) => `<label><input type="radio" name="especie" value="${id}"><span>${ic}<b>${nome}</b></span></label>`).join('');
function abrirPet(p) {
  editPet = p; $('#dlg-pet').returnValue = '';
  $('#dp-titulo').textContent = p ? `Editar ${p.nome}` : 'Novo pet';
  document.querySelector(`[name=especie][value=${p?.especie ?? 'cao'}]`).checked = true;
  $('#p-nome').value = p?.nome ?? ''; $('#p-raca').value = p?.raca ?? ''; $('#p-nasc').value = p?.nasc ?? '';
  $('#p-peso').value = p?.peso ?? ''; $('#p-sexo').value = p?.sexo ?? ''; $('#p-castrado').value = p?.castrado ?? '';
  const ex = $('#excluir-pet'); ex.hidden = !p; ex.textContent = 'Excluir pet';
  $('#dlg-pet').showModal();
}
$('#dlg-pet').addEventListener('close', () => {
  if ($('#dlg-pet').returnValue !== 'salvar') return;
  const peso = parseFloat($('#p-peso').value) || null;
  const d = { nome: $('#p-nome').value.trim(), especie: document.querySelector('[name=especie]:checked').value, raca: $('#p-raca').value.trim(), nasc: $('#p-nasc').value, peso, sexo: $('#p-sexo').value, castrado: $('#p-castrado').value };
  if (editPet) {
    if (peso && peso !== editPet.peso) (editPet.pesos ||= []).push([iso(hoje()), peso]);
    Object.assign(editPet, d);
  } else {
    const novo = { id: Date.now(), ...d, pesos: peso ? [[iso(hoje()), peso]] : [] };
    dados.pets.push(novo); petAtual = novo.id;
  }
  salvar(); desenhar(); toast(editPet ? 'Dados atualizados' : `${d.nome} foi cadastrado! 🐾`);
});
$('#excluir-pet').addEventListener('click', (e) => {
  if (e.target.textContent !== 'Confirmar exclusão') { e.target.textContent = 'Confirmar exclusão'; return; }
  dados.regs = dados.regs.filter((r) => r.pet !== editPet.id);
  dados.pets = dados.pets.filter((p) => p.id !== editPet.id);
  petAtual = dados.pets[0]?.id ?? null; salvar(); desenhar(); $('#dlg-pet').close('excluir'); toast('Pet removido');
});

/* ---------- Registros ---------- */
function ajustarCampos() {
  const t = document.querySelector('[name=tipo]:checked').value;
  $$('.so-remedio').forEach((el) => { el.hidden = t !== 'remedio'; });
  $$('.so-consulta').forEach((el) => { el.hidden = t !== 'consulta'; });
  $$('.so-alim').forEach((el) => { el.hidden = t !== 'alimentacao'; });
  $('#r-prox-label').hidden = t === 'alimentacao';
  $('#r-prox-label').firstChild.textContent = t === 'consulta' ? 'Retorno' : 'Próxima dose';
  $('#r-data-label').firstChild.textContent = t === 'alimentacao' ? 'Desde*' : 'Data*';
  $('#sugestoes').innerHTML = TIPOS[t].sug.map((s) => `<option value="${escapar(s)}">`).join('');
}
$$('[name=tipo]').forEach((r) => r.addEventListener('change', ajustarCampos));
const CAMPOS = { titulo: 'r-titulo', data: 'r-data', prox: 'r-prox', dose: 'r-dose', freq: 'r-freq', fim: 'r-fim', vet: 'r-vet', valor: 'r-valor', qtd: 'r-qtd', horarios: 'r-horarios', obs: 'r-obs' };
function abrirReg(r) {
  if (!pet()) { toast('Cadastre um pet primeiro'); abrirPet(null); return; }
  editReg = r; $('#dlg-reg').returnValue = '';
  $('#dr-titulo').textContent = r ? 'Editar registro' : `Novo registro · ${pet().nome}`;
  document.querySelector(`[name=tipo][value=${r?.tipo ?? (aba === 'todos' ? 'vacina' : aba)}]`).checked = true;
  Object.entries(CAMPOS).forEach(([k, id]) => { $('#' + id).value = r?.[k] ?? ''; });
  if (!r) { $('#r-data').value = iso(hoje()); $('#r-freq').value = '0'; }
  const ex = $('#excluir-reg'); ex.hidden = !r; ex.textContent = 'Excluir';
  ajustarCampos(); $('#dlg-reg').showModal();
}
$('#novo-reg').addEventListener('click', () => abrirReg(null));
$('#form-reg').addEventListener('submit', (e) => {
  if (e.submitter?.value !== 'salvar') return;
  if ($('#r-prox').value && $('#r-prox').value < $('#r-data').value) { e.preventDefault(); toast('A próxima data precisa ser depois da data do registro'); }
});
$('#dlg-reg').addEventListener('close', () => {
  if ($('#dlg-reg').returnValue !== 'salvar') return;
  const d = Object.fromEntries(Object.entries(CAMPOS).map(([k, id]) => [k, $('#' + id).value.trim()]));
  d.tipo = document.querySelector('[name=tipo]:checked').value; d.freq = +d.freq;
  if (d.tipo === 'alimentacao') d.prox = '';
  if (editReg) { Object.assign(editReg, d); if (d.prox && diasAte(d.prox) > 7) editReg.feito = false; }
  else dados.regs.push({ id: Date.now(), pet: petAtual, feito: false, ...d });
  salvar(); desenhar(); toast(editReg ? 'Registro atualizado' : 'Registro salvo');
});
$('#excluir-reg').addEventListener('click', (e) => {
  if (e.target.textContent !== 'Confirmar') { e.target.textContent = 'Confirmar'; return; }
  dados.regs = dados.regs.filter((r) => r.id !== editReg.id); salvar(); desenhar(); $('#dlg-reg').close('excluir'); toast('Registro excluído');
});

let timerToast;
function toast(msg) { const t = $('#toast'); (document.querySelector('dialog[open]') || document.body).append(t); t.textContent = msg; t.hidden = false; clearTimeout(timerToast); timerToast = setTimeout(() => { t.hidden = true; }, 2600); }

if (!pet() && dados.pets[0]) petAtual = dados.pets[0].id;
desenhar();
