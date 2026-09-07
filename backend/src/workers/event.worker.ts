import { createClient } from "redis";
import config from "../config";
import { db } from "../db";
import { generateFingerprint } from "../utils/fingerprint";
import { calculateSeverity, getHigherSeverity } from "../utils/severity";
import { trackAndDetectSpike } from "../utils/spike";
import {
  consumeSuppressedDuplicates,
  getDueSuppressedFlushes,
} from "../utils/fingerprintRateLimit";

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

const flushSuppressedOccurrences = async (item: string): Promise<void> => {
  const [projectId, fingerprint] = item.split(":");

  const suppressedCount = await consumeSuppressedDuplicates(
    redisWorker,
    projectId,
    fingerprint
  );

  if (suppressedCount === 0) {
    return;
  }

  const result = await db.query(
    `
    SELECT
      i.id,
      i.service_id,
      i.event_count,
      i.severity,
      e.environment,
      e.level
    FROM incidents i
    JOIN services s
      ON s.id = i.service_id
    LEFT JOIN LATERAL (
      SELECT environment, level
      FROM events
      WHERE incident_id = i.id
      ORDER BY occurred_at DESC
      LIMIT 1
    ) e ON true
    WHERE s.project_id = $1
      AND i.fingerprint = $2
      AND i.status IN ('open', 'acknowledged')
    LIMIT 1
    `,
    [projectId, fingerprint]
  );

  if (result.rowCount === 0) {
    console.log("No active incident found for suppressed flush:", fingerprint);
    return;
  }

  const incident = result.rows[0];

  const newEventCount = incident.event_count + suppressedCount;

  const severityResult = calculateSeverity({
    environment: incident.environment,
    level: incident.level,
    eventCount: newEventCount,

    // Suppression happens only during a high-frequency burst.
    isSpike: true,
  });

  const finalSeverity = getHigherSeverity(
    incident.severity,
    severityResult.severity
  );

  await db.query(
    `
    UPDATE incidents
    SET
      event_count = $1,
      severity = $2,
      severity_reasons = $3,
      last_seen_at = NOW()
    WHERE id = $4
    `,
    [
      newEventCount,
      finalSeverity,
      JSON.stringify(severityResult.reasons),
      incident.id,
    ]
  );

  if (incident.severity !== finalSeverity) {
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
        incident.id,
        "severity_changed",
        `Severity changed from ${incident.severity} to ${finalSeverity}`,
      ]
    );
  }

  await redisWorker.publish(
    INCIDENT_UPDATE_CHANNEL,
    JSON.stringify({
      incidentId: incident.id,
      serviceId: incident.service_id,
      projectId,
      type: "incident_updated",
    })
  );

  console.log(
    "Suppressed duplicates flushed:",
    suppressedCount,
    "incident:",
    incident.id
  );
};

const startWorker = async () => {
  await redisWorker.connect();

  console.log("Event worker connected to Redis");

  while (true) {
    const result = await redisWorker.blPop(EVENT_QUEUE, 1);

    if (!result) {
      const dueFlushes = await getDueSuppressedFlushes(redisWorker);

      for (const item of dueFlushes) {
        await flushSuppressedOccurrences(item);
      }

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

    const suppressedDuplicates = await consumeSuppressedDuplicates(
      redisWorker,
      event.projectId,
      fingerprint
    );

    const occurrenceCount = 1 + suppressedDuplicates;

    console.log("Occurrences represented by this event:", occurrenceCount);

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

      const newEventCount = incident.event_count + occurrenceCount;

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
        eventCount: occurrenceCount,
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
          occurrenceCount,
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
