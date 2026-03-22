import { validateRouteConflictsAsync } from "../router/routeTable.js";
import { appLogger } from "../utils/logger.js";
/**
 * Run all app validations for the given app directory.
 * - Routes: duplicate handler per path+method (and more in future).
 * When isBuild is true, logs each validation step; otherwise runs silently.
 * Throws on first validation failure.
 */
export async function validateApp(appDir, options) {
    try {
        const { isBuild = false, isRecursive = true } = options ?? {};
        if (isBuild) {
            appLogger.info("  validating routes...");
        }
        await validateRouteConflictsAsync(appDir, { isRecursive });
        return true;
    }
    catch (error) {
        appLogger.error("[legonode] validation failed", error.message);
        return false;
    }
}
//# sourceMappingURL=validateApp.js.map