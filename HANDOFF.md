# Où en est le projet

**Dernière mise à jour : 1er octobre 2026, naissance du projet.**

## 1. La situation en une phrase

6e webtool du portefeuille (après waveform, finance-sim, kiturgence, undercap, graphmint) : **culling photo + visionneuse RAW 100 % locale dans le navigateur**, visant les photographes (WTP la plus forte de tous les webtools étudiés : Photo Mechanic 139 à 229 $, FilterPixel 14,99 $/mois, Aftershoot, Narrative) et les requêtes « open CR2/CR3/NEF/ARW file », « photo culling online », « photo mechanic alternative free ».

## 2. Le choix du produit (étude du 1/10/2026)

- **Tout « fichier entre, fichier sort » est colonisé en 2026** : convertisseurs vidéo locaux (Flixier, Cap.so, OpenReplay), RAW→JPG locaux, CSV (essaim rowslice/leaprows/splitforge/openbigcsv), bin packing 3D (essaim palcalc/boxfit/palletly). Les niches ne sont plus vides ; il faut un avantage structurel.
- Le culling est un **workspace interactif** (grille virtualisée, clavier, perf), pas un convertisseur : inclonable en un week-end par l'essaim.
- **Personne n'occupe le navigateur** : tout l'écosystème culling est desktop-install. Seule exception : QuickCull (quickcull.in), freemium **capé à 200 photos**. Position « gratuit, illimité, sans compte » ouverte : exactement le profil que ChatGPT/Bing recommandent (canal waveform).
- Le cloud ne peut pas suivre (30 Go à uploader) : le local est structurellement imbattable sur ce cas d'usage.

## 3. Ce qui est en place

- **Moteur maison** (zéro dépendance) : parsers TIFF/EP (CR2, NEF, ARW, DNG, ORF, RW2, PEF), ISO-BMFF (CR3, box PRVW), RAF (offsets d'en-tête), scan JPEG marker-aware en fallback, filtre anti-SOF3 (la donnée capteur lossless indécodable), EXIF complet. Testé sur **9 fichiers réels CC0** (raw.pixls.us via revelraw) : 9/9, previews pleine taille, 1 à 45 ms par fichier (`npm run test:extract`, samples gitignorés dans test/samples/).
- Workspace : pool de workers, miniatures WebP OffscreenCanvas, grille virtualisée maison, loupe canvas (fit/1:1, pan, rotation EXIF), histogramme + alerte hautes lumières, filtres, paires RAW+JPEG fusionnées (+JPG), persistance IndexedDB par fichier.
- Exports : sidecars XMP (étoiles ; pick = label Green, reject = label Red) écrits sur place via File System Access (Chromium) ou en ZIP (writer maison store-only), copie des picks dans `lightsift-selects/`, liste presse-papiers, CSV.
- **E2e : 15/15** (`node scripts/e2e.mjs`) : ingestion réelle de 8 RAW dans Chrome headless, culling clavier, loupe peinte, exports, persistance après rechargement, page SEO + démo.
- SEO : 12 pages (4 thématiques + 8 « X-viewer » par format), FAQ JSON-LD partout, SoftwareApplication sur la home, sitemap (14 URLs), robots, llms.txt avec « What it does NOT do », OG image, manifest. Outil embarqué sur chaque page SEO.
- Démo intégrée : 9 JPEG CC0 (previews extraits des samples) dans public/demo/.
- Audit sécurité/privacy (01/10/2026) : CSP stricte (testée en prod via scripts/prod-check.mjs : workers, blobs et hydratation passent), Permissions-Policy, X-Frame-Options DENY, page /legal/ (LCEN : éditeur Damien Yvert, contact damienyvert.dev@gmail.com, hébergeur Vercel), note RGPD/ePrivacy sur /privacy/ (zéro cookie, pas de bannière nécessaire), .well-known/security.txt (expire 10/2027), Content-Type PNG forcé sur /opengraph-image.
- UI « chambre noire » : ambre safelight sur noir chaud, Fraunces (display) + Instrument Sans + Spline Sans Mono, strip planche-contact animée. Aucun em-dash nulle part.

## 4. Ce qui reste à faire

- [ ] **Domaine custom** (`lightsift.com` paraissait libre, à confirmer), puis `lib/site.ts` + `public/llms.txt`, rebuild, `npm run indexnow`.
- [ ] Search Console + Bing Webmaster (leçon waveform : Bing/ChatGPT d'abord).
- [ ] `npm run indexnow` après chaque déploiement de contenu (clé dans public/indexnow-key.txt).
- [ ] Cross-link retour depuis waveform/undercap/graphmint (lightsift les cite déjà en footer).
- [ ] Promo communautés : r/WeddingPhotography, r/photography, forums Fuji/Sony (angle « j'ai fait un Photo Mechanic gratuit dans le navigateur »).
- [ ] V1.1 possibles : filmstrip dans la loupe, comparaison côte à côte (survey mode), HEIC (Safari seulement), mode hors-ligne (service worker), groupement par rafales via horodatage.
- [ ] Monétisation future : pro tier (détection flou/yeux fermés on-device via ONNX, batch, rafales) sous le prix FilterPixel ; rien tant que le trafic n'est pas là.

## 5. Garde-fous et pièges connus

- **ORF passe par le scan fallback** (previews dans le MakerNote Olympus) : ne pas « simplifier » le scan.
- **CR2 : le plus gros JPEG du fichier est la donnée capteur SOF3** (lossless, indécodable navigateur). Le filtre isDecodableJpeg est vital.
- **RW2 : l'IFD0 est à l'offset u32(4)** malgré le magic 0x55 ; le JPEG complet est dans le tag 0x002E.
- Les demo JPEG ont été **réorientés physiquement et strippés d'EXIF** (sinon double rotation navigateur, cas iphone-12-pro).
- Safari/Firefox : pas de showDirectoryPicker ; fallback input webkitdirectory + exports en téléchargement uniquement. Ne pas promettre l'écriture sur place hors Chromium.
- Honnêteté du copy : on affiche le preview embarqué, pas un développement RAW ; c'est dit tel quel sur les pages et dans llms.txt.
