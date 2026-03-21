//! Zig bindings for WebUI library
//! https://webui.me

const std = @import("std");
const c = @cImport({
    @cInclude("webui.h");
});

/// Browser options for webui_show_browser
pub const Browser = enum(usize) {
    NoBrowser = 0,
    AnyBrowser = 1,
    Chrome = 2,
    Firefox = 3,
    Edge = 4,
    Safari = 5,
    Chromium = 6,
    Opera = 7,
    Brave = 8,
    Vivaldi = 9,
    Epic = 10,
    Yandex = 11,
    ChromiumBased = 12,
    Webview = 13,
};

/// Runtime options for JavaScript/TypeScript execution
pub const Runtime = enum(usize) {
    None = 0,
    Deno = 1,
    NodeJS = 2,
    Bun = 3,
};

/// Event types
pub const EventType = enum(usize) {
    Disconnected = 0,
    Connected = 1,
    MouseClick = 2,
    Navigation = 3,
    Callback = 4,
};

/// WebUI version string
pub const version = c.WEBUI_VERSION;

/// WebUI event structure wrapper
pub const Event = struct {
    ptr: [*c]c.webui_event_t,

    pub fn getWindow(self: *const Event) usize {
        return self.ptr.*.window;
    }

    pub fn getEventType(self: *const Event) EventType {
        return @enumFromInt(self.ptr.*.event_type);
    }

    pub fn getElementId(self: *const Event) []const u8 {
        const ptr = self.ptr.*.element;
        if (ptr == null) return "";
        return std.mem.sliceTo(ptr, 0);
    }

    pub fn getBindId(self: *const Event) usize {
        return self.ptr.*.bind_id;
    }

    pub fn getEventNumber(self: *const Event) usize {
        return self.ptr.*.event_number;
    }

    pub fn getClientId(self: *const Event) usize {
        return self.ptr.*.client_id;
    }

    pub fn getConnectionId(self: *const Event) usize {
        return self.ptr.*.connection_id;
    }

    pub fn getCookies(self: *const Event) []const u8 {
        const ptr = self.ptr.*.cookies;
        if (ptr == null) return "";
        return std.mem.sliceTo(ptr, 0);
    }
};

/// Create a new window
pub fn newWindow() usize {
    return c.webui_new_window();
}

/// Create a new window with a specific ID
pub fn newWindowId(id: usize) usize {
    return c.webui_new_window_id(id);
}

/// Get a free window ID
pub fn getFreeWindowId() usize {
    return c.webui_get_new_window_id();
}

/// Show a window with HTML content or file
pub fn show(window: usize, content: []const u8) bool {
    return c.webui_show(window, content.ptr);
}

/// Show a window with HTML content and a specific browser
pub fn showBrowser(window: usize, content: []const u8, browser: Browser) bool {
    return c.webui_show_browser(window, content.ptr, @intFromEnum(browser));
}

/// Show a window using WebView
pub fn showWebView(window: usize, content: []const u8) bool {
    return c.webui_show_wv(window, content.ptr);
}

/// Start server and get URL
pub fn startServer(window: usize, content: []const u8) ?[]const u8 {
    const ptr = c.webui_start_server(window, content.ptr);
    if (ptr == null) return null;
    return std.mem.sliceTo(ptr, 0);
}

/// Set the root folder for the window
pub fn setRootFolder(window: usize, path: []const u8) bool {
    return c.webui_set_root_folder(window, path.ptr);
}

/// Set the default root folder
pub fn setDefaultRootFolder(path: []const u8) bool {
    return c.webui_set_default_root_folder(path.ptr);
}

/// Set the runtime for JavaScript/TypeScript files
pub fn setRuntime(window: usize, runtime: Runtime) void {
    c.webui_set_runtime(window, @intFromEnum(runtime));
}

/// Bind an element ID to a callback function
pub fn bind(
    window: usize,
    element: []const u8,
    comptime callback_fn: *const fn (?*Event) callconv(.c) void,
) usize {
    const Wrapper = struct {
        pub fn cCallback(e: [*c]c.webui_event_t) callconv(.c) void {
            callback_fn(@ptrCast(@alignCast(e)));
        }
    };
    return c.webui_bind(window, element.ptr, Wrapper.cCallback);
}

/// Set context data for a bind
pub fn setContext(window: usize, element: []const u8, context: *anyopaque) void {
    c.webui_set_context(window, element.ptr, context);
}

/// Get context data from event
pub fn getContext(event: *Event) ?*anyopaque {
    return c.webui_get_context(event.ptr);
}

/// Get the best browser for a window
pub fn getBestBrowser(window: usize) Browser {
    return @enumFromInt(c.webui_get_best_browser(window));
}

/// Run JavaScript in the window
pub fn run(window: usize, js: []const u8) void {
    c.webui_run(window, js.ptr);
}

/// Close a window
pub fn close(window: usize) void {
    c.webui_close(window);
}

