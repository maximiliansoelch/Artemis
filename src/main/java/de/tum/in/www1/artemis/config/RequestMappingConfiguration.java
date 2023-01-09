package de.tum.in.www1.artemis.config;

import java.util.List;

import org.springframework.boot.autoconfigure.web.servlet.WebMvcRegistrations;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import org.springframework.web.util.pattern.PathPatternParser;

import de.tum.in.www1.artemis.versioning.VersionRequestMappingHandlerMapping;

/**
 * Overwrites the default RequestMappingHandlerMapping with a versioned one.
 */
@Configuration
public class RequestMappingConfiguration {

    private final List<Integer> apiVersions;

    private final RequestMappingInfo.BuilderConfiguration builderConfiguration;

    public RequestMappingConfiguration(List<Integer> apiVersions) {
        this.apiVersions = apiVersions;

        builderConfiguration = new RequestMappingInfo.BuilderConfiguration();
        builderConfiguration.setPatternParser(new PathPatternParser());
    }

    /**
     * Registers the versioned request mapping handler mapping {@link VersionRequestMappingHandlerMapping}
     *
     * @return the versioned request mapping handler mapping {@link VersionRequestMappingHandlerMapping}
     */
    @Bean
    public WebMvcRegistrations webMvcRegistrations() {
        return new WebMvcRegistrations() {

            @Override
            public RequestMappingHandlerMapping getRequestMappingHandlerMapping() {
                return new VersionRequestMappingHandlerMapping(apiVersions, "api", "v", builderConfiguration);
            }
        };
    }
}
