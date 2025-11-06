export type LogSeverity = "DEBUG" | "INFO" | "NOTICE" | "WARNING" | "ERROR" | "CRITICAL" | "ALERT" | "EMERGENCY";

export interface LogFields {
  severity?: LogSeverity;
  message: string;
  trace?: string;
  labels?: Record<string, string>;
  [key: string]: unknown;
}

export function cloudTraceFromHeader(header?: string): string | undefined {
  // Header format: TRACE_ID/SPAN_ID;o=TRACE_TRUE
  if (!header) return undefined;
  const traceId = header.split("/")[0];
  if (!traceId) return undefined;
  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;
  return project ? `projects/${project}/traces/${traceId}` : undefined;
}

export function logJSON(fields: LogFields) {
  const payload = {
    severity: fields.severity || "INFO",
    message: fields.message,
    ...fields,
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

