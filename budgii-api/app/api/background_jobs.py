from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.db.session import get_db
from app.models import BackgroundJobRun, User
from app.schemas.background_jobs import BackgroundJobRunResponse, BackgroundJobStatusResponse
from app.services import background_jobs as background_job_service
from app.services import household as household_service
from app.services.permissions import require_admin

router = APIRouter()

VISIBLE_JOBS = ["recurring", "push"]


def run_response(run: BackgroundJobRun) -> BackgroundJobRunResponse:
    return BackgroundJobRunResponse(
        id=str(run.id),
        job_name=run.job_name,
        status=run.status,
        started_at=run.started_at,
        finished_at=run.finished_at,
        summary=run.summary,
        error=run.error,
    )


@router.get("/{household_id}/background-jobs", response_model=BackgroundJobStatusResponse)
async def background_job_status(
    household_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> BackgroundJobStatusResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await household_service.require_membership(session, user.id, household_uuid)
    require_admin(membership)

    runs = await background_job_service.latest_background_job_runs(session, VISIBLE_JOBS)
    return BackgroundJobStatusResponse(runs=[run_response(run) for run in runs])
