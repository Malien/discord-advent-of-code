import { nanoid } from "nanoid"
import pino from "pino"
import { AsyncLocalStorage } from "node:async_hooks"

export type Subsystem = "Discord" | "Telegram"
export const subsystemCtx = new AsyncLocalStorage<Subsystem>()
export const requestIdCtx = new AsyncLocalStorage<string>()

export const logger = pino({
    mixin: () => ({
        subsystem: subsystemCtx.getStore(),
        requestId: requestIdCtx.getStore(),
    }),
})

export const loggers = {
    discord: logger.child({ subsystem: "Discord" }),
    telegram: logger.child({ subsystem: "Telegram" }),
}

export function withRequestId(subsystem: Subsystem, fn: () => void) {
    subsystemCtx.run(subsystem, () => {
        requestIdCtx.run(nanoid(), fn)
    })
}
