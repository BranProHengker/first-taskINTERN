export interface Role {
  id?: number;
  roleName: string;
  roleAccess?: RoleAccess[];
}

export interface RoleAccess {
  id?: number;
  roleId?: number;
  menuId: number;
  akses: number;
}