//#region @backend
import * as _ from 'lodash';
import { CommandInstance } from './command-instance';
import { DBBaseEntity } from './base-entity';
import { Helpers } from 'tnp-helpers';
import chalk from 'chalk';
import { CLASS } from 'typescript-class-helpers';
import { Models } from 'tnp-models';

export type IBuildInstance = {
  buildOptions?: Models.dev.IBuildOptions;
  cmd?: string;
  pid: number;
  ppid: number;
  location?: string;
};

@CLASS.NAME('BuildInstance')
export class BuildInstance extends DBBaseEntity implements IBuildInstance {


  constructor(data?: IBuildInstance) {
    super()
    if (!data) {
      data = {} as any;
    }
    const BuildOptions = CLASS.getBy('BuildOptions') as any;
    const Project = CLASS.getBy('Project') as any;

    const { buildOptions, pid, location, cmd } = data;
    this.buildOptions = buildOptions;
    this.pid = pid;
    this.cmd = CommandInstance.fixedCommand(cmd);
    this.location = location;

    if (!this.cmd && !this.buildOptions) {
      // console.log('create empty IBuildInstance ')
    } else {
      if (!this.cmd) {

        this.cmd = BuildOptions.exportToCMD(this.buildOptions);
      }

      if (!this.buildOptions && !!Project.From(process.cwd())) {
        const project: Models.other.IProject = Project.Current;
        this.buildOptions = BuildOptions.from(this.cmd, project)
      }
    }

  }

  get isTnpProjectBuild() {
    let res = (_.isString(this.cmd) && this.cmd.trim() !== '' && _.isObject(this.buildOptions))
    // if (!res) {
    // console.log('it is not a build', this.cmd)
    // }
    return res;
  }


  buildOptions: Models.dev.IBuildOptions;
  cmd?: string;

  isEqual(anotherInstace: BuildInstance) {
    if (!anotherInstace) {
      return false;
    }
    return (this.pid == anotherInstace.pid ||
      (this.location === anotherInstace.location &&
        this.buildOptions.watch === anotherInstace.buildOptions.watch &&
        this.buildOptions.appBuild === anotherInstace.buildOptions.appBuild &&
        this.buildOptions.outDir === anotherInstace.buildOptions.outDir
      ))
  }

  public get brief() {
    let brief = this.buildOptions ? (
      '(' +
      (this.buildOptions.watch ? 'watch' : 'static') + ',' +
      (this.buildOptions.appBuild ? 'app' : 'lib') + ',' +
      (this.buildOptions.outDir) +
      ')'
    ) : ''
    return brief + `build instace for project: ${chalk.bold(this.project.name)} on pid: ${this.pid}`;
  }

  kill() {
    console.log(`Killing ${this.brief}`)
    Helpers.killProcess(this.pid)
  }

  pid: number;
  ppid: number;
  location?: string;
  get project() {
    const Project = CLASS.getBy('Project') as any;
    return Project.From(this.location);
  }

}
//#endregion
