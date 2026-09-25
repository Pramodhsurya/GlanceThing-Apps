# Contributing

This repo is the home of official GlanceThing apps, similar to
[Deskthing-Apps](https://github.com/ItsRiprod/Deskthing-Apps).

## Add or change an app

1. Fork and clone this repository.
2. Copy `exampleapp/` to a new folder. The folder name should match `manifest.json` `id`.
3. Keep the zip layout GlanceThing understands:

   ```
   your-app/
   ├── manifest.json
   └── client/index.html
   ```

4. Target **Chrome 69** and an **800×480** screen. Avoid flexbox `gap`, `inset`,
   and `color-mix`.
5. Do not use a reserved id: `music`, `pomodoro`, `system`, `logs`, `link`,
   `recorder`, `github`, `mic`, `weather`, `calendar`, `usage`, `photos`,
   `spotify`, `gmp`, `local`.
6. Run `npm run package` and install the zip from GlanceThing → **Apps**.

The full standard is in the GlanceThing
[APPS.md](https://github.com/Pramodhsurya/GlanceThing/blob/main/APPS.md).

## Credit

If an app's code, assets or behaviour comes **directly** from another
repository, say so in the pull request and in that app's README. Prefer a
GlanceThing-native implementation over a wholesale copy.

Official apps that were inspired by DeskThing counterparts already note that
in their README.
