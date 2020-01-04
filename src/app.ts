import { CLASS } from 'typescript-class-helpers';

//#region @backend

// import program from 'commander'; TODO
// program.version('0.0.1');



export default async function () {

  class BuildOptions {

  }
  CLASS.setName(BuildOptions, 'BuildOptions');

  class Project {
    location:string;
    static From() {

    }
  }
  CLASS.setName(Project, 'Project');

  const proj = CLASS.getBy('Project') as typeof Project;
  console.log(proj);
  console.log(proj.From);

}
//#endregion
