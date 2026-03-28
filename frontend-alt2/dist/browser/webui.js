"use-strict";

// utils.ts
function addRefreshableEventListener(root, targetSelector, type, listener, options) {
  function rebindListener(mutations) {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches(targetSelector)) {
          node.addEventListener(type, listener, options);
        }
        for (const child of node.querySelectorAll(targetSelector)) {
          if (!(child instanceof HTMLElement)) continue;
          child.addEventListener(type, listener, options);
        }
      }
    }
  }
  const observer = new MutationObserver(rebindListener);
  observer.observe(root, { subtree: true, childList: true });
  return observer;
}
var AsyncFunction = async function() {
}.constructor;

// webui.ts
var WebuiBridge = class {
  // WebUI Settings
  #secure;
  #token;
  #port;
  #log;
  #winX;
  #winY;
  #winW;
  #winH;
  #customWindowDrag;
  // Frameless Dragging
  #enableCustomDragging = false;
  #isDragging = false;
  #initialMouseX = 0;
  #initialMouseY = 0;
  #initialWindowX = window.screenX || window.screenLeft;
  #initialWindowY = window.screenY || window.screenTop;
  #currentWindowX = window.screenX || window.screenLeft;
  #currentWindowY = window.screenY || window.screenTop;
  // Internals
  #ws;
  #wsStayAlive = true;
  #wsStayAliveTimeout = 500;
  #wsWasConnected = false;
  #TokenAccepted = false;
  #closeReason = 0;
  #closeValue;
  #AllEvents = false;
  #callPromiseID = new Uint16Array(1);
  #callPromiseResolve = [];
  #allowNavigation = true;
  #sendQueue = [];
  #isSending = false;
  #bindsList;
  // WebUI Const
  #WEBUI_SIGNATURE = 221;
  #CMD_JS = 254;
  #CMD_JS_QUICK = 253;
  #CMD_CLICK = 252;
  #CMD_NAVIGATION = 251;
  #CMD_CLOSE = 250;
  #CMD_CALL_FUNC = 249;
  #CMD_SEND_RAW = 248;
  #CMD_NEW_ID = 247;
  #CMD_MULTI = 246;
  #CMD_CHECK_TK = 245;
  #CMD_WINDOW_DRAG = 244;
  #CMD_WINDOW_RESIZED = 243;
  #MULTI_CHUNK_SIZE = 65500;
  #PROTOCOL_SIZE = 8;
  // Protocol header size in bytes
  #PROTOCOL_SIGN = 0;
  // Protocol byte position: Signature (1 Byte)
  #PROTOCOL_TOKEN = 1;
  // Protocol byte position: Token (4 Bytes)
  #PROTOCOL_ID = 5;
  // Protocol byte position: ID (2 Bytes)
  #PROTOCOL_CMD = 7;
  // Protocol byte position: Command (1 Byte)
  #PROTOCOL_DATA = 8;
  // Protocol byte position: Data (n Byte)
  #Token = new Uint32Array(1);
  #Ping = true;
  // Events
  #eventsCallback = null;
  #lastEvent = -1;
  event = {
    // TODO: Make `event` static and solve the ESBUILD `_WebuiBridge` issue.
    CONNECTED: 0,
    DISCONNECTED: 1
  };
  // Constructor
  constructor({
    secure = false,
    token = 0,
    port = 0,
    log = false,
    winX = 0,
    winY = 0,
    winW = 0,
    winH = 0,
    customWindowDrag = false
  }) {
    this.#secure = secure;
    this.#token = token;
    this.#port = port;
    this.#log = log;
    this.#winX = winX;
    this.#winY = winY;
    this.#winW = winW;
    this.#winH = winH;
    this.#enableCustomDragging = customWindowDrag;
    this.#Token[0] = this.#token;
    if ("webui" in globalThis) {
      throw new Error("Sorry. WebUI is already defined, only one instance is allowed.");
    }
    if (this.#winX !== void 0 && this.#winY !== void 0) {
    }
    if (this.#winW !== void 0 && this.#winH !== void 0) {
    }
    if (!("WebSocket" in window)) {
      this.#showWarning("WebSocket is not supported by your web browser");
      if (!this.#log) globalThis.close();
    }
    this.#start();
    if ("navigation" in globalThis) {
      globalThis.navigation.addEventListener("navigate", (event) => {
        if (!this.#allowNavigation) {
          if (this.#AllEvents && this.#wsIsConnected()) {
            event.preventDefault();
            const url = new URL(event.destination.url);
            if (this.#log) console.log(`WebUI -> DOM -> Navigation Event [${url.href}]`);
            this.#sendEventNavigation(url.href);
          }
        }
      });
    } else {
      addRefreshableEventListener(document.body, "a", "click", (event) => {
        if (!this.#allowNavigation) {
          if (this.#AllEvents && this.#wsIsConnected()) {
            event.preventDefault();
            const { href } = event.target;
            if (this.#log) console.log(`WebUI -> DOM -> Navigation Click Event [${href}]`);
            this.#sendEventNavigation(href);
          }
        }
      });
    }
    document.addEventListener("keydown", (event) => {
      if (this.#log) return;
      if (event.key === "F5") event.preventDefault();
    });
    if (this.#enableCustomDragging) {
      document.addEventListener("mousemove", (e) => {
        if (e.buttons !== 1) {
          this.#isDragging = false;
          return;
        }
        if (!this.#isDragging) {
          let target = e.target;
          while (target) {
            let computedStyle = window.getComputedStyle(target);
            let webuiComputed = computedStyle.getPropertyValue("--webui-app-region").trim();
            if (webuiComputed === "drag") {
              this.#initialMouseX = e.screenX;
              this.#initialMouseY = e.screenY;
              this.#initialWindowX = this.#currentWindowX;
              this.#initialWindowY = this.#currentWindowY;
              this.#isDragging = true;
              break;
            }
            target = target.parentElement;
          }
          return;
        }
        const deltaX = e.screenX - this.#initialMouseX;
        const deltaY = e.screenY - this.#initialMouseY;
        let newX = this.#initialWindowX + deltaX;
        let newY = this.#initialWindowY + deltaY;
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        this.#sendDrag(newX, newY);
        this.#currentWindowX = newX;
        this.#currentWindowY = newY;
      });
      document.addEventListener("mouseup", () => {
        this.#isDragging = false;
      });
    }
    onbeforeunload = () => {
      this.#close();
    };
    setTimeout(() => {
      if (!this.#wsWasConnected) {
        this.#showWarning("Failed to connect to the backend application");
      }
    }, 5e3);
  }
  // Methods
  #close(reason = 0, value = "") {
    this.#closeReason = reason;
    this.#closeValue = value;
    if (this.#wsIsConnected()) {
      this.#ws.close();
    }
  }
  #showWarning(msg) {
    setTimeout(() => {
      if (!this.#wsIsConnected()) {
        if (document.getElementById("webui-error-connection-lost")) return;
        const div = document.createElement("div");
        div.id = "webui-error-connection-lost";
        Object.assign(div.style, {
          position: "fixed",
          top: "0",
          left: "0",
          width: "100%",
          backgroundColor: "rgb(191 125 30 / 84%)",
          color: "#fff",
          textAlign: "center",
          padding: "4px 0",
          fontFamily: "Arial, sans-serif",
          fontSize: "16px",
          zIndex: "9000",
          lineHeight: "1"
        });
        div.innerHTML = "<strong>Error:</strong> " + msg + " - <em>WebUI 2.5.0-beta.4</em>";
        document.body.insertBefore(div, document.body.firstChild);
      }
    }, 1e3);
  }
  #freezeUi() {
    if (this.#eventsCallback == null) {
      this.#showWarning("Connection with the backend is lost");
    }
  }
  #unfreezeUI() {
    const div = document.getElementById("webui-error-connection-lost");
    if (div) {
      div.remove();
    }
  }
  #isTextBasedCommand(cmd) {
    if (cmd !== this.#CMD_SEND_RAW) return true;
    return false;
  }
  #parseDimensions(input) {
    try {
      const parts = input.split(",");
      if (parts.length !== 4) return { x: 0, y: 0, width: 0, height: 0 };
      const x = parseFloat(parts[0]), y = parseFloat(parts[1]), width = parseFloat(parts[2]), height = parseFloat(parts[3]);
      return [x, y, width, height].some(isNaN) ? { x: 0, y: 0, width: 0, height: 0 } : { x, y, width, height };
    } catch {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
  }
  #getDataStrFromPacket(buffer, startIndex) {
    let stringBytes = [];
    for (let i = startIndex; i < buffer.length; i++) {
      if (buffer[i] === 0) {
        break;
      }
      stringBytes.push(buffer[i]);
    }
    const stringText = new TextDecoder().decode(new Uint8Array(stringBytes));
    return stringText;
  }
  #getID(buffer, index) {
    if (index < 0 || index >= buffer.length - 1) {
      throw new Error("Index out of bounds or insufficient data.");
    }
    const firstByte = buffer[index];
    const secondByte = buffer[index + 1];
    const combined = secondByte << 8 | firstByte;
    return combined;
  }
  #addToken(buffer, value, index) {
    if (value < 0 || value > 4294967295) {
      throw new Error("Number is out of the range for 4 bytes representation.");
    }
    if (index < 0 || index > buffer.length - 4) {
      throw new Error("Index out of bounds or insufficient space in buffer.");
    }
    buffer[index] = value & 255;
    buffer[index + 1] = value >>> 8 & 255;
    buffer[index + 2] = value >>> 16 & 255;
    buffer[index + 3] = value >>> 24 & 255;
  }
  #addID(buffer, value, index) {
    if (value < 0 || value > 65535) {
      throw new Error("Number is out of the range for 2 bytes representation.");
    }
    if (index < 0 || index > buffer.length - 2) {
      throw new Error("Index out of bounds or insufficient space in buffer.");
    }
    buffer[index] = value & 255;
    buffer[index + 1] = value >>> 8 & 255;
  }
  #start() {
    this.#keepAlive();
    this.#callPromiseID[0] = 0;
    this.#wsConnect();
  }
  #keepAlive = async () => {
    while (true) {
      if (this.#Ping) {
        this.#sendData(new TextEncoder().encode("ping"));
      } else {
        this.#Ping = true;
      }
      await new Promise((resolve) => setTimeout(resolve, 2e4));
    }
  };
  #clicksListener() {
    document.querySelectorAll("[id]").forEach((e) => {
      if (this.#AllEvents || e.id !== "" && this.#bindsList.includes(e.id)) {
        if (e.id && !e.dataset.webui_click_is_set) {
          e.dataset.webui_click_is_set = "true";
          e.addEventListener("click", () => this.#sendClick(e.id));
        }
      }
    });
  }
  async #sendData(packet) {
    this.#Ping = false;
    if (!this.#wsIsConnected() || packet === void 0) return;
    this.#sendQueue.push(packet);
    if (this.#isSending) return;
    this.#isSending = true;
    while (this.#sendQueue.length > 0) {
      const currentPacket = this.#sendQueue.shift();
      if (currentPacket.length < this.#MULTI_CHUNK_SIZE) {
        this.#ws.send(currentPacket.buffer);
      } else {
        const pre_packet = Uint8Array.of(
          this.#WEBUI_SIGNATURE,
          0,
          0,
          0,
          0,
          // Token (4 Bytes)
          0,
          0,
          // ID (2 Bytes)
          this.#CMD_MULTI,
          ...new TextEncoder().encode(currentPacket.length.toString()),
          0
        );
        this.#ws.send(pre_packet.buffer);
        let offset = 0;
        const sendChunk = async () => {
          if (offset < currentPacket.length) {
            const chunkSize = Math.min(this.#MULTI_CHUNK_SIZE, currentPacket.length - offset);
            const chunk = currentPacket.subarray(offset, offset + chunkSize);
            this.#ws.send(chunk);
            offset += chunkSize;
            await sendChunk();
          }
        };
        await sendChunk();
      }
    }
    this.#isSending = false;
  }
  #sendClick(elem) {
    if (this.#wsIsConnected()) {
      const packet = elem !== "" ? Uint8Array.of(
        this.#WEBUI_SIGNATURE,
        0,
        0,
        0,
        0,
        // Token (4 Bytes)
        0,
        0,
        // ID (2 Bytes)
        this.#CMD_CLICK,
        ...new TextEncoder().encode(elem),
        0
      ) : Uint8Array.of(
        this.#WEBUI_SIGNATURE,
        0,
        0,
        0,
        0,
        // Token (4 Bytes)
        0,
        0,
        // ID (2 Bytes)
        this.#CMD_CLICK,
        0
      );
      this.#addToken(packet, this.#token, this.#PROTOCOL_TOKEN);
      this.#sendData(packet);
      if (this.#log) console.log(`WebUI -> Send Click [${elem}]`);
    }
  }
  #checkToken() {
    if (this.#wsIsConnected()) {
      const packet = Uint8Array.of(
        this.#WEBUI_SIGNATURE,
        0,
        0,
        0,
        0,
        // Token (4 Bytes)
        0,
        0,
        // ID (2 Bytes)
        this.#CMD_CHECK_TK,
        0
      );
      this.#addToken(packet, this.#token, this.#PROTOCOL_TOKEN);
      this.#sendData(packet);
      if (this.#log) console.log(`WebUI -> Send Token [0x${this.#token.toString(16).padStart(8, "0")}]`);
    }
  }
  #sendEventNavigation(url) {
    if (url !== "") {
      if (this.#wsIsConnected()) {
        if (this.#log) console.log(`WebUI -> Send Navigation Event [${url}]`);
        const packet = Uint8Array.of(
          // Protocol
          // 0: [SIGNATURE]
          // 1: [TOKEN]
          // 2: [ID]
          // 3: [CMD]
          // 4: [URL]
          this.#WEBUI_SIGNATURE,
          0,
          0,
          0,
          0,
          // Token (4 Bytes)
          0,
          0,
          // ID (2 Bytes)
          this.#CMD_NAVIGATION,
          ...new TextEncoder().encode(url)
        );
        this.#addToken(packet, this.#token, this.#PROTOCOL_TOKEN);
        this.#sendData(packet);
      }
    }
  }
  #sendDrag(x, y) {
    if (this.#wsIsConnected()) {
      if (this.#log) console.log(`WebUI -> Send Drag Event [${x}, ${y}]`);
      const packet = Uint8Array.of(
        // Protocol
        // 0: [SIGNATURE]
        // 1: [TOKEN]
        // 2: [ID]
        // 3: [CMD]
        // 4: [X]
        // 4: [Y]
        this.#WEBUI_SIGNATURE,
        0,
        0,
        0,
        0,
        // Token (4 Bytes)
        0,
        0,
        // ID (2 Bytes)
        this.#CMD_WINDOW_DRAG,
        ...new Uint8Array(new Int32Array([x]).buffer),
        ...new Uint8Array(new Int32Array([y]).buffer)
        // Y (4 Bytes)
      );
      this.#addToken(packet, this.#token, this.#PROTOCOL_TOKEN);
      this.#sendData(packet);
    }
  }
  #closeWindowTimer() {
    setTimeout(function() {
      globalThis.close();
    }, 1e3);
  }
  #updateBindsList() {
    if (this.#bindsList.includes("")) {
      this.#AllEvents = true;
      this.#allowNavigation = false;
    }
    this.#generateCallObjects();
    this.#clicksListener();
  }
  #toUint16(value) {
    return value & 65535;
  }
  #generateCallObjects() {
    for (const bind of this.#bindsList) {
      if (bind.trim()) {
        const fn = bind;
        if (fn.trim()) {
          if (fn !== "__webui_core_api__") {
            if (typeof window[fn] === "undefined") {
              this[fn] = (...args) => this.call(fn, ...args);
              window[fn] = (...args) => this.call(fn, ...args);
              if (this.#log) console.log(`WebUI -> Binding backend function [${fn}]`);
            }
          }
        }
      }
    }
  }
  #getScriptUrl() {
    const scripts = Array.from(document.scripts).filter((s) => s.src !== null && s.src.startsWith("http") && s.src.endsWith("webui.js")).map((s) => s.src);
    return scripts.length === 0 ? null : new URL(scripts[0]);
  }
  #callPromise(fn, ...args) {
    --this.#callPromiseID[0];
    const callId = this.#toUint16(this.#callPromiseID[0]);
    let argsLengths = args.map((arg) => {
      if (typeof arg === "object") {
        return arg.length;
      } else {
        return new TextEncoder().encode(arg.toString()).length;
      }
    }).join(";");
    let argsValues = new Uint8Array();
    for (const arg of args) {
      let buffer;
      if (typeof arg === "object") {
        buffer = arg;
      } else {
        buffer = new TextEncoder().encode(arg.toString());
      }
      const temp = new Uint8Array(argsValues.length + buffer.length + 1);
      temp.set(argsValues, 0);
      temp.set(buffer, argsValues.length);
      temp[argsValues.length + buffer.length] = 0;
      argsValues = temp;
    }
    let packet = new Uint8Array(0);
    const packetPush = (data) => {
      const newPacket = new Uint8Array(packet.length + data.length);
      newPacket.set(packet);
      newPacket.set(data, packet.length);
      packet = newPacket;
    };
    packetPush(new Uint8Array([this.#WEBUI_SIGNATURE]));
    packetPush(new Uint8Array([0, 0, 0, 0]));
    packetPush(new Uint8Array([0, 0]));
    packetPush(new Uint8Array([this.#CMD_CALL_FUNC]));
    packetPush(new TextEncoder().encode(fn));
    packetPush(new Uint8Array([0]));
    packetPush(new TextEncoder().encode(argsLengths));
    packetPush(new Uint8Array([0]));
    packetPush(new Uint8Array(argsValues));
    this.#addToken(packet, this.#token, this.#PROTOCOL_TOKEN);
    this.#addID(packet, callId, this.#PROTOCOL_ID);
    return new Promise((resolve) => {
      this.#callPromiseResolve[callId] = resolve;
      this.#sendData(packet);
    });
  }
  async callCore(fn, ...args) {
    return this.call("__webui_core_api__", fn, ...args);
  }
  // -- WebSocket ----------------------------
  #wsIsConnected() {
    return this.#ws && this.#ws.readyState === WebSocket.OPEN;
  }
  #wsConnect() {
    if (this.#wsIsConnected()) {
      this.#ws.close();
    }
    this.#TokenAccepted = false;
    const scriptUrl = this.#getScriptUrl();
    const host = scriptUrl !== null ? scriptUrl.hostname : window.location.hostname;
    const url = this.#secure ? "wss://" + host : "ws://" + host;
    this.#ws = new WebSocket(`${url}:${this.#port}/_webui_ws_connect`);
    this.#ws.binaryType = "arraybuffer";
    this.#ws.onopen = this.#wsOnOpen.bind(this);
    this.#ws.onmessage = this.#wsOnMessage.bind(this);
    this.#ws.onclose = this.#wsOnClose.bind(this);
    this.#ws.onerror = this.#wsOnError.bind(this);
  }
  #wsOnOpen = (event) => {
    this.#wsWasConnected = true;
    this.#unfreezeUI();
    if (this.#log) console.log("WebUI -> Connected");
    this.#checkToken();
  };
  #wsOnError = (event) => {
    if (this.#log) console.log(`WebUI -> Connection failed.`);
  };
  #wsOnClose = (event) => {
    if (this.#closeReason === this.#CMD_NAVIGATION) {
      this.#closeReason = 0;
      if (this.#log) console.log(`WebUI -> Connection lost. Navigation to [${this.#closeValue}]`);
      this.#allowNavigation = true;
      globalThis.location.replace(this.#closeValue);
    } else {
      if (this.#wsStayAlive) {
        if (this.#log) console.log(`WebUI -> Connection lost (${event.code}). Reconnecting...`);
        this.#freezeUi();
        setTimeout(() => this.#wsConnect(), this.#wsStayAliveTimeout);
      } else if (this.#log) {
        console.log(`WebUI -> Connection lost (${event.code})`);
        this.#freezeUi();
      } else {
        this.#closeWindowTimer();
      }
    }
    this.#userEventCallback(this.event.DISCONNECTED);
  };
  #userEventCallback = (e) => {
    if (this.#eventsCallback) {
      if (e != this.#lastEvent) {
        this.#lastEvent = e;
        this.#eventsCallback(e);
      }
    }
  };
  #wsOnMessage = async (event) => {
    var _a, _b;
    const buffer8 = new Uint8Array(event.data);
    if (buffer8.length < this.#PROTOCOL_SIZE) return;
    if (buffer8[this.#PROTOCOL_SIGN] !== this.#WEBUI_SIGNATURE) return;
    if (this.#isTextBasedCommand(buffer8[this.#PROTOCOL_CMD])) {
      const callId = this.#getID(buffer8, this.#PROTOCOL_ID);
      switch (buffer8[this.#PROTOCOL_CMD]) {
        case this.#CMD_JS_QUICK:
        case this.#CMD_JS:
          {
            const script = this.#getDataStrFromPacket(buffer8, this.#PROTOCOL_DATA);
            const scriptSanitize = script.replace(/(?:\r\n|\r|\n)/g, "\n");
            if (this.#log) console.log(`WebUI -> CMD -> JS [${scriptSanitize}]`);
            let FunReturn = "undefined";
            let FunError = false;
            let isBinaryReturn = false;
            try {
              const result = await AsyncFunction(scriptSanitize)();
              if (result instanceof Uint8Array) {
                FunReturn = result;
                isBinaryReturn = true;
              } else {
                FunReturn = String(result);
              }
            } catch (e) {
              FunError = true;
              FunReturn = e.message;
            }
            if (buffer8[this.#PROTOCOL_CMD] === this.#CMD_JS_QUICK) return;
            if (FunReturn === void 0) {
              FunReturn = "undefined";
            }
            if (this.#log && !FunError) {
              if (isBinaryReturn) {
                const binaryData = FunReturn;
                const hexPreview = Array.from(binaryData.slice(0, 64)).map((b) => `0x${b.toString(16).padStart(2, "0")}`).join(", ");
                console.log(`WebUI -> CMD -> JS -> Return Success (${binaryData.length} Bytes) [${hexPreview}${binaryData.length > 64 ? "..." : ""}]`);
              } else {
                const stringData = String(FunReturn);
                console.log(`WebUI -> CMD -> JS -> Return Success (${new TextEncoder().encode(stringData).length} Bytes) [${stringData.substring(0, 64)}${stringData.length > 64 ? "..." : ""}]`);
              }
            } else if (this.#log && FunError) {
              const errorString = String(FunReturn);
              console.log(`WebUI -> CMD -> JS -> Return Error [${errorString.substring(0, 64)}${errorString.length > 64 ? "..." : ""}]`);
            }
            let packet = new Uint8Array(0);
            const packetPush = (data) => {
              const newPacket = new Uint8Array(packet.length + data.length);
              newPacket.set(packet);
              newPacket.set(data, packet.length);
              packet = newPacket;
            };
            const packetPushStr = (data) => {
              const chunkSize = 1024 * 8;
              if (data.length > chunkSize) {
                const encoder = new TextEncoder();
                for (let i = 0; i < data.length; i += chunkSize) {
                  const chunk = data.substring(i, Math.min(i + chunkSize, data.length));
                  const encodedChunk = encoder.encode(chunk);
                  packetPush(encodedChunk);
                }
              } else {
                packetPush(new TextEncoder().encode(data));
              }
            };
            packetPush(new Uint8Array([this.#WEBUI_SIGNATURE]));
            packetPush(new Uint8Array([0, 0, 0, 0]));
            packetPush(new Uint8Array([0, 0]));
            packetPush(new Uint8Array([this.#CMD_JS]));
            packetPush(new Uint8Array(FunError ? [1] : [0]));
            if (isBinaryReturn) {
              packetPush(FunReturn);
            } else {
              packetPushStr(FunReturn);
            }
            packetPush(new Uint8Array([0]));
            this.#addToken(packet, this.#token, this.#PROTOCOL_TOKEN);
            this.#addID(packet, callId, this.#PROTOCOL_ID);
            this.#sendData(packet);
          }
          break;
        case this.#CMD_CALL_FUNC:
          {
            const callResponse = this.#getDataStrFromPacket(buffer8, this.#PROTOCOL_DATA);
            if (this.#log) {
              console.log(`WebUI -> CMD -> Call Response [${callResponse}]`);
            }
            if (this.#callPromiseResolve[callId]) {
              if (this.#log) {
                console.log(`WebUI -> CMD -> Resolving Response #${callId}...`);
              }
              (_b = (_a = this.#callPromiseResolve)[callId]) == null ? void 0 : _b.call(_a, callResponse);
              this.#callPromiseResolve[callId] = void 0;
            }
          }
          break;
        case this.#CMD_NAVIGATION:
          const url = this.#getDataStrFromPacket(buffer8, this.#PROTOCOL_DATA);
          if (this.#log) console.log(`WebUI -> CMD -> Navigation [${url}]`);
          this.#close(this.#CMD_NAVIGATION, url);
          break;
        case this.#CMD_WINDOW_RESIZED:
          const widthAndHeight = this.#getDataStrFromPacket(buffer8, this.#PROTOCOL_DATA);
          const { x, y, width, height } = this.#parseDimensions(widthAndHeight);
          this.#currentWindowX = x;
          this.#currentWindowY = y;
          if (this.#log) console.log(`WebUI -> CMD -> Window Resized [x: ${x}, y: ${y}, width: ${width}, height: ${height}]`);
          break;
        case this.#CMD_NEW_ID:
          const newElement = this.#getDataStrFromPacket(buffer8, this.#PROTOCOL_DATA);
          if (this.#log) console.log(`WebUI -> CMD -> New Bind ID [${newElement}]`);
          if (!this.#bindsList.includes(newElement)) this.#bindsList.push(newElement);
          this.#updateBindsList();
          break;
        case this.#CMD_CLOSE:
          if (this.#log) {
            console.log(`WebUI -> CMD -> Close`);
            if (this.#wsIsConnected()) {
              this.#wsStayAlive = false;
              this.#ws.close();
            }
          } else {
            globalThis.close();
          }
          break;
        case this.#CMD_CHECK_TK:
          const status = buffer8[this.#PROTOCOL_DATA] == 0 ? false : true;
          const tokenHex = `0x${this.#token.toString(16).padStart(8, "0")}`;
          if (status) {
            if (this.#log) console.log(`WebUI -> CMD -> Token [${tokenHex}] Accepted`);
            this.#TokenAccepted = true;
            let csv = this.#getDataStrFromPacket(buffer8, this.#PROTOCOL_DATA + 1);
            csv = csv.endsWith(",") ? csv.slice(0, -1) : csv;
            this.#bindsList = csv.split(",");
            this.#updateBindsList();
            this.#userEventCallback(this.event.CONNECTED);
          } else {
            if (this.#log) console.log(`WebUI -> CMD -> Token [${tokenHex}] Not Accepted. Reload page...`);
            this.#allowNavigation = true;
            this.#wsStayAlive = false;
            globalThis.location.reload();
          }
          break;
      }
    } else {
      switch (buffer8[this.#PROTOCOL_CMD]) {
        case this.#CMD_SEND_RAW:
          const functionName = this.#getDataStrFromPacket(buffer8, this.#PROTOCOL_DATA);
          const rawDataIndex = this.#PROTOCOL_DATA + functionName.length + 1;
          const rawDataSize = buffer8.length - rawDataIndex - 1;
          const userRawData = buffer8.subarray(rawDataIndex, rawDataIndex + rawDataSize);
          if (this.#log) console.log(`WebUI -> CMD -> Received Raw ${rawDataSize} bytes for [${functionName}()]`);
          if (typeof window[functionName] === "function") window[functionName](userRawData);
          else await AsyncFunction(functionName + "(userRawData)")();
          break;
      }
    }
  };
  // -- Public APIs --------------------------
  /**
   * Call a backend function
   *
   * @param fn - binding name
   * @param data - data to be send to the backend function
   * @return - Response of the backend callback string
   * @example - const res = await webui.call("myID", 123, true, "Hi", new Uint8Array([0x42, 0x43, 0x44]))
   */
  async call(fn, ...args) {
    if (!fn) return Promise.reject(new SyntaxError("No binding name is provided"));
    if (!this.#wsIsConnected()) return Promise.reject(new Error("WebSocket is not connected"));
    if (fn !== "__webui_core_api__") {
      if (!this.#AllEvents && !this.#bindsList.includes(`${fn}`))
        return Promise.reject(new ReferenceError(`No binding was found for "${fn}"`));
    }
    if (this.#log) console.log(`WebUI -> Calling [${fn}(...)]`);
    const response = await this.#callPromise(fn, ...args);
    if (typeof response !== "string") return "";
    return response;
  }
  /**
   * Active or deactivate webui debug logging
   *
   * @param status - log status to set
   */
  setLogging(status) {
    if (status) {
      console.log("WebUI -> Log Enabled.");
      this.#log = true;
    } else {
      console.log("WebUI -> Log Disabled.");
      this.#log = false;
    }
  }
  /**
   * Encode text into base64 string
   *
   * @param data - text string
   */
  encode(data) {
    return btoa(data);
  }
  /**
   * Decode base64 string into text
   *
   * @param data - base64 string
   */
  decode(data) {
    return atob(data);
  }
  /**
   * Set a callback to receive events like connect/disconnect
   *
   * @param callback - callback function `myCallback(e)`
   * @example - webui.setEventCallback((e) => {if(e == webui.event.CONNECTED){ ... }});
   */
  setEventCallback(callback) {
    this.#eventsCallback = callback;
  }
  /**
   * Check if UI is connected to the back-end. The connection
   * is done by including `webui.js` virtual file in the HTML.
   *
   * @return - Boolean `true` if connected
   */
  isConnected() {
    return this.#wsIsConnected() && this.#TokenAccepted;
  }
  /**
   * Get OS high contrast preference.
   *
   * @return - Boolean `True` if OS is using high contrast theme
   */
  async isHighContrast() {
    const response = await this.callCore("high_contrast");
    if (this.#log) console.log(`Core Response: [${response}]`);
    return response;
  }
  /**
   * When binding all events on the backend, WebUI blocks all navigation events
   * and sends them to the backend. This API allows you to control that behavior.
   *
   * @param status - Boolean `True` means WebUI will allow navigations
   * @example - webui.allowNavigation(true); // Allow navigation
   * window.location.replace('www.test.com'); // This will now proceed as usual
   */
  allowNavigation(status) {
    this.#allowNavigation = status;
  }
};
addEventListener("load", () => {
  document.body.addEventListener("contextmenu", (event) => event.preventDefault());
  addRefreshableEventListener(document.body, "input", "contextmenu", (event) => event.stopPropagation());
});
