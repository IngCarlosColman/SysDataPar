// src/utils/formatters.js

/**
 * Formatea un número como moneda, con separador de miles y símbolo de Guaraníes (Gs.).
 * @param {number} value El número a formatear.
 * @returns {string} El valor formateado como una cadena de texto.
 */
export function formatCurrency(value) {
  if (value === null || value === undefined) {
    return 'PYG 0';
  }

  // Si el valor viene como string, lo parseamos a number
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  // Usar la API de internacionalización para un formato robusto
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0, // Sin decimales para Guaraníes
  }).format(numericValue);
}

