## @at-flux/graphy-toolkit [1.0.4](https://github.com/at-flux/graphy-toolkit/compare/@at-flux/graphy-toolkit@1.0.3...@at-flux/graphy-toolkit@1.0.4) (2026-06-02)


### Features

* **cli:** add per-pipeline progress bars ([246b283](https://github.com/at-flux/graphy-toolkit/commit/246b2837ec7aa8bcbd88a819fdfb0c4ff8e5fee8))
* **cli:** show applied settings per pipeline ([3fe9633](https://github.com/at-flux/graphy-toolkit/commit/3fe9633e3af2f4c36a9638ef588163ddf63f6200))


### Dependencies

* **@at-flux/graphy-toolkit-core:** upgraded to 1.0.2

## @at-flux/graphy-toolkit [1.0.3](https://github.com/at-flux/graphy-toolkit/compare/@at-flux/graphy-toolkit@1.0.2...@at-flux/graphy-toolkit@1.0.3) (2026-06-02)

### Bug Fixes

- **release:** build core before CLI publish ([66bcbe7](https://github.com/at-flux/graphy-toolkit/commit/66bcbe78d9f01e7144209cff32a392375cd3e7e0))

## @at-flux/graphy-toolkit [1.0.2](https://github.com/at-flux/graphy-toolkit/compare/@at-flux/graphy-toolkit@1.0.1...@at-flux/graphy-toolkit@1.0.2) (2026-06-01)

### Bug Fixes

- **cli:** satisfy TS 6 and align resolve test with presets ([2f9c43c](https://github.com/at-flux/graphy-toolkit/commit/2f9c43cca80b4729bbd5623407689b7c2a6251fc))

## @at-flux/graphy-toolkit [1.0.1](https://github.com/at-flux/graphy-toolkit/compare/@at-flux/graphy-toolkit@1.0.0...@at-flux/graphy-toolkit@1.0.1) (2026-06-01)

### Bug Fixes

- **ci:** install Node 24 before pnpm in all workflows ([8d21e7e](https://github.com/at-flux/graphy-toolkit/commit/8d21e7e114267d9dd00188e24e4a6ad30e499b28))
- **ci:** restore workspace:\* dep after semantic-release bump ([d7873f0](https://github.com/at-flux/graphy-toolkit/commit/d7873f0fb18d13e405a56fad6b57c0c05f7fa7b4))

### Dependencies

- **@at-flux/graphy-toolkit-core:** upgraded to 1.0.1

# @at-flux/graphy-toolkit 1.0.0 (2026-05-30)

### Bug Fixes

- **ci:** drop Docker, unify Deno compile with local scripts ([c617800](https://github.com/at-flux/graphy-toolkit/commit/c617800cd4a558f1392706b65befe83a3bc6d323))
- **ci:** sync lockfile and typecheck CLI against core source ([2fc1ac1](https://github.com/at-flux/graphy-toolkit/commit/2fc1ac11a3d9d6f4641542f68ba6e6ca9d0c1172))
- **publish:** ship dist/ui and bundled agent skill in npm package ([2093e4b](https://github.com/at-flux/graphy-toolkit/commit/2093e4bb5fa2415b2d7e9e531cdd4d74b68900e9))

### Features

- **cli:** add stricli graphy stills, clips, and install ([fa07180](https://github.com/at-flux/graphy-toolkit/commit/fa071806e21509bfa3131416a8c57a8a56fa80e7))
- **cli:** auto-load presets and resolve glob sources ([27e755d](https://github.com/at-flux/graphy-toolkit/commit/27e755de5f46bad8ce66577c30413bd3fad987e7))
- **cli:** rewrite graphy to stills/clips with progress bar UI ([4a695c3](https://github.com/at-flux/graphy-toolkit/commit/4a695c3538b5181e2f7447ca3112b0fce4c3a577))

### Dependencies

- **@at-flux/graphy-toolkit-core:** upgraded to 1.0.0
