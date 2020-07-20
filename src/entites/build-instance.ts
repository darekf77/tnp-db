//#region @backend
import * as _ from 'lodash';
import { CommandInstance } from './command-instance';
import { DBBaseEntity } from './base-entity';
import { Helpers } from 'tnp-helpers';
import chalk from 'chalk';
import { CLASS } from 'typescript-class-helpers';
import { Models } from 'tnp-models';
import { Project } from 'tnp-helpers';
import { BuildOptions } from '../build-options';

export type IBuildInstance = {
  buildOptions?: BuildOptions;
  cmd?: string;
  pid: number;
  ppid: number;
  location?: string;
};

@CLASS.NAME('BuildInstance')
export class BuildInstance extends DBBaseEntity implements IBuildInstance {
  data?: IBuildInstance;

  constructor(data?: IBuildInstance) {
    super()
    if (!data) {
      data = {} as any;
    }
    this.data = data;
  }

  async prepare(reason: string) {
    const data = this.data;

    // console.log('PROJECT', !!Project)
    // console.log('BuildOptions', !!BuildOptions)

    this.pid = data.pid;
    this.ppid = data.ppid;
    this.location = data.location;

    this.cmd = CommandInstance.fixedCommand(data.cmd);
    if (this.cmd) {
      this._buildOptions = await BuildOptions.from(this.cmd, Project.From(this.location), void 0, reason);
      this.cmd = await BuildOptions.exportToCMD(this._buildOptions);
    } else {
      if (_.isObject(data.buildOptions)) {
        this.cmd = await BuildOptions.exportToCMD(data.buildOptions);
        this._buildOptions = await BuildOptions.from(this.cmd, Project.From(this.location), void 0, reason);
        this.cmd = await BuildOptions.exportToCMD(this._buildOptions);
      } else {
        this.cmd = '';
        this._buildOptions = await BuildOptions.from(this.cmd, Project.From(this.location), void 0, reason);
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

  async updateCmdFrom(buildOptions: BuildOptions) {
    this.cmd = await BuildOptions.exportToCMD(buildOptions);
    this._buildOptions = await BuildOptions.from(this.cmd, Project.From(this.location), void 0, 'update from cmd');
  }

  private _buildOptions: BuildOptions;
  get buildOptions() {
    return this._buildOptions;
  }
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
      (this.buildOptions.staticBuild ? 'static' : '') + ',' +
      (this.buildOptions.prod ? 'prod' : '') + ',' +
      (this.buildOptions.watch ? 'watch' : 'normal') + ',' +
      (this.buildOptions.appBuild ? 'app' : 'lib') + ',' +
      (this.buildOptions.outDir) +
      ')'
    ) : ''
    return brief + `build instace for project: ${this.project.name} on pid: ${this.pid}`;
  }

  kill() {
    Helpers.log(`Killing ${this.brief}`)
    Helpers.killProcess(this.pid)
  }

  pid: number;
  ppid: number;
  location?: string;
  get project() {
    return Project.From(this.location) as Project;
  }

}
//#endregion
