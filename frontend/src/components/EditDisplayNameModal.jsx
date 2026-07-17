import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Modal para o próprio usuário editar nome de exibição e foto de perfil.
 * Abrindo via Topbar (clique no avatar) ou Sidebar ("Editar meu nome").
 *
 * A foto é redimensionada e comprimida no navegador (canvas) antes do
 * upload, ficando em torno de 256x256 e ~150-200KB em data URL base64,
 * que o backend persiste em User.avatarUrl.
 */
const AVATAR_MAX_DIM = 256;
const AVATAR_TARGET_BYTES = 180_000; // ~180 KB de base64

async function fileToCompressedDataUrl(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const ratio = Math.min(1, AVATAR_MAX_DIM / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  let quality = 0.85;
  let out = canvas.toDataURL('image/jpeg', quality);
  while (out.length > AVATAR_TARGET_BYTES && quality > 0.35) {
    quality -= 0.1;
    out = canvas.toDataURL('image/jpeg', quality);
  }
  return out;
}

export default function EditDisplayNameModal({ open, onClose }) {
  const { user, setProfile } = useAuth();
  const [nome, setNome] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [removerFoto, setRemoverFoto] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) {
      setNome(user?.displayName || user?.nome || '');
      setAvatarUrl(user?.avatarUrl || '');
      setErro('');
      setSalvando(false);
      setRemoverFoto(false);
    }
  }, [open, user]);

  if (!open || !user) return null;

  async function handlePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro('');
    if (!/^image\//.test(file.type)) {
      setErro('Selecione uma imagem (PNG, JPG, WEBP).');
      return;
    }
    try {
      const comp = await fileToCompressedDataUrl(file);
      setAvatarUrl(comp);
      setRemoverFoto(false);
    } catch {
      setErro('Não consegui processar essa imagem. Tente outra.');
    }
  }

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
      const payload = { displayName: limpo };
      if (removerFoto) payload.avatarUrl = '';
      else if (avatarUrl && avatarUrl !== (user?.avatarUrl || '')) payload.avatarUrl = avatarUrl;
      await setProfile(payload);
      onClose?.();
    } catch (err) {
      setErro(err.message || 'Falha ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  const previewUrl = removerFoto ? '' : avatarUrl;
  const inicial = (nome || user?.nome || '?').charAt(0).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={() => !salvando && onClose?.()}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 text-white"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Meu perfil</h2>
          <p className="text-slate-300 text-sm">
            Defina como você quer aparecer para todos no sistema (chat,
            separações, auditoria).
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-slate-600 hover:border-blue-500 transition shadow-lg group"
            title="Alterar foto"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-4xl font-bold">
                {inicial}
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center text-xs font-semibold opacity-0 group-hover:opacity-100">
              Trocar foto
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePick}
          />
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 rounded-md bg-slate-700/60 hover:bg-slate-700"
            >
              Escolher imagem
            </button>
            {(previewUrl || user?.avatarUrl) && (
              <button
                type="button"
                onClick={() => { setRemoverFoto(true); setAvatarUrl(''); }}
                className="px-3 py-1.5 rounded-md bg-red-900/40 hover:bg-red-900/60 text-red-200"
              >
                Remover foto
              </button>
            )}
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-200 mb-2">
          Seu nome
        </label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={40}
          placeholder="Ex.: Lari, Aninha, Bia..."
          className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition"
        />
        <div className="mt-2 text-[11px] text-slate-500 text-right">
          {nome.trim().length}/40
        </div>

        {erro && (
          <div className="mt-3 text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
            {erro}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => !salvando && onClose?.()}
            disabled={salvando}
            className="flex-1 py-3 rounded-lg font-semibold bg-slate-700/60 hover:bg-slate-700 disabled:opacity-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="flex-1 py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-400 text-center">
          O e-mail e o perfil de acesso continuam os mesmos.
        </p>
      </form>
    </div>
  );
}
