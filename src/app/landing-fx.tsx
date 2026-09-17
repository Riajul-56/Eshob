"use client";

import { useEffect } from "react";

/** Landing-page motion: scroll reveal + 3D mouse-tilt on the hero card. */
export function LandingFX() {
  useEffect(() => {
    // reveal on scroll
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    // 3D tilt on the hero card (desktop pointer only)
    const wrap = document.getElementById("hero-card-wrap");
    const card = document.getElementById("hero-card");
    let raf = 0;
    function onMove(ev: MouseEvent) {
      if (!wrap || !card) return;
      const r = wrap.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;
      const py = (ev.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 14}deg) scale(1.02)`;
      });
    }
    function reset() {
      if (card) card.style.transform = "";
    }
    wrap?.addEventListener("mousemove", onMove);
    wrap?.addEventListener("mouseleave", reset);

    // gentle parallax on the phone cluster — it swings toward the cursor
    const stage = document.getElementById("showcase-stage");
    const cluster = document.getElementById("showcase-cluster");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf2 = 0;
    function onStageMove(ev: MouseEvent) {
      if (!stage || !cluster || still) return;
      const r = stage.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;
      const py = (ev.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf2);
      raf2 = requestAnimationFrame(() => {
        cluster.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 7}deg)`;
      });
    }
    function stageReset() {
      if (cluster) cluster.style.transform = "";
    }
    stage?.addEventListener("mousemove", onStageMove);
    stage?.addEventListener("mouseleave", stageReset);

    return () => {
      io.disconnect();
      wrap?.removeEventListener("mousemove", onMove);
      wrap?.removeEventListener("mouseleave", reset);
      stage?.removeEventListener("mousemove", onStageMove);
      stage?.removeEventListener("mouseleave", stageReset);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return null;
}
