import { HttpClient } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { User } from 'app/core/user/user.model';
import { Exercise, ExerciseMode, ExerciseType } from 'app/entities/exercise.model';
import { InitializationState } from 'app/entities/participation/participation.model';
import { ProgrammingExerciseStudentParticipation } from 'app/entities/participation/programming-exercise-student-participation.model';
import { StudentParticipation } from 'app/entities/participation/student-participation.model';
import { ProgrammingExercise } from 'app/entities/programming-exercise.model';
import { QuizBatch, QuizExercise } from 'app/entities/quiz/quiz-exercise.model';
import { Result } from 'app/entities/result.model';
import { Team } from 'app/entities/team.model';
import { TextExercise } from 'app/entities/text-exercise.model';
import { CourseExerciseService } from 'app/exercises/shared/course-exercises/course-exercise.service';
import { ExerciseDetailsStudentActionsComponent } from 'app/overview/exercise-details/exercise-details-student-actions.component';
import { CloneRepoButtonComponent } from 'app/shared/components/clone-repo-button/clone-repo-button.component';
import { ExerciseActionButtonComponent } from 'app/shared/components/exercise-action-button.component';
import { ExtensionPointDirective } from 'app/shared/extension-point/extension-point.directive';
import { FeatureToggleDirective } from 'app/shared/feature-toggle/feature-toggle.directive';
import { ProfileInfo } from 'app/shared/layouts/profiles/profile-info.model';
import { ProfileService } from 'app/shared/layouts/profiles/profile.service';
import { ArtemisTranslatePipe } from 'app/shared/pipes/artemis-translate.pipe';
import dayjs from 'dayjs/esm';
import { MockComponent, MockDirective, MockPipe, MockProvider } from 'ng-mocks';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import { of, Subject } from 'rxjs';
import { MockRouterLinkDirective } from '../../../helpers/mocks/directive/mock-router-link.directive';
import { MockRouter } from '../../../helpers/mocks/mock-router';
import { MockCourseExerciseService } from '../../../helpers/mocks/service/mock-course-exercise.service';
import { MockSyncStorage } from '../../../helpers/mocks/service/mock-sync-storage.service';
import { ArtemisTestModule } from '../../../test.module';

