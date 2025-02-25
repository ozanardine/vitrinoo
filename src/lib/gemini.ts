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
    1. Título Principal:
       - Use markdown # para criar um título atraente que inclua o nome do produto
    
    2. Introdução (1 parágrafo):
       - Apresente o produto de forma atraente usando **negrito** para pontos-chave
       - Destaque o principal diferencial do produto
       - Mencione a marca com *itálico* para enfatizar sua reputação
       - Inclua uma frase de impacto inicial que capture a atenção

    3. Visão Geral do Produto (subtítulo em ##):
       - Apresente uma visão geral concisa do produto e seu propósito
       - Use markdown > para destacar uma característica exclusiva como citação

    4. Principais Benefícios (subtítulo em ##):
       - Liste 3-5 benefícios principais usando marcadores de lista markdown (-)
       - Use **negrito** para destacar palavras-chave no início de cada benefício
       - Explique claramente como cada benefício resolve um problema específico do usuário

    5. Especificações Técnicas (subtítulo em ##):
       - Detalhe as especificações em uma lista de marcadores organizados
       - Inclua dimensões, materiais, compatibilidade, etc., conforme relevante para a categoria
       - Use formatação consistente com **rótulos em negrito:** seguidos das especificações

    6. Ideal Para (subtítulo em ##):
       - Liste 2-4 casos de uso específicos ou públicos ideais usando marcadores
       - Descreva brevemente por que o produto é perfeito para cada caso

    7. Conclusão (1 parágrafo):
       - Reforce o valor do produto
       - Inclua uma chamada para ação sutil usando *itálico*
       - Encerre com uma frase memorável sobre a experiência do produto

    REQUISITOS DE ESTILO E FORMATAÇÃO MARKDOWN:
    - Use **negrito** (com ** **) para destacar características e benefícios importantes
    - Use *itálico* (com * *) para ênfase sutil e elementos persuasivos
    - Use títulos markdown: # para título principal, ## para subtítulos de seção
    - Use listas com marcadores (- item) para enumerar características e benefícios
    - Use > para destacar frases importantes como citações
    - Separe seções com quebras de linha duplas para melhor legibilidade
    - Organize informações técnicas em formato conciso e escaneável
    - Use linguagem persuasiva e profissional com terminologia adequada à categoria

    TOM E LINGUAGEM:
    - Tom: profissional, especialista e confiante, mas acessível
    - Evite superlativos excessivos ou exageros ("o melhor", "o mais incrível")
    - Use vocabulário técnico apropriado para a categoria do produto
    - Português brasileiro formal, mas de fácil compreensão
    - Mantenha um equilíbrio entre informação técnica e benefícios emocionais

    OTIMIZAÇÃO SEO:
    - Inclua naturalmente palavras-chave relacionadas à categoria
    - Use terminologia específica do setor que potenciais compradores buscariam
    - Inclua especificações técnicas relevantes com termos de busca comuns
    - Mencione a marca algumas vezes de forma natural (2-3 menções)
    - Inclua termos descritivos relevantes para a categoria

    RESTRIÇÕES:
    - Não mencione preços ou promoções específicas
    - Evite comparações diretas com marcas concorrentes
    - Não faça promessas irrealistas ou garantias absolutas
    - Mantenha entre 250-400 palavras para descrição completa
    - Evite formatação HTML complexa, use apenas markdown

    ATENÇÃO ESPECIAL:
    - Adapte o tom e vocabulário à categoria específica do produto
    - Considere o perfil típico do consumidor desta categoria
    - Enfatize quaisquer diferenciais mencionados nas informações adicionais
    - Mantenha consistência com a identidade da marca mencionada
    - Equilibre linguagem técnica com benefícios práticos para o usuário
    - Use terminologia correta e atualizada para a categoria do produto
    
    FORMATAÇÃO FINAL:
    - Verifique que todo o markdown está aplicado corretamente
    - Mantenha espaçamento consistente entre seções
    - Garanta que a descrição final é escaneável e bem estruturada
    - Certifique-se que as listas estão formatadas corretamente com espaço após o marcador
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    const description = response.text()
      .trim()
      .replace(/\n{3,}/g, '\n\n');
    
    return description;
  } catch (error) {
    console.error('Erro ao gerar descrição:', error);
    throw new Error('Não foi possível gerar a descrição. Por favor, tente novamente.');
  }
}