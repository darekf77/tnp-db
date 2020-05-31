//#region @backend
import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';
import { BaseController } from './base-controlller';
import { PortInstance } from '../entites/port-instance';
import { PortsSet } from './ports-set.backend';
import { CLASS } from 'typescript-class-helpers';

@CLASS.NAME('PortsController')
export class PortsController extends BaseController {

  async update() {

  }


  public get manager() {
    return new Promise<PortsSet>(async (resolve) => {
      const instances = await this.crud.getAll(PortInstance);
      const result = new PortsSet(instances as any, async (newPorts) => {
        await this.crud.setBulk(newPorts, PortInstance);
      });
      resolve(result);
    });
  }

  async addExisted() {

    const defaultPorts: PortInstance[] = [

      new PortInstance([80, 443], new Models.system.SystemService('http(s) related')),
      new PortInstance(6000, new Models.system.SystemService('generaly not working... taken by something else')),
      new PortInstance(Models.other.Range.from(4300).to(5999))

    ]

    await this.crud.setBulk(defaultPorts, PortInstance);

  }

}
//#endregion
