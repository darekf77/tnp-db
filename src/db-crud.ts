//#region @backend
import * as _ from 'lodash';
import { CLASS } from 'typescript-class-helpers'

import { DBBaseEntity } from './entites/base-entity';
import {
  BuildInstance, PortInstance, DomainInstance,
  EntityNames, CommandInstance, ProjectInstance,
  ProcessInstance
} from './entites';
import { Helpers, Project } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { WorkersFactor } from 'background-worker-process';
import { DbDaemonController, IDBCrud } from './daemon/deamon-controller';
import type { TnpDB } from './wrapper-db.backend';
import { DbUpdateProjectEntity } from './daemon/daemon-entity';
import { Morphi } from 'morphi';


export class DbCrud {
  // private static _instance: DbCrud;
  // static Instance(dbFromFile: IDBCrud, dbWrapper: TnpDB) {
  //   if (!DbCrud._instance) {
  //     DbCrud._instance = new DbCrud(dbFromFile, dbWrapper);
  //   }
  //   return DbCrud._instance;
  // }
  readonly worker: DbDaemonController;
  public get db() {
    if (this.worker) {
      return this.worker;
    }
    return this.dbFromFile;
  }
  constructor(private dbFromFile: IDBCrud, private dbWrapper: TnpDB) {

  }

  private async createInstance(classFN, entities, registerdOnPort, startNew: boolean) {
    let res = await WorkersFactor.create<DbDaemonController>(
      classFN,
      entities,
      registerdOnPort,
      {
        killAlreadRegisteredProcess: startNew,
        startWorkerServiceAsChildProcess: startNew,
        disabledRealtime: false,
        preventSameContexts: true,
      }
    );
    if(process.platform === 'win32' && startNew) {
      Helpers.info('Waiting 10 seconds on windows platofrom...');
      Helpers.sleep(10);
    }
    return res;
  }

  public readonly context: Morphi.FrameworkContext;
  async initDeamon(recreate = false) {

    const entities = [DbUpdateProjectEntity];
    const portsManager = await this.dbWrapper.portsManaber;
    await portsManager.registerOnFreePort({
      name: CLASS.getName(DbDaemonController)
    }, {
      actionWhenAssignedPort: async (itWasRegisterd, registerdOnPort) => {

        Helpers.log(`[tnp-db][deamon] ${itWasRegisterd ? 'already' : 'inited'} on port: ${registerdOnPort}`);
        let res = await this.createInstance(
          DbDaemonController,
          entities,
          registerdOnPort,
          (!itWasRegisterd || recreate)
        );

        const isHealtyWorker = await res.instance.$$healty;
        let copyDataToWorker = (!itWasRegisterd || recreate || !isHealtyWorker)

        if (!isHealtyWorker) {
          res.context.destroy();
          res = await this.createInstance(
            DbDaemonController,
            entities,
            registerdOnPort,
            true
          );
        }
        if (copyDataToWorker) {
          const allData = Helpers.readJson(this.dbWrapper.location);
          await res.instance.copyAllToWorker(allData, this.dbWrapper.location).received;
        }

        // @ts-ignore
        this.context = res.context;
        // @ts-ignore
        this.worker = res.instance;
      }
    });

    // process.exit(0)
    // const copyRes = await this.worker.copyAllToWorker(await this.getAll(ProjectInstance)).received;
    // console.log(copyRes.body.text);

  }

  // private listenters = {} as any;
  // onEntityChange(classFN: Function): BehaviorSubject<void> {
  //   return this.listenters[getEntityNameByClassFN(classFN)];
  // }

  async clearDBandReinit(defaultValues: { [entityName: string]: any[]; }) {
    // Object.keys(defaultValues).forEach((entityName) => {
    //   this.listenters[entityName] = new BehaviorSubject(void 0);
    // });

    await this.db.defaults(defaultValues)
      .write()
  }

  async getAll<T extends DBBaseEntity>(classFN: Function): Promise<T[]> {
    const entityName: EntityNames = getEntityNameByClassFN(classFN);
    // console.log(`${CLASS.getName(classFN)} entity name from object`, entityName);
    // process.exit(0)

    await this.db.read();
    var res = (await this.db.get(entityName).value() as T[]);

    if (_.isArray(res)) {

      // (entityName === 'projects') && Helpers.log(`${CLASS.getName(classFN)}, entity ${entityName}, res

      // ${Helpers.stringify(res)}

      // `);

      for (let index = 0; index < res.length; index++) {
        const v = res[index];
        res[index] = (await this.afterRetrive(v, entityName)) as any;
      }
      return res.filter(f => !!f) as any;
    }
    return [];
  }

  async addIfNotExist(entity: DBBaseEntity): Promise<boolean> {
    const classFN = CLASS.getFromObject(entity)
    // console.log(`[addIfNotExist] add if not exist entity: ${CLASS.getNameFromObject(entity)}`)
    const all = await this.getAll(CLASS.getFromObject(entity))
    const indexFounded = all.findIndex(f => f.isEqual(entity))
    if (indexFounded === -1) {

      all.push(entity)
      // console.log(`NOT FOUND - ADD : all.length ${all.length}`,all);
      await this.setBulk(all, classFN);
      return true;
    }
    // console.log(`FOUNDED ????? - NOT ADD`);
    return false;
  }

