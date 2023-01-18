package de.tum.in.www1.artemis.domain.notification;

import static de.tum.in.www1.artemis.domain.enumeration.NotificationPriority.*;
import static de.tum.in.www1.artemis.domain.notification.NotificationTargetFactory.*;
import static de.tum.in.www1.artemis.domain.notification.NotificationTitleTypeConstants.*;

import java.text.MessageFormat;
import java.util.Locale;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Component;

import de.tum.in.www1.artemis.domain.Course;
import de.tum.in.www1.artemis.domain.Exercise;
import de.tum.in.www1.artemis.domain.User;
import de.tum.in.www1.artemis.domain.enumeration.NotificationType;
import de.tum.in.www1.artemis.domain.metis.Post;
import de.tum.in.www1.artemis.domain.plagiarism.PlagiarismCase;
import de.tum.in.www1.artemis.domain.tutorialgroups.TutorialGroup;

@Component
public class SingleUserNotificationFactory {

    private static MessageSource messageSource;

    @Autowired
    public void setMessageSource(MessageSource messageSource) {
        SingleUserNotificationFactory.messageSource = messageSource;
    }

    /**
     * Creates an instance of SingleUserNotification.
     *
     * @param post which is answered
     * @param notificationType type of the notification that should be created
     * @param course that the post belongs to
     * @return an instance of SingleUserNotification
     */
    public static SingleUserNotification createNotification(Post post, NotificationType notificationType, Course course) {
        User recipient = post.getAuthor();
        Locale userLocale = Locale.forLanguageTag(recipient.getLangKey());
        String title;
        String text = messageSource.getMessage("notification.text.newReply", null, userLocale);
        SingleUserNotification notification;
        switch (notificationType) {
            case NEW_REPLY_FOR_EXERCISE_POST -> {
                title = messageSource.getMessage("notification.title.newReplyForExercisePost", null, userLocale);
                notification = new SingleUserNotification(recipient, title, text);
                notification.setTransientAndStringTarget(createExercisePostTarget(post, course));
            }
            case NEW_REPLY_FOR_LECTURE_POST -> {
                title = messageSource.getMessage("notification.title.newReplyForLecturePost", null, userLocale);
                notification = new SingleUserNotification(recipient, title, text);
                notification.setTransientAndStringTarget(createLecturePostTarget(post, course));
            }
            case NEW_REPLY_FOR_COURSE_POST -> {
                title = messageSource.getMessage("notification.title.newReplyForCoursePost", null, userLocale);
                notification = new SingleUserNotification(recipient, title, text);
                notification.setTransientAndStringTarget(createCoursePostTarget(post, course));
            }
            default -> throw new UnsupportedOperationException("Unsupported NotificationType: " + notificationType);
        }
        return notification;
    }

    /**
     * Creates an instance of SingleUserNotification.
     *
     * @param exercise for which a notification should be created
     * @param notificationType type of the notification that should be created
     * @param recipient who should be notified
     * @return an instance of SingleUserNotification
     */
    public static SingleUserNotification createNotification(Exercise exercise, NotificationType notificationType, User recipient) {
        Locale userLocale = Locale.forLanguageTag(recipient.getLangKey());
        String title;
        String notificationText;
        SingleUserNotification notification;
        switch (notificationType) {
            case EXERCISE_SUBMISSION_ASSESSED -> {
                title = messageSource.getMessage("notification.title.exerciseSubmissionAssessed", null, userLocale);
                notificationText = MessageFormat.format(messageSource.getMessage("notification.text.exerciseSubmissionAssessed", null, userLocale),
                        exercise.getExerciseType().getExerciseTypeAsReadableString(), exercise.getTitle());
            }
            case FILE_SUBMISSION_SUCCESSFUL -> {
                title = messageSource.getMessage("notification.title.fileSubmissionSuccessful", null, userLocale);
                notificationText = MessageFormat.format(messageSource.getMessage("notification.text.fileSubmissionSuccessful", null, userLocale), exercise.getTitle());
            }
            default -> throw new UnsupportedOperationException("Unsupported NotificationType: " + notificationType);
        }
        notification = new SingleUserNotification(recipient, title, notificationText);
        notification.setTransientAndStringTarget(createExerciseTarget(exercise, title));
        return notification;
    }

    /**
     * Creates an instance of SingleUserNotification based on plagiarisms.
     *
     * @param plagiarismCase that hold the major information for the plagiarism case
     * @param notificationType type of the notification that should be created
     * @param student who should be notified or is the author (depends if the student or instructor should be notified)
     * @param instructor who should be notified or is the author
     * @return an instance of SingleUserNotification
     */
    public static SingleUserNotification createNotification(PlagiarismCase plagiarismCase, NotificationType notificationType, User student, User instructor) {
        Locale userLocale = Locale.forLanguageTag(student.getLangKey());
        String title;
        String notificationText;
        SingleUserNotification notification;
        Long courseId;
        Exercise affectedExercise = plagiarismCase.getExercise();

        switch (notificationType) {
            case NEW_PLAGIARISM_CASE_STUDENT -> {
                title = messageSource.getMessage("notification.title.newPlagiarismCaseStudent", null, userLocale);
                notificationText = MessageFormat.format(messageSource.getMessage("notification.text.newPlagiarismCaseStudent", null, userLocale),
                        affectedExercise.getExerciseType().toString().toLowerCase(), affectedExercise.getTitle());
            }
            case PLAGIARISM_CASE_VERDICT_STUDENT -> {
                title = messageSource.getMessage("notification.title.plagiarismCaseVerdictStudent", null, userLocale);
                notificationText = MessageFormat.format(messageSource.getMessage("notification.text.plagiarismCaseVerdictStudent", null, userLocale),
                        affectedExercise.getExerciseType().toString().toLowerCase(), affectedExercise.getTitle());
            }
            default -> throw new UnsupportedOperationException("Unsupported NotificationType: " + notificationType);
        }

        courseId = affectedExercise.getCourseViaExerciseGroupOrCourseMember().getId();

        notification = new SingleUserNotification(student, title, notificationText);
        notification.setPriority(HIGH);
        notification.setAuthor(instructor);
        notification.setTransientAndStringTarget(createPlagiarismCaseTarget(plagiarismCase.getId(), courseId));
        return notification;
    }

