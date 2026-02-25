// Configuração do Firebase — Zenith Estoque
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyDpOQ48NLldEPwAsLlTI24y-TDFDMQjhxo',
  authDomain:        'zenith-estoque.firebaseapp.com',
  projectId:         'zenith-estoque',
  storageBucket:     'zenith-estoque.firebasestorage.app',
  messagingSenderId: '300902589140',
  appId:             '1:300902589140:web:b84ce78fd06e0daeba5141',
  measurementId:     'G-SBV8WPNEX7',
};

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
