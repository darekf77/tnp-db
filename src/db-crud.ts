//#region @backend
import * as _ from 'lodash';

import { CLASS } from 'typescript-class-helpers'

import { Project } from '../project';
import { DBBaseEntity } from './entites/base-entity';
import {
  BuildInstance, PortInstance, DomainInstance,
  EntityNames, CommandInstance, ProjectInstance,
  ProcessInstance
} from './entites';
import { Helpers } from '../helpers';
import { BuildOptions } from '../project/features';


export class DbCrud {


  constructor(private db: any) {

  }

  clearDBandReinit(defaultValues: Object) {
    this.db.defaults(defaultValues)
      .write()
  }

  getAll<T extends DBBaseEntity>(classFN: Function): T[] {
    const entityName: EntityNames = this.getEntityNameByClassFN(classFN);
    // console.log('entity name from object', entityName)
    const res = (this.db.get(entityName).value() as T[])
    // console.log('res', res)
    if (_.isArray(res) && res.length > 0) {
      return res.map(v => this.afterRetrive(v, entityName)).filter(f => !!f) as any;
    }
    return [];
  }

  addIfNotExist(entity: DBBaseEntity): boolean {
    const classFN = CLASS.getFromObject(entity)
    // console.log(`[addIfNotExist] add if not exist entity: ${CLASS.getNameFromObject(entity)}`)
    const all = this.getAll(CLASS.getFromObject(entity))
    const indexFounded = all.findIndex(f => f.isEqual(entity))
    if (indexFounded === -1) {
      all.push(entity)
      this.setBulk(all, classFN);
      return true;
    }
    return false;
  }

  remove(entity: DBBaseEntity): boolean {
    const classFN = CLASS.getFromObject(entity)
    const all = this.getAll(CLASS.getFromObject(entity))
    const filtered = all.filter(f => !f.isEqual(entity))
    if (filtered.length === all.length) {
      return false;
    }
    this.setBulk(filtered, classFN);
    return true;
  }

  set(entity: DBBaseEntity) {
    const classFN = CLASS.getFromObject(entity)

    const all = this.getAll(CLASS.getFromObject(entity))
    const existed = all.find(f => f.isEqual(entity))
    if (existed) {
      _.merge(existed, entity)
    } else {
      all.push(entity)
    }
    this.setBulk(all, classFN);
  }

  setBulk(entites: DBBaseEntity[], classFN: Function): boolean {
    if (!_.isArray(entites)) {
      Helpers.error(`[db-crud] setBuild - this is not array of entities`)
    }
    if (entites.length === 0 && !_.isFunction(classFN)) {
      Helpers.error(`Please provide class function in setBuild(entites, <class function hrere>)`)
    }
    const className = _.isFunction(classFN) ? CLASS.getName(classFN) :
      CLASS.getNameFromObject(_.first(entites))

    const entityName = this.getEntityNameByClassName(className)
    const json = entites.map(c => this.preprareEntityForSave(c));
    // console.log(`[setBulk] set json for entity ${entityName}`, json)
    this.db.set(entityName, json).write()
    return true;
  }

  private getEntityNameByClassFN(classFN: Function) {
    return this.getEntityNameByClassName(CLASS.getName(classFN))
  }

  private getEntityNameByClassName(className: string): EntityNames {
    return className === 'Project' ? 'projects' : DBBaseEntity.entityNameFromClassName(className) as EntityNames;
  }

  private afterRetrive<T=any>(value: any, entityName: EntityNames): DBBaseEntity {
    if (entityName === 'builds') {
      const v = value as BuildInstance;
      const ins: BuildInstance = _.merge(new BuildInstance(), v)
      ins.buildOptions = _.merge(new BuildOptions(), ins.buildOptions)
      return ins as any;
    }
    if (entityName === 'commands') {
      const cmd = value as CommandInstance;
      const c = new CommandInstance(cmd.command, cmd.location);
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
      return p.project ? p : void 0;
    }
    if (entityName === 'processes') {
      return _.merge(new ProcessInstance(), value) as PortInstance;
    }
    return value;
  }

  private preprareEntityForSave(entity: DBBaseEntity) {
    // console.log(`prerpare entity, typeof ${typeof entity}`, entity)
    // console.log('typeof BuildInstance', typeof BuildInstance)

    [BuildInstance, PortInstance, CommandInstance, DomainInstance, ProjectInstance]
      .find(f => {
        if (!f) {
          throw `Undefined instance of class. Propobly circural dependency`
        }
        return false;
      })

    if (entity instanceof BuildInstance) {
      const { pid, project, location, buildOptions, cmd } = entity as BuildInstance;
      return _.cloneDeep({
        buildOptions: _.merge({}, _.omit(buildOptions, BuildOptions.PropsToOmmitWhenStringify)),
        pid,
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
      const { command, location } = cmd;
      return _.cloneDeep({
        command, location
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

//#endregion
