# Variable: VERSION

```ts
const VERSION: string = __PACKAGE_VERSION__;
```

SDK version, compiled in from package.json: major.minor.patch in source, and with the
Bamboo build number as a fourth part in a shipped SDK, e.g. 0.1.0.1234 (0 for a local build).
