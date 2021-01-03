//#region @backend
import { DbCrud } from '../db-crud';

export abstract class BaseController {

  constructor(protected crud: DbCrud) {

  }

  abstract addExisted(): Promise<any>;

  abstract update(): Promise<any>;

}
//#endregion
