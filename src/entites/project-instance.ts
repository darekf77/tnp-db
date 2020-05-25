//#region @backend
import * as _ from 'lodash';
import { DBBaseEntity } from './base-entity';
import { CLASS } from 'typescript-class-helpers';
import { Models } from 'tnp-models';
import { Project } from 'tnp-helpers';

@CLASS.NAME('ProjectInstance')
export class ProjectInstance extends DBBaseEntity {

  public static from(project: Project): ProjectInstance {
    if (!project) {
      return
    }
    return new ProjectInstance(project.location);
  }

  get project() {
    return Project.From<Project>(this.locationOfProject);
  }

  isEqual(anotherInstace: ProjectInstance): boolean {
      return _.isString(this.locationOfProject)
      && _.isString(anotherInstace.locationOfProject)
      && (this.locationOfProject === anotherInstace.locationOfProject)
  }

  hasEqualMetainfo(anotherInstace: ProjectInstance) {

  }

  constructor(
    public locationOfProject?: string
  ) {
    super()
  }

}
//#endregion
