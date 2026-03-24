import React, { useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import Collapse from "@material-ui/core/Collapse";
import IconButton from "@material-ui/core/IconButton";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import Tooltip from "@material-ui/core/Tooltip";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import SyntaxHighlighter from "./SyntaxHighlighter";
import { ServerInfo } from "../api";
import { SortDirection, SortableTableColumn } from "../types/table";
import { timeAgo, uuidPrefix, prettifyPayload } from "../utils";
import { queueDetailsPath } from "../paths";
import Typography from "@material-ui/core/Typography";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles((theme) => ({
  table: {
    minWidth: 650,
  },
  fixedCell: {
    position: "sticky",
    zIndex: 1,
    left: 0,
    background: theme.palette.background.paper,
  },
}));

enum SortBy {
  HostPID,
  Status,
  ActiveWorkers,
  Queues,
  Started,
}
// sortServers takes a array of server-infos and return a sorted array.
// It returns a new array and leave the original array untouched.
function sortServerInfos(
  entries: ServerInfo[],
  cmpFn: (first: ServerInfo, second: ServerInfo) => number
): ServerInfo[] {
  let copy = [...entries];
  copy.sort(cmpFn);
  return copy;
}

interface Props {
  servers: ServerInfo[];
}

export default function ServersTable(props: Props) {
  const classes = useStyles();
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.HostPID);
  const [sortDir, setSortDir] = useState<SortDirection>(SortDirection.Asc);
  const colConfigs: SortableTableColumn<SortBy>[] = [
    { label: t("table.hostPid"), key: "host", sortBy: SortBy.HostPID, align: "left" },
    { label: t("table.started"), key: "started", sortBy: SortBy.Started, align: "left" },
    { label: t("table.status"), key: "status", sortBy: SortBy.Status, align: "left" },
    { label: t("table.queues"), key: "queues", sortBy: SortBy.Queues, align: "left" },
    { label: t("table.activeWorkers"), key: "workers", sortBy: SortBy.ActiveWorkers, align: "left" },
  ];

  const createSortClickHandler = (sortKey: SortBy) => (e: React.MouseEvent) => {
    if (sortKey === sortBy) {
      // Toggle sort direction.
      const nextSortDir =
        sortDir === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc;
      setSortDir(nextSortDir);
    } else {
      // Change the sort key.
      setSortBy(sortKey);
    }
  };

  const cmpFunc = (s1: ServerInfo, s2: ServerInfo): number => {
    let isS1Smaller = false;
    switch (sortBy) {
      case SortBy.HostPID:
        if (s1.host === s2.host && s1.pid === s2.pid) return 0;
        if (s1.host === s2.host) {
          isS1Smaller = s1.pid < s2.pid;
        } else {
          isS1Smaller = s1.host < s2.host;
        }
        break;
      case SortBy.Started:
        const s1StartTime = Date.parse(s1.start_time);
        const s2StartTime = Date.parse(s2.start_time);
        if (s1StartTime === s2StartTime) return 0;
        isS1Smaller = s1StartTime < s2StartTime;
        break;
      case SortBy.Status:
        if (s1.status === s2.status) return 0;
        isS1Smaller = s1.status < s2.status;
        break;
      case SortBy.Queues:
        const s1Queues = Object.keys(s1.queue_priorities).join(",");
        const s2Queues = Object.keys(s2.queue_priorities).join(",");
        if (s1Queues === s2Queues) return 0;
        isS1Smaller = s1Queues < s2Queues;
        break;
      case SortBy.ActiveWorkers:
        if (s1.active_workers.length === s2.active_workers.length) {
          return 0;
        }
        isS1Smaller = s1.active_workers.length < s2.active_workers.length;
        break;
      default:
        // eslint-disable-next-line no-throw-literal
        throw `Unexpected order by value: ${sortBy}`;
    }
    if (sortDir === SortDirection.Asc) {
      return isS1Smaller ? -1 : 1;
    } else {
      return isS1Smaller ? 1 : -1;
    }
  };

  if (props.servers.length === 0) {
    return (
      <Alert severity="info">
        <AlertTitle>{t("common.info")}</AlertTitle>
        No servers found at this time.
      </Alert>
    );
  }

  return (
    <TableContainer>
      <Table className={classes.table} aria-label="server info table">
        <TableHead>
          <TableRow>
            {colConfigs.map((cfg, i) => (
              <TableCell
                key={cfg.key}
                align={cfg.align}
                className={clsx(i === 0 && classes.fixedCell)}
              >
                <TableSortLabel
                  active={cfg.sortBy === sortBy}
                  direction={sortDir}
                  onClick={createSortClickHandler(cfg.sortBy)}
                >
                  {cfg.label}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {sortServerInfos(props.servers, cmpFunc).map((srv) => (
            <Row key={srv.id} server={srv} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
interface RowProps {
  server: ServerInfo;
}

const useRowStyles = makeStyles((theme) => ({
  rowRoot: {
    "& > *": {
      borderBottom: "unset",
    },
  },
  noBorder: {
    border: "none",
  },
  link: {
    color: theme.palette.text.primary,
  },
}));

function Row(props: RowProps) {
  const classes = useRowStyles();
  const { t } = useTranslation();
  const { server } = props;
  const [open, setOpen] = useState<boolean>(false);
  const qnames = Object.keys(server.queue_priorities);
  return (
    <React.Fragment>
      <TableRow className={classes.rowRoot}>
        <TableCell>
          {server.host}:{server.pid}
        </TableCell>
        <TableCell>{timeAgo(server.start_time)}</TableCell>
        <TableCell>{server.status}</TableCell>
        <TableCell>
          {qnames.map((qname, idx) => (
            <span key={qname}>
              <Link to={queueDetailsPath(qname)} className={classes.link}>
                {qname}
              </Link>
              {idx === qnames.length - 1 ? "" : ", "}
            </span>
          ))}
        </TableCell>
        <TableCell>
          {server.active_workers.length}/{server.concurrency}
        </TableCell>
        <TableCell>
          <Tooltip title={open ? t("common.hideDetails") : t("common.showDetails")}>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow className={classes.rowRoot}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Grid container spacing={2}>
              <Grid item xs={9}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  color="textSecondary"
                >
                  {t("table.activeWorkers")}
                </Typography>
                <Table size="small" aria-label="active workers">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("table.taskId")}</TableCell>
                      <TableCell>{t("table.taskPayload")}</TableCell>
                      <TableCell>{t("table.queue")}</TableCell>
                      <TableCell>{t("table.started")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {server.active_workers.map((worker) => (
                      <TableRow key={worker.task_id}>
                        <TableCell component="th" scope="row">
                          {uuidPrefix(worker.task_id)}
                        </TableCell>
                        <TableCell>
                          <SyntaxHighlighter
                            language="json"
                            customStyle={{ margin: 0 }}
                          >
                            {prettifyPayload(worker.task_payload)}
                          </SyntaxHighlighter>
                        </TableCell>
                        <TableCell>{worker.queue}</TableCell>
                        <TableCell>{timeAgo(worker.start_time)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Grid>
              <Grid item xs={3}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  color="textSecondary"
                >
                  {t("table.queuePriority")}
                </Typography>
                <Table size="small" aria-label="active workers">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("table.queue")}</TableCell>
                      <TableCell align="right">{t("table.priority")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {qnames.map((qname) => (
                      <TableRow key={qname}>
                        <TableCell>
                          <Link
                            to={queueDetailsPath(qname)}
                            className={classes.link}
                          >
                            {qname}
                          </Link>
                        </TableCell>
                        <TableCell align="right">
                          {server.queue_priorities[qname]}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Box margin={2}>
                  <Typography variant="subtitle2" component="span">
                    {t("table.strictPriority")}:{" "}
                  </Typography>
                  <Typography variant="button" component="span">
                    {server.strict_priority_enabled ? t("common.on") : t("common.off")}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}
