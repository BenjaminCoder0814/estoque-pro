import React, { useMemo, useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { AVISO_ANTECIPADO_MIN, PORTEIRO_COLLECTION, STATUS, TIPOS, isValidToken, nowIso, normalizeText } from './porteiro/config';

const VAZIO = {
  tipo: 'Transportadora',
  nomeMotorista: '',
  empresa: '',
  telefone: '',
  placa: '',
  ordemColeta: '',
  horarioChegada: '',
  observacao: '',
  fotoDataUrl: '',
};

function toIsoFromLocalDateTime(localValue) {
  if (!localValue) return '';
  const dt = new Date(localValue);
  return Number.isNaN(dt.getTime()) ? '' : dt.toISOString();
}

export default function PorteiroCheckin() {
  const token = useMemo(() => {
    const path = window.location.pathname.split('/').filter(Boolean);
    return path[path.length - 1] || '';
  }, []);

  const [form, setForm] = useState(VAZIO);
  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState('');
  const [err, setErr] = useState('');

  if (!isValidToken(token)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-6 text-center">
          <h1 className="text-xl font-bold">Acesso não autorizado</h1>
          <p className="text-sm text-slate-300 mt-2">Este link de check-in é inválido ou expirou.</p>
        </div>
      </div>
    );
  }

  async function handleFoto(file) {
    if (!file) {
      setForm((f) => ({ ...f, fotoDataUrl: '' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, fotoDataUrl: String(ev.target?.result || '') }));
    };
    reader.readAsDataURL(file);
  }

  async function enviar(e) {
    e.preventDefault();
    setErr('');
    setOkMsg('');

    const payload = {
      tipo: normalizeText(form.tipo),
      nomeMotorista: normalizeText(form.nomeMotorista),
      empresa: normalizeText(form.empresa),
      telefone: normalizeText(form.telefone),
      placa: normalizeText(form.placa).toUpperCase(),
      ordemColeta: normalizeText(form.ordemColeta),
      observacao: normalizeText(form.observacao),
      fotoDataUrl: form.fotoDataUrl || '',
      status: STATUS.AGUARDANDO,
      criadoEm: nowIso(),
      atualizadoEm: nowIso(),
      origem: 'QR_PORTARIA',
    };

    const chegadaPrevistaEm = toIsoFromLocalDateTime(form.horarioChegada);
    if (!chegadaPrevistaEm) {
      setErr('Informe o horário previsto de chegada para agendar o atendimento.');
      return;
    }
    const antecedenciaMinAviso = Math.floor((new Date(chegadaPrevistaEm).getTime() - Date.now()) / 60000);
    if (antecedenciaMinAviso < 0) {
      setErr('O horário informado já passou. Informe um horário futuro.');
      return;
    }
    payload.chegadaPrevistaEm = chegadaPrevistaEm;
    payload.antecedenciaMinAviso = antecedenciaMinAviso;
    payload.separacaoAntecipada = antecedenciaMinAviso >= AVISO_ANTECIPADO_MIN;

    if (!payload.nomeMotorista || !payload.empresa) {
      setErr('Preencha pelo menos nome do motorista e empresa.');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, PORTEIRO_COLLECTION), payload);
      if (payload.separacaoAntecipada) {
        setOkMsg('Agendamento enviado. Sua carga entra no fluxo de separação antecipada.');
      } else {
        setOkMsg(`Agendamento enviado. Avisos com menos de ${AVISO_ANTECIPADO_MIN} minutos nao entram em separacao antecipada.`);
      }
      setForm(VAZIO);
    } catch (error) {
      setErr('Não foi possível enviar agora. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-xl mx-auto bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-5">
        <h1 className="text-xl font-bold">Check-in Portaria Zenith</h1>
        <p className="text-sm text-slate-300 mt-1">Preencha para entrar na fila de atendimento da expedição.</p>

        <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="font-semibold text-amber-200">Regras de atendimento</p>
          <ul className="mt-2 space-y-1 list-disc pl-5 text-amber-100/95">
            <li>Para separação antecipada do pedido, o aviso deve ser enviado com pelo menos 30 minutos de antecedência.</li>
            <li>Chegando após o horário combinado, o atendimento seguirá a fila normal do portão.</li>
            <li>Para agilizar, envie placa, ordem/NF e foto legível da ordem.</li>
          </ul>
        </div>

        <form className="mt-4 grid grid-cols-1 gap-3" onSubmit={enviar}>
          <label className="text-sm">
            Tipo de atendimento
            <select
              className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
            >
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>

          <label className="text-sm">
            Nome do motorista *
            <input className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2" value={form.nomeMotorista} onChange={(e) => setForm((f) => ({ ...f, nomeMotorista: e.target.value }))} />
          </label>

          <label className="text-sm">
            Empresa / Transportadora *
            <input className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2" value={form.empresa} onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))} />
          </label>

          <label className="text-sm">
            WhatsApp para contato
            <input
              className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
              value={form.telefone}
              onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </label>

          <label className="text-sm">
            Horário previsto de chegada *
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
              value={form.horarioChegada}
              onChange={(e) => setForm((f) => ({ ...f, horarioChegada: e.target.value }))}
            />
          </label>

          <label className="text-sm">
            Placa
            <input className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2" value={form.placa} onChange={(e) => setForm((f) => ({ ...f, placa: e.target.value }))} />
          </label>

          <label className="text-sm">
            Ordem de coleta / NF
            <input className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2" value={form.ordemColeta} onChange={(e) => setForm((f) => ({ ...f, ordemColeta: e.target.value }))} />
          </label>

          <label className="text-sm">
            Foto da ordem (opcional)
            <input type="file" accept="image/*" capture="environment" className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2" onChange={(e) => handleFoto(e.target.files?.[0])} />
          </label>

          <label className="text-sm">
            Observação
            <textarea className="mt-1 w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2" rows={3} value={form.observacao} onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))} />
          </label>

          {err && <p className="text-red-400 text-sm">{err}</p>}
          {okMsg && <p className="text-emerald-400 text-sm">{okMsg}</p>}

          <button disabled={loading} className="mt-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-4 py-2 font-semibold">
            {loading ? 'Enviando...' : 'Entrar na fila'}
          </button>
        </form>
      </div>
    </div>
  );
}
