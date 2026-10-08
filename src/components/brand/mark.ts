/**
 * The GWD mark as clean geometry, measured from the master artwork
 * (606×340 lockup). Shared by the SVG logo, the loader and the WebGL hero,
 * which samples these paths into particles.
 */
export const MARK = {
  viewBox: { x: 15, y: 0, width: 580, height: 236 },
  letters: {
    g: 'M190 53H150A67 69.5 0 0 0 150 192H190V105H136V132H163V166H150A40 43.5 0 0 1 150 79H190Z',
    w: 'M213 79H241L258 125L285 53H314L340 125L357 79H384L342 192H338L300 89L260 192H256Z',
    d: 'M412 53H450A68 69.5 0 0 1 450 192H412V137H438V166H450A40 43.5 0 0 0 450 79H438V110H412Z',
  },
  brackets: { bottomLeft: 'M19 80H37V214H169V232H19Z', topRight: 'M440 4H590V156H572V22H440Z' },
  colors: { letters: '#B40000', brackets: '#791313' },
} as const;

export const MARK_VIEWBOX = `${MARK.viewBox.x} ${MARK.viewBox.y} ${MARK.viewBox.width} ${MARK.viewBox.height}`;
