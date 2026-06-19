import { useCallback, useEffect, useRef, useState } from 'react';
import { type JobItem, openSSE, sandboxJobsApi } from '../api/sandboxClient';

/**
 * Live list of background jobs for a modality (or all). Polls every 4 seconds
 * AND subscribes to SSE for each running/pending job so progress is real-time.
 */
export function useSandboxJobs(modality?: string) {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const subsRef = useRef<Map<string, { close: () => void }>>(new Map());

  const refresh = useCallback(async () => {
    try {
      const list = await sandboxJobsApi.listRaw();
      const filtered = modality ? list.filter((j) => j.modality === modality) : list;
      setJobs(filtered);
    } catch {
      // ignore network blips
    } finally {
      setLoading(false);
    }
  }, [modality]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, [refresh]);

  // Subscribe to SSE for each active job
  useEffect(() => {
    const subs = subsRef.current;
    const activeIds = new Set(
      jobs.filter((j) => j.status === 'running' || j.status === 'pending').map((j) => j.id),
    );

    // Close finished subs
    for (const [id, sub] of subs) {
      if (!activeIds.has(id)) {
        sub.close();
        subs.delete(id);
      }
    }

    // Open subs for new active jobs
    for (const id of activeIds) {
      if (subs.has(id)) continue;
      const sub = openSSE(sandboxJobsApi.streamUrl(id), (event, data) => {
        if (event !== 'sample' && event !== 'status' && event !== 'snapshot') return;
        try {
          const payload = JSON.parse(data);
          setJobs((prev) =>
            prev.map((j) =>
              j.id === id
                ? {
                    ...j,
                    completed_count: payload.completed ?? j.completed_count,
                    failed_count: payload.failed ?? j.failed_count,
                    status: (payload.status ?? j.status) as JobItem['status'],
                    error_message: payload.error ?? j.error_message,
                  }
                : j,
            ),
          );
          if (event === 'status' && ['done', 'failed', 'cancelled', 'interrupted'].includes(payload.status)) {
            // Refresh once more so finished_at and stats pick up
            setTimeout(refresh, 200);
          }
        } catch {
          /* ignore */
        }
      });
      subs.set(id, sub);
    }
  }, [jobs, refresh]);

  // Close all subs on unmount
  useEffect(() => {
    return () => {
      for (const [, sub] of subsRef.current) sub.close();
      subsRef.current.clear();
    };
  }, []);

  return { jobs, loading, refresh, setJobs };
}
