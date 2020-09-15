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
  static for(project: Project) {
    const res = new DbUpdateProjectEntity();
    res.id = project.location;
    return res;
  }
}

