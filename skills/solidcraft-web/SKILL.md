---
name: solidcraft-web
description: SolidCraft(3D CAD)で部品を作る・直す・測る。人が見ているウィンドウで、作る様子を見せながら操作する
---

# SolidCraft で部品を作る

道具は `solidcraft-web__…`。SolidCraft の Web 版が、ソルバニーの開いたブラウザのウィンドウで動いている。
最初に呼んだときにウィンドウが開き、起動を待ってから実行する(少し時間がかかる)。初めて使う PC では、その前に
Web 版を取ってくる確認が人に出る。人が断ったら、この道具は使えない(報告でそう伝える)。人はそのウィンドウで、
エージェントカーソルがボタンと選ぶ場所へ動き、形ができていくのを見ている。

## 進め方

1. **数で決める**: 作る前に、寸法・位置・穴の場所を数で書き出す(単位は mm)。人の言葉に無い寸法は、決めた値と理由を報告に書く
2. **コマンドを調べる**: 名前が分からなければ `commands`(`prefix` で絞る。例 `"sketch."`、`"solid."`)。
   引数は `request` の `engine.describe`(`{"command": "solid.fillet"}`)で見る
3. **少しずつ作る**: スケッチ → 押し出し → 穴・フィレット、の段ごとに `execute` か `batch` で作る
4. **段ごとに確かめる**: `inspect` で体積・外形の箱・ボディの数を見て、自分で計算した値と比べる。
   最後に `screenshot` で形を目で見る
5. **報告**: 作ったもの、寸法、確かめた値(計算と測った値)を書く

## コマンドの例

```json
{"command": "sketch.create", "params": {"plane": "XZ", "name": "Profile"}}
{"command": "sketch.line", "params": {"points": [[0, 0], [40, 0], [40, 6], [6, 6], [6, 30], [0, 30]], "closed": true}}
{"command": "sketch.finish", "params": {}}
{"command": "solid.extrude", "params": {"distance": 60, "direction": "negative", "body_name": "Bracket"}}
{"command": "solid.fillet", "params": {"edges": [[40, -30, -6]], "radius": 2}}
{"command": "sketch.create", "params": {"plane": "XY", "name": "Holes"}}
{"command": "sketch.circle.center", "params": {"center": [25, -15], "diameter": 8}}
{"command": "solid.extrude", "params": {"distance": 6, "direction": "negative", "operation": "cut"}}
{"command": "solid.box", "params": {"length": 30, "width": 20, "height": 10, "body_name": "Block"}}
```

- フィレット・面取りの辺は、その辺の中点の座標 `[x, y, z]` で選ぶ。座標は `execute` の `model.edges`(`{"body": "Bracket"}`)で調べる
- 寸法を変えたいときに備えて、`parameters.change`(`{"name": "width", "expression": "60 mm"}`)でパラメータを作り、引数に名前を書ける
- 失敗したら、エラーの文を読んで直す。同じ呼び出しを繰り返さない。形を壊したら `undo`

## 決まり

- 設計は呼び出しのたびに作業フォルダの `solidcraft/design.json` に残る。ウィンドウが閉じられても、次の呼び出しで
  開き直して続きから戻る(人に「開き直します」と断らなくてよい)
- 動きを見せる分だけ遅い。人が急ぎたいと言ったら `agent_cursor` の `speed` を上げる
- この版では、STEP などへの書き出しを作業フォルダに出せない(Web 版のファイルはブラウザの中に置かれる)。頼まれたら、
  できないことと、`solidcraft/design.json`(SolidCraft で開ける設計)が残っていることを伝える
