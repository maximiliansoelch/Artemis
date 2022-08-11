import { FileUploadExercise } from 'app/entities/file-upload-exercise.model';
import { Course } from 'app/entities/course.model';
import { artemis } from '../../../support/ArtemisTesting';

// The user management object
const users = artemis.users;

// Requests
const courseManagement = artemis.requests.courseManagement;

// PageObjects
const fileUploadEditor = artemis.pageobjects.exercise.fileUpload.editor;
const courseOverview = artemis.pageobjects.course.overview;

describe('File upload exercise participation', () => {
    let course: Course;
    let exercise: FileUploadExercise;

    before(() => {
        cy.login(users.getAdmin());
        courseManagement.createCourse().then((response) => {
            course = response.body;
            courseManagement.addStudentToCourse(course, users.getStudentOne());
            courseManagement.createFileUploadExercise({ course }).then((exerciseResponse: Cypress.Response<FileUploadExercise>) => {
                exercise = exerciseResponse.body;
            });
        });
    });

    it('Creates a file upload exercise in the UI', () => {
        cy.login(users.getStudentOne(), `/courses/${course.id}/exercises`);
        courseOverview.startExercise(exercise.id!);
        courseOverview.openRunningExercise(exercise.id!);

        // Verify the initial state of the text editor
        fileUploadEditor.shouldShowExerciseTitleInHeader(exercise.title!);
        fileUploadEditor.shouldShowProblemStatement();

        // Make a submission
        fileUploadEditor.attachFile('pdf-test-file.pdf');
    });

    after(() => {
        if (!!course) {
            cy.login(users.getAdmin());
            courseManagement.deleteCourse(course.id!);
        }
    });
});
