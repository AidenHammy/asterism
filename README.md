# Asterism

*a NASA APOD viewer built as part of Stardance, an event hosted by Hack Club*

built with plain HTML/CSS/JS + Vite because frameworks are for cowards (jk i just didn't want to think about it yet)

---

## current status: actually a website now??

update from the Victorian ghost house era! the ghost has been exorcised. this thing works now. the date picker actually pickers. the plate actually plates. you can flip through days, jump to today, hit random and get flung somewhere between June 1995 and now and the picture that shows up is a real picture NASA actually took, not a facade, not a movie set, an actual photo of actual space.

also built out an archive view so you can browse a whole month at once instead of clicking next-day like a caveman, an "on this day" strip that shows you the same date across past years (this one's my favorite, genuinely didn't expect it to feel as good as it does) and a logbook so you can save entries you like and they just.. stay saved! no account, no backend required. gulp. the magic of localStorage btw~

the CSS also stopped being "unstyled in the way a website looks unstyled when god has abandoned it." there's an actual palette now, actual type, a spinner that isn't just a sad spinning circle, a little cursor thing over the images that I'm way too proud of. still solo-deving this at 10-15 minutes a day between classes so it's not *done* done but it's a real thing now instead of a rumor of a thing!

okay here's a fun fact: I found a bug where the entire plate straight up never showed up because I told it to hide itself instead of show itself. I quite literally found this out the hard way at a normal hour not at 2am so genuinely no excuse

## the stack (survey says)

- HTML
- CSS (no longer allegedly. for real this time)
- JS
- Vite because I like fast refresh and also typing `npm run dev` makes me feel like a real developer

no React, no Vue, no nothing. just me and a increasingly reasonable amount of will to live.

## how to run this beautiful, slightly less disastrous disaster

```bash
npm install
npm run dev
```

I love how you need a NASA API key though, they're surprisingly not gatekeeping the cosmos that hard (wonders of having a free api key aha.. please laugh)

(using Vite's `import.meta.env.VITE_*` thing instead of NASA's public `DEMO_KEY` because that key gets rate-limited faster anything else)