import fetch from 'node-fetch';

export async function toDataURL(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.buffer();
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}
