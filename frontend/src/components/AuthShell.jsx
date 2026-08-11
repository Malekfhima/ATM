import { Box, Card, Chip, Stack, Typography } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SecurityIcon from "@mui/icons-material/Security";
import BoltIcon from "@mui/icons-material/Bolt";
import QueryStatsIcon from "@mui/icons-material/QueryStats";

const FEATURES = [
  {
    icon: <SecurityIcon fontSize="small" />,
    title: "Sécurisé",
    text: "Connexion par jeton JWT et mots de passe chiffrés",
  },
  {
    icon: <BoltIcon fontSize="small" />,
    title: "En temps réel",
    text: "Dépôts, retraits et virements instantanés",
  },
  {
    icon: <QueryStatsIcon fontSize="small" />,
    title: "Pilotage clair",
    text: "Historique détaillé et courbes de votre solde",
  },
];

export default function AuthShell({ title, subtitle, children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        background: "#f1f5f9",
      }}
    >
      {/* Panneau de marque (masqué sur mobile) */}
      <Box
        sx={{
          flex: "1 1 50%",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          p: { md: 6, lg: 8 },
          color: "white",
          background:
            "linear-gradient(135deg, #0a2a55 0%, #0f3d7a 55%, #1f5cad 100%)",
        }}
      >
        {/* Décor */}
        <Box
          sx={{
            position: "absolute",
            right: -120,
            top: -120,
            width: 360,
            height: 360,
            borderRadius: "50%",
            border: "60px solid rgba(255,255,255,0.06)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            left: -80,
            bottom: -80,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            right: 60,
            bottom: 90,
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: "rgba(245, 179, 1, 0.25)",
            filter: "blur(6px)",
          }}
        />

        <Box className="anim-fade-up" sx={{ position: "relative", maxWidth: 480 }}>
          <Chip
            icon={<AccountBalanceIcon sx={{ fontSize: 18, color: "#f5b301" }} />}
            label="Ma Banque"
            sx={{
              bgcolor: "rgba(255,255,255,0.12)",
              color: "white",
              mb: 3,
              fontWeight: 700,
              "& .MuiChip-label": { fontSize: 14 },
            }}
          />
          <Typography variant="h3" sx={{ mb: 2, lineHeight: 1.15 }}>
            Votre argent,<br />en toute simplicité.
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "rgba(255,255,255,0.75)", mb: 5, maxWidth: 420 }}>
            Gérez votre solde, effectuez des virements et suivez vos opérations
            depuis un espace bancaire moderne et sécurisé.
          </Typography>

          <Stack spacing={2.5}>
            {FEATURES.map((f, i) => (
              <Box
                key={f.title}
                className={`anim-fade-up anim-delay-${i + 1}`}
                sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(255,255,255,0.12)",
                    color: "#f5b301",
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ lineHeight: 1.2 }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.65)" }}>
                    {f.text}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Formulaire */}
      <Box
        className="anim-fade-in"
        sx={{
          flex: "1 1 50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 4 },
          background:
            "radial-gradient(1200px 600px at 80% 0%, #e3edf9 0%, #f1f5f9 45%, #f8fafc 100%)",
        }}
      >
        <Card
          elevation={4}
          className="anim-scale-in anim-delay-1"
          sx={{
            width: "100%",
            maxWidth: 440,
            p: { xs: 3, sm: 4.5 },
            borderRadius: 4,
            border: "1px solid rgba(226, 232, 240, 0.8)",
          }}
        >
          <Box sx={{ mb: 3.5 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
                color: "white",
                background: "linear-gradient(135deg, #1f5cad 0%, #0f3d7a 100%)",
                boxShadow: "0 8px 20px rgba(31, 92, 173, 0.35)",
              }}
            >
              <AccountBalanceIcon />
            </Box>
            <Typography variant="h5">{title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          </Box>
          {children}
        </Card>
      </Box>
    </Box>
  );
}
