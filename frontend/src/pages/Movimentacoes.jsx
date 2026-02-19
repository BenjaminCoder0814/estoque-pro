import React, { useState, useMemo } from 'react';
import { useEstoque } from '../contexts/EstoqueContext';
import { useAuth } from '../contexts/AuthContext';

const FORM_VAZIO = { produtoId: '', tipo: 'ENTRADA', quantidade: 1, observacao: '' };

export default function Movimentacoes() {
  const { movimentacoes, produtos, registrarMovimentacao } = useEstoque();
  const { user, can } = useAuth();

  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const produtosAtivos = produtos.filter(p => p.ativo);
  const produtoSelecionado = produtosAtivos.find(p => String(p.id) === String(form.produtoId));
  const usuarios = [...new Set(movimentacoes.map(m => m.usuario).filter(Boolean))];

  function enviar(e) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    const qtd = Number(form.quantidade);
    if (!form.produtoId) { setErro('Selecione um produto.'); return; }
    if (qtd <= 0) { setErro('Quantidade deve ser maior que zero.'); return; }

    const resultado = registrarMovimentacao({ ...form, quantidade: qtd }, user);
    if (resultado && resultado.erro) {
      setErro(resultado.erro);
    } else {
      setSucesso('Movimentação registrada com sucesso!');
      setForm(FORM_VAZIO);
      setTimeout(() => setSucesso(''), 4000);
    }
  }

  const lista = movimentacoes
    .filter(m => {
      const d = new Date(m.criadoEm);
      const inicio = dataInicio ? new Date(dataInicio + 'T00:00:00') : null;
      const fim = dataFim ? new Date(dataFim + 'T23:59:59') : null;
      return (
        (!busca || m.produtoNome.toLowerCase().includes(busca.toLowerCase())) &&
        (!filtroTipo || m.tipo === filtroTipo) &&
        (!filtroUsuario || m.usuario === filtroUsuario) &&
        (!inicio || d >= inicio) &&
        (!fim || d <= fim)
      );
    })
    .slice()
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

  return (
    <div className="animate-fadein">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <span className="text-white text-lg">📋</span>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Histórico de Movimentações</h1>
          <p className="text-sm text-slate-400">Entradas e saídas do estoque</p>
        </div>
      </div>

      {can.fazerMovimentacoes && (
        <div className="bg-white rounded-2xl shadow-card border border-indigo-100 p-6 mb-6 animate-slideup">
          <h2 className="text-base font-bold mb-4 text-slate-700 flex items-center gap-2">
            <span className="w-2 h-5 rounded bg-gradient-to-b from-indigo-500 to-purple-500 inline-block"></span>
            Registrar Movimentação
          </h2>
          <form onSubmit={enviar} className="flex flex-wrap gap-4 items-end">
            {/* Tipo com visual CHEGOU / SAIU */}
            <div>
              <label className="text-xs font-semibold block mb-1.5 text-slate-500 uppercase tracking-wide">Tipo *</label>
              <select
                className="rounded-xl px-3 py-2.5 text-sm font-semibold border-2 outline-none focus:ring-2 transition-all cursor-pointer"
                style={{
                  borderColor: form.tipo === 'ENTRADA' ? '#10b981' : '#ef4444',
                  color:       form.tipo === 'ENTRADA' ? '#065f46' : '#991b1b',
                  background:  form.tipo === 'ENTRADA' ? '#d1fae5' : '#fee2e2',
                  minWidth: 180,
                }}
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              >
                <option value="ENTRADA">⬆ ENTRADA — produto chegou</option>
                <option value="SAIDA">⬇ SAÍDA — produto saiu</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5 text-slate-500 uppercase tracking-wide">Produto *</label>
              <select className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-60 outline-none focus:border-indigo-400" value={form.produtoId} onChange={e => setForm(f => ({ ...f, produtoId: e.target.value }))}>
                <option value="">Selecione o produto...</option>
                {produtosAtivos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            {produtoSelecionado && (
              <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Estoque atual</span>
                <span className={`text-2xl font-extrabold ${produtoSelecionado.estoqueAtual <= produtoSelecionado.estoqueMinimo ? 'text-red-600' : 'text-emerald-600'}`}>
                  {produtoSelecionado.estoqueAtual}
                </span>
                <span className="text-[10px] text-slate-400">mín: {produtoSelecionado.estoqueMinimo}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold block mb-1.5 text-slate-500 uppercase tracking-wide">Quantidade *</label>
              <input type="number" min="1" className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-28 outline-none focus:border-indigo-400" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5 text-slate-500 uppercase tracking-wide">Observação</label>
              <input className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm w-64 outline-none focus:border-indigo-400" value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Opcional..." />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-white text-sm shadow-glow transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }}
            >
              Registrar
            </button>
          </form>
          {erro &&   <p className="mt-3 text-red-700 text-sm font-medium bg-red-50 border border-red-200 px-4 py-2 rounded-xl">{erro}</p>}
          {sucesso && <p className="mt-3 text-emerald-700 text-sm font-medium bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">✓ {sucesso}</p>}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-wrap bg-white p-4 rounded-2xl border border-indigo-50 shadow-card">
        <input className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-48 outline-none focus:border-indigo-400" placeholder="🔍 Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} />
        <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="ENTRADA">⬆ Entradas</option>
          <option value="SAIDA">⬇ Saídas</option>
        </select>
        <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" value={filtroUsuario} onChange={e => setFiltroUsuario(e.target.value)}>
          <option value="">Todos os usuários</option>
          {usuarios.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>De:</span>
          <input type="date" className="border border-slate-200 rounded-xl px-2 py-2 text-sm outline-none" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          <span>Até:</span>
          <input type="date" className="border border-slate-200 rounded-xl px-2 py-2 text-sm outline-none" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
        <span className="text-sm text-slate-400 self-center ml-auto">{lista.length} registro(s)</span>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-card border border-indigo-50">
        <table className="w-full">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-left">Produto</th>
              <th className="p-3 text-center">Quantidade</th>
              <th className="p-3 text-center">Antes → Depois</th>
              <th className="p-3 text-left">Usuário</th>
              <th className="p-3 text-left">Observação</th>
              <th className="p-3 text-left">Data/Hora</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr><td colSpan={7} className="text-center p-10 text-slate-400">Nenhuma movimentação encontrada.</td></tr>
            )}
            {lista.map(m => (
              <tr key={m.id} className="border-t border-slate-50 text-sm hover:bg-indigo-50/40 transition">
                <td className="p-3">
                  {m.tipo === 'ENTRADA' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      ⬆ CHEGOU
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                      ⬇ SAIU
                    </span>
                  )}
                </td>
                <td className="p-3 font-semibold text-slate-700">{m.produtoNome}</td>
                <td className="p-3 text-center font-bold text-slate-700">{m.quantidade}</td>
                <td className="p-3 text-center text-slate-500">
                  <span className="font-mono">{m.estoqueAntes}</span>
                  <span className="text-slate-400 mx-1">→</span>
                  <span className={`font-mono font-semibold ${m.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-red-600'}`}>{m.estoqueDepois}</span>
                </td>
                <td className="p-3 text-slate-500">{m.usuario} <span className="text-[10px] text-slate-400 bg-slate-100 rounded px-1">({m.usuarioPerfil})</span></td>
                <td className="p-3 text-slate-400 italic">{m.observacao || '—'}</td>
                <td className="p-3 text-slate-400 text-xs">{new Date(m.criadoEm).toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

