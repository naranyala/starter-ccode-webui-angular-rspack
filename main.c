#include <stdio.h>
#include <string.h>
#include "webui.h"

// HTML content
const char* html_content = 
    "<!DOCTYPE html>"
    "<html>"
    "<head>"
    "  <title>WebUI Demo</title>"
    "  <style>"
    "    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }"
    "    h1 { color: #333; }"
    "    button { padding: 10px 20px; font-size: 16px; cursor: pointer; }"
    "    #result { margin-top: 20px; font-size: 18px; color: #007bff; }"
    "  </style>"
    "</head>"
    "<body>"
    "  <h1>Hello from WebUI!</h1>"
    "  <p>This is a C application with embedded web interface.</p>"
    "  <button onclick=\"my_function('Hello from JavaScript!')\">Click Me</button>"
    "  <div id=\"result\"></div>"
    "  <script>"
    "    function my_function(arg) {"
    "      document.getElementById('result').innerText = arg;"
    "    }"
    "  </script>"
    "</body>"
    "</html>";

// Event handler callback
void my_function(webui_event_t* e) {
    const char* arg = webui_get_string_at(e, 1);
    printf("JavaScript called my_function with: %s\n", arg);
    
    // Run JavaScript to update the DOM
    char script[256];
    snprintf(script, sizeof(script), 
        "document.getElementById('result').innerText = '%s';", arg);
    webui_run(e->window, script);
}

int main(void) {
    // Create new window
    size_t my_window = webui_new_window();
    
    // Bind JavaScript function to C handler
    webui_bind(my_window, "my_function", my_function);
    
    // Show the window with HTML content
    webui_show(my_window, html_content);
    
    // Wait until all windows get closed
    webui_wait();
    
    // Close all windows and clean up
    webui_clean();
    
    return 0;
}
