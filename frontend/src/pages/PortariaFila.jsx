import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Zap } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  AVISO_ANTECIPADO_MIN,
  PORTEIRO_COLLECTION,
  STATUS,
  STATUS_LABEL,
  TOLERANCIA_ATRASO_MIN,
  getPortariaPublicLink,
  nowIso,
} from './porteiro/config';

const STATUS_ORDER = {
  [STATUS.CHEGOU_PORTAO]: 0,
  [STATUS.AGUARDANDO]: 1,
  [STATUS.CHAMADO]: 2,
  [STATUS.ATENDIMENTO]: 3,
  [STATUS.FINALIZADO]: 4,
  [STATUS.CANCELADO]: 5,
};

function badgeClass(status) {
  if (status === STATUS.CHEGOU_PORTAO) return 'bg-fuchsia-100 text-fuchsia-700';
  if (status === STATUS.AGUARDANDO) return 'bg-amber-100 text-amber-700';
  if (status === STATUS.CHAMADO) return 'bg-blue-100 text-blue-700';
  if (status === STATUS.ATENDIMENTO) return 'bg-indigo-100 text-indigo-700';
  if (status === STATUS.FINALIZADO) return 'bg-emerald-100 text-emerald-700';
  return 'bg-red-100 text-red-700';
}

