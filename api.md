# API Documentation

Base path: `/api`
Content type: `application/json` unless noted.

Authentication

- Required for most endpoints: `Authorization: Bearer <access_token>`
- Access token is returned by `POST /auth/google`
- Refresh token is stored in an HttpOnly cookie `refresh_token` and used by `POST /auth/refresh`

Error responses

- Many endpoints return:
  ```json
  {
    "error": {
      "code": "string",
      "message": "string",
      "hint": "string or null"
    }
  }
  ```
- Some endpoints return `{"detail": "..."}` or `{"detail": {"message": "...", "error_log": "..."}}`

---

## Auth

### POST /auth/google

Auth required: no

Request body

```json
{
  "id_token": "string"
}
```

Response body

```json
{
  "access_token": "string",
  "token_type": "bearer",
  "user": {
    "user_id": "string",
    "email": "string",
    "name": "string",
    "picture": "string"
  }
}
```

Notes

- Sets HttpOnly cookie `refresh_token` scoped to `/api/auth/refresh`.

### POST /auth/refresh

Auth required: no (requires cookie `refresh_token`)

Request body: none

Response body

```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

### POST /auth/logout

Auth required: no

Request body: none

Response body: none (204 No Content)

Notes

- Clears HttpOnly cookie `refresh_token`.

---

## System

### GET /health

Auth required: no

Request body: none

Response body

```json
{
  "status": "ok"
}
```

### GET /storage/summary

Auth required: no

Request body: none

Response body

```json
{
  "raw_ids": ["string"],
  "dataset_ids": ["string"],
  "session_ids": ["string"]
}
```

---

## Datasets

Auth required: yes (Bearer token)

### GET /datasets

Request body: none

Response body

```json
{
  "items": [{ "any": "dataset metadata object" }]
}
```

### POST /datasets/preview

Request body

```json
{
  "source": "string"
}
```

Response body

```json
{
  "raw_id": "string",
  "raw_format": "string",
  "raw_path": "string",
  "extracted_params": { "optional": "PreprocessingParams object or null" },
  "file_info": { "optional": "object or null" }
}
```

### POST /datasets/confirm

Request body

```json
{
  "raw_id": "string",
  "preprocessing": { "optional": "PreprocessingParams object or null" }
}
```

Response body

```json
{
  "raw_id": "string",
  "dataset_id": "string",
  "status": "loaded",
  "raw_format": "string",
  "raw_path": "string",
  "dataset_path": "string",
  "n_cells": 0,
  "n_genes": 0,
  "plots": ["string"]
}
```

### POST /datasets/load

Request body

```json
{
  "source": "string",
  "preprocessing": { "optional": "PreprocessingParams object or null" }
}
```

Response body: same as `/datasets/confirm`

### POST /datasets/local

Auth required: yes

Content type: `multipart/form-data`

Form fields

- `files`: one or more files
- `preprocessing`: JSON object (optional, see PreprocessingParams)

Response body: same as `/datasets/confirm`

### GET /datasets/{dataset_id}/plots

Request body: none

Response body

```json
{
  "dataset_id": "string",
  "plots": ["string"]
}
```

### POST /datasets/{dataset_id}/plots/build

Request body: none

Response body: same as `/datasets/{dataset_id}/plots`

### GET /datasets/{dataset_id}/plots/{plot_name}

Request body: none

Response body: binary `image/png`

PreprocessingParams

```json
{
  "min_genes": 200,
  "min_cells": 3,
  "max_genes": 2500,
  "max_mt_pct": 5.0,
  "target_sum": 10000.0,
  "min_mean": 0.0125,
  "max_mean": 3.0,
  "min_disp": 0.5,
  "scale_max_value": 10.0,
  "pca_svd_solver": "arpack",
  "n_neighbors": 10,
  "n_pcs": 40,
  "resolution": 0.9
}
```

---

## Documents

Auth required: yes (Bearer token)

### POST /documents/upload

Content type: `multipart/form-data`

Form fields

- `files`: one or more PDF files

Response body (top-level fields from service)

```json
{
  "success": true,
  "summary": { "object": "summary" },
  "results": ["per-file result objects"]
}
```

### GET /documents/status

Request body: none

Response body (top-level fields from service)

```json
{
  "success": true,
  "object": "service status fields"
}
```

---

## Chat

Auth required: yes (Bearer token)

### POST /chat/query

Request body

```json
{
  "query": "string",
  "session_id": "string or null",
  "dataset_id": "string"
}
```

Response body

```json
{
  "session_id": "string",
  "status": "completed | pending_approval",
  "answer": "string or null",
  "figures": ["string"],
  "code": "string or null",
  "error": "string or null"
}
```

### POST /chat/analyze

Request body

```json
{
  "query": "string",
  "dataset_id": "string",
  "analysis_type": "general | clustering | differential | visualization | pathway",
  "parameters": { "optional": "object" }
}
```

Response body

```json
{
  "message": "string",
  "results": { "optional": "object" },
  "suggestions": ["string"],
  "metadata": { "optional": "object" }
}
```

---

## Agent

Auth required: yes (Bearer token)

IDs

- `session_id` pattern: `session_[0-9a-f]{12}`
- `dataset_id` pattern: `dataset_[0-9a-f]{12}`

### GET /agent/sessions

Request body: none

Response body

```json
{
  "sessions": [
    {
      "session_id": "string",
      "dataset_id": "string",
      "title": "string or null",
      "status": "pending | running | pending_approval | completed | completed_with_warnings | failed",
      "current_step": "string or null",
      "created_at": "string",
      "updated_at": "string",
      "last_message": "string or null"
    }
  ],
  "total": 0
}
```

### POST /agent/query/stream

Request body: same as `/chat/query`

Response body: `text/event-stream` (SSE)

- Each event line: `data: {"type": "...", "message": "...", "progress": 0, ...}`

### PATCH /agent/sessions/{session_id}/title

Request body

```json
{
  "title": "string"
}
```

Response body

```json
{
  "session_id": "string",
  "title": "string"
}
```

### POST /agent/sessions/{session_id}/resume

Request body

```json
{
  "approved": true,
  "feedback": "string or null"
}
```

Response body: same as `/chat/query`

---

## Scanpy

Auth required: yes (Bearer token)

### GET /scanpy/info

Request body: none

Response body

```json
{
  "analysis_info": {
    "available_analyses": ["string"],
    "default_params": { "object": "default params" }
  },
  "available_cell_types": ["string"],
  "note": "string"
}
```

### POST /scanpy/marker-genes

Request body

```json
{
  "dataset_id": "string",
  "params": {
    "groupby": "leiden",
    "n_top_markers": 50,
    "method": "wilcoxon"
  }
}
```

Response body

```json
{
  "status": "completed",
  "dataset_id": "string",
  "n_groups": 0,
  "top_markers_per_group": { "group": ["gene1", "gene2"] }
}
```

### POST /scanpy/cell-type-annotation

Request body

```json
{
  "dataset_id": "string",
  "params": {
    "cluster_key": "leiden",
    "cell_type_markers": { "cell_type": ["gene1", "gene2"] }
  }
}
```

Response body

```json
{
  "status": "completed",
  "dataset_id": "string",
  "cell_type_distribution": { "cell_type": 0 },
  "cluster_to_celltype": { "cluster": "cell_type" }
}
```

### POST /scanpy/differential-expression

Request body

```json
{
  "dataset_id": "string",
  "params": {
    "groupby": "condition",
    "reference": "Control",
    "method": "wilcoxon",
    "n_genes": 100
  }
}
```

Response body

```json
{
  "status": "completed",
  "dataset_id": "string",
  "n_genes": 0,
  "top_genes": [{ "gene": "string", "score": 0 }]
}
```

### POST /scanpy/gene-expression

Request body

```json
{
  "dataset_id": "string",
  "genes": ["gene1", "gene2"],
  "groupby": "string or null"
}
```

Response body

```json
{
  "status": "completed",
  "dataset_id": "string",
  "n_genes": 0,
  "expression_data": [{ "gene": "string", "value": 0 }]
}
```

### GET /scanpy/{dataset_id}/groups

Request body: none

Response body

```json
{
  "dataset_id": "string",
  "available_groups": ["string"]
}
```

---

## Artifacts

Auth required: yes (Bearer token)

### GET /artifacts/sessions/{session_id}/plots/{plot_name}

Request body: none

Response body: binary `image/png` (Content-Disposition: inline)
