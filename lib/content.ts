export interface LandingPage {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string[];
  steps: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  /**
   * A section that belongs to this page and to no other.
   *
   * The eight format pages are generated from one template, and for a while
   * that template was almost the whole page: two paragraphs of `story` and a
   * camera list were all that separated them, so any two viewer pages ran 56
   * to 60 % identical and each one was alone in carrying barely a quarter of
   * its own text. Eight URLs chasing eight neighbouring queries with the same
   * words is how Google ends up picking one and filing the other seven under
   * "duplicate, Google chose a different canonical".
   *
   * So each format explains its own container here, and the facts are not
   * decorative: they are what `lib/raw/` actually does to that format. A claim
   * in this section should be checkable against the parser.
   */
  deepDive?: { title: string; body: string[] };
}

interface FormatSpec {
  ext: string;
  slug: string;
  brand: string;
  /**
   * Short brand for the `<title>`, when `brand` is too long to fit.
   *
   * Google truncates the title around 60 characters, and it is always the end
   * that goes. Two brands blew that budget: "Adobe, phones and drones" put the
   * DNG title at 74 characters and "OM System / Olympus" put ORF at 69, so
   * both lost the "Free, No Upload" that does the persuading. `brand` stays
   * long where the copy has room for it; this one is what the title uses.
   */
  titleBrand?: string;
  /**
   * What follows "View X files " in the meta description.
   *
   * Defaults to `from <brand> cameras`, which is true for seven of the eight
   * formats and false for DNG: Adobe does not make cameras. Shortening `brand`
   * for the title is not enough on its own — it has to not turn the
   * description into a false statement.
   */
  descPhrase?: string;
  cameras: string;
  story: string[];
  /** The page's own section. See `LandingPage.deepDive` for why it is required. */
  deepDive: { title: string; body: string[] };
  /**
   * Format-specific questions, on top of the four the template asks for every
   * format. Two per format at least: an identical FAQ block on eight pages is
   * eight copies of the same `FAQPage`, which helps nobody and reads as filler.
   */
  extraFaq: { q: string; a: string }[];
}

