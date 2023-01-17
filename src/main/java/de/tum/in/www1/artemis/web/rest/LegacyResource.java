package de.tum.in.www1.artemis.web.rest;

import java.net.URI;
import java.net.URISyntaxException;

import org.springframework.http.ResponseEntity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.web.bind.annotation.*;

import de.tum.in.www1.artemis.config.SecurityConfiguration;
import de.tum.in.www1.artemis.security.annotations.EnforceNothing;
import de.tum.in.www1.artemis.security.annotations.ManualConfig;
import de.tum.in.www1.artemis.versioning.IgnoreGlobalMapping;
import de.tum.in.www1.artemis.web.rest.dto.LtiLaunchRequestDTO;
import de.tum.in.www1.artemis.web.rest.publicc.PublicProgrammingSubmissionResource;
import de.tum.in.www1.artemis.web.rest.publicc.PublicResultResource;

/**
 * TODO: Remove this class in January 2024
 * Together with the lines from {@link SecurityConfiguration#configure(HttpSecurity)}
 */
@RestController
@RequestMapping("api/")
@Deprecated(forRemoval = true)
public class LegacyResource {

    private final PublicProgrammingSubmissionResource publicProgrammingSubmissionResource;

    private final PublicResultResource publicResultResource;

    public LegacyResource(PublicProgrammingSubmissionResource publicProgrammingSubmissionResource, PublicResultResource publicResultResource) {
        this.publicProgrammingSubmissionResource = publicProgrammingSubmissionResource;
        this.publicResultResource = publicResultResource;
    }

    /**
     * POST lti/launch/:exerciseId : Launch the exercise app using request by an LTI consumer. Redirects the user to the exercise on success.
     *
     * @param launchRequest the LTI launch request (ExerciseLtiConfigurationDTO)
     * @param exerciseId    the id of the exercise the user wants to open
     * @return the ResponseEntity with status 308 forwarding to the public endpoint as this is an endpoint called in the browser
     */
    @IgnoreGlobalMapping
    @PostMapping("lti/launch/{exerciseId}")
    @EnforceNothing
    @ManualConfig
    @Deprecated(forRemoval = true)
    public ResponseEntity<Void> legacyLtiLaunch(@ModelAttribute LtiLaunchRequestDTO launchRequest, @PathVariable("exerciseId") Long exerciseId) throws URISyntaxException {
        return ResponseEntity.status(308).location(new URI("/api/public/lti/launch/" + exerciseId)).build();
    }

    /**
     * POST lti13/auth-callback Redirects an LTI 1.3 Authorization Request Response to the client
     *
     * @return the ResponseEntity with status 308 forwarding to the public endpoint as this is an endpoint called in the browser
     */
    @IgnoreGlobalMapping
    @PostMapping("lti13/auth-callback")
    @EnforceNothing
    @ManualConfig
    @Deprecated(forRemoval = true)
    public ResponseEntity<Void> legacyLti13LaunchRedirect() throws URISyntaxException {
        return ResponseEntity.status(308).location(new URI("/api/public/lti13/auth-callback")).build();
    }

    /**
     * Receive a new push notification from the VCS server and save a submission in the database
     *
     * @param participationId the participationId of the participation the repository is linked to
     * @param requestBody the body of the post request by the VCS.
     * @return the ResponseEntity with status 200 (OK), or with status 400 (Bad Request) if the latest commit was already notified about
     * @deprecated use {@link PublicProgrammingSubmissionResource#processNewProgrammingSubmission(Long, Object)} instead
     */
    @IgnoreGlobalMapping
    @PostMapping("programming-submissions/{participationId}")
    @EnforceNothing
    @ManualConfig
    @Deprecated(forRemoval = true)
    public ResponseEntity<?> legacyProcessNewProgrammingSubmission(@PathVariable Long participationId, @RequestBody Object requestBody) {
        return publicProgrammingSubmissionResource.processNewProgrammingSubmission(participationId, requestBody);
    }

    /**
     * Receive a new push notification for a test repository from the VCS server, save a submission in the database and trigger relevant build plans
     *
     * @param exerciseId the id of the programmingExercise where the test cases got changed
     * @param requestBody the body of the post request by the VCS.
     * @return the ResponseEntity with status 200 (OK)
     * @deprecated use {@link PublicProgrammingSubmissionResource#testCaseChanged(Long, Object)} instead
     */
    @IgnoreGlobalMapping
    @PostMapping("programming-exercises/test-cases-changed/{exerciseId}")
    @EnforceNothing
    @ManualConfig
    @Deprecated(forRemoval = true)
    public ResponseEntity<Void> legacyTestCaseChanged(@PathVariable Long exerciseId, @RequestBody Object requestBody) {
        return publicProgrammingSubmissionResource.testCaseChanged(exerciseId, requestBody);
    }

    /**
     * Receive a new result from the continuous integration server and save it in the database
     *
     * @param token CI auth token
     * @param requestBody build result of CI system
     * @return a ResponseEntity to the CI system
     * @deprecated use {@link PublicResultResource#processNewProgrammingExerciseResult(String, Object)} instead
     */
    @IgnoreGlobalMapping
    @PostMapping("programming-exercises/new-result")
    @EnforceNothing
    @ManualConfig
    @Deprecated(forRemoval = true)
    public ResponseEntity<?> legacyProcessNewProgrammingExerciseResult(@RequestHeader("Authorization") String token, @RequestBody Object requestBody) {
        return publicResultResource.processNewProgrammingExerciseResult(token, requestBody);
    }
}
