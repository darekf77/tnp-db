//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';
import { DbCrud } from '../db-crud';
import { BaseController } from './base-controlller';
import { ProjectInstance } from '../entites';
declare const global: any;
if (!global['ENV']) {
  global['ENV'] = {};
}
const config = global['ENV'].config as any;
import { CLASS } from 'typescript-class-helpers';


@CLASS.NAME('ProjectsController')
export class ProjectsController extends BaseController {

  async update() {

  }

  private recognized: ProjectInstance[] = []
  async addExisted() {
    const Project = CLASS.getBy('Project') as any;
    this.discoverProjectsInLocation(path.resolve(path.join(Project.Tnp.location, '..')))
    if (global.testMode) {
      this.discoverProjectsInLocation(path.resolve(config.pathes.tnp_tests_context), true)
    } else {
      this.discoverProjectsInLocation(path.resolve(path.join(Project.Tnp.location, '../firedev-projects')))
    }
  }


  async addIfNotExists(projectInstance: ProjectInstance): Promise<boolean> {

    if (!projectInstance) {
      return;
    }

    if (this.recognized.find(p => p.project.location === projectInstance.project.location)) {
      return;
    }
    this.recognized.push(projectInstance);

    if (projectInstance.project.isWorkspace && !projectInstance.project.isGenerated
      && projectInstance.project.distribution) {
      const proj = projectInstance.project.distribution;
      if (proj) {
        // console.log(`ADD STATIC ${proj.location}`)
        this.addIfNotExists(ProjectInstance.from(proj))
      }
    }

    if (this.crud.addIfNotExist(projectInstance)) {
      if (_.isArray(projectInstance.project.preview)) {
        this.addIfNotExists(ProjectInstance.from(projectInstance.project.preview))
      }
      if (_.isArray(projectInstance.project.children)) {
        projectInstance.project.children.forEach(c => this.addIfNotExists(ProjectInstance.from(c)))
      }
      this.addIfNotExists(ProjectInstance.from(projectInstance.project.preview))
    }
  }

  discoverProjectsInLocation(location: string, searchSubfolders = false) {

    if (searchSubfolders) {
      fse.readdirSync(location)
        .map(name => path.join(location, name))
        .forEach(subLocation => {
          this.discoverProjectsInLocation(subLocation)
        })
      return;
    }

    // this.discoverFrom(Project.Tnp);
    const Project = CLASS.getBy('Project') as any;
    fse.readdirSync(location)
      .map(name => path.join(location, name))
      .map(location => {
        // console.log(location)
        return Project.From(location)
      })
      .filter(f => !!f)
      .filter(f => {
        return f.typeIsNot('unknow-npm-project')
      })
      .forEach(project => {
        this.addIfNotExists(ProjectInstance.from(project))
      })
  }

}
//#endregion
