#!/bin/sh
# SolidCraft の Web 版を、この道具のフォルダの app/ に取ってくる(インストールはしない。置くだけ)。
# ソルバニーが、初めて道具を呼んだときに人に確かめてから動かす(page.toml の [setup])。手で動かしてもよい。
#
# 取ってくる版と、その zip の SHA-256 は下に固定してある。取ってきた zip がこの値と合わなければ、置かずに止める
# (配布元や通信の途中で中身がすり替わっていても使わない)。値は SolidCraft の公式のリリースの SHA256SUMS.txt と同じ。
# 版を上げるときは、VERSION と SHA256 を一緒に直し、page.toml の [setup] の ready も新しい版の名前にする。
set -eu
VERSION="0.48.1"
SHA256="7a81cd0be381eb83cd750cc0ba060175cf6e5b314c8ca68acc24c71e1c5fdcf5"
URL="https://github.com/tangency-labs/solidcraft/releases/download/v$VERSION/solidcraft-web-$VERSION.zip"

here="$(cd "$(dirname "$0")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "取ってくる: $URL"
curl -fL --silent --show-error -o "$tmp/web.zip" "$URL"
if command -v shasum >/dev/null 2>&1; then
  got="$(shasum -a 256 "$tmp/web.zip" | cut -d ' ' -f 1)"
else
  got="$(sha256sum "$tmp/web.zip" | cut -d ' ' -f 1)"
fi
if [ "$got" != "$SHA256" ]; then
  echo "取ってきた zip の SHA-256 が合いません(期待 $SHA256、実際 $got)。置かずに止めます" >&2
  exit 1
fi
echo "SHA-256 を確かめました: $got"
unzip -q "$tmp/web.zip" -d "$tmp/x"
[ -f "$tmp/x/solidcraft-web-$VERSION/index.html" ] || { echo "zip の中に solidcraft-web-$VERSION/index.html がありません" >&2; exit 1; }
touch "$tmp/x/solidcraft-web-$VERSION/.ready-$VERSION"      # 準備ができた印(page.toml の [setup] の ready)
rm -rf "$here/app"
mv "$tmp/x/solidcraft-web-$VERSION" "$here/app"
echo "置きました: $here/app(SolidCraft $VERSION)"
