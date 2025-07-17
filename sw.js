let vfs = null;

/**
 * Converts a Base64-encoded string to an ArrayBuffer.
 * Used for binary content stored in Base64 format.
 * @param {string} base64 - Base64 encoded string.
 * @returns {ArrayBuffer}
 */
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Listens for messages to receive the virtual file system (VFS).
 */
self.addEventListener("message", (event) => {
    if (event.data.type === "vfs") {
        vfs = event.data.vfs.files;
        console.log("[Service Worker] VFS received");
        event.ports[0].postMessage({ status: "VFS received" });
    }
});

/**
 * Service worker installation handler.
 */
self.addEventListener("install", () => {
    console.log("[Service Worker] Installed");
});

/**
 * Service worker activation handler.
 */
self.addEventListener("activate", (event) => {
    console.log("[Service Worker] Activated");
    event.waitUntil(clients.claim()); // Take control of uncontrolled pages
});

/**
 * Attempts to resolve the MIME type based on the file extension.
 * Falls back to `application/octet-stream` for binary or `text/plain` for text.
 * @param {string} path - File path (URL pathname).
 * @param {boolean} isBinary - Whether the file is binary.
 * @returns {string}
 */
function getMimeType(path, isBinary) {
    if (path.endsWith(".wasm")) return "application/wasm";
    if (path.endsWith(".js")) return "application/javascript";
    if (path.endsWith(".svg")) return "image/svg+xml";
    if (path.endsWith(".html")) return "text/html";
    if (path.endsWith(".css")) return "text/css";
    if (path.endsWith(".json")) return "application/json";
    if (path.endsWith(".png")) return "image/png";
    if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
    if (path.endsWith(".txt")) return "text/plain";

    return isBinary ? "application/octet-stream" : "text/plain";
}

/**
 * Fetch handler for serving virtual files.
 */
self.addEventListener("fetch", async (event) => {
    const url = new URL(event.request.url);
    const path = url.pathname.slice(1); // Remove leading slash

    if (!vfs) {
        console.log("[Service Worker] VFS not yet set. Waiting...");
        await new Promise((resolve) => {
            const interval = setInterval(() => {
                if (vfs) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    const file = vfs.get(path);
    const typeHint = vfs.get(path + ".type");

    if (!file) return; // Let the network handle the request if file not found

    const isBinary = typeHint === "bin";
    const mimeType = getMimeType(path, isBinary);

    console.log(`[Service Worker] Serving: ${path} (${mimeType})`);

    const response = isBinary
        ? new Response(base64ToArrayBuffer(file), {
              headers: { "Content-Type": mimeType },
          })
        : new Response(file, {
              headers: { "Content-Type": mimeType },
          });

    event.respondWith(response);
});
