import test from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app.js';
import { LearningService } from '../src/services/learningService.js';

test('Learning Progress Service & Persistence Test', async (t) => {
  // Initialize app to ensure schema is initialized
  createApp();

  // Reset any prior state for a clean test
  LearningService.resetProgress();

  await t.test('Initial dashboard starts clean with sensible next activity', () => {
    const dash = LearningService.getDashboard();
    assert.ok(dash.success);
    assert.strictEqual(dash.summary.total_tracked_topics, 0);
    assert.strictEqual(dash.summary.mastered_topics, 0);
    assert.ok(dash.recommended_next);
    assert.strictEqual(dash.recommended_next.type, 'start_new');
  });

  await t.test('recordTopicLesson creates in_progress topic record and activity log', () => {
    const res = LearningService.recordTopicLesson({
      topicId: 'arrays',
      topicName: 'Arrays',
      documentId: 1,
      documentName: 'DSA_Handbook.pdf'
    });
    assert.ok(res.success);

    const dash = LearningService.getDashboard();
    assert.strictEqual(dash.summary.in_progress_topics, 1);
    assert.strictEqual(dash.summary.lessons_completed, 1);
    assert.strictEqual(dash.topics[0].topic_id, 'arrays');
    assert.strictEqual(dash.topics[0].status, 'in_progress');
  });

  await t.test('recordHintRequest increments hints count', () => {
    LearningService.recordHintRequest({
      topicId: 'arrays',
      topicName: 'Arrays',
      problemId: 'two-sum',
      hintLevel: 1
    });

    const dash = LearningService.getDashboard();
    assert.strictEqual(dash.summary.hints_requested_count, 1);
    assert.strictEqual(dash.topics[0].hints_requested_count, 1);
  });

  await t.test('recordQuizAttempt computes score and sets needs_revision when low', () => {
    const res = LearningService.recordQuizAttempt({
      topicId: 'arrays',
      topicName: 'Arrays',
      totalQuestions: 5,
      correctAnswers: 2, // 40% -> needs revision
      answers: ['optA', 'optB']
    });

    assert.ok(res.success);
    assert.strictEqual(res.score_percent, 40);
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.needs_revision, true);

    const dash = LearningService.getDashboard();
    assert.strictEqual(dash.summary.topics_needing_revision, 1);
    assert.strictEqual(dash.recommended_next.type, 'revision');
    assert.strictEqual(dash.recommended_next.topic_id, 'arrays');
  });

  await t.test('recordProblemAttempt does not mark mastered without independent solve and high quiz score', () => {
    // Problem solved WITH solution
    LearningService.recordProblemAttempt({
      topicId: 'arrays',
      topicName: 'Arrays',
      problemId: 'two-sum',
      solved: true,
      independent: false,
      usedSolution: true
    });

    let dash = LearningService.getDashboard();
    assert.strictEqual(dash.summary.mastered_topics, 0);
    assert.strictEqual(dash.summary.problems_solved_with_solution, 1);

    // Problem solved INDEPENDENTLY but quiz score is still 40% (< 80%)
    LearningService.recordProblemAttempt({
      topicId: 'arrays',
      topicName: 'Arrays',
      problemId: 'two-sum',
      solved: true,
      independent: true,
      usedSolution: false
    });

    dash = LearningService.getDashboard();
    assert.strictEqual(dash.summary.mastered_topics, 0); // Not yet mastered
    assert.strictEqual(dash.summary.problems_solved_independently, 1);

    // Now student retakes quiz and scores 100% -> should become MASTERED
    const quizRetake = LearningService.recordQuizAttempt({
      topicId: 'arrays',
      topicName: 'Arrays',
      totalQuestions: 5,
      correctAnswers: 5 // 100%
    });
    assert.strictEqual(quizRetake.status, 'mastered');

    dash = LearningService.getDashboard();
    assert.strictEqual(dash.summary.mastered_topics, 1);
    assert.strictEqual(dash.summary.topics_needing_revision, 0);
  });

  await t.test('resetProgress clears all learning data safely', () => {
    const res = LearningService.resetProgress();
    assert.ok(res.success);

    const dash = LearningService.getDashboard();
    assert.strictEqual(dash.summary.total_tracked_topics, 0);
    assert.strictEqual(dash.summary.mastered_topics, 0);
    assert.strictEqual(dash.recent_activity.length, 0);
  });
});
