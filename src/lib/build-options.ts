//#region imports
//#region @backend
import { CLI } from 'tnp-cli';
import { path } from 'tnp-core';
//#endregion
import { TnpDB } from './wrapper-db';
import { config } from 'tnp-config';
import { _ } from 'tnp-core';
import { Helpers, Project } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { CLASS } from 'typescript-class-helpers';
//#endregion

@CLASS.NAME('BuildOptions')
export class BuildOptions implements Models.dev.StartForOptions {

  //#region static

  //#region static field & getters
  public static PropsToOmmitWhenStringify = ['copyto', 'forClient'];
  //#endregion

  //#region static fields

  //#region static fields / get main options
  private static getMainOptions(args: string[]) {
    //#region @backendFunc
    const ars = (config.argsReplacementsBuild as { [shortBuildName in string]: string } || {});
    const shortValuesArgs = Object.keys(ars);
    const toCheckArgs = Object.values(ars);
    const toCheckArgsSimplfied = Object.values(ars).map(c => Helpers.cliTool.simplifiedCmd(c));

    const ind = args.findIndex((p, i) => {
      const ends = ((config.coreBuildFrameworkNames as string[] || []).filter(c => {
        return p.endsWith(`/${c}`) || p === c;
      }).length > 0);

      const nextArgExisted = !!args[i + 1];
      if (nextArgExisted && shortValuesArgs.includes(args[i + 1])) {
        args[i + 1] = ars[args[i + 1]];
      }
      if (nextArgExisted && toCheckArgsSimplfied.includes(Helpers.cliTool.simplifiedCmd(args[i + 1]))) {
        // @ts-ignore
        args[i + 1] = toCheckArgs.find(c => {
          return Helpers.cliTool.simplifiedCmd(c) === Helpers.cliTool.simplifiedCmd(args[i + 1]);
        });
      }

      return ends &&
        nextArgExisted &&
        (toCheckArgs
          .map(c => Helpers.cliTool.simplifiedCmd(c))
          .includes(Helpers.cliTool.simplifiedCmd(args[i + 1]))
        );
    });

    let prod = false,
      watch = false,
      uglify = false,
      obscure = false,
      includeNodeModules = false,
      nodts = false,
      outDir = 'dist',
      appBuild = false,
      staticBuild = false,
      ngbuildonly = false;

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
        if (cmdPart === 'ngbuildonly') {
          ngbuildonly = true;
        }
        if (cmdPart === 'uglify') {
          uglify = true;
        }
        if (cmdPart === 'obscure') {
          obscure = true;
        }
        if (cmdPart === 'includeNodeModules') {
          includeNodeModules = true;
        }
        if (cmdPart === 'nodts') {
          nodts = true;
        }
      }
      return { prod, watch, outDir, appBuild, staticBuild, uglify, obscure, includeNodeModules, nodts, ngbuildonly };
    }
    //#endregion
  }
  //#endregion

  public static fromJson(json: Pick<BuildOptions, 'outDir' | 'websql' | 'serveApp' | 'appBuild' | 'watch' | 'prod' | 'args'>) {
    const options = json as BuildOptions;
    if (_.isUndefined(options.outDir)) {
      options.outDir = 'dist';
    }
    if (_.isUndefined(options.prod)) {
      options.prod = false;
    }
    if (_.isUndefined(options.websql)) {
      options.websql = false;
    }
    if (_.isUndefined(options.serveApp)) {
      options.serveApp = false;
    }
    if (_.isUndefined(options.watch)) {
      options.watch = false;
    }
    if (_.isUndefined(options.appBuild)) {
      options.appBuild = false;
    }
    if (_.isUndefined(options.args)) {
      options.args = '';
    }

    delete options.copyto;
    delete options.forClient;
    const buildOpt = new BuildOptions();
    return _.merge(buildOpt, options) as BuildOptions; // TODO
  }

  //#region static fields / from
  public static async from(
    argsString: string,
    projectCurrent: Project,
    mainOptions?: Partial<BuildOptions>,
    reason?: string
  ): Promise<BuildOptions> {
    //#region @backendFunc
    Helpers.log(`[buildoptions][from] ${reason}`);
    const split = argsString.split(' ');
    // console.log('split', split)
    const optionsToMerge = (!!mainOptions ? mainOptions : this.getMainOptions(split)) as Partial<BuildOptions>;
    // console.log({ optionsToMerge })
    if (!optionsToMerge) {
      Helpers.log(`[build-options] NO options to merge`);
      return (void 0) as any;
    }
    const argsObj: Partial<BuildOptions> = require('minimist')(split);
    // console.log({
    //   argsObj
    // })
    Object.keys(argsObj).forEach(key => {
      if (_.isString(key) && (key.length === 1) && _.isBoolean(argsObj[key])) {
        Helpers.log(`[build-options] Removing argument: "${key}=${argsObj[key]}`);
        delete argsObj[key];
      }
    });

    argsObj.watch = optionsToMerge.watch;
    argsObj.prod = optionsToMerge.prod;
    argsObj.uglify = optionsToMerge.uglify;
    argsObj.obscure = optionsToMerge.obscure;
    argsObj.includeNodeModules = optionsToMerge.includeNodeModules;
    // argsObj.websql = optionsToMerge.websql;
    // argsObj.serveApp = optionsToMerge.serveApp;
    argsObj.nodts = optionsToMerge.nodts;
    argsObj.outDir = optionsToMerge.outDir as any;
    argsObj.appBuild = optionsToMerge.appBuild;
    argsObj.ngbuildonly = optionsToMerge.ngbuildonly;
    argsObj.copyto = (_.isUndefined(argsObj.copyto) && _.isArray(optionsToMerge.copyto)) ?
      optionsToMerge.copyto : argsObj.copyto;
    argsObj.args = argsString;

    // console.log({
    //   argsString,
    //   argsObj
    // })
    if (!_.isNil(argsObj.forClient)) {
      if (_.isString(argsObj.forClient)) {
        argsObj.forClient = [argsObj.forClient];
      }
    }
    if (!_.isArray(argsObj.forClient)) {
      argsObj.forClient = [];
    }
    argsObj.forClient = Helpers.arrays.uniqArray<Project>(argsObj.forClient, 'location');

    if (!_.isNil(argsObj.copyto)) {
      if (_.isString(argsObj.copyto)) {
        argsObj.copyto = [argsObj.copyto];
      }

      for (let index = 0; index < argsObj.copyto.length; index++) {
        const argPath = argsObj.copyto[index] as any;
        //     // console.log('argPath', argPath)
        //     // console.log('raw arg', args)

        //     // console.log('path', argPath)
        const project = (_.isString(argPath && argPath.location)
          ? argPath
          : await getProjectFromArgPath(argPath, projectCurrent));

        if (!project) {
          Helpers.error(`[build-options] Incorrect "copyto" values. Path doesn't contain `
            + `${config.frameworkName} type project: ${argPath}`, false, true);
        }

        argsObj.copyto[index] = project as any;
      }
      argsObj.copyto = (argsObj.copyto as any[]).filter(p => !!p);
    }
    if (!_.isArray(argsObj.copyto)) {
      argsObj.copyto = [];
    }

    argsObj.copyto = Helpers.arrays.uniqArray<Project>(argsObj.copyto, 'location');

    argsObj.onlyWatchNoBuild = !!argsObj.onlyWatchNoBuild;
    argsObj.genOnlyClientCode = !!argsObj.genOnlyClientCode;

    const result = _.merge(new BuildOptions(), argsObj) as BuildOptions;
    // console.log(result)
    return result;
    //#endregion
  }
  //#endregion

  //#region static fields / export to cmd
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
      includeNodeModules = false,
      websql = false,
      serveApp = false,
      nodts = false,
      staticBuild = false,
      skipCopyToSelection = false,
      genOnlyClientCode, onlyBackend, onlyWatchNoBuild
    } = buildOptions;
    let args: string[] = [];

    if (_.isArray(copyto)) {
      const argsFromCopyto: string[] = [];
      for (let index = 0; index < copyto.length; index++) {
        const argPath = copyto[index] as any;
        const project = (_.isString(argPath && argPath.location) ? argPath
          : await getProjectFromArgPath(argPath));
        argsFromCopyto.push(`--copyto ${project.location}`);
      }
      args = args.concat(argsFromCopyto);
    }

    if (_.isArray(forClient)) {
      const argsFromForClient = [];
      for (let index = 0; index < forClient.length; index++) {
        const argPath = forClient[index] as any;
        const project = (_.isString(argPath && argPath.location) ? argPath
          : await getProjectFromArgPath(argPath));

        // @ts-ignore
        argsFromForClient.push(`--forClient ${project.location}`);
      }
      args = args.concat(argsFromForClient);
    }

    if (genOnlyClientCode) {
      args.push('--genOnlyClientCode');
    }

    if (onlyBackend) {
      args.push('--onlyBackend');
    }

    if (onlyWatchNoBuild) {
      args.push('--onlyWatchNoBuild');
    }

    if (baseHref && baseHref.trim() !== '') {
      args.push(`--baseHref ${baseHref}`);
    }

    if (skipCopyToSelection) {
      `--skipCopyToSelection true`;
    }

    return `${config.frameworkName} ` +
      `${staticBuild ? 'static:' : ''}` +
      `build:` +
      `${appBuild ? 'app' : outDir}` +
      `${prod ? ':prod' : ''}` +
      `${watch ? ':watch' : ''}` +
      `${uglify ? ':uglify' : ''}` +
      `${obscure ? ':obscure' : ''}` +
      `${includeNodeModules ? ':includeNodeModules' : ''}` +
      `${websql ? ':websql' : ''}` +
      `${serveApp ? ':serveApp' : ''}` +
      `${nodts ? ':nodts' : ''}` +
      ` ${args.join(' ')}`;
    //#endregion
  }
  //#endregion

  //#endregion

  //#endregion

  //#region fields
  prod?: boolean;
  outDir?: Models.dev.BuildDir;
  watch?: boolean;
  uglify?: boolean;
  obscure?: boolean;
  includeNodeModules?: boolean;
  websql?: boolean;
  /**i n lib build serve app when possible */
  serveApp?: boolean;
  nodts?: boolean;
  ngbuildonly?: boolean;
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
  //#endregion

  //#region api
  public toString = () => {
    return JSON.stringify(_.mergeWith({}, _.omit(this, BuildOptions.PropsToOmmitWhenStringify)), null, 4);
  }

  public clone(override?: Partial<BuildOptions>) {
    const copy = new BuildOptions();
    Object.keys(this).forEach(key => {
      const org = this[key];
      copy[key] = org;
    });
    Object.assign(copy, override);
    return copy as BuildOptions;
  }

  //#endregion

}

//#region helpers
//#region @backend
async function getProjectFromArgPath(argPath: string | object, projectCurrent?: Project) {
  if (_.isObject(argPath)) {
    argPath = (argPath as any).location;
  }

  let project: Project;

  if (_.isString(argPath) && !path.isAbsolute(argPath) && projectCurrent) {
    project = Project.From(path.join(projectCurrent.location, argPath));
  }

  // @ts-ignore
  if (!project) {
    project = Project.nearestTo<Project>(argPath as string);
  }
  if (!project) {
    // @ts-ignore
    const dbProjectsToCheck: Project[] = (await (await TnpDB.Instance()).getProjects()).map(p => p.project);
    // @ts-ignore
    project = dbProjectsToCheck.find(p => p.genericName === argPath);
    if (!project) {
      // @ts-ignore
      project = dbProjectsToCheck.find(p => p.name === argPath);
    }
  }
  return project;
}
//#endregion
//#endregion
