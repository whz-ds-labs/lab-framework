import { serveJobs } from '@whz-ds-labs/lab-kit/worker'
import { bootstrapSlope } from '../core/bootstrap'
import type { LineJob } from './jobs'

serveJobs((job: LineJob) => bootstrapSlope(job.points, job.B, job.seed))
