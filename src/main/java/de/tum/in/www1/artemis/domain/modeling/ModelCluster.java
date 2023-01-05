package de.tum.in.www1.artemis.domain.modeling;

import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import de.tum.in.www1.artemis.domain.DomainObject;
import jakarta.persistence.*;

/**
 * A ModelCluster.
 */
@Entity
@Table(name = "model_cluster")
// @Cache(usage = CacheConcurrencyStrategy.NONSTRICT_READ_WRITE)
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class ModelCluster extends DomainObject {

    @Column(name = "minimum_similarity", nullable = false)
    private double minimumSimilarity;

    @Column(name = "modelElementType", nullable = false)
    // TODO: we might want to use an enum here
    private String modelElementType;

    @OneToMany(mappedBy = "cluster")
    @JsonIgnoreProperties("cluster")
    private Set<ModelElement> modelElements = new HashSet<>();

    @ManyToOne
    @JsonIgnore
    private ModelingExercise exercise;

    public double getMinimumSimilarity() {
        return minimumSimilarity;
    }

    public void setMinimumSimilarity(double minimumSimilarity) {
        this.minimumSimilarity = minimumSimilarity;
    }

    public String getModelElementType() {
        return modelElementType;
    }

    public void setModelElementType(String modelElementType) {
        this.modelElementType = modelElementType;
    }

    public Set<ModelElement> getModelElements() {
        return modelElements;
    }

    public void setModelElements(Set<ModelElement> modelElements) {
        this.modelElements = modelElements;
    }

    public ModelingExercise getExercise() {
        return exercise;
    }

    public void setExercise(ModelingExercise exercise) {
        this.exercise = exercise;
    }

    public void addModelElement(ModelElement element) {
        this.modelElements.add(element);
    }
}
