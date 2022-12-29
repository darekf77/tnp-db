//#region imports
import { config, ConfigModels } from 'tnp-config';
import { _ } from 'tnp-core';
import { Helpers, Project } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { CLASS } from 'typescript-class-helpers';
//#region @backend
import { buildOptionsFrom } from './build-options-from.backend';
//#endregion
//#endregion

const PropsToOmmitWhenStringify = ['copyto', 'forClient']
@CLASS.NAME('BuildOptions')
export class BuildOptions<PROJECT = Project> implements Models.dev.StartForOptions {

  //#region static

  //#region static / from json
  public static fromJson<PROJECT = Project>(json: Omit<Partial<BuildOptions>, 'alreadyInitedPorjects' | 'copyto' | 'clone' | 'toString'>) {
    const options = _.cloneDeep(json as BuildOptions || {}) as any;
    for (const key in options) {
      if (options.hasOwnProperty(key)) {
        if (_.isObject(options[key])) {
          delete options[key]
        }
      }
    }
    const buildOpt = new BuildOptions();
    return _.merge(buildOpt, options) as BuildOptions<PROJECT>; // TODO
  }
  //#endregion

  //#region static / from
  public static async from(
    argsString: string,
    projectCurrent: Project,
    mainOptions?: Partial<BuildOptions>,
    reason?: string
  ): Promise<BuildOptions> {
    //#region @backendFunc
    return await buildOptionsFrom(argsString, projectCurrent, mainOptions, reason, BuildOptions);
    //#endregion
  }
  //#endregion

  //#endregion

  readonly prod?: boolean;
  readonly outDir?: Models.dev.BuildDir;
  readonly watch?: boolean;
  readonly uglify?: boolean;
  readonly obscure?: boolean;
  readonly websqlAppBuild?: boolean;
  readonly nodts?: boolean;
  readonly watchOnly?: boolean;
  readonly alreadyInitedPorjects?: (Project & PROJECT)[];
  readonly initiator?: (Project & PROJECT);
  readonly skipCopyToSelection?: boolean;
  readonly argsString?: string;
  progressCallback?: (fractionValue: number) => any;
  readonly generateIps?: boolean;
  readonly env?: ConfigModels.EnvironmentName;
  readonly client?: (Project & PROJECT);
  readonly clientArgString?: string;
  readonly recrusive?: boolean;
  readonly skipSmartContainerDistBundleInit?: boolean;

  /**
   * Do not generate backend code
   * usefull for old webpack production build
   */
  readonly genOnlyClientCode?: boolean;
  /**
   * Generate only backend, without browser version
   */
  readonly onlyBackend?: boolean;
  readonly appBuild?: boolean;
  readonly buildForAllClients?: boolean;

  readonly baseHref?: string;
  readonly onlyWatchNoBuild?: boolean;
  readonly copyto?: (Project & PROJECT)[] | string[];
  readonly copytoAll?: boolean;
  /**
   * For isomorphic-lib
   * Specyify build targets as workspace childs projects names
   */
  readonly forClient?: (Project & PROJECT)[] | string[];


  //#region methods
  public setValues(newOptions: Partial<BuildOptions>) {
    _.merge(this, newOptions);
  }

  public toString = () => {
    return JSON.stringify(_.mergeWith({}, _.omit(this, PropsToOmmitWhenStringify)), null, 4);
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
