//#region @backend
import chalk from 'chalk';
import * as path from 'path';
import { TnpDB } from './wrapper-db.backend';
if (!global['ENV']) {
  global['ENV'] = {};
}
const config = global['ENV'].config as any;
//#endregion
import * as _ from 'lodash';
import { Helpers, Project } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { CLASS } from 'typescript-class-helpers';

@CLASS.NAME('BuildOptions')
export class BuildOptions implements Models.dev.StartForOptions {

  public static PropsToOmmitWhenStringify = ['copyto', 'forClient'];
  prod?: boolean;
  outDir?: Models.dev.BuildDir;
  watch?: boolean;
  uglify?: boolean;
  obscure?: boolean;
  nodts?: boolean;
  staticBuild?: boolean;
  watchOnly?: boolean;
  skipCopyToSelection?: boolean;
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
  copyto?: Project[] | string[];
  copytoAll?: boolean;

  /**
   * For isomorphic-lib
   * Specyify build targets as workspace childs projects names
   */
  forClient?: Project[] | string[];


  private static getMainOptions(args: string[]) {
    //#region @backendFunc
    const ars = (config.argsReplacementsBuild as { [shortBuildName in string]: string } || {});
    const shortValuesArgs = Object.keys(ars);
    const toCheckArgs = Object.values(ars);
    const toCheckArgsSimplfied = Object.values(ars).map(c => Helpers.cliTool.paramsFrom(c));

    const ind = args.findIndex((p, i) => {
      const ends = ((config.coreBuildFrameworkNames as string[] || []).filter(c => {
        return p.endsWith(`/${c}`) || p == c;
      }).length > 0);

      const nextArgExisted = !!args[i + 1];
      if (nextArgExisted && shortValuesArgs.includes(args[i + 1])) {
        args[i + 1] = ars[args[i + 1]];
      }
      if (nextArgExisted && toCheckArgsSimplfied.includes(Helpers.cliTool.paramsFrom(args[i + 1]))) {
        args[i + 1] = toCheckArgs.find(c => {
          return Helpers.cliTool.paramsFrom(c) === Helpers.cliTool.paramsFrom(args[i + 1]);
        });
      }

      return ends &&
        nextArgExisted &&
        (toCheckArgs
          .map(c => Helpers.cliTool.paramsFrom(c))
          .includes(Helpers.cliTool.paramsFrom(args[i + 1]))
        );
    })
    let prod = false,
      watch = false,
      uglify = false,
      obscure = false,
      nodts = false,
      outDir = 'dist',
      appBuild = false,
      staticBuild = false;
    if (ind >= 0) {
      const cmd = _.kebabCase(args[ind + 1]).split('-').slice(1);
      for (let index = 0; index < cmd.length; index++) {
        const cmdPart = cmd[index];
        if (cmdPart === 'static') {
          staticBuild = true;
        }
        if (cmdPart === 'lib') {
          outDir = 'dist';
        }
        if (cmdPart === 'dist' || cmdPart === 'bundle') {
          outDir = cmdPart;
        }
        if (cmdPart === 'app') {
          appBuild = true;
        }
        if (cmdPart === 'prod') {
          prod = true;
        }
        if (cmdPart === 'watch') {
          watch = true;
        }
        if (cmdPart === 'uglify') {
          uglify = true;
        }
        if (cmdPart === 'obscure') {
          obscure = true;
        }
        if (cmdPart === 'nodts') {
          nodts = true;
        }
      }
      return { prod, watch, outDir, appBuild, staticBuild, uglify, obscure, nodts }
    }
    //#endregion
  }

