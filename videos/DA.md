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
