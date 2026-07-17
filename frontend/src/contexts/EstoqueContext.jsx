// Contexto global de dados do sistema de estoque
// O banco (API) é a única fonte de verdade dos produtos; o localStorage é apenas cache de leitura.
import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiRequest } from '../services/apiClient';

const PRODUTOS_KEY = 'zkprodutos';
const MOV_KEY = 'zkmovimentacoes';
const AUDIT_KEY = 'zkauditoria';
const CACHE_VERSION_KEY = 'zkCacheVersion';
// Trocar esta versão descarta o cache local de todos os navegadores no próximo acesso.
// v26 remove o catálogo antigo embutido no código, cujos IDs não existiam no banco.
const CACHE_VERSION = 'v26-api-only';
const POLL_INTERVAL_MS = 1000;
const SYNC_STORAGE_EVENT_KEY = 'zkSyncPing';
const SYNC_BROADCAST_CHANNEL = 'siz-sync';
const PENDING_PRODUCT_EDITS_KEY = 'zkPendingProductEdits';
const OBS_BACKUP_KEY = 'zkObservacoesBackupV25';

const BASE_URL = import.meta.env.BASE_URL || '/';
function withBase(url) {
  if (!url || typeof url !== 'string') return url;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (url.startsWith(BASE_URL)) return url;
  if (url.startsWith('/')) return `${BASE_URL}${url.slice(1)}`;
  return `${BASE_URL}${url}`;
}

function normalizeProdutos(lista) {
  return (lista || []).map((p) => ({
    ...p,
    imagem: withBase(p.imagem),
    observacao: typeof p?.observacao === 'string' ? p.observacao : '',
  }));
}


function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function loadPendingProductEdits() {
  return loadData(PENDING_PRODUCT_EDITS_KEY, []);
}

function savePendingProductEdits(data) {
  saveData(PENDING_PRODUCT_EDITS_KEY, data);
}

// Descarta uma \u00fanica vez o cache gravado por vers\u00f5es que embutiam o cat\u00e1logo no c\u00f3digo.
// Sem isso, um navegador que j\u00e1 tenha produtos com IDs inexistentes continuaria
// reenviando edi\u00e7\u00f5es imposs\u00edveis de gravar no banco.
function limparCacheAntigo() {
  if (localStorage.getItem(CACHE_VERSION_KEY) === CACHE_VERSION) return;

  // Até esta versão a observação só existia neste navegador e nunca chegou ao banco.
  // Guarda uma cópia antes de limpar: é a única existente, e apagá-la seria perda real.
  try {
    const antigos = loadData(PRODUTOS_KEY, []);
    const observacoes = (antigos || [])
      .filter((p) => String(p?.observacao || '').trim())
      .map((p) => ({ nome: p.nome, codigo: p.codigo, observacao: p.observacao }));
    if (observacoes.length) {
      saveData(OBS_BACKUP_KEY, { salvoEm: new Date().toISOString(), observacoes });
      console.warn(
        `[SIZ] ${observacoes.length} observação(ões) de produto existiam apenas neste navegador ` +
        `e não estão no banco. Cópia salva em localStorage["${OBS_BACKUP_KEY}"].`
      );
    }
  } catch {}

  for (const k of [PRODUTOS_KEY, MOV_KEY, PENDING_PRODUCT_EDITS_KEY]) {
    localStorage.removeItem(k);
  }
  localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
}

// Produtos s\u00f3 existem se vierem do banco: sem API, a tela fica vazia em vez de exibir dado falso.
function initProdutos() {
  limparCacheAntigo();
  return normalizeProdutos(loadData(PRODUTOS_KEY, []));
}



const EstoqueContext = createContext();

function toApiProduct(p) {
  return {
    name: p.nome || '',
    code: p.codigo || '',
    category: p.categoria || '',
    model: p.modelo || '',
    size: p.tamanho || '',
    material: p.material || '',
    color: p.cor || '',
    stockCurrent: Number(p.estoqueAtual || 0),
    stockMinimum: Number(p.estoqueMinimo || 0),
    controlsStock: p.controlaEstoque ?? true,
    alertEnabled: p.geraAlerta ?? true,
    active: p.ativo ?? true,
    image: p.imagem || '',
    note: p.observacao || '',
  };
}

