import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { ChevronLeft, ChevronRight, Eye, Heart, Sparkles } from 'lucide-react';
import './FeaturedSlider.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(Draggable, InertiaPlugin);
}

const CONFIG_DESKTOP = {
  cardWidth: 'clamp(240px, 30vw, 420px)',
  cardAspect: '16 / 10',
  gap: 320,
  step: 205,
  stepDecay: 0.72,
  depth: 95,
  depthStep: 16,
  rotBase: 65,
  rotStep: 82,
  perspective: 900,
  centerScale: 1.07,
  scaleDrop: 0.20,
  scaleStep: 0.16,
  visiblePerSide: 4,
  fadeZone: 0.45,
  dragUnit: 360,
  maxThrowDuration: 1.6,
  designWidth: 1440,
  minScale: 0.65,
  introDuration: 1.8,
  introDelay: 0.25,
  introEase: 'power3.out',
};

const CONFIG_MOBILE = {
  cardWidth: 'clamp(190px, 68vw, 300px)',
  cardAspect: '10 / 7',
  gap: 180,
  step: 110,
  depth: 60,
  depthStep: 12,
  rotBase: 58,
  rotStep: 72,
  perspective: 700,
  centerScale: 1.02,
  scaleDrop: 0.18,
  scaleStep: 0.14,
  visiblePerSide: 2,
  dragUnit: 210,
  designWidth: 380,
  minScale: 0.78,
};

