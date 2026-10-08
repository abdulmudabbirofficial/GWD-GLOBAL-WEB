'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { setRenderOverrides, type RenderOverride } from '@/lib/media';

const Ctx = createContext<Record<string, RenderOverride>>({});

/**
 * Hands the admin's replacement images to every <Render> (through context,
 * so server-rendered HTML is right) and to the 3D backdrops (through
 * renderUrl, which they call in the browser).
 */
export function ImageOverrides({ value, children }: { value: Record<string, RenderOverride>; children: ReactNode }) {
  useState(() => setRenderOverrides(value));
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useRenderOverride = (name: string): RenderOverride | undefined => useContext(Ctx)[name];
