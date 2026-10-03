/** Home page FAQ, shared between the landing section and the JSON-LD. */
export const HOME_FAQ: [string, string][] = [
  [
    'Are my photos uploaded somewhere?',
    'No. OnlineCull runs entirely in your browser. Files are read locally with the File System Access API and never leave your computer. You can load a 50 GB shoot on hotel wifi: there is no upload, so there is nothing to wait for.',
  ],
  [
    'How can a browser open RAW files that fast?',
    'Every RAW file carries a full-size JPEG preview that the camera rendered at capture time. OnlineCull parses the CR2, CR3, NEF, ARW, RAF, DNG, ORF, RW2 or PEF container and pulls that preview out directly, the same trick that makes Photo Mechanic famously fast. No demosaicing, no waiting.',
  ],
  [
    'Does it really cost nothing?',
    'Yes. No account, no 200 photo cap, no watermark, no trial clock. Open as many folders as you like.',
  ],
  [
    'How do my ratings get into Lightroom?',
    'OnlineCull writes standard XMP sidecar files next to your RAWs (or hands them to you as a ZIP). On import, Lightroom Classic, Bridge and Capture One read the star ratings; picks arrive with a green color label and rejects with a red one.',
  ],
  [
    'What happens to RAW+JPEG pairs?',
    'Shoots with RAW+JPEG enabled show one card per photo, marked +JPG, instead of annoying duplicates. Copying your picks brings both files along.',
  ],
  [
    'Which browsers work?',
    'Chrome and Edge give the full experience, including writing XMP sidecars next to your files. Safari and Firefox can open folders and cull all the same; exports arrive as downloads instead.',
  ],
  [
    'Do my ratings survive a reload?',
    'Yes. Marks are stored in your browser, keyed to each file. Close the tab, come back tomorrow, reopen the same folder and your stars and flags are still there.',
  ],
];
