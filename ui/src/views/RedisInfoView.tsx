import React from "react";
import { connect, ConnectedProps } from "react-redux";
import Container from "@material-ui/core/Container";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import SyntaxHighlighter from "../components/SyntaxHighlighter";
import { getRedisInfoAsync } from "../actions/redisInfoActions";
import { usePolling } from "../hooks";
import { AppState } from "../store";
import { timeAgoUnix } from "../utils";
import { RedisInfo } from "../api";
import QueueLocationTable from "../components/QueueLocationTable";
import Link from "@material-ui/core/Link";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
}));

function mapStateToProps(state: AppState) {
  return {
    loading: state.redis.loading,
    error: state.redis.error,
    redisInfo: state.redis.data,
    redisAddress: state.redis.address,
    redisInfoRaw: state.redis.rawData,
    redisClusterEnabled: state.redis.cluster,
    redisClusterNodesRaw: state.redis.rawClusterNodes,
    queueLocations: state.redis.queueLocations,
    pollInterval: state.settings.pollInterval,
    themePreference: state.settings.themePreference,
  };
}

const connector = connect(mapStateToProps, { getRedisInfoAsync });
type Props = ConnectedProps<typeof connector>;

function RedisInfoView(props: Props) {
  const classes = useStyles();
  const {
    pollInterval,
    getRedisInfoAsync,
    redisInfo,
    redisInfoRaw,
    redisClusterEnabled,
    redisClusterNodesRaw,
    queueLocations,
  } = props;
  usePolling(getRedisInfoAsync, pollInterval);
  const { t } = useTranslation();

  // Metrics to show
  // - Used Memory
  // - Memory Fragmentation Ratio
  // - Connected Clients
  // - Connected Replicas (slaves)
  // - Persistence (rdb_last_save_time, rdb_changes_since_last_save)
  // - Errors (rejected_connections)

  return (
    <Container maxWidth="lg" className={classes.container}>
      <Grid container spacing={3}>
        {props.error === "" ? (
          <>
            <Grid item xs={12}>
              <Typography variant="h5" color="textPrimary">
                {redisClusterEnabled ? t("redis.titleCluster") : t("redis.titleSingle")}
              </Typography>
              {!redisClusterEnabled && (
                <Typography variant="subtitle1" color="textSecondary">
                  {t("redis.connectedTo", { address: props.redisAddress })}
                </Typography>
              )}
            </Grid>
            {queueLocations && queueLocations.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" color="textSecondary">
                  {t("redis.queueLocationInCluster")}
                </Typography>
                <QueueLocationTable queueLocations={queueLocations} />
              </Grid>
            )}
            {redisClusterNodesRaw && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" color="textSecondary">
                    <Link
                      href="https://redis.io/commands/cluster-nodes"
                      target="_"
                    >
                      CLUSTER NODES
                    </Link>{" "}
                    {t("redis.clusterNodesOutput").replace("CLUSTER NODES ", "")}
                  </Typography>
                  <SyntaxHighlighter language="yaml">
                    {redisClusterNodesRaw}
                  </SyntaxHighlighter>
                </Grid>
              </>
            )}
            {redisInfo && !redisClusterEnabled && (
              <RedisMetricCards redisInfo={redisInfo} />
            )}
            {redisInfoRaw && (
              <>
                <Grid item xs={6}>
                  <Typography variant="h6" color="textSecondary">
                    {redisClusterEnabled ? (
                      <Link
                        href="https://redis.io/commands/cluster-info"
                        target="_"
                      >
                        CLUSTER INFO
                      </Link>
                    ) : (
                      <Link href="https://redis.io/commands/info" target="_">
                        INFO
                      </Link>
                    )}{" "}
                    Command Output
                  </Typography>
                  <SyntaxHighlighter language="yaml">
                    {redisInfoRaw}
                  </SyntaxHighlighter>
                </Grid>
              </>
            )}
          </>
        ) : (
          <Grid item xs={12}>
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              {t("redis.errorMsg")} —{" "}
              <strong>{t("common.seeLogsForDetails")}</strong>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

function RedisMetricCards(props: { redisInfo: RedisInfo }) {
  const { redisInfo } = props;
  const { t } = useTranslation();
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" color="textSecondary">
          {t("redis.serverSection")}
        </Typography>
      </Grid>
      <Grid item xs={3}>
        <MetricCard title={t("common.version")} content={redisInfo.redis_version} />
      </Grid>
      <Grid item xs={3}>
        <MetricCard
          title={t("common.uptime")}
          content={t("redis.uptimeDays", { days: redisInfo.uptime_in_days })}
        />
      </Grid>
      <Grid item xs={6} />
      <Grid item xs={12}>
        <Typography variant="h6" color="textSecondary">
          {t("redis.memorySection")}
        </Typography>
      </Grid>
      <Grid item xs={3}>
        <MetricCard title={t("common.usedMemory")} content={redisInfo.used_memory_human} />
      </Grid>
      <Grid item xs={3}>
        <MetricCard
          title={t("common.peakMemoryUsed")}
          content={redisInfo.used_memory_peak_human}
        />
      </Grid>
      <Grid item xs={3}>
        <MetricCard
          title={t("common.memoryFragmentationRatio")}
          content={redisInfo.mem_fragmentation_ratio}
        />
      </Grid>
      <Grid item xs={3} />
      <Grid item xs={12}>
        <Typography variant="h6" color="textSecondary">
          {t("redis.connectionsSection")}
        </Typography>
      </Grid>
      <Grid item xs={3}>
        <MetricCard
          title={t("common.connectedClients")}
          content={redisInfo.connected_clients}
        />
      </Grid>
      <Grid item xs={3}>
        <MetricCard
          title={t("common.connectedReplicas")}
          content={redisInfo.connected_slaves}
        />
      </Grid>
      <Grid item xs={6} />
      <Grid item xs={12}>
        <Typography variant="h6" color="textSecondary">
          {t("redis.persistenceSection")}
        </Typography>
      </Grid>
      <Grid item xs={3}>
        <MetricCard
          title={t("redis.lastSaveToDisk")}
          content={timeAgoUnix(parseInt(redisInfo.rdb_last_save_time))}
        />
      </Grid>
      <Grid item xs={3}>
        <MetricCard
          title={t("redis.changesSinceLastDump")}
          content={redisInfo.rdb_changes_since_last_save}
        />
      </Grid>
      <Grid item xs={6} />
    </>
  );
}

interface MetricCardProps {
  title: string;
  content: string;
}

function MetricCard(props: MetricCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography
          gutterBottom
          color="textPrimary"
          variant="h5"
          align="center"
        >
          {props.content}
        </Typography>
        <Typography color="textSecondary" variant="subtitle2" align="center">
          {props.title}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default connector(RedisInfoView);
