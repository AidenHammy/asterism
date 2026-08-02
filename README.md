# Asterism

*a NASA APOD viewer built as part of Stardance, an event hosted by Hack Club*

built with plain HTML/CSS/JS + Vite because frameworks are for cowards (jk i just didn't want to think about it yet)

---

## current status: too tired to even assess it

ok so. real talk. right now this app is basically a Victorian ghost of a website. the HTML is all there, date picker, a whole "plate" section for the image, an archive view, a little drawer for saved entries, a lightbox, the WORKS and it does.. literally nothing. it's set dressing, it's a movie set where the buildings are just facades and there's nothing behind them, well kind of.

there IS a fetch call that proves the NASA API actually works but it's talking to a `#datepicker` and `#app` that do not exist anywhere in my actual page. i built it as a little side experiment to make sure I wasn't about to build an entire UI around an API that hates me and then just.. never rewired it BUT we'll get there. also fun fact but i've seen the sun approximately 47 times this month

also the CSS is currently just a bit ew. it is unstyled in the way that a website looks unstyled when god has abandoned it

## the stack (survey says)

- HTML
- CSS (allegedly)
- JS
- Vite because I like fast refresh and also typing `npm run dev` makes me feel like a real developer

no React, no Vue, no nothing. just me, `fetch()` and the will to live.

## how to run this beautiful disaster

\`\`\`bash
npm install
npm run dev
\`\`\`

Surprisingly, they're not gatekeeping the cosmos that hard (wonders of having a free api key aha.. please laugh)

(using Vite's `import.meta.env.VITE_*` thing instead of NASA's public `DEMO_KEY` because that key gets rate-limited faster than my attention span)

## file... "structure"

\`\`\`
asterism/
├── index.html
├── src/
│   ├── style.css      (a reset and a dream)
│   └── main.js         (very sloppy situation rn, surprisingly)
└── README.md           (you are here)
\`\`\`

## why

this is my submission-in-progress for **Stardance**, a Hack Club event. if you are a reviewer reading this at 2am the same way I wrote it- solidarity. we are the same. I too do not know what time it is.