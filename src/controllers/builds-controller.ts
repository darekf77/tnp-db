//#region @backend
import * as _ from 'lodash';
import * as  psList from 'ps-list';

import { BaseController } from './base-controlller';
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { BuildInstance } from '../entites/build-instance';
// import { BuildOptions } from '../../project/features';
import { CLASS } from 'typescript-class-helpers';
declare const global: any;
declare const ENV: any;
const config = ENV.config as any;




@CLASS.NAME('BuildsController')
export class BuildsController extends BaseController {

  /**
   * Update if proceses exists (by pid)
   */
  async update() {
    const ps: Models.system.PsListInfo[] = await psList();
    const all = this.crud.getAll<BuildInstance>(BuildInstance);
    // console.log('[UPDATE BUILDS] BEFORE FILTER', all.map(c => c.pid))
    const filteredBuilds = all.filter(b => ps.filter(p => {
      const pidEqual = (p.pid == b.pid);
      const isNodeCommand = (p.cmd.search('node') !== -1)
      const isFrameworkCommand = (p.cmd.search(config.frameworkName) !== -1)
      return pidEqual && isFrameworkCommand && isNodeCommand;
    }).length > 0);



    // console.log('[UPDATE BUILDS] AFTER FILTER', filteredBuilds.map(c => c.pid))
    // process.exit(0)
    this.crud.setBulk(filteredBuilds, BuildInstance);
  }

  private getExisted(ps: Models.system.PsListInfo[]) {
    return ps
      .filter(p => p.cmd.split(' ').filter(p => p.endsWith(`/bin/tnp`)).length > 0)
      .map(p => {
        const location = Helpers.getWorkingDirOfProcess(p.pid);
        const Project = CLASS.getBy('Project') as any;
        const project = Project.From(location)
        if (project) {
          const b = new BuildInstance({
            location: Helpers.getWorkingDirOfProcess(p.pid),
            pid: p.pid,
            cmd: p.cmd,
            ppid: p.ppid,
          });
          // console.log('result build instance', b)
          return b;
        }
      })
      .filter(b => !!b)
      .filter(b => b.isTnpProjectBuild)
  }

  async addExisted() {
    const ps: Models.system.PsListInfo[] = await psList();
    // console.log(ps.filter(p => p.cmd.split(' ').filter(p => p.endsWith(`/bin/tnp`)).length > 0));

    const builds = this.getExisted(ps);
    this.crud.setBulk(builds, BuildInstance);
  }

  async killInstancesFrom(projects: Models.other.IProject[]) {
    let projectsLocations = projects.map(p => p.location);
    (this.crud
      .getAll<BuildInstance>(BuildInstance) as BuildInstance[])
      .filter(b => projectsLocations.includes(b.project.location))
      .forEach(b => {
        try {
          b.kill()
        } catch (error) {
          Helpers.warn(`Not able to kill ${b.brief}`)
        }
      })

  }

  add(project: Models.other.IProject, buildOptions: Models.dev.IBuildOptions, pid: number, ppid: number) {
    const currentB = new BuildInstance({
      buildOptions,
      pid,
      location: project.location,
      ppid
    })
    this.crud.addIfNotExist(currentB);
  }

  async distBuildFoundedFor(project: Models.other.IProject) {
    await this.update();
    const all = this.crud.getAll<BuildInstance>(BuildInstance) as BuildInstance[];
    return all.find(b => b.location === project.location && b.buildOptions
      && b.buildOptions.watch === true
      && b.buildOptions.appBuild === false
    );
  }

  async getExistedForOptions(project: Models.other.IProject, buildOptions: Models.dev.IBuildOptions, pid?: number, ppid?: number): Promise<BuildInstance> {
    await this.update();
    const currentB = new BuildInstance({ buildOptions, pid, location: project.location, ppid })
    const all = this.crud.getAll<BuildInstance>(BuildInstance) as BuildInstance[]
    const existed = all.find(b => {
      return b.isEqual(currentB);
    })
    if (_.isObject(existed)) {
      return existed;
    }
  }


}
//#endregion
