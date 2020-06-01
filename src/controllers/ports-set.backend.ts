//#region imports
import * as _ from 'lodash';
import { Helpers, Project } from 'tnp-helpers';
import { PortInstance } from '../entites';
import { Models } from 'tnp-models';
import { CLASS } from 'typescript-class-helpers';
//#endregion

@CLASS.NAME('PortsSet')
export class PortsSet {

  private saveCallback: (ports: PortInstance[]) => void;

  //#region private getters
  public get numOfFreePortsAvailable() {
    return PortsSet.count.freePorts(this.ports);
  }

  public get numOfTakenPortsAvailable() {
    return this.numOfAllPortsAvailable - this.numOfFreePortsAvailable;
  }

  public get numOfAllPortsAvailable() {
    return PortsSet.count.allPorts(this.ports);
  }
  //#endregion

  //#region count ports
  public static get count() {
    return {
      freePorts(ports: PortInstance[]) {
        let sum = 0;
        ports.forEach(ins => {
          if (ins.isFree) {
            sum += ins.size;
          }
        })
        return sum;
      },
      allPorts(ports: PortInstance[]) {
        let sum = 0;
        ports.forEach(ins => {
          sum += ins.size;
        })
        return sum;
      }
    }
  }
  //#endregion

  //#region constructor
  private ports: PortInstance[];
  constructor(ports: PortInstance[], saveCallback: (ports: PortInstance[]) => Promise<PortInstance[]>) {
    this.saveCallback = async (portsArgs: PortInstance[]) => {
      portsArgs = generateAllInstaces(portsArgs);
      portsArgs = _.sortBy(portsArgs, (o: PortInstance) => o.sortIndex);
      portsArgs = makeSmaller(portsArgs);
      portsArgs = _.sortBy(portsArgs, (o: PortInstance) => o.sortIndex);
      portsArgs = await Helpers.runSyncOrAsync(saveCallback, portsArgs);
      this.ports = portsArgs.map(c => PortInstance.clone(c));
    }
    this.ports = ports.map(c => PortInstance.clone(c));
  }
  //#endregion

  //#region check if enought ports for project or service
  private checkIfFreePortAmountEnouth(
    projectLocationOrSystemService: Project | Models.system.SystemService,
    howManyPorts: number, ports: PortInstance[]) {

    if (_.isUndefined(howManyPorts) && _.isString(projectLocationOrSystemService)) {

      const proj = Project.From(projectLocationOrSystemService);
      howManyPorts = 1 + (proj.isWorkspace ? proj.children.length : 0)
    }
    return PortsSet.count.freePorts(ports) >= howManyPorts;
  }
  //#endregion

  //#region reserve free ports for
  public async reserveFreePortsFor(projectLocationOrSystemService: Project | Models.system.SystemService,
    howManyPorts: number = 1) {
    return await this._reserveFreePortsFor(projectLocationOrSystemService, howManyPorts, this.ports);
  }

  private async _reserveFreePortsFor(
    projectLocationOrSystemService: Project | Models.system.SystemService,
    howManyPorts: number = 1, ports: PortInstance[],
    allInstaces?: PortInstance[]): Promise<boolean> {

    let saveInstancesToDb = false;

    if (!this.checkIfFreePortAmountEnouth(projectLocationOrSystemService, howManyPorts, ports)) {
      return false;
    }

    const isProject = (projectLocationOrSystemService &&
      _.isString((projectLocationOrSystemService as Project).location));

    if (isProject && howManyPorts > 1) {
      throw `One project can only have on port`
    }

    if (isProject) {
      var project = (projectLocationOrSystemService as Project);
      if (project.isWorkspace || project.isStandaloneProject) {
        saveInstancesToDb = true;
      }
    }


    if (_.isUndefined(allInstaces)) {
      allInstaces = generateAllInstaces(ports);
    }

    // console.log('allInstaces', TnpDB.prepareToSave.ports(allInstaces))
    let countReserved = 0;
    allInstaces.some((ins) => {
      if (countReserved < howManyPorts) {
        if (ins.isFree) {
          ins.reservedFor = projectLocationOrSystemService;
          countReserved++;
        }
        return false;
      }
      return true;
    })

    // console.log('allInstaces', TnpDB.prepareToSave.ports(allInstaces))

    if (isProject && project.children.length > 0) {
      const childrenSuccessReserverPortsArr = [];
      const children = project.children;
      for (let index = 0; index < children.length; index++) {
        const child = children[index];
        if (await this._reserveFreePortsFor(child, undefined, ports, allInstaces)) {
          childrenSuccessReserverPortsArr.push(child);
        }
      }
      const childrenSuccessReserverPorts = (childrenSuccessReserverPortsArr.length === children.length);

      if (!childrenSuccessReserverPorts) {
        return false;
      }
    }

    if (saveInstancesToDb) {
      await Helpers.runSyncOrAsync(this.saveCallback, allInstaces);
    }
    return true;
  }
  //#endregion

