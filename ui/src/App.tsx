import React from "react";
import { connect, ConnectedProps } from "react-redux";
import clsx from "clsx";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { makeStyles, Theme, ThemeProvider } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Drawer from "@material-ui/core/Drawer";
import Toolbar from "@material-ui/core/Toolbar";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import IconButton from "@material-ui/core/IconButton";
import Slide from "@material-ui/core/Slide";
import Tooltip from "@material-ui/core/Tooltip";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { TransitionProps } from "@material-ui/core/transitions";
import MenuIcon from "@material-ui/icons/Menu";
import BarChartIcon from "@material-ui/icons/BarChart";
import LayersIcon from "@material-ui/icons/Layers";
import SettingsIcon from "@material-ui/icons/Settings";
import ScheduleIcon from "@material-ui/icons/Schedule";
import FeedbackIcon from "@material-ui/icons/Feedback";
import TimelineIcon from "@material-ui/icons/Timeline";
import DoubleArrowIcon from "@material-ui/icons/DoubleArrow";
import CloseIcon from "@material-ui/icons/Close";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import { AppState } from "./store";
import { paths as getPaths } from "./paths";
import { isDarkTheme, useTheme } from "./theme";
import { closeSnackbar } from "./actions/snackbarActions";
import { toggleDrawer } from "./actions/settingsActions";
import { loginSuccess, logout as logoutAction } from "./reducers/authReducer";
import { getLoginStatus, logout as logoutAPI } from "./api";
import { useTranslation } from "react-i18next";
import ListItemLink from "./components/ListItemLink";
import SchedulersView from "./views/SchedulersView";
import DashboardView from "./views/DashboardView";
import TasksView from "./views/TasksView";
import TaskDetailsView from "./views/TaskDetailsView";
import SettingsView from "./views/SettingsView";
import ServersView from "./views/ServersView";
import RedisInfoView from "./views/RedisInfoView";
import MetricsView from "./views/MetricsView";
import PageNotFoundView from "./views/PageNotFoundView";
import LoginView from "./views/LoginView";
import ChangePasswordView from "./views/ChangePasswordView";
import { ReactComponent as Logo } from "./images/logo-color.svg";
import { ReactComponent as LogoDarkTheme } from "./images/logo-white.svg";

const drawerWidth = 220;

// FIXME: For some reason, the following code does not work:
//     makeStyles(theme => ({ /* use theme here */}));
// Using closure to work around this problem.
const useStyles = (theme: Theme) =>
  makeStyles({
    root: {
      display: "flex",
    },
    toolbar: {
      paddingRight: 24, // keep right padding when drawer closed
    },
    toolbarIcon: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      padding: "0 8px",
      ...theme.mixins.toolbar,
    },
    appBar: {
      backgroundColor: theme.palette.background.paper,
      zIndex: theme.zIndex.drawer + 1,
    },
    menuButton: {
      marginRight: theme.spacing(1),
      color: isDarkTheme(theme)
        ? theme.palette.grey[100]
        : theme.palette.grey[700],
    },
    menuButtonHidden: {
      display: "none",
    },
    drawerPaper: {
      position: "relative",
      whiteSpace: "nowrap",
      width: drawerWidth,
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      border: "none",
    },
    drawerPaperClose: {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    },
    snackbar: {
      background: theme.palette.grey["A400"],
      color: "#ffffff",
    },
    snackbarCloseIcon: {
      color: theme.palette.grey[400],
    },
    appBarSpacer: theme.mixins.toolbar,
    mainContainer: {
      display: "flex",
      width: "100vw",
    },
    content: {
      flex: 1,
      height: "100vh",
      overflow: "hidden",
      background: theme.palette.background.paper,
    },
    contentWrapper: {
      height: "100%",
      display: "flex",
      paddingTop: "64px", // app-bar height
      overflow: "scroll",
    },
    sidebarContainer: {
      display: "flex",
      justifyContent: "space-between",
      height: "100%",
      flexDirection: "column",
    },
    listItem: {
      borderTopRightRadius: "24px",
      borderBottomRightRadius: "24px",
    },
  });

function mapStateToProps(state: AppState) {
  return {
    snackbar: state.snackbar,
    themePreference: state.settings.themePreference,
    isDrawerOpen: state.settings.isDrawerOpen,
    isAuthenticated: state.auth.isAuthenticated,
    authUsername: state.auth.username,
  };
}

