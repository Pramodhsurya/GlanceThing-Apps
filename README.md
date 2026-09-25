# GlanceThing Apps

This is where the official GlanceThing apps live. If you want to make your
own or are just browsing, these are the reference implementations.

The layout of each app follows the [GlanceThing app standard](https://github.com/Pramodhsurya/GlanceThing/blob/main/APPS.md).
GlanceThing serves the **web UI** (HTML, CSS and JavaScript). It does not
run a DeskThing Node server process.

Inspired by [ItsRiprod/Deskthing-Apps](https://github.com/ItsRiprod/Deskthing-Apps).

## Apps

| Folder       | App             | Notes                                       | Original repo                                                                                         |
| ------------ | --------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `music`      | Music           | Install from the GlanceThing Store          | [DeskThing-GMP](https://github.com/RandomDebugGuy/DeskThing-GMP), [Local Audio](https://github.com/ItsRiprod/Deskthing-Apps/tree/main/audio) |
| `pomodoro`   | Pomodoro        | Install from the Store; timer taken directly | [pomodoro-thing](https://github.com/grahamplace/pomodoro-thing) by [grahamplace](https://github.com/grahamplace) |
| `system`     | Resource Usage  | Install from the Store                      | [System](https://github.com/ItsRiprod/Deskthing-Apps/tree/main/system)                                |
| `recorder`   | Recording Notes | Install from the Store                      | [Recording Notes](https://github.com/ItsRiprod/Deskthing-Apps/tree/main/recorder)                     |
| `github`     | GitHub          | Install from the Store                      | [DeskThing-GitHub](https://github.com/dakota-kallas/DeskThing-GitHub)                                 |
| `logs`       | Console Logs    | Install from the Store                      | [Console Logs](https://github.com/ItsRiprod/Deskthing-Apps/tree/main/logs)                            |
| `link`       | Link            | Install from the Store                      | [Link](https://github.com/ItsRiprod/Deskthing-Apps/tree/main/link)                                    |
| `mic`        | Mic             | Install from the Store                      | —                                                                                                     |
| `weather`    | Weather         | Tray app + 10-day forecast and weather widget | —                                                                                                     |
| `calendar`   | Calendar        | Import Teams, Mac, Slack, or Google Calendar  | —                                                                                                     |
| `usage`      | AI usage        | Limits, spend, and usage widgets              | —                                                                                                     |
| `photos`     | Photos          | Tray app + photo widget                     | —                                                                                                     |
| `exampleapp` | Example App     | Installable template for new community apps | —                                                                                                     |

None of these are preinstalled. GlanceThing asks which ones to install on
first setup. After that, **Apps → Store** is Install / Uninstall. Use
`exampleapp` (or a new folder with a new id) when you want something new
from Git.

## Screenshots

| Desktop Apps tab | Car Thing tray |
| --- | --- |
| <img src=".github/assets/s10-apps-desktop.png?v=1" width="400" /> | <img src=".github/assets/s10-tray.png?v=1" width="400" /> |

| Music | Pomodoro |
| --- | --- |
| <img src=".github/assets/s10-music.png?v=1" width="400" /> | <img src=".github/assets/s10-pomodoro.png?v=1" width="400" /> |

| Resource Usage | Recording Notes |
| --- | --- |
| <img src=".github/assets/s10-system.png?v=1" width="400" /> | <img src=".github/assets/s10-recorder.png?v=1" width="400" /> |

| GitHub | Console Logs |
| --- | --- |
| <img src=".github/assets/s10-github.png?v=1" width="400" /> | <img src=".github/assets/s10-logs.png?v=1" width="400" /> |

| Link | Mic |
| --- | --- |
| <img src=".github/assets/s10-link.png?v=1" width="400" /> | <img src=".github/assets/s10-mic.png?v=1" width="400" /> |

| Weather | Calendar |
| --- | --- |
| <img src=".github/assets/s10-weather.png?v=3" width="400" /> | <img src=".github/assets/s10-calendar.png?v=3" width="400" /> |

| AI usage | Photos |
| --- | --- |
| <img src=".github/assets/s10-usage.png?v=3" width="400" /> | <img src=".github/assets/s10-photos.png?v=1" width="400" /> |

## Install from this repo

1. Open GlanceThing → **Apps** → **Store**. The store lists the apps in this
   repo on its own.
2. Click **Install**. GlanceThing shows the usual warnings.
3. After you accept, it downloads from this repo and installs. No Git URL to
   paste.

**From Git** is still there if you want to paste `Pramodhsurya/GlanceThing-Apps`
or another `owner/repo`. You can also **Upload Local File** with a zip from
`npm run package`.

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
`github`, `mic`, `weather`, `calendar`, `usage`, `photos`, `spotify`,
`gmp`, `local`.

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

This collection is modeled on [ItsRiprod/Deskthing-Apps](https://github.com/ItsRiprod/Deskthing-Apps).
Most GlanceThing apps were written for this project after studying those
apps. **Pomodoro is the exception:** its timer is taken directly from
[grahamplace/pomodoro-thing](https://github.com/grahamplace/pomodoro-thing)
(original contribution by [grahamplace](https://github.com/grahamplace)).

| GlanceThing app | Original repo |
| --- | --- |
| Pomodoro (timer taken directly) | [pomodoro-thing](https://github.com/grahamplace/pomodoro-thing) by [grahamplace](https://github.com/grahamplace) |
| Music: full controls | [DeskThing-GMP](https://github.com/RandomDebugGuy/DeskThing-GMP) |
| Music: source picker | [Local Audio](https://github.com/ItsRiprod/Deskthing-Apps/tree/main/audio) |
| Resource Usage | [System](https://github.com/ItsRiprod/Deskthing-Apps/tree/main/system) |
| Recording Notes | [Recording Notes](https://github.com/ItsRiprod/Deskthing-Apps/tree/main/recorder) |
| GitHub | [DeskThing-GitHub](https://github.com/dakota-kallas/DeskThing-GitHub) |
| Console Logs | [Console Logs](https://github.com/ItsRiprod/Deskthing-Apps/tree/main/logs) |
| Link | [Link](https://github.com/ItsRiprod/Deskthing-Apps/tree/main/link) |

Do not copy DeskThing sources wholesale. If you add an app whose code comes
from another repo, name that repo in the app README and in this table.
