'use client';

import { useEffect, useState } from 'react';
import { getRecommendationsAction, createRecommendationAction, updateRecommendationAction, deleteRecommendationAction } from '@/app/admin/actions';
import { Recommendation } from '@/data/models';

export default function RecommendationsAdmin() {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRec, setEditingRec] = useState<Recommendation | null>(null);
    const [formData, setFormData] = useState({
        condition: '',
        title: '',
        description: '',
        tips: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getRecommendationsAction();
            setRecommendations(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Convert tips to JSON array
            const tipsArray = formData.tips.split('\n').filter(t => t.trim());
            const tipsJson = JSON.stringify(tipsArray);

            const data = {
                condition: formData.condition,
                title: formData.title,
                description: formData.description,
                tips: tipsJson
            };

            if (editingRec) {
                await updateRecommendationAction(editingRec.id, data);
            } else {
                await createRecommendationAction(data);
            }
            setFormData({ condition: '', title: '', description: '', tips: '' });
            setEditingRec(null);
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error('Error saving recommendation:', error);
        }
    };

    const handleEdit = (rec: Recommendation) => {
        setEditingRec(rec);
        // Parse tips JSON to textarea format
        let tipsText = '';
        if (rec.tips) {
            try {
                const tipsArray = JSON.parse(rec.tips);
                tipsText = tipsArray.join('\n');
            } catch {
                tipsText = rec.tips;
            }
        }
        setFormData({
            condition: rec.condition,
            title: rec.title,
            description: rec.description || '',
            tips: tipsText
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this recommendation?')) {
            try {
                await deleteRecommendationAction(id);
                fetchData();
            } catch (error) {
                console.error('Error deleting recommendation:', error);
            }
        }
    };

    const resetForm = () => {
        setEditingRec(null);
        setFormData({ condition: '', title: '', description: '', tips: '' });
        setShowForm(true);
    };

    const getConditionBadge = (condition: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            oily: { bg: '#FEF3C7', text: '#92400E' },
            dry: { bg: '#DBEAFE', text: '#1E40AF' },
            acne: { bg: '#FEE2E2', text: '#991B1B' },
            normal: { bg: '#D1FAE5', text: '#065F46' },
        };
        return colors[condition] || { bg: '#F3F4F6', text: '#374151' };
    };

    const parseTips = (tips: string | null): string[] => {
        if (!tips) return [];
        try {
            return JSON.parse(tips);
        } catch {
            return [tips];
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>Recommendations</h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Tips and advice per skin condition</p>
                </div>
                <button onClick={resetForm} className="admin-btn-primary">
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Recommendation
                    </span>
                </button>
            </div>

            {showForm && (
                <div className="admin-card p-6">
                    <h3 className="admin-section-header mb-4">
                        {editingRec ? 'Edit Recommendation' : 'New Recommendation'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                    Condition*
                                </label>
                                <select
                                    name="condition"
                                    value={formData.condition}
                                    onChange={handleInputChange}
                                    required
                                    className="admin-input"
                                >
                                    <option value="">Select condition</option>
                                    <option value="oily">Oily</option>
                                    <option value="dry">Dry</option>
                                    <option value="normal">Normal</option>
                                    <option value="acne">Acne</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                    Title*
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    className="admin-input"
                                    placeholder="e.g., Kulit Berminyak"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                Description
                            </label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="admin-input"
                                placeholder="Short description of this condition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                                Tips (one per line)
                            </label>
                            <textarea
                                name="tips"
                                value={formData.tips}
                                onChange={handleInputChange}
                                rows={4}
                                className="admin-input"
                                placeholder="Enter tips, one per line..."
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="admin-btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" className="admin-btn-primary">
                                {editingRec ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-2 flex items-center justify-center py-12">
                        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                    </div>
                ) : recommendations.length === 0 ? (
                    <div className="col-span-2 admin-card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                        No recommendations found
                    </div>
                ) : (
                    recommendations.map((rec) => {
                        const badge = getConditionBadge(rec.condition);
                        const tips = parseTips(rec.tips);
                        return (
                            <div key={rec.id} className="admin-card p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span
                                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mb-2"
                                            style={{ backgroundColor: badge.bg, color: badge.text }}
                                        >
                                            {rec.condition}
                                        </span>
                                        <h3 className="font-semibold" style={{ color: 'var(--text-main)' }}>{rec.title}</h3>
                                        {rec.description && (
                                            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{rec.description}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(rec)} className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(rec.id)} className="text-xs font-medium" style={{ color: 'var(--danger)' }}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                {tips.length > 0 && (
                                    <ul className="space-y-1.5 mt-3">
                                        {tips.map((tip, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
