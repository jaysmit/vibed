// Timing utility for debugging slow data fetching
// Logs to console (visible in Vercel logs) with timing breakdowns

export interface TimingStep {
  name: string;
  duration: number;
  timestamp: number;
}

export interface TimingResult {
  total: number;
  steps: TimingStep[];
  label: string;
}

export class Timer {
  private label: string;
  private startTime: number;
  private steps: TimingStep[] = [];
  private lastStep: number;

  constructor(label: string) {
    this.label = label;
    this.startTime = performance.now();
    this.lastStep = this.startTime;
  }

  step(name: string): void {
    const now = performance.now();
    const duration = now - this.lastStep;
    this.steps.push({
      name,
      duration: Math.round(duration * 100) / 100,
      timestamp: Math.round((now - this.startTime) * 100) / 100,
    });
    this.lastStep = now;
  }

  end(): TimingResult {
    const total = Math.round((performance.now() - this.startTime) * 100) / 100;

    // Log to console (appears in Vercel logs)
    const stepLog = this.steps
      .map((s) => `  ${s.name}: ${s.duration}ms`)
      .join('\n');

    console.log(`\n⏱️ [TIMING] ${this.label}: ${total}ms total\n${stepLog}`);

    return {
      label: this.label,
      total,
      steps: this.steps,
    };
  }
}

// Simple timing wrapper for async functions
export async function timed<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; timing: TimingResult }> {
  const timer = new Timer(label);
  timer.step('start');
  const result = await fn();
  timer.step('complete');
  const timing = timer.end();
  return { result, timing };
}

// Collect multiple timings and format for display
export function formatTimings(timings: TimingResult[]): string {
  const lines = timings.map((t) => {
    const steps = t.steps.map((s) => `${s.name}:${s.duration}ms`).join(' → ');
    return `${t.label}: ${t.total}ms (${steps})`;
  });
  return lines.join('\n');
}

// Server timing header format (for browser devtools)
export function toServerTimingHeader(timings: TimingResult[]): string {
  return timings
    .map((t) => `${t.label.replace(/\s+/g, '-')};dur=${t.total}`)
    .join(', ');
}
