//#region @backend
import * as _ from 'lodash';
import { DBBaseEntity } from './base-entity';
import { CLASS } from 'typescript-class-helpers';
import { Models } from 'tnp-models';

@CLASS.NAME('ProjectInstance')
export class ProjectInstance extends DBBaseEntity {

  public static from(project: Models.other.IProject): ProjectInstance {
    if (!project) {
      return
    }
    return new ProjectInstance(project.location);
  }

  get project() {
    const Project = CLASS.getBy('Project') as any;
    return Project.From(this.locationOfProject);
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
