package com.abertech.srportal.core

import java.time.Duration
import java.time.Instant

/**
 * Turns the confirmed last-seen time and the current time into the search window.
 *
 * The delta is clamped at zero so a last-seen time accidentally set in the future does not
 * produce a negative window; the UI surfaces that case separately.
 */
object SearchWindowCalculator {
    /**
     * Elapsed time between [lastSeen] and [now] in whole minutes, never negative.
     */
    fun elapsedMinutes(lastSeen: Instant, now: Instant): Long =
        Duration.between(lastSeen, now).toMinutes().coerceAtLeast(0L)

    /**
     * Builds the window record stored with the plan.
     */
    fun compute(lastSeen: Instant, now: Instant): SearchWindow = SearchWindow(
        lastSeenUtc = TimeFormat.format(lastSeen),
        nowUtc = TimeFormat.format(now),
        elapsedMinutes = elapsedMinutes(lastSeen, now),
    )

    /**
     * True when [lastSeen] is later than [now], which the wizard should refuse to confirm.
     */
    fun isInFuture(lastSeen: Instant, now: Instant): Boolean = lastSeen.isAfter(now)
}
