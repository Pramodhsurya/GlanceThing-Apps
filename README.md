# GlanceThing Apps

This is where the official GlanceThing apps live. If you want to make your
own or are just browsing, these are the reference implementations.

The layout of each app follows the [GlanceThing app standard](https://github.com/Pramodhsurya/GlanceThing/blob/main/APPS.md).
GlanceThing serves the **web UI** (HTML, CSS and JavaScript). It does not
run a DeskThing Node server process.

Inspired by [ItsRiprod/Deskthing-Apps](https://github.com/ItsRiprod/Deskthing-Apps).

## Apps

| Folder       | App             | Notes                                      |
| ------------ | --------------- | ------------------------------------------ |
| `music`      | Music           | Built into GlanceThing                     |
| `pomodoro`   | Pomodoro        | Built into GlanceThing                     |
| `system`     | Resource Usage  | Built into GlanceThing                     |
| `recorder`   | Recording Notes | Built into GlanceThing                     |
| `github`     | GitHub          | Built into GlanceThing                     |
| `logs`       | Console Logs    | Built into GlanceThing                     |
| `link`       | Link            | Built into GlanceThing                     |
| `exampleapp` | Example App     | Installable template for new community apps |

Official apps with those ids also ship **built into GlanceThing**. Installing
the zip from this repo will warn **Reserved App ID** so you cannot replace
them. Use `exampleapp` (or a new folder with a new id) when you want something
you can **Initialize** from **Apps → Add App**.

## Install from this repo

1. Open GlanceThing → **Apps** → **Add App**.
2. Paste `Pramodhsurya/GlanceThing-Apps`.
3. GlanceThing lists every `*-app-*.zip` on the latest GitHub release.
4. Download the app you want, acknowledge the warnings, then **Initialize App**.

Or use **Upload Local File** with a zip from `npm run package`.

## Make your own app

Prereqs: [Node.js](https://nodejs.org/).

1. Copy `exampleapp/` to a new folder. The folder name should match the app id.
2. Edit `manifest.json` (`id` must be unique and not reserved).
3. Put the Car Thing screen in `client/index.html` (800×480, Chrome 69).
4. Zip it:

   ```bash
   npm run package
   ```

5. In GlanceThing, **Upload Local File**, or attach the zip to a GitHub
   Release and add `you/your-repo`.

Reserved ids: `music`, `pomodoro`, `system`, `logs`, `link`, `recorder`,
`github`, `spotify`, `gmp`, `local`.

## What GlanceThing looks for

```
your-app/
├── manifest.json
└── client/index.html
```

Only `id` is required in the manifest. See the GlanceThing [APPS.md](https://github.com/Pramodhsurya/GlanceThing/blob/main/APPS.md)
for every field, Chrome 69 limits, and how the desktop app installs a zip.

## Package all apps

```bash
npm run package
```

Writes `dist/{id}-app-v{version}.zip` for each app folder that has a
`manifest.json`.

## Credits

These apps were written for GlanceThing. Several were inspired by DeskThing
counterparts — see each app README. Do not copy DeskThing sources wholesale.
