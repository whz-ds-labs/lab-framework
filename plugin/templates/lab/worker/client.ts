import { createJobClient } from '@whz-ds-labs/lab-kit/worker'
import type { LineJob } from './jobs'

// The Worker call lives here (not in lab-kit) so that Vite bundles line.worker.ts as its own chunk.
export const lineClient = createJobClient<LineJob, { lo: number; hi: number }>(
  () => new Worker(new URL('./line.worker.ts', import.meta.url), { type: 'module' }),
)
