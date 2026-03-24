# Context version libraries

Each modality can have optional folders `v1/`, `v2/`, … with a full copy of the tutorial tree and `prompts/` (paths must match the merged manifest). A `manifest.yaml` may **extend** the app default under `../context/<modality>/` for structure only; `.md` and prompt files are read from `vN/` only, not from the app `context/` tree.

The backend loads these when the API sends `context_version` (e.g. sandbox). The main breeding app uses only `backend/context/<modality>/` and does not set `context_version`.
