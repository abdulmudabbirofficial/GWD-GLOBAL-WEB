import { Big_Shoulders, Bricolage_Grotesque, Geist, Geist_Mono, Newsreader } from 'next/font/google';

/*
 * Geist carries the site, from light display type to UI labels. Geist Mono sets
 * the small technical metadata. Newsreader appears only in italic, for chapter
 * labels and the occasional quoted line. Two pages carry a voice of their own:
 * GWD Sports speaks in Big Shoulders (stadium signage) and GWD Community in
 * Bricolage Grotesque (warm, hand-set).
 */
export const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });

export const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });

export const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-newsreader', style: ['italic'], axes: ['opsz'], display: 'swap' });

export const bigShoulders = Big_Shoulders({ subsets: ['latin'], variable: '--font-big-shoulders', axes: ['opsz'], display: 'swap' });

export const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', axes: ['opsz', 'wdth'], display: 'swap' });
