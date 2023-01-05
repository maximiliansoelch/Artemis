package de.tum.in.www1.artemis.domain;

import static de.tum.in.www1.artemis.domain.enumeration.ExerciseType.TEXT;

import java.util.List;

import org.hibernate.annotations.CacheConcurrencyStrategy;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonTypeName;

import de.tum.in.www1.artemis.domain.enumeration.AssessmentType;
import de.tum.in.www1.artemis.domain.enumeration.ExerciseType;
import jakarta.persistence.*;

/**
 * A TextExercise.
 */
@Entity
@DiscriminatorValue(value = "T")
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
@JsonTypeName("text")
@SecondaryTable(name = "text_exercise_details")
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class TextExercise extends Exercise {

    // used to distinguish the type when used in collections (e.g. SearchResultPageDTO --> resultsOnPage)
    public String getType() {
        return "text";
    }

    @Column(name = "example_solution")
    private String exampleSolution;

    @OneToMany(mappedBy = "exercise", cascade = CascadeType.REMOVE)
    @JsonIgnore
    private List<TextCluster> clusters;

    public String getExampleSolution() {
        return exampleSolution;
    }

    public void setExampleSolution(String exampleSolution) {
        this.exampleSolution = exampleSolution;
    }

    public boolean isAutomaticAssessmentEnabled() {
        return getAssessmentType() == AssessmentType.SEMI_AUTOMATIC;
    }

    /**
     * set all sensitive information to null, so no info with respect to the solution gets leaked to students through json
     */
    @Override
    public void filterSensitiveInformation() {
        if (!isExampleSolutionPublished()) {
            setExampleSolution(null);
        }
        super.filterSensitiveInformation();
    }

    @Override
    @JsonIgnore
    public ExerciseType getExerciseType() {
        return TEXT;
    }

    @Override
    public String toString() {
        return "TextExercise{" + "id=" + getId() + ", exampleSolution='" + getExampleSolution() + "'" + "}";
    }
}
