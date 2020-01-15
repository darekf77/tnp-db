//#region @backend
import * as low from 'lowdb';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as FileSync from 'lowdb/adapters/FileSync'

import {
  ProjectsController,
  DomainsController,
  BuildsController,
  PortsController,
  CommandsController,
  ProcessController
} from './controllers';
import { Helpers } from 'tnp-helpers';
import { DBTransaction } from './db-transactions';
import { DbCrud } from './db-crud';
import { BuildInstance, CommandInstance, ProjectInstance, ProcessInstance } from './entites';
import { CLASS } from 'typescript-class-helpers';
import { Models } from 'tnp-models';
declare const global: any;
declare const ENV: any;
const config = ENV.config as any;
export { BuildInstance, CommandInstance, ProjectInstance, ProcessInstance } from './entites';

export class TnpDB {

  private __projectsCtrl: ProjectsController;
  private __domainsCtrl: DomainsController;
  private __buildsCtrl: BuildsController;
  private __portsCtrl: PortsController;
  private __commandsCtrl: CommandsController;
  private __processCtrl: ProcessController;


  private static _instance: TnpDB;
  private static async instance(location) {
    if (!this._instance) {

      this._instance = new TnpDB(location)
      await this._instance.init(!fse.existsSync(location))
    }
    return this._instance;
  }
  public static Instance(dbLocation: string) {
    return this.instance(dbLocation)
  }

  public static get InstanceSync() {
    if (!this._instance) {
      Helpers.error(`Please use (await TnpDB.Instance) here`);
    }
    return this._instance;
  }

  private _adapter;
  private db;
  private crud: DbCrud;
  public transaction: DBTransaction;


  public async init(recreate = true) {
    Helpers.log('[db] recreate db instance');
    if (recreate) {
      Helpers.writeFile(this.location, '');
    }
    this._adapter = new FileSync(this.location);
    this.db = low(this._adapter)
    this.crud = new DbCrud(this.db);
    Helpers.log('[db] Writed default values');
    this.__projectsCtrl = new ProjectsController(this.crud);
    this.__domainsCtrl = new DomainsController(this.crud);
    this.__buildsCtrl = new BuildsController(this.crud);
    this.__portsCtrl = new PortsController(this.crud);
    this.__commandsCtrl = new CommandsController(this.crud)
    this.__processCtrl = new ProcessController(this.crud);

    this.transaction = new DBTransaction(
      this.crud,
      this.__projectsCtrl,
      this.__domainsCtrl,
      this.__buildsCtrl,
      this.__portsCtrl,
      this.__commandsCtrl,
      this.__processCtrl
    );


    Helpers.log('[db] controllers inited');

    if (recreate) {
      Helpers.log('[db] reinit transacton started');
      Helpers.log(`REMOVE FILE ${config.pathes.tmp_transaction_pid_txt}`)
      Helpers.removeFileIfExists(config.pathes.tmp_transaction_pid_txt);
      await this.transaction.reinitDB();
      Helpers.log('[db] reinit transacton finish');
    }
  }

  public async runCommand(cmd: CommandInstance) {
    await this.__commandsCtrl.runCommand(cmd)

  }

  distBuildFoundedFor(project: Models.other.IProject) {
    return this.__buildsCtrl.distBuildFoundedFor(project)
  }

  appBuildFoundedFor(project: Models.other.IProject) {
    return this.__buildsCtrl.appBuildFoundedFor(project)
  }

  public getProjects(): ProjectInstance[] {
    return this.crud.getAll(ProjectInstance)
  }

  public getBuilds(): BuildInstance[] {
    return this.crud.getAll(BuildInstance);
  }

  resetProceses() {
    this.__processCtrl.resetProcessess()
  }

  public getProceses(): ProcessInstance[] {
    return this.crud.getAll(ProcessInstance);
  }

  public getCommands(): CommandInstance[] {
    return this.crud.getAll(CommandInstance);
  }

  constructor(private location: string) {
  }

  lastCommandFrom(location: string, buildCommand = false) {
    return this.__commandsCtrl.lastCommandFrom(location, buildCommand)
  }


  public get checkIf() {
    const self = this;
    return {
      get allowed() {
        return {
          toRunBuild(project: Models.other.IProject, options: Models.dev.IBuildOptions) {

          },
          removeTnpBundleFolder(project: Models.other.IProject) {
            let allowed = true;
            const p = project.isWorkspaceChildProject ? project.parent : project;
            if (p.isWorkspace) {

              const builds = self.crud.getAll(BuildInstance) as BuildInstance[];

              builds.some(b => {
                let proj = p.children.find(c => c.location === b.project.location)
                if (!!proj) {
                  // console.log(`PROCESS WORKSPACE FOUNDED: ${proj.name},
                  //    NOT ALLOWED TO REMOVE TNP BUNDLE`, b.buildOptions)
                  allowed = false;
                  return true;
                }

                return false;
              })
            }
            return allowed;
          },
          toWatchWorkspace(workspaceChild: Models.other.IProject) {
            let allowed = true;
            const p = workspaceChild.isWorkspaceChildProject ? workspaceChild.parent : workspaceChild;
            if (p.isWorkspace) {
              const builds = self.crud.getAll(BuildInstance) as BuildInstance[];
              builds.find(b => {
                if (p.children.filter(c => c.location === b.project.location)) {
                  allowed = false;
                  return true;
                }
                return false;
              })
            }
            return allowed;
          }

        }
      }
    }
  }
}



//#endregion
