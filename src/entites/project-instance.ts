//#region @backend
import { DBBaseEntity } from './base-entity';
import { Project } from '../../project';
import { CLASS } from 'typescript-class-helpers';

@CLASS.NAME('ProjectInstance')
export class ProjectInstance extends DBBaseEntity {

  public static from(project: Project): ProjectInstance {
    if (!project) {
      return
    }
    return new ProjectInstance(project.location);
  }

  get project() {
    return Project.From(this.locationOfProject);
  }

  isEqual(anotherInstace: ProjectInstance): boolean {
    return this.locationOfProject === anotherInstace.locationOfProject;
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
