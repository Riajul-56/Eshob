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

    return () => {
      io.disconnect();
      wrap?.removeEventListener("mousemove", onMove);
      wrap?.removeEventListener("mouseleave", reset);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
