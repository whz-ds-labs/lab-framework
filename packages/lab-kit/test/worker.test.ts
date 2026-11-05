import { describe, expect, it } from 'vitest'
import { LabError, createJobClient, serveJobs, type WorkerRequest, type WorkerResponse } from '../src/worker'

/** Generic job/result types: the client is job-agnostic. */
type Job = { k: number }
type Row = { value: number; trainMean: number; cvMean: number; cvStd: number }
type Res = WorkerResponse<Row[]>

/** Minimal stand-in for a dedicated Worker: records posted requests, lets the test emit responses. */
class FakeWorker {
  onmessage: ((ev: MessageEvent<Res>) => void) | null = null
  onerror: ((ev: ErrorEvent) => void) | null = null
  onmessageerror: ((ev: MessageEvent) => void) | null = null
  posted: WorkerRequest<Job>[] = []
  terminated = false
  throwOnPost = false
  postMessage(msg: WorkerRequest<Job>): void {
    if (this.throwOnPost) throw new Error('DataCloneError')
    this.posted.push(msg)
  }
  terminate(): void {
    this.terminated = true
  }
  emit(msg: Res): void {
    this.onmessage?.({ data: msg } as MessageEvent<Res>)
  }
}

const job = (k: number): Job => ({ k })
const rows = (v: number): Row[] => [{ value: 1, trainMean: v, cvMean: v, cvStd: 0 }]

function setup(opts: { throwOnPost?: boolean } = {}) {
  const workers: FakeWorker[] = []
  const client = createJobClient<Job, Row[]>(() => {
    const w = new FakeWorker()
    w.throwOnPost = workers.length === 0 && !!opts.throwOnPost
    workers.push(w)
    return w as unknown as Worker
  })
  return { workers, client }
}

const settle = <T>(p: Promise<T>) =>
  p.then(
    () => 'resolved' as const,
    (e: unknown) => e,
  )

describe('job client', () => {
  it('ignores a stale result after cancel + restart; only the new run resolves', async () => {
    const { workers, client } = setup()
    const progressA: number[] = []
    const progressB: number[] = []
    const a = client.start(job(2), (d) => progressA.push(d))
    const aOutcome = settle(a.promise)
    a.cancel()
    expect(workers[0].terminated).toBe(true)

    const b = client.start(job(3), (d) => progressB.push(d))
    expect(b.runId).not.toBe(a.runId)
    expect(workers).toHaveLength(2)
    expect(workers[1].posted[0]).toMatchObject({ type: 'run', runId: b.runId })

    // Stale messages for A arrive (on the old and on the new worker) before B's result.
    workers[0].emit({ type: 'done', runId: a.runId, result: rows(9) })
    workers[1].emit({ type: 'progress', runId: a.runId, done: 1, total: 1 })
    workers[1].emit({ type: 'done', runId: a.runId, result: rows(9) })
    workers[1].emit({ type: 'progress', runId: b.runId, done: 1, total: 4 })
    workers[1].emit({ type: 'done', runId: b.runId, result: rows(0.5) })

    expect(await b.promise).toEqual(rows(0.5))
    expect(progressA).toEqual([])
    expect(progressB).toEqual([1])
    expect(await aOutcome).toMatchObject({ code: 'CANCELLED' })
  })

  it('rejects with CANCELLED after cancel', async () => {
    const { client } = setup()
    const a = client.start(job(2))
    a.cancel()
    const err = await settle(a.promise)
    expect(err).toBeInstanceOf(LabError)
    expect(err).toMatchObject({ code: 'CANCELLED' })
  })

  it('keeps independent clients independent', async () => {
    const one = setup()
    const two = setup()
    const a = one.client.start(job(2))
    const aOutcome = settle(a.promise)
    const b = two.client.start(job(3))
    a.cancel()
    expect(one.workers[0].terminated).toBe(true)
    expect(two.workers[0].terminated).toBe(false)
    two.workers[0].emit({ type: 'done', runId: b.runId, result: rows(1) })
    await expect(b.promise).resolves.toEqual(rows(1))
    expect(await aOutcome).toMatchObject({ code: 'CANCELLED' })
  })

  it('reuses the worker for consecutive runs and rebuilds a LabError with code and details', async () => {
    const { workers, client } = setup()
    const a = client.start(job(2))
    workers[0].emit({ type: 'done', runId: a.runId, result: rows(1) })
    await a.promise
    const b = client.start(job(2))
    expect(workers).toHaveLength(1)
    workers[0].emit({ type: 'error', runId: b.runId, code: 'BAD_PARAM', details: { param: 'k' }, message: 'm' })
    const err = await settle(b.promise)
    expect(err).toBeInstanceOf(LabError)
    expect(err).toMatchObject({ code: 'BAD_PARAM', details: { param: 'k' }, message: 'm' })
  })

  it('starting a new run cancels the pending one', async () => {
    const { workers, client } = setup()
    const a = client.start(job(2))
    const aOutcome = settle(a.promise)
    const b = client.start(job(3))
    expect(await aOutcome).toMatchObject({ code: 'CANCELLED' })
    expect(workers[0].terminated).toBe(true)
    workers[1].emit({ type: 'done', runId: b.runId, result: rows(2) })
    await expect(b.promise).resolves.toEqual(rows(2))
  })

  it('rejects with WORKER_FAILED when the worker crashes and recreates it for the next run', async () => {
    const { workers, client } = setup()
    const a = client.start(job(2))
    workers[0].onerror?.({ message: 'crash' } as ErrorEvent)
    await expect(a.promise).rejects.toMatchObject({ code: 'WORKER_FAILED', details: { reason: 'workerError' } })
    expect(workers[0].terminated).toBe(true)
    client.start(job(2))
    expect(workers).toHaveLength(2)
  })

  it('cancel after completion is a no-op', async () => {
    const { workers, client } = setup()
    const a = client.start(job(2))
    workers[0].emit({ type: 'done', runId: a.runId, result: rows(1) })
    await a.promise
    a.cancel()
    expect(workers[0].terminated).toBe(false)
  })

  it('rejects (no orphaned pending run) when postMessage throws, then recovers', async () => {
    const { workers, client } = setup({ throwOnPost: true })
    const a = client.start(job(2))
    await expect(a.promise).rejects.toMatchObject({ code: 'WORKER_FAILED', details: { reason: 'postFailed' } })
    expect(workers[0].terminated).toBe(true)
    const b = client.start(job(2))
    expect(workers).toHaveLength(2)
    workers[1].emit({ type: 'done', runId: b.runId, result: rows(3) })
    await expect(b.promise).resolves.toEqual(rows(3))
  })

  it('rejects the current run on a messageerror event', async () => {
    const { workers, client } = setup()
    const a = client.start(job(2))
    workers[0].onmessageerror?.({} as MessageEvent)
    await expect(a.promise).rejects.toMatchObject({ code: 'WORKER_FAILED', details: { reason: 'messageError' } })
  })

  it('dispose cancels the pending run and terminates the worker; a later start creates a new one', async () => {
    const { workers, client } = setup()
    const a = client.start(job(2))
    const aOutcome = settle(a.promise)
    client.dispose()
    expect(workers[0].terminated).toBe(true)
    expect(await aOutcome).toMatchObject({ code: 'CANCELLED' })
    client.start(job(3))
    expect(workers).toHaveLength(2)
  })
})

