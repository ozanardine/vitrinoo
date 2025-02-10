// Imgur API client
const IMGUR_CLIENT_ID = import.meta.env.VITE_IMGUR_CLIENT_ID;

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Falha ao fazer upload da imagem');
    }

    const data = await response.json();
    return data.data.link;
  } catch (error) {
    console.error('Erro no upload:', error);
    throw new Error('Erro ao fazer upload da imagem. Por favor, tente novamente.');
  }
}