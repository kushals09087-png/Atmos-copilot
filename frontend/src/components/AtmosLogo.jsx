import React from "react";

/**
 * AtmosLogo - Next-Gen Meteorological Sun, Cloud, Orbital Arc & Navigation Compass Logo
 * Uses the authentic high-resolution Atmos Copilot emblem and brand lockup.
 *
 * @param {number|string} size - Size in pixels (e.g. 34 or "34px")
 * @param {string} variant - "mark" (icon only, default for nav/cards) | "lockup" (emblem + typography) | "full" (full landscape artwork)
 * @param {boolean} showText - Whether to render side-by-side "ATMOS COPILOT" text
 * @param {string} textVariant - "standard" | "stacked"
 * @param {string} className - Additional CSS class
 */
export default function AtmosLogo({
  size = 34,
  variant,
  showText = false,
  textVariant = "standard",
  className = ""
}) {
  const numericSize = typeof size === "number" ? size : parseInt(size, 10) || 34;
  // Default to mark for small badges/navbars, or lockup if explicitly requested or very large
  const effectiveVariant = variant || (numericSize >= 88 ? "lockup" : "mark");

  let imgSrc = "/atmos-mark.jpg";
  if (effectiveVariant === "lockup") {
    imgSrc = "/atmos-lockup.jpg";
  } else if (effectiveVariant === "full") {
    imgSrc = "/atmos-logo.jpg";
  }

  const markSize = typeof size === "number" ? `${size}px` : size;

  return (
    <div
      className={`atmos-brand-identity ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        lineHeight: 1
      }}
    >
      <div
        className={`atmos-logo-img-wrapper ${effectiveVariant === "lockup" ? "hero-lockup" : "mark-squircle"}`}
        style={{
          width: markSize,
          height: markSize,
          position: "relative",
          flexShrink: 0
        }}
      >
        <img
          src={imgSrc}
          alt="Atmos Copilot Logo"
          className="atmos-logo-img"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block"
          }}
          loading="eager"
        />
      </div>

      {showText && (
        <div className={`atmos-brand-text ${textVariant === "stacked" ? "stacked" : "horizontal"}`}>
          <span className="brand-atmos">ATMOS</span>
          <span className="brand-copilot">COPILOT</span>
        </div>
      )}
    </div>
  );
}
