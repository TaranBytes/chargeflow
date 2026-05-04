import { useEffect, useState } from 'react'
import { adminApi } from '../api/admin.api.js'
import { GlassCard, PageSection } from '../components/admin/AdminPanelPrimitives.jsx'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const load = async () => setUsers((await adminApi.listUsers()) || [])
  useEffect(() => {
    load()
  }, [])

  return (
    <PageSection title="Users" subtitle="User access and account control">
      <GlassCard className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-white/60">
            <tr>
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/10 text-white/90 hover:bg-white/5">
                <td className="py-2">{u.name}</td>
                <td>{u.email}</td>
                <td className="capitalize">{u.role}</td>
                <td>{u.isBlocked ? 'Blocked' : 'Active'}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="text-right">
                  {u.role !== 'admin' && (
                    <button
                      onClick={async () => {
                        await adminApi.toggleUserBlock(u.id, !u.isBlocked)
                        await load()
                      }}
                      className={`rounded-md px-2.5 py-1.5 text-xs ${
                        u.isBlocked
                          ? 'border border-emerald-300/60 text-emerald-200'
                          : 'border border-rose-300/60 text-rose-200'
                      }`}
                    >
                      {u.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </PageSection>
  )
}
