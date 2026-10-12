import type { ProjectEntity } from '../entities/project.entity';
import type { GeoPoint } from '../models/location.model';
import type { PageResult, PageParams } from '../models/page-state.model';

export interface ProjectCreateData {
  projectName: string;
  desc?: string;
  address?: string;
  position?: GeoPoint;
}

export interface ProjectUpdateData {
  projectID: string;
  projectName?: string;
  desc?: string;
  address?: string;
  position?: GeoPoint;
  status?: number;
}

export interface IProjectRepository {
  getList(params: PageParams & { projectName?: string; status?: number }): Promise<PageResult<ProjectEntity>>;
  getOne(projectID: string): Promise<ProjectEntity>;
  create(data: ProjectCreateData): Promise<string>;
  update(data: ProjectUpdateData): Promise<void>;
  delete(projectID: string): Promise<void>;
}
