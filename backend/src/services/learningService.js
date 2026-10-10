import { db } from '../database/db.js';

export class LearningService {
  /**
   * Retrieves overall learning dashboard analytics and per-topic progress.
   */
  static getDashboard() {
    const topicsProgress = db.prepare(`
      SELECT * FROM learning_progress
      ORDER BY last_studied_at DESC, id ASC
    `).all();

    const recentLogs = db.prepare(`
      SELECT * FROM learning_activity_logs
      ORDER BY created_at DESC
      LIMIT 15
    `).all();

    const recentQuizzes = db.prepare(`
      SELECT * FROM learning_quiz_attempts
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    // Calculate aggregated metrics
    let masteredCount = 0;
    let practicingCount = 0;
    let inProgressCount = 0;
    let totalLessons = 0;
    let totalIndependentSolved = 0;
    let totalWithSolutionSolved = 0;
    let totalHints = 0;
    let totalQuizAttempts = 0;
    let totalQuizPassed = 0;
    const topicsNeedingRevision = [];

    for (const t of topicsProgress) {
      if (t.status === 'mastered') masteredCount++;
      else if (t.status === 'practicing') practicingCount++;
      else if (t.status === 'in_progress') inProgressCount++;

      totalLessons += t.lessons_completed || 0;
      totalIndependentSolved += t.problems_solved_independently || 0;
      totalWithSolutionSolved += t.problems_solved_with_solution || 0;
      totalHints += t.hints_requested_count || 0;
      totalQuizAttempts += t.quiz_attempts || 0;
      totalQuizPassed += t.quiz_passed || 0;

      if (t.needs_revision === 1) {
        topicsNeedingRevision.push({
          topic_id: t.topic_id,
          topic_name: t.topic_name,
          last_quiz_score: t.last_quiz_score,
          last_studied_at: t.last_studied_at
        });
      }
    }

    // Determine recommended next activity
    let recommendedNext = null;
    if (topicsNeedingRevision.length > 0) {
      recommendedNext = {
        type: 'revision',
        topic_id: topicsNeedingRevision[0].topic_id,
        topic_name: topicsNeedingRevision[0].topic_name,
        reason: `Quiz score was ${topicsNeedingRevision[0].last_quiz_score}%. Reviewing mistakes will cement intuition.`
      };
    } else if (topicsProgress.length > 0) {
      const activeTopic = topicsProgress.find((t) => t.status === 'in_progress' || t.status === 'practicing');
      if (activeTopic) {
        recommendedNext = {
          type: 'practice',
          topic_id: activeTopic.topic_id,
          topic_name: activeTopic.topic_name,
          reason: `Continue practice in ${activeTopic.topic_name} to achieve concept mastery.`
        };
      }
    }

    if (!recommendedNext) {
      recommendedNext = {
        type: 'start_new',
        topic_id: 'arrays-strings',
        topic_name: 'Arrays & Strings',
        reason: 'Start with foundational array traversal, two-pointers, and string indexing.'
      };
    }

    return {
      success: true,
      summary: {
        total_tracked_topics: topicsProgress.length,
        mastered_topics: masteredCount,
        practicing_topics: practicingCount,
        in_progress_topics: inProgressCount,
        lessons_completed: totalLessons,
        problems_solved_independently: totalIndependentSolved,
        problems_solved_with_solution: totalWithSolutionSolved,
        hints_requested_count: totalHints,
        quizzes_taken: totalQuizAttempts,
        quizzes_passed: totalQuizPassed,
        topics_needing_revision: topicsNeedingRevision.length
      },
      recommended_next: recommendedNext,
      topics_needing_revision: topicsNeedingRevision,
      topics: topicsProgress,
      recent_activity: recentLogs,
      recent_quizzes: recentQuizzes
    };
  }

  /**
   * Records that a student started or completed a lesson for a topic.
   */
  static recordTopicLesson({ topicId, topicName = 'DSA Topic', documentId = null, documentName = null }) {
    if (!topicId) {
      throw new Error('topicId is required.');
    }

    const existing = db.prepare('SELECT * FROM learning_progress WHERE topic_id = ?').get(topicId);

    if (existing) {
      const newStatus = existing.status === 'not_started' ? 'in_progress' : existing.status;
      db.prepare(`
        UPDATE learning_progress
        SET status = ?,
            lessons_completed = lessons_completed + 1,
            last_studied_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE topic_id = ?
      `).run(newStatus, topicId);
    } else {
      db.prepare(`
        INSERT INTO learning_progress (topic_id, topic_name, status, lessons_completed, last_studied_at)
        VALUES (?, ?, 'in_progress', 1, CURRENT_TIMESTAMP)
      `).run(topicId, topicName);
    }

    // Log activity
    db.prepare(`
      INSERT INTO learning_activity_logs (activity_type, topic_id, document_id, document_name, details_json)
      VALUES ('lesson_view', ?, ?, ?, ?)
    `).run(
      topicId,
      documentId,
      documentName,
      JSON.stringify({ lesson_completed_at: new Date().toISOString() })
    );

    return { success: true };
  }

  /**
   * Records a hint request (progressive hint tier 1, 2, or 3).
   */
  static recordHintRequest({ topicId, topicName = 'DSA Topic', problemId = null, hintLevel = 1 }) {
    if (!topicId) return { success: false };

    const existing = db.prepare('SELECT * FROM learning_progress WHERE topic_id = ?').get(topicId);
    if (existing) {
      db.prepare(`
        UPDATE learning_progress
        SET hints_requested_count = hints_requested_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE topic_id = ?
      `).run(topicId);
    } else {
      db.prepare(`
        INSERT INTO learning_progress (topic_id, topic_name, status, hints_requested_count)
        VALUES (?, ?, 'in_progress', 1)
      `).run(topicId, topicName);
    }

    db.prepare(`
      INSERT INTO learning_activity_logs (activity_type, topic_id, problem_id, details_json)
      VALUES ('hint_requested', ?, ?, ?)
    `).run(
      topicId,
      problemId,
      JSON.stringify({ hint_level: hintLevel })
    );

    return { success: true };
  }

  /**
   * Records a problem attempt or solution view.
   */
  static recordProblemAttempt({
    topicId,
    topicName = 'DSA Topic',
    problemId,
    solved = false,
    independent = true,
    usedSolution = false,
    hintsCount = 0,
    errorDescription = null
  }) {
    if (!topicId) return { success: false };

    let existing = db.prepare('SELECT * FROM learning_progress WHERE topic_id = ?').get(topicId);
    if (!existing) {
      db.prepare(`
        INSERT INTO learning_progress (topic_id, topic_name, status)
        VALUES (?, ?, 'in_progress')
      `).run(topicId, topicName);
      existing = db.prepare('SELECT * FROM learning_progress WHERE topic_id = ?').get(topicId);
    }

    let mistakes = [];
    try {
      mistakes = JSON.parse(existing.mistakes_recorded || '[]');
    } catch {
      mistakes = [];
    }

    if (errorDescription && !mistakes.includes(errorDescription)) {
      mistakes.push(errorDescription);
      if (mistakes.length > 10) mistakes.shift(); // Keep latest 10
    }

    let indepInc = 0;
    let solInc = 0;
    if (solved) {
      if (independent && !usedSolution) {
        indepInc = 1;
      } else {
        solInc = 1;
      }
    }

    const newIndepTotal = (existing.problems_solved_independently || 0) + indepInc;
    const quizScore = existing.last_quiz_score || 0;

    // Mastery criterion: Must have >= 1 independently solved problem AND quiz score >= 80%
    let newStatus = existing.status;
    if (newIndepTotal >= 1 && quizScore >= 80) {
      newStatus = 'mastered';
    } else if (newStatus === 'not_started' || newStatus === 'in_progress') {
      newStatus = 'practicing';
    }

    db.prepare(`
      UPDATE learning_progress
      SET status = ?,
          problems_attempted = problems_attempted + 1,
          problems_solved_independently = problems_solved_independently + ?,
          problems_solved_with_solution = problems_solved_with_solution + ?,
          mistakes_recorded = ?,
          last_studied_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE topic_id = ?
    `).run(
      newStatus,
      indepInc,
      solInc,
      JSON.stringify(mistakes),
      topicId
    );

    db.prepare(`
      INSERT INTO learning_activity_logs (activity_type, topic_id, problem_id, passed, details_json)
      VALUES ('problem_attempt', ?, ?, ?, ?)
    `).run(
      topicId,
      problemId,
      solved ? 1 : 0,
      JSON.stringify({ independent, used_solution: usedSolution, hints_count: hintsCount })
    );

    return { success: true, status: newStatus };
  }

  /**
   * Records a quiz attempt and updates topic score and revision flags.
   */
  static recordQuizAttempt({
    topicId,
    topicName = 'DSA Topic',
    documentId = null,
    totalQuestions,
    correctAnswers,
    answers = []
  }) {
    if (!topicId || totalQuestions <= 0) {
      throw new Error('Valid topicId and positive totalQuestions are required.');
    }

    const scorePercent = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = scorePercent >= 70 ? 1 : 0;
    const needsRevision = scorePercent < 60 ? 1 : 0;

    let existing = db.prepare('SELECT * FROM learning_progress WHERE topic_id = ?').get(topicId);
    if (!existing) {
      db.prepare(`
        INSERT INTO learning_progress (topic_id, topic_name, status)
        VALUES (?, ?, 'in_progress')
      `).run(topicId, topicName);
      existing = db.prepare('SELECT * FROM learning_progress WHERE topic_id = ?').get(topicId);
    }

    const indepSolved = existing.problems_solved_independently || 0;
    let newStatus = existing.status;
    if (scorePercent >= 80 && indepSolved >= 1) {
      newStatus = 'mastered';
    } else if (newStatus === 'not_started' || newStatus === 'in_progress') {
      newStatus = 'practicing';
    }

    db.prepare(`
      UPDATE learning_progress
      SET status = ?,
          quiz_attempts = quiz_attempts + 1,
          quiz_passed = quiz_passed + ?,
          last_quiz_score = ?,
          needs_revision = ?,
          last_studied_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE topic_id = ?
    `).run(
      newStatus,
      passed,
      scorePercent,
      needsRevision,
      topicId
    );

    db.prepare(`
      INSERT INTO learning_quiz_attempts (topic_id, document_id, total_questions, correct_answers, score_percent, answers_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      topicId,
      documentId,
      totalQuestions,
      correctAnswers,
      scorePercent,
      JSON.stringify(answers)
    );

    db.prepare(`
      INSERT INTO learning_activity_logs (activity_type, topic_id, score, passed, details_json)
      VALUES ('quiz_attempt', ?, ?, ?, ?)
    `).run(
      topicId,
      scorePercent,
      passed,
      JSON.stringify({ correct: correctAnswers, total: totalQuestions })
    );

    return {
      success: true,
      score_percent: scorePercent,
      passed: Boolean(passed),
      needs_revision: Boolean(needsRevision),
      status: newStatus
    };
  }

  /**
   * Safely clears all learning progress and activity history without affecting documents or other modules.
   */
  static resetProgress() {
    db.prepare('DELETE FROM learning_progress').run();
    db.prepare('DELETE FROM learning_activity_logs').run();
    db.prepare('DELETE FROM learning_quiz_attempts').run();

    return {
      success: true,
      message: 'Learning progress and activity history successfully reset.'
    };
  }
}
