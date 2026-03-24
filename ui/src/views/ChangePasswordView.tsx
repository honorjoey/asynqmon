import React, { useState } from "react";
import Container from "@material-ui/core/Container";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Alert from "@material-ui/lab/Alert";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { changePassword } from "../api";
import { paths } from "../paths";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(3),
    display: "flex",
    flexDirection: "column",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(1),
  },
  submitButton: {
    marginTop: theme.spacing(2),
    alignSelf: "flex-start",
  },
}));

function ChangePasswordView() {
  const classes = useStyles();
  const { t } = useTranslation();
  const history = useHistory();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSuccess(false);
    setError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t("settings.changePasswordErrorRequired"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("settings.changePasswordErrorMismatch"));
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setError(t("settings.changePasswordErrorCurrent"));
      } else {
        setError(t("settings.changePasswordErrorFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" className={classes.container}>
      <Grid container spacing={3} justify="center">
        <Grid item xs={1} />
        <Grid item xs={6}>
          <div className={classes.titleRow}>
            <IconButton
              size="small"
              onClick={() => history.push(paths().SETTINGS)}
              style={{ marginRight: 8 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" color="textPrimary">
              {t("settings.changePassword")}
            </Typography>
          </div>
        </Grid>
        <Grid item xs={5} />

        <Grid item xs={1} />
        <Grid item xs={6}>
          <Paper className={classes.paper} variant="outlined">
            {success && (
              <Alert
                severity="success"
                onClose={() => setSuccess(false)}
                style={{ marginBottom: 8 }}
              >
                {t("settings.changePasswordSuccess")}
              </Alert>
            )}
            {error && (
              <Alert
                severity="error"
                onClose={() => setError("")}
                style={{ marginBottom: 8 }}
              >
                {error}
              </Alert>
            )}
            <TextField
              label={t("settings.currentPassword")}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              variant="outlined"
              margin="normal"
              fullWidth
              autoComplete="current-password"
            />
            <TextField
              label={t("settings.newPassword")}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              variant="outlined"
              margin="normal"
              fullWidth
              autoComplete="new-password"
            />
            <TextField
              label={t("settings.confirmNewPassword")}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              variant="outlined"
              margin="normal"
              fullWidth
              autoComplete="new-password"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
              className={classes.submitButton}
            >
              {t("settings.changePasswordSubmit")}
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={5} />
      </Grid>
    </Container>
  );
}

export default ChangePasswordView;
