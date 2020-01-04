//#region @backend
import { Models } from 'tnp-models';
import { BuildInstance } from './build-instance';
import { DBBaseEntity } from './base-entity';
import { CLASS } from 'typescript-class-helpers';


export class IDomainInstance {
  address: string;
  // sockets: boolean;
  // secure: boolean;
  // production: boolean;
}

@CLASS.NAME('DomainInstance')
export class DomainInstance extends DBBaseEntity implements IDomainInstance {
  isEqual(anotherInstace: DomainInstance): boolean {
    return this.address === anotherInstace.address;
  }
  constructor(
    public address: string = ''
    // sockets: boolean = true;
    // secure: boolean = false;
    // production: boolean = false;

  ) {
    super()
  }


  declaredIn: {
    project: Models.other.IProject;
    environment: Models.env.EnvironmentName
  }[] = [];
  get activeFor(): BuildInstance {
    return
  }
}
//#endregion
