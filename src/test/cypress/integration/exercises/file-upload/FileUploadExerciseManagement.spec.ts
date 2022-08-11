import { Interception } from 'cypress/types/net-stubbing';
import { FileUploadExercise } from 'app/entities/file-upload-exercise.model';
import { Course } from 'app/entities/course.model';
import { BASE_API } from '../../../support/constants';
import { DELETE } from '../../../support/constants';
import { generateUUID } from '../../../support/utils';
import { artemis } from '../../../support/ArtemisTesting';
import dayjs from 'dayjs/esm';

// The user management object
const users = artemis.users;

// Requests
const courseManagement = artemis.requests.courseManagement;

// PageObjects
const fileUploadCreation = artemis.pageobjects.exercise.fileUpload.creation;
const navigationBar = artemis.pageobjects.navigationBar;
const courseManagementPage = artemis.pageobjects.course.management;
const courseManagementExercises = artemis.pageobjects.course.managementExercises;

describe('File upload exercise management', () => {
    let course: Course;

    before(() => {
        cy.login(users.getAdmin());
        courseManagement.createCourse().then((response) => {
            course = response.body;
        });
    });

    it('Creates a file upload exercise in the UI', () => {
        cy.visit('/');
        navigationBar.openCourseManagement();
        courseManagementPage.openExercisesOfCourse(course.shortName!);
        cy.get('#create-file-upload-exercise').click();

        // Fill out file upload exercise form
        const exerciseTitle = 'file upload exercise' + generateUUID();
        fileUploadCreation.typeTitle(exerciseTitle);
        fileUploadCreation.setReleaseDate(dayjs());
        fileUploadCreation.setDueDate(dayjs().add(1, 'days'));
        fileUploadCreation.setAssessmentDueDate(dayjs().add(2, 'days'));
        fileUploadCreation.typeMaxPoints(10);
        const problemStatement = 'This is a problem statement';
        const exampleSolution = 'E = mc^2';
        fileUploadCreation.typeProblemStatement(problemStatement);
        fileUploadCreation.typeExampleSolution(exampleSolution);
        let exercise: FileUploadExercise;
        fileUploadCreation.create().then((request: Interception) => {
            exercise = request.response!.body;
        });

        // Make sure file upload exercise is shown in exercises list
        cy.visit(`course-management/${course.id}/exercises`).then(() => {
            courseManagementExercises.getExerciseRowRootElement(exercise.id!).should('be.visible');
        });
    });

    describe('File upload exercise deletion', () => {
        let exercise: FileUploadExercise;

        beforeEach(() => {
            cy.login(users.getAdmin(), '/');
            courseManagement.createFileUploadExercise({ course }).then((response: Cypress.Response<FileUploadExercise>) => {
                exercise = response.body;
            });
        });

        it('Deletes an existing file upload exercise', () => {
            navigationBar.openCourseManagement();
            courseManagementPage.openExercisesOfCourse(course.shortName!);
            courseManagementExercises.clickDeleteExercise(exercise.id!);
            cy.get('#confirm-exercise-name').type(exercise.title!);
            cy.intercept(DELETE, BASE_API + 'file-upload-exercises/*').as('deleteFileUploadExercise');
            cy.get('#delete').click();
            cy.wait('@deleteFileUploadExercise');
            courseManagementExercises.getExerciseRowRootElement(exercise.id!).should('not.exist');
        });
    });

    after(() => {
        if (!!course) {
            cy.login(users.getAdmin());
            courseManagement.deleteCourse(course.id!);
        }
    });
});