/** Fake worker scope: `send` delivers a request to `onmessage`, `posted` records the responses. */
function fakeScope() {
  const scope = {
    onmessage: null as ((ev: MessageEvent<WorkerRequest<Job>>) => unknown) | null,
    posted: [] as WorkerResponse<number>[],
    postMessage(msg: WorkerResponse<number>) {
      this.posted.push(msg)
    },
    send(runId: number, j: Job) {
      return this.onmessage?.({ data: { type: 'run', runId, job: j } } as MessageEvent<WorkerRequest<Job>>)
    },
  }
  return scope
}

describe('serveJobs', () => {
  it('posts progress and done for a successful job (async runner)', async () => {
    const scope = fakeScope()
    serveJobs<Job, number>(
      async (j, progress) => {
        progress(1, 2)
        return j.k * 2
      },
      scope as unknown as typeof globalThis,
    )
    await scope.send(7, { k: 4 })
    expect(scope.posted).toEqual([
      { type: 'progress', runId: 7, done: 1, total: 2 },
      { type: 'done', runId: 7, result: 8 },
    ])
  })

  it('maps a thrown LabError to an error response with code and details', async () => {
    const scope = fakeScope()
    serveJobs<Job, number>(() => {
      throw new LabError('BAD_PARAM', { param: 'k' }, 'bad k')
    }, scope as unknown as typeof globalThis)
    await scope.send(1, { k: 0 })
    expect(scope.posted).toEqual([
      { type: 'error', runId: 1, code: 'BAD_PARAM', details: { param: 'k' }, message: 'bad k' },
    ])
  })

  it('maps any other throw (also async rejections) to WORKER_FAILED', async () => {
    const scope = fakeScope()
    serveJobs<Job, number>(async () => {
      throw new Error('boom')
    }, scope as unknown as typeof globalThis)
    await scope.send(2, { k: 0 })
    expect(scope.posted).toEqual([
      {
        type: 'error',
        runId: 2,
        code: 'WORKER_FAILED',
        details: { reason: 'internal', message: 'boom' },
        message: 'boom',
      },
    ])
  })

  it('round-trips through createJobClient', async () => {
    const scope = fakeScope()
    serveJobs<Job, number>((j) => j.k + 1, scope as unknown as typeof globalThis)
    const client = createJobClient<Job, number>(() => {
      const w = {
        onmessage: null as ((ev: MessageEvent) => void) | null,
        onerror: null,
        onmessageerror: null,
        terminate() {},
        postMessage(req: WorkerRequest<Job>) {
          scope.postMessage = (msg: WorkerResponse<number>) => w.onmessage?.({ data: msg } as MessageEvent)
          void scope.send(req.runId, req.job)
        },
      }
      return w as unknown as Worker
    })
    await expect(client.start({ k: 41 }).promise).resolves.toBe(42)
  })
})
