import { Role } from "@prisma/client";

export const privilegedRoles: Role[] = [Role.owner, Role.admin, Role.noc];

export function canEdit(role?: Role | null) {
  return role ? privilegedRoles.includes(role) : false;
}
