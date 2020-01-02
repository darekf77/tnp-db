//#region @backend
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { BaseController } from './base-controlller';
import { PortInstance } from '../entites/port-instance';
import { PortsSet } from './ports-set';
import { CLASS } from 'typescript-class-helpers';

@CLASS.NAME('PortsController')
export class PortsController extends BaseController {

  async update() {

  }


  public get manager() {
    return new PortsSet(this.crud.getAll(PortInstance), (newPorts) => {
      this.crud.setBulk(newPorts, PortInstance);
    });
  }

  async addExisted() {

    const defaultPorts: PortInstance[] = [

      new PortInstance([80, 443], new Models.system.SystemService('http(s) related')),
      new PortInstance(Models.other.Range.from(4000).to(6000))

    ]

    this.crud.setBulk(defaultPorts, PortInstance);

  }

}
//#endregion
