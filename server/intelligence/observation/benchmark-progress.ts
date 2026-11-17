/**
 * Benchmark Progress Tracking
 *
 * Tracks real-time progress during benchmark execution.
 * Provides estimated time remaining and current question status.
 */

export interface BenchmarkProgressState {
  isRunning: boolean;
  mode: "quick" | "full" | "certification" | null;
  completed: number;
  total: number;
  current: { id: string; category: string } | null;
  startTime: number | null;
  elapsedMs: number;
  estimatedRemainingMs: number;
  percentComplete: number;
}

class BenchmarkProgressTracker {
  private state: BenchmarkProgressState = {
    isRunning: false,
    mode: null,
    completed: 0,
    total: 0,
    current: null,
    startTime: null,
    elapsedMs: 0,
    estimatedRemainingMs: 0,
    percentComplete: 0,
  };

  start(mode: "quick" | "full" | "certification", total: number) {
    this.state = {
      isRunning: true,
      mode,
      completed: 0,
      total,
      current: null,
      startTime: Date.now(),
      elapsedMs: 0,
      estimatedRemainingMs: 0,
      percentComplete: 0,
    };
  }

  updateCurrent(id: string, category: string) {
    this.state.current = { id, category };
  }

  updateProgress(completed: number) {
    if (!this.state.startTime) return;

    this.state.completed = completed;
    this.state.elapsedMs = Date.now() - this.state.startTime;
    this.state.percentComplete = (completed / this.state.total) * 100;

    if (completed > 0) {
      const msPerQuestion = this.state.elapsedMs / completed;
      const remaining = this.state.total - completed;
      this.state.estimatedRemainingMs = msPerQuestion * remaining;
    }
  }

  finish() {
    this.state.isRunning = false;
  }

  getProgress(): BenchmarkProgressState {
    return { ...this.state };
  }

  reset() {
    this.state = {
      isRunning: false,
      mode: null,
      completed: 0,
      total: 0,
      current: null,
      startTime: null,
      elapsedMs: 0,
      estimatedRemainingMs: 0,
      percentComplete: 0,
    };
  }
}

export const benchmarkProgress = new BenchmarkProgressTracker();
