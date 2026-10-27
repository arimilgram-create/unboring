import { useEffect, useRef } from "react";
import { TEMPLATES } from "../engine/templates/library";
import { THEMES } from "../engine/templates/helpers";

// Dev tool (spec Section 27, visual checks): every template animating on a loop with sample props.
// Not part of the demo: these are hand-written sample props, not AI output.
const SAMPLES: { name: string; props: Record<string, unknown>; duration: number }[] = [
  { name: "hookText", props: { text: "4,543 words that run a country" }, duration: 3 },
  { name: "titleCard", props: { title: "Article I", subtitle: "The Legislative Branch" }, duration: 2.5 },
  { name: "keywordCard", props: { term: "Quorum", definition: "The minimum number of members needed to do business" }, duration: 3.5 },
  { name: "iconPop", props: { icon: "Landmark", label: "Congress" }, duration: 2 },
  { name: "statCallout", props: { value: 435, label: "voting members of the House" }, duration: 3 },
  { name: "titleBehind", props: { text: "We the People" }, duration: 3 },
];

function Demo({ name, props, duration }: (typeof SAMPLES)[number]) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      const t = (((performance.now() - t0) / 1000) % (duration + 0.8));
      const g = ctx.createLinearGradient(0, 0, 0, c.height);
      g.addColorStop(0, "#3a3f4a");
      g.addColorStop(1, "#15171b");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, c.width, c.height);
      // Stand-in speaker silhouette so placement can be judged.
      ctx.fillStyle = "#59606b";
      ctx.beginPath();
      ctx.arc(c.width / 2, c.height * 0.42, c.height * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(c.width / 2, c.height * 0.95, c.width * 0.18, c.height * 0.36, 0, Math.PI, 0);
      ctx.fill();
      if (t < duration) TEMPLATES[name](ctx, props, { t, duration }, { W: c.width, H: c.height, side: "right" }, THEMES.explainer);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [name, props, duration]);
  return (
    <figure>
      <canvas ref={ref} width={1280} height={720} />
      <figcaption>
        <b>{name}</b>
        <span>{JSON.stringify(props)}</span>
      </figcaption>
    </figure>
  );
}

export default function GalleryPage() {
  return (
    <main className="gallery">
      {SAMPLES.map((s) => (
        <Demo key={s.name} {...s} />
      ))}
    </main>
  );
}
