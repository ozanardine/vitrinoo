import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function generateProductDescription(
  title: string,
  brand: string,
  category: string,
  additionalInfo?: string
): Promise<string> {
  try {
    // Configurando o modelo específico para geração de texto
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
    Crie uma descrição profissional e persuasiva para um produto de e-commerce com as seguintes informações:

    PRODUTO:
    Título: ${title}
    Marca: ${brand}
    Categoria: ${category}
    ${additionalInfo ? `Informações adicionais: ${additionalInfo}` : ''}

    DIRETRIZES DE ESTRUTURA:
    1. Introdução (1 parágrafo):
      - Apresentar o produto de forma atraente
      - Destacar seu principal diferencial
      - Mencionar a marca e sua reputação

    2. Benefícios e Características (1-2 parágrafos):
      - Listar 3-4 benefícios principais
      - Detalhar características técnicas relevantes
      - Explicar como o produto resolve problemas do usuário
      - Incluir casos de uso típicos

    3. Conclusão (1 parágrafo):
      - Reforçar o valor do produto
      - Incluir uma chamada para ação sutil

    REQUISITOS DE ESTILO:
    - Usar linguagem persuasiva e profissional
    - Tom: confiante e especialista
    - Evitar exageros ou superlativos excessivos
    - Manter objetividade e credibilidade
    - Português brasileiro formal mas acessível

    OTIMIZAÇÃO SEO:
    - Incluir naturalmente palavras-chave relacionadas à categoria
    - Usar termos de pesquisa comuns do setor
    - Incluir especificações técnicas relevantes
    - Mencionar a marca algumas vezes de forma natural

    RESTRIÇÕES:
    - Não mencionar preços ou promoções
    - Evitar comparações diretas com concorrentes
    - Não fazer promessas irrealistas
    - Manter entre 150-300 palavras

    FORMATAÇÃO:
    - Usar parágrafos bem definidos
    - Incluir quebras de linha para legibilidade
    - Pode usar marcadores para características principais
    - Evitar formatação complexa

    ATENÇÃO ESPECIAL:
    - Adaptar tom e vocabulário à categoria do produto
    - Considerar o público-alvo típico desta categoria
    - Enfatizar diferenciais específicos mencionados nas informações adicionais
    - Manter consistência com a identidade da marca
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    const description = response.text()
      .trim()
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[*_]/g, '');
    
    return description;
  } catch (error) {
    console.error('Erro ao gerar descrição:', error);
    throw new Error('Não foi possível gerar a descrição. Por favor, tente novamente.');
  }
}