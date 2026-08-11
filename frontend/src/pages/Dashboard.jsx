import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
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
  Stack,
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
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatDate, getInitials } from "../utils/format";
import useCountUp from "../hooks/useCountUp";
import AccountCharts from "../components/AccountCharts";

const TABS = [
  { value: "deposit", label: "Dépôt", icon: <ArrowDownwardIcon fontSize="small" /> },
  { value: "withdraw", label: "Retrait", icon: <ArrowUpwardIcon fontSize="small" /> },
  { value: "transfer", label: "Virement", icon: <SwapHorizIcon fontSize="small" /> },
];

const CONFIRM_LABELS = {
  deposit: "dépôt",
  withdraw: "retrait",
  transfer: "virement",
};

const OP_META = {
  deposit: { icon: <ArrowDownwardIcon fontSize="small" />, color: "#10b981" },
  withdrawal: { icon: <ArrowUpwardIcon fontSize="small" />, color: "#e11d48" },
  transfer: { icon: <SwapHorizIcon fontSize="small" />, color: "#1f5cad" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const stats = useMemo(() => {
    let deposited = 0;
    let withdrawn = 0;
    transactions.forEach((t) => {
      if (t.type === "deposit") deposited += t.amount;
      else withdrawn += t.amount;
    });
    return { deposited, withdrawn, count: transactions.length };
  }, [transactions]);

  const animatedDeposited = useCountUp(stats.deposited, 1100);
  const animatedWithdrawn = useCountUp(stats.withdrawn, 1100);

  const recentOps = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5),
    [transactions]
  );

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
        {/* Carte solde (style carte bancaire) */}
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
              minHeight: 300,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Décor de carte */}
            <Box
              sx={{
                position: "absolute",
                right: -60,
                top: -60,
                width: 220,
                height: 220,
                borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.14)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                right: -20,
                top: -20,
                width: 150,
                height: 150,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.07)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: -50,
                left: -40,
                width: 170,
                height: 170,
                borderRadius: "50%",
                background: "rgba(245, 179, 1, 0.12)",
              }}
            />

            {/* En-tête carte */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, position: "relative" }}>
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

            {/* Solde */}
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mb: 0.5,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.01em",
                position: "relative",
              }}
            >
              {balance === null ? "—" : formatCurrency(animatedBalance)}
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.75, letterSpacing: 1.2, textTransform: "uppercase", mb: 2.5 }}
            >
              Dinar tunisien · TND
            </Typography>

            {/* Numéro de compte */}
            <Chip
              label={user?.account?.accountNumber || "Aucun compte"}
              size="small"
              icon={
                <ContentCopyIcon sx={{ fontSize: 14, color: "white !important" }} />
              }
              onClick={copyAccountNumber}
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                color: "white",
                cursor: "pointer",
                fontFamily: "'Roboto Mono', monospace",
                letterSpacing: 1,
                alignSelf: "flex-start",
              }}
            />

            {/* Actions rapides */}
            <Stack direction="row" spacing={1} sx={{ mt: "auto", pt: 3, position: "relative" }}>
              {TABS.map((t) => (
                <Button
                  key={t.value}
                  size="small"
                  variant="contained"
                  disableElevation
                  startIcon={t.icon}
                  onClick={() => {
                    setTab(t.value);
                    setFormError("");
                  }}
                  sx={{
                    flex: 1,
                    bgcolor: "rgba(255,255,255,0.16)",
                    color: "white",
                    py: 0.8,
                    borderRadius: 2,
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.28)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  {t.label}
                </Button>
              ))}
            </Stack>
          </Paper>

          {/* Utilisateur */}
          <Card
            className="card-lift anim-fade-up anim-delay-1"
            sx={{ mt: 3, p: 2.5, borderRadius: 4 }}
            elevation={0}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  fontWeight: 700,
                  width: 46,
                  height: 46,
                }}
              >
                {getInitials(user?.name)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Connecté en tant que
                </Typography>
                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700 }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user?.email}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Opérations */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            className="anim-fade-up anim-delay-1"
            sx={{ borderRadius: 4, p: { xs: 2, sm: 3 }, height: "100%" }}
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

      {/* Indicateurs */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            className="kpi-card card-lift anim-fade-up anim-delay-1"
            sx={{ p: 2.5, borderRadius: 4, display: "flex", alignItems: "center", gap: 2 }}
          >
            <Box
              className="kpi-icon"
              sx={{
                width: 46,
                height: 46,
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
              }}
            >
              <AddCircleIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" noWrap>
                Total déposé
              </Typography>
              <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(animatedDeposited)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            className="kpi-card card-lift anim-fade-up anim-delay-2"
            sx={{ p: 2.5, borderRadius: 4, display: "flex", alignItems: "center", gap: 2 }}
          >
            <Box
              className="kpi-icon"
              sx={{
                width: 46,
                height: 46,
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(225, 29, 72, 0.10)",
                color: "#e11d48",
              }}
            >
              <RemoveCircleIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" noWrap>
                Total retiré
              </Typography>
              <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(animatedWithdrawn)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            className="kpi-card card-lift anim-fade-up anim-delay-3"
            sx={{ p: 2.5, borderRadius: 4, display: "flex", alignItems: "center", gap: 2 }}
          >
            <Box
              className="kpi-icon"
              sx={{
                width: 46,
                height: 46,
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(31, 92, 173, 0.12)",
                color: "#1f5cad",
              }}
            >
              <ReceiptLongIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" noWrap>
                Opérations
              </Typography>
              <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {stats.count}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Graphiques */}
      <Box sx={{ mt: 4 }}>
        <AccountCharts transactions={transactions} />
      </Box>

      {/* Dernières opérations */}
      {recentOps.length > 0 && (
        <Paper
          elevation={0}
          className="anim-fade-up anim-delay-2"
          sx={{ borderRadius: 4, mt: 4, overflow: "hidden" }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 3,
              py: 2.5,
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <ReceiptLongIcon color="primary" />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Dernières opérations
            </Typography>
            <Button
              size="small"
              onClick={() => navigate("/transactions")}
              endIcon={<ChevronRightIcon />}
            >
              Voir tout
            </Button>
          </Box>
          <Box>
            {recentOps.map((t, i) => (
              <Box
                key={t._id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 3,
                  py: 1.8,
                  borderBottom: i < recentOps.length - 1 ? "1px solid #f1f5f9" : "none",
                  animation: "fadeInUp 0.4s ease both",
                  animationDelay: `${Math.min(i * 60, 300)}ms`,
                  "&:hover": { bgcolor: "#f8fafc" },
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: `${OP_META[t.type]?.color || "#94a3b8"}1a`,
                    color: OP_META[t.type]?.color || "#94a3b8",
                    flexShrink: 0,
                  }}
                >
                  {OP_META[t.type]?.icon}
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                    {t.description || "Opération"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(t.date)}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: t.type === "deposit" ? "#10b981" : "#e11d48",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.type === "deposit" ? "+" : "−"}
                  {formatCurrency(t.amount).replace("-", "")}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

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
