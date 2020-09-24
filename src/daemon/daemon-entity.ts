import * as _ from 'lodash';
import { Morphi } from 'morphi';
import { Project } from 'tnp-helpers';

@Morphi.Entity({
  className: 'DbUpdateProjectEntity',
  //#region @backend
  createTable: false
  //#endregion
})
export class DbUpdateProjectEntity extends Morphi.Base.Entity {

  /**
   * location of project
   */
  id: string;
  static for(projectOrLocaiton: Project | string) {
    const res = new DbUpdateProjectEntity();
    res.id = _.isString(projectOrLocaiton) ? projectOrLocaiton : projectOrLocaiton.location;
    return res;
  }
}

