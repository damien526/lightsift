import type { WorkerJob, WorkerResult } from './extract.worker';

/**
 * Fixed pool of extraction workers fed from a FIFO queue. Results stream back
 * through a single callback so the grid fills in as previews land.
 */
export class ExtractPool {
  private workers: Worker[] = [];
  private queue: WorkerJob[] = [];
  private busy = new Set<Worker>();
  private onResult: (r: WorkerResult) => void;

  constructor(onResult: (r: WorkerResult) => void) {
    this.onResult = onResult;
    const n = Math.min(4, Math.max(2, (navigator.hardwareConcurrency || 4) - 1));
    for (let i = 0; i < n; i++) {
      const w = new Worker(new URL('./extract.worker.ts', import.meta.url));
      w.onmessage = (e: MessageEvent<WorkerResult>) => {
        this.busy.delete(w);
        this.onResult(e.data);
        this.pump();
      };
      w.onerror = () => {
        this.busy.delete(w);
        this.pump();
      };
      this.workers.push(w);
    }
  }

  enqueue(jobs: WorkerJob[]): void {
    this.queue.push(...jobs);
    this.pump();
  }

  private pump(): void {
    for (const w of this.workers) {
      if (this.queue.length === 0) return;
      if (!this.busy.has(w)) {
        const job = this.queue.shift()!;
        this.busy.add(w);
        w.postMessage(job);
      }
    }
  }

  destroy(): void {
    this.queue = [];
    for (const w of this.workers) w.terminate();
    this.workers = [];
    this.busy.clear();
  }
}
