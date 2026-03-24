import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import Container from "@material-ui/core/Container";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import Button from "@material-ui/core/Button";
import { pollIntervalChange, selectTheme } from "../actions/settingsActions";
import { AppState } from "../store";
import FormControl from "@material-ui/core/FormControl/FormControl";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { ThemePreference } from "../reducers/settingsReducer";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { useHistory } from "react-router-dom";
import { paths } from "../paths";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
  },
  formControl: {
    margin: theme.spacing(1),
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  select: {
    width: "200px",
  },
}));

function mapStateToProps(state: AppState) {
  return {
    pollInterval: state.settings.pollInterval,
    themePreference: state.settings.themePreference,
  };
}

const mapDispatchToProps = { pollIntervalChange, selectTheme };

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

function SettingsView(props: PropsFromRedux) {
  const classes = useStyles();
  const { t, i18n } = useTranslation();
  const history = useHistory();

  const [sliderValue, setSliderValue] = useState(props.pollInterval);

  const handleSliderValueChange = (event: any, val: number | number[]) => {
    setSliderValue(val as number);
  };

  const handleSliderValueCommited = (event: any, val: number | number[]) => {
    props.pollIntervalChange(val as number);
  };

  const handleThemeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    props.selectTheme(event.target.value as ThemePreference);
  };

  const handleLanguageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    i18n.changeLanguage(event.target.value as string);
  };

  return (
    <Container maxWidth="lg" className={classes.container}>
      <Grid container spacing={3} justify="center">
        <Grid item xs={1} />
        <Grid item xs={6}>
          <Typography variant="h5" color="textPrimary">
            {t("settings.title")}
          </Typography>
        </Grid>
        <Grid item xs={5} />

        <Grid item xs={1} />
        <Grid item xs={6}>
          <Paper className={classes.paper} variant="outlined">
            <Typography color="textPrimary">{t("settings.pollingInterval")}</Typography>
            <Typography gutterBottom color="textSecondary" variant="subtitle1">
              {t("settings.pollingIntervalDesc")}
            </Typography>
            <Typography gutterBottom color="textSecondary" variant="subtitle1">
              {t("settings.pollingIntervalCurrent", { count: sliderValue })}
            </Typography>
            <Slider
              value={sliderValue}
              onChange={handleSliderValueChange}
              onChangeCommitted={handleSliderValueCommited}
              aria-labelledby="continuous-slider"
              valueLabelDisplay="auto"
              step={1}
              marks={true}
              min={2}
              max={20}
            />
          </Paper>
        </Grid>
        <Grid xs={5} />

        <Grid item xs={1} />
        <Grid item xs={6}>
          <Paper className={classes.paper} variant="outlined">
            <FormControl variant="outlined" className={classes.formControl}>
              <Typography color="textPrimary">{t("settings.darkTheme")}</Typography>
              <Select
                labelId="theme-label"
                id="theme-selected"
                value={props.themePreference}
                onChange={handleThemeChange}
                label="theme preference"
                className={classes.select}
              >
                <MenuItem value={ThemePreference.SystemDefault}>
                  {t("settings.themeSystemDefault")}
                </MenuItem>
                <MenuItem value={ThemePreference.Always}>{t("settings.themeAlways")}</MenuItem>
                <MenuItem value={ThemePreference.Never}>{t("settings.themeNever")}</MenuItem>
              </Select>
            </FormControl>
            <FormControl variant="outlined" className={classes.formControl}>
              <Typography color="textPrimary">{t("settings.language")}</Typography>
              <Select
                labelId="language-label"
                id="language-selected"
                value={i18n.resolvedLanguage || i18n.language}
                onChange={handleLanguageChange}
                className={classes.select}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Grid>
        <Grid item xs={5} />

        {window.ENABLE_AUTH && (
          <>
            <Grid item xs={1} />
            <Grid item xs={6}>
              <Paper className={classes.paper} variant="outlined">
                <FormControl className={classes.formControl}>
                  <Typography color="textPrimary">
                    {t("settings.changePassword")}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => history.push(paths().CHANGE_PASSWORD)}
                  >
                    {t("settings.changePasswordSubmit")}
                  </Button>
                </FormControl>
              </Paper>
            </Grid>
            <Grid item xs={5} />
          </>
        )}
      </Grid>
    </Container>
  );
}

export default connector(SettingsView);
