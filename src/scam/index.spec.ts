import {
  SchematicTestRunner,
  UnitTestTree,
} from "@angular-devkit/schematics/testing";
import * as path from "path";
import { _mergeComponentAndModule, _outputTest } from "./index";

describe("scam", () => {
  describe("schematic", () => {
    const collectionPath = path.join(__dirname, "../collection.json");

    let appTree: UnitTestTree;

    beforeEach(async () => {
      const workspaceOptions = {
        name: "workspace",
        newProjectRoot: "projects",
        version: "6.0.0",
      };

      const appOptions = {
        name: "demo",
        inlineStyle: false,
        inlineTemplate: false,
        routing: false,
        skipTests: false,
        skipPackageJson: false,
      };
      const schematicRunner = new SchematicTestRunner(
        "@schematics/angular",
        require.resolve("@schematics/angular/collection.json")
      );
      appTree = await schematicRunner
        .runSchematicAsync("workspace", workspaceOptions)
        .toPromise();
      appTree = await schematicRunner
        .runSchematicAsync("application", appOptions, appTree)
        .toPromise();
    });

    it(`should create module in the component's file`, async () => {
      const runner = new SchematicTestRunner("schematics", collectionPath);

      const tree = await runner
        .runSchematicAsync(
          "scam",
          {
            name: "hello-world",
            project: "demo",
          },
          appTree
        )
        .toPromise();

      expect(tree.files).toContain(
        "/projects/demo/src/app/hello-world/hello-world.component.ts"
      );
      expect(tree.files).not.toContain(
        "/projects/demo/src/app/hello-world/hello-world.module.ts"
      );

      const component = tree.readContent(
        "/projects/demo/src/app/hello-world/hello-world.component.ts"
      );
      expect(component).toMatch(/export class HelloWorldComponent/);
      expect(component).toMatch(/export class HelloWorldModule/);
      expect(component).toMatch(/exports:\s*\[\s*HelloWorldComponent]/m);
    });

    it("should create handle PascalCase names", async () => {
      const runner = new SchematicTestRunner("schematics", collectionPath);

      const tree = await runner
        .runSchematicAsync(
          "scam",
          {
            name: "greetings/HelloWorld",
            project: "demo",
          },
          appTree
        )
        .toPromise();

      expect(tree.files).toContain(
        "/projects/demo/src/app/greetings/hello-world/hello-world.component.ts"
      );

      const component = tree.readContent(
        "/projects/demo/src/app/greetings/hello-world/hello-world.component.ts"
      );
      expect(component).toMatch(/export class HelloWorldComponent/);
      expect(component).toMatch(/export class HelloWorldModule/);
      expect(component).toMatch(/exports:\s*\[\s*HelloWorldComponent]/m);
    });

    it("should create a module with a component in the same directory", async () => {
      const runner = new SchematicTestRunner("schematics", collectionPath);

      const tree = await runner
        .runSchematicAsync(
          "scam",
          {
            name: "views/hello-world",
            project: "demo",
            separateModule: true,
          },
          appTree
        )
        .toPromise();

      expect(tree.files).toContain(
        "/projects/demo/src/app/views/hello-world/hello-world.module.ts"
      );
      expect(tree.files).toContain(
        "/projects/demo/src/app/views/hello-world/hello-world.component.ts"
      );

      const moduleContent = tree.readContent(
        "/projects/demo/src/app/views/hello-world/hello-world.module.ts"
      );
      expect(moduleContent).toMatch(
        /import.*HelloWorldComponent.*from '.\/hello-world.component'/
      );
      expect(moduleContent).toMatch(/declarations:\s*\[HelloWorldComponent]/m);
      expect(moduleContent).toMatch(/exports:\s*\[\s*HelloWorldComponent]/m);
    });

    it("should create a test file without TestBed", async () => {
      const runner = new SchematicTestRunner("schematics", collectionPath);

      const tree = await runner
        .runSchematicAsync(
          "scam",
          {
            name: "views/hello-world",
            project: "demo",
          },
          appTree
        )
        .toPromise();

      expect(tree.files).toContain(
        "/projects/demo/src/app/views/hello-world/hello-world.component.ts"
      );
      expect(tree.files).toContain(
        "/projects/demo/src/app/views/hello-world/hello-world.component.spec.ts"
      );
      const content = tree.readContent(
        "/projects/demo/src/app/views/hello-world/hello-world.component.spec.ts"
      );
      expect(content).toMatch(/new HelloWorldComponent/m);
      expect(content).not.toMatch(/TestBed/m);
    });

    it("should not create a test file if skipTests option is true", async () => {
      const runner = new SchematicTestRunner("schematics", collectionPath);

      const tree = await runner
        .runSchematicAsync(
          "scam",
          {
            name: "views/hello-world",
            project: "demo",
            skipTests: true,
          },
          appTree
        )
        .toPromise();

      expect(tree.files).not.toContain(
        "/projects/demo/src/app/views/hello-world/hello-world.component.spec.ts"
      );
    });
  });

  describe("_mergeComponentAndModule", () => {
    const componentContent = `import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-hello-world',
  templateUrl: './hello-world.component.html',
  styleUrls: ['./hello-world.component.css']
})
export class HelloWorldComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
`;
    const moduleContent = `import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelloWorldComponent } from './hello-world.component';

@NgModule({
  declarations: [HelloWorldComponent],
  imports: [
    CommonModule
  ],
  exports: [HelloWorldComponent]
})
export class HelloWorldModule { }
`;

    it("should merge component and module", () => {
      const expectedContent = `import { Component, NgModule, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hello-world',
  templateUrl: './hello-world.component.html',
  styleUrls: ['./hello-world.component.css']
})
export class HelloWorldComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}

@NgModule({
  declarations: [HelloWorldComponent],
  imports: [
    CommonModule
  ],
  exports: [HelloWorldComponent]
})
export class HelloWorldModule { }
`;

      const result = _mergeComponentAndModule({
        componentContent,
        moduleContent,
      });

      const lineList = result.split("\n").map((line) => line.trim());

      expect(lineList).toContain(
        `import { Component, NgModule, OnInit } from '@angular/core';`
      );
      expect(lineList).toContain(
        `import { CommonModule } from '@angular/common';`
      );
      expect(lineList).not.toContain(
        `import { NgModule } from '@angular/core';`
      );
      expect(lineList).not.toContain(
        `import { HelloWorldComponent } from './hello-world.component';`
      );
      expect(lineList).toContain("declarations: [HelloWorldComponent],");
      expect(lineList).toContain("exports: [HelloWorldComponent]");

      expect(result).toEqual(expectedContent);
    });
  });
});
