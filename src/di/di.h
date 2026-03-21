/* di.h - Dependency Injection System for C (stb-style single header)
 * 
 * Inspired by Angular's DI system and stb libraries.
 * 
 * USAGE:
 *   #define DI_IMPLEMENTATION
 *   #include "di/di.h"
 * 
 * Features:
 * - Type-safe service registration
 * - Singleton and transient scopes
 * - Constructor injection
 * - Service locator pattern
 * - Circular dependency detection
 *
 * ============================================================================
 * LICENSE - Public Domain
 * ============================================================================
 */

#ifndef DI_H
#define DI_H

#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ============================================================================
   CONFIGURATION
   ============================================================================ */

#ifndef DI_MAX_SERVICES
#define DI_MAX_SERVICES 64
#endif

#ifndef DI_MAX_NAME_LEN
#define DI_MAX_NAME_LEN 64
#endif

/* ============================================================================
   ERROR CODES
   ============================================================================ */

typedef enum {
    DI_OK = 0,
    DI_ERROR_NOT_FOUND = -1,
    DI_ERROR_ALREADY_REGISTERED = -2,
    DI_ERROR_CIRCULAR_DEPENDENCY = -3,
    DI_ERROR_INIT_FAILED = -4,
    DI_ERROR_NULL_POINTER = -5,
    DI_ERROR_OUT_OF_MEMORY = -6,
} DI_Error;

/* ============================================================================
   SERVICE SCOPE
   ============================================================================ */

typedef enum {
    DI_SCOPE_SINGLETON,  /* Single instance for entire application */
    DI_SCOPE_TRANSIENT,  /* New instance each time */
} DI_Scope;

/* ============================================================================
   FORWARD DECLARATIONS
   ============================================================================ */

typedef struct DI_Service DI_Service;
typedef struct DI_Provider DI_Provider;
typedef struct DI_Container DI_Container;

/* ============================================================================
   SERVICE BASE STRUCTURE
   ============================================================================ */

struct DI_Service {
    const char* name;
    int initialized;
    void (*destroy)(DI_Service* self);
};

/* ============================================================================
   PROVIDER FUNCTION TYPE
   ============================================================================ */

typedef DI_Error (*DI_ProviderFunc)(DI_Container* container, void** out_service);
typedef void (*DI_DestroyFunc)(DI_Service* service);

/* ============================================================================
   PROVIDER REGISTRATION
   ============================================================================ */

struct DI_Provider {
    char name[DI_MAX_NAME_LEN];
    DI_Scope scope;
    DI_ProviderFunc provider_func;
    DI_DestroyFunc destroy_func;
    void* instance;  /* For singleton scope */
    int is_instancing;  /* For circular dependency detection */
};

/* ============================================================================
   CONTAINER STRUCTURE
   ============================================================================ */

struct DI_Container {
    DI_Provider providers[DI_MAX_SERVICES];
    size_t provider_count;
    int frozen;  /* If true, no more registrations allowed */
};

/* ============================================================================
   CORE CONTAINER FUNCTIONS (Declared here, defined in IMPLEMENTATION)
   ============================================================================ */

DI_Error DI_Container_Init(DI_Container* container);
void DI_Container_Destroy(DI_Container* container);
DI_Error DI_Container_Register(
    DI_Container* container,
    const char* name,
    DI_Scope scope,
    DI_ProviderFunc provider_func,
    DI_DestroyFunc destroy_func
);
DI_Error DI_Container_Get(DI_Container* container, const char* name, void** out_service);
int DI_Container_Has(DI_Container* container, const char* name);
const char* DI_Error_Message(DI_Error err);
DI_Container* DI_GetGlobalContainer(void);
void DI_SetGlobalContainer(DI_Container* container);

/* ============================================================================
   MACROS FOR SERVICE DEFINITION
   ============================================================================ */

/**
 * Declare a service type with its injection function
 * Use this in header files
 */
