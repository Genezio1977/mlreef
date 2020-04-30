package com.mlreef.rest.api.v1

import com.mlreef.rest.DataProject
import com.mlreef.rest.Person
import com.mlreef.rest.VisibilityScope
import com.mlreef.rest.api.v1.dto.DataProjectDto
import com.mlreef.rest.api.v1.dto.UserInProjectDto
import com.mlreef.rest.api.v1.dto.toDomain
import com.mlreef.rest.api.v1.dto.toDto
import com.mlreef.rest.exceptions.ProjectNotFoundException
import com.mlreef.rest.external_api.gitlab.TokenDetails
import com.mlreef.rest.feature.project.DataProjectService
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PostAuthorize
import org.springframework.security.access.prepost.PostFilter
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID
import java.util.logging.Logger
import javax.validation.Valid
import javax.validation.constraints.NotEmpty

@RestController
@RequestMapping("/api/v1/data-projects")
class DataProjectsController(
    val dataProjectService: DataProjectService
) {
    private val log: Logger = Logger.getLogger(DataProjectsController::class.simpleName)

    @GetMapping
    fun getAllDataProjects(person: Person): List<DataProjectDto> {
        return dataProjectService.getAllProjectsForUser(person.id).map(DataProject::toDto)
    }

    @GetMapping("/{id}")
    @PreAuthorize("isCurrentUserInProject(#id)")
    fun getDataProjectById(@PathVariable id: UUID): DataProjectDto {
        val dataProject = dataProjectService.getProjectById(id) ?: throw ProjectNotFoundException(projectId = id)
        return dataProject.toDto()
    }

    @GetMapping("/namespace/{namespace}")
    @PostFilter("filterProjectByUserInProject()")
    fun getCodeProjectsByNamespace(@PathVariable namespace: String): List<DataProjectDto> {
        val dataProjects = dataProjectService.getProjectsByNamespace(namespace)
        return dataProjects.map(DataProject::toDto)
    }

    @GetMapping("/slug/{slug}")
    @PostFilter("filterProjectByUserInProject()")
    fun getCodeProjectBySlug(@PathVariable slug: String): List<DataProjectDto> {
        val dataProjects = dataProjectService.getProjectsBySlug(slug)
        return dataProjects.map(DataProject::toDto)
    }

    @GetMapping("/{namespace}/{slug}")
    @PostAuthorize("isCurrentUserInResultProject()")
    fun getCodeProjectsByNamespaceAndSlugInPath(@PathVariable namespace: String, @PathVariable slug: String): DataProjectDto {
        val dataProject = dataProjectService.getProjectsByNamespaceAndSlug(namespace, slug)
            ?: throw ProjectNotFoundException(path = "$namespace/$slug")
        return dataProject.toDto()
    }

    @PostMapping
    @PreAuthorize("canCreateProject()")
    fun createDataProject(@Valid @RequestBody dataProjectCreateRequest: DataProjectCreateRequest,
                          token: TokenDetails,
                          person: Person): DataProjectDto {
        val dataProject = dataProjectService.createProject(
            userToken = token.permanentToken,
            ownerId = person.id,
            projectSlug = dataProjectCreateRequest.slug,
            projectNamespace = dataProjectCreateRequest.namespace,
            projectName = dataProjectCreateRequest.name,
            description = dataProjectCreateRequest.description,
            initializeWithReadme = dataProjectCreateRequest.initializeWithReadme,
            visibility = dataProjectCreateRequest.visibility
        )

        return dataProject.toDto()
    }

    @PutMapping("/{id}")
    @PreAuthorize("isProjectOwner(#id)")
    fun updateDataProject(@PathVariable id: UUID,
                          @Valid @RequestBody dataProjectUpdateRequest: DataProjectUpdateRequest,
                          token: TokenDetails,
                          person: Person): DataProjectDto {
        val dataProject = dataProjectService.updateProject(
            userToken = token.permanentToken,
            ownerId = person.id,
            projectUUID = id,
            projectName = dataProjectUpdateRequest.name,
            description = dataProjectUpdateRequest.description)

        return dataProject.toDto()
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("isProjectOwner(#id)")
    fun deleteDataProject(@PathVariable id: UUID,
                          token: TokenDetails,
                          person: Person) {
        dataProjectService.deleteProject(
            userToken = token.permanentToken,
            ownerId = person.id,
            projectUUID = id)
    }

    @GetMapping("/{id}/users")
    @PreAuthorize("hasAccessToProject(#id, 'DEVELOPER')")
    fun getUsersInDataProjectById(@PathVariable id: UUID): List<UserInProjectDto> {
        val usersInProject = dataProjectService.getUsersInProject(id)
        return usersInProject.map { UserInProjectDto(it.id, it.username, it.email, it.gitlabId) }
    }

    @GetMapping("/{id}/users/check/{userId}")
    @PreAuthorize("hasAccessToProject(#id, 'DEVELOPER') || isUserItself(#userId)")
    fun checkUserInDataProjectById(@PathVariable id: UUID, @PathVariable userId: UUID, person: Person): Boolean {
        return dataProjectService.checkUserInProject(person.id, id)
    }

    @PostMapping("/{id}/users/check")
    @PreAuthorize("hasAccessToProject(#id, 'DEVELOPER')")
    fun checkUsersInDataProjectById(@PathVariable id: UUID, @RequestBody request: UsersProjectRequest): Map<String?, Boolean> {
        return dataProjectService
            .checkUsersInProject(id, request.users.map(UserInProjectDto::toDomain))
            .map { Pair(it.key.userName ?: it.key.email ?: it.key.gitlabId.toString(), it.value) }
            .toMap()
    }

    @PostMapping("/{id}/users")
    @PreAuthorize("hasAccessToProject(#id, 'MAINTAINER')")
    fun addUsersToDataProjectById(@PathVariable id: UUID, @RequestBody request: UsersProjectRequest): List<UserInProjectDto> {
        dataProjectService.addUsersToProject(id, request.users.map(UserInProjectDto::toDomain))
        return getUsersInDataProjectById(id)
    }

    @PostMapping("/{id}/users/{userId}")
    @PreAuthorize("hasAccessToProject(#id, 'MAINTAINER')")
    fun addUserToDataProjectById(@PathVariable id: UUID, @PathVariable userId: UUID): List<UserInProjectDto> {
        dataProjectService.addUserToProject(id, userId)
        return getUsersInDataProjectById(id)
    }

    @DeleteMapping("/{id}/users")
    @PreAuthorize("hasAccessToProject(#id, 'MAINTAINER')")
    fun deleteUsersFromDataProjectById(@PathVariable id: UUID, @RequestBody request: UsersProjectRequest): List<UserInProjectDto> {
        val usersInProject = dataProjectService.deleteUsersFromProject(id, request.users.map(UserInProjectDto::toDomain))
        return usersInProject.map { UserInProjectDto(it.id, it.username, it.email, it.gitlabId) }
    }

    @DeleteMapping("/{id}/users/{userId}")
    @PreAuthorize("hasAccessToProject(#id, 'MAINTAINER') || isUserItself(#userId)")
    fun deleteUserFromDataProjectById(@PathVariable id: UUID, @PathVariable userId: UUID): List<UserInProjectDto> {
        dataProjectService.deleteUserFromProject(id, userId)
        return getUsersInDataProjectById(id)
    }
}

class DataProjectCreateRequest(
    @NotEmpty val slug: String,
    @NotEmpty val namespace: String,
    @NotEmpty val name: String,
    @NotEmpty val description: String,
    @NotEmpty val initializeWithReadme: Boolean,
    val visibility: VisibilityScope = VisibilityScope.PUBLIC
)

class DataProjectUpdateRequest(
    @NotEmpty val name: String,
    @NotEmpty val description: String
)

class UsersProjectRequest(
    @NotEmpty val users: List<UserInProjectDto>
)

