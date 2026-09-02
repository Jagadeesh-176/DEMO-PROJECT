# Polyborg AI Portal

A working prototype of the Polyborg coordination portal for factory robot projects. It walks an
operator through four stages, from describing the job to watching the robot run and bill itself.

**The bottleneck is coordination, not robotics.**

## Sign in

The prototype uses one demonstration account, shown on the login screen itself:

| Field    | Value             |
| -------- | ----------------- |
| Email    | `dev@polyborg.ai` |
| Password | `polyborg@123!`   |

> This is a front-end prototype. The check runs in the browser, so it keeps a casual visitor out of
> the demonstration but is not real security. There is no server and no database.

## What it does

**Stage one — Scope.** Record a simulated factory floor video and watch Polyborg write a project
specification sheet: palletizing and box stacking, 15 items per minute, a sanitary food packaging
line, plus reach, weight, floor space, hours and safety requirements.

**Stage two — Source.** Filter checked robot builders by industry focus and preferred direct robot
brand, pick the one you want, and send every matched builder the identical plan.

**Stage three — Price.** Three bids side by side. Flip one switch and the hidden exclusions slide
open: the bid that looked cheapest at $128,500 turns into the most expensive once its $24,900 of
left-out costs appear.

**Stage four — Deliver and run.** An animated robot arm, a live speed dial against the agreed target
of 15 items per minute, and a billing panel. Press "Simulate robot breakage" and the arm freezes,
the dial drops to zero, and billing pauses by itself.

## Progress is saved

Everything you do is written to the browser's session storage, so a refresh never loses your place:

| Key                       | What it holds                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `polyborg_auth_token`     | The signed-in email address                                                                     |
| `polyborg_workspace_state`| Current stage, specification sheet, selected builder, price toggle, robot state, activity log   |

Session storage lasts for the life of the browser tab. Closing the tab clears it, which is the
intended behaviour for a shared factory terminal.

Two buttons in the header control this:

- **Reset application state** clears the workflow and returns you to stage one, still signed in.
- **Log out** clears everything and returns you to the login screen.

## Running it on your machine

```bash
npm install
npm run dev
```

Then open the address Vite prints, usually <http://localhost:5173>.

| Command           | What it does                                                    |
| ----------------- | --------------------------------------------------------------- |
| `npm run dev`     | Start the development server with hot reloading                 |
| `npm run build`   | Build the production bundle into `dist/`                        |
| `npm run preview` | Serve the built bundle locally to check it before deploying     |
| `npm run lint`    | Run oxlint across the project                                   |

## Deploying to Vercel

This is a static front end. There is no backend, no database and **no environment variables**, so
Vercel needs no configuration from you.

1. Push this folder to a new GitHub repository:

   ```bash
   git init
   git add -A
   git commit -m "Polyborg AI portal prototype"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com), select **Add New → Project**, and import that repository.

3. Vercel detects Vite automatically and fills in the settings. Confirm they read:

   | Setting          | Value           |
   | ---------------- | --------------- |
   | Framework Preset | Vite            |
   | Build Command    | `npm run build` |
   | Output Directory | `dist`          |
   | Install Command  | `npm install`   |

4. Press **Deploy**. The first build takes about a minute, and you get a live address ending in
   `.vercel.app`.

Every later push to `main` redeploys the site automatically.

> Because there is no login server, anyone who has the address can reach the demonstration account.
> If you want the link kept private, use Vercel's deployment protection settings.

## What it is built with

- React 19 with `useState` and `useEffect` only, no state library
- Vite 8 for the development server and production build
- Tailwind CSS 4, configured in `src/index.css` through the `@theme` block rather than a JavaScript
  config file
- Lucide React for every icon
- Browser session storage for saving progress

## Project layout

```
├── src/
│   ├── PolyborgApp.jsx   The whole application, written as one self-contained component
│   ├── App.jsx           Renders PolyborgApp
│   ├── main.jsx          React entry point
│   └── index.css         Tailwind import, colour theme, and the animation keyframes
├── index.html
├── vite.config.js
└── package.json
```

The robot arm, conveyor belt, scanning sweep and flashing billing indicator are driven by keyframes
in `src/index.css`. Every animation is disabled automatically for visitors who have asked their
system to reduce motion.

## Plain language

The interface deliberately avoids industry shorthand. Terms are written out in full, for example
"complex three-dimensional computer drawings", "large upfront buying costs or capital expenses",
"direct robot brand or original manufacturer", "robots as a subscription service", and
"computer-controlled metal cutting and pressing machines".
