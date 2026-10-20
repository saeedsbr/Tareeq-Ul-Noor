package com.ilmpath.progress;

import com.ilmpath.courses.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ProgressService {
    public record Counts(int total, int done) {
        /** completed published lessons / total published lessons * 100; 0 when nothing is published. */
        public int percent() { return total == 0 ? 0 : (int) Math.round(done * 100.0 / total); }
    }

    private final LessonRepository lessons;
    private final LessonCompletionRepository completions;

    public ProgressService(LessonRepository lessons, LessonCompletionRepository completions) {
        this.lessons = lessons; this.completions = completions;
    }

    /** Published-lesson totals per course, plus the user's completions when userId != null. */
    public Map<Long, Counts> countsFor(Collection<Long> courseIds, String userId) {
        Map<Long, Counts> out = new HashMap<>();
        if (courseIds.isEmpty()) return out;
        List<Lesson> all = lessons.findByCourseIdInAndStatus(courseIds, "PUBLISHED");
        Set<Long> done = new HashSet<>();
        if (userId != null && !all.isEmpty())
            done.addAll(completions.completedAmong(userId, all.stream().map(Lesson::getId).toList()));
        Map<Long, List<Lesson>> byCourse = all.stream().collect(Collectors.groupingBy(Lesson::getCourseId));
        for (Long cid : courseIds) {
            List<Lesson> ls = byCourse.getOrDefault(cid, List.of());
            out.put(cid, new Counts(ls.size(), (int) ls.stream().filter(l -> done.contains(l.getId())).count()));
        }
        return out;
    }
}
