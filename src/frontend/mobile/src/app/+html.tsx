import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web-only document shell: full-height app, sensible defaults for desktop browsers.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                width: 100%;
              }
              body {
                margin: 0;
                overflow: hidden;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              #root {
                display: flex;
                flex-direction: column;
              }
              * {
                box-sizing: border-box;
              }
              button, a, [role="button"], input, textarea, select {
                font: inherit;
              }
              ::selection {
                background: rgba(99, 102, 241, 0.35);
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
