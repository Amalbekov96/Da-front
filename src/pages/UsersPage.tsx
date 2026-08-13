import { Fragment, useEffect, useState } from "react";
import {
  ApiError,
  assignUserMcs,
  createUser,
  deleteUser,
  listMcs,
  listUsers,
  resetUserPassword,
  updateUser,
} from "../api/client";
import type { Mc, Role, User } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { hasPermission } from "../permissions";

const ROLES: Role[] = ["user", "manager", "admin"];

export function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [mcs, setMcs] = useState<Mc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("user");

  const canAssignRole = me ? hasPermission(me.role, "users.assign_role") : false;
  const canDelete = me ? hasPermission(me.role, "users.delete") : false;
  const canResetPassword = me ? hasPermission(me.role, "users.reset_password") : false;
  const canAssignMc = me ? hasPermission(me.role, "users.assign_mc") : false;

  async function refresh() {
    const [u, m] = await Promise.all([listUsers(), listMcs()]);
    setUsers(u);
    setMcs(m);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load users"));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createUser({ email: newEmail, name: newName || undefined, password: newPassword, role: newRole });
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setNewRole("user");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create user");
    }
  }

  async function handleResetPassword(id: number) {
    const newPass = window.prompt("New password for this user:");
    if (!newPass) return;
    try {
      await resetUserPassword(id, newPass);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reset password");
    }
  }

  async function handleToggleActive(u: User) {
    await updateUser(u.id, { active: !u.active });
    await refresh();
  }

  async function handleRoleChange(u: User, role: Role) {
    await updateUser(u.id, { role });
    await refresh();
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this user? This can't be undone.")) return;
    await deleteUser(id);
    await refresh();
  }

  async function handleToggleMc(u: User, mcId: number) {
    const has = u.mcs.some((m) => m.id === mcId);
    const nextIds = has ? u.mcs.filter((m) => m.id !== mcId).map((m) => m.id) : [...u.mcs.map((m) => m.id), mcId];
    await assignUserMcs(u.id, nextIds);
    await refresh();
  }

  return (
    <div>
      <section className="panel">
        <h2>Add user</h2>
        <form className="inline-form" onSubmit={handleCreate}>
          <input placeholder="Email" type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input
            placeholder="Initial password"
            type="text"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value as Role)} disabled={!canAssignRole}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="submit" className="primary-button">
            Add
          </button>
        </form>
        {error && <div className="alert alert-error">{error}</div>}
      </section>

      <section className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
              <th>MCs</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <Fragment key={u.id}>
                <tr>
                  <td>{u.name ?? "—"}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} disabled={!canAssignRole} onChange={(e) => handleRoleChange(u, e.target.value as Role)}>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button type="button" className="link-button" onClick={() => handleToggleActive(u)}>
                      {u.active ? "active" : "inactive"}
                    </button>
                  </td>
                  <td>{u.mcs.map((m) => m.mc_number).join(", ") || "—"}</td>
                  <td className="row-actions">
                    {canAssignMc && (
                      <button type="button" className="link-button" onClick={() => setEditingId(editingId === u.id ? null : u.id)}>
                        MCs
                      </button>
                    )}
                    {canResetPassword && (
                      <button type="button" className="link-button" onClick={() => handleResetPassword(u.id)}>
                        Reset password
                      </button>
                    )}
                    {canDelete && (
                      <button type="button" className="link-button danger" onClick={() => handleDelete(u.id)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
                {editingId === u.id && (
                  <tr>
                    <td colSpan={6}>
                      <div className="mc-picker">
                        {mcs.map((mc) => (
                          <label key={mc.id} className="source-checkbox">
                            <input
                              type="checkbox"
                              checked={u.mcs.some((m) => m.id === mc.id)}
                              onChange={() => handleToggleMc(u, mc.id)}
                            />
                            {mc.mc_number} {mc.name ? `— ${mc.name}` : ""}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
