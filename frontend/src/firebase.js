// Configuração do Firebase — Zenith Estoque
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Lê configuração do Firebase a partir de variáveis de ambiente Vite (.env / Netlify UI)
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validação leve para evitar build/start sem variáveis
const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length) {
  console.warn(
    '[firebase] Variáveis ausentes:', missing.join(', '),
    '\nDefina-as em .env.local ou no painel de variáveis (Netlify).'
  );
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Registra uma ação no histórico de preços no Firestore
export async function logHistoricoPrecos(usuario, perfil, acao, descricao, antes = null, depois = null) {
  try {
    await addDoc(collection(db, 'historico_precos'), {
      usuario,
      perfil,
      acao,
      descricao,
      antes:  antes  ? JSON.stringify(antes)  : null,
      depois: depois ? JSON.stringify(depois) : null,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Erro ao registrar histórico:', e);
  }
}
