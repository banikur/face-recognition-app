'use client';

import { useEffect, useState } from 'react';
import {
  getAdminUsersAction,
  createAdminUserAction,
  updateAdminPasswordAction,
  deleteAdminUserAction,
  AdminUser,
} from '@/app/admin/actions';

export default function AccountsAdmin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await getAdminUsersAction();
    setUsers(data);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', confirmPassword: '' });
    setEditingUser(null);
    setError('');
    setSuccess('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    resetForm();
    setEditingUser(user);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    let result;
    if (editingUser) {
      result = await updateAdminPasswordAction(editingUser.id, { password: formData.password });
    } else {
      result = await createAdminUserAction({ email: formData.email, password: formData.password });
    }

    if (result.success) {
      setSuccess(editingUser ? 'Password berhasil diubah' : 'Akun admin berhasil dibuat');
      setShowForm(false);
      resetForm();
      fetchData();
    } else {
      setError(result.error || 'Terjadi kesalahan');
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Hapus akun admin "${user.email}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    const result = await deleteAdminUserAction(user.id);
    if (result.success) {
      setSuccess('Akun admin berhasil dihapus');
      fetchData();
    } else {
      setError(result.error || 'Gagal menghapus akun');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>Master Akun</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Kelola akun administrator sistem</p>
        </div>
        <button onClick={handleOpenCreate} className="admin-btn-primary">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Admin
          </span>
        </button>
      </div>

      {/* Feedback messages */}
      {error && (
        <div className="px-4 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
          {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="admin-card p-6">
          <h3 className="admin-section-header mb-4">
            {editingUser ? `Ubah Password — ${editingUser.email}` : 'Tambah Akun Admin Baru'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingUser && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Email*
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="admin-input"
                  placeholder="admin@example.com"
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  {editingUser ? 'Password Baru*' : 'Password*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={8}
                  className="admin-input"
                  placeholder="Minimal 8 karakter"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Konfirmasi Password*
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  className="admin-input"
                  placeholder="Ulangi password"
                />
              </div>
            </div>
            {error && (
              <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>{error}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="admin-btn-secondary"
              >
                Batal
              </button>
              <button type="submit" className="admin-btn-primary">
                {editingUser ? 'Simpan Password' : 'Buat Akun'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Dibuat</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'var(--gradient-metric)' }}
                      >
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium" style={{ color: 'var(--text-main)' }}>
                        {user.email}
                      </span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {formatDate(user.created_at)}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="text-sm font-medium mr-3"
                      style={{ color: 'var(--primary)' }}
                    >
                      Ubah Password
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-sm font-medium"
                      style={{ color: 'var(--danger)' }}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                    Belum ada akun admin
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Info box */}
      <div
        className="rounded-lg p-4 text-sm flex gap-3"
        style={{ backgroundColor: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}
      >
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div style={{ color: 'var(--text-secondary)' }}>
          <p className="font-medium mb-1" style={{ color: 'var(--text-main)' }}>Catatan Keamanan</p>
          <ul className="space-y-1 text-xs">
            <li>• Password minimal 8 karakter</li>
            <li>• Minimal 1 akun admin harus selalu ada di sistem</li>
            <li>• Gunakan email unik untuk setiap akun admin</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
