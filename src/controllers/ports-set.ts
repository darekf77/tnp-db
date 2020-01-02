//#region @backend
import * as _ from 'lodash';
import { Helpers } from 'tnp-helpers';
import { PortInstance } from '../entites';
import { Project } from '../../project';
import { Models } from 'tnp-models';
import { CLASS } from 'typescript-class-helpers';


@CLASS.NAME('PortsSet')
export class PortsSet {

  private ports: PortInstance[];
  private saveCallback: (ports: PortInstance[]) => void;
  constructor(ports: PortInstance[], saveCallback?: (ports: PortInstance[]) => void) {
    if (_.isFunction(saveCallback)) {
      this.saveCallback = saveCallback;
    } else {
      this.saveCallback = () => { }
    }
    this.ports = _.cloneDeep(ports).map(c => _.merge(new PortInstance(), c));
  }

  public get _ports() {
    return _.cloneDeep(this.ports).map(c => _.merge(new PortInstance(), c));
  }

  private reorder() {
    this.ports = _.sortBy(this.ports, (o: PortInstance) => o.sortIndex)
  }

  private makeSmaller(allInstacesSingle: PortInstance[]) {
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

  get numOfFreePortsAvailable() {
    return PortsSet.count.freePorts(this.ports);
  }

  get numOfTakenPortsAvailable() {
    return this.numOfAllPortsAvailable - this.numOfFreePortsAvailable;
  }


  get numOfAllPortsAvailable() {
    return PortsSet.count.allPorts(this.ports);
  }

  checkIfFreePortAmountEnouth(
    projectLocationOrSystemService: Project | Models.system.SystemService,
    howManyPorts: number, ports: PortInstance[]) {

    if (_.isUndefined(howManyPorts) && _.isString(projectLocationOrSystemService)) {
      const project = Project.From(projectLocationOrSystemService);
      howManyPorts = 1 + (project.isWorkspace ? project.children.length : 0)
    }
    let sum = 0;
    ports.forEach(ins => {
      if (ins.isFree) {
        sum += ins.size;
      }
    })
    return PortsSet.count.freePorts(ports) >= howManyPorts;
  }

  private generateAllInstaces(ports: PortInstance[]) {
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

  reserveFreePortsFor(projectLocationOrSystemService: Project | Models.system.SystemService,
    howManyPorts: number = 1) {
    return this._reserveFreePortsFor(projectLocationOrSystemService, howManyPorts, this.ports);
  }

  private _reserveFreePortsFor(
    projectLocationOrSystemService: Project | Models.system.SystemService,
    howManyPorts: number = 1, ports: PortInstance[],
    allInstaces?: PortInstance[]): boolean {

    let saveInstancesToDb = false;

    if (!this.checkIfFreePortAmountEnouth(projectLocationOrSystemService, howManyPorts, ports)) {
      return false;
    }

    const isProject = (projectLocationOrSystemService && _.isString((projectLocationOrSystemService as Project).location));

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
      allInstaces = this.generateAllInstaces(ports);
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
      const childrenSuccessReserverPorts = project.children.filter(child => {
        return this._reserveFreePortsFor(child, undefined, ports, allInstaces)
      }).length === project.children.length;
      if (!childrenSuccessReserverPorts) {
        return false;
      }
    }

    if (saveInstancesToDb) {

      // console.log('allInstaces', TnpDB.prepareToSave.ports(allInstaces))
      const ports = this.makeSmaller(allInstaces);
      // console.log('ports', TnpDB.prepareToSave.ports(ports))

      this.ports = ports;
      this.saveCallback(this.ports)
    }
    return true;
  }

  getReserverFor(projectLocationOrSevice: string | Models.system.SystemService): PortInstance[] {
    return this.ports.filter(f => _.isEqual(f.reservedFor, projectLocationOrSevice));
  }

  update(port: PortInstance): boolean {
    const ins = this.ports.find(f => f.isEqual(port));
    if (!ins) {
      return false;
    }
    _.merge(ins, port);
    this.saveCallback(this.ports)
    return true;
  }

  remove(port: PortInstance) {
    this.ports = this.ports.filter(f => !f.isEqual(port));
    this.saveCallback(this.ports)
  }

  add(port: PortInstance): boolean {
    if (this.ports.filter(p => p.includes(port)).length > 0) {
      return false;
    }
    this.ports.push(port)
    this.reorder()
    this.saveCallback(this.ports)
    return true;
  }

}

//#endregion