  async remove(entity: DBBaseEntity): Promise<boolean> {
    const classFN = CLASS.getFromObject(entity)
    const all = await this.getAll(CLASS.getFromObject(entity))
    const filtered = all.filter(f => !f.isEqual(entity))
    if (filtered.length === all.length) {
      return false;
    }
    await this.setBulk(filtered, classFN);
    return true;
  }

  async set(entity: DBBaseEntity) {
    const classFN = CLASS.getFromObject(entity)
    Helpers.log('getting all start')
    const all = await this.getAll(CLASS.getFromObject(entity))
    Helpers.log('getting all done')
    const existed = all.find(f => f.isEqual(entity))
    if (existed) {
      _.merge(existed, entity)
    } else {
      all.push(entity)
    }
    Helpers.log('setting all')
    await this.setBulk(all, classFN);
  }

  async setBulk(entites: DBBaseEntity[], classFN: Function): Promise<boolean> {
    if (!_.isArray(entites)) {
      Helpers.error(`[db-crud] setBuild - this is not array of entities`)
    }
    if (entites.length === 0 && !_.isFunction(classFN)) {
      Helpers.error(`Please provide class function in setBuild(entites, <class function hrere>)`)
    }
    const className = _.isFunction(classFN) ? CLASS.getName(classFN) :
      CLASS.getNameFromObject(_.first(entites))

    const entityName = getEntityNameByClassName(className)
    const json = entites.map(c => this.preprareEntityForSave(c));
    // console.log(`[setBulk] set json for entity ${entityName}`, json)
    await this.db.read();
    await this.db.set(entityName, json).write()
    return true;
  }


  protected async afterRetrive<T = any>(value: any, entityName: EntityNames): Promise<DBBaseEntity> {

    if (entityName === 'builds') {
      const v = value as BuildInstance;
      const ins: BuildInstance = new BuildInstance(v);
      await ins.prepare('afterRetrive')
      return ins as any;
    }
    if (entityName === 'commands') {
      const cmd = value as CommandInstance;
      const c = new CommandInstance(cmd.command, cmd.location, !!cmd.isBuildCommand);
      return c as any;
    }
    if (entityName === 'domains') {
      const v = value as DomainInstance;
      const d: DomainInstance = _.merge(new DomainInstance(), v);
      d.declaredIn = d.declaredIn.map(d => {
        return { environment: d.environment, project: Project.From(d.project as any) }
      })
      return d as any;
    }
    if (entityName === 'ports') {
      const v = value as PortInstance;
      const r = _.merge(new PortInstance(), v) as PortInstance;
      if (_.isString(r.reservedFor)) {
        r.reservedFor = Project.From(r.reservedFor)
      }
      return r as any;
    }

    if (entityName === 'projects') {
      const p = new ProjectInstance(value);
      return p;
      // return fse.existsSync(p.locationOfProject) ? p : void 0;
    }
    if (entityName === 'processes') {
      return _.merge(new ProcessInstance(), value) as PortInstance;
    }
    return value;
  }

  protected preprareEntityForSave(entity: DBBaseEntity) {
    // console.log(`prerpare entity, typeof ${typeof entity}`, entity)
    // console.log('typeof BuildInstance', typeof BuildInstance)

    [BuildInstance, PortInstance, CommandInstance, DomainInstance, ProjectInstance]
      .find(f => {
        if (!f) {
          throw `Undefined instance of class. Probably circural dependency`
        }
        return false;
      })

    if (entity instanceof BuildInstance) {
      const { pid, ppid, project, location, cmd } = entity as BuildInstance;
      return _.cloneDeep({
        pid,
        ppid,
        cmd,
        location: _.isString(location) ? location : (!!project && project.location)
      }) as BuildInstance;
    }

    if (entity instanceof PortInstance) {
      const port = entity as PortInstance;
      return _.cloneDeep({
        id: port.id,
        reservedFor: !!port.reservedFor && _.isString((port.reservedFor as Project).location) ?
          (port.reservedFor as Project).location : port.reservedFor
      } as PortInstance);
    }

    if (entity instanceof CommandInstance) {
      const cmd = entity as CommandInstance;
      const { command, location, isBuildCommand } = cmd;
      return _.cloneDeep({
        command, location, isBuildCommand
      } as CommandInstance);
    }

    if (entity instanceof DomainInstance) {
      const domain = entity as DomainInstance;
      const { activeFor, address, declaredIn } = domain;
      return _.cloneDeep({
        declaredIn: declaredIn.map(d => {
          return { environment: d.environment, project: d.project.location }
        }) as any,
        address,
        // production,
        // secure,
        // sockets
      } as DomainInstance);
    }

    if (entity instanceof ProcessInstance) {
      return entity;
    }

    if (entity instanceof ProjectInstance) {
      return entity.locationOfProject;
    }

    return entity;
  }

}

function getEntityNameByClassFN(classFN: Function) {
  return getEntityNameByClassName(CLASS.getName(classFN))
}

function getEntityNameByClassName(className: string): EntityNames {
  return className === 'Project' ? 'projects' : DBBaseEntity.entityNameFromClassName(className) as EntityNames;
}

//#endregion
