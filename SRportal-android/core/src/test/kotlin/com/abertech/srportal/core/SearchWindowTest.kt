package com.abertech.srportal.core

import java.time.Instant
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class SearchWindowTest {
    private val now: Instant = Instant.parse("2026-09-25T12:00:00Z")

    @Test
    fun elapsedIsNowMinusLastSeen() {
        val lastSeen = Instant.parse("2026-09-25T09:30:00Z")
        assertEquals(150L, SearchWindowCalculator.elapsedMinutes(lastSeen, now))
        val window = SearchWindowCalculator.compute(lastSeen, now)
        assertEquals("2026-09-25T09:30:00Z", window.lastSeenUtc)
        assertEquals("2026-09-25T12:00:00Z", window.nowUtc)
    }

    @Test
    fun futureLastSeenClampsToZeroAndIsFlagged() {
        val lastSeen = now.plusSeconds(3_600)
        assertEquals(0L, SearchWindowCalculator.elapsedMinutes(lastSeen, now))
        assertTrue(SearchWindowCalculator.isInFuture(lastSeen, now))
        assertFalse(SearchWindowCalculator.isInFuture(now, now))
    }

    @Test
    fun timeFormatParsesOffsetsAndZulu() {
        assertEquals(now, TimeFormat.parse("2026-09-25T12:00:00Z"))
        assertEquals(now, TimeFormat.parse("2026-09-25T13:00:00+01:00"))
        assertEquals("2026-09-25T12:00:00Z", TimeFormat.format(now.plusMillis(450)))
        assertEquals("1d 02h 05m", TimeFormat.elapsed(24 * 60 + 125))
        assertEquals("02h 05m", TimeFormat.elapsed(125))
        assertEquals("07m", TimeFormat.elapsed(7))
    }
}
