# Brain Garden

Ten short brain games for older adults, built for an iPhone, one finger and no reading glasses. English and Japanese. There is one home screen, every game has a big Home button, and nothing needs typing.

The big green Play button runs five random games, one round each. That is the whole app for most people. The ten tiles under it open one game at a time:

- **Count Up.** Tap 1 to 16 in order on a 4x4 grid. From level 2 the numbers skip, so you compare instead of count.
- **Odd One.** One picture is slightly different, like a tomato among apples. Later levels flip the same picture around.
- **Lights.** Squares light up with a tone each. Tap them back in the same order. Starts at four.
- **Heaviest.** Balance scales tip into place. Work out which ball is heaviest. Plain coloured balls, because a grape outweighing a melon would feel like a trick.
- **Add Up.** Tap two numbers that make the target. The board is built from matching pairs, so it never dead-ends.
- **Copy.** Tap squares until your grid matches the pattern. Tap again to undo.
- **Pairs.** Card matching with real 3D flips. Higher levels use look-alike pictures.
- **Blocks.** Count the blocks in a pile. Stacks never get taller toward the front, so no block is secretly hidden.
- **Coins.** Add up a handful of coins. Canadian coins in English, yen in Japanese.
- **Flash.** A number shows for a second and a half. Pick it from three that differ by one digit or a swap.

Every game is original. The five kinds (look, remember, think, count, see) follow the same idea as Nintendo's Big Brain Academy, but none of the art, names or puzzles are copied.

Each game ends on a star screen with two buttons, Again and Home. Three stars moves that game up a level, one star moves it down, five levels each. If someone pauses for seven seconds the right answer starts to glow, four seconds the first time they play. A wrong tap gets a soft low tone and a double tick, never a buzzer, and the game carries on.

Every tap has a sound and an iPhone haptic. Tones stay between 200 and 1100 Hz because high frequencies are the first thing age related hearing loss takes. The home screen has four toggles: sound, vibration, bigger text, and English or 日本語. The language starts from the phone's setting. Reduce Motion is respected.

The mascot is Mame, a bean sprout. Mame bobs on the home screen and jumps on the results screen.

No accounts, no ads, no network, no tracking. Progress stays on the phone.

## Run it in a browser

```
npm start
```

Open http://localhost:8080. Haptics only work on a real phone.

`npm test` has a bot play all ten games and the mixed set, in English then Japanese, in headless Chromium. It fails on any page error. Screenshots land in `/tmp/shots`.

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
- `screenshots/en` and `screenshots/ja`, six each at 1320 x 2868, the 6.9 inch size. App Store Connect scales them down for smaller iPhones. Regenerate with `npm run store-assets`. The Japanese ones are rendered on Linux with a plain gothic font. On a real iPhone the app uses rounded Hiragino Maru Gothic, so retake those six in the iOS Simulator before you submit.
- `listing.md`, the name, subtitle, description and keywords in both languages, ready to paste. Add Japanese as a localization in App Store Connect to use them.
- `PRIVACY.md`, the privacy policy. Host it somewhere public (a GitHub Pages page is fine) and paste the URL.

Answers for the App Store Connect forms:

- Privacy nutrition label: Data Not Collected.
- Age rating: 4+, no objectionable content.
- Category: Games, then Puzzle. Secondary: Board or Family.
- Export compliance: the app uses no encryption, answer No.

Check the name is free in App Store Connect before you get attached to it.
