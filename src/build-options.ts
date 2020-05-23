//#region @backend
import chalk from 'chalk';
import * as path from 'path';
import { Helpers } from 'tnp-helpers';
//#endregion

import * as _ from 'lodash';
import { Models } from 'tnp-models';
if (!global['ENV']) {
  global['ENV'] = {};
}
const config = global['ENV'].config as any;
import { CLASS } from 'typescript-class-helpers';
import { TnpDB } from './wrapper-db.backend';

@CLASS.NAME('BuildOptions')
export class BuildOptions implements Models.dev.IBuildOptions {

  public static PropsToOmmitWhenStringify = ['copyto', 'forClient'];
  prod?: boolean;
  outDir?: Models.dev.BuildDir;
  watch?: boolean;
  watchOnly?: boolean;

  args?: string;
  progressCallback?: (fractionValue: number) => any;

  noConsoleClear?: boolean;

  /**
   * Do not generate backend code
   */
  genOnlyClientCode?: boolean;
  appBuild?: boolean;
  buildForAllClients?: boolean;
  baseHref?: string;

  /**
   * Generate only backend, without browser version
   */
  onlyBackend?: boolean;


  onlyWatchNoBuild?: boolean;
  copyto?: Models.other.IProject[] | string[];
  copytoAll?: boolean;

  /**
   * For isomorphic-lib
   * Specyify build targets as workspace childs projects names
   */
  forClient?: Models.other.IProject[] | string[];


  //#region @backend
  private static getMainOptions(args: string[]) {
    const ind = args.findIndex((p, i) => (p.endsWith('/tnp') || p === 'tnp')
      && !!args[i + 1] && args[i + 1].startsWith('build'))
    let prod = false, watch = false, outDir = 'dist', appBuild = false;
    if (ind >= 0) {
      const cmd = _.kebabCase(args[ind + 1]).split('-').slice(1)
      const first = _.first(cmd)

      if (first === 'dist' || first === 'bundle') {
        outDir = first;
      }
      if (first === 'app') {
        appBuild = true;
      }
      if (cmd.length >= 2) {
        const second = cmd[1];
        if (second === 'prod') {
          prod = true;
        }
        if (second === 'watch') {
          watch = true;
        }
      }

      if (cmd.length >= 3) {
        const third = cmd[1];
        if (third === 'prod') {
          prod = true;
        }
        if (third === 'watch') {
          watch = true;
        }
      }


    } else {
      return;
    }
    return { prod, watch, outDir, appBuild }
  }

