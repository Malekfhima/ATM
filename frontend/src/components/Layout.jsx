import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/format";

const navItems = [
  { label: "Tableau de bord", path: "/" },
  { label: "Historique", path: "/transactions" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(180deg, #eef4fb 0%, #f1f5f9 40%, #f8fafc 100%)",
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "rgba(15, 61, 122, 0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(255,255,255,0.14)",
              color: "#f5b301",
            }}
          >
            <AccountBalanceIcon />
          </Box>
          <Typography variant="h6" sx={{ mr: 3, letterSpacing: "-0.01em" }}>
            Ma Banque
          </Typography>

          <Box sx={{ flexGrow: 1, display: "flex", gap: 0.5 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  transition: "background-color 0.2s ease, transform 0.2s ease",
                  backgroundColor:
                    location.pathname === item.path
                      ? "rgba(255,255,255,0.15)"
                      : "transparent",
                  "&:hover": { transform: "translateY(-1px)" },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              color: "white",
            }}
          >
            <Box
              sx={{ display: { xs: "none", sm: "block" }, textAlign: "right" }}
            >
              <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                {user?.account?.accountNumber || "—"}
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 14,
                fontWeight: 700,
                bgcolor: "rgba(255,255,255,0.18)",
                color: "white",
              }}
            >
              {getInitials(user?.name)}
            </Avatar>
            <Tooltip title="Se déconnecter">
              <IconButton
                color="inherit"
                onClick={handleLogout}
                aria-label="Se déconnecter"
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="lg"
        className="anim-fade-in"
        sx={{ py: 4, flexGrow: 1 }}
      >
        <Outlet />
      </Container>

      <Box component="footer" sx={{ py: 3, textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary">
          Ma Banque — système bancaire démo sécurisé
        </Typography>
      </Box>
    </Box>
  );
}
