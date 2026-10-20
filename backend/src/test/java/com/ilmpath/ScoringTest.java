package com.ilmpath;

import static org.junit.jupiter.api.Assertions.*;

import com.ilmpath.assessments.AssessmentService;
import com.ilmpath.common.ApiException;
import com.ilmpath.common.VideoUrls;
import com.ilmpath.progress.ProgressService;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class ScoringTest {
    @Test void percentage() { assertEquals(new BigDecimal("80.00"), AssessmentService.percentage(4, 5)); }
    @Test void zeroPossibleRejected() { assertThrows(ApiException.class, () -> AssessmentService.percentage(0, 0)); }
    @Test void progressPercent() {
        assertEquals(42, new ProgressService.Counts(12, 5).percent());
        assertEquals(0, new ProgressService.Counts(0, 0).percent());
    }
    @Test void youtubeAllowlist() {
        assertEquals("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", VideoUrls.normalizeYoutube("https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
        assertThrows(ApiException.class, () -> VideoUrls.normalizeYoutube("https://evil.example/watch?v=abcdefghijk"));
    }
}
