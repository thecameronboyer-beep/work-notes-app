# Work Notes App

Phone-first work notes app for line batches, materials, troubleshooting, settings, and printable reports.

## Use It On This Computer

Double-click:

```text
open-app.cmd
```

That starts the app and opens it in your browser.

## Share It With Other People Nearby

Double-click:

```text
share-app.cmd
```

It will:

1. Build the app.
2. Start a shared server on your computer.
3. Open the app on this computer.
4. Print a URL like `http://192.168.1.25:4173/`.

Give that URL to anyone on the same Wi-Fi/network. Keep the command window open while they are using it. Press Enter in that window when you want to stop sharing.

If Windows asks about allowing Node.js or the app through the firewall, allow it on private networks so phones on the same Wi-Fi can connect.

Important: the app saves notes in each browser's local storage. Sharing the app lets other people use it, but it does not sync everyone's notes together. Shared live data would need a small backend/database.

## Share It With Anyone Online

This project is set up for GitHub Pages. After the latest code is pushed to GitHub, GitHub Actions can publish it here:

```text
https://thecameronboyer-beep.github.io/work-notes-app/
```

In the GitHub repo, make sure Pages is set to deploy from GitHub Actions:

```text
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

Once the deploy action finishes, anyone can open that URL. Each person stores their own data in their own browser.

## Developer Commands

```bash
npm run dev
npm run dev:share
npm run build
npm run build:github
npm run preview
npm run preview:share
npm run lint
```
