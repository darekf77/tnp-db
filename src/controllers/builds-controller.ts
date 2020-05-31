//#region @backend
import * as _ from 'lodash';
import * as  psList from 'ps-list';

import { BaseController } from './base-controlller';
import { Helpers, Project } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { BuildInstance } from '../entites/build-instance';
// import { BuildOptions } from '../../project/features';
import { CLASS } from 'typescript-class-helpers';
import { BuildOptions } from '../build-options';
declare const global: any;
if (!global['ENV']) {
  global['ENV'] = {};
}
const config = global['ENV'].config as any;

@CLASS.NAME('BuildsController')
export class BuildsController extends BaseController {

  /**
   * Update if proceses exists (by pid)
   */
  async update() {
    const ps: Models.system.PsListInfo[] = await psList();
    const all = await this.crud.getAll<BuildInstance>(BuildInstance);
    // console.log('[UPDATE BUILDS] BEFORE FILTER', all.map(c => c.pid))
    const filteredBuilds = all.filter(b => {

      const exists = (ps.filter(p => {
        const pidEqual = (p.pid === b.pid);
        const isNodeCommand = (p.cmd.search('node') !== -1);
        const isFrameworkCommand = (p.cmd.search(config.frameworkName) !== -1);
        return pidEqual && isFrameworkCommand && isNodeCommand;
      }).length > 0)

      return exists;
    });



    // console.log('[UPDATE BUILDS] AFTER FILTER', filteredBuilds.map(c => c.pid))
    // process.exit(0)
    await this.crud.setBulk(filteredBuilds, BuildInstance);
  }

  private async getExisted(ps: Models.system.PsListInfo[]) {
    // const js = JSON.stringify(ps);
    let procs = ps.filter(p => p.cmd.split(' ').filter(p => {

      const ends = ((config.coreBuildFrameworkNames as string[] || []).filter(c => {
        return p.endsWith(`/bin/${c}`);
      }).length > 0)

      return ends;
    }).length > 0)
    for (let index = 0; index < procs.length; index++) {
      const p = procs[index];
      const location = Helpers.getWorkingDirOfProcess(p.pid);

      const project = Project.From(location)
      if (project) {
        const b = new BuildInstance({
          location: Helpers.getWorkingDirOfProcess(p.pid),
          pid: p.pid,
          cmd: p.cmd,
          ppid: p.ppid,
        });
        await b.prepare()
        // console.log('result build instance', b)
        procs[index] = b as any;
      } else {
        procs[index] = void 0;
      }
    }
    return (procs as any as BuildInstance[])
      .filter(b => !!b)
      .filter(b => b.isTnpProjectBuild);
  }

  async addExisted() {
    const ps: Models.system.PsListInfo[] = await psList();
    // console.log(ps.filter(p => p.cmd.split(' ').filter(p => p.endsWith(`/bin/tnp`)).length > 0));

    const builds = await this.getExisted(ps);
    await this.crud.setBulk(builds, BuildInstance);
  }

  async killInstancesFrom(projects: Project[]) {
    let projectsLocations = projects.map(p => p.location);
    (await this.crud.getAll<BuildInstance>(BuildInstance) as BuildInstance[])
      .filter(b => projectsLocations.includes(b.project.location))
      .forEach(b => {
        try {
          b.kill()
        } catch (error) {
          Helpers.warn(`Not able to kill ${b.brief}`)
        }
      })

  }

  async add(project: Project, buildOptions: BuildOptions, pid: number, ppid: number) {
    const currentB = new BuildInstance({
      buildOptions,
      pid,
      location: project.location,
      ppid
    });
    await currentB.prepare();
    await this.crud.addIfNotExist(currentB);
  }

  async distBuildFoundedFor(project: Project) {
    await this.update();
    const all = await this.crud.getAll<BuildInstance>(BuildInstance) as BuildInstance[];
    const result = all.find(b => {
      // if(b.location === '/Users/darek/projects/npm/firedev-projects/container-v2/workspace-v2/angular-lib-v2') {
      //   console.log('checking ', b.location)
      //   console.log('cmd ', b.cmd)
      //   console.log('b.buildOptions.forClient ', b.buildOptions && (b.buildOptions.forClient as any[]).map(c => c.name));
      // }

      return b.location === project.location
        && b.buildOptions
        && b.buildOptions.watch === true
        && b.buildOptions.appBuild === false
        && (project.isStandaloneProject ? true :
          _.isObject(
            (b.buildOptions.forClient as Project[]).find(c => {
              // console.log(`checking ${c.name}`)
              return c.location === project.location;
            }))
        );
    });
    // console.log(`result: ${!!result}`)
    return result;
  }

  async appBuildFoundedFor(project: Project) {
    await this.update();
    const all = await this.crud.getAll<BuildInstance>(BuildInstance) as BuildInstance[];
    const possibleLocation = [];
    if (project.isStandaloneProject) {
      possibleLocation.push(project.location);
    } else if (project.isWorkspaceChildProject) {
      project.parent.children.forEach(c => {
        possibleLocation.push(c.location);
      });
    }

    // console.log('possibleLocation', possibleLocation);
    // console.log('all', all.map(c => {
    //   return `${c.location},
    //    appBuild: ${c.buildOptions.appBuild}
    //    watch: ${c.buildOptions.watch}
    //    `
    // }))

    const result = all.filter(b =>
      b.buildOptions
      && b.buildOptions.watch === true
      && b.buildOptions.appBuild === true
      && possibleLocation.includes(b.location)
    );
    // console.log('result', result.map(c => {
    //   return `${c.location},
    //    appBuild: ${c.buildOptions.appBuild}
    //    watch: ${c.buildOptions.watch}
    //    `
    // }))
    return result;
  }

  async getExistedByPid(pid: number) {
    const all = await this.crud.getAll<BuildInstance>(BuildInstance) as BuildInstance[];
    return all.find(a => a.pid === pid);
  }

  async getExistedForOptions(project: Project, buildOptions: BuildOptions, pid?: number, ppid?: number): Promise<BuildInstance> {
    await this.update();
    const currentB = new BuildInstance({ buildOptions, pid, location: project.location, ppid });
    await currentB.prepare();
    const all = await this.crud.getAll<BuildInstance>(BuildInstance) as BuildInstance[]
    const existed = all.find(b => {
      return b.isEqual(currentB);
    })
    if (_.isObject(existed)) {
      return existed;
    }
  }


}
//#endregion
