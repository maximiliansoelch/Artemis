import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { TextExercise } from 'app/entities/text-exercise.model';
import { TextExerciseImportComponent } from 'app/exercises/text/manage/text-exercise-import.component';
import { TextExercisePagingService } from 'app/exercises/text/manage/text-exercise/text-exercise-paging.service';
import { ArtemisTranslatePipe } from 'app/shared/pipes/artemis-translate.pipe';
import { SortService } from 'app/shared/service/sort.service';
import { SortByDirective } from 'app/shared/sort/sort-by.directive';
import { SortDirective } from 'app/shared/sort/sort.directive';
import { SearchResult } from 'app/shared/table/pageable-table';
import { MockComponent, MockDirective, MockModule, MockPipe, MockProvider } from 'ng-mocks';
import { Subject, of } from 'rxjs';
import { ArtemisTestModule } from '../../test.module';

describe('TextExercise Import Component', () => {
    let comp: TextExerciseImportComponent;
    let fixture: ComponentFixture<TextExerciseImportComponent>;
    let sortService: SortService;
    let pagingService: TextExercisePagingService;
    let activeModal: NgbActiveModal;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ArtemisTestModule, MockModule(FormsModule), MockComponent(NgbPagination)],
            declarations: [TextExerciseImportComponent, MockPipe(ArtemisTranslatePipe), MockDirective(SortByDirective), MockDirective(SortDirective)],
            providers: [MockProvider(SortService), MockProvider(TextExercisePagingService), MockProvider(NgbActiveModal)],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(TextExerciseImportComponent);
                comp = fixture.componentInstance;
                sortService = fixture.debugElement.injector.get(SortService);
                pagingService = fixture.debugElement.injector.get(TextExercisePagingService);
                activeModal = TestBed.inject(NgbActiveModal);
            });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should initialize the subjects', () => {
        // GIVEN
        const searchSpy = jest.spyOn(comp, 'performSearch' as any);

        // WHEN
        fixture.detectChanges();

        // THEN
        expect(searchSpy).toHaveBeenCalledTimes(2);
        expect(searchSpy).toHaveBeenCalledWith(expect.any(Subject), 0, expect.any(TextExercisePagingService));
        expect(searchSpy).toHaveBeenCalledWith(expect.any(Subject), 300, expect.any(TextExercisePagingService));
    });

    it('should initialize the content', () => {
        // WHEN
        fixture.detectChanges();

        // THEN
        expect(comp.content).toEqual({ resultsOnPage: [], numberOfPages: 0 });
    });

    it('should close the active modal', () => {
        // GIVEN
        const activeModalSpy = jest.spyOn(activeModal, 'dismiss');

        // WHEN
        comp.clear();

        // THEN
        expect(activeModalSpy).toHaveBeenCalledOnce();
        expect(activeModalSpy).toHaveBeenCalledWith('cancel');
    });

    it('should close the active modal with result', () => {
        // GIVEN
        const activeModalSpy = jest.spyOn(activeModal, 'close');
        const exercise = { id: 1 } as TextExercise;
        // WHEN
        comp.openImport(exercise);

        // THEN
        expect(activeModalSpy).toHaveBeenCalledOnce();
        expect(activeModalSpy).toHaveBeenCalledWith(exercise);
    });

    it('should change the page on active modal', fakeAsync(() => {
        const defaultPageSize = 10;
        const numberOfPages = 5;
        const pagingServiceSpy = jest.spyOn(pagingService, 'searchForExercises');
        pagingServiceSpy.mockReturnValue(of({ numberOfPages } as SearchResult<TextExercise>));

        fixture.detectChanges();

        let expectedPageNumber = 1;
        comp.onPageChange(expectedPageNumber);
        tick();
        expect(comp.page).toBe(expectedPageNumber);
        expect(comp.total).toBe(numberOfPages * defaultPageSize);

        expectedPageNumber = 2;
        comp.onPageChange(expectedPageNumber);
        tick();
        expect(comp.page).toBe(expectedPageNumber);
        expect(comp.total).toBe(numberOfPages * defaultPageSize);

        // Page number should be changed unless it is falsy.
        comp.onPageChange(0);
        tick();
        expect(comp.page).toBe(expectedPageNumber);

        // Number of times onPageChange is called with a truthy value.
        expect(pagingServiceSpy).toHaveBeenCalledTimes(2);
    }));

    it('should sort rows with default values', () => {
        const sortServiceSpy = jest.spyOn(sortService, 'sortByProperty');

        fixture.detectChanges();
        comp.sortRows();

        expect(sortServiceSpy).toHaveBeenCalledOnce();
        expect(sortServiceSpy).toHaveBeenCalledWith([], comp.column.ID, false);
    });

    it('should set search term and search', fakeAsync(() => {
        const pagingServiceSpy = jest.spyOn(pagingService, 'searchForExercises');
        pagingServiceSpy.mockReturnValue(of({ numberOfPages: 3 } as SearchResult<TextExercise>));

        fixture.detectChanges();

        const expectedSearchTerm = 'search term';
        comp.searchTerm = expectedSearchTerm;
        tick();
        expect(comp.searchTerm).toBe(expectedSearchTerm);

        // It should wait first before executing search.
        expect(pagingServiceSpy).not.toHaveBeenCalled();

        tick(300);

        expect(pagingServiceSpy).toHaveBeenCalledOnce();
    }));

    it('should switch courseFilter/examFilter and search', fakeAsync(() => {
        const pagingServiceSpy = jest.spyOn(pagingService, 'searchForExercises');
        pagingServiceSpy.mockReturnValue(of({ numberOfPages: 3 } as SearchResult<TextExercise>));

        fixture.detectChanges();
        expect(comp.isCourseFilter).toBeTrue();
        expect(comp.isExamFilter).toBeTrue();

        comp.onCourseFilterChange();
        comp.onExamFilterChange();
        tick();
        expect(comp.isCourseFilter).toBeFalse();
        expect(comp.isExamFilter).toBeFalse();

        expect(pagingServiceSpy).not.toHaveBeenCalled();
        tick(300);

        const expectedSearchObject = {
            page: 1,
            pageSize: 10,
            searchTerm: '',
            sortedColumn: 'ID',
            sortingOrder: 'DESCENDING',
        };
        expect(pagingServiceSpy).toHaveBeenCalledWith(expectedSearchObject, false, false);
    }));
});
