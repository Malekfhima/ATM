import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Échec de l'inscription. Veuillez réessayer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Ouvrir votre compte"
      subtitle="Un compte bancaire est créé automatiquement pour vous"
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Nom complet"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          autoComplete="name"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Adresse e-mail"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Mot de passe"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
          helperText="Au moins 6 caractères"
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={submitting}
          sx={{ mb: 2 }}
        >
          {submitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Créer un compte"
          )}
        </Button>

        <Typography variant="body2" align="center" color="text.secondary">
          Déjà un compte ?{" "}
          <Typography
            component={Link}
            to="/login"
            color="primary"
            sx={{ fontWeight: 600, textDecoration: "none" }}
          >
            Se connecter
          </Typography>
        </Typography>
      </Box>
    </AuthShell>
  );
}
