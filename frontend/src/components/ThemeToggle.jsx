import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "", showLabel = true }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Current: ${isDark ? "Dark Mode" : "Light Mode"} - Click to toggle`}
    >
      <div className="theme-toggle-pill">
        <div className={`theme-toggle-thumb ${theme}`} />
        <div className={`theme-toggle-item ${!isDark ? "active" : ""}`} aria-hidden="true">
          <Sun size={14} className="sun-icon" />
        </div>
        <div className={`theme-toggle-item ${isDark ? "active" : ""}`} aria-hidden="true">
          <Moon size={14} className="moon-icon" />
        </div>
      </div>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
}