  public static async from(
    argsString: string,
    projectCurrent: Project,
    mainOptions?: Partial<BuildOptions>,
    reason?: string
  ): Promise<BuildOptions> {

    Helpers.log(`[buildoptions][from] ${reason}`);

    //#region @backendFunc
    const split = argsString.split(' ');
    // console.log('split', split)
    const optionsToMerge = !!mainOptions ? mainOptions : this.getMainOptions(split);
    // console.log('optionsToMerge', optionsToMerge)
    if (!optionsToMerge) {
      return;
    }
    const argsObj: Partial<BuildOptions> = require('minimist')(split)
    // console.log('argsObj', argsObj)
    argsObj.watch = optionsToMerge.watch;
    argsObj.prod = optionsToMerge.prod;
    argsObj.uglify = optionsToMerge.uglify;
    argsObj.obscure = optionsToMerge.obscure;
    argsObj.nodts = optionsToMerge.nodts;
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
          }) as Project;
          if (!proj) {
            Helpers.log(`
            projectCurrent.parent.children: ${projectCurrent.parent.children.map(c => c.name)}
            `)
            Helpers.error(`${chalk.bold('--forClient argument')} : Cannot find module ${chalk.bold(projectParentChildName)} `
              + `in workspace ${(projectCurrent.parent as Project).genericName}`);
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
        let argPath = argsObj.copyto[index] as any;
        //     // console.log('argPath', argPath)
        //     // console.log('raw arg', args)

        //     // console.log('path', argPath)
        let project = (_.isString(argPath && argPath.location) ? argPath : await getProjectFromArgPath(argPath, projectCurrent));

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
    //#endregion
  }

  public static async exportToCMD(buildOptions: BuildOptions): Promise<string> {
    //#region @backendFunc
    if (!buildOptions) {
      return '';
    }
    const { appBuild = false, outDir, watch = false,
      copyto, baseHref,
      forClient,
      prod = false,
      uglify = false,
      obscure = false,
      nodts = false,
      staticBuild = false,
      skipCopyToSelection = false,
      genOnlyClientCode, onlyBackend, onlyWatchNoBuild
    } = buildOptions;
    let args = [];

    if (_.isArray(copyto)) {
      const argsFromCopyto = [];
      for (let index = 0; index < copyto.length; index++) {
        const argPath = copyto[index] as any;
        const project = (_.isString(argPath && argPath.location) ? argPath
          : await getProjectFromArgPath(argPath));
        argsFromCopyto.push(`--copyto ${project.location}`);
      }
      args = args.concat(argsFromCopyto)
    }

    if (_.isArray(forClient)) {
      const argsFromForClient = []
      for (let index = 0; index < forClient.length; index++) {
        const argPath = forClient[index] as any;
        const project = (_.isString(argPath && argPath.location) ? argPath
          : await getProjectFromArgPath(argPath));
        argsFromForClient.push(`--forClient ${project.location}`);
      }
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

    if (skipCopyToSelection) {
      `--skipCopyToSelection true`
    }

    return `${config.frameworkName} ` +
      `${staticBuild ? 'static:' : ''}` +
      `build:` +
      `${appBuild ? 'app' : outDir}` +
      `${prod ? ':prod' : ''}` +
      `${watch ? ':watch' : ''}` +
      `${uglify ? ':uglify' : ''}` +
      `${obscure ? ':obscure' : ''}` +
      `${nodts ? ':nodts' : ''}` +
      ` ${args.join(' ')}`
    //#endregion
  }

  public toString = () => {
    return JSON.stringify(_.mergeWith({}, _.omit(this, BuildOptions.PropsToOmmitWhenStringify)), null, 4);
  };


}

//#region @backend
async function getProjectFromArgPath(argPath: string | object, projectCurrent?: Project) {
  if (_.isObject(argPath)) {
    argPath = (argPath as any).location;
  }

  let project: Project;

  if (_.isString(argPath) && !path.isAbsolute(argPath) && projectCurrent) {
    project = Project.From(path.join(projectCurrent.location, argPath));
  }
  if (!project) {
    project = Project.nearestTo<Project>(argPath as string);
  }
  if (!project) {
    const dbProjectsToCheck: Project[] = (await (await TnpDB.Instance()).getProjects()).map(p => p.project);

    project = dbProjectsToCheck.find(p => p.genericName === argPath);
    if (!project) {
      project = dbProjectsToCheck.find(p => p.name === argPath);
    }
  }
  return project;
}
//#endregion
