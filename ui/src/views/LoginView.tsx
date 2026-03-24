import React, { useState } from "react";
import { useDispatch } from "react-redux";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Paper from "@material-ui/core/Paper";
import Box from "@material-ui/core/Box";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";
import Alert from "@material-ui/lab/Alert";
import { makeStyles } from "@material-ui/core/styles";
import { useTranslation } from "react-i18next";
import { login } from "../api";
import { loginSuccess, loginFailure, loginStart } from "../reducers/authReducer";
import { ReactComponent as Logo } from "../images/logo-color.svg";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.background.default,
  },
  paper: {
    padding: theme.spacing(4, 6),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  logo: {
    marginBottom: theme.spacing(2),
    width: 160,
    height: "auto",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
    position: "relative",
  },
  buttonProgress: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
  alert: {
    marginTop: theme.spacing(2),
    width: "100%",
  },
}));

interface LoginViewProps {
  onLoginSuccess: (username: string) => void;
}

function LoginView({ onLoginSuccess }: LoginViewProps) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError(t("login.errorRequired"));
      return;
    }
    setLoading(true);
    setError(null);
    dispatch(loginStart());
    try {
      const resp = await login(username, password);
      dispatch(loginSuccess({ username: resp.username }));
      onLoginSuccess(resp.username);
    } catch (err: any) {
      const msg =
        err?.response?.status === 401
          ? t("login.errorInvalid")
          : t("login.errorFailed");
      setError(msg);
      dispatch(loginFailure(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={classes.root}>
      <Paper className={classes.paper} elevation={3}>
        <Logo className={classes.logo} />
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          {t("login.title")}
        </Typography>
        {error && (
          <Alert severity="error" className={classes.alert}>
            {error}
          </Alert>
        )}
        <form className={classes.form} onSubmit={handleSubmit} noValidate>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label={t("login.username")}
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label={t("login.password")}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Box className={classes.submit} position="relative">
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {t("login.submit")}
            </Button>
            {loading && (
              <CircularProgress size={24} className={classes.buttonProgress} />
            )}
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default LoginView;
