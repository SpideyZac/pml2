# PolyModLoader2 (PML2)

PolyModLoader2 (PML2) is a mod loader for PolyTrack, a game that allows users to create and share custom tracks. PML2 provides a cleaner and more efficient way to manage mods compared to the original PolyModLoader, which was based on a fork of PolyTrack.

## Contributing

### Patching Process

First, ensure you have the necessary prerequisites installed:

- [Node.js](https://nodejs.org/) (version 22 or higher)
- [pnpm](https://pnpm.io/) (version 10 or higher)

Next, clone the repository and install the dependencies:

```bash
git clone https://github.com/SpideyZac/pml2.git
cd pml2
pnpm install
```

To create your first patch, you must first update your patched game files. This can be done by running the following command:

```bash
node ./scripts/applyPatches.js
```

This should create two folders, `patched` and `patched-temp`. You do not need to worry about the `patched-temp` folder, as it is used for temporary storage during the patching process.

To create a patch, you can first modify the files in the `patched` folder. Once you have made your changes, you can create a patch script by running:

```bash
node ./scripts/createPatch.js <name-of-your-patch>
```

This will create a new patch script in the `patches` folder with the name you provided.

Finally, you should build the indexes for the patches by running:

```bash
node ./scripts/generateIndexes.js
```

**Note:** When you pull changes from the upstream repository or you create a new patch, you should always run the `applyPatches.js` script again to ensure your `patched` and `patched-temp` folders are up to date. Also do not ever modify the `core` folder, as those are the original files from PolyTrack. All modifications should be done in the `patched` folder. Finally, modifying patches are very hard to do, so it is recommended to create a new patch instead of modifying an existing one. You can attempt to modify a patch by using the `applyPatch.js` script to go to that patche's head, then modifying the files in the `patched` folder, running `createPatch.js` to create a new patch, renaming the new patch filename to the old patch filename, deleting the old patch file, and then modifying all patches which depend on the old patch to depend on the new patch instead. This is a very tedious process, so it is recommended to avoid modifying patches if possible.

### Modifying the PML2 Library

If you want to modify the PML2 library itself, you can do so by modifying the files in the `src` folder. Once you have made your changes, you can build the library by running:

```bash
pnpm build:pml
pnpm build:pml:types
```

This will create a build of the library in the `dist-pml2` folder. It will also generate type definitions in the `types` folder.

## License

The patches and the PML2 library are licensed under the [MIT License](LICENSE). The original PolyTrack game files are copyrighted by it's respective owner (Kodub). PML2 is not affiliated with or endorsed by Kodub in any way.

## TODO/FIXME
