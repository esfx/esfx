export const MANUALRESET_ID = 1 << 16;
export const MANUALRESET_STATE_NONSIGNALED = MANUALRESET_ID | 0;
export const MANUALRESET_STATE_SIGNALED = MANUALRESET_ID | 1;
export const MANUALRESET_STATE_EXCLUDES = ~(MANUALRESET_STATE_NONSIGNALED | MANUALRESET_STATE_SIGNALED);
export const MANUALRESET_FIELD_STATE = 0;

export const AUTORESET_ID = 1 << 17;
export const AUTORESET_STATE_NONSIGNALED = AUTORESET_ID | 0;
export const AUTORESET_STATE_NOTIFYING = AUTORESET_ID | 1;
export const AUTORESET_STATE_SIGNALED = AUTORESET_ID | 3;
export const AUTORESET_STATE_EXCLUDES = ~(AUTORESET_STATE_NONSIGNALED | AUTORESET_STATE_SIGNALED | AUTORESET_STATE_NOTIFYING);
export const AUTORESET_FIELD_STATE = 0;

export const MUTEX_ID = 1 << 18;
export const MUTEX_STATE_UNLOCKED = MUTEX_ID | 0;
export const MUTEX_STATE_LOCKED = MUTEX_ID | 1;
export const MUTEX_STATE_INCONTENTION = MUTEX_ID | 2;
export const MUTEX_STATE_EXCLUDES = ~(MUTEX_STATE_UNLOCKED | MUTEX_STATE_LOCKED | MUTEX_STATE_INCONTENTION);
export const MUTEX_FIELD_STATE = 0;

export const CONDVAR_ID = 1 << 19;
export const CONDVAR_STATE_EXCLUDES = ~(CONDVAR_ID);
export const CONDVAR_FIELD_STATE = 0;

export const SEM_ID = 1 << 20;
export const SEM_STATE_UNLOCKED = SEM_ID | 0;
export const SEM_STATE_LOCKED = SEM_ID | 1;
export const SEM_STATE_INCONTENTION = SEM_ID | 2;
export const SEM_STATE_EXCLUDES = ~(SEM_STATE_UNLOCKED | SEM_STATE_LOCKED | SEM_STATE_INCONTENTION);
export const SEM_FIELD_STATE = 0;
export const SEM_FIELD_MAXCOUNT = 1;
export const SEM_FIELD_CURRENTCOUNT = 2;
export const SEM_FIELD_WAITCOUNT = 3;

export const COUNTDOWN_ID = 1 << 21;
export const COUNTDOWN_STATE_NONSIGNALED = COUNTDOWN_ID | 0;
export const COUNTDOWN_STATE_SIGNALED = COUNTDOWN_ID | 1;
export const COUNTDOWN_STATE_EXCLUDES = ~(COUNTDOWN_STATE_NONSIGNALED | COUNTDOWN_STATE_SIGNALED);
export const COUNTDOWN_FIELD_STATE = 0;
export const COUNTDOWN_FIELD_INITIALCOUNT = 1;
export const COUNTDOWN_FIELD_REMAININGCOUNT = 2;
