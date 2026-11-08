# Direction artistique : format « infographie 3D » TikTok

Référence : la vidéo du crash du Learjet 60 (moteur dans `moteur-animation/`).

## Format
- 1080x1920 (9:16), 30 images/s, entre 35 et 150 s.
- Voix off qui **raconte une histoire** au présent, avec des phrases courtes. Chaque phrase correspond à un plan.
- On ouvre au cœur de l'action (le moment le plus fort), puis on fait un retour en arrière (« Pour comprendre, il faut remonter… »).
- On termine sur une question ou une phrase qui reste en tête (ex. « POURQUOI ? »).

## Éléments graphiques (tous présents dans `main.js`)
| Élément | Usage | Style |
|---|---|---|
| **Pastille** (`pill`) | Lieu, date, contexte, en haut de l'écran | Verre sombre, police mono en capitales, point de couleur à gauche |
| **Gros titre rouge** (`title 'red'`) | Le mot-choc de la scène (MAYDAY, PULVÉRISÉ…) | Montserrat 900, rouge lumineux avec halo, apparition en « pop » |
| **Gros titre blanc** (`title 'white'`) | Les chiffres (9 À BORD, 9 MORTS) | Blanc avec relief gris |
| **Étiquette fléchée** (`callout`) | Désigne un objet 3D (avion, lieu, preuve) | Titre mono + sous-titre, trait coudé avec point d'ancrage |
| **Compteur** | Chiffre qui défile (altitude, années, victimes) | Grand chiffre, passe au rouge quand c'est critique |
| **Carte d'itinéraire** | Trajet A → B | Arc en pointillés avec une icône qui avance |
| **Pierres tombales** | Bilan humain, apparition une par une | Blanches avec halo |
| **Flash blanc + traits de vitesse** | Transition vers le drame | 0,5 s |

## Éléments ajoutés pour les vidéos « true crime » (référence : `dahmer/`)
| Élément | Usage |
|---|---|
| **Carton « ÂME SENSIBLE S'ABSTENIR »** | 1,8 s au tout début : triangle d'alerte, fumée rouge, glitch, battement de cœur |
| **Compteur de victimes** (haut droite) | Augmente au fil de l'histoire, avec un petit sous-titre d'explication (« +2 CHEZ SA GRAND-MÈRE ») |
| **Rouleau d'années** | Retour en arrière (1991 → 1964) ou ellipse (« 9 ANS DE SILENCE »), avec un effet de rembobinage VHS |
| **Chrono géant** | Compte à rebours dramatique (« 30:00 → 00:00 ») |
| **Citation** | Phrase rapportée, avec la source en dessous (« DAHMER AUX POLICIERS ») |
| **Mémorial final** | Bougies qui s'allument une à une et noms des victimes : finir sur les victimes, pas sur le tueur |
| **Silhouettes sans visage** | Personnages 3D anonymes : on suggère, on ne montre jamais la violence |

## Rendu « cinéma »
Bloom sur les sources lumineuses, grain film, vignettage, légère aberration chromatique et étalonnage par ambiance (nuit, chaud, froid, holo, tribunal, rouge, mémorial). S'y ajoutent des faisceaux de lumière volumétriques, de la poussière en suspension et des mouvements de caméra lents et continus (courbes douces, léger « à l'épaule »).

## Son
Il faut une musique de fond discrète, environ 12 dB sous la voix, avec un impact grave sur chaque gros titre et un « whoosh » à chaque changement de lieu. On ajoute un silence complet pour les ellipses et des effets réalistes discrets (sirène lointaine, obturateur Polaroid, marteau du juge). Le niveau final est de −14 LUFS.

## Palette
- Ciels en dégradé (violet → orange → crème le jour, bleu nuit la nuit).
- Rouge alerte `#ff4b22`, jaune « enquête » `#f5e04a`, cyan hologramme `#46d4ff`.
- 3D low-poly en couleurs plates, décors nocturnes bleu-violet `#252d4f`.

## Rendu
```
cd moteur-animation && npm i
node render.js stills 1.5 10 20        # images de test
node render.js video sortie.mp4        # rendu complet (~13 min pour 36 s)
ffmpeg -i sortie.mp4 -i audio.m4a -map 0:v -map 1:a -c copy -shortest final.mp4
```
Les textes se modifient dans l'objet `TX` en haut de `main.js`.
