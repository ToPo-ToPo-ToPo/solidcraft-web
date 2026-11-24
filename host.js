// SolidCraft の Web 版(app/)を、頭脳の道具(tools.json)の呼び出しで動かす。
// - 起動したら、作業フォルダに残した設計(solidcraft/design.json)を戻し、エージェントカーソルを出す
// - 設計を変えうる呼び出しのあとは、設計を作業フォルダに書き出す(ウィンドウを閉じても、開き直せば続きから)
// 操作口: SolidCraft の docs/browser-api.md と docs/control-protocol.md
"use strict";

const DESIGN = "solidcraft/design.json";
const START_LIMIT_MS = 120000;
const frame = document.getElementById("app");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let sc = null;
let saved = null;                 // 最後に書き出した設計の文(変わっていなければ書かない)
let cursor = { show: true, speed: 1, follow_camera: true };

async function ready() {
  const t0 = Date.now();
  while (!(frame.contentWindow && frame.contentWindow.solidcraft)) {
    if (Date.now() - t0 > START_LIMIT_MS) {
      throw new Error("SolidCraft が起動しませんでした。道具のフォルダの app/ に Web 版を置いたか(fetch.sh)、" +
                      "このブラウザが WebGPU か WebGL2 を使えるかを見てください");
    }
    await sleep(100);
  }
  sc = frame.contentWindow.solidcraft;
  const kept = await Solbunnee.readText(DESIGN);
  if (kept) {
    const r = await sc.request("document.import", { text: kept, name: "design" });
    saved = kept;
    if (r && r.errors && r.errors.length) console.warn("設計を戻したときのエラー", r.errors);
  }
  await sc.request("ui.agent_cursor", cursor);
}

async function save() {
  const x = await sc.request("document.export");
  if (!x || typeof x.text !== "string" || x.text === saved) return false;
  await Solbunnee.write(DESIGN, x.text);
  saved = x.text;
  await sc.request("document.saved", { revision: x.revision }).catch(() => {});
  return true;
}

// 結果の中の PNG(base64)を画像にする。見つからなければ null
function pngOf(value) {
  if (typeof value === "string") {
    const m = value.match(/^data:image\/png;base64,(.+)$/);
    if (m) return m[1];
    if (value.startsWith("iVBORw0KGgo")) return value;
    return null;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) {
      const found = pngOf(v);
      if (found) return found;
    }
  }
  return null;
}

function canvasPng() {
  const canvas = frame.contentDocument && frame.contentDocument.getElementById("solidcraft_canvas");
  if (!canvas) return null;
  try { return pngOf(canvas.toDataURL("image/png")); } catch (e) { return null; }
}

function text(value) {
  return { content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 1) }] };
}

async function changing(run) {
  const result = await run();
  const wrote = await save();
  return wrote ? { result, saved_to: DESIGN } : { result };
}

async function call(name, a) {
  switch (name) {
    case "execute":
      return await changing(() => sc.execute(a.command, a.params || {}));
    case "batch":
      return await changing(() => sc.request("engine.batch", { commands: a.commands, rollback: a.rollback !== false }));
    case "request":
      return await changing(() => sc.request(a.method, a.params || {}));
    case "inspect":
      return await sc.inspect({ measure: a.measure !== false, timeline: a.timeline || "summary" });
    case "commands": {
      const all = await sc.commands();
      const list = Array.isArray(all) ? all : (all.commands || []);
      const prefix = a.prefix || "", filter = (a.filter || "").toLowerCase();
      const hits = list.filter((c) => (c.id || "").startsWith(prefix) &&
        (!filter || JSON.stringify([c.id, c.label, c.tab, c.panel]).toLowerCase().includes(filter)));
      return a.detail ? hits : hits.map((c) => ({ id: c.id, label: c.label, enabled: c.enabled }));
    }
    case "screenshot": {
      let shot = null, why = "";
      try { shot = pngOf(await sc.request("ui.screenshot", {})); } catch (e) { why = String(e.message || e); }
      if (!shot) shot = canvasPng();
      if (!shot) return { content: [{ type: "text", text: `画面の絵を撮れませんでした。${why}` }], isError: true };
      return { content: [{ type: "image", data: shot, mimeType: "image/png" }] };
    }
    case "agent_cursor":
      for (const k of ["show", "speed", "follow_camera"]) if (a[k] !== undefined) cursor[k] = a[k];
      return await sc.request("ui.agent_cursor", cursor);
    case "undo":
      return await changing(() => sc.execute("edit.undo", {}));
    case "redo":
      return await changing(() => sc.execute("edit.redo", {}));
    case "new_design":
      saved = null;
      return await changing(() => sc.execute("file.new", {}));
    default:
      throw new Error(`この道具はありません: ${name}`);
  }
}

Solbunnee.serve({ ready, call: async (name, args) => {
  const r = await call(name, args);
  return r && Array.isArray(r.content) ? r : text(r);
} });
