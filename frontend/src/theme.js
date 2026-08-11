import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f3d7a",
      light: "#1f5cad",
      dark: "#0a2a55",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#10b981",
      dark: "#059669",
    },
    gold: {
      main: "#f5b301",
      dark: "#d99a00",
    },
    error: {
      main: "#e11d48",
    },
    warning: {
      main: "#f59e0b",
    },
    background: {
      default: "#f1f5f9",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#64748b",
    },
    divider: "#e2e8f0",
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 800, letterSpacing: "-0.02em" },
    h4: { fontWeight: 800, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shadows: [
    "none",
    "0 1px 3px rgba(15, 61, 122, 0.08)",
    "0 2px 6px rgba(15, 61, 122, 0.08)",
    "0 4px 12px rgba(15, 61, 122, 0.10)",
    "0 8px 24px rgba(15, 61, 122, 0.12)",
    "0 12px 32px rgba(15, 61, 122, 0.14)",
    "0 16px 40px rgba(15, 61, 122, 0.16)",
    ...Array(19).fill("0 4px 12px rgba(15, 61, 122, 0.10)"),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, padding: "10px 22px" },
        containedPrimary: {
          background: "linear-gradient(135deg, #1f5cad 0%, #0f3d7a 100%)",
          boxShadow: "0 6px 16px rgba(31, 92, 173, 0.30)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            background: "linear-gradient(135deg, #2563c9 0%, #0f3d7a 100%)",
            transform: "translateY(-2px)",
            boxShadow: "0 10px 24px rgba(31, 92, 173, 0.40)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
});

export default theme;
