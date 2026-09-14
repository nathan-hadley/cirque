const PROJECT_ID = "4c69e3f4-e42c-471b-8ee6-6c292a478d71";
const BUILDS_URL = "https://expo.dev/accounts/nathanhadley/projects/Cirque/builds";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GitHub strips custom-scheme links from comments, so PR previews link here
// and this page hands off to the dev client.
export function devClientUrl(groupId: string): string {
  const updateUrl = `https://u.expo.dev/${PROJECT_ID}/group/${groupId}`;
  return `cirque-dev://expo-development-client/?url=${encodeURIComponent(updateUrl)}`;
}

function installThenOpen(buildId: string, open: string): string {
  return `
    <p>This PR changes native code. Install the new build first, then open the update.</p>
    <a class="button secondary" href="${BUILDS_URL}/${buildId}">1. Install build</a>
    <a class="button" href="${open}">2. Open in Cirque Dev</a>`;
}

function autoOpen(open: string): string {
  return `
    <a class="button" href="${open}">Open in Cirque Dev</a>
    <script>
      location.href = ${JSON.stringify(open)};
    </script>`;
}

export function previewPage(groupId: string, buildId: string | undefined): string | null {
  if (!UUID.test(groupId) || (buildId && !UUID.test(buildId))) return null;
  const open = devClientUrl(groupId);
  const steps = buildId ? installThenOpen(buildId, open) : autoOpen(open);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Cirque PR preview</title>
    <style>
      body {
        font: 17px/1.4 system-ui, sans-serif;
        margin: 2rem 1.25rem;
        text-align: center;
      }
      .button {
        display: block;
        margin: 1rem auto;
        max-width: 20rem;
        padding: 1rem;
        border-radius: 12px;
        background: #111;
        color: #fff;
        text-decoration: none;
        font-weight: 600;
      }
      .secondary {
        background: #e5e5e5;
        color: #111;
      }
    </style>
  </head>
  <body>
    <h1>Cirque PR preview</h1>${steps}
  </body>
</html>`;
}
