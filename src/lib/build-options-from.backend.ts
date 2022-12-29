import { CLI } from 'tnp-cli';
import { config } from 'tnp-config';
import { path, _ } from 'tnp-core';
import { Helpers, Project } from "tnp-helpers";
import type { BuildOptions } from "./build-options";
import { getMainOptionsFun } from './build-options-get-main-options.backend';

export async function buildOptionsFrom(
  argsString: string,
  projectCurrent: Project,
  mainOptions: Partial<BuildOptions>,
  reason: string,
  BuildOptionsClass: typeof BuildOptions
) {
  //#region @backendFunc
  Helpers.log(`[buildoptions][from] ${reason}`);
  const split = argsString.split(' ');
  // console.log('split', split)
  const optionsToMerge = (!!mainOptions ? mainOptions : getMainOptionsFun(split)) as Partial<BuildOptions>;
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
  // argsObj.websql = optionsToMerge.websql;
  argsObj.nodts = optionsToMerge.nodts;
  argsObj.outDir = optionsToMerge.outDir as any;
  argsObj.appBuild = optionsToMerge.appBuild;
  argsObj.copyto = (_.isUndefined(argsObj.copyto) && _.isArray(optionsToMerge.copyto)) ?
    optionsToMerge.copyto : argsObj.copyto;
  argsObj.argsString = argsString;

  // console.log({
  //   argsString,
  //   argsObj
  // })
  if (!_.isNil(argsObj.forClient)) {
    if (_.isString(argsObj.forClient)) {
      argsObj.forClient = [argsObj.forClient];
    }
    if (!!projectCurrent && projectCurrent.isWorkspaceChildProject) {
      argsObj.forClient = (argsObj.forClient as string[]).map(projectParentChildName => {
        if (_.isObject(projectParentChildName)) {
          projectParentChildName = (projectParentChildName as any).name;
        }
        // console.log('projectParentChildName', projectParentChildName)
        const proj = projectCurrent.parent.children.find(c => {
          return c.name === (projectParentChildName as string) || c.location === (projectParentChildName as string);
        }) as Project;
        if (!proj) {
          Helpers.log(`
         projectCurrent.parent.children: ${projectCurrent.parent.children.map(c => c.name)}
         `);
          Helpers.error(`${CLI.chalk.bold('--forClient argument')}`
            + ` : Cannot find module ${CLI.chalk.bold(projectParentChildName)} `
            + `in workspace ${(projectCurrent.parent as Project).genericName}`);
        }
        // Helpers.info(`(${projectCurrent.name}) Build only for client ${chalk.bold(projectParentChildName)}`)
        return proj;
      }) as any;
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
        : await Helpers.cliTool.getProjectFromArgPath(argPath, projectCurrent));

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

  // const result = _.merge(new BuildOptionsClass(), argsObj) as BuildOptions;
  // console.log(result)
  return result;
  //#endregion

}

