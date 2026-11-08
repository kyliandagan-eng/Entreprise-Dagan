# Vidéo « Jeffrey Dahmer » : fabrication

Script : `script.md` · Direction artistique : `../DA.md`

## Chaîne de fabrication
1. **Voix off** (synthèse vocale) → transcription mot à mot avec Whisper (`outils/transcribe.py`).
2. **Resserrage** des silences entre les phrases et ajout du carton « Âme sensible s'abstenir » de 1,8 s (`outils/edit_vo.py`). La vidéo passe de 180 s à 139,5 s, et chaque mot reçoit son minutage sur la nouvelle timeline.
3. **Musique et effets** générés en code, sans aucun son externe (`outils/music.py`) : drones graves en ré mineur, cordes dissonantes, boîte à musique inquiétante (enfance), battements de cœur, sirène, tic-tac, marteau du juge, impacts sur les titres. La musique baisse automatiquement quand la voix parle.
4. **Animation 3D** (`anim/`) : Three.js, rendue image par image en 1080x1920 à 30 im/s. Elle utilise du bloom, un grain film, un vignettage, une aberration chromatique, des ombres douces, des faisceaux de lumière volumétriques, l'anticrénelage MSAA 4x et un étalonnage par plan.
5. **Mixage** : voix compressée et normalisée, musique 12 dB en dessous, son final à −14 LUFS (standard TikTok).

## Décors (inspirés des recherches)
- Rue de Milwaukee la nuit, avec la façade en briques des Oxford Apartments (924 N 25th St).
- Couloir avec la porte 213.
- Appartement 213 : canapé beige, aquarium, table noire (l'« autel » prévu), lampe à globes bleus, rideau noir opaque, réfrigérateur, congélateur, armoire aux 7 crânes, baril bleu d'acide, baignoire.
- Vide sanitaire et bois de Bath (Ohio), maison isolée des années 50.
- Ambassador Hotel : tour Art déco et néon vertical.
- Tribunal avec la vitre pare-balles de 2,40 m.
- Toilettes du gymnase de la prison de Columbia.
- Mémorial avec les 17 noms.

## Relancer le rendu
```
cd anim && npm i && bash rendu_complet.sh
ffmpeg -i video_sans_son.mp4 -i son_final.m4a -map 0:v -map 1:a -c:v copy -c:a copy -shortest -movflags +faststart dahmer_tiktok.mp4
```
Les textes à l'écran se modifient dans `anim/main.js` (objet `E`) et les minutages des plans dans `SHOTS`.
