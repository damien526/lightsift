export interface LandingPage {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string[];
  steps: { title: string; body: string }[];
  faq: { q: string; a: string }[];
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
  extraFaq?: { q: string; a: string }[];
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
    extraFaq: [
      {
        q: 'Why does my computer open CR2 but not CR3?',
        a: 'CR3 uses a newer ISO-BMFF container that shipped with Canon mirrorless cameras. OS-level RAW codecs added CR3 support late, and many older machines never got the update. A browser-based viewer sidesteps the problem entirely.',
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
  },
];

function formatPage(spec: FormatSpec): LandingPage {
  return {
    slug: spec.slug,
    title: `${spec.ext} Viewer Online: Open ${spec.titleBrand ?? spec.brand} RAW Files Free`,
    metaDescription: `View ${spec.ext} files ${spec.descPhrase ?? `from ${spec.brand} cameras`} in your browser, with EXIF, star ratings and XMP export. Nothing is uploaded.`,
    h1: `Open ${spec.ext} files in your browser`,
    intro: spec.story,
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
      ...(spec.extraFaq ?? []),
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
