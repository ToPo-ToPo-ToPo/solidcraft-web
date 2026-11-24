# solidcraft-web

solidcraft をツールとして使うもの(ソルバニーの道具)。

[SolidCraft](https://github.com/tangency-labs/solidcraft)(オープンソースの 3D CAD)の Web 版を、ソルバニーが開く
ブラウザのウィンドウで動かし、頭脳が作っている様子(エージェントカーソル)を見せながら操作するための、ソルバニーの
画面の道具(ソルバニーの計画書 §6.3)。

このリポジトリにあるのは、ソルバニーから SolidCraft を使うためのつなぎだけ。SolidCraft そのものは入っていない。
SolidCraft の Web 版は、初めて使うときに、人に確かめてから公式のリリースから取ってくる(`fetch.sh`。版と zip の
SHA-256 を固定して照らし、合わなければ置かない)。SolidCraft の名前・ロゴ・見た目は SolidCraft の作者のもの
(SolidCraft の `LICENSE-BRAND`)で、このリポジトリはそれに手を入れない。

## 使い方

ソルバニーの置き場の `config.toml` に、このリポジトリの URL を書く:

```toml
tool_repos = ["https://github.com/<アカウント>/solidcraft-web"]
```

画面の新しい会話で、道具の一覧から `solidcraft-web` を選んで頼む。選んだときにソルバニーがこのリポジトリを
道具の置き場に取ってくる(あれば新しくする)。ソルバニーはこのリポジトリに書き込まない。

## 中身

| ファイル | 中身 |
|---|---|
| `page.toml` | ソルバニーの画面の道具の設定(開くページ・読み書きできるフォルダ・準備) |
| `tools.json` | 頭脳の道具の一覧(MCP の `tools/list` と同じ形) |
| `host.html`・`host.js` | SolidCraft の Web 版を `?embed=editor` で埋め込み、`window.solidcraft` で操作するページ |
| `fetch.sh` | SolidCraft の Web 版を取ってきて `app/` に置く(版と SHA-256 を固定) |
| `skills/solidcraft-web/SKILL.md` | 頭脳向けの手順書 |

SolidCraft の版を上げるときは、`fetch.sh` の `VERSION` と `SHA256`(公式のリリースの `SHA256SUMS.txt` の値)と、
`page.toml` の `[setup]` の `ready` を一緒に直す。
