import { Interception } from 'cypress/types/net-stubbing';
import { FileUploadExercise } from 'app/entities/file-upload-exercise.model';
import { Course } from 'app/entities/course.model';
import { artemis } from 'src/test/cypress/support/ArtemisTesting';

// The user management object
const users = artemis.users;
const student = users.getStudentOne();
const tutor = users.getTutor();
const admin = users.getAdmin();
const instructor = users.getInstructor();

// Requests
const courseManagement = artemis.requests.courseManagement;

// PageObjects
const coursesPage = artemis.pageobjects.course.management;
const courseOverview = artemis.pageobjects.course.overview;
const courseAssessment = artemis.pageobjects.assessment.course;
const exerciseAssessment = artemis.pageobjects.assessment.exercise;
const fileUploadAssessment = artemis.pageobjects.assessment.fileUpload;
const fileUpload = artemis.pageobjects.exercise.fileUpload.editor;
const exerciseResult = artemis.pageobjects.exercise.result;
const fileUploadFeedback = artemis.pageobjects.exercise.fileUpload.feedback;

describe('File upload exercise assessment', () => {
    let course: Course;
    let exercise: FileUploadExercise;
    const tutorFeedback = 'Try to format the file correctly!';
    const tutorFeedbackPoints = 4;
    const complaint = "That feedback wasn't very useful!";

    before('Creates a file upload exercise and makes a student submission', () => {
        createCourseWithFileUploadExercise().then(() => {
            makeFileUploadSubmissionAsStudent();
        });
    });

    after(() => {
        if (!!course) {
            cy.login(users.getAdmin());
            courseManagement.deleteCourse(course.id!);
        }
    });

    it('Assesses the file upload exercise submission', () => {
        cy.login(tutor, '/course-management');
        coursesPage.openAssessmentDashboardOfCourse(course.shortName!);
        courseAssessment.clickExerciseDashboardButton();
        exerciseAssessment.clickHaveReadInstructionsButton();
        exerciseAssessment.clickStartNewAssessment();
        fileUploadAssessment.getInstructionsRootElement().contains(exercise.title!).should('be.visible');
        fileUploadAssessment.getInstructionsRootElement().contains(exercise.problemStatement!).should('be.visible');
        fileUploadAssessment.getInstructionsRootElement().contains(exercise.exampleSolution!).should('be.visible');
        fileUploadAssessment.getInstructionsRootElement().contains(exercise.gradingInstructions!).should('be.visible');
        fileUploadAssessment.addNewFeedback(tutorFeedbackPoints, tutorFeedback);
        fileUploadAssessment.submitFeedback();
    });

    describe('Feedback', () => {
        it('Student sees feedback after assessment due date and complains', () => {
            cy.login(student, `/courses/${course.id}/exercises/${exercise.id}`);
            const percentage = tutorFeedbackPoints * 10;
            exerciseResult.shouldShowExerciseTitle(exercise.title!);
            exerciseResult.shouldShowProblemStatement(exercise.problemStatement!);
            exerciseResult.shouldShowScore(percentage);
            exerciseResult.clickResultSubmission();
            fileUploadFeedback.shouldShowAdditionalFeedback(tutorFeedbackPoints, tutorFeedback);
            fileUploadFeedback.shouldShowScore(tutorFeedbackPoints, exercise.maxPoints!, percentage);
            fileUploadFeedback.complain(complaint);
        });

        it('Instructor can see complaint and reject it', () => {
            cy.login(instructor, `/course-management/${course.id}/complaints`);
            fileUploadAssessment.acceptComplaint('Makes sense').its('response.statusCode').should('eq', 200);
        });
    });

    function createCourseWithFileUploadExercise() {
        cy.login(admin);
        return courseManagement.createCourse().then((response) => {
            course = response.body;
            courseManagement.addStudentToCourse(course, student);
            courseManagement.addTutorToCourse(course, tutor);
            courseManagement.addInstructorToCourse(course, instructor);
            courseManagement.createFileUploadExercise({ course }).then((textResponse) => {
                exercise = textResponse.body;
            });
        });
    }

    function makeFileUploadSubmissionAsStudent() {
        cy.login(student, `/courses/${course.id}/exercises`);
        courseOverview.startExercise(exercise.id!);
        courseOverview.openRunningExercise(exercise.id!);
        fileUpload.attachFile('pdf-test-file.pdf');
    }
});
