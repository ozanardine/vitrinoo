// Utilitários para teste
export const TEST_STORES = {
  store1: {
    name: 'Loja Teste 1',
    slug: 'loja-teste-1'
  },
  store2: {
    name: 'Loja Teste 2', 
    slug: 'loja-teste-2'
  }
};

// Função para limpar dados de teste
export async function clearTestData() {
  if (process.env.NODE_ENV === 'development') {
    sessionStorage.clear();
    localStorage.clear();
  }
}

// Função para criar sessão de teste
export function createTestSession() {
  const testId = Math.random().toString(36).substring(7);
  sessionStorage.setItem('test_session', testId);
  return testId;
}

// Função para verificar se é sessão de teste
export function isTestSession() {
  return !!sessionStorage.getItem('test_session');
}

// Função para gerar dados de teste
export function generateTestData(type: 'products' | 'categories', count: number = 5) {
  const data = [];
  for (let i = 0; i < count; i++) {
    if (type === 'products') {
      data.push({
        id: `test-${i}`,
        title: `Produto Teste ${i}`,
        description: `Descrição do produto teste ${i}`,
        price: Math.random() * 100,
        images: [`https://picsum.photos/200/300?random=${i}`]
      });
    } else {
      data.push({
        id: `test-${i}`,
        name: `Categoria Teste ${i}`,
        slug: `categoria-teste-${i}`
      });
    }
  }
  return data;
}