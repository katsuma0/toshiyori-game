# Brain Garden

Five short brain games for older adults, built to be played on an iPhone with one finger and no reading glasses. There is one menu, every screen has a big Home button, and nothing needs typing.

The games:

- **Count Up.** A 4x4 grid of numbers. Tap them from smallest to biggest. Level 1 starts at 3x3, level 3 and up stops using consecutive numbers.
- **Make the Number.** Tap two tiles that add up to the big number. The board is built from matching pairs, so there is never a dead end.
- **Odd One Out.** One picture in the grid is different. Later levels use near twins, then a mirrored copy of the same picture.
- **Which Has More.** Two boxes of dots. Tap the bigger group. Both counts are shown after every answer.
- **Remember the Lights.** Squares light up in order with a tone each. Tap them back in the same order.

Each game is 3 to 6 short rounds, then a star screen with two buttons: Play again, Home. Three stars moves the level up, one star moves it down, five levels per game. If the player pauses for 7 seconds the right answer starts to pulse, 4 seconds the first time they play. A wrong tap gets a soft low tone and a double tick, never a buzzer, and the game carries on.

Every tap has a sound and a haptic. Correct steps in Count Up climb a pentatonic scale, so tapping 1 to 16 plays a little tune. All tones stay between 200 and 1100 Hz because high frequencies are the first thing age related hearing loss takes. Sound, vibration and big text are three toggles on the home screen. Reduce Motion in iOS settings is respected.

No accounts, no ads, no network, no tracking. Progress is stored on the phone.

## Run it in a browser

```
npm start
```

Open http://localhost:8080. Haptics only work on a real phone.

`npm test` plays every game end to end in headless Chromium and fails on any console error. Screenshots land in `/tmp/shots`.

## Build for iPhone

You need a Mac with Xcode 16 or newer and an Apple Developer account ($99 USD a year, about $139 CAD).

```
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

In Xcode:

1. Select the App target, Signing & Capabilities, pick your team.
2. General tab: set Display Name to Brain Garden, iPhone only, portrait only (untick Landscape Left and Right).
3. Drag `store/AppIcon-1024.png` into Assets, AppIcon.
4. Run on your own phone first. Check the haptics with sound off.
5. Product, Archive, then Distribute App to App Store Connect.

After any change in `www/`, run `npx cap sync ios` again.

## App Store submission

Everything for the listing is in `store/`:

- `AppIcon-1024.png`, no transparency, as Apple wants it.
- `screenshots/`, six at 1320 x 2868, the 6.9 inch size. App Store Connect scales them down for smaller iPhones. Regenerate with `npm run store-assets`.
- `listing.md`, the name, subtitle, description and keywords, ready to paste.
- `PRIVACY.md`, the privacy policy. Host it somewhere public (a GitHub Pages page is fine) and paste the URL.

Answers for the App Store Connect forms:

- Privacy nutrition label: Data Not Collected.
- Age rating: 4+, no objectionable content.
- Category: Games, then Puzzle. Secondary: Board or Family.
- Export compliance: the app uses no encryption, answer No.

Check the name is free in App Store Connect before you get attached to it.
