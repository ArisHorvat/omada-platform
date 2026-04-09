import styles from "./page.module.css";

/**
 * Placeholder for the optional Next.js shell in this monorepo.
 * The Omada product web UI is built with Expo; run it from `src/frontend/mobile` (see README).
 */
export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Omada — web (Next.js)</h1>
      <p className={styles.lead}>
        This folder is a lightweight Next.js app reserved for a future marketing site, admin
        shell, or other web-only surfaces. It is not wired to the Expo app.
      </p>
      <p className={styles.lead}>
        For the cross-platform Omada UI in the browser, use the Expo project:
      </p>
      <pre className={styles.codeBlock}>
        {`cd src/frontend/mobile
npm install
npm run web`}
      </pre>
      <p className={styles.muted}>
        Web-specific implementations (e.g. maps) live next to shared code as{" "}
        <code className={styles.inlineCode}>*.web.tsx</code> under{" "}
        <code className={styles.inlineCode}>mobile/src</code> so Metro can bundle them.
      </p>
    </main>
  );
}
