import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Shield,
  Sparkles,
  Minus,
  Plus,
  MessageCircle,
  Mail,
  Copy,
  Check,
  Film,
  Camera,
  ZoomIn,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';
import { Lang, loadSavedLang, saveLang } from '../lib/prepCalculator';
import {
  CURRENCY_SYMBOL,
  PRICE_TIERS,
  PatchOrderDraft,
  loadPatchDraft,
  savePatchDraft,
  calculatePatchOrder,
  generateOrderId,
  buildOrderMessage,
  buildWhatsAppUrl,
  buildMailtoUrl,
} from '../lib/patchOrder';

interface PatchOrderPageProps {
  onBackToMain: () => void;
}

type MediaTab = 'operator' | 'field' | 'closeup' | 'video';

const MEDIA_ORDER: MediaTab[] = ['field', 'operator', 'closeup', 'video'];
const QUICK_QTYS = [1, 5, 10, 50, 100, 500];

const UI_TEXT: Record<
  Lang,
  {
    headerTitle: string;
    backBtn: string;
    badge: string;
    pageTitle: string;
    pageSub: string;
    donateNotice: string;
    tabOperator: string;
    tabVideo: string;
    tabField: string;
    tabCloseup: string;
    tapHint: string;
    videoStandby: string;
    videoStandbySub: string;
    loadoutTitle: string;
    dualTitle: string;
    dualBadge: string;
    dualPriceTag: string;
    dualDesc: string;
    singleTitle: string;
    singlePriceTag: string;
    singleDesc: string;
    qtyTitle: string;
    dvoraLabel: string;
    flagLabel: string;
    syncLabel: string;
    tierTitle: string;
    dualTierHint: string;
    perPcShort: string;
    perSetShort: string;
    pcs: string;
    nextTierPrefix: string;
    nextTierMid: string;
    nextTierEnd: string;
    maxTierReached: string;
    totalLabel: string;
    unitLabel: string;
    savingsLabel: string;
    waButton: string;
    altChannels: string;
    emailButton: string;
    copyButton: string;
    copied: string;
    manifestHint: string;
  }
