//#region imports
//#region @backend
import { psList } from 'tnp-core';
//#endregion
//#region isomorphic
import { Helpers, Project } from 'tnp-helpers';
import { _ } from 'tnp-core';
import { Models, BaseController } from 'tnp-models';
import { CLASS } from 'typescript-class-helpers';
import { config } from 'tnp-config';
import { DbCrud } from 'firedev-crud';
//#endregion
import { BuildInstance } from '../entites/build-instance';
import { BuildOptions } from '../build-options';
import { TnpDB } from '../wrapper-db';
import { DB } from '../index';
//#endregion

@CLASS.NAME('BuildsController')
export class BuildsController extends BaseController<DbCrud> {
  //#region api

  //#region api / update
  /**
   * Update if proceses exists (by pid)
   */
  async update() {
    //#region @backend
    const ps: Models.system.PsListInfo[] = await psList();
    const filteredBuilds = await this.getExisted(ps);
    await this.crud.setBulk(filteredBuilds, BuildInstance);
    //#endregion
  }
  //#endregion

  //#region api / get existed
  private async getExisted(ps: Models.system.PsListInfo[]) {
    //#region @backendFunc
    // const js = JSON.stringify(ps);
    const procs = ps.filter(p => p.cmd?.split(' ').filter(p => {

      const ends = ((config.coreBuildFrameworkNames as string[] || []).filter(c => {
        return p.endsWith(`/bin/${c}`);
      }).length > 0);

      return ends;
    }).length > 0);
    for (let index = 0; index < procs.length; index++) {
      const p = procs[index];
      const location = Helpers.getWorkingDirOfProcess(p.pid);

      const project = Project.From(location);
      if (project) {

        Helpers.log(`

        location: ${location},
          pid: ${p.pid},
          cmd: ${p.cmd},
          ppid: ${p.ppid},

        `, 1);
        const splitCMd = p?.cmd ? p.cmd.split(' ') : [];
        if (splitCMd.length >= 3) {
          const tnpParam = Helpers.cliTool.simplifiedCmd(splitCMd[2]);
          if ([
            Helpers.cliTool.simplifiedCmd(DB.$LAST_BUILD),
            Helpers.cliTool.simplifiedCmd(DB.$LAST_BUILD, true),
          ].includes(tnpParam)) {
            const db = await TnpDB.Instance();
            const lastBuildCommand = (await db.getCommands()).find(c => c.location === location && c.isBuildCommand);
            if (lastBuildCommand) {
              p.cmd = lastBuildCommand.command;
            }
          } else if ([
            Helpers.cliTool.simplifiedCmd(DB.$LAST),
            Helpers.cliTool.simplifiedCmd(DB.$LAST, true),
          ].includes(tnpParam)) {
            const db = await TnpDB.Instance();
            const lastNotBuildCommand = (await db.getCommands()).find(c => c.location === location && !c.isBuildCommand);
            if (lastNotBuildCommand) {
              p.cmd = lastNotBuildCommand.command;
            }
          }
        }
        const b = await (BuildInstance.from({
          location,
          pid: p.pid,
          cmd: p.cmd,
          ppid: p.ppid,
        })).prepareInstance('get existed');

        // console.log('result build instance', b)
        procs[index] = b as any;
      } else {
        procs[index] = void 0;
      }
    }
    return (procs as any as BuildInstance[])
      .filter(b => !!b)
      .filter(b => b.isTnpProjectBuild);
    //#endregion
  }
  //#endregion

  //#region api / add existed
  async addExisted() {
    //#region @backend
    Helpers.log(`[db][reinit] adding existed builds`);
    await this.update();
    //#endregion
  }
  //#endregion

  //#region api / kill instances from projects
  async killInstancesFrom(projects: Project[]) {
    //#region @backend
    const projectsLocations = projects.map(p => p.location);
    (await this.crud.getAll<BuildInstance>(BuildInstance) as BuildInstance[])
      .filter(b => projectsLocations.includes(b.project.location))
      .forEach(b => {
        try {
          b.kill();
        } catch (error) {
          Helpers.warn(`Not able to kill ${b.brief}`);
        }
      });
    //#endregion
  }
  //#endregion

  //#region api / add
  async add(project: Project, buildOptions: BuildOptions, pid: number, ppid: number) {
    //#region @backend
    const currentB = await (BuildInstance.from({
      buildOptions,
      pid,
      location: project.location,
      ppid
    })).prepareInstance('db add');
    await this.crud.addIfNotExist(currentB);
    //#endregion
  }
  //#endregion

  //#region api / dist build founded for
  async distBuildFoundedFor(project: Project) {
    //#region @backend
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
    //#endregion
  }
  //#endregion

  //#region api / app build founded for
  async appBuildFoundedFor(project: Project) {
    //#region @backendFunc
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
    //#endregion
  }
  //#endregion

  //#region api / get existed pid
  async getExistedByPid(pid: number) {
    //#region @backend
    await this.update();
    const all = await this.crud.getAll<BuildInstance>(BuildInstance) as BuildInstance[];
    return all.find(a => a.pid === pid);
    //#endregion
  }
  //#endregion

  //#region api / get existed for options
  async getExistedForOptions(
    project: Project,
    buildOptions: BuildOptions,
    pid?: number,
    ppid?: number
  ): Promise<BuildInstance> {
    //#region @backendFunc
    await this.update();
    const currentB = await (BuildInstance.from({ buildOptions, pid, location: project.location, ppid }))
      .prepareInstance('getExistedForOptions');

    const all = await this.crud.getAll<BuildInstance>(BuildInstance) as BuildInstance[];
    const existed = all.find(b => {
      return b.isEqual(currentB);
    });
    if (_.isObject(existed)) {
      return existed;
    }
    //#endregion
  }
  //#endregion

  //#endregion
}

