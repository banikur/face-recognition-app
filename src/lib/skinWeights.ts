/**
 * 6 Kategori CNN (selaras dengan train_colab.ipynb dan cnnSkinClassifier.ts)
 */
export const CNN_LABELS = ['acne', 'blackheads', 'clear_skin', 'dark_spots', 'puffy_eyes', 'wrinkles'] as const;
export type SkinWeightKey = typeof CNN_LABELS[number];

export interface SkinWeights6 {
  w_acne: number;
  w_blackheads: number;
  w_clear_skin: number;
  w_dark_spots: number;
  w_puffy_eyes: number;
  w_wrinkles: number;
}

export interface SkinScores6 {
  acne: number;
  blackheads: number;
  clear_skin: number;
  dark_spots: number;
  puffy_eyes: number;
  wrinkles: number;
}