> = {
  en: {
    headerTitle: 'DVORA // SUPPLY TERMINAL',
    backBtn: 'MAIN',
    badge: 'UNIT_PATCH_V1 // IN STOCK',
    pageTitle: 'TACTICAL PATCH REQUISITION',
    pageSub: 'Embroidered velcro patch. Volume pricing applies automatically.',
    donateNotice:
      'DONATE FOR THE UNIT // Independent initiative supporting DVORA UNIT & local production in the North.',
    tabOperator: 'ACTION',
    tabField: 'RIG',
    tabCloseup: 'MACRO',
    tabVideo: 'VIDEO',
    tapHint: 'TAP NEXT',
    videoStandby: 'SIGNAL_LOCK // STANDBY',
    videoStandbySub: 'Showcase reel incoming. Tap frame to cycle field photos.',
    loadoutTitle: '01 // SELECT LOADOUT',
    dualTitle: 'DUAL SET // BOTH ARMS',
    dualBadge: 'RECOMMENDED',
    dualPriceTag: '×2 PATCHES',
    dualDesc: 'DVORA (L-Arm) + FLAG (R-Arm) in matching style. Supports project development.',
    singleTitle: 'SINGLE // 1 ARM',
    singlePriceTag: '1 PATCH',
    singleDesc: 'DVORA UNIT patch only.',
    qtyTitle: '02 // QUANTITY & VOLUME TIERS',
    dvoraLabel: 'DVORA UNIT',
    flagLabel: 'FLAG PATCH',
    syncLabel: 'Sync 1:1',
    tierTitle: 'VOLUME PRICING',
    dualTierHint: 'SET = 2 PATCHES (×2)',
    perPcShort: '/pc',
    perSetShort: 'set',
    pcs: 'pcs',
    nextTierPrefix: 'Add',
    nextTierMid: 'more pcs to unlock',
    nextTierEnd: '/pc',
    maxTierReached: 'MAX VOLUME TIER UNLOCKED (15 ₪/pc)',
    totalLabel: 'TOTAL',
    unitLabel: 'per pc',
    savingsLabel: 'SAVED',
    waButton: 'ORDER VIA WHATSAPP',
    altChannels: 'Other channels (Email / Copy)',
    emailButton: 'SEND EMAIL',
    copyButton: 'COPY ORDER',
    copied: 'COPIED',
    manifestHint: 'Includes SYS_MANIFEST code for instant processing.',
  },
  ru: {
    headerTitle: 'DVORA // ТЕРМИНАЛ СНАБЖЕНИЯ',
    backBtn: 'ГЛАВНАЯ',
    badge: 'UNIT_PATCH_V1 // В НАЛИЧИИ',
    pageTitle: 'ЗАКАЗ ТАКТИЧЕСКИХ ПАТЧЕЙ',
    pageSub: 'Вышитый патч на велкро. Оптовая цена считается автоматически.',
    donateNotice:
      'ПОДДЕРЖКА ПОДРАЗДЕЛЕНИЯ // Независимая инициатива в поддержку DVORA UNIT и производства на Севере.',
    tabOperator: 'В ПОЛЕ',
    tabField: 'ПЛИТНИК',
    tabCloseup: 'КРУПНО',
    tabVideo: 'ВИДЕО',
    tapHint: 'ТАП ДАЛЕЕ',
    videoStandby: 'SIGNAL_LOCK // ОЖИДАНИЕ',
    videoStandbySub: 'Ролик скоро будет загружен. Тапни по экрану для смены фото.',
    loadoutTitle: '01 // ВЫБОР КОМПЛЕКТА',
    dualTitle: 'ПОЛНЫЙ СЕТ // ОБА ПЛЕЧА',
    dualBadge: 'РЕКОМЕНДУЕМ',
    dualPriceTag: '×2 ПАТЧА',
    dualDesc: 'DVORA (левое) + ФЛАГ (правое) в одном стиле. Прямая поддержка проекта.',
    singleTitle: 'БАЗОВЫЙ // 1 ПЛЕЧО',
    singlePriceTag: '1 ПАТЧ',
    singleDesc: 'Только патч DVORA UNIT.',
    qtyTitle: '02 // КОЛИЧЕСТВО И СКИДКА',
    dvoraLabel: 'ПАТЧ DVORA',
    flagLabel: 'ПАТЧ ФЛАГ',
    syncLabel: '1:1 с Дворой',
    tierTitle: 'СЕТКА ЦЕН',
    dualTierHint: 'В СЕТЕ 2 ПАТЧА (×2)',
    perPcShort: '/шт',
    perSetShort: 'сет',
    pcs: 'шт.',
    nextTierPrefix: 'Добавь ещё',
    nextTierMid: 'шт. для цены',
    nextTierEnd: '/шт.',
    maxTierReached: 'МАКСИМАЛЬНАЯ СКИДКА АКТИВНА (15 ₪/шт.)',
    totalLabel: 'ИТОГО',
    unitLabel: 'за шт.',
    savingsLabel: 'ЭКОНОМИЯ',
    waButton: 'ЗАКАЗАТЬ В WHATSAPP',
    altChannels: 'Другие каналы (Email / Копировать)',
    emailButton: 'НА ПОЧТУ',
    copyButton: 'КОПИРОВАТЬ',
    copied: 'СКОПИРОВАНО',
    manifestHint: 'Включает код SYS_MANIFEST для мгновенной обработки.',
  },
};

