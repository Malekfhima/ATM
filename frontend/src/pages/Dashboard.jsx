import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/format";
import useCountUp from "../hooks/useCountUp";
import AccountCharts from "../components/AccountCharts";

const TABS = [
  { value: "deposit", label: "Dépôt", icon: <ArrowDownwardIcon /> },
  { value: "withdraw", label: "Retrait", icon: <ArrowUpwardIcon /> },
  { value: "transfer", label: "Virement", icon: <SwapHorizIcon /> },
];

const CONFIRM_LABELS = {
  deposit: "dépôt",
  withdraw: "retrait",
  transfer: "virement",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const animatedBalance = useCountUp(balance ?? 0, 900);

  const loadBalance = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get("/account/balance");
      setBalance(data.balance);
    } catch (err) {
      setToast({
        open: true,
        message: err.response?.data?.message || "Échec du chargement du solde",
        severity: "error",
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const { data } = await api.get("/account/transactions?limit=100");
      setTransactions(data);
    } catch (err) {
      // L'historique est accessoire sur le tableau de bord : pas de blocage
      console.error("Erreur de chargement de l'historique :", err);
    }
  }, []);

  useEffect(() => {
    loadBalance();
    loadTransactions();
  }, [loadBalance, loadTransactions]);

  const closeToast = () => setToast((prev) => ({ ...prev, open: false }));

  const copyAccountNumber = () => {
    navigator.clipboard?.writeText(user?.account?.accountNumber || "");
    setToast({ open: true, message: "Numéro de compte copié", severity: "success" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setFormError("Veuillez saisir un montant valide supérieur à 0");
      return;
    }

    setSubmitting(true);
    try {
      let endpoint = `/account/${tab}`;
      let payload = { amount: value };
      if (tab === "transfer") {
        if (!recipient.trim()) {
          setFormError("Veuillez saisir le numéro de compte du bénéficiaire");
          setSubmitting(false);
          return;
        }
        payload.recipientAccountNumber = recipient.trim();
      }

      const { data } = await api.post(endpoint, payload);
      setToast({ open: true, message: data.message, severity: "success" });
      setAmount("");
      setRecipient("");
      loadBalance();
      loadTransactions();
    } catch (err) {
      setToast({
        open: true,
        message: err.response?.data?.message || "Opération impossible",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Carte solde */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            className="balance-card card-lift anim-fade-up"
            sx={{
              p: 3,
              borderRadius: 4,
              color: "white",
              background:
                "linear-gradient(135deg, #0a2a55 0%, #0f3d7a 45%, #1f5cad 100%)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                right: -40,
                top: -40,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
              }}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <AccountBalanceWalletIcon />
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Solde actuel
              </Typography>
              <Tooltip title="Rafraîchir">
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => {
                    loadBalance();
                    loadTransactions();
                  }}
                  disabled={refreshing}
                  sx={{ ml: "auto", opacity: 0.9 }}
                  aria-label="Rafraîchir le solde"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
              {balance === null ? "—" : formatCurrency(animatedBalance)}
            </Typography>

            <Chip
              label={user?.account?.accountNumber || "Aucun compte"}
              size="small"
              icon={
                <ContentCopyIcon
                  sx={{ fontSize: 14, color: "white !important" }}
                />
              }
              onClick={copyAccountNumber}
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                color: "white",
                cursor: "pointer",
                fontFamily: "'Roboto Mono', monospace",
                "& .MuiChip-label": { letterSpacing: 0.5 },
              }}
            />
          </Paper>

          <Card
            className="card-lift anim-fade-up anim-delay-1"
            sx={{ mt: 3, p: 3, borderRadius: 4 }}
            elevation={0}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Connecté en tant que
            </Typography>
            <Typography variant="h6">{user?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Card>
        </Grid>

        {/* Opérations */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            className="anim-fade-up anim-delay-1"
            sx={{ borderRadius: 4, p: { xs: 2, sm: 3 } }}
          >
            <Tabs
              value={tab}
              onChange={(_, value) => {
                setTab(value);
                setFormError("");
              }}
              variant="fullWidth"
              sx={{ mb: 3, "& .MuiTab-root": { minHeight: 56 } }}
            >
              {TABS.map((t) => (
                <Tab
                  key={t.value}
                  value={t.value}
                  icon={t.icon}
                  iconPosition="start"
                  label={t.label}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                />
              ))}
            </Tabs>

            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ maxWidth: 420, mx: "auto" }}
            >
              {tab === "transfer" && (
                <TextField
                  fullWidth
                  label="Numéro de compte du bénéficiaire"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                  placeholder="ex. AC3F7KQ2"
                  helperText="Demandez son numéro de compte au bénéficiaire"
                />
              )}

              <TextField
                fullWidth
                label="Montant (TND)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                inputProps={{ min: 0.001, step: 0.001 }}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">DT</InputAdornment>
                  ),
                }}
              />

              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={submitting || balance === null}
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  `Confirmer le ${CONFIRM_LABELS[tab] || tab}`
                )}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Graphiques */}
      <Box sx={{ mt: 4 }}>
        <AccountCharts transactions={transactions} />
      </Box>

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