describe('ExerciseDetailsStudentActionsComponent', () => {
    let comp: ExerciseDetailsStudentActionsComponent;
    let fixture: ComponentFixture<ExerciseDetailsStudentActionsComponent>;
    let debugElement: DebugElement;
    let courseExerciseService: CourseExerciseService;
    let profileService: ProfileService;
    let startExerciseStub: jest.SpyInstance;
    let resumeStub: jest.SpyInstance;
    let getProfileInfoSub: jest.SpyInstance;

    const team = { id: 1, students: [{ id: 99 } as User] } as Team;
    const programmingExercise: ProgrammingExercise = {
        id: 42,
        type: ExerciseType.PROGRAMMING,
        studentParticipations: [],
        numberOfAssessmentsOfCorrectionRounds: [],
        secondCorrectionEnabled: false,
        studentAssignedTeamIdComputed: false,
    };
    const teamExerciseWithoutTeamAssigned: ProgrammingExercise = {
        ...programmingExercise,
        mode: ExerciseMode.TEAM,
        teamMode: true,
        studentAssignedTeamIdComputed: true,
    };
    const teamExerciseWithTeamAssigned = { ...teamExerciseWithoutTeamAssigned, studentAssignedTeamId: team.id, allowOfflineIde: true } as ProgrammingExercise;

    beforeEach(() => {
        return TestBed.configureTestingModule({
            imports: [ArtemisTestModule],
            declarations: [
                ExerciseDetailsStudentActionsComponent,
                MockComponent(ExerciseActionButtonComponent),
                MockComponent(CloneRepoButtonComponent),
                MockPipe(ArtemisTranslatePipe),
                ExtensionPointDirective,
                MockRouterLinkDirective,
                MockDirective(FeatureToggleDirective),
            ],
            providers: [
                { provide: CourseExerciseService, useClass: MockCourseExerciseService },
                { provide: Router, useClass: MockRouter },
                MockProvider(HttpClient),
                { provide: LocalStorageService, useClass: MockSyncStorage },
                { provide: SessionStorageService, useClass: MockSyncStorage },
            ],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(ExerciseDetailsStudentActionsComponent);
                comp = fixture.componentInstance;
                debugElement = fixture.debugElement;
                courseExerciseService = debugElement.injector.get(CourseExerciseService);
                profileService = debugElement.injector.get(ProfileService);

                getProfileInfoSub = jest.spyOn(profileService, 'getProfileInfo');
                getProfileInfoSub.mockReturnValue(of({ inProduction: false, sshCloneURLTemplate: 'ssh://git@testserver.com:1234/' } as ProfileInfo));

                startExerciseStub = jest.spyOn(courseExerciseService, 'startExercise');
                resumeStub = jest.spyOn(courseExerciseService, 'resumeProgrammingExercise');
            });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should not show the buttons "Team" and "Start exercise" for a team exercise when not assigned to a team yet', fakeAsync(() => {
        comp.exercise = teamExerciseWithoutTeamAssigned;

        fixture.detectChanges();
        tick();

        const viewTeamButton = fixture.debugElement.query(By.css('.view-team'));
        expect(viewTeamButton).toBeNull();

        const startExerciseButton = fixture.debugElement.query(By.css('.start-exercise'));
        expect(startExerciseButton).toBeNull();
    }));

    it('should show the button "Team" for a team exercise for a student to view his team when assigned to a team', fakeAsync(() => {
        comp.exercise = teamExerciseWithTeamAssigned;

        fixture.detectChanges();
        tick();

        const viewTeamButton = fixture.debugElement.query(By.css('.view-team'));
        expect(viewTeamButton).not.toBeNull();
    }));

    it('should show the button "Start exercise" for a team exercise when assigned to a team', fakeAsync(() => {
        comp.exercise = teamExerciseWithTeamAssigned;

        fixture.detectChanges();
        tick();

        const startExerciseButton = fixture.debugElement.query(By.css('.start-exercise'));
        expect(startExerciseButton).not.toBeNull();
    }));

    it('should reflect the correct participation state when team exercise was started', fakeAsync(() => {
        const inactivePart = { id: 2, initializationState: InitializationState.UNINITIALIZED } as StudentParticipation;
        const initPart = { id: 2, initializationState: InitializationState.INITIALIZED } as StudentParticipation;
        const participationSubject = new Subject<StudentParticipation>();

        comp.exercise = teamExerciseWithTeamAssigned;
        startExerciseStub.mockReturnValue(participationSubject);
        comp.startExercise();
        participationSubject.next(inactivePart);

        fixture.detectChanges();
        tick();

        expect(startExerciseStub).toHaveBeenCalledOnce();
        participationSubject.next(initPart);

        fixture.detectChanges();
        tick();

        expect(comp.exercise?.studentParticipations?.[0].initializationState).toEqual(InitializationState.INITIALIZED);

        // Check that button "Start exercise" is no longer shown
        const startExerciseButton = fixture.debugElement.query(By.css('.start-exercise'));
        expect(startExerciseButton).toBeNull();

        // Check that button "Clone repository" is shown
        const cloneRepositoryButton = fixture.debugElement.query(By.css('jhi-clone-repo-button'));
        expect(cloneRepositoryButton).not.toBeNull();

        fixture.destroy();
        flush();
    }));

    it('should reflect the correct participation state for practice mode', fakeAsync(() => {
        const exercise = {
            id: 43,
            type: ExerciseType.PROGRAMMING,
            dueDate: dayjs().subtract(5, 'minutes'),
            allowOfflineIde: true,
            studentParticipations: [] as StudentParticipation[],
        } as ProgrammingExercise;
        const initPart = { id: 2, initializationState: InitializationState.INITIALIZED, testRun: true } as StudentParticipation;

        comp.exercise = exercise;

        fixture.detectChanges();
        tick();

        let startPracticeButton = fixture.debugElement.query(By.css('jhi-start-practice-mode-button'));
        expect(startPracticeButton).not.toBeNull();

        let cloneRepositoryButton = fixture.debugElement.query(By.css('jhi-clone-repo-button'));
        expect(cloneRepositoryButton).toBeNull();

        comp.exercise.studentParticipations = [initPart];
        comp.practiceParticipation = initPart;

        fixture.detectChanges();
        tick();

        startPracticeButton = fixture.debugElement.query(By.css('jhi-start-practice-mode-button'));
        expect(startPracticeButton).toBeNull();

        cloneRepositoryButton = fixture.debugElement.query(By.css('jhi-clone-repo-button'));
        expect(cloneRepositoryButton).not.toBeNull();

        fixture.destroy();
        flush();
    }));

    it('should correctly resume programming participation', () => {
        const inactiveParticipation: ProgrammingExerciseStudentParticipation = { id: 1, initializationState: InitializationState.INACTIVE };
        const activeParticipation: ProgrammingExerciseStudentParticipation = { id: 1, initializationState: InitializationState.INITIALIZED };
        const practiceParticipation: ProgrammingExerciseStudentParticipation = { id: 2, testRun: true, initializationState: InitializationState.INACTIVE };
        comp.exercise = { id: 3, studentParticipations: [inactiveParticipation, practiceParticipation] } as ProgrammingExercise;

        resumeStub.mockReturnValue(of(activeParticipation));

        comp.resumeProgrammingExercise(false);

        expect(comp.exercise.studentParticipations).toEqual([activeParticipation, practiceParticipation]);
    });

    it('should not allow to publish a build plan for text exercises', () => {
        comp.exercise = teamExerciseWithoutTeamAssigned;
        expect(comp.publishBuildPlanUrl()).toBeUndefined();
    });

    it('should disable the feedback request button', () => {
        const result: Result = { score: 50, rated: true };
        const participation: StudentParticipation = {
            results: [result],
            individualDueDate: undefined,
        };

        comp.exercise = { ...programmingExercise, allowManualFeedbackRequests: true };
        comp.studentParticipation = participation;

        expect(comp.isFeedbackRequestButtonDisabled()).toBeTrue();
    });

    it('should enable the feedback request button', () => {
        const result: Result = { score: 100, rated: true };
        const participation: StudentParticipation = {
            results: [result],
            individualDueDate: undefined,
        };

        comp.exercise = { ...programmingExercise, allowManualFeedbackRequests: true };
        comp.studentParticipation = participation;

        expect(comp.isFeedbackRequestButtonDisabled()).toBeFalse();
    });

    it('should show correct buttons in exam mode', fakeAsync(() => {
        const exercise = { type: ExerciseType.PROGRAMMING, allowOfflineIde: false, allowOnlineEditor: true } as ProgrammingExercise;
        exercise.studentParticipations = [{ initializationState: InitializationState.INITIALIZED } as StudentParticipation];
        comp.exercise = exercise;
        comp.examMode = true;

        fixture.detectChanges();
        tick();

        let startExerciseButton = debugElement.query(By.css('button.start-exercise'));
        expect(startExerciseButton).toBeNull();
        let codeEditorButton = debugElement.query(By.css('jhi-open-code-editor-button'));
        expect(codeEditorButton).toBeNull();
        let cloneRepoButton = debugElement.query(By.css('jhi-clone-repo-button'));
        expect(cloneRepoButton).toBeNull();

        exercise.allowOfflineIde = true;

        fixture.detectChanges();
        tick();

        startExerciseButton = debugElement.query(By.css('button.start-exercise'));
        expect(startExerciseButton).toBeNull();
        codeEditorButton = debugElement.query(By.css('jhi-open-code-editor-button'));
        expect(codeEditorButton).toBeNull();
        cloneRepoButton = debugElement.query(By.css('jhi-clone-repo-button'));
        expect(cloneRepoButton).not.toBeNull();
    }));

    // Quiz not supported yet
    it.each([ExerciseType.PROGRAMMING, ExerciseType.MODELING, ExerciseType.TEXT, ExerciseType.FILE_UPLOAD])(
        'should disable start exercise button before start date %s',
        fakeAsync((type: ExerciseType) => {
            const exercise = { type, releaseDate: dayjs().subtract(1, 'hour'), startDate: dayjs().add(1, 'hour') } as ProgrammingExercise;
            comp.exercise = exercise;

            fixture.detectChanges();
            tick();

            const startExerciseButton = debugElement.query(By.css('button.start-exercise'));
            expect(startExerciseButton).not.toBeNull();
            expect(startExerciseButton.componentInstance.overwriteDisabled).toBeTrue();
        }),
    );

    describe('onInit', () => {
        it('should determine if it is an uninitialized quiz', () => {
            comp.exercise = { type: ExerciseType.QUIZ, quizBatches: [{ started: false }, { started: true }] } as QuizExercise;
            comp.ngOnInit();
            expect(comp.uninitializedQuiz).toBeTrue();
            comp.exercise = { type: ExerciseType.QUIZ, quizBatches: [] as QuizBatch[] } as QuizExercise;
            comp.ngOnInit();
            expect(comp.uninitializedQuiz).toBeFalse();
            comp.exercise = { type: ExerciseType.TEXT } as TextExercise;
            comp.ngOnInit();
            expect(comp.uninitializedQuiz).toBeFalse();
        });

        it('should determine if quiz is not started', () => {
            comp.exercise = { type: ExerciseType.QUIZ, studentParticipations: [] as StudentParticipation[] } as QuizExercise;
            comp.ngOnInit();
            expect(comp.quizNotStarted).toBeTrue();
            comp.exercise = { type: ExerciseType.QUIZ, studentParticipations: [{ initializationState: InitializationState.UNINITIALIZED }] } as QuizExercise;
            comp.ngOnInit();
            expect(comp.quizNotStarted).toBeTrue();
            comp.exercise = { type: ExerciseType.QUIZ, studentParticipations: [{ initializationState: InitializationState.FINISHED }] } as QuizExercise;
            comp.ngOnInit();
            expect(comp.quizNotStarted).toBeFalse();
        });

        it('should determine participations', () => {
            const gradedParticipation = { id: 42 };
            const practiceParticipation = { id: 43, testRun: true };

            comp.studentParticipation = gradedParticipation;
            comp.exercise = {} as Exercise;
            comp.ngOnInit();
            expect(comp.gradedParticipation).toEqual(gradedParticipation);
            comp.studentParticipation = undefined;
            comp.exercise = { studentParticipations: [gradedParticipation, practiceParticipation] } as Exercise;
            comp.ngOnInit();
            expect(comp.gradedParticipation).toEqual(gradedParticipation);
            expect(comp.practiceParticipation).toEqual(practiceParticipation);
        });
    });
});
