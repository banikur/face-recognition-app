'use client';

import { useEffect, useState } from 'react';

interface TrainingInfo {
  model: { labels: string[]; path: string; loaded: boolean };
  training: { image_size: number; epochs: number; learning_rate: number; labels: string[] };
  dataset: { categories: Record<string, number>; total_images: number };
}

export default function TrainingInfoCard() {
  const [info, setInfo] = useState<TrainingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/training-info')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setInfo(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-card p-5">
        <h3 className="admin-section-header mb-4">Informasi Data Training (CNN)</h3>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--primary)' }} />
          Memuat...
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="admin-card p-5">
        <h3 className="admin-section-header mb-4">Informasi Data Training (CNN)</h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Tidak dapat memuat informasi training</p>
      </div>
    );
  }

  return (
    <div className="admin-card p-5">
      <h3 className="admin-section-header mb-4">Informasi Data Training (CNN)</h3>
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-medium mb-1" style={{ color: 'var(--text-main)' }}>Model</p>
          <ul className="space-y-1 pl-2" style={{ color: 'var(--text-secondary)' }}>
            <li>Labels: {info.model.labels.join(', ')}</li>
            <li>Path: {info.model.path}</li>
            <li>Status: {info.model.loaded ? (
              <span style={{ color: 'var(--success)' }}>Loaded</span>
            ) : (
              <span style={{ color: 'var(--warning)' }}>Not found</span>
            )}</li>
          </ul>
        </div>
        <div>
          <p className="font-medium mb-1" style={{ color: 'var(--text-main)' }}>Training Config</p>
          <ul className="space-y-1 pl-2" style={{ color: 'var(--text-secondary)' }}>
            <li>Image size: {info.training.image_size}×{info.training.image_size}</li>
            <li>Epochs: {info.training.epochs}</li>
            <li>Learning rate: {info.training.learning_rate}</li>
            <li>Validation split: 20%</li>
          </ul>
        </div>
        <div>
          <p className="font-medium mb-1" style={{ color: 'var(--text-main)' }}>Dataset</p>
          <ul className="space-y-1 pl-2" style={{ color: 'var(--text-secondary)' }}>
            <li>Total images: {info.dataset.total_images}</li>
            {Object.entries(info.dataset.categories).length > 0 && (
              <li>
                Per kategori: {Object.entries(info.dataset.categories)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ')}
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
