// //#region imports
// //#region isomorphic
// import { BaseProject as Project } from 'tnp-helpers';
// import { CLASS } from 'typescript-class-helpers';
// import { ConfigModels } from 'tnp-config';
// import { Models, DBBaseEntity } from 'tnp-models';
// //#endregion
// import { BuildInstance } from './build-instance';
// //#endregion

// export class IDomainInstance {
//   //#region interface body
//   address: string;
//   sockets?: boolean;
//   secure?: boolean;
//   production?: boolean;
//   //#endregion
// }

// @CLASS.NAME('DomainInstance') // @ts-ignore
// export class DomainInstance extends DBBaseEntity<DomainInstance>
//   implements IDomainInstance {

//   //#region static methods

//   //#region static methods / from
//   public static from(
//     address: string = '',
//     sockets: boolean = true,
//     secure: boolean = false,
//     production: boolean = false,
//   ) {
//     const ins = new DomainInstance({ address, sockets, secure, production });
//     ins.assignProps();
//     return ins;
//   }
//   //#endregion

//   //#endregion

//   //#region fields & getters
//   address = '';
//   sockets = true;
//   secure = false;
//   production = false;
//   declaredIn: {
//     project: Project;
//     environment: ConfigModels.EnvironmentName
//   }[] = [];
//   get activeFor(): BuildInstance {
//     return;
//   }
//   //#endregion

//   //#region api

//   //#region api / prepare instance
//   async prepareInstance(reason?: string): Promise<DBBaseEntity<any>> {
//     this.assignProps();
//     return this;
//   }
//   //#endregion

//   //#region api / ge raw data
//   async getRawData(): Promise<object> {
//     const { activeFor, address, declaredIn } = this;
//     return ({
//       declaredIn: declaredIn.map(d => {
//         return { environment: d.environment, project: d.project.location };
//       }) as any,
//       address,
//       // production,
//       // secure,
//       // sockets
//     });
//   }
//   //#endregion

//   //#region api / assign props
//   assignProps(): void {
//     Object.assign(this, this.data);
//   }
//   //#endregion

//   //#region api / is equal
//   isEqual(anotherInstace: DomainInstance): boolean {
//     return this.address === anotherInstace.address;
//   }
//   //#endregion

//   //#endregion

// }