function fromApiProduct(p) {
  return {
    id: p.id,
    nome: p.name,
    codigo: p.code || '',
    categoria: p.category || '',
    modelo: p.model || '',
    tamanho: p.size || '',
    material: p.material || '',
    cor: p.color || '',
    estoqueAtual: Number(p.stockCurrent || 0),
    estoqueMinimo: Number(p.stockMinimum || 0),
    controlaEstoque: p.controlsStock ?? true,
    geraAlerta: p.alertEnabled ?? true,
    ativo: p.active ?? true,
    imagem: withBase(p.image || ''),
    observacao: p.note || '',
    criadoEm: p.createdAt || new Date().toISOString(),
    atualizadoEm: p.updatedAt || new Date().toISOString(),
  };
}

function fromApiMovement(m) {
  return {
    id: m.id,
    produtoId: m.productId,
    produtoNome: m.product?.name || '',
    tipo: m.type,
    quantidade: Number(m.quantity || 0),
    observacao: m.note || '',
    usuario: m.user?.name || 'Sistema',
    usuarioPerfil: m.user?.role || '',
    estoqueAntes: m.beforeStock ?? null,
    estoqueDepois: m.afterStock ?? null,
    criadoEm: m.createdAt || new Date().toISOString(),
  };
}

function buildAuditNote(action, user, produto, extras = {}) {
  const nome = user?.nome || 'Sistema';
  const perfil = user?.perfil || 'N/A';
  const produtoNome = produto?.nome || 'Produto';
  const payload = {
    action,
    user: nome,
    role: perfil,
    product: produtoNome,
    code: produto?.codigo || '',
    ...extras,
  };
  return `[AUDIT] ${JSON.stringify(payload)}`;
}