export default function PatchOrderPage({ onBackToMain }: PatchOrderPageProps) {
  const [lang, setLang] = useState<Lang>(() => loadSavedLang());
  const [draft, setDraft] = useState<PatchOrderDraft>(() => loadPatchDraft());
  const [dvoraInput, setDvoraInput] = useState<string>(() => String(loadPatchDraft().dvoraQty));
  const [flagInput, setFlagInput] = useState<string>(() => String(loadPatchDraft().flagQty));
  const [mediaTab, setMediaTab] = useState<MediaTab>('field');
  const [videoAvailable, setVideoAvailable] = useState<boolean>(true);
  const [showAltChannels, setShowAltChannels] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [orderId] = useState<string>(() => generateOrderId());
  const touchStartX = useRef<number | null>(null);

  const t = UI_TEXT[lang];

  useEffect(() => {
    ['/patch-field.jpg', '/patch-alt.jpg', '/patch-closeup.jpg'].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    saveLang(lang);
  }, [lang]);

  useEffect(() => {
    savePatchDraft(draft);
  }, [draft]);

  const calc = useMemo(() => calculatePatchOrder(draft), [draft]);

  const orderMessage = useMemo(
    () => buildOrderMessage(calc, draft.mode, lang, orderId),
    [calc, draft.mode, lang, orderId]
  );

  const waUrl = useMemo(() => buildWhatsAppUrl(orderMessage), [orderMessage]);
  const mailUrl = useMemo(
    () => buildMailtoUrl(orderMessage, orderId),
    [orderMessage, orderId]
  );

  const cycleMedia = (dir: 1 | -1 = 1) => {
    setMediaTab((prev) => {
      const idx = MEDIA_ORDER.indexOf(prev);
      return MEDIA_ORDER[(idx + dir + MEDIA_ORDER.length) % MEDIA_ORDER.length];
    });
  };

  const updateDvoraQty = (next: number) => {
    const clamped = Math.max(1, Math.min(9999, Math.floor(next) || 1));
    setDvoraInput(String(clamped));
    setDraft((prev) => {
      const nextFlag = prev.syncFlag ? clamped : prev.flagQty;
      if (prev.syncFlag) setFlagInput(String(nextFlag));
      return {
        ...prev,
        dvoraQty: clamped,
        flagQty: nextFlag,
      };
    });
  };

  const updateFlagQty = (next: number) => {
    const clamped = Math.max(0, Math.min(9999, Math.floor(next) || 0));
    setFlagInput(String(clamped));
    setDraft((prev) => ({
      ...prev,
      syncFlag: false,
      flagQty: clamped,
    }));
  };

  const applyTierMinQty = (minQty: number) => {
    if (draft.mode === 'dual') {
      const perSide = Math.max(1, Math.ceil(minQty / 2));
      setDvoraInput(String(perSide));
      setFlagInput(String(perSide));
      setDraft((prev) => ({
        ...prev,
        dvoraQty: perSide,
        flagQty: perSide,
        syncFlag: true,
      }));
    } else {
      updateDvoraQty(minQty);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="scanlines grid-backdrop min-h-screen bg-[#121212] text-[#e5e2e1] flex flex-col justify-between pb-24 md:pb-8 selection:bg-brand-primary selection:text-black">
      {/* Top HUD Header */}
      <header className="border-b border-brand-steel/40 bg-[#141414]/95 backdrop-blur-sm px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMain}
            className="flex items-center gap-1.5 text-xs font-mono text-brand-steel hover:text-brand-primary border border-brand-steel/40 hover:border-brand-primary/60 px-2.5 py-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.backBtn}</span>
          </button>
          <div className="font-display font-bold uppercase tracking-wider text-brand-primary text-xs sm:text-sm truncate">
            {t.headerTitle}
          </div>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center border border-brand-steel/40 bg-[#1A1A19] text-[11px] font-mono">
          <button
            onClick={() => setLang('en')}
            className={`px-2.5 py-1 cursor-pointer transition-colors ${
              lang === 'en'
                ? 'bg-brand-primary text-black font-bold'
                : 'text-brand-steel hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang('ru')}
            className={`px-2.5 py-1 cursor-pointer transition-colors ${
              lang === 'ru'
                ? 'bg-brand-primary text-black font-bold'
                : 'text-brand-steel hover:text-white'
            }`}
          >
            RU
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 py-5 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 z-10">
        {/* Left Column: Media Showcase (5 cols on desktop) */}
        <section className="lg:col-span-5 flex flex-col gap-3">
          {/* Title on Mobile */}
          <div className="lg:hidden">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-[10px] font-mono tracking-wider mb-2">
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse" />
              {t.badge}
            </div>
            <h1 className="font-display text-2xl font-bold text-brand-primary uppercase tracking-tight">
              {t.pageTitle}
            </h1>
            <p className="text-xs text-brand-secondary mt-1">{t.pageSub}</p>
            <div className="mt-2.5 border-l-2 border-brand-primary bg-brand-primary/5 px-2.5 py-1.5 font-mono text-[10px] leading-relaxed text-brand-secondary">
              {t.donateNotice}
            </div>
          </div>

          {/* Media Frame with L-Brackets */}
          <div className="relative border border-brand-steel/50 bg-[#1A1A19] p-1.5">
            <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-brand-primary pointer-events-none z-20" />
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-brand-primary pointer-events-none z-20" />
            <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-brand-primary pointer-events-none z-20" />
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-brand-primary pointer-events-none z-20" />

            <div
              onClick={() => cycleMedia(1)}
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const deltaX = e.changedTouches[0].clientX - touchStartX.current;
                touchStartX.current = null;
                if (Math.abs(deltaX) > 40) {
                  cycleMedia(deltaX < 0 ? 1 : -1);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  cycleMedia(1);
                }
              }}
              className="relative aspect-[4/3] w-full overflow-hidden bg-[#101010] flex items-center justify-center cursor-pointer select-none group"
            >
              <div
                key={mediaTab}
                className="w-full h-full flex items-center justify-center tactical-channel-switch"
              >
                {mediaTab === 'video' && (
                  <>
                    {videoAvailable ? (
                      <video
                        src="/patch-video.mp4"
                        autoPlay
                        muted
                        loop
                        playsInline
                        poster="/logo.png"
                        onError={() => setVideoAvailable(false)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative overflow-hidden grid-backdrop">
                        {/* HUD Reticle */}
                        <div className="absolute inset-4 border border-brand-primary/15 pointer-events-none" />
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-brand-primary/10 pointer-events-none" />
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-primary/10 pointer-events-none" />

                        <img
                          src="/logo.png"
                          alt="DVORA UNIT"
                          className="w-28 h-28 object-contain tactical-glitch"
                        />
                        <div className="mt-3 font-mono text-xs text-brand-primary tracking-widest uppercase">
                          {t.videoStandby}
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-brand-steel max-w-xs">
                          {t.videoStandbySub}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {mediaTab === 'field' && (
                  <img
                    src="/patch-field.jpg"
                    alt="DVORA Patch on Tactical Vest"
                    className="w-full h-full object-cover tactical-feed-img"
                  />
                )}

                {mediaTab === 'operator' && (
                  <img
                    src="/patch-alt.jpg"
                    alt="DVORA Patch in Field Action"
                    className="w-full h-full object-cover tactical-feed-img"
                  />
                )}

                {mediaTab === 'closeup' && (
                  <img
                    src="/patch-closeup.jpg"
                    alt="DVORA Patch Close-up"
                    className="w-full h-full object-cover tactical-feed-img"
                  />
                )}
              </div>

              {/* Tactical Optical Interference Overlay (dimmed on macro closeup) */}
              {mediaTab !== 'video' && (
                <div
                  className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
                    mediaTab === 'closeup' ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  <div className="absolute inset-0 tactical-vignette" />
                  <div className="absolute inset-x-0 top-0 tactical-scanbeam" />
                </div>
              )}

              {/* HUD Overlay Tag */}
              <div className="absolute top-2 left-2 bg-black/75 border border-brand-primary/40 px-2 py-0.5 font-mono text-[10px] text-brand-primary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                <span>
                  CAM_0{MEDIA_ORDER.indexOf(mediaTab) + 1} // {mediaTab.toUpperCase()}
                </span>
              </div>

              {/* Frame Counter & Tap Hint */}
              <div className="absolute bottom-2 right-2 bg-black/75 border border-brand-steel/50 px-2 py-0.5 font-mono text-[10px] text-brand-secondary group-hover:border-brand-primary group-hover:text-brand-primary transition-colors">
                {MEDIA_ORDER.indexOf(mediaTab) + 1}/{MEDIA_ORDER.length} · {t.tapHint}
              </div>
            </div>
          </div>

          {/* Media Switcher Tabs */}
          <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px] sm:text-[11px]">
            <button
              onClick={() => setMediaTab('field')}
              className={`flex items-center justify-center gap-1 py-2 border transition-all cursor-pointer ${
                mediaTab === 'field'
                  ? 'border-brand-primary bg-brand-primary/15 text-brand-primary font-bold'
                  : 'border-brand-steel/40 bg-[#1A1A19] text-brand-steel hover:text-white'
              }`}
            >
              <Camera className="w-3 h-3 shrink-0" />
              <span className="truncate">{t.tabField}</span>
            </button>
            <button
              onClick={() => setMediaTab('operator')}
              className={`flex items-center justify-center gap-1 py-2 border transition-all cursor-pointer ${
                mediaTab === 'operator'
                  ? 'border-brand-primary bg-brand-primary/15 text-brand-primary font-bold'
                  : 'border-brand-steel/40 bg-[#1A1A19] text-brand-steel hover:text-white'
              }`}
            >
              <Shield className="w-3 h-3 shrink-0" />
              <span className="truncate">{t.tabOperator}</span>
            </button>
            <button
              onClick={() => setMediaTab('closeup')}
              className={`flex items-center justify-center gap-1 py-2 border transition-all cursor-pointer ${
                mediaTab === 'closeup'
                  ? 'border-brand-primary bg-brand-primary/15 text-brand-primary font-bold'
                  : 'border-brand-steel/40 bg-[#1A1A19] text-brand-steel hover:text-white'
              }`}
            >
              <ZoomIn className="w-3 h-3 shrink-0" />
              <span className="truncate">{t.tabCloseup}</span>
            </button>
            <button
              onClick={() => setMediaTab('video')}
              className={`flex items-center justify-center gap-1 py-2 border transition-all cursor-pointer ${
                mediaTab === 'video'
                  ? 'border-brand-primary bg-brand-primary/15 text-brand-primary font-bold'
                  : 'border-brand-steel/40 bg-[#1A1A19] text-brand-steel hover:text-white'
              }`}
            >
              <Film className="w-3 h-3 shrink-0" />
              <span className="truncate">{t.tabVideo}</span>
            </button>
          </div>
        </section>

        {/* Right Column: Loadout & Quantity & Checkout (7 cols on desktop) */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          {/* Title on Desktop */}
          <div className="hidden lg:block">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-[10px] font-mono tracking-wider mb-2">
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse" />
              {t.badge}
            </div>
            <h1 className="font-display text-3xl font-bold text-brand-primary uppercase tracking-tight">
              {t.pageTitle}
            </h1>
            <p className="text-sm text-brand-secondary mt-1">{t.pageSub}</p>
            <div className="mt-3 border-l-2 border-brand-primary bg-brand-primary/5 px-3 py-2 font-mono text-[11px] leading-relaxed text-brand-secondary">
              {t.donateNotice}
            </div>
          </div>

          {/* 01 // Loadout Mode (Upsell) */}
          <div className="border border-brand-steel/50 bg-[#1A1A19] p-4">
            <div className="font-mono text-xs text-brand-steel uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-brand-primary" />
              {t.loadoutTitle}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dual Set Card */}
              <button
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    mode: 'dual',
                    flagQty: prev.syncFlag ? prev.dvoraQty : Math.max(1, prev.flagQty),
                  }))
                }
                className={`text-left p-3.5 border transition-all cursor-pointer relative ${
                  draft.mode === 'dual'
                    ? 'border-brand-primary bg-brand-primary/10'
                    : 'border-brand-steel/40 bg-[#141414] hover:border-brand-steel'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-display font-bold text-sm text-brand-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    {t.dualTitle}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="inline-block font-mono text-[9px] bg-brand-primary text-black font-bold px-1.5 py-0.5">
                    {t.dualBadge}
                  </span>
                  <span className="inline-block font-mono text-[10px] border border-brand-primary/50 bg-[#121212] text-brand-primary font-bold px-1.5 py-0.5">
                    {t.dualPriceTag} · {calc.unitPrice * 2} {CURRENCY_SYMBOL}/{t.perSetShort}
                  </span>
                </div>
                <p className="text-xs text-brand-secondary leading-relaxed">
                  {t.dualDesc}
                </p>
              </button>

              {/* Single Card */}
              <button
                onClick={() => setDraft((prev) => ({ ...prev, mode: 'single' }))}
                className={`text-left p-3.5 border transition-all cursor-pointer ${
                  draft.mode === 'single'
                    ? 'border-brand-primary bg-brand-primary/10'
                    : 'border-brand-steel/40 bg-[#141414] hover:border-brand-steel'
                }`}
              >
                <div className="font-display font-bold text-sm text-white flex items-center gap-1.5 mb-1.5">
                  <Shield className="w-3.5 h-3.5 text-brand-steel shrink-0" />
                  {t.singleTitle}
                </div>
                <div className="mb-2">
                  <span className="inline-block font-mono text-[10px] border border-brand-steel/50 bg-[#121212] text-brand-secondary font-bold px-1.5 py-0.5">
                    {t.singlePriceTag} · {calc.unitPrice} {CURRENCY_SYMBOL}{t.perPcShort}
                  </span>
                </div>
                <p className="text-xs text-brand-secondary leading-relaxed">
                  {t.singleDesc}
                </p>
              </button>
            </div>
          </div>

          {/* 02 // Quantity & Volume Tiers */}
          <div className="border border-brand-steel/50 bg-[#1A1A19] p-4">
            <div className="font-mono text-xs text-brand-steel uppercase tracking-wider mb-3">
              {t.qtyTitle}
            </div>

            {/* DVORA Qty Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white">
                  {t.dvoraLabel}
                </span>
                <span className="font-mono text-[11px] text-brand-secondary">
                  {(calc.dvoraQty * calc.unitPrice).toLocaleString()} {CURRENCY_SYMBOL}
                </span>
              </div>
              <div className="flex items-center border border-brand-steel/50 bg-[#121212]">
                <button
                  onClick={() => updateDvoraQty(draft.dvoraQty - 1)}
                  className="p-2.5 text-brand-steel hover:text-brand-primary cursor-pointer"
                  aria-label="Decrease DVORA quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={9999}
                  value={dvoraInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDvoraInput(val);
                    const parsed = parseInt(val, 10);
                    if (!Number.isNaN(parsed) && parsed >= 1) {
                      const clamped = Math.min(9999, parsed);
                      setDraft((prev) => {
                        const nextFlag = prev.syncFlag ? clamped : prev.flagQty;
                        if (prev.syncFlag) setFlagInput(String(nextFlag));
                        return { ...prev, dvoraQty: clamped, flagQty: nextFlag };
                      });
                    }
                  }}
                  onBlur={() => updateDvoraQty(parseInt(dvoraInput, 10) || 1)}
                  className="no-spinner w-16 text-center bg-transparent font-mono text-base font-bold text-brand-primary focus:outline-none"
                />
                <button
                  onClick={() => updateDvoraQty(draft.dvoraQty + 1)}
                  className="p-2.5 text-brand-steel hover:text-brand-primary cursor-pointer"
                  aria-label="Increase DVORA quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Qty Chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {QUICK_QTYS.map((q) => (
                <button
                  key={q}
                  onClick={() => updateDvoraQty(q)}
                  className={`px-2.5 py-1 font-mono text-xs border transition-colors cursor-pointer ${
                    draft.dvoraQty === q
                      ? 'border-brand-primary bg-brand-primary text-black font-bold'
                      : 'border-brand-steel/40 bg-[#141414] text-brand-secondary hover:border-brand-primary/60'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* FLAG Qty Row (only in Dual mode) */}
            {draft.mode === 'dual' && (
              <div className="pt-3 border-t border-brand-steel/30 flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-brand-primary">
                    {t.flagLabel}
                  </span>
                  <span className="font-mono text-[11px] text-brand-primary/90">
                    +{(calc.flagQty * calc.unitPrice).toLocaleString()} {CURRENCY_SYMBOL}
                  </span>
                  <button
                    onClick={() =>
                      setDraft((prev) => {
                        const nextSync = !prev.syncFlag;
                        const nextFlag = nextSync ? prev.dvoraQty : prev.flagQty;
                        setFlagInput(String(nextFlag));
                        return {
                          ...prev,
                          syncFlag: nextSync,
                          flagQty: nextFlag,
                        };
                      })
                    }
                    className={`font-mono text-[10px] px-1.5 py-0.5 border cursor-pointer ${
                      draft.syncFlag
                        ? 'border-brand-primary/60 text-brand-primary bg-brand-primary/10'
                        : 'border-brand-steel/40 text-brand-steel'
                    }`}
                  >
                    {t.syncLabel}
                  </button>
                </div>

                <div className="flex items-center border border-brand-steel/50 bg-[#121212]">
                  <button
                    onClick={() => updateFlagQty(calc.flagQty - 1)}
                    className="p-2 text-brand-steel hover:text-brand-primary cursor-pointer"
                    aria-label="Decrease FLAG quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={9999}
                    value={draft.syncFlag ? String(calc.flagQty) : flagInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFlagInput(val);
                      const parsed = parseInt(val, 10);
                      if (!Number.isNaN(parsed) && parsed >= 0) {
                        setDraft((prev) => ({
                          ...prev,
                          syncFlag: false,
                          flagQty: Math.min(9999, parsed),
                        }));
                      }
                    }}
                    onBlur={() => updateFlagQty(parseInt(flagInput, 10) || 0)}
                    className="no-spinner w-14 text-center bg-transparent font-mono text-base font-bold text-white focus:outline-none"
                  />
                  <button
                    onClick={() => updateFlagQty(calc.flagQty + 1)}
                    className="p-2 text-brand-steel hover:text-brand-primary cursor-pointer"
                    aria-label="Increase FLAG quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Volume Pricing Tiers Bar */}
            <div className="bg-[#141414] border border-brand-steel/30 p-3">
              {draft.mode === 'dual' && calc.flagQty > 0 && (
                <div className="flex items-center justify-between font-mono text-[10px] text-brand-primary/90 mb-2 pb-1.5 border-b border-brand-steel/20">
                  <span>{t.tierTitle}</span>
                  <span className="font-bold">{t.dualTierHint}</span>
                </div>
              )}
              <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px] mb-2">
                {PRICE_TIERS.map((tier) => {
                  const isActive = calc.unitPrice === tier.unitPrice;
                  const rangeLabel = tier.maxQty
                    ? `${tier.minQty}-${tier.maxQty}`
                    : `${tier.minQty}+`;
                  return (
                    <button
                      type="button"
                      key={tier.minQty}
                      onClick={() => applyTierMinQty(tier.minQty)}
                      className={`py-1.5 px-1 border transition-colors cursor-pointer ${
                        isActive
                          ? 'border-brand-primary bg-brand-primary/15 text-brand-primary font-bold'
                          : 'border-brand-steel/20 text-brand-steel hover:border-brand-primary/60 hover:text-white'
                      }`}
                    >
                      <div>{rangeLabel}</div>
                      {draft.mode === 'dual' ? (
                        <div className="text-xs mt-0.5">
                          {tier.unitPrice * 2} {CURRENCY_SYMBOL}
                          <span className="text-[9px] opacity-80">/{t.perSetShort}</span>
                        </div>
                      ) : (
                        <div className="text-xs mt-0.5">
                          {tier.unitPrice} {CURRENCY_SYMBOL}
                          <span className="text-[9px] opacity-80">{t.perPcShort}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="font-mono text-[11px] text-center text-brand-secondary">
                {calc.nextTier ? (
                  <span>
                    {t.nextTierPrefix}{' '}
                    <strong className="text-brand-primary">
                      {calc.nextTier.remainingQty} {t.pcs}
                    </strong>{' '}
                    {t.nextTierMid}{' '}
                    <strong className="text-brand-primary">
                      {calc.nextTier.unitPrice} {CURRENCY_SYMBOL}
                      {t.nextTierEnd}
                    </strong>
                  </span>
                ) : (
                  <span className="text-brand-primary font-bold">
                    {t.maxTierReached}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Checkout Card */}
          <div className="hidden md:block border border-brand-primary/50 bg-[#1A1A19] p-4">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="font-mono text-xs text-brand-steel">
                  {t.totalLabel}:{' '}
                  <span className="text-brand-secondary">
                    {calc.totalQty} {t.pcs}
                    {draft.mode === 'dual' && calc.flagQty > 0
                      ? ` (${calc.dvoraQty}+${calc.flagQty})`
                      : ''}
                  </span>{' '}
                  × {calc.unitPrice} {CURRENCY_SYMBOL} {t.unitLabel}
                </div>
                <div className="font-display text-3xl font-bold text-brand-primary">
                  {calc.totalPrice.toLocaleString()} {CURRENCY_SYMBOL}
                </div>
              </div>
              {calc.savings > 0 && (
                <div className="font-mono text-xs bg-brand-primary/15 border border-brand-primary/40 text-brand-primary px-2.5 py-1">
                  {t.savingsLabel}: {calc.savings.toLocaleString()} {CURRENCY_SYMBOL}
                </div>
              )}
            </div>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-white text-black font-display font-bold uppercase tracking-wider py-3.5 px-6 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{t.waButton}</span>
            </a>

            {/* Alt Channels Toggle */}
            <div className="mt-3">
              <button
                onClick={() => setShowAltChannels((v) => !v)}
                className="w-full flex items-center justify-center gap-1.5 font-mono text-[11px] text-brand-steel hover:text-brand-primary cursor-pointer py-1"
              >
                <span>{t.altChannels}</span>
                {showAltChannels ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showAltChannels && (
                <div className="mt-2 pt-2 border-t border-brand-steel/30 grid grid-cols-2 gap-2">
                  <a
                    href={mailUrl}
                    className="flex items-center justify-center gap-1.5 py-2 border border-brand-steel/40 hover:border-brand-primary text-xs font-mono text-white transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-brand-primary" />
                    <span>{t.emailButton}</span>
                  </a>
                  <button
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-1.5 py-2 border border-brand-steel/40 hover:border-brand-primary text-xs font-mono text-white transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-brand-primary" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-brand-primary" />
                    )}
                    <span>{copied ? t.copied : t.copyButton}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-2 text-center font-mono text-[10px] text-brand-steel">
              {t.manifestHint}
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Sticky Bottom Checkout Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#141414]/95 backdrop-blur-md border-t border-brand-primary/40 px-4 py-3 z-40">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] text-brand-steel">
              <span className="text-brand-secondary">
                {calc.totalQty} {t.pcs}
                {draft.mode === 'dual' && calc.flagQty > 0
                  ? ` (${calc.dvoraQty}+${calc.flagQty})`
                  : ''}
              </span>{' '}
              × {calc.unitPrice} {CURRENCY_SYMBOL}
            </div>
            <div className="font-display text-xl font-bold text-brand-primary leading-tight">
              {calc.totalPrice.toLocaleString()} {CURRENCY_SYMBOL}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={mailUrl}
              className="p-3 border border-brand-steel/40 bg-[#1A1A19] text-brand-primary"
              aria-label={t.emailButton}
            >
              <Mail className="w-4 h-4" />
            </a>
            <button
              onClick={handleCopy}
              className="p-3 border border-brand-steel/40 bg-[#1A1A19] text-brand-primary cursor-pointer"
              aria-label={t.copyButton}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-brand-primary text-black font-display font-bold text-sm uppercase tracking-wider py-3 px-3.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WHATSAPP</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