const FORMAT_SPECS: FormatSpec[] = [
  {
    ext: 'CR2',
    slug: 'cr2-viewer',
    brand: 'Canon',
    cameras: 'Canon DSLRs such as the 5D Mark IV, 6D, 80D, 7D Mark II and Rebel series',
    story: [
      'CR2 is the RAW format Canon DSLRs wrote for over a decade. Double-click one on a fresh computer and you often get a blank icon or a "file not supported" message, because the OS viewer has no decoder for it.',
      'You do not need Photoshop to look at them. Every CR2 carries a full-size JPEG preview rendered by the camera itself. OnlineCull reads the CR2 container in your browser, pulls that preview out and shows it in a sortable contact sheet, usually in a few seconds for a whole card.',
    ],
    deepDive: {
      title: 'A CR2 holds several pictures, and only some of them can be shown',
      body: [
        'A CR2 is a TIFF container, and it does not hold one image: it holds a chain of them. There is a small thumbnail in the first image directory, a mid-size preview after it, and the sensor data itself, each addressed by a pair of tags that say where the bytes start and how many there are.',
        'The sensor data is the trap. Canon stores it as a JPEG too, but a lossless one, and no browser on earth can decode that variant. Software that simply hunts for the first JPEG signature in the file and shows the biggest one it finds will land squarely on the sensor stream and display nothing at all. That is the single most common reason a "RAW viewer" opens your CR2 and shows you a grey rectangle.',
        'So OnlineCull does not trust the signature. For every candidate it finds, it walks the JPEG marker chain and checks which kind of frame header comes up: baseline, extended or progressive gets shown, lossless gets dropped, and the largest survivor wins. The practical effect on a folder of 5D Mark IV files, 25 to 40 MB each, is that you see full-size camera-rendered previews in a few seconds and never a blank frame.',
      ],
    },
    extraFaq: [
      {
        q: 'Why do some CR2 viewers show a grey or blank image?',
        a: 'Because they found the sensor data instead of the preview. Canon writes the sensor image as lossless JPEG, which browsers cannot decode; it is also the largest JPEG-looking thing in the file, so "pick the biggest" picks wrong. OnlineCull checks each candidate\'s frame type before showing it.',
      },
      {
        q: 'Does OnlineCull develop the CR2 sensor data?',
        a: 'No, and that is deliberate — it is what makes culling instant. You are looking at the full-size JPEG your camera rendered when it took the shot, which is also what your white balance and picture style were set to. Development belongs to Lightroom or Camera Raw, after you have handed over your picks as XMP.',
      },
    ],
  },
  {
    ext: 'CR3',
    slug: 'cr3-viewer',
    brand: 'Canon',
    cameras: 'mirrorless Canon bodies such as the EOS R, R5, R6, R7, R8 and the M50',
    story: [
      'CR3 replaced CR2 when Canon went mirrorless. It is a modern container (the same family as MP4), which is exactly why so many older viewers and even some operating systems refuse to open it.',
      'OnlineCull parses the CR3 structure in your browser and extracts the preview JPEG that every CR3 embeds, along with the shooting EXIF. No codec pack, no install, no upload: the files stay on your drive.',
    ],
    deepDive: {
      title: 'CR3 is a video container with a photo inside',
      body: [
        'CR2 and CR3 share a name and almost nothing else. A CR2 is a TIFF file; a CR3 is ISO base media format — the same box structure as an MP4 — and it announces itself as such, with a file-type box carrying the brand "crx". That is the whole reason a machine that happily opens your old CR2 files draws a blank on the new ones: it is not a missing decoder for a similar format, it is a different kind of file wearing a RAW extension.',
        'Inside, Canon spreads the useful parts across several boxes. The shooting metadata sits in two directories, CMT1 and CMT2, tucked inside a vendor box within the movie header — so the body, lens, ISO, shutter and aperture have to be read from two places and merged. A separate vendor box near the top of the file carries a PRVW box with a 1620-pixel preview, and the full-size camera JPEG generally sits at the beginning of the media data.',
        'OnlineCull reads all three. The 1620-pixel preview is the guaranteed floor — it exists in every CR3 — and when the full-size JPEG is there too, that is what you cull on. The result on an R5 or R6 card is the same contact sheet you get from CR2 files, with no codec pack and no conversion pass.',
      ],
    },
    extraFaq: [
      {
        q: 'Why does my computer open CR2 but not CR3?',
        a: 'CR3 uses a newer ISO-BMFF container that shipped with Canon mirrorless cameras. OS-level RAW codecs added CR3 support late, and many older machines never got the update. A browser-based viewer sidesteps the problem entirely.',
      },
      {
        q: 'Does C-RAW (Canon\'s compressed RAW) change anything here?',
        a: 'No. C-RAW compresses the sensor data, not the preview; the embedded JPEG is written the same way either way. A folder mixing CRAW and full RAW files previews identically and at the same speed.',
      },
      {
        q: 'Do CR3 files from the EOS R5 and R6 work?',
        a: 'Yes, along with the R, R7, R8, R10, R50 and the M50 — any body that writes the crx container. Mixed folders of CR2 and CR3 are fine too; the format is detected per file, not per folder.',
      },
    ],
  },
  {
    ext: 'NEF',
    slug: 'nef-viewer',
    brand: 'Nikon',
    cameras: 'Nikon DSLRs and Z-series mirrorless, from the D3500 to the Z6, Z7, Z8 and Z9',
    story: [
      'NEF is Nikon\'s RAW format. The files are TIFF-based, 25 to 60 MB each, and a folder of them can bring a laptop photo viewer to its knees before you have rated a single frame.',
      'OnlineCull opens the folder instead of individual files: it extracts the full-size JPEG preview each NEF embeds, shows the whole shoot as a contact sheet, and lets you rate and flag with the keyboard. All locally, in the browser.',
    ],
    deepDive: {
      title: 'How OnlineCull finds the preview inside a NEF',
      body: [
        'A NEF is TIFF underneath, which means its contents are described by a chain of image directories: the first one describes the main image, it points at the next, and any of them can carry sub-directories of its own. Nikon uses that freedom. Depending on the body and the era, the browsable JPEG can be addressed from the thumbnail directory, from a sub-directory of the first one, or as a strip offset in a layout that predates the convention everyone later settled on.',
        'Rather than guess which generation of camera wrote the file, the parser walks the whole chain, collects every JPEG it can address along the way, sorts them by size and takes the largest one that actually decodes. If the structure yields nothing — a damaged header, an unusual variant — it falls back to scanning the first 12 MB of the file for JPEG signatures, because that is where previews live in practice.',
        'That belt-and-braces approach is why a single folder can hold a D750, a Z8 and a Coolpix NRW file and all three appear. It also means the preview you cull on is the size the camera chose to embed: generally full resolution from the DSLR and Z bodies, sometimes smaller from older and compact models. The loupe and the 1:1 focus check work from whatever is there.',
      ],
    },
    extraFaq: [
      {
        q: 'Does OnlineCull read NRW files from Coolpix cameras?',
        a: 'Yes. NRW is Nikon\'s compact-camera RAW and shares the same TIFF skeleton as NEF, so it goes through the same parser. Mixed NEF and NRW folders work.',
      },
      {
        q: 'Why does my NEF preview look lower-resolution than the photo?',
        a: 'Because you are seeing the JPEG the camera embedded, and its size is the camera\'s decision, not the tool\'s. Most Nikon bodies embed a full-size preview; older and compact models sometimes embed a smaller one. Nothing is lost — the sensor data in the file is untouched and your RAW developer still gets the full image.',
      },
    ],
  },
  {
    ext: 'ARW',
    slug: 'arw-viewer',
    brand: 'Sony',
    cameras: 'Sony Alpha bodies such as the a7 III, a7 IV, a7R series, a6000 family and FX cameras',
    story: [
      'ARW is Sony Alpha RAW. Like every RAW format it is really a TIFF container around sensor data, and like every RAW format, half the computers you sit down at cannot preview it.',
      'OnlineCull reads the ARW header in your browser and shows the embedded preview JPEG with its EXIF: body, lens, ISO, shutter, aperture. Open a whole card, cull it, export your picks. Nothing is uploaded.',
    ],
    deepDive: {
      title: 'What an ARW carries, and why the biggest image in it is the wrong one',
      body: [
        'Open an ARW with a hex editor and you will find more than one JPEG signature. There is a small thumbnail for the camera\'s own playback screen, a larger preview for software to browse, and the sensor data — which Sony, like Canon, stores in a JPEG variant that is lossless and therefore undecodable by any browser.',
        'This is why "show the largest image in the file" is a bad rule and why so many quick RAW viewers fail on Sony files specifically. OnlineCull sorts the candidates by size but then verifies each one before committing: it reads the frame header, accepts baseline, extended and progressive, and refuses the lossless stream no matter how big it is. The first candidate that is both large and genuinely decodable is the one you see.',
        'What comes with it is the shooting metadata written by the body: lens, focal length, aperture, shutter, ISO and the capture time, which is what the contact sheet sorts on. Sony\'s compression choices — lossless compressed, compressed, uncompressed — change the sensor payload and the file size, not the preview, so an a7 IV card shot in compressed RAW culls exactly as fast as one shot uncompressed.',
      ],
    },
    extraFaq: [
      {
        q: 'Does Sony\'s compressed RAW setting affect previewing?',
        a: 'No. Compressed, lossless compressed and uncompressed ARW all embed the same kind of browsable JPEG. The setting changes how the sensor data is stored and how big the file is; the preview path is identical, so culling speed does not change.',
      },
      {
        q: 'Will my lens and ISO show up for Sony bodies?',
        a: 'Yes — body, lens, focal length, aperture, shutter speed, ISO and capture time are read from the ARW metadata and shown under each frame, so you can filter a shoot by what it was taken with before you start rating.',
      },
    ],
  },
  {
    ext: 'RAF',
    slug: 'raf-viewer',
    brand: 'Fujifilm',
    cameras: 'Fujifilm X and GFX bodies such as the X-T4, X-T5, X-H2 and GFX 100',
    story: [
      'RAF is Fujifilm\'s RAW format, and it is unusual: the embedded preview JPEG sits at a fixed spot declared in the file header, which makes it one of the fastest formats to preview when the software knows the trick.',
      'OnlineCull knows the trick. It reads the header, grabs the full-size preview with the film-simulation look Fuji rendered in camera, and lays the shoot out as a contact sheet in your browser.',
    ],
    deepDive: {
      title: 'The header trick that makes RAF the fastest of the eight',
      body: [
        'Every other format on this site has to be explored. A TIFF-based RAW means walking a chain of directories to discover what is where; Canon\'s CR3 means descending through nested boxes. RAF asks for none of that. The file begins with the literal text "FUJIFILMCCD-RAW", and at a fixed position near the start of the header — byte 84 — it states the offset of the embedded JPEG, followed immediately by its length.',
        'Two numbers, read from a known address, and the full-size preview is located. No directory chain, no candidate list, no size comparison, no decodability check to run first. For a folder of X-T5 files that means the preview extraction cost is essentially the disk read, which is why RAF folders feel instant even next to the other formats here.',
        'There is a second thing that falls out of the format: the JPEG that Fujifilm embeds is the camera\'s own render, so it carries the film simulation you were shooting. Cull a set of RAFs taken on Classic Chrome and you are culling Classic Chrome frames, not a neutral interpretation of them — which matters, because the look is usually part of why you kept the shot. That same embedded JPEG also carries the EXIF, so the body, lens and exposure come from it too.',
      ],
    },
    extraFaq: [
      {
        q: 'Do Fujifilm film simulations show in the preview?',
        a: 'Yes. The embedded JPEG is the one your camera rendered, so Classic Chrome, Astia, Acros and the rest are what you see while culling. Your RAW developer may interpret the file differently later, but the pick you make here is made on the look you shot.',
      },
      {
        q: 'Do GFX medium-format RAF files work?',
        a: 'Yes. GFX files are larger on disk but the preview is addressed exactly the same way, from the same place in the header, so a GFX 100 folder opens at the same speed as an X-T4 folder.',
      },
    ],
  },
  {
    ext: 'DNG',
    slug: 'dng-viewer',
    brand: 'Adobe, phones and drones',
    titleBrand: 'Adobe',
    descPhrase: 'written by Adobe software, phones and drones',
    cameras: 'iPhone ProRAW, DJI drones, Ricoh GR, Leica and Pentax, plus anything converted by Adobe DNG Converter',
    story: [
      'DNG is the open RAW format: Leica, Ricoh and Pentax write it natively, iPhone ProRAW and DJI drones produce it, and Adobe\'s converter turns any other RAW into it.',
      'OnlineCull reads the DNG structure in your browser, extracts the embedded preview and EXIF, and handles phone-style orientation correctly, so your portrait shots show up portrait.',
    ],
    deepDive: {
      title: 'The one DNG that will not preview, and why it is not the tool\'s fault',
      body: [
        'DNG is the only format here where the preview is optional. The others are written by a camera that has just rendered a JPEG for its own screen and has no reason not to keep it. A DNG, by contrast, is often written by a converter — and Adobe\'s DNG Converter asks what size preview you want, with "none" among the answers. A DNG converted with previews turned off contains no browsable image at all, only sensor data.',
        'When that happens, OnlineCull falls back to scanning the file for any JPEG it can find and you may end up with a small thumbnail rather than a full-size frame, or nothing. No tool can do better: the picture to show was never written. If you are converting your own archive, choose a full-size preview and the files become cullable at speed; if you are receiving DNGs from someone else, this is worth knowing before you blame the viewer.',
        'Natively written DNGs do not have this problem. Leica, Ricoh and Pentax embed previews as a matter of course, and so do iPhone ProRAW and DJI drones — which brings the other DNG quirk worth naming: phones and drones lean on the orientation tag rather than rotating the pixels, so a portrait shot is stored as a landscape frame plus an instruction. OnlineCull reads the instruction, which is why your vertical phone shots appear vertical instead of on their side.',
      ],
    },
    extraFaq: [
      {
        q: 'My DNG files show no preview or only a tiny one. Why?',
        a: 'Almost certainly because they were converted with the preview option set to "none" or "medium". DNG is the one RAW format where the embedded preview is optional, and when it is absent there is nothing to display. Re-converting with a full-size preview fixes it permanently.',
      },
      {
        q: 'Does iPhone ProRAW work?',
        a: 'Yes. ProRAW files are DNGs with previews embedded, and they carry their rotation in the orientation tag rather than in the pixels — which OnlineCull applies, so portrait shots are shown portrait.',
      },
      {
        q: 'Can I cull DJI drone footage stills alongside camera files?',
        a: 'Yes. DJI writes DNG for its stills, and a folder mixing drone DNGs with CR3 or ARW files from a camera previews as one contact sheet; the format is detected per file.',
      },
    ],
  },
  {
    ext: 'ORF',
    slug: 'orf-viewer',
    brand: 'OM System / Olympus',
    titleBrand: 'Olympus',
    descPhrase: 'from OM System and Olympus cameras',
    cameras: 'OM-1, OM-5 and the Olympus OM-D and PEN lines',
    story: [
      'ORF is the RAW format of Olympus and now OM System cameras. It is TIFF-based but hides its previews in maker-specific corners, which is why generic viewers often fail on it.',
      'OnlineCull combines structured parsing with a careful scan of the file, finds the embedded JPEG whether or not it is where the spec suggests, and shows your shoot as a browsable, ratable contact sheet.',
    ],
    deepDive: {
      title: 'Where Olympus puts things, and why generic viewers give up',
      body: [
        'ORF is TIFF-shaped, so in principle the same walk that works on a Nikon or Sony file should work here. In practice Olympus has always been comfortable putting things in maker-specific corners, and two of those corners catch software out.',
        'The first is the preview itself, which is not always addressed by the tags a generic reader checks. OnlineCull therefore pairs the structured walk with a direct scan of the first 12 MB of the file for JPEG signatures, and takes the best of both: whatever the directories hand over, plus anything the scan turns up, with the largest decodable candidate winning. A viewer that only does the structured walk reports "no preview" on files that plainly contain one.',
        'The second is the metadata. On OM System and Olympus files the shooting EXIF frequently lives inside the embedded JPEG rather than in the outer directory, so a reader that parses the container and stops comes back with an image and no camera, no lens, no ISO. OnlineCull notices when the outer parse produced an image but no make or ISO, re-reads the metadata from inside the JPEG it just extracted, and merges the two — which is why an OM-1 folder shows a full EXIF line under every frame.',
      ],
    },
    extraFaq: [
      {
        q: 'Why do other RAW viewers fail on ORF when this one works?',
        a: 'Because they do one of the two passes and not both. Olympus does not always address the preview where a generic TIFF reader looks, so a structured-only parser reports no preview; OnlineCull adds a direct scan of the file header and keeps whichever candidate is larger.',
      },
      {
        q: 'Does the EXIF show for OM System bodies?',
        a: 'Yes. Olympus and OM System tend to keep the shooting data inside the embedded JPEG rather than in the outer container, so OnlineCull reads it from there when the container comes back empty. Body, lens, ISO, shutter and aperture all appear.',
      },
    ],
  },
  {
    ext: 'RW2',
    slug: 'rw2-viewer',
    brand: 'Panasonic',
    cameras: 'Lumix bodies such as the G9, GH6, S5 and the LX and TZ compacts',
    story: [
      'RW2 is Panasonic Lumix RAW. It uses TIFF structures with Panasonic-specific tags, including one that holds a complete JPEG rendition of the shot.',
      'OnlineCull reads that tag directly in your browser, which means instant previews with EXIF for a whole folder of RW2 files, no upload and no conversion step.',
    ],
    deepDive: {
      title: 'The Panasonic tag that contains an entire JPEG',
      body: [
        'In a TIFF-based RAW file, a tag normally tells you where something is: an offset into the file, and a length. Panasonic does something different. RW2 carries a private tag whose value is not a pointer at all — it is the JPEG, bytes and all, sitting inside the directory entry.',
        'That removes a whole step. There is no offset to resolve, no bounds-checking against the end of the file, no risk of an address that points somewhere stale; once the directory entry is read, the preview is already in hand. OnlineCull reads that tag first on any Lumix file and only falls back to the ordinary candidate hunt if it is missing.',
        'Panasonic shares one habit with Olympus: the shooting metadata often lives inside that embedded JPEG rather than in the outer container. So after extracting the preview, OnlineCull re-reads the EXIF from within it and merges the result, which is how a G9 or GH6 folder ends up with body, lens, ISO and shutter under every frame. The embedded JPEG is also the camera\'s own render, so the Photo Style you were shooting — Standard, Natural, Monochrome — is the look you cull on.',
      ],
    },
    extraFaq: [
      {
        q: 'Does the preview reflect my Lumix Photo Style?',
        a: 'Yes. The JPEG inside the RW2 is the one the camera rendered, so Standard, Vivid, Natural, L.Monochrome and the rest are what appear in the contact sheet. Your RAW developer can still start from neutral later.',
      },
      {
        q: 'Do RW2 files from the LX and TZ compacts work?',
        a: 'Yes. The compacts write the same container and the same Panasonic preview tag as the G, GH and S bodies, so they go down the same path. Mixed folders from a Lumix body and a Lumix compact are fine.',
      },
    ],
  },
];

