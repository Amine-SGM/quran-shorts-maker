// Stub job manager
export class JobManager {
  private jobs: Map<string, any> = new Map();

  createJob(params: any): any {
    const job = {
      id: Math.random().toString(36),
      status: 'queued',
      ...params,
      createdAt: new Date(),
    };
    this.jobs.set(job.id, job);
    return job;
  }

  getJob(id: string): any {
    return this.jobs.get(id);
  }

  async transitionTo(jobId: string, newStatus: string, updates: any = {}): Promise<any> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    const updated = { ...job, ...updates, status: newStatus };
    this.jobs.set(jobId, updated);
    return updated;
  }
}

export const jobManager = new JobManager();
