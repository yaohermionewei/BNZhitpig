export default function StageShell({ theme, children }) {
  return (
    <main className={`app-root app-root-${theme}`}>
      <section className="stage-shell" aria-label="BNZ Hit Pig Game">
        {children}
      </section>
    </main>
  );
}
