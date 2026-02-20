// RenderJob state machine and manager

import { RenderJob, RenderJobStatus, CacheEntry } from '../types';

export class JobManager {
  private jobs: Map<string, RenderJob> = new Map();

  createJob(params: {
    surahNumber: number;
    ayahRangeStart: number;
    ayahRangeEnd: number;
    reciterId: string;
    videoSource: any;
    subtitleConfig: any;
    aspectRatio: RenderJob['aspectRatio'];
  }): RenderJob {
    const job: RenderJob = {
      id: crypto.randomUUID(),
      status: 'queued',
      surahNumber: params.surahNumber,
      ayahRangeStart: params.ayahRangeStart,
      ayahRangeEnd: params.ayahRangeEnd,
      reciterId: params.reciterId,
      videoSource: params.videoSource,
      subtitleConfig: params.subtitleConfig,
      aspectRatio: params.aspectRatio,
      createdAt: new Date(),
    };
    this.jobs.set(job.id, job);
    return job;
  }

  getJob(id: string): RenderJob | undefined {
    return this.jobs.get(id);
  }

  async transitionTo(jobId: string, newStatus: RenderJobStatus, updates: Partial<RenderJob> = {}): Promise<RenderJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    // Validate transition
    const allowed: Record<RenderJobStatus, RenderJobStatus[]> = {
      'queued': ['processing'],
      'processing': ['completed', 'failed'],
      'completed': [],
      'failed': [],
    };
    if (!allowed[job.status].includes(newStatus)) {
      throw new Error(`Invalid job status transition: ${job.status} → ${newStatus}`);
    }
    const updated = { ...job, ...updates, status: newStatus };
    if (newStatus === 'processing' && !updates.startedAt) {
      updated.startedAt = new Date();
    }
    if ((newStatus === 'completed' || newStatus === 'failed') && !updates.completedAt) {
      updated.completedAt = new Date();
    }
    this.jobs.set(jobId, updated);
    return updated;
  }

  listJobs(): RenderJob[] {
    return Array.from(this.jobs.values());
  }
}

// Singleton instance
export const jobManager = new JobManager();