  //#region register service on free port
  /**
   * Get port of just registerd service
   */
  public async registerOnFreePort(service: Models.system.SystemService): Promise<number> {
    const allInstaces = generateAllInstaces(this.ports);
    const portInstacnce = allInstaces.find(p => p.isFree);
    if (!portInstacnce) {
      Helpers.error(`There is not free port to register service: ${service}`, false, true);
    }
    portInstacnce.reservedFor = service;
    await Helpers.runSyncOrAsync(this.saveCallback, allInstaces);
    return portInstacnce.id as number;
  }
  //#endregion

  //#region get reserved port instance for service or project
  public async getReserverFor(projectLocationOrSevice: string | Models.system.SystemService): Promise<PortInstance[]> {
    return this.ports.filter(f => _.isEqual(f.reservedFor, projectLocationOrSevice));
  }
  //#endregion

  //#region update port instance
  public async update(port: PortInstance): Promise<boolean> {
    const ins = this.ports.find(f => f.isEqual(port));
    if (!ins) {
      return false;
    }
    _.merge(ins, port);
    await Helpers.runSyncOrAsync(this.saveCallback, this.ports);
    return true;
  }
  //#endregion

  //#region remove port instance
  async remove(port: PortInstance) {
    this.ports = this.ports.filter(f => !f.isEqual(port));
    await Helpers.runSyncOrAsync(this.saveCallback, this.ports);
  }

  private async makeFree(port: PortInstance) {
    this.ports.forEach(f => {
      if (f.isEqual(port)) {
        f.reservedFor = void 0;
      }
    });
    await Helpers.runSyncOrAsync(this.saveCallback, this.ports);
  }

  public async makeFreeAndKill(portIns: PortInstance) {
    for (let j = 0; j < portIns.array.length; j++) {
      const port = portIns.array[j];
      await Helpers.killProcessByPort(port);
    }
    await this.makeFree(portIns);
  }
  //#endregion

  //#region add port instance
  public async add(port: PortInstance): Promise<boolean> {
    if (this.ports.filter(p => p.includes(port)).length > 0) {
      return false;
    }
    this.ports.push(port);

    await Helpers.runSyncOrAsync(this.saveCallback, this.ports);
    return true;
  }
  //#endregion

}


function makeSmaller(allInstacesSingle: PortInstance[]) {
  const ports: PortInstance[] = []

  let currentProjectLocationOrSystemService: Project | Models.system.SystemService = undefined;
  let curretnPortIns: PortInstance;
  allInstacesSingle.forEach(ins => {

    if (!_.isEqual(ins.reservedFor, currentProjectLocationOrSystemService)) {
      currentProjectLocationOrSystemService = ins.reservedFor;
      curretnPortIns = new PortInstance(ins.id, currentProjectLocationOrSystemService)
      ports.push(curretnPortIns)
    } else {
      if (!curretnPortIns) {
        curretnPortIns = new PortInstance(ins.id, currentProjectLocationOrSystemService)
        ports.push(curretnPortIns)
      } else {
        const anotherInsAdded = curretnPortIns.addIdIfPossible(ins.id);

        if (!anotherInsAdded) {
          curretnPortIns = new PortInstance(ins.id, currentProjectLocationOrSystemService);
          ports.push(curretnPortIns)
        }
      }
    }

  })
  return ports;
}


function generateAllInstaces(ports: PortInstance[]) {
  let allInstaces: PortInstance[] = [];
  ports.forEach((ins) => {
    if (ins.size === 1) {
      allInstaces.push(ins);
    } else {
      if (_.isArray(ins.id)) {
        ins.id.forEach(idelem => {
          allInstaces.push(new PortInstance(idelem, ins.reservedFor))
        })
      } else {
        const rangeID = ins.id as Models.other.Range;
        allInstaces = allInstaces.concat(rangeID.array.map(idelem => {
          return new PortInstance(idelem, ins.reservedFor)
        }));
      }
    }
  });
  return allInstaces;
}
