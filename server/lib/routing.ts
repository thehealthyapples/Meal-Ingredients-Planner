import { db } from "../db";
import { sql, eq } from "drizzle-orm";
import { activitySummary } from "@shared/schema";

type Route = "quicklist" | "planner" | "cookbook" | "analyser";

export async function getUserRouting(userId: number): Promise<{ route: Route }> {
  // Session count: each gap > 30 min of inactivity starts a new session.
  // routing_correction events are excluded so they don't inflate the count.
  const sessionRows = await db.execute<{ cnt: string }>(sql`
    WITH ordered AS (
      SELECT created_at,
             LAG(created_at) OVER (ORDER BY created_at) AS prev_at
      FROM product_events
      WHERE user_id    = ${userId}
        AND event_type != 'routing_correction'
    )
    SELECT COALESCE(
      COUNT(*) FILTER (
        WHERE prev_at IS NULL
           OR created_at - prev_at > INTERVAL '30 minutes'
      ),
      0
    )::text AS cnt
    FROM ordered
  `);

  const sessionCount = parseInt(sessionRows.rows?.[0]?.cnt ?? "0", 10);
  console.log("[ROUTING] sessionCount:", sessionCount);

  if (sessionCount < 3) {
    // State-based: look at what data the user actually has.
    const [row] = await db
      .select()
      .from(activitySummary)
      .where(eq(activitySummary.userId, userId));

    if (!row) {
      console.log("[ROUTING] state-based route:", "quicklist");
      return { route: "quicklist" };
    }
    if (row.currentPlannerMeals > 0) {
      console.log("[ROUTING] state-based route:", "planner");
      return { route: "planner" };
    }
    if (row.currentRecipes > 0) {
      console.log("[ROUTING] state-based route:", "cookbook");
      return { route: "cookbook" };
    }
    console.log("[ROUTING] state-based route:", "quicklist");
    return { route: "quicklist" };
  }

  console.log("[ROUTING] behaviour phase entered");

  // Correction override: only active after 3+ sessions. If the user has switched
  // away from the routed page within 15s three or more times to the same
  // destination, honour that preference.
  const correctionRows = await db.execute<{ destination: string; cnt: string }>(sql`
    SELECT
      metadata->>'destination' AS destination,
      COUNT(*)::text            AS cnt
    FROM product_events
    WHERE user_id    = ${userId}
      AND event_type = 'routing_correction'
      AND metadata->>'destination' IS NOT NULL
    GROUP BY metadata->>'destination'
    HAVING COUNT(*) >= 3
    ORDER BY COUNT(*) DESC
    LIMIT 1
  `);

  if (correctionRows.rows?.length > 0) {
    const correctedRoute = pathToRoute(correctionRows.rows[0].destination);
    if (correctedRoute) {
      console.log("[ROUTING] correction override hit:", correctedRoute);
      return { route: correctedRoute };
    }
  }

  // Behaviour-based: the feature area with the most events wins.
  const behaviorRows = await db.execute<{ feature_area: string; cnt: string }>(sql`
    SELECT feature_area, COUNT(*)::text AS cnt
    FROM product_events
    WHERE user_id    = ${userId}
      AND event_type != 'routing_correction'
    GROUP BY feature_area
    ORDER BY COUNT(*) DESC
    LIMIT 1
  `);

  if (behaviorRows.rows?.length > 0) {
    return { route: featureAreaToRoute(behaviorRows.rows[0].feature_area) };
  }

  console.log("[ROUTING] final route:", "quicklist");
  return { route: "quicklist" };
}

function pathToRoute(path: string): Route | null {
  if (path === "/list") return "quicklist";
  if (path === "/weekly-planner") return "planner";
  if (path === "/meals") return "cookbook";
  if (path === "/analyse-basket") return "analyser";
  return null;
}

function featureAreaToRoute(area: string): Route {
  if (area === "planner") return "planner";
  if (area === "cookbook") return "cookbook";
  if (area === "analyser") return "analyser";
  return "quicklist";
}
