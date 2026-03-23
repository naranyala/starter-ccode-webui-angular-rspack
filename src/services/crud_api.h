/* CRUD API Handlers - Backend API for frontend communication */

#ifndef CRUD_API_H
#define CRUD_API_H

#include <stdbool.h>
#include <stddef.h>

typedef struct WebuiService WebuiService;
typedef struct SQLiteService SQLiteService;

/* Initialize CRUD API - bind all handlers to WebUI window */
int crud_api_init(WebuiService* webui, SQLiteService* sqlite);

#endif /* CRUD_API_H */