const mapDispatchToProps = {
  closeSnackbar,
  toggleDrawer,
  loginSuccess,
  logoutAction,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

function SlideUpTransition(props: TransitionProps) {
  return <Slide {...props} direction="up" />;
}

function App(props: ConnectedProps<typeof connector>) {
  const theme = useTheme(props.themePreference);
  const classes = useStyles(theme)();
  const paths = getPaths();
  const { t } = useTranslation();
  const [authChecked, setAuthChecked] = React.useState(!window.ENABLE_AUTH);

  React.useEffect(() => {
    if (!window.ENABLE_AUTH) return;
    getLoginStatus()
      .then((resp) => {
        props.loginSuccess({ username: resp.username });
      })
      .catch(() => {
        // Not logged in, will show login page.
      })
      .finally(() => {
        setAuthChecked(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoginSuccess = (username: string) => {
    props.loginSuccess({ username });
  };

  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const handleLogout = async () => {
    setLogoutDialogOpen(false);
    try {
      await logoutAPI();
    } catch {
      // Ignore errors on logout.
    }
    props.logoutAction();
  };

  if (!authChecked) {
    return null; // or a loading spinner
  }

  if (window.ENABLE_AUTH && !props.isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <LoginView onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <div className={classes.root}>
          <AppBar
            position="absolute"
            className={classes.appBar}
            variant="outlined"
          >
            <Toolbar className={classes.toolbar}>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="open drawer"
                onClick={props.toggleDrawer}
                className={classes.menuButton}
              >
                <MenuIcon />
              </IconButton>
              {isDarkTheme(theme) ? (
                <LogoDarkTheme width={200} height={48} />
              ) : (
                <Logo width={200} height={48} />
              )}
              {window.ENABLE_AUTH && props.isAuthenticated && (
                <Tooltip title={t("login.logoutTooltip", { username: props.authUsername })}>
                  <IconButton
                    color="inherit"
                    aria-label="logout"
                    onClick={handleLogoutClick}
                    style={{ marginLeft: "auto" }}
                  >
                    <ExitToAppIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Toolbar>
          </AppBar>
          <div className={classes.mainContainer}>
            <Drawer
              variant="permanent"
              classes={{
                paper: clsx(
                  classes.drawerPaper,
                  !props.isDrawerOpen && classes.drawerPaperClose
                ),
              }}
              open={props.isDrawerOpen}
            >
              <Snackbar
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                open={props.snackbar.isOpen}
                autoHideDuration={6000}
                onClose={props.closeSnackbar}
                TransitionComponent={SlideUpTransition}
              >
                <SnackbarContent
                  message={props.snackbar.message}
                  className={classes.snackbar}
                  action={
                    <IconButton
                      size="small"
                      aria-label="close"
                      color="inherit"
                      onClick={props.closeSnackbar}
                    >
                      <CloseIcon
                        className={classes.snackbarCloseIcon}
                        fontSize="small"
                      />
                    </IconButton>
                  }
                />
              </Snackbar>
              <div className={classes.appBarSpacer} />
              <div className={classes.sidebarContainer}>
                <List>
                  <div>
                    <ListItemLink
                      to={paths.HOME}
                      primary={t("nav.queues")}
                      icon={<BarChartIcon />}
                    />
                    <ListItemLink
                      to={paths.SERVERS}
                      primary={t("nav.servers")}
                      icon={<DoubleArrowIcon />}
                    />
                    <ListItemLink
                      to={paths.SCHEDULERS}
                      primary={t("nav.schedulers")}
                      icon={<ScheduleIcon />}
                    />
                    <ListItemLink
                      to={paths.REDIS}
                      primary={t("nav.redis")}
                      icon={<LayersIcon />}
                    />
                    {window.PROMETHEUS_SERVER_ADDRESS && (
                      <ListItemLink
                        to={paths.QUEUE_METRICS}
                        primary={t("nav.metrics")}
                        icon={<TimelineIcon />}
                      />
                    )}
                  </div>
                </List>
                <List>
                  <ListItemLink
                    to={paths.SETTINGS}
                    primary={t("nav.settings")}
                    icon={<SettingsIcon />}
                  />
                  <ListItem
                    button
                    component="a"
                    className={classes.listItem}
                    href="https://github.com/hibiken/asynqmon/issues"
                    target="_blank"
                  >
                    <ListItemIcon>
                      <FeedbackIcon />
                    </ListItemIcon>
                    <ListItemText primary={t("nav.sendFeedback")} />
                  </ListItem>
                  {window.ENABLE_AUTH && props.isAuthenticated && (
                    <ListItem
                      button
                      className={classes.listItem}
                      onClick={handleLogoutClick}
                    >
                      <ListItemIcon>
                        <ExitToAppIcon />
                      </ListItemIcon>
                      <ListItemText primary={t("nav.logout")} />
                    </ListItem>
                  )}
                </List>
              </div>
            </Drawer>
            <main className={classes.content}>
              <div className={classes.contentWrapper}>
                <Switch>
                  <Route exact path={paths.TASK_DETAILS}>
                    <TaskDetailsView />
                  </Route>
                  <Route exact path={paths.QUEUE_DETAILS}>
                    <TasksView />
                  </Route>
                  <Route exact path={paths.SCHEDULERS}>
                    <SchedulersView />
                  </Route>
                  <Route exact path={paths.SERVERS}>
                    <ServersView />
                  </Route>
                  <Route exact path={paths.REDIS}>
                    <RedisInfoView />
                  </Route>
                  <Route exact path={paths.SETTINGS}>
                    <SettingsView />
                  </Route>
                  <Route exact path={paths.CHANGE_PASSWORD}>
                    <ChangePasswordView />
                  </Route>
                  <Route exact path={paths.HOME}>
                    <DashboardView />
                  </Route>
                  <Route exact path={paths.QUEUE_METRICS}>
                    <MetricsView />
                  </Route>
                  <Route path="*">
                    <PageNotFoundView />
                  </Route>
                </Switch>
              </div>
            </main>
          </div>
        </div>
      </Router>
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        maxWidth="xs"
        fullWidth
        PaperProps={{ style: { borderRadius: 12, padding: "8px 0" } }}
      >
        <DialogContent style={{ textAlign: "center", paddingTop: 32, paddingBottom: 8 }}>
          <ExitToAppIcon
            style={{
              fontSize: 56,
              color: theme.palette.primary.main,
              marginBottom: 12,
            }}
          />
          <Typography variant="h6" style={{ fontWeight: 600, marginBottom: 8 }}>
            {t("login.logoutConfirmTitle")}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t("login.logoutConfirmMessage")}
          </Typography>
        </DialogContent>
        <DialogActions
          style={{
            justifyContent: "center",
            padding: "16px 24px 28px",
            gap: 12,
          }}
        >
          <Button
            onClick={handleLogoutCancel}
            variant="outlined"
            color="primary"
            style={{ minWidth: 100, borderRadius: 8 }}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleLogout}
            variant="contained"
            color="primary"
            disableElevation
            style={{ minWidth: 100, borderRadius: 8 }}
          >
            {t("nav.logout")}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default connector(App);
