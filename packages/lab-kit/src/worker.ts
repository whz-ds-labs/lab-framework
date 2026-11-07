/**
 * DOM-free worker entry (`@whz-ds-labs/lab-kit/worker`). Imports only `errors.ts` (no vue, no DOM, no shared
 * state), so a Web Worker or plain Node can import it.
 *
 * Main-thread client for a job worker. One run at a time per client: starting a run or cancelling terminates
 * the busy worker (a fresh one is created lazily) and every response is matched by `runId`, so a result of a
 * cancelled run is never applied. A tool keeps one client per job kind, so a run of one kind never cancels
 * a run of another. There is deliberately no default worker: the `new Worker(new URL(...), import.meta.url)`
 * call must live in the lab so that Vite bundles the worker file.
 */
import { LabError } from './errors'

export { LabError }

export type WorkerRequest<J> = { type: 'run'; runId: number; job: J }

export type WorkerResponse<R> =
  | { type: 'progress'; runId: number; done: number; total: number }
  | { type: 'done'; runId: number; result: R }
  | { type: 'error'; runId: number; code: string; details?: Record<string, unknown>; message: string }

export interface JobHandle<R> {
  runId: number
  promise: Promise<R>
  cancel(): void
}

export interface JobClient<J, R> {
  start(job: J, onProgress?: (done: number, total: number) => void): JobHandle<R>
  /** Cancels the pending run and terminates the worker; a later `start` creates a new one. */
  dispose(): void
}

interface Pending<R> {
  runId: number
  onProgress?: (done: number, total: number) => void
  resolve: (r: R) => void
  reject: (e: LabError) => void
}

export function createJobClient<J, R>(createWorker: () => Worker): JobClient<J, R> {
  let worker: Worker | null = null
  let pending: Pending<R> | null = null
  let lastRunId = 0

  function dropWorker(): void {
    if (!worker) return
    worker.onmessage = null
    worker.onerror = null
    worker.onmessageerror = null
    worker.terminate()
    worker = null
  }

  function settle(runId: number): Pending<R> | null {
    if (!pending || pending.runId !== runId) return null
    const p = pending
    pending = null
    return p
  }

  function onMessage(ev: MessageEvent<WorkerResponse<R>>): void {
    const msg = ev.data
    if (!pending || msg.runId !== pending.runId) return // stale message of a cancelled or finished run
    if (msg.type === 'progress') pending.onProgress?.(msg.done, msg.total)
    else if (msg.type === 'done') settle(msg.runId)?.resolve(msg.result)
    else settle(msg.runId)?.reject(new LabError(msg.code, msg.details, msg.message))
  }

  /** Rejects the current run with WORKER_FAILED and discards the worker (it may still be busy). */
  function failCurrent(details: Record<string, unknown>): void {
    const p = pending
    pending = null
    dropWorker()
    p?.reject(new LabError('WORKER_FAILED', details))
  }

  function ensureWorker(): Worker {
    if (!worker) {
      worker = createWorker()
      worker.onmessage = onMessage as (ev: MessageEvent) => void
      worker.onerror = (ev: ErrorEvent) => failCurrent({ reason: 'workerError', message: ev.message })
      worker.onmessageerror = () => failCurrent({ reason: 'messageError' })
    }
    return worker
  }

  function cancelRun(runId: number): void {
    const p = settle(runId)
    if (!p) return
    dropWorker()
    p.reject(new LabError('CANCELLED'))
  }

  function start(job: J, onProgress?: (done: number, total: number) => void): JobHandle<R> {
    if (pending) cancelRun(pending.runId)
    const runId = ++lastRunId
    const promise = new Promise<R>((resolve, reject) => {
      pending = { runId, onProgress, resolve, reject }
    })
    const request: WorkerRequest<J> = { type: 'run', runId, job }
    try {
      ensureWorker().postMessage(request)
    } catch (e) {
      // Worker creation or structured cloning failed synchronously: settle this run now so no orphaned
      // promise remains pending; the caller observes the rejection through `promise`.
      failCurrent({ reason: 'postFailed', message: e instanceof Error ? e.message : String(e) })
    }
    return { runId, promise, cancel: () => cancelRun(runId) }
  }

  function dispose(): void {
    if (pending) cancelRun(pending.runId)
    dropWorker()
  }

  return { start, dispose }
}

/** Minimal slice of a worker global scope that `serveJobs` needs. */
interface JobScope {
  onmessage: ((ev: MessageEvent<WorkerRequest<never>>) => unknown) | null
  postMessage(msg: unknown): void
}

/**
 * Worker side: runs each incoming job with `run` and answers with `progress`/`done`/`error` messages. A thrown
 * `LabError` keeps its code and details; anything else becomes `WORKER_FAILED`. Protocol: WorkerRequest/WorkerResponse.
 */
export function serveJobs<J, R>(
  run: (job: J, progress: (done: number, total: number) => void) => R | Promise<R>,
  scope: typeof globalThis = globalThis,
): void {
  const s = scope as unknown as JobScope
  const post = (msg: WorkerResponse<R>): void => s.postMessage(msg)

  s.onmessage = async (ev: MessageEvent<WorkerRequest<never>>) => {
    const { runId, job } = ev.data as WorkerRequest<J>
    try {
      const result = await run(job, (done, total) => post({ type: 'progress', runId, done, total }))
      post({ type: 'done', runId, result })
    } catch (e) {
      if (e instanceof LabError) {
        post({ type: 'error', runId, code: e.code, details: e.details, message: e.message })
      } else {
        const message = e instanceof Error ? e.message : String(e)
        post({ type: 'error', runId, code: 'WORKER_FAILED', details: { reason: 'internal', message }, message })
      }
    }
  }
}
