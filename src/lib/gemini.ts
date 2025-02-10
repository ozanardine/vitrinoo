import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function generateProductDescription(
  title: string,
  brand: string,
  category: string,
  additionalInfo?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Crie uma descrição profissional e atraente para um produto com as seguintes informações:
      
      Título: ${title}
      Marca: ${brand}
      Categoria: ${category}
      ${additionalInfo ? `Informações adicionais: ${additionalInfo}` : ''}

      A descrição deve:
      - Ter entre 2-3 parágrafos
      - Destacar os principais benefícios e características
      - Usar linguagem persuasiva mas profissional
      - Ser em português do Brasil
      - Incluir palavras-chave relevantes para SEO
      - Não mencionar preços ou promoções
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Erro ao gerar descrição:', error);
    throw new Error('Não foi possível gerar a descrição. Por favor, tente novamente.');
  }
}