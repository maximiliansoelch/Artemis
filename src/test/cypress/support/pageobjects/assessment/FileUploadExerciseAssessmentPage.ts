import { PUT, BASE_API } from '../../constants';
import { CypressExerciseType } from '../../requests/CourseManagementRequests';
import { AbstractExerciseAssessmentPage } from './AbstractExerciseAssessmentPage';

/**
 * A class which encapsulates UI selectors and actions for the file upload exercise assessment page.
 */
export class FileUploadExerciseAssessmentPage extends AbstractExerciseAssessmentPage {
    getInstructionsRootElement() {
        return cy.get('#instructions-card');
    }

    submitFeedback() {
        cy.get('#submit').click();
    }

    rejectComplaint(response: string) {
        return super.rejectComplaint(response, CypressExerciseType.UPLOAD);
    }

    acceptComplaint(response: string) {
        return super.acceptComplaint(response, CypressExerciseType.UPLOAD);
    }
}
