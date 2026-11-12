"use client";

import React, { useRef, useState, useEffect } from "react";

export interface StatCardItem {
  id: string;
  label: string;
  value: number | string;
  bgIcon: string;
  shadowIcon: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

interface ScrollingStatCardsProps {
  items: StatCardItem[];
  loading?: boolean;
  desktopGridCols?: string; // e.g. "lg:grid-cols-3" or "lg:grid-cols-5"
}

export function ScrollingStatCards({
  items,
  loading = false,
  desktopGridCols = "lg:grid-cols-3",
}: ScrollingStatCardsProps) {
  const statScrollRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isPointerDownRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);

  // Pause auto-drift immediately
  const startInteracting = () => {
    isInteractingRef.current = true;
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  };

  // Schedule auto-drift to resume after user inactivity
  const scheduleResume = (delayMs: number = 1500) => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      resumeTimeoutRef.current = null;
    }, delayMs);
  };

  // Pointer drag handling (works for mouse & touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;

    hasDraggedRef.current = false;
    startInteracting();
    isPointerDownRef.current = true;
    setIsDragging(true);

    if (statScrollRef.current) {
      startXRef.current = e.pageX - statScrollRef.current.offsetLeft;
      startScrollLeftRef.current = statScrollRef.current.scrollLeft;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || !statScrollRef.current) return;
    const x = e.pageX - statScrollRef.current.offsetLeft;
    if (Math.abs(x - startXRef.current) > 6) {
      hasDraggedRef.current = true;
    }
    const walk = (x - startXRef.current) * 1.2;
    statScrollRef.current.scrollLeft = startScrollLeftRef.current - walk;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    scheduleResume(1500);
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 100);
  };

  // Wheel handling for trackpad / mousewheel horizontal scroll
  const handleWheel = () => {
    startInteracting();
    scheduleResume(1500);
  };

  // Main auto-drift animation loop (independent of parent re-renders)
  useEffect(() => {
    const el = statScrollRef.current;
    if (!el) return;

    // Set initial position to middle set after layout renders
    const setWidth = el.scrollWidth / 3;
    if (setWidth > 0 && el.scrollLeft < setWidth / 2) {
      el.scrollLeft = setWidth;
    }

    let animationFrameId: number;
    let lastTime = performance.now();

    const step = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      if (!isInteractingRef.current && el) {
        // Continuous smooth auto-drift (~32px per second)
        el.scrollLeft += delta * 0.032;
        const currentSetWidth = el.scrollWidth / 3;
        if (currentSetWidth > 0 && el.scrollLeft >= currentSetWidth * 2) {
          el.scrollLeft -= currentSetWidth;
        }
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [loading]);

  // Clean up pending timeout only on unmount
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);

  const renderStatValue = (val: string | number, isMobile: boolean) => {
    if (loading) return "...";
    if (typeof val === "number") {
      return (
        <span className={isMobile ? "text-[15px] sm:text-lg font-bold text-slate-900" : "text-xl sm:text-2xl font-bold text-slate-900"}>
          {val}
        </span>
      );
    }
    const str = String(val).trim();
    const match = str.match(/^([^\s]+)\s+(.+)$/);
    if (match) {
      const [, numPart, unitPart] = match;
      return (
        <span className="inline-flex items-baseline gap-1 truncate">
          <span className={isMobile ? "text-[15px] sm:text-lg font-bold text-slate-900" : "text-xl sm:text-2xl font-bold text-slate-900"}>
            {numPart}
          </span>
          <span className={isMobile ? "text-[10.5px] sm:text-xs font-normal text-slate-400" : "text-xs sm:text-sm font-normal text-slate-400"}>
            {unitPart}
          </span>
        </span>
      );
    }
    return (
      <span className={isMobile ? "text-[15px] sm:text-lg font-bold text-slate-900" : "text-xl sm:text-2xl font-bold text-slate-900"}>
        {str}
      </span>
    );
  };

  const renderStatCard = (item: StatCardItem, keySuffix: string = "", isMobile: boolean = false) => {
    const isClickable = Boolean(item.onClick);
    return (
      <div
        key={`${item.id}${keySuffix}`}
        onClick={() => {
          if (item.onClick && !hasDraggedRef.current) {
            item.onClick();
          }
        }}
        className={`${
          isMobile
            ? "min-w-[160px] sm:min-w-[180px] p-3 sm:p-4 gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl"
            : "min-w-[170px] sm:min-w-[190px] lg:min-w-0 flex-1 flex-shrink-0 lg:flex-shrink p-3.5 sm:p-5 gap-3 sm:gap-4 rounded-2xl"
        } bg-white border shadow-sm flex items-center select-none transition-all ${
          isClickable
            ? "cursor-pointer hover:shadow-md hover:border-slate-300 active:scale-[0.98]"
            : "cursor-default"
        } ${
          item.active
            ? "ring-2 ring-blue-500 border-blue-500/80 bg-blue-50/20 shadow-xs"
            : "border-slate-100"
        }`}
      >
        <div
          className={`${
            isMobile
              ? "w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl [&>svg]:w-4.5 [&>svg]:h-4.5 sm:[&>svg]:w-5.5 sm:[&>svg]:h-5.5"
              : "w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl"
          } ${item.bgIcon} flex items-center justify-center text-white flex-shrink-0 shadow-md ${item.shadowIcon}`}
        >
          {item.icon}
        </div>
        <div className="min-w-0">
          <p
            className={`${isMobile ? "text-[10px] sm:text-[11px]" : "text-[10.5px] sm:text-xs"} font-semibold text-slate-400 line-clamp-2 leading-snug`}
            title={item.label}
          >
            {item.label}
          </p>
          <div className="mt-0.5 tracking-tight truncate leading-tight">
            {renderStatValue(item.value, isMobile)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile/Tablet Continuous Auto-Drift & Manual Swipe (< lg) */}
      <div className="relative block lg:hidden -mx-5 px-5">
        {/* Soft Left & Right gradient fade mask */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#f8fafc] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#f8fafc] to-transparent z-10" />

        <div
          ref={statScrollRef}
          className={`flex gap-3 sm:gap-4 py-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-y ${
            isDragging ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={startInteracting}
          onTouchEnd={() => scheduleResume(1500)}
          onWheel={handleWheel}
          onScroll={() => {
            const el = statScrollRef.current;
            if (!el) return;
            const setWidth = el.scrollWidth / 3;
            if (setWidth > 0) {
              if (el.scrollLeft >= setWidth * 2) {
                el.scrollLeft -= setWidth;
              } else if (el.scrollLeft <= 5) {
                el.scrollLeft += setWidth;
              }
            }
            // If user is actively scrolling/dragging, refresh resume timer
            if (isInteractingRef.current) {
              scheduleResume(1500);
            }
          }}
        >
          {/* 3 identical sets to ensure seamless infinite wrapping in both directions */}
          {items.map((item) => renderStatCard(item, "-set1", true))}
          {items.map((item) => renderStatCard(item, "-set2", true))}
          {items.map((item) => renderStatCard(item, "-set3", true))}
        </div>
      </div>

      {/* Desktop Grid (lg+) */}
      <div className={`hidden lg:grid ${desktopGridCols} gap-3 sm:gap-4 lg:gap-5`}>
        {items.map((item) => renderStatCard(item, "", false))}
      </div>
    </>
  );
}
