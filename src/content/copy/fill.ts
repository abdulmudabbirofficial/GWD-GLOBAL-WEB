/**
 * Fills {tokens} in editable copy with live values (a count, the city), so an
 * editor can reword a sentence without hard-coding a number that changes.
 * Unknown tokens are left as written.
 */
export function fill(text: string, vars: Record<string, string | number | undefined>) {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] === undefined ? m : String(vars[k])));
}