function formatPage(spec: FormatSpec): LandingPage {
  return {
    slug: spec.slug,
    title: `${spec.ext} Viewer Online: Open ${spec.titleBrand ?? spec.brand} RAW Files Free`,
    metaDescription: `View ${spec.ext} files ${spec.descPhrase ?? `from ${spec.brand} cameras`} in your browser, with EXIF, star ratings and XMP export. Nothing is uploaded.`,
    h1: `Open ${spec.ext} files in your browser`,
    intro: spec.story,
    deepDive: spec.deepDive,
    steps: [
      {
        title: `Open the folder with your ${spec.ext} files`,
        body: 'Click "Open a folder" or drag the folder onto the page. OnlineCull reads the files in place; nothing is uploaded, so a full card opens in seconds.',
      },
      {
        title: 'Browse, zoom, check EXIF',
        body: 'Every photo appears in a contact sheet with camera, lens, ISO, shutter and aperture. Press Enter for the loupe, Z for a 1:1 focus check, and use a histogram with a clipping warning.',
      },
      {
        title: 'Rate, flag and export',
        body: 'Rate 1 to 5, flag picks and rejects with P and X, then export XMP sidecars that Lightroom, Bridge and Capture One read, or copy your keepers into a selects folder.',
      },
    ],
    faq: [
      {
        q: `Is this ${spec.ext} viewer really free?`,
        a: 'Yes. No account, no photo cap, no watermark. OnlineCull is a free in-browser tool; it makes money later through optional pro features, never by limiting viewing.',
      },
      {
        q: `Are my ${spec.ext} files uploaded?`,
        a: 'No. The files are read locally by your browser and never sent to a server. That is also why it is fast: there is no upload step at all.',
      },
      {
        q: `Which cameras produce ${spec.ext} files?`,
        a: `${spec.ext} comes from ${spec.cameras}. OnlineCull also reads the other major RAW formats (CR2, CR3, NEF, ARW, RAF, DNG, ORF, RW2, PEF) plus JPEG and PNG, so mixed folders are fine.`,
      },
      {
        q: `Can I convert ${spec.ext} to JPG here?`,
        a: `OnlineCull is a viewer and culling tool, not a converter: it shows the full-size JPEG preview embedded in each ${spec.ext} file. For editing and exporting finished JPEGs, hand your picks to Lightroom or any RAW developer using the XMP export.`,
      },
      ...spec.extraFaq,
    ],
  };
}

