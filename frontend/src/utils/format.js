// Montants en dinars tunisiens (TND) : 2 à 3 décimales (millimes)
export const formatCurrency = (value) =>
  new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(value || 0);

export const formatDate = (value) =>
  new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
