'use client';

import { useState, useEffect } from 'react';

interface PromiseClockProps {
  text: string;
  dueAt: Date;
  createdAt: Date;
  keptHistory?: boolean[]; // true = kept, false = broken
  className?: string;
}

export function PromiseClock({
  text,
  dueAt,
  createdAt,
  keptHistory = [],
  className = '',
}: PromiseClockProps) {
  const now = new Date();
  const dueDate = new Date(dueAt);
  const startDate = new Date(createdAt);

  const totalDays = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = totalDays - daysLeft;

  const progress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
  const isPastDue = daysLeft < 0;
  const isTight = daysLeft <= 7 && daysLeft > 0;

  // Determine bar color
  let barClass = 'bg-go';
  if (isPastDue) {
    barClass = 'bg-dead';
  } else if (isTight) {
    barClass = 'bg-warn';
  }

  // Format time left
  let timeLeftText = `${daysLeft}d left`;
  if (isPastDue) {
    timeLeftText = `${Math.abs(daysLeft)}d overdue`;
  } else if (daysLeft === 0) {
    timeLeftText = 'Due today';
  } else if (daysLeft === 1) {
    timeLeftText = '1d left';
  }

  return (
    <div className={`bg-soft border border-rule rounded-[10px] p-[11px_12px] ${className}`}>
      <div className="text-[10px] tracking-[0.1em] uppercase text-ink-3 font-semibold mb-[5px]">
        Public promise
      </div>
      <div className="flex justify-between gap-[10px] items-baseline">
        <div className="text-[13px] font-semibold leading-[1.35]">{text}</div>
        <div
          className={`font-mono text-[11.5px] whitespace-nowrap font-medium ${
            isPastDue ? 'text-dead' : isTight ? 'text-warn' : 'text-go-deep'
          }`}
        >
          {timeLeftText}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[5px] bg-[#E7E7E3] rounded-full overflow-hidden mt-[9px] relative">
        <i
          className={`block h-full rounded-full ${barClass} transition-all duration-1000`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Promise history dots */}
      {keptHistory.length > 0 && (
        <div className="flex gap-[5px] mt-[9px] items-center">
          {keptHistory.map((kept, i) => (
            <b
              key={i}
              className={`w-[7px] h-[7px] rounded-full block ${kept ? 'bg-go' : 'bg-dead'}`}
            />
          ))}
          <span className="text-[11px] text-ink-3 ml-1">
            {keptHistory.filter(Boolean).length}/{keptHistory.length} kept
          </span>
        </div>
      )}
    </div>
  );
}
