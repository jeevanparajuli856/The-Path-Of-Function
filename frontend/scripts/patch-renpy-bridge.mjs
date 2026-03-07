import fs from 'node:fs';
import path from 'node:path';

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const targetArg = [...args].find((arg) => arg.startsWith('--file='));
const targetFile = targetArg
  ? targetArg.slice('--file='.length)
  : path.join(process.cwd(), 'public', 'renpy-game', 'index.html');

const BRIDGE_MARKER = 'window.sendToFrontend = function(type, payload)';
const INSERT_AFTER = "window.gameZipURL = 'game.zip';";

const BRIDGE_BLOCK = `

      // Bridge for Ren'Py -> Next.js telemetry.
      // Called from Ren'Py using eval_js("window.sendToFrontend(...)").
      window.sendToFrontend = function(type, payload) {
          try {
              if (window.parent && window.parent !== window) {
                  window.parent.postMessage(
                      {
                          type: type,
                          payload: payload || {},
                      },
                      '*'
                  );
                  return true;
              }
          } catch (e) {
              console.warn('sendToFrontend bridge error:', e);
          }
          return false;
      };

      // Let parent know bridge is ready for telemetry.
      try {
          if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'bridge_ready', payload: {} }, '*');
          }
      } catch (e) {
          console.warn('bridge_ready postMessage failed:', e);
      }
`;

if (!fs.existsSync(targetFile)) {
  console.error(`[renpy-bridge] index.html not found: ${targetFile}`);
  process.exit(1);
}

const html = fs.readFileSync(targetFile, 'utf8');

if (html.includes(BRIDGE_MARKER)) {
  console.log(`[renpy-bridge] Bridge already present: ${targetFile}`);
  process.exit(0);
}

if (checkOnly) {
  console.error(`[renpy-bridge] Bridge missing in ${targetFile}`);
  process.exit(2);
}

if (!html.includes(INSERT_AFTER)) {
  console.error(`[renpy-bridge] Unable to find insertion marker: ${INSERT_AFTER}`);
  process.exit(1);
}

const patched = html.replace(INSERT_AFTER, `${INSERT_AFTER}${BRIDGE_BLOCK}`);
fs.writeFileSync(targetFile, patched, 'utf8');
console.log(`[renpy-bridge] Bridge injected into ${targetFile}`);
