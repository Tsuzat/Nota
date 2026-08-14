interface WorkspaceBase {
    id: string;
    icon: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface LocalWorkspace extends WorkspaceBase {};
interface CloudWorkspace extends WorkspaceBase { owner: string}

type Workspace = LocalWorkspace | CloudWorkspace;
    

export interface ILocalWorkspaces {
  readonly workspaces: LocalWorkspace[]
  fetch(): Promise<void>
  insert(input: CreateLocalWorkspace): Promise<void>
  update(input: UpdateLoacalWorkspace): Promise<void>
  delete(id: string): Promise<void>
}