// src/hooks/useMetrics.ts
// Telemetry hook for ACTA actions - logs action name, project id, and success/failure
// No PII (Personally Identifiable Information) is logged

export interface MetricsData {
  action: string;
  projectId?: string;
  success: boolean;
  duration?: number;
  error?: string;
  timestamp: string;
}

export function useMetrics(): {
  logAction: (data: Omit<MetricsData, 'timestamp'>) => void;
  trackAction: <T>(actionName: string, projectId: string | undefined, actionFn: () => Promise<T>) => Promise<T>;
} {
  const logAction = (data: Omit<MetricsData, 'timestamp'>): void => {
    const metrics: MetricsData = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    // Log to console for DevTools tracing (no PII)
  const logLevel: 'info' | 'warn' = metrics.success ? 'info' : 'warn';
  // eslint-disable-next-line no-console
  console[logLevel]('[ACTA Metrics]', {
      action: metrics.action,
      projectId: metrics.projectId ? `${metrics.projectId.substring(0, 8)}...` : undefined,
      success: metrics.success,
      duration: metrics.duration,
      error: metrics.error,
      timestamp: metrics.timestamp,
    });

    // In production, this could be extended to send to analytics service
    // Example: sendToAnalytics(metrics);
  };

  const trackAction = async <T>(
    actionName: string,
    projectId: string | undefined,
    actionFn: () => Promise<T>
  ): Promise<T> => {
    const startTime = Date.now();
    
    try {
      const result = await actionFn();
      const duration = Date.now() - startTime;
      
      logAction({
        action: actionName,
        projectId,
        success: true,
        duration,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logAction({
        action: actionName,
        projectId,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  };

  return {
    logAction,
    trackAction,
  };
}