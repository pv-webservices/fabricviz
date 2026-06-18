/**
 * Structured telemetry logging for fabricviz-worker.
 *
 * Supports four severity levels: INFO, WARN, ERROR, CRITICAL.
 * Each log line is structured JSON written to both console.error
 * (for container log aggregation) and a local log file.
 */

import fs from 'node:fs';
import path from 'node:path';

const SERVICE_NAME = 'fabricviz-worker';
const LOG_FILE_PATH = process.env.LOG_FILE_PATH || './logs/fabricviz-worker.log';

// Ensure the log directory exists on module load.
try {
  fs.mkdirSync(path.dirname(LOG_FILE_PATH), { recursive: true });
} catch {
  // Best-effort — may fail in read-only filesystems; logging will still go to console.
}

type Severity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

/** Backward-compatible payload for CRITICAL-level incidents. */
export interface IncidentPayload {
  errorType: string;
  message: string;
  context?: Record<string, any>;
}

function writeLog(severity: Severity, event: string, payload?: Record<string, any>) {
  const logLine = JSON.stringify({
    severity,
    timestamp: new Date().toISOString(),
    event,
    service: SERVICE_NAME,
    ...payload,
  });

  console.error(logLine);

  try {
    fs.appendFileSync(LOG_FILE_PATH, logLine + '\n');
  } catch {
    // Swallow file-write errors to avoid crashing the application.
  }
}

/** Log an informational event. */
export function logInfo(event: string, payload?: Record<string, any>) {
  writeLog('INFO', event, payload);
}

/** Log a warning event. */
export function logWarn(event: string, payload?: Record<string, any>) {
  writeLog('WARN', event, payload);
}

/** Log an error event. */
export function logError(event: string, payload?: Record<string, any>) {
  writeLog('ERROR', event, payload);
}

/**
 * Log a critical operational incident (backward-compatible).
 *
 * Retains the original `logIncident(payload)` signature so existing
 * call-sites continue to work without modification.
 */
export function logIncident(payload: IncidentPayload) {
  writeLog('CRITICAL', 'SYSTEM_INCIDENT', payload as unknown as Record<string, any>);
}
