export default function MagicLoadingOverlay({ theme, text, className = "", children = null }) {
  const normalizedTheme = theme === "light" ? "light" : "dark";
  const classes = [
    "magic-loading-overlay",
    `magic-loading-overlay-${normalizedTheme}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="status" aria-live="polite" aria-label={text}>
      {children || (
        <span className="magic-loading-text pixel-font-zh" data-text={text} aria-hidden="true">
          {text}
        </span>
      )}
    </div>
  );
}
