package com.ilmpath.identity;

import com.ilmpath.common.ApiException;

/** Central place that decides which gender group a request may see. Learners: their own group. Administrators: everything. */
public final class GenderScope {
    private GenderScope() {}

    /** Gender the current user is restricted to, or null for an administrator (no restriction). Throws if a learner has none. */
    public static Gender restrictedTo(User u) {
        if (u.getRole() == Role.ADMIN) return null;
        if (u.getGender() == null) throw ApiException.forbidden("Please choose your gender to continue");
        return u.getGender();
    }

    /** Strict variant for gender-specific spaces such as discussion rooms: administrators are handled by separate admin endpoints. */
    public static Gender requireLearnerGender(User u) {
        if (u.getRole() != Role.LEARNER) throw ApiException.forbidden("This area is for learners");
        return restrictedTo(u);
    }
}
