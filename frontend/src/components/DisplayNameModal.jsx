import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DisplayNameModal() {
  const { user, setDisplayName } = useAuth();
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  if (!user || !user.mustSetDisplayName) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    const limpo = nome.trim();
    if (limpo.length < 2 || limpo.length > 40) {
      setErro('O nome deve ter entre 2 e 40 caracteres.');
      return;
    }
    try {
      setSalvando(true);
      await setDisplayName(limpo);
    } catch (err) {
      setErro(err.message || 'Falha ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 text-white"
      >
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">👋</div>
          <h2 className="text-2xl font-bold mb-2">Bem-vinda!</h2>
          <p className="text-slate-300 text-sm">
            Como você gostaria de ser chamada? Esse nome aparecerá no chat e em todo o sistema.
          </p>
        </div>

        <label className="block text-sm font-medium text-slate-200 mb-2">
          Seu nome
        </label>
        <input
          autoFocus
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={40}
          placeholder="Ex.: Lari, Aninha, Bia..."
          className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition"
        />

        {erro && (
          <div className="mt-3 text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="mt-6 w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
        >
          {salvando ? 'Salvando...' : 'Confirmar'}
        </button>

        <p className="mt-4 text-xs text-slate-400 text-center">
          Você pode pedir ao Administrador para alterar depois, se precisar.
        </p>
      </form>
    </div>
  );
}
