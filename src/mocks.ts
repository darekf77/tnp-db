//#region @backend
import * as path from 'path';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import * as rimraf from 'rimraf';
import { CLASS } from 'typescript-class-helpers';

export function mocks() {
  class Project {
    static projects = [];
    isTnpProjectBuild = false;
    static get Current() {
      const inst = new Project(path.join(process.cwd()));
      return inst;
    }
    static get Tnp() {
      let inst = new Project(path.join(process.cwd(), '../tnp'));
      return inst;
    }
    static From(location) {
      if (fse.existsSync(location) &&
        fse.lstatSync(location).isDirectory() &&
        fse.existsSync(path.join(location, 'package.json'))
      ) {
        const inst = new Project(location);
        if(_.isUndefined(Project.projects.find( p => p.location === inst.location ))) {
          Project.projects.push(inst);
        }

        return inst;
      }
    }

    constructor(public location) {

    }
  }


  CLASS.setName(Project, 'Project');


  class BuildOptions {
    static from() {
      return new BuildOptions();
    }
  }
  CLASS.setName(BuildOptions, 'BuildOptions');
}
//#endregion