/// Destroy a window
pub fn destroy(window: usize) void {
    c.webui_destroy(window);
}

/// Close all windows and exit
pub fn exit() void {
    c.webui_exit();
}

/// Wait until all windows are closed
pub fn wait() void {
    c.webui_wait();
}

/// Wait asynchronously
pub fn waitAsync() bool {
    return c.webui_wait_async();
}

/// Minimize a window
pub fn minimize(window: usize) void {
    c.webui_minimize(window);
}

/// Maximize a window
pub fn maximize(window: usize) void {
    c.webui_maximize(window);
}

/// Focus a window
pub fn focus(window: usize) void {
    c.webui_focus(window);
}

/// Set Kiosk mode (full screen)
pub fn setKiosk(window: usize, status: bool) void {
    c.webui_set_kiosk(window, status);
}

/// Set high contrast mode
pub fn setHighContrast(window: usize, status: bool) void {
    c.webui_set_high_contrast(window, status);
}

/// Check if OS is using high contrast
pub fn isHighContrast() bool {
    return c.webui_is_high_contrast();
}

/// Set window resizable
pub fn setResizable(window: usize, status: bool) void {
    c.webui_set_resizable(window, status);
}

/// Check if a browser is installed
pub fn isBrowserInstalled(browser: Browser) bool {
    return c.webui_browser_exist(@intFromEnum(browser));
}

/// Open a URL in the default browser
pub fn openUrl(url: []const u8) void {
    c.webui_open_url(url.ptr);
}

/// Set the file handler for custom file serving
pub fn setFileHandler(
    window: usize,
    comptime callback_fn: *const fn ([*c]const u8, [*c]c_int) callconv(.c) ?[*c]const u8,
) void {
    c.webui_set_file_handler(window, callback_fn);
}

/// Set the file handler for a specific window
pub fn setFileHandlerWindow(
    window: usize,
    comptime callback_fn: *const fn (usize, [*c]const u8, [*c]c_int) callconv(.c) ?[*c]const u8,
) void {
    c.webui_set_file_handler_window(window, callback_fn);
}

/// Set the window size
pub fn setSize(window: usize, width: u32, height: u32) void {
    c.webui_set_size(window, width, height);
}

/// Set the window minimum size
pub fn setMinimumSize(window: usize, width: u32, height: u32) void {
    c.webui_set_minimum_size(window, width, height);
}

/// Set the window position
pub fn setPosition(window: usize, x: u32, y: u32) void {
    c.webui_set_position(window, x, y);
}

/// Center the window
pub fn setCenter(window: usize) void {
    c.webui_set_center(window);
}

/// Set the window icon
pub fn setIcon(window: usize, icon: []const u8, icon_type: []const u8) void {
    c.webui_set_icon(window, icon.ptr, icon_type.ptr);
}

/// Hide window
pub fn hide(window: usize) void {
    c.webui_set_hide(window, true);
}

/// Show window
pub fn showWindow(window: usize) void {
    c.webui_set_hide(window, false);
}

/// Set window frameless
pub fn setFrameless(window: usize, enabled: bool) void {
    c.webui_set_frameless(window, enabled);
}

/// Set window transparent
pub fn setTransparent(window: usize, enabled: bool) void {
    c.webui_set_transparent(window, enabled);
}

/// Set the profile
pub fn setProfile(window: usize, name: []const u8, path: []const u8) void {
    c.webui_set_profile(window, name.ptr, path.ptr);
}

/// Set the proxy
pub fn setProxy(window: usize, proxy_server: []const u8) void {
    c.webui_set_proxy(window, proxy_server.ptr);
}

/// Set public mode
pub fn setPublic(window: usize, status: bool) void {
    c.webui_set_public(window, status);
}

/// Set the port
pub fn setPort(window: usize, port: usize) bool {
    return c.webui_set_port(window, port);
}

/// Set the timeout
pub fn setTimeout(seconds: usize) void {
    c.webui_set_timeout(seconds);
}

/// Set event blocking
pub fn setEventBlocking(window: usize, status: bool) void {
    c.webui_set_event_blocking(window, status);
}

/// Set custom browser parameters
pub fn setCustomParameters(window: usize, params: []const u8) void {
    c.webui_set_custom_parameters(window, params.ptr);
}

/// Set the browser folder path
pub fn setBrowserFolder(path: []const u8) void {
    c.webui_set_browser_folder(path.ptr);
}

/// Set TLS certificate
pub fn setTlsCertificate(certificate_pem: []const u8, private_key_pem: []const u8) bool {
    return c.webui_set_tls_certificate(certificate_pem.ptr, private_key_pem.ptr);
}

/// Set config option
pub fn setConfig(option: Config, status: bool) void {
    c.webui_set_config(@intFromEnum(option), status);
}

/// Config options
pub const Config = enum(usize) {
    show_wait_connection = 0,
    ui_event_blocking = 1,
    folder_monitor = 2,
    multi_client = 3,
    use_cookies = 4,
    asynchronous_response = 5,
};