const TOPIC_PAGES: LandingPage[] = [
  {
    slug: 'photo-culling-online',
    title: 'Photo Culling Online: Free, Unlimited, No Upload',
    metaDescription:
      'Cull thousands of RAW photos in your browser, keyboard-first, with XMP picks Lightroom reads. Nothing is uploaded. Free, no account.',
    h1: 'Cull photos online, without the upload',
    intro: [
      '"Online" photo culling usually means waiting for gigabytes to upload before you can rate a single frame. OnlineCull flips that: it is a web page, but your photos never leave your computer. The browser reads the files in place and shows the embedded previews, so a 3,000-photo wedding is browsable in about the time it takes to pour a coffee.',
      'You get the serious-tool workflow: keyboard-first rating, picks and rejects, 1:1 focus check, EXIF and histogram, filters, and an XMP handoff that Lightroom, Bridge and Capture One understand. You skip the serious-tool parts that hurt: the price, the install, and the import step.',
    ],
    steps: [
      {
        title: 'Open your shoot',
        body: 'Click "Open a folder" (or drag it in). RAW and JPEG both work; RAW+JPEG pairs collapse into one card each.',
      },
      {
        title: 'First pass with X',
        body: 'Fly through with the arrow keys and hit X on the obvious misses: blinks, misfires, test frames. Rejects dim in the grid so you see progress.',
      },
      {
        title: 'Second pass with stars and P',
        body: 'Filter to the unrated, open the loupe, use Z to check focus at 1:1, star the strong frames and P the portfolio shots.',
      },
      {
        title: 'Export',
        body: 'Press E: write XMP sidecars next to the files, copy picks into a selects folder, or download the list. Your originals are never modified.',
      },
    ],
    faq: [
      {
        q: 'How is this different from cloud culling services?',
        a: 'Cloud services upload your originals to their servers, which takes hours on a normal connection and raises client-privacy questions. OnlineCull does the work inside your browser; zero bytes of image data are transmitted.',
      },
      {
        q: 'How many photos can I cull at once?',
        a: 'There is no built-in cap. The grid is virtualized, previews are extracted on a pool of background threads, and memory is kept in check by storing small thumbnails, so folders of several thousand photos work on an ordinary laptop.',
      },
      {
        q: 'Do I need to create an account?',
        a: 'No account, no email, nothing. Open the page, open a folder, start culling.',
      },
      {
        q: 'Can I stop halfway and continue tomorrow?',
        a: 'Yes. Ratings and flags are saved in your browser per file. Reopen the same folder later and your marks are restored.',
      },
    ],
  },
  {
    slug: 'photo-mechanic-alternative',
    title: 'Free Photo Mechanic Alternative in the Browser (2026)',
    metaDescription:
      'The same embedded-preview trick that makes Photo Mechanic instant, in your browser: no install, no licence, XMP export to Lightroom.',
    h1: 'A free Photo Mechanic alternative that lives in your browser',
    intro: [
      'Photo Mechanic earned its reputation with one idea: never decode RAW sensor data while browsing; show the JPEG preview the camera already rendered. That idea is why it feels instant, and it is also why it costs real money as a desktop install.',
      'OnlineCull applies the same idea in the browser. It parses CR2, CR3, NEF, ARW, RAF, DNG, ORF and RW2 containers locally, extracts the embedded previews on background threads, and gives you a keyboard-first culling workflow: arrows, stars, P and X, 1:1 zoom, EXIF, histogram, filters, XMP export. Free, unlimited, nothing installed, nothing uploaded.',
      'Honest scope note: Photo Mechanic remains deeper for wire-service work: IPTC captioning, code replacements, tethering, FTP delivery. If you need those, buy it. If you need the part most photographers use it for, fast culling into Lightroom, OnlineCull covers that for free.',
    ],
    steps: [
      {
        title: 'Open a folder instead of installing an app',
        body: 'No download, no license. Chrome or Edge recommended for the full experience, including writing XMP sidecars in place.',
      },
      {
        title: 'Cull with the keys you already know',
        body: 'Arrow keys to move, 1 to 5 for stars, P and X for picks and rejects, Z for 1:1. The grid keeps up with thousands of frames.',
      },
      {
        title: 'Hand off like Photo Mechanic does',
        body: 'XMP sidecars next to the RAWs mean your stars and color labels appear in Lightroom, Bridge and Capture One on import.',
      },
    ],
    faq: [
      {
        q: 'Is OnlineCull as fast as Photo Mechanic?',
        a: 'For browsing and rating, it plays the same trick: embedded JPEG previews, never sensor decoding. Extraction runs at milliseconds per file on background threads. Photo Mechanic still wins on tasks beyond culling, like captioning and delivery.',
      },
      {
        q: 'Does it do IPTC captions, tethering or FTP?',
        a: 'No. OnlineCull is deliberately a culling and viewing tool. That focus is what keeps it free and simple.',
      },
      {
        q: 'Photo Mechanic costs $139 to $229. What is the catch here?',
        a: 'No catch today: culling is free and uncapped. If OnlineCull ever adds paid features they will be extras (batch tools, AI assists), not a cap on what is free now.',
      },
      {
        q: 'Can it replace FastRawViewer or Adobe Bridge?',
        a: 'For keyboard culling into Lightroom, yes, with less setup. FastRawViewer uniquely shows RAW-based histograms rather than preview-based ones; if you expose strictly by RAW histogram, keep it in your kit.',
      },
    ],
  },
  {
    slug: 'how-to-cull-photos-faster',
    title: 'How to Cull Photos Faster: a Working Method (and Free Tool)',
    metaDescription:
      'How to cull a 3,000 photo shoot in under an hour: two passes, keyboard only, reject first. With a free browser tool that reads RAW instantly.',
    h1: 'How to cull photos faster',
    intro: [
      'Culling eats more studio time than editing for most event photographers, and it is almost always done inefficiently: one photo at a time, mouse in hand, deciding "keep or not" from scratch on every frame.',
      'The method below is how high-volume shooters get a 3,000-frame wedding down to deliverables in under an hour. It works in any serious tool; the examples use OnlineCull because it is free, runs in your browser and needs zero setup.',
    ],
    steps: [
      {
        title: 'Never decide "is this good". Decide "is this out"',
        body: 'Pass one is rejects only: blinks, focus misses, flash misfires, duplicates of duplicates. Hit X and move on; a half-second per frame is plenty. Cutting 40 percent with zero agonizing is normal.',
      },
      {
        title: 'Cull in capture order, scene by scene',
        body: 'Within a burst, frames compete with each other, not with the whole shoot. Pick the best of each burst with P and skip the rest; do not rate them individually.',
      },
      {
        title: 'Use stars for structure, not nuance',
        body: 'A working scale: X rejected, nothing unrated-but-fine, 3 solid delivery, 5 portfolio. Five levels of nuance per photo is a tax your clients never see.',
      },
      {
        title: 'Zoom only when sharpness is the question',
        body: 'The 1:1 check (Z) is for eyes-in-focus decisions between near-identical frames. Zooming on every photo doubles your culling time for nothing.',
      },
      {
        title: 'Export marks, then edit only keepers',
        body: 'Write XMP sidecars and import the folder in Lightroom: your stars and labels arrive with it, and the edit queue is already filtered.',
      },
    ],
    faq: [
      {
        q: 'Should I cull before or after import into Lightroom?',
        a: 'Before. Importing 3,000 RAWs you will delete anyway costs catalog time and disk churn. Cull on the embedded previews first, then import a folder where marks already exist as XMP.',
      },
      {
        q: 'Is AI culling faster than this?',
        a: 'AI assistants are genuinely fast at flagging blinks and closed eyes, and they cost a subscription. A disciplined two-pass manual cull on instant previews is competitive for most volumes, and you keep full editorial control. Many shooters combine both.',
      },
      {
        q: 'How long should a 2,000 photo cull take?',
        a: 'With the reject-first method on instant previews: pass one around 20 minutes, pass two on the survivors 15 to 25 minutes. If it takes three hours, the bottleneck is almost always preview loading or mouse-driven rating.',
      },
    ],
  },
  {
    slug: 'raw-viewer-online',
    title: 'RAW Viewer Online: Open Any Camera RAW File, Free',
    metaDescription:
      'View CR2, CR3, NEF, ARW, RAF, DNG, ORF and RW2 files online without uploading them. Free browser RAW viewer with EXIF, ratings and Lightroom XMP export.',
    h1: 'A RAW viewer that works where you are',
    intro: [
      'You have a folder of RAW files and a computer that refuses to show them: a client machine, a locked-down work laptop, a Chromebook, a fresh install. Online converters want you to upload 30 MB per photo first. Desktop viewers want an install you cannot or do not want to do.',
      'OnlineCull opens RAW files the way a browser can: it parses the file locally and shows the full-size JPEG preview embedded in every RAW, with shooting EXIF, in a contact sheet you can search through with arrow keys. It reads CR2, CR3, NEF, ARW, RAF, DNG, ORF, RW2 and PEF, plus plain JPEG and PNG, with no upload and no account.',
    ],
    steps: [
      {
        title: 'Open or drop a folder',
        body: 'The whole folder loads at once; previews appear progressively within seconds.',
      },
      {
        title: 'Inspect any frame',
        body: 'Enter opens the loupe, Z zooms to 1:1, the bottom bar shows camera, lens, ISO, shutter, aperture and a histogram.',
      },
      {
        title: 'Keep what matters',
        body: 'Rate and flag if you want to; export XMP sidecars or a picks list, or just close the tab. Files are untouched.',
      },
    ],
    faq: [
      {
        q: 'Does this show the true RAW data?',
        a: 'It shows the full-resolution JPEG preview your camera embedded, which is what virtually all fast viewers and culling tools display. Pixel-level RAW development still belongs to Lightroom, Capture One or darktable afterwards.',
      },
      {
        q: 'Why no upload? Every other online viewer uploads.',
        a: 'Because upload is the slow, privacy-hostile part. Browsers can read local files that you explicitly open, parse them in memory and render previews, all without a server. That is what OnlineCull does.',
      },
      {
        q: 'Does it work offline?',
        a: 'After the page has loaded once, the culling itself needs no network at all, since your files never travel. A full offline mode is on the roadmap.',
      },
    ],
  },
];

export const LANDING_PAGES: LandingPage[] = [...TOPIC_PAGES, ...FORMAT_SPECS.map(formatPage)];

export function landingBySlug(slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((p) => p.slug === slug);
}
