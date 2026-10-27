package com.abertech.srportal.core

import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

/**
 * ISO-8601 helpers shared by the app and the server contract.
 */
object TimeFormat {
    private val humanFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm")

    /**
     * Formats an instant as `yyyy-MM-ddTHH:mm:ssZ`, truncated to whole seconds.
     */
    fun format(instant: Instant): String = DateTimeFormatter.ISO_INSTANT.format(instant.truncatedTo(ChronoUnit.SECONDS))

    /**
     * Parses either a `Z` suffixed instant or an offset form such as `+00:00`.
     */
    fun parse(text: String): Instant = try {
        OffsetDateTime.parse(text).toInstant()
    } catch (e: Exception) {
        Instant.parse(text)
    }

    /**
     * Parses [text] or returns null when it is not an ISO instant.
     */
    fun parseOrNull(text: String): Instant? = try {
        parse(text)
    } catch (e: Exception) {
        null
    }

    /**
     * Human-readable local rendering such as `25 Sep 2026 10:15 UTC`.
     */
    fun human(instant: Instant, zoneId: String): String {
        val zone = zoneOrUtc(zoneId)
        return humanFormatter.format(instant.atZone(zone)) + " " + zone.id.substringAfterLast('/')
    }

    /**
     * Renders elapsed minutes as `1d 04h 05m` / `04h 05m` / `05m`.
     */
    fun elapsed(minutes: Long): String {
        val safe = minutes.coerceAtLeast(0)
        val days = safe / (24 * 60)
        val hours = (safe % (24 * 60)) / 60
        val mins = safe % 60
        return when {
            days > 0 -> "%dd %02dh %02dm".format(days, hours, mins)
            hours > 0 -> "%02dh %02dm".format(hours, mins)
            else -> "%02dm".format(mins)
        }
    }

    /**
     * Resolves a zone id, falling back to UTC for unknown ids.
     */
    fun zoneOrUtc(zoneId: String): ZoneId = try {
        ZoneId.of(zoneId)
    } catch (e: Exception) {
        ZoneId.of("UTC")
    }
}
