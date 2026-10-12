import { ProjectRepositoryImpl } from '../data/repositories/project.repository.impl';
import type { ProjectEntity } from '../domain/entities/project.entity';
import type { IProjectRepository, ProjectCreateData, ProjectUpdateData } from '../domain/interfaces/project.repository';
import type { PageResult } from '../domain/models/page-state.model';

export class ProjectService {
  constructor(private readonly projectRepo: IProjectRepository = new ProjectRepositoryImpl()) {}

  async getList(page: number, size: number, projectName?: string, status?: number): Promise<PageResult<ProjectEntity>> {
    return this.projectRepo.getList({ page, size, projectName, status });
  }

  async getOne(projectID: string): Promise<ProjectEntity> {
    return this.projectRepo.getOne(projectID);
  }

  async create(data: ProjectCreateData): Promise<string> {
    return this.projectRepo.create(data);
  }

  async update(data: ProjectUpdateData): Promise<void> {
    return this.projectRepo.update(data);
  }

  async delete(projectID: string): Promise<void> {
    return this.projectRepo.delete(projectID);
  }
}

export const projectService = new ProjectService();
