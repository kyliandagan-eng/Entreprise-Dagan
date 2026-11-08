#!/bin/bash
# Rendu complet de la vidéo : 12 morceaux, 4 en parallèle, puis assemblage.
# Usage : bash rendu_complet.sh   (après « npm i » dans ce dossier)
D=$(cd "$(dirname "$0")" && pwd)
FPS=30; N=4185; CH=12; step=$(( (N + CH - 1) / CH ))
mkdir -p "$D/chunks"
render_chunk() {
  i=$1; a=$((i*step)); b=$(( (i+1)*step )); [ $b -gt $N ] && b=$N
  f="$D/chunks/c$(printf %02d $i).mp4"
  [ -f "$f.done" ] && return 0
  node "$D/render.js" video "$f" $FPS $a $b > "$D/chunks/c$(printf %02d $i).log" 2>&1 && touch "$f.done"
}
export -f render_chunk; export D FPS N step
seq 0 $((CH-1)) | xargs -P 4 -I{} bash -c 'render_chunk {}'
for i in $(seq 0 $((CH-1))); do echo "file '$D/chunks/c$(printf %02d $i).mp4'"; done > "$D/chunks/list.txt"
ffmpeg -v error -y -f concat -safe 0 -i "$D/chunks/list.txt" -c copy "$D/video_sans_son.mp4"
echo "Vidéo muette : $D/video_sans_son.mp4 (à mixer avec le son, voir ../README.md)"
