import type { ProjectStatus, Word } from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Server error (${res.status})`;
    try {
      msg = (await res.json()).detail ?? msg;
    } catch {
      /* not JSON */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

/** Upload with progress (fetch can't report upload progress, XMLHttpRequest can). */
export function uploadVideo(file: File, onProgress: (fraction: number) => void): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    xhr.open("POST", "/api/projects");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(body);
        else reject(new Error(body.detail ?? `Upload failed (${xhr.status})`));
      } catch {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Couldn't reach the UnBoring server. Is start.bat running?"));
    xhr.send(form);
  });
}

export const getProject = (id: string) => fetch(`/api/projects/${id}`).then((r) => json<ProjectStatus>(r));
export const getWords = (id: string) => fetch(`/api/projects/${id}/words`).then((r) => json<Word[]>(r));
export const retryProject = (id: string) => fetch(`/api/projects/${id}/retry`, { method: "POST" }).then((r) => json(r));

/** Live progress. Calls onStatus on every change; returns a function that stops listening. */
export function watchProject(id: string, onStatus: (s: ProjectStatus) => void): () => void {
  const source = new EventSource(`/api/projects/${id}/events`);
  source.onmessage = (e) => {
    const status = JSON.parse(e.data) as ProjectStatus;
    onStatus(status);
    if (status.state !== "processing") source.close();
  };
  return () => source.close();
}

export const getPlan = (id: string) =>
  fetch(`/api/projects/${id}/plan`).then((r) => json<import("./plan/types").EditPlan>(r));
export const getCuts = (id: string) =>
  fetch(`/api/projects/${id}/cuts`).then((r) => json<import("./plan/types").CutSummary>(r));
export const planWithAI = (id: string) => fetch(`/api/projects/${id}/ai`, { method: "POST" }).then((r) => json(r));