export function EstoqueProvider({ children }) {
  const [produtos, setProdutosState] = useState(() => initProdutos());
  const [movimentacoes, setMovimentacoesState] = useState(() => loadData(MOV_KEY, []));
  const [auditoria, setAuditoriaState] = useState(() => loadData(AUDIT_KEY, []));
  const [syncStatus, setSyncStatus] = useState({ ok: true, degraded: false, productsOk: true, movementsOk: true, pendingEdits: 0, lastSync: null });
  // Verdadeiro até a primeira resposta do banco, para diferenciar "ainda carregando" de "catálogo vazio".
  const [carregando, setCarregando] = useState(true);
  const syncNowRef = React.useRef(async () => {});
  const syncFailStreakRef = React.useRef(0);
  const lastSyncSuccessAtRef = React.useRef(Date.now());
  const pendingEditsRef = React.useRef(loadPendingProductEdits());

  const anunciarMudanca = useCallback(() => {
    const now = String(Date.now());
    try {
      localStorage.setItem(SYNC_STORAGE_EVENT_KEY, now);
    } catch {}
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel(SYNC_BROADCAST_CHANNEL);
        bc.postMessage({ type: 'SYNC_NOW', ts: now });
        bc.close();
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    let mounted = true;
    let timer = null;
    let inFlight = false;

    async function syncFromApi() {
      if (inFlight) return;
      inFlight = true;
      try {
        await flushPendingEdits();

        const [productsResp, movementsResp] = await Promise.all([
          apiRequest('/api/products'),
          apiRequest('/api/movements'),
        ]);

        if (!mounted) return;

        const productsOk = productsResp.ok && productsResp.data?.ok && Array.isArray(productsResp.data.data);
        const movementsOk = movementsResp.ok && movementsResp.data?.ok && Array.isArray(movementsResp.data.data);

        if (productsOk) {
          setCarregando(false);
          const mapped = productsResp.data.data.map(fromApiProduct);
          // A observação agora vem do banco como qualquer outro campo. Preservar a cópia
          // local aqui era o que prendia o texto no navegador de quem escreveu.
          setProdutosState((prev) => {
            const merged = normalizeProdutos(mapped);
            const sameLen = prev.length === merged.length;
            const sameJson = sameLen && JSON.stringify(prev) === JSON.stringify(merged);
            if (sameJson) return prev;
            saveData(PRODUTOS_KEY, merged);
            return merged;
          });
        }

        if (movementsOk) {
          const mapped = movementsResp.data.data.map(fromApiMovement);
          setMovimentacoesState((prev) => {
            const sameLen = prev.length === mapped.length;
            const sameJson = sameLen && JSON.stringify(prev) === JSON.stringify(mapped);
            if (sameJson) return prev;
            saveData(MOV_KEY, mapped);
            return mapped;
          });
        }

        // Status resiliente: considera "ok" quando produtos estao sincronizados.
        // Movimentacoes podem oscilar sem derrubar o painel principal de produtos.
        const nextOk = productsOk;
        const nextDegraded = productsOk && !movementsOk;

        if (nextOk) {
          syncFailStreakRef.current = 0;
          lastSyncSuccessAtRef.current = Date.now();
        } else {
          syncFailStreakRef.current += 1;
        }

        const shouldMarkOffline = !nextOk && syncFailStreakRef.current >= 3 && (Date.now() - lastSyncSuccessAtRef.current) > 5000;

        setSyncStatus((prev) => ({
          ...prev,
          ok: shouldMarkOffline ? false : true,
          degraded: shouldMarkOffline ? false : nextDegraded,
          productsOk,
          movementsOk,
          pendingEdits: pendingEditsRef.current.length,
          lastSync: new Date(),
          error: shouldMarkOffline ? (productsResp.error || movementsResp.error || 'Falha de sincronizacao') : undefined,
        }));
      } catch (e) {
        if (mounted) {
          syncFailStreakRef.current += 1;
          const shouldMarkOffline = syncFailStreakRef.current >= 3 && (Date.now() - lastSyncSuccessAtRef.current) > 5000;
          setSyncStatus((prev) => ({
            ...prev,
            ok: shouldMarkOffline ? false : prev.ok,
            degraded: shouldMarkOffline ? false : prev.degraded,
            pendingEdits: pendingEditsRef.current.length,
            lastSync: new Date(),
            error: shouldMarkOffline ? String(e?.message || e) : prev.error,
          }));
        }
      } finally {
        inFlight = false;
      }
    }

    syncNowRef.current = syncFromApi;

    // Sincronização inicial + polling curto para refletir alterações entre usuários quase em tempo real
    syncFromApi();
    timer = setInterval(syncFromApi, POLL_INTERVAL_MS);

    function onStorage(e) {
      if (e.key === SYNC_STORAGE_EVENT_KEY) syncFromApi();
    }
    window.addEventListener('storage', onStorage);

    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel(SYNC_BROADCAST_CHANNEL);
        bc.onmessage = () => syncFromApi();
      } catch {}
    }

    // Permite forçar refresh manual de qualquer componente
    window.__sizSyncNow = syncFromApi;

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
      window.removeEventListener('storage', onStorage);
      if (bc) bc.close();
      delete window.__sizSyncNow;
    };
  }, []);

  // Salva e atualiza estado
  const setProdutos = useCallback((fn) => {
    setProdutosState(prev => {
      const next = normalizeProdutos(typeof fn === 'function' ? fn(prev) : fn);
      saveData(PRODUTOS_KEY, next);
      return next;
    });
  }, []);

  const setMovimentacoes = useCallback((fn) => {
    setMovimentacoesState(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      saveData(MOV_KEY, next);
      return next;
    });
  }, []);

  const setAuditoria = useCallback((fn) => {
    setAuditoriaState(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      saveData(AUDIT_KEY, next);
      return next;
    });
  }, []);

  // Registrar auditoria
  const registrarAuditoria = useCallback((usuario, entidade, acao, antes, depois) => {
    const log = {
      id: Date.now(),
      usuario: usuario?.nome || 'Sistema',
      perfil: usuario?.perfil || '',
      entidade,
      acao,
      antes: antes ? JSON.stringify(antes) : null,
      depois: depois ? JSON.stringify(depois) : null,
      criadoEm: new Date().toISOString(),
    };
    setAuditoria(prev => [log, ...prev]);
  }, [setAuditoria]);

  const registrarHistoricoProdutoGlobal = useCallback((produtoId, action, user, produto, extras = {}) => {
    if (!produtoId) return;
    apiRequest('/api/movements', {
      method: 'POST',
      body: JSON.stringify({
        productId: Number(produtoId),
        type: 'AUDIT',
        quantity: 1,
        note: buildAuditNote(action, user, produto, extras),
      }),
    }).then(() => {
      anunciarMudanca();
      window.__sizSyncNow?.();
    }).catch(() => {});
  }, [anunciarMudanca]);

  const enqueuePendingEdit = useCallback((id, payload, user) => {
    const current = pendingEditsRef.current || [];
    const next = [
      ...current.filter((x) => Number(x.id) !== Number(id)),
      { id: Number(id), payload, by: user?.nome || 'Sistema', queuedAt: new Date().toISOString() },
    ];
    pendingEditsRef.current = next;
    savePendingProductEdits(next);
    setSyncStatus((prev) => ({
      ...prev,
      ok: true,
      degraded: true,
      pendingEdits: next.length,
      lastSync: new Date(),
      error: 'Alteracao pendente de sincronizacao com a API',
    }));
  }, []);

  const flushPendingEdits = useCallback(async () => {
    const queue = pendingEditsRef.current || [];
    if (!queue.length) return;

    const remaining = [];
    const rejeitados = [];
    for (const item of queue) {
      const resp = await apiRequest(`/api/products/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify(toApiProduct(item.payload || {})),
      });
      if (resp.ok && resp.data?.ok) continue;

      // 4xx = o servidor recusou a alteração; repetir não muda o resultado.
      // Só vale reenfileirar falha de rede ou erro do servidor (5xx).
      if (resp.status >= 400 && resp.status < 500) {
        rejeitados.push({ item, error: resp.error || `HTTP ${resp.status}` });
        continue;
      }
      remaining.push(item);
    }

    pendingEditsRef.current = remaining;
    savePendingProductEdits(remaining);

    if (rejeitados.length) {
      // A alteração local não existe no banco: desfaz para não mostrar dado que ninguém mais vê.
      const ids = new Set(rejeitados.map((r) => r.item.id));
      setProdutosState((prev) => prev.filter((p) => !ids.has(p.id)));
      setSyncStatus((prev) => ({
        ...prev,
        ok: true,
        degraded: false,
        pendingEdits: remaining.length,
        rejeitadas: rejeitados.map((r) => `${r.item.payload?.nome || r.item.id}: ${r.error}`),
        error: `${rejeitados.length} alteração(ões) recusadas pelo servidor e desfeitas. Refaça a edição na lista atual.`,
      }));
      window.__sizSyncNow?.();
      return;
    }

    setSyncStatus((prev) => ({
      ...prev,
      pendingEdits: remaining.length,
      degraded: remaining.length > 0,
      error: remaining.length ? prev.error : undefined,
    }));

    if (!remaining.length) anunciarMudanca();
  }, [anunciarMudanca]);

  // CRUD Produtos
  const criarProduto = useCallback((dados, user) => {
    const novo = { ...dados, id: Date.now(), criadoEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() };
    setProdutos(prev => [...prev, novo]);
    registrarAuditoria(user, 'PRODUTO', 'CRIACAO', null, novo);

    apiRequest('/api/products', {
      method: 'POST',
      body: JSON.stringify(toApiProduct(novo)),
    }).then((resp) => {
      if (resp.ok && resp.data?.ok && resp.data?.data) {
        const apiMapped = fromApiProduct(resp.data.data);
        setProdutos((prev) => prev.map((p) => (p.id === novo.id ? apiMapped : p)));
        registrarHistoricoProdutoGlobal(apiMapped.id, 'CRIACAO_PRODUTO', user, apiMapped, {
          stockCurrent: apiMapped.estoqueAtual,
          stockMinimum: apiMapped.estoqueMinimo,
        });
        anunciarMudanca();
        window.__sizSyncNow?.();
        setTimeout(() => window.__sizSyncNow?.(), 600);
        return;
      }

      // Falha ao salvar no backend: remove o item local para evitar divergência entre usuários.
      setProdutos((prev) => prev.filter((p) => p.id !== novo.id));
      setSyncStatus({ ok: false, lastSync: new Date(), error: resp?.error || 'Falha ao salvar produto no servidor' });
    });

    return novo;
  }, [setProdutos, registrarAuditoria, anunciarMudanca, registrarHistoricoProdutoGlobal]);

  const editarProduto = useCallback((id, dados, user) => {
    let antes = null;
    setProdutos(prev => prev.map(p => {
      if (p.id === id) {
        antes = p;
        return { ...p, ...dados, atualizadoEm: new Date().toISOString() };
      }
      return p;
    }));
    registrarAuditoria(user, 'PRODUTO', 'EDICAO', antes, { ...antes, ...dados });

    const payload = { ...(antes || {}), ...dados };
    apiRequest(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiProduct(payload)),
    }).then((resp) => {
      if (resp.ok && resp.data?.ok && resp.data?.data) {
        const apiMapped = fromApiProduct(resp.data.data);
        setProdutos((prev) => prev.map((p) => (p.id === id ? apiMapped : p)));
        registrarHistoricoProdutoGlobal(id, 'EDICAO_PRODUTO', user, apiMapped, {
          beforeStock: Number(antes?.estoqueAtual ?? 0),
          afterStock: Number(apiMapped.estoqueAtual ?? 0),
        });
        anunciarMudanca();
        window.__sizSyncNow?.();
        setTimeout(() => window.__sizSyncNow?.(), 600);
        return;
      }

      // 4xx = o servidor recusou (ex.: produto não existe mais). Retentar não resolve e
      // manter o valor local faria o autor ver uma alteração que ninguém mais enxerga.
      if (resp.status >= 400 && resp.status < 500) {
        setProdutosState((prev) => prev.map((p) => (p.id === id && antes ? antes : p)));
        setSyncStatus((prev) => ({
          ...prev,
          ok: true,
          degraded: false,
          lastSync: new Date(),
          error: `Alteração recusada pelo servidor (${resp.error || `HTTP ${resp.status}`}) e desfeita. Nada foi gravado.`,
        }));
        window.__sizSyncNow?.();
        return;
      }

      // Falha de rede ou 5xx: a alteração ainda pode ser gravada, então entra na fila de retry.
      enqueuePendingEdit(id, payload, user);
      setSyncStatus((prev) => ({
        ...prev,
        ok: true,
        degraded: true,
        pendingEdits: (pendingEditsRef.current || []).length,
        lastSync: new Date(),
        error: resp?.error || 'Sem conexão com o servidor; alteração na fila e será enviada ao reconectar',
      }));
      window.__sizSyncNow?.();
    });
  }, [setProdutos, registrarAuditoria, anunciarMudanca, registrarHistoricoProdutoGlobal, enqueuePendingEdit]);

  const excluirProduto = useCallback((id, user) => {
    let antes = null;
    setProdutos(prev => {
      antes = prev.find(p => p.id === id);
      return prev.filter(p => p.id !== id);
    });
    registrarAuditoria(user, 'PRODUTO', 'EXCLUSAO', antes, null);

    const auditPromise = antes
      ? apiRequest('/api/movements', {
          method: 'POST',
          body: JSON.stringify({
            productId: Number(id),
            type: 'AUDIT',
            quantity: 1,
            note: buildAuditNote('EXCLUSAO_PRODUTO', user, antes),
          }),
        }).catch(() => null)
      : Promise.resolve(null);

    auditPromise.finally(() => apiRequest(`/api/products/${id}`, { method: 'DELETE' }).then((resp) => {
      if (resp.ok && resp.data?.ok) {
        anunciarMudanca();
        window.__sizSyncNow?.();
        setTimeout(() => window.__sizSyncNow?.(), 600);
        return;
      }

      // Falha ao excluir no backend: restaura item removido localmente.
      if (antes) {
        setProdutos((prev) => [antes, ...prev]);
      }
      setSyncStatus({ ok: false, lastSync: new Date(), error: resp?.error || 'Falha ao excluir produto no servidor' });
    }));
  }, [setProdutos, registrarAuditoria, anunciarMudanca]);

  // Movimentações
  const registrarMovimentacao = useCallback((dados, user) => {
    const { produtoId, tipo, quantidade, observacao } = dados;
    let erro = null;
    let movNova = null;

    setProdutos(prev => {
      const produto = prev.find(p => p.id === Number(produtoId));
      if (!produto) { erro = 'Produto não encontrado'; return prev; }
      if (tipo === 'SAIDA' && produto.estoqueAtual < Number(quantidade)) {
        erro = `Estoque insuficiente! Disponível: ${produto.estoqueAtual}`;
        return prev;
      }
      const estoqueAntes = produto.estoqueAtual;
      const estoqueDepois = tipo === 'ENTRADA'
        ? produto.estoqueAtual + Number(quantidade)
        : produto.estoqueAtual - Number(quantidade);

      movNova = {
        id: Date.now(),
        produtoId: Number(produtoId),
        produtoNome: produto.nome,
        tipo,
        quantidade: Number(quantidade),
        observacao: observacao || '',
        usuario: user?.nome || '',
        usuarioPerfil: user?.perfil || '',
        estoqueAntes,
        estoqueDepois,
        criadoEm: new Date().toISOString(),
      };

      setMovimentacoes(prevM => {
        const next = [movNova, ...prevM];
        saveData(MOV_KEY, next);
        return next;
      });

      registrarAuditoria(user, 'MOVIMENTACAO', 'MOVIMENTACAO',
        { estoque: estoqueAntes },
        { estoque: estoqueDepois, tipo, quantidade: Number(quantidade) }
      );

      return prev.map(p => p.id === Number(produtoId)
        ? { ...p, estoqueAtual: estoqueDepois, atualizadoEm: new Date().toISOString() }
        : p
      );
    });

    if (!erro && movNova) {
      apiRequest('/api/movements', {
        method: 'POST',
        body: JSON.stringify({
          productId: movNova.produtoId,
          type: movNova.tipo,
          quantity: movNova.quantidade,
          note: movNova.observacao,
        }),
      }).then((resp) => {
        if (resp.ok && resp.data?.ok) {
          anunciarMudanca();
          window.__sizSyncNow?.();
          setTimeout(() => window.__sizSyncNow?.(), 600);
          return;
        }

        // Falha ao persistir movimentação: remove movimentação local e restaura estoque.
        setMovimentacoes((prev) => prev.filter((m) => m.id !== movNova.id));
        setProdutos((prev) => prev.map((p) => (
          p.id === movNova.produtoId
            ? { ...p, estoqueAtual: movNova.estoqueAntes, atualizadoEm: new Date().toISOString() }
            : p
        )));
        setSyncStatus({ ok: false, lastSync: new Date(), error: resp?.error || 'Falha ao salvar movimentação no servidor' });
      });
    }

    return { erro };
  }, [setProdutos, setMovimentacoes, registrarAuditoria, anunciarMudanca]);

  // Alertas
  const alertas = produtos.filter(p => p.geraAlerta && p.estoqueAtual <= p.estoqueMinimo && p.ativo);

  return (
    <EstoqueContext.Provider value={{
      produtos, movimentacoes, auditoria, alertas,
      criarProduto, editarProduto, excluirProduto, registrarMovimentacao,
      registrarAuditoria,
      syncStatus,
      carregando,
    }}>
      {children}
    </EstoqueContext.Provider>
  );
}

export function useEstoque() {
  return useContext(EstoqueContext);
}
