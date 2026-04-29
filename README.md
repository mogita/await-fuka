<p align="center">
  <img src="fuka.jpg?raw=true" width="390" height="300" />
  <h3 align="center">Fuka</h3>
</p>

Fuka is a PoC of simple game making in [await](https://apps.apple.com/app/id6755678187). The name Fuka means hatching in Japanese (孵化). It's inspired by Tamagotchi, a handheld digital pet created in Japan in the 1990s. The goal of Fuka is to create a simple game where players can hatch and take care of virtual pets.

[Await widget skill](https://github.com/await-widget/skills) is used to create the game.

## Development

To initialize the project, run the following commands (`bun` is needed):

```
git clone https://github.com/mogita/await-fuka
cd await-fuka
bun install
```

To build the project, run:

```
bun build
```

## Installation and Usage

After building, copy the file `build/index.tsx` to `await` to see it in action.

On the first run, the sprites will be pre-rendered and cached. This should finish in a second or two. You'll find the generated sprites in the `assets` directory.

There are 3 buttons in the game:
- A: highlight menu items
- B: perform the action of the highlighted menu item
- C: cancel the menu highlight

## License

MIT © [mogita](https://github.com/mogita)
