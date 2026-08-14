// Mirrors app/auth/permissions.py — used only to show/hide nav items and
// buttons. The backend is the actual authority; this never gates data access
// on its own.
import type { Role } from "./api/types";

export type Permission =
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  | "users.reset_password"
  | "users.assign_role"
  | "users.assign_mc"
  | "mcs.view_all"
  | "mcs.create"
  | "mcs.edit"
  | "mcs.delete"
  | "sources.view_all"
  | "sources.manage"
  | "searches.manage_own"
  | "searches.view_all"
  | "loads.view"
  | "telegram_dialogs.manage"
  | "ratecons.manage";

const ALL_PERMISSIONS: Permission[] = [
  "users.view",
  "users.create",
  "users.edit",
  "users.delete",
  "users.reset_password",
  "users.assign_role",
  "users.assign_mc",
  "mcs.view_all",
  "mcs.create",
  "mcs.edit",
  "mcs.delete",
  "sources.view_all",
  "sources.manage",
  "searches.manage_own",
  "searches.view_all",
  "loads.view",
  "telegram_dialogs.manage",
  "ratecons.manage",
];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ALL_PERMISSIONS,
  manager: [
    "users.view",
    "users.create",
    "users.edit",
    "users.reset_password",
    "users.assign_mc",
    "mcs.view_all",
    "mcs.create",
    "mcs.edit",
    "sources.view_all",
    "searches.manage_own",
    "searches.view_all",
    "loads.view",
    "ratecons.manage",
  ],
  user: ["searches.manage_own", "loads.view"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
