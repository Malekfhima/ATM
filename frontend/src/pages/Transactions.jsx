import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import api from "../api/client";
import { formatCurrency, formatDate } from "../utils/format";

const TYPE_META = {
  deposit: { label: "Dépôt", color: "success" },
  withdrawal: { label: "Retrait", color: "error" },
  transfer: { label: "Virement", color: "primary" },
};

const FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "deposit", label: "Dépôts" },
  { value: "withdrawal", label: "Retraits" },
  { value: "transfer", label: "Virements" },
];

function amountSign(type) {
  return type === "deposit" ? "+" : "−";
}

// Génère un CSV côté client (même format que le serveur : ; et virgules)
const frNumber = (n) => {
  const whole = Math.trunc(n);
  const frac = Math.round(Math.abs(n - whole) * 1000);
  let fracStr = String(frac).padStart(3, "0").replace(/0$/, "");
  return `${whole},${fracStr}`;
};

const toCSV = (list) => {
  const header = "Date;Type;Description;Montant;Solde après";
  const rows = list.map((t) =>
    [
      new Date(t.date).toISOString(),
      `"${TYPE_META[t.type]?.label || t.type}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      frNumber(t.amount),
      frNumber(t.balanceAfter),
    ].join(";")
  );
  return [header, ...rows].join("\n");
};

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/account/transactions?limit=200");
      setTransactions(data);
    } catch (err) {
      setToast({
        open: true,
        message: err.response?.data?.message || "Échec du chargement de l'historique",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (filter !== "all" && t.type !== filter) return false;
      if (!q) return true;
      return (
        (t.description || "").toLowerCase().includes(q) ||
        (TYPE_META[t.type]?.label || "").toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q)
      );
    });
  }, [transactions, search, filter]);

  const closeToast = () => setToast((prev) => ({ ...prev, open: false }));

  const handleExport = async () => {
    setExporting(true);
    try {
      const hasLocalFilter = filter !== "all" || search.trim() !== "";
      if (hasLocalFilter) {
        // Un filtre est actif : on exporte les lignes affichées (côté client)
        downloadBlob(toCSV(filtered), "transactions.csv", "text/csv;charset=utf-8");
      } else {
        // Sinon : export complet via le serveur
        const response = await api.get("/account/transactions/export", {
          responseType: "blob",
        });
        downloadBlob(response.data, "transactions.csv", "text/csv;charset=utf-8");
      }
      setToast({ open: true, message: "CSV exporté avec succès", severity: "success" });
    } catch (err) {
      setToast({
        open: true,
        message: err.response?.data?.message || "Échec de l'export",
        severity: "error",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            Historique des transactions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filtered.length} transaction{filtered.length > 1 ? "s" : ""}
          </Typography>
        </Box>

        <TextField
          placeholder="Rechercher une transaction…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: "100%", sm: 260 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="outlined"
          startIcon={
            exporting ? (
              <CircularProgress size={18} />
            ) : (
              <FileDownloadIcon />
            )
          }
          onClick={handleExport}
          disabled={exporting || filtered.length === 0}
          sx={{ transition: "transform 0.2s ease", "&:hover:not(:disabled)": { transform: "translateY(-2px)" } }}
        >
          Exporter CSV
        </Button>
      </Box>

      {/* Filtres par type */}
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        {FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            clickable
            color={filter === f.value ? "primary" : "default"}
            onClick={() => setFilter(f.value)}
            sx={{
              fontWeight: 600,
              "&:hover": { transform: "translateY(-1px)" },
              transition: "transform 0.15s ease",
            }}
          />
        ))}
      </Stack>

      <Paper
        elevation={0}
        className="anim-fade-up anim-delay-1"
        sx={{ borderRadius: 4, overflow: "hidden" }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
            <ReceiptLongIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1 }} />
            <Typography variant="h6" color="text.secondary">
              {search
                ? "Aucune transaction ne correspond à votre recherche"
                : "Aucune transaction pour le moment"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {search
                ? "Essayez un autre mot-clé."
                : "Faites un dépôt pour commencer."}
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Montant</TableCell>
                  <TableCell align="right">Solde après</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((t, index) => (
                  <TableRow
                    key={t._id}
                    hover
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      animation: "fadeInUp 0.4s ease both",
                      animationDelay: `${Math.min(index * 45, 450)}ms`,
                    }}
                  >
                    <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>
                      {formatDate(t.date)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={TYPE_META[t.type]?.label || t.type}
                        size="small"
                        color={TYPE_META[t.type]?.color || "default"}
                        variant="outlined"
                        sx={{ textTransform: "capitalize", fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>{t.description || "Transaction"}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        color:
                          t.type === "withdrawal" || t.type === "transfer"
                            ? "error.main"
                            : "success.main",
                      }}
                    >
                      {amountSign(t.type)}
                      {formatCurrency(t.amount).replace("-", "")}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {formatCurrency(t.balanceAfter)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={closeToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={closeToast} severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
