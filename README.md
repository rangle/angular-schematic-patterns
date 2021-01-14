# SCAM Schematic

The Single Component Angular Module pattern is beneficial for maintaining and updating files within large scale Angular projects. In this schematic we also removed TestBed as the default test library for Angular due to it's inability to, at scale, provide a fast and extensible unit testing interface.

Inspiration and starting point taken from [wishtack/wishtack-steroids](https://github.com/wishtack/wishtack-steroids/tree/master/packages/schematics)

### Testing

This code was last tested with Angular 11. As Angular changes versions, underlying Schematics code can change dramatically so it's important to test at every major change with updated packages.

To test locally, install `@angular-devkit/schematics-cli` globally and use the `schematics` command line tool. That tool acts the same as the `generate` command of the Angular CLI, but also has a debug mode.

Check the documentation with

```bash
schematics --help
```

### Unit Testing

`npm run test` will run the unit tests, using Jest.