function toMs(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function minutesDiff(fromMs, toMs) {
  if (fromMs == null || toMs == null) return null;
  return Math.floor((toMs - fromMs) / 60000);
}

export default function PortariaFila() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [shareMsg, setShareMsg] = useState('');

  const linkPublico = useMemo(() => getPortariaPublicLink(), []);

  const textoCompartilhamento = useMemo(() => {
    return [
      'Agendamento de retirada Zenith:',
      linkPublico,
      '',
      'Regras importantes:',
      `- O pedido so sera separado com aviso minimo de ${AVISO_ANTECIPADO_MIN} minutos antes da chegada.`,
      `- Tolerancia de atraso para manter prioridade: ${TOLERANCIA_ATRASO_MIN} minutos.`,
      '- Chegando apos o horario combinado, o atendimento segue a fila normal do portao.',
      '- Informe placa, ordem/NF e horario para agilizar o atendimento.',
    ].join('\n');
  }, [linkPublico]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, PORTEIRO_COLLECTION), (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(arr);
    }, (err) => console.warn('Portaria fila onSnapshot:', err?.message));
    return () => unsub();
  }, []);

  const ativos = useMemo(() => {
    const agoraMs = Date.now();
    return [...items]
      .filter((i) => ![STATUS.FINALIZADO, STATUS.CANCELADO].includes(i.status))
      .map((i) => {
        const chegadaPrevistaMs = toMs(i.chegadaPrevistaEm);
        const chegouPortaoMs = toMs(i.chegouPortaoEm);
        const atrasoMin = chegadaPrevistaMs == null ? null : Math.max(0, minutesDiff(chegadaPrevistaMs, agoraMs));
        const perdeuPrioridadePorAtraso = !!i.separacaoAntecipada
          && i.status !== STATUS.CHEGOU_PORTAO
          && atrasoMin != null
          && atrasoMin > TOLERANCIA_ATRASO_MIN;
        const prioridadeSeparacaoAtiva = !!i.separacaoAntecipada && !perdeuPrioridadePorAtraso;
        const sinalizacaoImediata = prioridadeSeparacaoAtiva
          && [STATUS.AGUARDANDO, STATUS.CHEGOU_PORTAO].includes(i.status);

        let filaScore = STATUS_ORDER[i.status] ?? 99;
        if (i.status === STATUS.CHEGOU_PORTAO && prioridadeSeparacaoAtiva) filaScore = -2;
        else if (i.status === STATUS.CHEGOU_PORTAO) filaScore = -1;
        else if (sinalizacaoImediata) filaScore = 0;

        return {
          ...i,
          chegadaPrevistaMs,
          chegouPortaoMs,
          atrasoMin,
          perdeuPrioridadePorAtraso,
          prioridadeSeparacaoAtiva,
          sinalizacaoImediata,
          filaScore,
        };
      })
      .sort((a, b) => {
        if (a.filaScore !== b.filaScore) return a.filaScore - b.filaScore;
        if (a.status === STATUS.CHEGOU_PORTAO && b.status === STATUS.CHEGOU_PORTAO) {
          return (a.chegouPortaoMs || 0) - (b.chegouPortaoMs || 0);
        }
        return new Date(a.criadoEm || 0) - new Date(b.criadoEm || 0);
      });
  }, [items]);

  const filaPortao = useMemo(() => {
    return ativos
      .filter((i) => i.status === STATUS.CHEGOU_PORTAO)
      .sort((a, b) => (a.chegouPortaoMs || 0) - (b.chegouPortaoMs || 0));
  }, [ativos]);

  const sinalizacaoSeparacao = useMemo(() => {
    return ativos
      .filter((i) => i.sinalizacaoImediata)
      .slice(0, 8);
  }, [ativos]);

  const concluidos = useMemo(() => {
    return [...items]
      .filter((i) => [STATUS.FINALIZADO, STATUS.CANCELADO].includes(i.status))
      .sort((a, b) => new Date(b.atualizadoEm || 0) - new Date(a.atualizadoEm || 0));
  }, [items]);

  async function setStatus(item, status) {
    await updateDoc(doc(db, PORTEIRO_COLLECTION, item.id), {
      status,
      atualizadoEm: nowIso(),
      atualizadoPor: user?.nome || 'Expedição',
    });
  }

  async function marcarChegadaPortao(item) {
    await updateDoc(doc(db, PORTEIRO_COLLECTION, item.id), {
      status: STATUS.CHEGOU_PORTAO,
      chegouPortaoEm: nowIso(),
      atualizadoEm: nowIso(),
      atualizadoPor: user?.nome || 'Expedição',
    });
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkPublico);
      setShareMsg('Link copiado.');
    } catch {
      setShareMsg('Nao foi possivel copiar automaticamente.');
    }
  }

  async function copiarMensagem() {
    try {
      await navigator.clipboard.writeText(textoCompartilhamento);
      setShareMsg('Mensagem pronta copiada.');
    } catch {
      setShareMsg('Nao foi possivel copiar a mensagem.');
    }
  }

  return (
    <div className="p-6">
      <div className="bg-white border rounded-xl p-4 mb-4">
        <h1 className="text-xl font-bold text-gray-900">Portaria - Fila de Atendimento</h1>
      </div>

      <div className="bg-white border rounded-xl p-4 mb-4">
        <h2 className="font-bold text-gray-900">Link para envio ao comprador</h2>
        <p className="text-sm text-gray-600 mt-1">Use este link para o cliente informar horario previsto e entrar no fluxo da portaria.</p>
        <div className="mt-3 p-3 rounded-lg bg-gray-50 border text-xs break-all text-gray-800">{linkPublico}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={copiarLink} className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs font-semibold">Copiar link</button>
          <button onClick={copiarMensagem} className="px-3 py-1.5 rounded bg-slate-800 text-white text-xs font-semibold">Copiar mensagem pronta</button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(textoCompartilhamento)}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-semibold"
          >
            Enviar por WhatsApp
          </a>
        </div>
        {shareMsg && <p className="text-xs text-emerald-700 mt-2">{shareMsg}</p>}
      </div>

      <div className="bg-white border rounded-xl p-4 mb-4">
        <h2 className="font-bold text-gray-900">Sinalizacao imediata para separacao antecipada</h2>
        <p className="text-sm text-gray-600 mt-1">Itens abaixo ainda estao com prioridade valida e podem ser separados antes da chegada.</p>
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-semibold text-emerald-800">{sinalizacaoSeparacao.length} item(ns) com prioridade ativa</p>
          <div className="mt-2 space-y-1">
            {sinalizacaoSeparacao.length === 0 && <p className="text-xs text-emerald-700">Nenhuma prioridade ativa no momento.</p>}
            {sinalizacaoSeparacao.map((i) => (
              <p key={i.id} className="text-xs text-emerald-800">
                {i.nomeMotorista || 'Sem nome'} · {i.empresa || 'Sem empresa'} · chegada {i.chegadaPrevistaEm ? new Date(i.chegadaPrevistaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'n/i'}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-bold text-gray-900 mb-3">Fila ativa ({ativos.length})</h2>
          <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
            {ativos.length === 0 && <p className="text-sm text-gray-400">Sem check-ins aguardando.</p>}
            {ativos.map((i) => (
              <div
                key={i.id}
                className={`border rounded-lg p-3 ${
                  i.status === STATUS.CHEGOU_PORTAO && i.prioridadeSeparacaoAtiva
                    ? 'border-fuchsia-300 bg-fuchsia-50/70 shadow-sm'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{i.nomeMotorista || 'Sem nome'} · {i.empresa || 'Sem empresa'}</p>
                      {i.status === STATUS.CHEGOU_PORTAO && i.prioridadeSeparacaoAtiva && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-600 text-white px-2 py-0.5 text-[11px] font-bold">
                          <Zap className="w-3 h-3" />
                          PRIORIDADE NO PORTAO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{i.tipo || '—'} | Placa: {i.placa || '—'} | Ordem: {i.ordemColeta || '—'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Horario previsto: {i.chegadaPrevistaEm ? new Date(i.chegadaPrevistaEm).toLocaleString('pt-BR') : 'Nao informado'}
                    </p>
                    <p className={`text-xs mt-1 ${i.prioridadeSeparacaoAtiva ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {i.prioridadeSeparacaoAtiva
                        ? `Prioridade ativa de separacao antecipada (aviso >=${AVISO_ANTECIPADO_MIN} min).`
                        : `Sem prioridade de separacao antecipada (aviso <${AVISO_ANTECIPADO_MIN} min ou prioridade expirada).`}
                    </p>
                    {i.perdeuPrioridadePorAtraso && (
                      <p className="text-xs mt-1 text-red-700">
                        Prioridade perdida por atraso superior a {TOLERANCIA_ATRASO_MIN} minutos.
                      </p>
                    )}
                    {i.chegouPortaoEm && (
                      <p className="text-xs mt-1 text-fuchsia-700">
                        Cliente chegou no portao em {new Date(i.chegouPortaoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeClass(i.status)}`}>{STATUS_LABEL[i.status] || i.status}</span>
                </div>

                {i.observacao && <p className="text-xs text-gray-600 mt-2">Obs: {i.observacao}</p>}
                {i.fotoDataUrl && (
                  <a href={i.fotoDataUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 text-xs text-indigo-600 hover:underline">Ver foto da ordem</a>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {[STATUS.AGUARDANDO, STATUS.CHAMADO].includes(i.status) && (
                    <button onClick={() => marcarChegadaPortao(i)} className="px-3 py-1.5 rounded bg-fuchsia-600 text-white text-xs font-semibold">Cliente chegou no portao</button>
                  )}
                  {(i.status === STATUS.AGUARDANDO || i.status === STATUS.CHEGOU_PORTAO) && (
                    <button onClick={() => setStatus(i, STATUS.CHAMADO)} className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold">Chamar</button>
                  )}
                  {[STATUS.AGUARDANDO, STATUS.CHAMADO, STATUS.CHEGOU_PORTAO].includes(i.status) && (
                    <button onClick={() => setStatus(i, STATUS.ATENDIMENTO)} className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs font-semibold">Iniciar atendimento</button>
                  )}
                  {i.status !== STATUS.FINALIZADO && (
                    <button onClick={() => setStatus(i, STATUS.FINALIZADO)} className="px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-semibold">Finalizar</button>
                  )}
                  {i.status !== STATUS.CANCELADO && (
                    <button onClick={() => setStatus(i, STATUS.CANCELADO)} className="px-3 py-1.5 rounded bg-red-600 text-white text-xs font-semibold">Cancelar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-bold text-gray-900 mb-3">Fila real do portao ({filaPortao.length})</h2>
          <div className="space-y-2 max-h-[33vh] overflow-auto pr-1 mb-4">
            {filaPortao.length === 0 && <p className="text-sm text-gray-400">Nenhum cliente marcado como chegou no portao.</p>}
            {filaPortao.map((i, idx) => (
              <div key={i.id} className="border rounded-lg p-3 bg-fuchsia-50/60">
                <p className="text-sm font-semibold text-gray-900">#{idx + 1} · {i.nomeMotorista || 'Sem nome'} · {i.empresa || 'Sem empresa'}</p>
                <p className="text-xs text-gray-600 mt-1">Chegada no portao: {i.chegouPortaoEm ? new Date(i.chegouPortaoEm).toLocaleString('pt-BR') : 'n/i'}</p>
              </div>
            ))}
          </div>

          <h2 className="font-bold text-gray-900 mb-3">Histórico recente</h2>
          <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
            {concluidos.slice(0, 80).map((i) => (
              <div key={i.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">{i.nomeMotorista || 'Sem nome'} · {i.empresa || 'Sem empresa'}</p>
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${badgeClass(i.status)}`}>{STATUS_LABEL[i.status] || i.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Atualizado por: {i.atualizadoPor || '—'}</p>
              </div>
            ))}
            {concluidos.length === 0 && <p className="text-sm text-gray-400">Sem atendimentos finalizados ainda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
