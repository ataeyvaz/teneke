/** Custom protocol the browser UI is served from in production builds. */
export const APP_SCHEME = 'app'
/** Host used for the browser UI on the custom protocol: app://ui/index.html */
export const UI_HOST = 'ui'
export const UI_ORIGIN = `${APP_SCHEME}://${UI_HOST}`

/** Height (px) of the browser UI strip at the top of the window. */
export const TOOLBAR_HEIGHT = 48

/** Page opened in a new tab until the settings page exists (Phase 3). */
export const DEFAULT_HOMEPAGE = 'https://duckduckgo.com'

/**
 * Search engine used for non-URL address bar input. `%s` is replaced with the
 * URL-encoded query. Becomes a user setting in Phase 3.
 */
export const DEFAULT_SEARCH_TEMPLATE = 'https://duckduckgo.com/?q=%s'

/** Session partitions. The UI never shares a session with web content. */
export const UI_PARTITION = 'teneke-ui'
export const CONTENT_PARTITION = 'persist:default'
