"""Simulated small-object detector jobs.

A real deployment would enqueue a job that opens `zarr_uri` at `frame_index` and runs the tiled
detector; here the job is a clock so the app's polling UI can be demonstrated end to end.
"""

from __future__ import annotations

import hashlib

from .config import DetectorConfig
from .db import Database
from .models import DetectionStatus, Observation


class UnknownObservation(LookupError):
    """Raised when the observation was never returned for that rescue."""


def trigger(db: Database, config: DetectorConfig, rescue_id: str, observation_id: str, now_epoch: float) -> Observation:
    """Queue the job (idempotent) and return the observation with its status."""
    if db.get_bundle_observation(rescue_id, observation_id) is None:
        raise UnknownObservation(observation_id)
    db.queue_detector_job(rescue_id, observation_id, now_epoch)
    return status(db, config, rescue_id, observation_id, now_epoch)


def status(db: Database, config: DetectorConfig, rescue_id: str, observation_id: str, now_epoch: float) -> Observation:
    """The observation with detection status derived from the time since the trigger."""
    document = db.get_bundle_observation(rescue_id, observation_id)
    if document is None:
        raise UnknownObservation(observation_id)
    observation = Observation.model_validate(document)
    queued_at = db.detector_job(rescue_id, observation_id)
    if queued_at is None:
        return observation
    elapsed = now_epoch - queued_at
    if elapsed < config.queued_seconds:
        return observation.model_copy(update={"detection_status": DetectionStatus.QUEUED})
    if elapsed < config.queued_seconds + config.running_seconds:
        return observation.model_copy(update={"detection_status": DetectionStatus.RUNNING})
    return observation.model_copy(
        update={"detection_status": DetectionStatus.DONE, "candidate_count": candidate_count(observation_id, config.max_candidates)}
    )


def candidate_count(observation_id: str, max_candidates: int) -> int:
    """Deterministic pseudo-result so a rehearsed demo repeats."""
    digest = hashlib.sha256(observation_id.encode("utf-8")).digest()
    return digest[0] % (max(0, max_candidates) + 1)
