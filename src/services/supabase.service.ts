import { createClient } from '@supabase/supabase-js';
import { config } from '@/config';
import { v4 as uuidv4 } from 'uuid';

export class SupabaseService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey
    );
  }

  async uploadImage(
    buffer: Buffer,
    folder: 'clothing' | 'feed' | 'avatars' | 'outfits',
    contentType: string = 'image/jpeg'
  ): Promise<string> {
    const fileName = `${folder}/${uuidv4()}.jpg`;

    const { data, error } = await this.supabase.storage
      .from(config.supabase.storageBucket)
      .upload(fileName, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Erro ao fazer upload da imagem: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = this.supabase.storage
      .from(config.supabase.storageBucket)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  }

  async deleteImage(url: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === config.supabase.storageBucket);
      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      const { error } = await this.supabase.storage
        .from(config.supabase.storageBucket)
        .remove([filePath]);

      if (error) {
        console.error('Erro ao deletar imagem:', error.message);
      }
    } catch (error) {
      console.error('Erro ao processar URL da imagem:', error);
    }
  }

  // Convert base64 data URI to buffer
  dataUriToBuffer(dataUri: string): { buffer: Buffer; contentType: string } {
    const matches = dataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Data URI inválida');
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    return { buffer, contentType };
  }
}

export const supabaseService = new SupabaseService();
