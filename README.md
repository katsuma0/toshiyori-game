# Brain Garden

Fifteen short brain games for older adults, built for an iPhone, one finger and no reading glasses. English and Japanese. One home screen, a big Home button in every game, nothing to type.

The big green Play button runs five random games, one round each. That is the whole app for most people. The tiles under it open one game at a time:

- **Count Up.** Tap 1 to 16 in order on a 4x4 grid. From level 2 the numbers skip, so you compare instead of count.
- **Train.** A railway map is missing a piece of track. Pick the straight or the curve that gets the train to the exit, then watch it drive through. From level 4 two pieces in a row are missing. The three choices are drawn as the actual track tiles, turned the way they would sit on the map, so it is a matching job, not a left-or-right puzzle.
- **Plus, Minus, Times, Divide.** One sum at a time, six answers to pick from. Plus never goes over 100, Minus never goes below zero, Times stays small, and Divide always comes out even.
- **Odd One.** One picture is slightly different, like a tomato among apples. Later levels flip the same picture around.
- **Blocks.** Count a pile of 3 to 27 blocks. The piles are shapes you can work out: a 4x4 slab with one missing is 15, two towers of 3 and 2 are 5, a 2x2x2 cube with a corner gone is 7.
- **Lights.** Squares light up with a tone each. Tap them back in the same order.
- **Stopwatch.** Press Start, then Stop when you think the target time has passed. Level 1 is always 5 seconds; later levels go from 4 to 10. From level 3 the hand fades out and you count in your head.
- **Pair Up.** Tap two numbers that make the target. The board is built from matching pairs, so it never dead-ends.
- **Coins.** A little shop with five kinds of round: count the money, work out the change, find the coin that is missing, add up two prices, and see what is left in your purse. Level 1 is counting and change only. Canadian money in English, yen in Japanese.
- **Copy.** Tap squares until your grid matches the pattern.
- **Pairs.** Card matching with 3D flips. Higher levels use look-alike pictures.
- **Flash.** A number shows for a moment. Pick it from six that differ by one digit or a swap.

Every game with an answer to pick, except Train, uses six big buttons in two rows at the bottom of the screen, where a thumb can reach them. Train has three, one per piece of track.

All the games are original. They borrow the five kinds of puzzle from Nintendo's Big Brain Academy (look, remember, think, count, see). None of its art, names or puzzles are copied.

Each game ends on a star screen with two buttons, Again and Home. Three stars moves that game up a level, one star moves it down, five levels each. In Play, where each game gets one round, three clean rounds of a game in a row move it up and two rough ones move it down. If someone pauses for seven seconds the right answer starts to glow, four seconds the first time they meet a game. Lights, Pairs, Flash and Stopwatch have no glow, because pointing at the answer would give the whole game away. A wrong tap gets a soft low tone and a double tick, never a buzzer, and the game carries on.

Every tap has a sound and an iPhone haptic. Notes sit between about 160 and 1050 Hz because high frequencies are the first thing age-related hearing loss takes. The gear button on the home screen opens Settings: sound, vibration, bigger text, and English or 日本語. The language starts from the phone's setting. Reduce Motion is respected. Keyboard, Switch Control and Voice Control can answer too, and VoiceOver hears a name for every answer.

The look is flat pastel: soft fills, deep same-colour ink for text and pictures, thin borders, no shadows.

No accounts, no ads, no network, no tracking. Progress stays on the phone.

## Run it in a browser

```
npm start
```

Open http://localhost:8080. Haptics only work on a real phone.

`npm test` has a bot play every game and the mixed set in English, then switch to Japanese through Settings and play Train, Blocks, Stopwatch, Coins and the mixed set, in headless Chromium. It fails on any page error. Screenshots land in `/tmp/shots`.

## Build for iPhone

You need a Mac with Xcode 26 or newer, Node 22 or newer, and an Apple Developer account ($99 USD a year, about $139 CAD).

```
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

In Xcode:

1. Select the App target, Signing & Capabilities, pick your team.
2. General tab: set Display Name to Brain Garden, iPhone only, portrait only (untick Landscape Left and Right), and Minimum Deployments to iOS 16.0. The template says 15.0, and the games need iOS 16 to size their tiles.
3. Drag `store/AppIcon-1024.png` into Assets, AppIcon.
4. In Assets, Splash, replace all three images with `store/Splash-2732.png`. The template's launch image is Capacitor's blue logo on white.
5. Info tab: add `Appearance` (UIUserInterfaceStyle) set to `Light`. Without it, Dark Mode turns the status bar text white on the cream background.
6. Project, Info, Localizations: add Japanese. The App Store's Languages row comes from the app bundle, not from the listing, so without this a Japanese shopper sees English only.
7. Run on your own phone first. Check the haptics with sound off.
8. Product, Archive, then Distribute App to App Store Connect.

After any change in `www/`, run `npx cap sync ios` again.

## App Store submission

Everything for the listing is in `store/`:

- `AppIcon-1024.png`, no transparency, as Apple wants it.
- `Splash-2732.png`, the launch screen image for step 4 above.
- `screenshots/en` and `screenshots/ja`, six each at 1320 x 2868, the 6.9 inch size. App Store Connect scales them down for smaller iPhones. Regenerate with `npm run store-assets`. The Japanese ones are rendered on Linux with a plain gothic font. On a real iPhone the app uses rounded Hiragino Maru Gothic, so retake those six in the iOS Simulator before you submit.
- `listing.md`, the name, subtitle, description and keywords in both languages, ready to paste. Add Japanese as a localization in App Store Connect to use them.
- `PRIVACY.md`, the privacy policy. Host it somewhere public (a GitHub Pages page is fine) and paste the URL.

Answers for the App Store Connect forms:

- Privacy nutrition label: Data Not Collected.
- Age rating: 4+, no objectionable content.
- Category: Games, then Puzzle. Secondary: Board or Family.
- Export compliance: the app uses no encryption, answer No.

Check the name is free in App Store Connect before you get attached to it.
