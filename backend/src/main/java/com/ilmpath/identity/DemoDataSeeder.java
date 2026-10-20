package com.ilmpath.identity;

import com.ilmpath.assessments.*;
import com.ilmpath.common.Slugs;
import com.ilmpath.courses.*;
import com.ilmpath.resources.Note;
import com.ilmpath.resources.NoteRepository;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Dev convenience (ILMPATH_SEED_DEMO=true): sample structure only. Videos are left empty; the admin adds approved URLs. */
@Component @Order(10)
public class DemoDataSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private final boolean enabled;
    private final CourseRepository courses; private final LessonRepository lessons; private final NoteRepository notes;
    private final QuizRepository quizzes; private final QuizQuestionRepository qq; private final QuizOptionRepository qo;
    private final UserRepository users; private final PasswordEncoder encoder;

    public DemoDataSeeder(@Value("${ilmpath.seed-demo}") boolean enabled, CourseRepository courses, LessonRepository lessons, NoteRepository notes,
                          QuizRepository quizzes, QuizQuestionRepository qq, QuizOptionRepository qo,
                          UserRepository users, PasswordEncoder encoder) {
        this.users = users; this.encoder = encoder;
        this.enabled = enabled; this.courses = courses; this.lessons = lessons; this.notes = notes; this.quizzes = quizzes; this.qq = qq; this.qo = qo;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) return;
        seedLearner("Demo Learner", "learner@ilmpath.test", Gender.MALE);
        seedLearner("Demo Sister", "learner.female@ilmpath.test", Gender.FEMALE);
        if (courses.count() > 0) return;
        String[][] data = {
            {"Usūl al-Thalāthah", "Beginner", "A structured study of the Three Fundamental Principles: knowing your Lord, your religion, and your Prophet ﷺ.",
                "Introduction", "The Meaning of Tawḥīd", "The Importance of Tawḥīd", "The Types of Shirk", "The Prophethood of Muhammad ﷺ", "The Hereafter"},
            {"Tafsīr of Juz ʿAmma", "Beginner", "Short surahs of the final juz explained simply, with a focus on meaning and reflection.",
                "Introduction to Tafsīr", "Sūrat al-Fātiḥah", "Sūrat al-Ikhlāṣ", "Sūrat al-Falaq and an-Nās"},
            {"Basic Fiqh", "Beginner", "Foundations of purification, prayer and everyday worship.",
                "Purification", "Wuḍū’", "The Prayer", "Fasting"},
            {"Seerah of the Prophet ﷺ", "Intermediate", "The life of the Prophet ﷺ in order, with lessons for our lives today.",
                "Arabia Before Islam", "The Birth and Early Life", "The First Revelation"},
        };
        int cp = 1;
        for (String[] d : data) {
            Course c = new Course(); c.setTitle(d[0]); c.setSlug(Slugs.of(d[0])); c.setLevel(d[1]); c.setDescription(d[2]);
            c.setStatus("PUBLISHED"); c.setPosition(cp++); courses.save(c);
            for (int i = 3; i < d.length; i++) {
                Lesson l = new Lesson(); l.setCourseId(c.getId()); l.setTitle(d[i]); l.setSlug(Slugs.of(d[i])); l.setPosition(i - 2);
                l.setDescription("Lesson " + (i - 2) + " of " + d[0] + ".");
                l.setStatus("PUBLISHED"); l.setPublishedAt(Instant.now()); lessons.save(l);
                if (cp == 2 && i == 4) seedQuizAndNotes(l);
            }
        }
        log.info("Demo content created (no videos; add YouTube URLs from the admin area).");
    }

    private void seedLearner(String name, String email, Gender gender) {
        if (users.existsByEmailIgnoreCase(email)) return;
        User u = new User(); u.setName(name); u.setEmail(email); u.setGender(gender);
        u.setPasswordHash(encoder.encode("Learner@12345")); u.setRole(Role.LEARNER); users.save(u);
    }

    private void seedQuizAndNotes(Lesson l) {
        Note n = new Note(); n.setLessonId(l.getId()); n.setCourseId(l.getCourseId()); n.setKind("NOTE"); n.setTitle("Key points");
        n.setBody("Tawḥīd means singling out Allah alone for worship."); n.setStatus("PUBLISHED"); notes.save(n);
        Note b = new Note(); b.setLessonId(l.getId()); b.setCourseId(l.getCourseId()); b.setKind("BENEFIT"); b.setTitle("A benefit");
        b.setBody("Sincerity (ikhlāṣ) is the condition for every act of worship to be accepted."); b.setStatus("PUBLISHED"); notes.save(b);

        Quiz q = new Quiz(); q.setLessonId(l.getId()); q.setTitle("Quiz: " + l.getTitle()); q.setInstructions("Answer all questions. Written answers are reviewed by the teacher.");
        q.setPassPercentage(60); q.setStatus("PUBLISHED"); quizzes.save(q);
        QuizQuestion a = new QuizQuestion(); a.setQuizId(q.getId()); a.setType("MCQ"); a.setPrompt("What is the main purpose of our creation?"); a.setPoints(1); a.setPosition(1); quizzesQ(a);
        String[] opts = {"To gain wealth and status", "To worship Allah alone", "To live a comfortable life", "To seek knowledge for the world only"};
        for (int i = 0; i < opts.length; i++) { QuizOption o = new QuizOption(); o.setQuizQuestionId(a.getId()); o.setText(opts[i]); o.setCorrect(i == 1); o.setPosition(i + 1); qo.save(o); }
        QuizQuestion w = new QuizQuestion(); w.setQuizId(q.getId()); w.setType("SHORT_ANSWER"); w.setPrompt("In your own words, what does Tawḥīd mean?"); w.setPoints(2);
        w.setPosition(2); w.setGradingMode("MANUAL"); w.setModelAnswer("Singling out Allah alone for worship."); quizzesQ(w);
    }

    private void quizzesQ(QuizQuestion x) { qq.save(x); }
}
