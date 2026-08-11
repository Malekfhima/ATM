import { Box, Card, Container, Typography } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

export default function AuthShell({ title, subtitle, children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0a2a55 0%, #0f3d7a 45%, #1f5cad 100%)",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Box className="anim-fade-up" sx={{ textAlign: "center", mb: 3 }}>
          <AccountBalanceIcon
            className="anim-float"
            sx={{ fontSize: 56, color: "white" }}
          />
          <Typography variant="h4" color="white" sx={{ mt: 1, fontWeight: 800 }}>
            Ma Banque
          </Typography>
          <Typography variant="subtitle1" color="rgba(255,255,255,0.8)">
            {subtitle}
          </Typography>
        </Box>
        <Card
          elevation={8}
          className="anim-scale-in anim-delay-1"
          sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4 }}
        >
          <Typography variant="h5" sx={{ mb: 3 }}>
            {title}
          </Typography>
          {children}
        </Card>
      </Container>
    </Box>
  );
}
