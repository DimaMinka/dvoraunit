import { Lang } from './prepCalculator';

export const WHATSAPP_NUMBER = '972546885244';
export const SUPPORT_EMAIL = 'support@dvoraunit.com';
export const CURRENCY = 'ILS';
export const CURRENCY_SYMBOL = '₪';

export type LoadoutMode = 'single' | 'dual';

export interface PriceTier {
  minQty: number;
  maxQty: number | null;
  unitPrice: number;
}

export const PRICE_TIERS: PriceTier[] = [
  { minQty: 1, maxQty: 49, unitPrice: 18 },
  { minQty: 50, maxQty: 99, unitPrice: 17 },
  { minQty: 100, maxQty: 499, unitPrice: 16 },
  { minQty: 500, maxQty: null, unitPrice: 15 },
];

export interface PatchOrderDraft {
  mode: LoadoutMode;
  dvoraQty: number;
  flagQty: number;
  syncFlag: boolean;
}

export interface OrderCalculation {
  dvoraQty: number;
  flagQty: number;
  totalQty: number;
  unitPrice: number;
  totalPrice: number;
  basePriceTotal: number;
  savings: number;
  nextTier: {
    minQty: number;
    unitPrice: number;
    remainingQty: number;
  } | null;
}

const DRAFT_STORAGE_KEY = 'dvora_patch_order_draft_v1';

export function loadPatchDraft(): PatchOrderDraft {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        mode: parsed.mode === 'single' ? 'single' : 'dual',
        dvoraQty: Math.max(1, Number(parsed.dvoraQty) || 1),
        flagQty: Math.max(0, Number(parsed.flagQty) || 1),
        syncFlag: parsed.syncFlag !== false,
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    mode: 'dual',
    dvoraQty: 1,
    flagQty: 1,
    syncFlag: true,
  };
}

export function savePatchDraft(draft: PatchOrderDraft): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // ignore storage errors
  }
}

export function getUnitPrice(totalQty: number): number {
  const qty = Math.max(1, totalQty);
  for (let i = PRICE_TIERS.length - 1; i >= 0; i--) {
    if (qty >= PRICE_TIERS[i].minQty) {
      return PRICE_TIERS[i].unitPrice;
    }
  }
  return PRICE_TIERS[0].unitPrice;
}

export function calculatePatchOrder(draft: PatchOrderDraft): OrderCalculation {
  const dvoraQty = Math.max(1, Math.floor(draft.dvoraQty));
  const flagQty =
    draft.mode === 'dual'
      ? draft.syncFlag
        ? dvoraQty
        : Math.max(0, Math.floor(draft.flagQty))
      : 0;

  const totalQty = dvoraQty + flagQty;
  const unitPrice = getUnitPrice(totalQty);
  const totalPrice = totalQty * unitPrice;
  const basePriceTotal = totalQty * PRICE_TIERS[0].unitPrice;
  const savings = Math.max(0, basePriceTotal - totalPrice);

  let nextTier: OrderCalculation['nextTier'] = null;
  for (const tier of PRICE_TIERS) {
    if (totalQty < tier.minQty) {
      nextTier = {
        minQty: tier.minQty,
        unitPrice: tier.unitPrice,
        remainingQty: tier.minQty - totalQty,
      };
      break;
    }
  }

  return {
    dvoraQty,
    flagQty,
    totalQty,
    unitPrice,
    totalPrice,
    basePriceTotal,
    savings,
    nextTier,
  };
}

export function generateOrderId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `DVR-${code}`;
}

export function buildOrderMessage(
  calc: OrderCalculation,
  mode: LoadoutMode,
  lang: Lang,
  orderId: string
): string {
  const setLabel =
    mode === 'dual' && calc.flagQty > 0
      ? lang === 'ru'
        ? 'ПОЛНЫЙ СЕТ (Оба плеча)'
        : 'DUAL SET (Both Shoulders)'
      : lang === 'ru'
        ? 'БАЗОВЫЙ (1 плечо)'
        : 'SINGLE (1 Shoulder)';

  const lines =
    lang === 'ru'
      ? [
          `⚡ DVORA UNIT // ЗАКАЗ ПАТЧЕЙ`,
          `────────────────────`,
          `Комплект: ${setLabel}`,
          `• Патч DVORA: ${calc.dvoraQty} шт.`,
          ...(calc.flagQty > 0 ? [`• Патч ФЛАГ: ${calc.flagQty} шт.`] : []),
          `Итого: ${calc.totalQty} шт. × ${calc.unitPrice} ${CURRENCY_SYMBOL} = ${calc.totalPrice.toLocaleString()} ${CURRENCY_SYMBOL}`,
          `────────────────────`,
        ]
      : [
          `⚡ DVORA UNIT // PATCH REQUISITION`,
          `────────────────────`,
          `Loadout: ${setLabel}`,
          `• DVORA Patch: ${calc.dvoraQty} pcs`,
          ...(calc.flagQty > 0 ? [`• FLAG Patch: ${calc.flagQty} pcs`] : []),
          `Total: ${calc.totalQty} pcs × ${calc.unitPrice} ${CURRENCY_SYMBOL} = ${calc.totalPrice.toLocaleString()} ${CURRENCY_SYMBOL}`,
          `────────────────────`,
        ];

  const manifest = `[SYS_MANIFEST: v1|ID:${orderId}|DVORA:${calc.dvoraQty}|FLAG:${calc.flagQty}|TOTAL:${calc.totalQty}|UNIT:${calc.unitPrice}|SUM:${calc.totalPrice}|CUR:${CURRENCY}]`;

  return [...lines, manifest].join('\n');
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildMailtoUrl(message: string, orderId: string): string {
  const subject = `DVORA UNIT // Patch Order ${orderId}`;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
