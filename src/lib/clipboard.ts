import toast from 'react-hot-toast';

/**
 * Read text from the clipboard. Surfaces a friendly toast on failure
 * (permissions denied, unsupported browser, etc.) and returns empty
 * string. Never throws to caller.
 */
export async function readClipboard(): Promise<string> {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
      toast.error('Clipboard not available — paste manually.');
      return '';
    }
    return await navigator.clipboard.readText();
  } catch {
    toast.error('Could not read clipboard. Paste manually instead.');
    return '';
  }
}

/**
 * Write text to the clipboard. Surfaces a success toast on completion
 * (or a friendly failure toast). Returns true/false. Never throws.
 */
export async function writeClipboard(text: string, successMessage?: string): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      toast.error('Clipboard not available.');
      return false;
    }
    await navigator.clipboard.writeText(text);
    toast.success(successMessage ?? 'Copied to clipboard.');
    return true;
  } catch {
    toast.error('Could not copy to clipboard.');
    return false;
  }
}
