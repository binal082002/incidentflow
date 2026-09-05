import { createClient } from "redis";
import config from "../config";
import { db } from "../db";
import { generateFingerprint } from "../utils/fingerprint";
import { calculateSeverity, getHigherSeverity } from "../utils/severity";
import { trackAndDetectSpike } from "../utils/spike";

const EVENT_QUEUE = "incidentflow:events";
const INCIDENT_UPDATE_CHANNEL = "incidentflow:incident-updates";

const redisWorker = config.redis.url
  ? createClient({
      url: config.redis.url,
    })
  : createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
    });

redisWorker.on("error", (error) => {
  console.error("Redis worker error:", error);
});

const startWorker = async () => {
  await redisWorker.connect();

  console.log("Event worker connected to Redis");

  while (true) {
    const result = await redisWorker.blPop(EVENT_QUEUE, 0);

    if (!result) {
      continue;
    }

    const event = JSON.parse(result.element);

    console.log("Processing event:", event);

    // 1. Generate fingerprint
    const fingerprint = generateFingerprint(
      event.service,
      event.endpoint,
      event.message
    );

    console.log("Generated fingerprint:", fingerprint);

    // 2. Detect spike
    const spikeResult = await trackAndDetectSpike(redisWorker, fingerprint);

    const { isSpike, spikeStarted, count: spikeCount } = spikeResult;

    console.log(
      "Spike:",
      isSpike,
      "started:",
      spikeStarted,
      "count:",
      spikeCount
    );

    // 3. Find an active incident with the same fingerprint
    const existingIncident = await db.query(
      `
      SELECT *
      FROM incidents
      WHERE service_id = $1
        AND fingerprint = $2
        AND status IN ('open', 'acknowledged')
      LIMIT 1
      `,
      [event.serviceId, fingerprint]
    );

    let incidentId: string;

    if (existingIncident.rowCount && existingIncident.rowCount > 0) {
      // -----------------------------------
      // Existing incident
      // -----------------------------------

      const incident = existingIncident.rows[0];

      incidentId = incident.id;

      const previousSeverity = incident.severity;

      const newEventCount = incident.event_count + 1;

      const severityResult = calculateSeverity({
        environment: event.environment,
        level: event.level,
        eventCount: newEventCount,
        isSpike,
      });

      const finalSeverity = getHigherSeverity(
        previousSeverity,
        severityResult.severity
      );

      await db.query(
        `
        UPDATE incidents
        SET
            event_count = $1,
            severity = $2,
            severity_reasons = $3,
            last_seen_at = $4
        WHERE id = $5
        `,
        [
          newEventCount,
          finalSeverity,
          JSON.stringify(severityResult.reasons),
          event.timestamp,
          incidentId,
        ]
      );

      // Timeline: severity changed
      if (previousSeverity !== finalSeverity) {
        await db.query(
          `
          INSERT INTO incident_timeline (
            incident_id,
            type,
            message
          )
          VALUES ($1, $2, $3)
          `,
          [
            incidentId,
            "severity_changed",
            `Severity changed from ${previousSeverity} to ${finalSeverity}`,
          ]
        );
      }

      // Timeline: spike detected
      if (spikeStarted) {
        await db.query(
          `
          INSERT INTO incident_timeline (
            incident_id,
            type,
            message
          )
          VALUES ($1, $2, $3)
          `,
          [incidentId, "spike_detected", "Error spike detected"]
        );
      }

      console.log(
        "Existing incident updated:",
        incidentId,
        "severity:",
        finalSeverity,
        "reasons:",
        severityResult.reasons
      );
    } else {
      // -----------------------------------
      // New incident
      // -----------------------------------

      const severityResult = calculateSeverity({
        environment: event.environment,
        level: event.level,
        eventCount: 1,
        isSpike,
      });

      const newIncident = await db.query(
        `
        INSERT INTO incidents (
          service_id,
          title,
          fingerprint,
          severity,
          severity_reasons,
          status,
          event_count,
          started_at,
          last_seen_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [
          event.serviceId,
          event.message,
          fingerprint,
          severityResult.severity,
          JSON.stringify(severityResult.reasons),
          "open",
          1,
          event.timestamp,
          event.timestamp,
        ]
      );

      incidentId = newIncident.rows[0].id;

      // Timeline: incident created
      await db.query(
        `
        INSERT INTO incident_timeline (
          incident_id,
          type,
          message
        )
        VALUES ($1, $2, $3)
        `,
        [incidentId, "created", "Incident created"]
      );

      if (spikeStarted) {
        await db.query(
          `
          INSERT INTO incident_timeline (
            incident_id,
            type,
            message
          )
          VALUES ($1, $2, $3)
          `,
          [incidentId, "spike_detected", "Error spike detected"]
        );
      }

      console.log(
        "New incident created:",
        incidentId,
        "severity:",
        severityResult.severity,
        "reasons:",
        severityResult.reasons
      );
    }

    // 4. Save the actual event
    await db.query(
      `
      INSERT INTO events (
        service_id,
        incident_id,
        environment,
        level,
        message,
        endpoint,
        fingerprint,
        occurred_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        event.serviceId,
        incidentId,
        event.environment,
        event.level,
        event.message,
        event.endpoint ?? null,
        fingerprint,
        event.timestamp,
      ]
    );

    console.log("Event saved to PostgreSQL");

    await redisWorker.publish(
      INCIDENT_UPDATE_CHANNEL,
      JSON.stringify({
        incidentId,
        serviceId: event.serviceId,
        projectId: event.projectId,
        type: "incident_updated",
      })
    );

    console.log("Realtime incident update published:", incidentId);
  }
};

startWorker().catch((error) => {
  console.error("Worker failed:", error);
  process.exit(1);
});
