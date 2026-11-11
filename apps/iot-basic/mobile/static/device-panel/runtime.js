/* 自动生成：来源 apps/web/packages/saas/src/device-panel/native-host.ts。 */
"use strict";
(() => {
  // apps/web/packages/saas/src/device-panel/bridge.ts
  function bridgeError(code, message) {
    return Object.assign(new Error(message), { code });
  }
  function validateApiRequest(params) {
    requestObject(params);
    onlyKeys(params, ["path", "data"]);
    if (typeof params.path !== "string" || !/^\/api\/v1\/[\w-]+(?:\/[\w-]+)*$/.test(params.path))
      throw bridgeError("INVALID_PARAMS", "\u8BF7\u4F7F\u7528 /api/v1/ \u5F00\u5934\u7684\u5E73\u53F0\u63A5\u53E3\u8DEF\u5F84");
    if (params.data !== void 0) requestObject(params.data);
  }
  function requestObject(value) {
    if (!value || Object.prototype.toString.call(value) !== "[object Object]") throw bridgeError("INVALID_PARAMS", "\u8BF7\u6C42\u53C2\u6570\u5FC5\u987B\u662F\u5BF9\u8C61");
  }
  function onlyKeys(params, allowed) {
    if (Object.keys(params).some((key) => !allowed.includes(key))) throw bridgeError("INVALID_PARAMS", "\u5305\u542B\u672A\u652F\u6301\u7684\u53C2\u6570");
  }
  function messageID() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  function scopedModel(adapter, requirements) {
    return {
      properties: requirements.filter((item) => item.kind === "property").map((item) => ({
        ...adapter.model.properties.find((field) => field.identifier === item.identifier),
        identifier: item.identifier,
        type: adapter.model.properties.find((field) => field.identifier === item.identifier)?.type || String(item.define?.type || ""),
        mode: adapter.model.properties.find((field) => field.identifier === item.identifier)?.mode || "r",
        available: adapter.model.properties.some(
          (field) => field.identifier === item.identifier && field.available !== false && matchesRequirement(item, field)
        ),
        panelAccess: item.access
      })),
      actions: requirements.filter((item) => item.kind === "action").map((item) => ({
        ...adapter.model.actions.find((field) => field.identifier === item.identifier),
        identifier: item.identifier,
        available: adapter.model.actions.some((field) => field.identifier === item.identifier && field.available !== false && matchesRequirement(item, field))
      }))
    };
  }
  function attachPanelBridge(frame, adapter, requirements, onError) {
    const completed = /* @__PURE__ */ new Map();
    const model = scopedModel(adapter, requirements);
    const sessionID = messageID();
    const subscriptions = /* @__PURE__ */ new Map();
    let disposed = false;
    let port;
    const send = (message) => {
      try {
        if (!disposed && port)
          port.postMessage(JSON.parse(JSON.stringify({ protocol: "ur-panel/v1", sessionID, ...message })));
      } catch {
        onError?.("\u9762\u677F\u54CD\u5E94\u65E0\u6CD5\u5E8F\u5217\u5316");
      }
    };
    const dispatch = async (method, params) => {
      requestObject(params);
      switch (method) {
        case "getAuth": {
          onlyKeys(params, []);
          if (!adapter.getAuth) throw bridgeError("UNSUPPORTED_CAPABILITY", "\u5F53\u524D\u5BBF\u4E3B\u672A\u63D0\u4F9B\u8BA4\u8BC1\u4FE1\u606F");
          return adapter.getAuth();
        }
        case "getContext": {
          onlyKeys(params, []);
          return {
            ...adapter.context,
            capabilities: {
              ...adapter.context.capabilities,
              settings: { available: !!adapter.openSettings }
            }
          };
        }
        case "getThingModel": {
          onlyKeys(params, []);
          return model;
        }
        case "invokeAction": {
          onlyKeys(params, ["identifier", "params"]);
          const action = model.actions.find((item) => item.identifier === params.identifier && item.available !== false);
          if (!action) throw bridgeError("FORBIDDEN", "\u884C\u4E3A\u672A\u58F0\u660E\u6216\u4E0D\u53EF\u7528");
          requestObject(params.params);
          const inputs = action.input || {};
          if (Object.keys(params.params).some((key) => !hasOwn(inputs, key)) || Object.keys(inputs).some((key) => !hasOwn(params.params, key)))
            throw bridgeError("INVALID_PARAMS", "\u884C\u4E3A\u8F93\u5165\u53C2\u6570\u4E0D\u5339\u914D");
          for (const [key, value] of Object.entries(params.params)) validateValue(inputs[key], value);
          return adapter.invokeAction(params.identifier, params.params);
        }
        case "openSettings": {
          onlyKeys(params, []);
          if (!adapter.openSettings) throw bridgeError("UNSUPPORTED_CAPABILITY", "\u5F53\u524D\u5BBF\u4E3B\u4E0D\u652F\u6301\u8BBE\u5907\u8BBE\u7F6E");
          await adapter.openSettings();
          return { opened: true };
        }
        case "readProperties": {
          onlyKeys(params, ["identifiers"]);
          const ids = params.identifiers ?? model.properties.filter((field) => field.available !== false).map((field) => field.identifier);
          if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string" || !model.properties.some((field) => field.identifier === id)))
            throw bridgeError("INVALID_PARAMS", "\u672A\u77E5\u6216\u672A\u58F0\u660E\u7684\u5C5E\u6027");
          if (ids.some((id) => model.properties.find((field) => field.identifier === id)?.available === false))
            throw bridgeError("UNSUPPORTED_CAPABILITY", "\u5C5E\u6027\u4E0D\u53EF\u7528");
          const values = await adapter.readProperties(ids);
          requestObject(values);
          return Object.fromEntries(Object.entries(values).filter(([key]) => ids.includes(key)));
        }
        case "request": {
          validateApiRequest(params);
          if (!adapter.request) throw bridgeError("UNSUPPORTED_CAPABILITY", "\u5F53\u524D\u5BBF\u4E3B\u672A\u63D0\u4F9B\u5E73\u53F0\u63A5\u53E3\u8C03\u7528");
          return adapter.request(params);
        }
        case "subscribe": {
          onlyKeys(params, ["topics"]);
          if (!Array.isArray(params.topics) || params.topics.some((topic) => !["command", "connection", "property"].includes(topic)))
            throw bridgeError("INVALID_PARAMS", "\u8BA2\u9605\u4E3B\u9898\u65E0\u6548");
          const subscriptionID = messageID();
          subscriptions.set(
            subscriptionID,
            adapter.subscribe(params.topics, (event) => {
              if (!params.topics.includes(event.topic)) return;
              const data = event.topic === "property" ? Object.fromEntries(
                Object.entries(event.data).filter(([key]) => model.properties.some((field) => field.identifier === key && field.available !== false))
              ) : event.data;
              send({ type: "event", subscriptionID, topic: event.topic, data, timestamp: event.timestamp ?? Date.now() });
            })
          );
          return { subscriptionID };
        }
        case "unsubscribe": {
          onlyKeys(params, ["subscriptionID"]);
          subscriptions.get(params.subscriptionID)?.();
          subscriptions.delete(params.subscriptionID);
          return {};
        }
        case "writeProperties": {
          onlyKeys(params, ["values", "completion"]);
          if (params.completion !== void 0 && params.completion !== "receipt") throw bridgeError("INVALID_PARAMS", "\u547D\u4EE4\u5B8C\u6210\u65B9\u5F0F\u65E0\u6548");
          requestObject(params.values);
          if (Object.keys(params.values).length === 0) throw bridgeError("INVALID_PARAMS", "\u5199\u5165\u503C\u4E0D\u80FD\u4E3A\u7A7A");
          for (const [id, value] of Object.entries(params.values)) {
            const field = model.properties.find((field2) => field2.identifier === id);
            if (!field || field.available === false || field.mode !== "rw" || field.panelAccess !== "write")
              throw bridgeError("FORBIDDEN", "\u5C5E\u6027\u672A\u58F0\u660E\u5199\u5165\u6216\u5F53\u524D\u4E0D\u53EF\u5199");
            validatePropertyValue(field, value);
          }
          return params.completion === "receipt" ? adapter.writeProperties(params.values, { completion: "receipt" }) : adapter.writeProperties(params.values);
        }
        default: {
          throw bridgeError("UNSUPPORTED_CAPABILITY", "\u672A\u77E5\u7684\u9762\u677F\u65B9\u6CD5");
        }
      }
    };
    const onRequest = async (event) => {
      const message = event.data;
      if (disposed || !message || message.protocol !== "ur-panel/v1" || message.sessionID !== sessionID || message.type !== "request" || typeof message.id !== "string")
        return;
      let serialized;
      try {
        serialized = JSON.stringify(message);
      } catch {
        send({ type: "response", id: message.id, ok: false, error: { code: "INVALID_PARAMS", message: "\u8BF7\u6C42\u5FC5\u987B\u53EF\u5E8F\u5217\u5316" } });
        return;
      }
      if (serialized.length > 65536 || message.id.length > 128 || completed.size >= 1e3 && !completed.has(message.id)) {
        send({ type: "response", id: message.id, ok: false, error: { code: "INVALID_PARAMS", message: "\u8BF7\u6C42\u5927\u5C0F\u6216\u6570\u91CF\u8D85\u9650\uFF0C\u8BF7\u91CD\u65B0\u8FDB\u5165\u9762\u677F" } });
        return;
      }
      const fingerprint = JSON.stringify([message.method, message.params]);
      const prior = completed.get(message.id);
      if (prior && prior.fingerprint !== fingerprint) {
        send({ type: "response", id: message.id, ok: false, error: { code: "INVALID_PARAMS", message: "\u8BF7\u6C42 ID \u5DF2\u7528\u4E8E\u5176\u4ED6\u53C2\u6570" } });
        return;
      }
      const response = prior?.response ?? Promise.resolve().then(() => dispatch(message.method, message.params ?? {})).then(
        (result) => ({ type: "response", id: message.id, ok: true, result }),
        (error) => ({
          type: "response",
          id: message.id,
          ok: false,
          error: { code: error.code || "INVALID_PARAMS", message: error.message || "\u9762\u677F\u64CD\u4F5C\u5931\u8D25" }
        })
      );
      if (!prior) completed.set(message.id, { fingerprint, response });
      send(await response);
    };
    const ready = (event) => {
      if (disposed || port || event.source !== frame.contentWindow || event.data?.protocol !== "ur-panel/v1" || event.data.type !== "ready") return;
      const channel = new MessageChannel();
      port = channel.port1;
      port.addEventListener("message", onRequest);
      port.start();
      frame.contentWindow?.postMessage({ protocol: "ur-panel/v1", type: "init", sessionID, context: adapter.context }, "*", [channel.port2]);
      clearTimeout(timer);
    };
    const timer = setTimeout(() => {
      if (!port && !disposed) onError?.("\u9762\u677F SDK \u521D\u59CB\u5316\u8D85\u65F6");
    }, 5e3);
    window.addEventListener("message", ready);
    return () => {
      if (disposed) return;
      send({ type: "close" });
      disposed = true;
      clearTimeout(timer);
      window.removeEventListener("message", ready);
      for (const cleanup of subscriptions.values()) cleanup();
      subscriptions.clear();
      completed.clear();
      port?.close();
      adapter.dispose?.();
    };
  }
  function validateValue(define, value) {
    try {
      validateDefineValue(define, value);
    } catch {
      throw bridgeError("INVALID_PARAMS", "\u884C\u4E3A\u8F93\u5165\u503C\u4E0D\u7B26\u5408\u5B9E\u9645\u7269\u6A21\u578B");
    }
  }
  function validatePropertyValue(define, value) {
    try {
      validateDefineValue(define, value);
    } catch {
      throw bridgeError("INVALID_PARAMS", "\u5C5E\u6027\u503C\u4E0D\u7B26\u5408\u5B9E\u9645\u7269\u6A21\u578B");
    }
  }
  function validateDefineValue(define, value) {
    const type = define?.type;
    if (type === "bool" && typeof value === "boolean") return;
    if (type === "string" && typeof value === "string") {
      const maxLength = Number(define.maxLen ?? define.max);
      if (Number.isFinite(maxLength) && value.length > maxLength) throw new Error("\u5B57\u7B26\u4E32\u8D85\u957F");
      return;
    }
    if (type === "enum" && ["number", "string"].includes(typeof value) && hasOwn(define.mapping || define.values || {}, String(value))) return;
    if (["float", "int", "timestamp"].includes(type) && typeof value === "number" && Number.isFinite(value)) {
      if (type !== "float" && !Number.isSafeInteger(value)) throw new Error("\u6574\u6570\u7C7B\u578B\u65E0\u6548");
      const max = Number(define.max);
      const min = Number(define.min);
      if (define.min !== void 0 && define.min !== null && Number.isFinite(min) && value < min || define.max !== void 0 && define.max !== null && Number.isFinite(max) && value > max)
        throw new Error("\u6570\u503C\u8D85\u51FA\u8303\u56F4");
      return;
    }
    if (type === "struct") {
      requestObject(value);
      if (!Array.isArray(define.specs)) throw new Error("\u7ED3\u6784\u4F53\u7F3A\u5C11\u5B57\u6BB5\u5B9A\u4E49");
      const specs = /* @__PURE__ */ new Map();
      for (const item of define.specs) {
        const identifier = item?.identifier;
        const memberDefine = item?.dataType || item?.define;
        if (typeof identifier !== "string" || !memberDefine || specs.has(identifier)) throw new Error("\u7ED3\u6784\u4F53\u5B57\u6BB5\u5B9A\u4E49\u65E0\u6548");
        specs.set(identifier, memberDefine);
      }
      for (const [key, memberValue] of Object.entries(value)) {
        const memberDefine = specs.get(key);
        if (!memberDefine) throw new Error("\u7ED3\u6784\u4F53\u5305\u542B\u672A\u58F0\u660E\u5B57\u6BB5");
        validateDefineValue(memberDefine, memberValue);
      }
      return;
    }
    if (type === "array" || type === "matrix") {
      if (!Array.isArray(value) || value.length === 0 || !define.arrayInfo || typeof define.arrayInfo !== "object") throw new Error("\u6570\u7EC4\u5B9A\u4E49\u6216\u503C\u65E0\u6548");
      const maxLength = Number(define.max);
      if (Number.isFinite(maxLength) && maxLength >= 0 && value.length > maxLength) throw new Error("\u6570\u7EC4\u8D85\u957F");
      for (const item of value) validateDefineValue(define.arrayInfo, item);
      return;
    }
    throw bridgeError("UNSUPPORTED_CAPABILITY", "\u5F53\u524D\u7269\u6A21\u578B\u6570\u636E\u7C7B\u578B\u5C1A\u672A\u652F\u6301");
  }
  function matchesRequirement(requirement, field) {
    if (requirement.kind === "action") return canonical(requirement.input || {}) === canonical(field.input || {});
    return ["type", "unit", "mapping", "values", "min", "max", "step", "maxLen", "specs", "arrayInfo"].every(
      (key) => requirement.define?.[key] === void 0 || canonical(requirement.define[key]) === canonical(field[key])
    );
  }
  function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }
  function canonical(value) {
    if (Array.isArray(value)) return `[${value.map((item) => canonical(item)).join(",")}]`;
    if (value && typeof value === "object")
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
    return JSON.stringify(value) ?? "undefined";
  }

  // apps/web/packages/saas/src/device-panel/native-host.ts
  var callbacks = /* @__PURE__ */ new Map();
  var listeners = /* @__PURE__ */ new Set();
  var dispose;
  var configuration;
  var lastConnection;
  var queue = Promise.resolve();
  function nativeCall(method, params) {
    const result = queue.then(
      () => new Promise((resolve, reject) => {
        if (!configuration) {
          reject(new Error("\u539F\u751F\u5BBF\u4E3B\u672A\u521D\u59CB\u5316"));
          return;
        }
        const id = messageID();
        const payload = JSON.stringify({ protocol: "ur-panel-native/v1", nonce: configuration.nonce, id, method, params });
        if (payload.length > 32768) {
          reject(new Error("\u672C\u5730\u6D88\u606F\u8D85\u8FC7\u5927\u5C0F\u9650\u5236"));
          return;
        }
        const timer = setTimeout(() => {
          callbacks.delete(id);
          reject(new Error("\u539F\u751F\u5BBF\u4E3B\u8C03\u7528\u8D85\u65F6"));
        }, 1e4);
        callbacks.set(id, { resolve, reject, timer });
        location.href = `urpanel://call?data=${encodeURIComponent(payload)}`;
      })
    );
    queue = result.then(
      () => void 0,
      () => void 0
    );
    return result;
  }
  globalThis.__urPanelReply = (message) => {
    if (!configuration || message?.nonce !== configuration.nonce) return;
    const callback = callbacks.get(message.id);
    if (!callback) return;
    callbacks.delete(message.id);
    clearTimeout(callback.timer);
    if (message.ok) callback.resolve(message.result);
    else callback.reject(Object.assign(new Error(message.error?.message || "\u672C\u5730\u8C03\u7528\u5931\u8D25"), { code: message.error?.code || "INVALID_PARAMS" }));
  };
  globalThis.__urPanelEvent = (message) => {
    if (!configuration || message?.nonce !== configuration.nonce) return;
    const event = message.event;
    if (event?.topic === "connection") lastConnection = { ...event, data: { ...lastConnection?.data, ...event.data } };
    listeners.forEach((listener) => listener(event));
  };
  globalThis.__urPanelStart = (config) => {
    dispose?.();
    lastConnection = void 0;
    configuration = config;
    const frame = document.querySelector("#panel");
    if (!frame) return;
    const capabilities = config.context.capabilities;
    const adapter = {
      context: config.context,
      model: config.model,
      openSettings: capabilities?.settings?.available ? async () => {
        await nativeCall("openSettings", {});
      } : void 0,
      getAuth: () => nativeCall("getAuth", {}),
      request: (params) => nativeCall("request", { ...params }),
      readProperties: (identifiers) => nativeCall("readProperties", { identifiers }),
      writeProperties: (values, options) => nativeCall("writeProperties", { values, ...options }),
      invokeAction: (identifier, params) => nativeCall("invokeAction", { identifier, params }),
      subscribe(topics, callback) {
        const filtered = (event) => {
          if (topics.includes(event.topic)) callback(event);
        };
        listeners.add(filtered);
        if (lastConnection) filtered(lastConnection);
        return () => {
          listeners.delete(filtered);
        };
      },
      dispose() {
        listeners.clear();
        lastConnection = void 0;
        for (const callback of callbacks.values()) {
          clearTimeout(callback.timer);
          callback.reject(new Error("\u9762\u677F\u5DF2\u5173\u95ED"));
        }
        callbacks.clear();
      }
    };
    dispose = attachPanelBridge(frame, adapter, config.requirements);
    frame.src = config.entryURL;
  };
  window.addEventListener("pagehide", () => dispose?.(), { once: true });
  location.href = `urpanel://ready?nonce=${messageID()}`;
})();
