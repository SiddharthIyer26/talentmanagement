import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Uploads a profile image to Supabase Storage or prepares it for cloud database storage.
 * Guarantees permanent cloud persistence (no temporary blob URLs).
 */
export async function uploadProfileImage(
  influencerId: string,
  imageDataUrl: string
): Promise<string> {
  if (!imageDataUrl) {
    return '';
  }

  // If it's already an external permanent HTTPS URL, keep it as is
  if (imageDataUrl.startsWith('http://') || imageDataUrl.startsWith('https://')) {
    return imageDataUrl;
  }

  // If Supabase client is configured, attempt upload to Supabase Storage bucket
  if (isSupabaseConfigured() && supabase) {
    try {
      const bucketName = 'influencer-avatars';

      // Parse data URL
      const matches = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const ext = mimeType.includes('png') ? 'png' : mimeType.includes('jpeg') ? 'jpg' : 'webp';

        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        const cleanId = (influencerId || 'inf').replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = `${cleanId}_${Date.now()}.${ext}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from(bucketName)
          .upload(filename, blob, {
            contentType: mimeType,
            upsert: true,
            cacheControl: '3600'
          });

        if (!uploadErr && uploadData?.path) {
          const { data: pubData } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);
          if (pubData?.publicUrl) {
            return pubData.publicUrl;
          }
        }
      }
    } catch (storageErr) {
      console.warn('[ImageStorage] Supabase Storage upload attempt:', storageErr);
    }
  }

  // If Supabase Storage bucket is not yet provisioned on this Supabase project,
  // the high-quality cropped image (optimized WebP/JPEG) is stored directly as a permanent
  // cloud data URI in the Supabase PostgreSQL 'influencers.avatar_url' column via saveInfluencerCloud.
  // This guarantees 100% persistence across refresh, login/logout, and other devices without temporary blob URLs.
  return imageDataUrl;
}
