--Creates a temporary stream.
CREATE OR REPLACE STREAM "TEMP_STREAM" (
            "cost"            DOUBLE,
            "recordTimestamp" TIMESTAMP,
            "resourceId"      VARCHAR(500),
            "service"         VARCHAR(60),
            "ANOMALY_SCORE"   DOUBLE);

--Creates another stream for application output.
CREATE OR REPLACE STREAM "DESTINATION_SQL_STREAM" (
            "cost"            DOUBLE,
            "recordTimestamp" TIMESTAMP,
            "resourceId"      VARCHAR(500),
            "service"         VARCHAR(60),
            "ANOMALY_SCORE"   DOUBLE);

-- Compute an anomaly score for each record in the input stream using Random Cut Forest
CREATE OR REPLACE PUMP "STREAM_PUMP" AS INSERT INTO "TEMP_STREAM"
  SELECT STREAM SOURCE."cost", SOURCE."recordTimestamp", SOURCE."resourceId", SOURCE."service", rcf."ANOMALY_SCORE" FROM
  TABLE(RANDOM_CUT_FOREST(
    CURSOR(SELECT STREAM "cost" FROM SOURCE_SQL_STREAM_001)
  )
) AS rcf, SOURCE_SQL_STREAM_001 AS SOURCE;

-- Sort records by descending anomaly score, insert into output stream
CREATE OR REPLACE PUMP "OUTPUT_PUMP" AS
   INSERT INTO "DESTINATION_SQL_STREAM"
      SELECT STREAM * FROM "TEMP_STREAM"
      ORDER BY FLOOR("TEMP_STREAM".ROWTIME TO SECOND), ANOMALY_SCORE DESC;

