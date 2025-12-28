'use client';

import { useEffect, useState } from 'react';
import { getCategoriesAction, createCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/app/admin/actions';
import { ProductCategory } from '@/data/models';

export default function CategoriesAdmin() {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getCategoriesAction();
            setCategories(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await updateCategoryAction(editingCategory.id, formData);
            } else {
                await createCategoryAction(formData);
            }
            setFormData({ name: '', description: '' });
            setEditingCategory(null);
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error('Error saving category:', error);
        }
    };

    const handleEdit = (category: ProductCategory) => {
        setEditingCategory(category);
        setFormData({ name: category.name, description: category.description || '' });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this category?')) {
            try {
                await deleteCategoryAction(id);
                fetchData();
            } catch (error) {
                console.error('Error deleting category:', error);
            }
        }
    };

    const resetForm = () => {
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
        setShowForm(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>Categories</h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage product categories</p>
                </div>
                <button onClick={resetForm} className="admin-btn-primary">
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Category
                    </span>
                </button>
            </div>

            {showForm && (
                <div className="admin-card p-6">
                    <h3 className="admin-section-header mb-4">
                        {editingCategory ? 'Edit Category' : 'New Category'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                Category Name*
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
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="admin-input"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="admin-btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" className="admin-btn-primary">
                                {editingCategory ? 'Update' : 'Create'}
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
                                <th>Category</th>
                                <th>Description</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((category) => (
                                <tr key={category.id}>
                                    <td>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--gradient-metric)', color: 'white' }}>
                                            {category.name}
                                        </span>
                                    </td>
                                    <td>{category.description || '—'}</td>
                                    <td className="text-right">
                                        <button onClick={() => handleEdit(category)} className="text-sm font-medium mr-3" style={{ color: 'var(--primary)' }}>
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(category.id)} className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No categories found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
