// src/components/Charts/chartSetup.js
// Chart.js v4 is tree-shakeable and requires every element/scale/plugin
// you use to be registered once. Centralized here and imported (for its
// side effect) by Dashboard.jsx before any chart renders.

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Chart.js draws in canvas, so it can't read our CSS custom properties
// directly — resolve them once here and reuse across every chart.
export function getThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    accent: styles.getPropertyValue('--accent').trim() || '#3b82f6',
    success: styles.getPropertyValue('--success').trim() || '#22c55e',
    warning: styles.getPropertyValue('--warning').trim() || '#f59e0b',
    error: styles.getPropertyValue('--error').trim() || '#ef4444',
    textPrimary: styles.getPropertyValue('--text-primary').trim() || '#f1f5f9',
    textSecondary: styles.getPropertyValue('--text-secondary').trim() || '#94a3b8',
    border: styles.getPropertyValue('--border').trim() || '#2d3140',
    bgCard: styles.getPropertyValue('--bg-card').trim() || '#21242f',
  };
}

export const CHART_PALETTE = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa', '#f472b6'];
