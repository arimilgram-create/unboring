// The edit plan: the single source of truth (spec Section 9). Day 2 uses words + keep;
// the other fields are filled by later days. Kept in sync with apps/server/pipeline/plan.py.
import type { Word } from "../types";

export type ID = string;
export type WordId = string;

export interface KeepRange {
  id: ID;
  fromWord: WordId;
  toWord: WordId; // inclusive
  padStart: number;
  padEnd: number;
  reason?: "auto" | "user";
}

export interface SourceInfo {
  id: ID;
  originalUrl: string;
  proxyUrl: string;
  maskUrl: string | null;
  cleanPlateUrl: string | null;
  fps: number;
  width: number;
  height: number;
  duration: number;
  faceTrack: unknown[];
}

export interface CaptionSettings {
  enabled: boolean;
  style: "boldPop" | "karaoke" | "phraseReveal" | "activeWordBox" | "typewriter" | "minimal";
  maxWordsPerChunk: number;
  position: "lowerThird" | "center" | "bottom";
  highlightWords: WordId[];
  safeZone: "landscape" | "vertical";
}

export interface EditPlan {
  version: 1;
  planId: ID;
  revision: number;
  source: SourceInfo;
  style: string;
  words: Word[];
  keep: KeepRange[];
  chapters: unknown[];
  camera: unknown[];
  graphics: unknown[];
  captions: CaptionSettings;
  sounds: unknown[];
  music: unknown;
  transitions: unknown[];
  color: Record<string, unknown>;
  checks: unknown;
}

export interface CutSummary {
  fillers: WordId[];
  retakes: [WordId, WordId][];
  pauses: number;
}