#define DI_DECLARE_SERVICE(ServiceType, service_name) \
    ServiceType* service_name##_inject(void); \
    DI_Error service_name##_provider(DI_Container* container, void** out_service); \
    void service_name##_destroy(DI_Service* service); \
    DI_Error service_name##_init(ServiceType* self); \
    void service_name##_cleanup(ServiceType* self);

/**
 * Define a service provider
 * Use this in implementation files AFTER the struct is fully defined
 */
#define DI_DEFINE_SERVICE(ServiceType, service_name) \
    DI_Error service_name##_provider(DI_Container* container, void** out_service) { \
        (void)container; \
        ServiceType* self = (ServiceType*)calloc(1, sizeof(ServiceType)); \
        if (!self) return DI_ERROR_OUT_OF_MEMORY; \
        self->base.name = #service_name; \
        self->base.initialized = 0; \
        self->base.destroy = service_name##_destroy; \
        DI_Error err = service_name##_init(self); \
        if (err != DI_OK) { \
            free(self); \
            return err; \
        } \
        self->base.initialized = 1; \
        *out_service = (void*)self; \
        return DI_OK; \
    } \
    void service_name##_destroy(DI_Service* service) { \
        ServiceType* self = (ServiceType*)service; \
        if (self && self->base.initialized) { \
            service_name##_cleanup(self); \
            self->base.initialized = 0; \
        } \
        free(self); \
    } \
    ServiceType* service_name##_inject(void) { \
        void* service; \
        DI_Error err = DI_Container_Get(DI_GetGlobalContainer(), #service_name, &service); \
        if (err != DI_OK) { \
            fprintf(stderr, "DI: Failed to inject service '%s' (error: %d)\n", #service_name, err); \
            return NULL; \
        } \
        return (ServiceType*)service; \
    }

/**
 * Define service initialization (constructor)
 */
#define DI_SERVICE_INIT(ServiceType, service_name) \
    DI_Error service_name##_init(ServiceType* self)

/**
 * Define service cleanup (destructor)
 */
#define DI_SERVICE_CLEANUP(ServiceType, service_name) \
    void service_name##_cleanup(ServiceType* self)

/**
 * Register a singleton service
 */
#define DI_REGISTER_SINGLETON(service_name) \
    DI_Container_Register( \
        DI_GetGlobalContainer(), \
        #service_name, \
        DI_SCOPE_SINGLETON, \
        service_name##_provider, \
        service_name##_destroy \
    )

/**
 * Register a transient service
 */
#define DI_REGISTER_TRANSIENT(service_name) \
    DI_Container_Register( \
        DI_GetGlobalContainer(), \
        #service_name, \
        DI_SCOPE_TRANSIENT, \
        service_name##_provider, \
        service_name##_destroy \
    )

/**
 * Inject a service (like Angular's inject())
 */
#define DI_INJECT(service_name) \
    service_name##_inject()

/**
 * Check if service is available
 */
#define DI_HAS(service_name) \
    DI_Container_Has(DI_GetGlobalContainer(), #service_name)

/* ============================================================================
   IMPLEMENTATION SECTION
   ============================================================================ */

#ifdef DI_IMPLEMENTATION

/* Global container */
static DI_Container g_di_container = {0};
static int g_di_container_initialized = 0;

DI_Container* DI_GetGlobalContainer(void) {
    if (!g_di_container_initialized) {
        DI_Container_Init(&g_di_container);
        g_di_container_initialized = 1;
    }
    return &g_di_container;
}

void DI_SetGlobalContainer(DI_Container* container) {
    if (container) {
        g_di_container_initialized = 1;
    }
}

const char* DI_Error_Message(DI_Error err) {
    switch (err) {
        case DI_OK: return "Success";
        case DI_ERROR_NOT_FOUND: return "Service not found";
        case DI_ERROR_ALREADY_REGISTERED: return "Service already registered";
        case DI_ERROR_CIRCULAR_DEPENDENCY: return "Circular dependency detected";
        case DI_ERROR_INIT_FAILED: return "Service initialization failed";
        case DI_ERROR_NULL_POINTER: return "Null pointer";
        case DI_ERROR_OUT_OF_MEMORY: return "Out of memory";
        default: return "Unknown error";
    }
}

DI_Error DI_Container_Init(DI_Container* container) {
    if (!container) return DI_ERROR_NULL_POINTER;
    memset(container, 0, sizeof(DI_Container));
    container->frozen = 0;
    return DI_OK;
}

void DI_Container_Destroy(DI_Container* container) {
    if (!container) return;
    
    for (size_t i = 0; i < container->provider_count; i++) {
        DI_Provider* provider = &container->providers[i];
        if (provider->scope == DI_SCOPE_SINGLETON && provider->instance) {
            if (provider->destroy_func) {
                provider->destroy_func((DI_Service*)provider->instance);
            }
            provider->instance = NULL;
        }
    }
    container->provider_count = 0;
    container->frozen = 0;
}

DI_Error DI_Container_Register(
    DI_Container* container,
    const char* name,
    DI_Scope scope,
    DI_ProviderFunc provider_func,
    DI_DestroyFunc destroy_func
) {
    if (!container || !name || !provider_func) return DI_ERROR_NULL_POINTER;
    if (container->frozen) return DI_ERROR_ALREADY_REGISTERED;
    if (container->provider_count >= DI_MAX_SERVICES) return DI_ERROR_OUT_OF_MEMORY;
    
    /* Check for duplicate */
    for (size_t i = 0; i < container->provider_count; i++) {
        if (strcmp(container->providers[i].name, name) == 0) {
            return DI_ERROR_ALREADY_REGISTERED;
        }
    }
    
    DI_Provider* provider = &container->providers[container->provider_count];
    strncpy(provider->name, name, DI_MAX_NAME_LEN - 1);
    provider->name[DI_MAX_NAME_LEN - 1] = '\0';
    provider->scope = scope;
    provider->provider_func = provider_func;
    provider->destroy_func = destroy_func;
    provider->instance = NULL;
    provider->is_instancing = 0;
    
    container->provider_count++;
    return DI_OK;
}

DI_Error DI_Container_Get(DI_Container* container, const char* name, void** out_service) {
    if (!container || !name || !out_service) return DI_ERROR_NULL_POINTER;
    
    /* Find provider */
    DI_Provider* provider = NULL;
    for (size_t i = 0; i < container->provider_count; i++) {
        if (strcmp(container->providers[i].name, name) == 0) {
            provider = &container->providers[i];
            break;
        }
    }
    
    if (!provider) return DI_ERROR_NOT_FOUND;
    
    /* Check for circular dependency */
    if (provider->is_instancing) {
        return DI_ERROR_CIRCULAR_DEPENDENCY;
    }
    
    /* Return existing instance for singleton */
    if (provider->scope == DI_SCOPE_SINGLETON && provider->instance) {
        *out_service = provider->instance;
        return DI_OK;
    }
    
    /* Create new instance */
    provider->is_instancing = 1;
    void* service = NULL;
    DI_Error err = provider->provider_func(container, &service);
    provider->is_instancing = 0;
    
    if (err != DI_OK) return err;
    
    /* Store singleton instance */
    if (provider->scope == DI_SCOPE_SINGLETON) {
        provider->instance = service;
    }
    
    *out_service = service;
    return DI_OK;
}

int DI_Container_Has(DI_Container* container, const char* name) {
    if (!container || !name) return 0;
    
    for (size_t i = 0; i < container->provider_count; i++) {
        if (strcmp(container->providers[i].name, name) == 0) {
            return 1;
        }
    }
    return 0;
}

#endif /* DI_IMPLEMENTATION */

#endif /* DI_H */