export default function FeaturedSlider({ items, onOpen }) {
  const sliderRef = useRef(null);
  const stageRef = useRef(null);
  const cardsRef = useRef([]);
  const proxyRef = useRef(null);
  const draggableRef = useRef(null);
  const positionRef = useRef(0);
  const spreadRef = useRef(1);
  const rsRef = useRef(1);
  const configRef = useRef({ ...CONFIG_DESKTOP });
  const isDraggingRef = useRef(false);
  const curActiveRef = useRef(0);
  const autoplayTimerRef = useRef(null);
  const isHoveredRef = useRef(false);

  const [activeIdx, setActiveIdx] = useState(0);

  // Filter featured or fallback to top items
  const baseItems = useMemo(() => {
    const list = (items || []).filter((p) => p.featured);
    return list.length > 0 ? list : (items || []).slice(0, 8);
  }, [items]);

  const baseCount = baseItems.length;

  // Duplicate items cyclically so 3D coverflow wrap has sufficient cards on both sides
  const displayList = useMemo(() => {
    if (baseCount === 0) return [];
    let expanded = [];
    const minTarget = 8;
    const copies = Math.max(1, Math.ceil(minTarget / baseCount));
    for (let c = 0; c < copies; c++) {
      expanded = expanded.concat(
        baseItems.map((item, idx) => ({
          ...item,
          _virtualKey: `${item.id}-${c}-${idx}`,
          _originalIndex: idx,
        }))
      );
    }
    return expanded;
  }, [baseItems, baseCount]);

  const COUNT = displayList.length;

  // Compute responsive scale factor
  const computeScale = useCallback(() => {
    rsRef.current = gsap.utils.clamp(
      configRef.current.minScale,
      1,
      window.innerWidth / configRef.current.designWidth
    );
  }, []);

  // Place cards in 3D perspective space
  const renderCards = useCallback((pos) => {
    if (!stageRef.current || !COUNT) return;
    const wrapOffset = gsap.utils.wrap(-COUNT / 2, COUNT / 2);

    const roundedPos = Math.round(pos);
    const centerIdx = ((roundedPos % baseCount) + baseCount) % baseCount;
    if (centerIdx !== curActiveRef.current) {
      curActiveRef.current = centerIdx;
      setActiveIdx(centerIdx);
    }

    const cfg = configRef.current;
    const spread = spreadRef.current;
    const rs = rsRef.current;

    for (let i = 0; i < COUNT; i++) {
      const card = cardsRef.current[i];
      if (!card) continue;

      const off = wrapOffset(i - pos);
      const d = Math.abs(off);
      const side = Math.sign(off);
      const t = Math.min(d, 1);
      const rest = Math.max(d - 1, 0);

      const stack = cfg.step * ((1 - Math.pow(cfg.stepDecay, rest)) / (1 - cfg.stepDecay));
      const rotation = (t * cfg.rotBase + rest * cfg.rotStep) * spread;

      const isCenter = d < 0.45;
      if (isCenter && !card.classList.contains('is-active-card')) {
        card.classList.add('is-active-card');
      } else if (!isCenter && card.classList.contains('is-active-card')) {
        card.classList.remove('is-active-card');
      }

      gsap.set(card, {
        x: side * (t * cfg.gap + stack) * rs * spread,
        z: -(t * cfg.depth + rest * cfg.depthStep) * rs * spread,
        rotationY: -side * rotation,
        scale: cfg.centerScale - t * cfg.scaleDrop - rest * cfg.scaleStep,
        opacity: gsap.utils.clamp(0, 1, (cfg.visiblePerSide + cfg.fadeZone - d) / cfg.fadeZone),
        zIndex: Math.round((COUNT - d) * 10),
        force3D: true,
      });
    }
  }, [COUNT, baseCount]);

  // Update position from proxy
  const updateFromProxy = useCallback(() => {
    if (!draggableRef.current) return;
    positionRef.current = -draggableRef.current.x / configRef.current.dragUnit;
    renderCards(positionRef.current);
  }, [renderCards]);

  // Animate by relative offset
  const goToOffset = useCallback((off) => {
    if (!proxyRef.current || !draggableRef.current) return;
    const targetX = -(positionRef.current + off) * configRef.current.dragUnit;
    gsap.killTweensOf(proxyRef.current);
    gsap.to(proxyRef.current, {
      x: targetX,
      duration: 0.65,
      ease: 'power3.out',
      onUpdate: () => {
        draggableRef.current?.update();
        updateFromProxy();
      },
    });
  }, [updateFromProxy]);

  // Navigation handlers
  const handleNext = useCallback(() => goToOffset(1), [goToOffset]);
  const handlePrev = useCallback(() => goToOffset(-1), [goToOffset]);

  // Jump to specific index from dots
  const goToOriginalIndex = useCallback((targetIdx) => {
    if (!COUNT) return;
    const wrapOffset = gsap.utils.wrap(-COUNT / 2, COUNT / 2);
    let minDiff = Infinity;
    let chosenOff = 0;
    for (let i = 0; i < COUNT; i++) {
      if (displayList[i]._originalIndex === targetIdx) {
        const off = wrapOffset(i - positionRef.current);
        if (Math.abs(off) < Math.abs(minDiff)) {
          minDiff = off;
          chosenOff = off;
        }
      }
    }
    goToOffset(chosenOff);
  }, [COUNT, displayList, goToOffset]);

  // Autoplay management
  const resetAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    if (baseCount < 2) return;
    autoplayTimerRef.current = setInterval(() => {
      if (!isHoveredRef.current && !isDraggingRef.current) {
        handleNext();
      }
    }, 5500);
  }, [baseCount, handleNext]);

  // Setup GSAP Draggable and layout
  useEffect(() => {
    if (!sliderRef.current || !stageRef.current || COUNT === 0) return;

    if (!proxyRef.current) {
      proxyRef.current = document.createElement('div');
    }
    const proxy = proxyRef.current;
    const slider = sliderRef.current;
    const stage = stageRef.current;

    stage.style.perspectiveOrigin = '50% 50%';

    // Center each card
    cardsRef.current.forEach((card) => {
      if (card) gsap.set(card, { xPercent: -50, yPercent: -50 });
    });

    const mq = window.matchMedia('(max-width: 767px)');
    const applyBreakpoint = () => {
      const active = mq.matches
        ? { ...CONFIG_DESKTOP, ...CONFIG_MOBILE }
        : CONFIG_DESKTOP;
      configRef.current = active;

      cardsRef.current.forEach((card) => {
        if (card) {
          card.style.width = active.cardWidth;
          card.style.aspectRatio = active.cardAspect;
        }
      });
      stage.style.perspective = `${active.perspective}px`;

      gsap.set(proxy, { x: -positionRef.current * active.dragUnit });
      draggableRef.current?.update();
      computeScale();
      renderCards(positionRef.current);
    };

    // Initialize Draggable
    let startX = 0;
    const [inst] = Draggable.create(proxy, {
      type: 'x',
      trigger: slider,
      inertia: true,
      snap: (value) => Math.round(value / configRef.current.dragUnit) * configRef.current.dragUnit,
      maxDuration: configRef.current.maxThrowDuration,
      onPress() {
        isDraggingRef.current = false;
        startX = this.x;
        slider.classList.add('is-grabbing');
        gsap.killTweensOf(proxy);
      },
      onDrag() {
        if (Math.abs(this.x - startX) > 6) {
          isDraggingRef.current = true;
        }
        updateFromProxy();
      },
      onThrowUpdate: updateFromProxy,
      onRelease() {
        slider.classList.remove('is-grabbing');
        setTimeout(() => { isDraggingRef.current = false; }, 100);
      },
      onDragEnd() {
        if (!this.tween || !this.tween.isActive()) {
          const snapped = Math.round(this.x / configRef.current.dragUnit) * configRef.current.dragUnit;
          gsap.to(proxy, {
            x: snapped,
            duration: 0.5,
            ease: 'power3.out',
            onUpdate: () => {
              inst.update();
              updateFromProxy();
            },
          });
        }
      },
    });
    draggableRef.current = inst;

    applyBreakpoint();
    mq.addEventListener('change', applyBreakpoint);
    const handleResize = () => {
      computeScale();
      renderCards(positionRef.current);
    };
    window.addEventListener('resize', handleResize);

    // Intro fan-out animation
    spreadRef.current = 0;
    gsap.to(spreadRef, {
      current: 1,
      duration: configRef.current.introDuration,
      delay: configRef.current.introDelay,
      ease: configRef.current.introEase,
      onUpdate() {
        renderCards(positionRef.current);
      },
    });

    resetAutoplay();

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
      mq.removeEventListener('change', applyBreakpoint);
      window.removeEventListener('resize', handleResize);
      inst.kill();
    };
  }, [COUNT, computeScale, renderCards, resetAutoplay, updateFromProxy]);

  // Card click: open lightbox if center, else glide to center
  const handleCardClick = (cardIndex, item) => {
    if (isDraggingRef.current) return;
    const wrapOffset = gsap.utils.wrap(-COUNT / 2, COUNT / 2);
    const off = wrapOffset(cardIndex - positionRef.current);
    if (Math.abs(off) < 0.35) {
      if (onOpen) onOpen(item.id);
    } else {
      goToOffset(off);
    }
  };

  if (!baseCount) return null;

  const currentItem = baseItems[activeIdx] || baseItems[0];

  return (
    <section className="coverflow-container my-3 md:my-5" aria-label="پروژه‌های منتخب ۳ بعدی">
      {/* Top Header / Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--acc)] mb-0.5">
            <Sparkles size={14} className="animate-pulse" />
            <span>منتخب‌های ویژه ملکی</span>
          </div>
          <h2 className="text-lg md:text-xl font-black text-[var(--ink)] tracking-tight">
            نمونه‌کارهای برگزیده و نئون مدرن
          </h2>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="قبلی"
            onClick={handlePrev}
            className="coverflow-nav-btn p-2 md:p-2.5 rounded-full flex items-center justify-center cursor-pointer"
            title="پروژه قبلی"
          >
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            aria-label="بعدی"
            onClick={handleNext}
            className="coverflow-nav-btn p-2 md:p-2.5 rounded-full flex items-center justify-center cursor-pointer"
            title="پروژه بعدی"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* Main 3D Stage */}
      <div
        ref={sliderRef}
        className="coverflow-stage-wrapper"
        onMouseEnter={() => { isHoveredRef.current = true; }}
        onMouseLeave={() => { isHoveredRef.current = false; }}
      >
        {/* Central ambient glow */}
        <div className="coverflow-ambient-glow" />

        {/* Dynamic theme edge fades */}
        <div className="coverflow-edge-left" />
        <div className="coverflow-edge-right" />

        {/* 3D Stage holding cards */}
        <div ref={stageRef} className="coverflow-stage">
          {displayList.map((item, index) => {
            const isCenter = index % baseCount === activeIdx;
            return (
              <div
                key={item._virtualKey}
                ref={(el) => (cardsRef.current[index] = el)}
                onClick={() => handleCardClick(index, item)}
                className={`coverflow-card cursor-pointer group ${isCenter ? 'is-active-card' : ''}`}
                style={{
                  width: configRef.current.cardWidth,
                  aspectRatio: configRef.current.cardAspect,
                }}
              >
                <img
                  src={item.image}
                  alt={item.title || 'پروژه'}
                  loading="lazy"
                  draggable={false}
                />

                {/* Bottom glass/gradient caption */}
                <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white pointer-events-none transition-opacity duration-300">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="chip on !text-[11px] font-bold !py-0.5 !px-2 shadow-sm !cursor-default">
                      {item.category || 'نئون'}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                      <Heart size={12} className="fill-[var(--acc)] text-[var(--acc)]" />
                      <span>{item.likes || 0}</span>
                    </span>
                  </div>
                  <h3 className="font-bold text-sm md:text-base leading-tight drop-shadow truncate text-right">
                    {item.title}
                  </h3>
                </div>

                {/* Center Hover Action Hint */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                  <span className="bg-[var(--card)]/90 text-[var(--ink)] border border-[var(--line)] backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 transform scale-95 group-hover:scale-100 transition-transform">
                    <Eye size={14} className="text-[var(--acc)]" />
                    <span>مشاهده تصویر بزرگ</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drag Hint */}
        <div className="coverflow-hint flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--acc)] animate-ping" />
          <span>برای چرخش ۳ بعدی بکشید • برای جزئیات کلیک کنید</span>
        </div>
      </div>

      {/* Pagination Dots & Active Summary */}
      {baseCount > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 px-1">
          <div className="flex items-center gap-1.5">
            {baseItems.map((item, idx) => {
              const isActive = idx === activeIdx;
              return (
                <button
                  key={item.id || idx}
                  type="button"
                  aria-label={`اسلاید ${idx + 1}: ${item.title}`}
                  onClick={() => goToOriginalIndex(idx)}
                  className="h-2 rounded-full transition-all duration-300 cursor-pointer"
                  style={{
                    width: isActive ? 26 : 8,
                    background: isActive ? 'var(--acc)' : 'var(--line)',
                    boxShadow: isActive ? '0 0 10px var(--glow)' : 'none',
                  }}
                />
              );
            })}
          </div>

          <div className="text-xs text-[var(--mut)] truncate max-w-[280px] md:max-w-md text-left font-medium">
            <span className="text-[var(--acc)] font-bold">{activeIdx + 1}</span>
            <span> / {baseCount} — </span>
            <span className="text-[var(--ink)] font-semibold">{currentItem.title}</span>
          </div>
        </div>
      )}
    </section>
  );
}
