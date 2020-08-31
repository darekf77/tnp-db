//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as os from 'os';
import { DbCrud } from '../db-crud';
import { BaseController } from './base-controlller';
import { ProjectInstance } from '../entites';
declare const global: any;
if (!global['ENV']) {
  global['ENV'] = {};
}
const config = global['ENV'].config as any;
import { CLASS } from 'typescript-class-helpers';
import { Project, Helpers } from 'tnp-helpers';

@CLASS.NAME('ProjectsController')
export class ProjectsController extends BaseController {

  async update() {

  }

  private recognized: ProjectInstance[] = []
  async addExisted() {
    Helpers.log(`[db][reinit] adding existed projects`);
    if(global['frameworkName'] === 'firedev') {
      Helpers.log(`[tnp-db] For now dont discover project in tnp db`);
      return;
    }
    await this.discoverProjectsInLocation(path.resolve(path.join(Project.Tnp.location, '..')))
    if (global.testMode) {
      await this.discoverProjectsInLocation(path.resolve(config.pathes.tnp_tests_context), true)
    } else {
      await this.discoverProjectsInLocation(path.resolve(path.join(Project.Tnp.location, '../firedev-projects')))
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
      const proj = projectInstance.project.distribution as any as Project;
      if (proj) {
        // console.log(`ADD STATIC ${proj.location}`)
        await this.addIfNotExists(ProjectInstance.from(proj))
      }
    }

    if (await this.crud.addIfNotExist(projectInstance)) {
      if (_.isArray(projectInstance.project.preview)) {
        await this.addIfNotExists(ProjectInstance.from(projectInstance.project.preview as any as Project))
      }
      if (_.isArray(projectInstance.project.children)) {
        const children = projectInstance.project.children;
        for (let index = 0; index < children.length; index++) {
          const c = children[index];
          await this.addIfNotExists(ProjectInstance.from(c as any as Project))
        }
      }
      await this.addIfNotExists(ProjectInstance.from(projectInstance.project.preview as any as Project))
    }
  }

  async discoverProjectsInLocation(location: string, searchSubfolders = false) {

    if (searchSubfolders) {
      const locations = fse
        .readdirSync(location)
        .map(name => path.join(location, name));

      for (let index = 0; index < locations.length; index++) {
        const subLocation = locations[index];
        await this.discoverProjectsInLocation(subLocation)
      }
      return;
    }

    const projects = fse.readdirSync(location)
      .map(name => path.join(location, name))
      .map(location => {
        // console.log(location)
        return Project.From(location)
      })
      .filter(f => !!f)
      .filter(f => {
        return f.typeIsNot('unknow-npm-project')
      })

    for (let index = 0; index < projects.length; index++) {
      const project = projects[index];
      await this.addIfNotExists(ProjectInstance.from(project))
    }
  }

}
//#endregion