  public static async from(argsString: string, projectCurrent: Models.other.IProject,
    mainOptions?: Models.dev.IBuildOptions): Promise<BuildOptions> {

    const split = argsString.split(' ');
    // console.log('split', split)
    const optionsToMerge = !!mainOptions ? mainOptions : this.getMainOptions(split);
    // console.log('optionsToMerge', optionsToMerge)
    if (!optionsToMerge) {
      return;
    }
    const argsObj: Models.dev.IBuildOptions = require('minimist')(split)
    // console.log('argsObj', argsObj)
    argsObj.watch = optionsToMerge.watch;
    argsObj.prod = optionsToMerge.prod;
    argsObj.outDir = optionsToMerge.outDir as any;
    argsObj.appBuild = optionsToMerge.appBuild;
    argsObj.args = argsString;


    if (!_.isNil(argsObj.forClient)) {
      if (_.isString(argsObj.forClient)) {
        argsObj.forClient = [argsObj.forClient]
      }
      if (!!projectCurrent && projectCurrent.isWorkspaceChildProject) {
        argsObj.forClient = (argsObj.forClient as string[]).map(projectParentChildName => {
          if (_.isObject(projectParentChildName)) {
            projectParentChildName = (projectParentChildName as any).name;
          }
          // console.log('projectParentChildName', projectParentChildName)
          const proj = projectCurrent.parent.children.find(c => {
            return c.name === (projectParentChildName as string) || c.location === (projectParentChildName as string)
          }) as Models.other.IProject;
          if (!proj) {
            Helpers.log(`
            projectCurrent.parent.children: ${projectCurrent.parent.children.map(c => c.name)}
            `)
            Helpers.error(`${chalk.bold('--forClient argument')} : Cannot find module ${chalk.bold(projectParentChildName)}`);
          }
          // Helpers.info(`(${projectCurrent.name}) Build only for client ${chalk.bold(projectParentChildName)}`)
          return proj;
        }) as any;
      }
    }
    if (!_.isArray(argsObj.forClient)) {
      argsObj.forClient = []
    }

    if (!_.isNil(argsObj.copyto)) {
      if (_.isString(argsObj.copyto)) {
        argsObj.copyto = [argsObj.copyto]
      }

      for (let index = 0; index < argsObj.copyto.length; index++) {
        let argPath = argsObj.copyto[index];
        //     // console.log('argPath', argPath)
        //     // console.log('raw arg', args)

        //     // console.log('path', argPath)
        if (_.isObject(argPath)) {
          argPath = (argPath as any).location;
        }

        const Project = CLASS.getBy('Project') as any;
        let project = Project.nearestTo(argPath as string);
        if (!project) {
          const dbProjectsToCheck: Models.other.IProject[] = (await (await TnpDB.Instance(config.dbLocation)).getProjects()).map(p => p.project);

          project = dbProjectsToCheck.find(p => p.genericName === argPath);
          if (!project) {
            project = dbProjectsToCheck.find(p => p.name === argPath);
          }
        }

        if (!project) {
          Helpers.error(`[build-options] Incorrect "copyto" values. Path doesn't contain ${config.frameworkName} type project: ${argPath}`, false, true)
        }

        argsObj.copyto[index] = project as any;
      }
      argsObj.copyto = (argsObj.copyto as any[]).filter(p => !!p);
    }
    if (!_.isArray(argsObj.copyto)) {
      argsObj.copyto = []
    }

    argsObj.onlyWatchNoBuild = !!argsObj.onlyWatchNoBuild;
    argsObj.genOnlyClientCode = !!argsObj.genOnlyClientCode;

    return _.merge(new BuildOptions(), argsObj) as BuildOptions;
  }

  public static exportToCMD(buildOptions: BuildOptions): string {
    const { appBuild, outDir, watch,
      copyto, baseHref, forClient, prod,
      genOnlyClientCode, onlyBackend, onlyWatchNoBuild
    } = buildOptions;
    const type = appBuild ? 'app' : outDir;
    let args = [];

    if (_.isArray(copyto)) {
      const argsFromCopyto = (copyto as any[]).map(c => {
        let locationOfProject: string;
        if (_.isString(c)) {
          locationOfProject = c;
        } else {
          locationOfProject = c.location;
        }
        return `--copyto ${locationOfProject}`
      });

      args = args.concat(argsFromCopyto)
    }

    if (_.isArray(forClient)) {
      const argsFromForClient = (forClient as any[]).map(c => {
        let project: string;
        if (_.isString(c)) {
          project = c;
        } else {
          project = c.name;
        }
        return `--forClient ${project}`
      })
      args = args.concat(argsFromForClient);
    }

    if (genOnlyClientCode) {
      args.push('--genOnlyClientCode')
    }

    if (onlyBackend) {
      args.push('--onlyBackend')
    }

    if (onlyWatchNoBuild) {
      args.push('--onlyWatchNoBuild')
    }

    if (baseHref && baseHref.trim() !== '') {
      args.push(`--baseHref ${baseHref}`)
    }


    return `${config.frameworkName} build:${type}${watch ? ':watch' : ''}${prod ? ':prod' : ''} ${args.join(' ')}`
  }
  //#endregion

  public toString = () => {
    return JSON.stringify(_.mergeWith({}, _.omit(this, BuildOptions.PropsToOmmitWhenStringify)), null, 4);
  };


}