    /**
     * Creates an instance of SingleUserNotification for tutorial groups.
     *
     * @param tutorialGroup        to which the notification is related
     * @param notificationType     type of the notification that should be created
     * @param users                who should be notified or are related to the notification
     * @param responsibleForAction the user who is responsible for the action that triggered the notification
     * @return an instance of SingleUserNotification
     */
    public static SingleUserNotification createNotification(TutorialGroup tutorialGroup, NotificationType notificationType, Set<User> users, User responsibleForAction) {
        var title = findCorrespondingNotificationTitleOrThrow(notificationType);
        if (users.isEmpty()) {
            throw new IllegalArgumentException("No users provided for notification");
        }
        SingleUserNotification notification;
        switch (notificationType) {
            case TUTORIAL_GROUP_REGISTRATION_STUDENT -> {
                var student = users.stream().findAny().orElseThrow();
                notification = new SingleUserNotification(student, title,
                        "You have been registered to the tutorial group " + tutorialGroup.getTitle() + " by " + responsibleForAction.getName() + ".");
                notification.setTransientAndStringTarget(createTutorialGroupTarget(tutorialGroup, tutorialGroup.getCourse().getId(), false, true));
            }
            case TUTORIAL_GROUP_DEREGISTRATION_STUDENT -> {
                var student = users.stream().findAny().orElseThrow();
                notification = new SingleUserNotification(student, title,
                        "You have been deregistered from the tutorial group " + tutorialGroup.getTitle() + " by " + responsibleForAction.getName() + ".");
                notification.setTransientAndStringTarget(createTutorialGroupTarget(tutorialGroup, tutorialGroup.getCourse().getId(), false, true));
            }
            case TUTORIAL_GROUP_REGISTRATION_TUTOR -> {
                if (tutorialGroup.getTeachingAssistant() == null) {
                    throw new IllegalArgumentException("The tutorial group " + tutorialGroup.getTitle() + " does not have a tutor to which a notification could be sent.");
                }
                var student = users.stream().findAny();
                var studentName = student.isPresent() ? student.get().getName() : "";

                notification = new SingleUserNotification(tutorialGroup.getTeachingAssistant(), title,
                        "The student " + studentName + " has been registered to your tutorial group " + tutorialGroup.getTitle() + " by " + responsibleForAction.getName() + ".");
                notification.setTransientAndStringTarget(createTutorialGroupTarget(tutorialGroup, tutorialGroup.getCourse().getId(), true, true));
            }
            case TUTORIAL_GROUP_DEREGISTRATION_TUTOR -> {
                if (tutorialGroup.getTeachingAssistant() == null) {
                    throw new IllegalArgumentException("The tutorial group " + tutorialGroup.getTitle() + " does not have a tutor to which a notification could be sent.");
                }

                var student = users.stream().findAny();
                var studentName = student.isPresent() ? student.get().getName() : "";

                notification = new SingleUserNotification(tutorialGroup.getTeachingAssistant(), title, "The student " + studentName
                        + " has been deregistered from your tutorial group " + tutorialGroup.getTitle() + " by " + responsibleForAction.getName() + ".");
                notification.setTransientAndStringTarget(createTutorialGroupTarget(tutorialGroup, tutorialGroup.getCourse().getId(), true, true));
            }
            case TUTORIAL_GROUP_MULTIPLE_REGISTRATION_TUTOR -> {
                if (tutorialGroup.getTeachingAssistant() == null) {
                    throw new IllegalArgumentException("The tutorial group " + tutorialGroup.getTitle() + " does not have a tutor to which a notification could be sent.");
                }
                notification = new SingleUserNotification(tutorialGroup.getTeachingAssistant(), title,
                        users.size() + " students have been registered to your tutorial group " + tutorialGroup.getTitle() + " by " + responsibleForAction.getName() + ".");

                notification.setTransientAndStringTarget(createTutorialGroupTarget(tutorialGroup, tutorialGroup.getCourse().getId(), true, true));
            }
            case TUTORIAL_GROUP_ASSIGNED -> {
                var tutorToContact = users.stream().findAny().get();
                notification = new SingleUserNotification(tutorToContact, title,
                        "You have been assigned to lead the tutorial group " + tutorialGroup.getTitle() + " by " + responsibleForAction.getName() + ".");
                notification.setTransientAndStringTarget(createTutorialGroupTarget(tutorialGroup, tutorialGroup.getCourse().getId(), true, true));
            }
            case TUTORIAL_GROUP_UNASSIGNED -> {
                var tutorToContact = users.stream().findAny().get();
                notification = new SingleUserNotification(tutorToContact, title,
                        "You have been unassigned from leading the tutorial group " + tutorialGroup.getTitle() + " by " + responsibleForAction.getName() + ".");
                notification.setTransientAndStringTarget(createTutorialGroupTarget(tutorialGroup, tutorialGroup.getCourse().getId(), true, true));
            }
            default -> throw new UnsupportedOperationException("Unsupported NotificationType: " + notificationType);
        }
        return notification;
    }

}
