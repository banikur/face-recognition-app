'use client';

import { useEffect, useState } from 'react';
import { getBrandsAction, createBrandAction, updateBrandAction, deleteBrandAction } from '@/app/admin/actions';
import { Brand } from '@/data/models';

export default function BrandsAdmin() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [formData, setFormData] = useState({ name: '', logo_url: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getBrandsAction();
            setBrands(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingBrand) {
                await updateBrandAction(editingBrand.id, formData);
            } else {
                await createBrandAction(formData);
            }
            setFormData({ name: '', logo_url: '' });
            setEditingBrand(null);
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error('Error saving brand:', error);
        }
    };

    const handleEdit = (brand: Brand) => {
        setEditingBrand(brand);
        setFormData({ name: brand.name, logo_url: brand.logo_url || '' });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this brand?')) {
            try {
                await deleteBrandAction(id);
                fetchData();
            } catch (error) {
                console.error('Error deleting brand:', error);
            }
        }
    };

    const resetForm = () => {
        setEditingBrand(null);
        setFormData({ name: '', logo_url: '' });
        setShowForm(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>Brands</h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage product brands</p>
                </div>
                <button onClick={resetForm} className="admin-btn-primary">
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Brand
                    </span>
                </button>
            </div>

            {showForm && (
                <div className="admin-card p-6">
                    <h3 className="admin-section-header mb-4">
                        {editingBrand ? 'Edit Brand' : 'New Brand'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                    Brand Name*
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="admin-input"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                    Logo URL
                                </label>
                                <input
                                    type="text"
                                    name="logo_url"
                                    value={formData.logo_url}
                                    onChange={handleInputChange}
                                    className="admin-input"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="admin-btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" className="admin-btn-primary">
                                {editingBrand ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="admin-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Brand Name</th>
                                <th>Logo</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {brands.map((brand) => (
                                <tr key={brand.id}>
                                    <td>
                                        <span className="font-medium" style={{ color: 'var(--text-main)' }}>{brand.name}</span>
                                    </td>
                                    <td>
                                        {brand.logo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={brand.logo_url} alt={brand.name} className="w-8 h-8 rounded object-cover" />
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        <button onClick={() => handleEdit(brand)} className="text-sm font-medium mr-3" style={{ color: 'var(--primary)' }}>
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(brand.id)} className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {brands.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No brands found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
