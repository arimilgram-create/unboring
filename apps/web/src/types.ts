// Shapes returned by the server. The full edit plan (spec Section 9) arrives on Day 2–3.

export interface Word {
  id: string; // "w0", "w1", ... stable forever
  text: string;
  start: number; // seconds, source time
  end: number;
  isFiller: boolean;
  confidence: number;
  speechGapAfter: number;
}

export interface Stage {
  key: string;
  label: string;
  state: "waiting" | "running" | "done" | "failed" | "skipped";
  progress: number;
  note?: string | null;
}

export interface ProjectStatus {
  id: string;
  name: string;
  state: "processing" | "ready" | "failed";
  error: string | null;
  stages: Stage[];
  source: null | {
    width: number;
    height: number;
    duration: number;
    fps: number;
    proxyUrl: string;
    originalUrl: string;
  };
}
