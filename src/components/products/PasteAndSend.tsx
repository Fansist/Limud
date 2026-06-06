'use client';
/**
 * PasteAndSend (v17.8) — paste-once, pick-a-tool launcher for /my-tools.
 *
 * The user pastes any context (notes, problem text, draft, article) into one
 * textarea and then clicks a chip representing one of the tools they already
 * own. Navigation hands the text off to the destination tool via the URL
 * (`?input=<encoded>&autorun=0`); the destination page (MarkdownToolPage,
 * /study, /practice) restores it into the input. We never actually call any
 * tool API from here — that's the destination page's job.
 *
 * Chips are limited to the user's *owned* tools so the experience reads as
 * "send to your toolkit," not "open the catalog with prefill." The overflow
 * pattern (max 5 visible + "More") keeps the row short on desktop without
 * burying tools on smaller catalogs.
 *
 * Empty paste → all chips are disabled so users can't accidentally navigate
 * to a tool with no prefill (which would just look like a regular open and
 * be confusing in the context of a "paste-and-send" widget).
 */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles } from 'lucide-react';
import { PRODUCT_ICONS } from '@/lib/products-icons';
import type { Product } from '@/lib/products-catalog';

type PasteAndSendProps = {
  /** Tools the user owns. Only owned tools appear as chips. */
  ownedProducts: Product[];
};

// v17.8: cap visible chips so the row stays scannable on desktop. The rest
// fold into a "+N more" expander. 5 is the brief; small enough to read at
// a glance, big enough that most multi-tool users see all their tools.
const MAX_VISIBLE_CHIPS = 5;

function iconFor(productId: string): React.ReactNode {
  const icon = PRODUCT_ICONS[productId];
  if (icon) return icon;
  return <Sparkles size={18} />;
}

export default function PasteAndSend({ ownedProducts }: PasteAndSendProps): React.ReactElement {
  const [text, setText] = useState<string>('');
  const [expanded, setExpanded] = useState<boolean>(false);
  const router = useRouter();

  // Disabled state is purely a function of whether the user has typed
  // anything meaningful. Trim avoids "send" being enabled by a whitespace-only
  // paste, which the destination tools would reject anyway.
  const hasText = text.trim().length > 0;

  // Split chips into visible vs overflow so we can render an inline expander
  // without scrolling. When `expanded` is true we show all chips at once.
  const { visibleChips, overflowChips } = useMemo(() => {
    if (ownedProducts.length <= MAX_VISIBLE_CHIPS || expanded) {
      return { visibleChips: ownedProducts, overflowChips: [] };
    }
    return {
      visibleChips: ownedProducts.slice(0, MAX_VISIBLE_CHIPS),
      overflowChips: ownedProducts.slice(MAX_VISIBLE_CHIPS),
    };
  }, [ownedProducts, expanded]);

  function sendTo(product: Product): void {
    if (!hasText) return;
    // `autorun=0` is a hint to the destination tool: prefill the input but
    // don't auto-fire the generation. The user still gets to review their
    // pasted text and tweak before clicking Generate.
    const url = `${product.href}?input=${encodeURIComponent(text)}&autorun=0`;
    router.push(url);
  }

  if (ownedProducts.length === 0) {
    // PasteAndSend is meaningless without any owned tools; render nothing so
    // the parent can fall back to the "no tools yet" empty state.
    return <></>;
  }

  return (
    <section className="rounded-3xl border-2 border-primary-100 bg-gradient-to-br from-white to-primary-50/40 p-5 sm:p-7 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md">
          <Send size={16} />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-gray-900">Paste once, pick a tool</h2>
          <p className="text-[11px] text-gray-500">
            Drop in anything, then send it to the right workflow.
          </p>
        </div>
      </div>

      <label htmlFor="paste-and-send-textarea" className="sr-only">
        Paste anything (notes, problem, essay draft, code, an article)
      </label>
      <textarea
        id="paste-and-send-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste anything (notes, problem, essay draft, code, an article…)"
        rows={4}
        className="w-full rounded-2xl border-2 border-gray-100 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-300 transition resize-none"
      />

      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-2">
          Send to
        </p>
        <div className="flex flex-wrap gap-2">
          {visibleChips.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => sendTo(p)}
              disabled={!hasText}
              aria-label={`Send pasted text to ${p.name}`}
              className={
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition ' +
                (hasText
                  ? 'border-primary-200 bg-white text-primary-700 hover:bg-primary-50 hover:border-primary-300 cursor-pointer'
                  : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed')
              }
            >
              <span
                className={
                  'inline-flex items-center justify-center ' +
                  (hasText ? 'text-primary-600' : 'text-gray-400')
                }
              >
                {iconFor(p.id)}
              </span>
              <span>{p.name}</span>
            </button>
          ))}
          {overflowChips.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 border-gray-100 bg-white text-gray-600 hover:border-gray-300 transition"
              aria-label={`Show ${overflowChips.length} more tools`}
            >
              +{overflowChips.length} more
            </button>
          )}
        </div>
        {!hasText && (
          <p className="text-[11px] text-gray-400 mt-2">
            Tip: paste some text first to enable the send buttons.
          </p>
        )}
      </div>
    </section>
  );
}
