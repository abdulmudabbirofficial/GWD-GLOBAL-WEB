import { Texture, TextureLoader } from 'three';

/**
 * Loads an image as a texture, decoding it off the main thread
 * (createImageBitmap) so a large image never freezes scrolling. Falls back to
 * the ordinary loader where image bitmaps are unavailable.
 */
export async function loadTexture(url: string): Promise<Texture> {
  if (typeof createImageBitmap === 'function') {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const bitmap = await createImageBitmap(await res.blob(), { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
      const t = new Texture(bitmap);
      // The bitmap is already flipped; WebGL cannot flip image bitmaps on upload.
      t.flipY = false;
      t.needsUpdate = true;
      const dispose = t.dispose.bind(t);
      t.dispose = () => {
        bitmap.close();
        dispose();
      };
      return t;
    } catch {
      // Fall through to the element-based loader.
    }
  }
  return new TextureLoader().loadAsync(url);
}
