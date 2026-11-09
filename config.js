// Linkbygger: indstillinger
// Ny kampagne: tilføj en linje i CAMPAIGNS, f.eks. { v: "eoy2027", t: "eoy2027", d: "End of Year 2027" },
// v = det, der står i utm_campaign. Små bogstaver, ingen æøå, ingen mellemrum.
// Nyt medie eller format: tilføj en linje i den rigtige liste under FORMATS.

var CHANNELS = [
  { v: "facebook", t: "Facebook", d: "Opslag, story, annonce", social: true },
  { v: "instagram", t: "Instagram", d: "Opslag, story, reel, bio", social: true },
  { v: "linkedin", t: "LinkedIn", d: "Opslag, annonce", social: true },
  { v: "google-ads", t: "Google Ads", d: "Søg, Display, YouTube", gads: true },
  { v: "microsoft-ads", t: "Microsoft Ads", d: "Bing, Microsoft-netværket", gads: true, ms: true },
  { v: "display", t: "Display og andet købt", d: "Bannere, video, podcast, native", display: true },
  { v: "sfmc", t: "Marketing Cloud", d: "Mail fra SFMC", medium: "email" },
  { v: "print", t: "Print og outdoor", d: "Brev, Journalen, outdoor, avisannonce", print: true },
  { v: "msf-web", t: "MSF.DK", d: "Banner, popup", medium: "internal" }
];
var FORMATS = {
  facebook: [
    { v: "post", t: "Opslag", d: "Billede, tekst eller link" },
    { v: "carousel", t: "Karrusel", d: "Flere billeder i ét opslag" },
    { v: "video", t: "Video", d: "Længere video", o: "Overlapper med Reel. Korte videoer er reels." },
    { v: "reel", t: "Reel", d: "Kort video", o: "Vises også i feed som video." },
    { v: "story", t: "Story", d: "Forsvinder efter 24 timer" },
    { v: "profil", t: "Profil", d: "Linket på profilen" },
    { v: "cm", t: "Svar og DM", d: "Community management" }
  ],
  instagram: [
    { v: "post", t: "Opslag", d: "Ét billede", o: "Flere billeder? Vælg Karrusel." },
    { v: "carousel", t: "Karrusel", d: "Flere billeder eller videoer" },
    { v: "reel", t: "Reel", d: "Video", o: "Alle videoer på Instagram er reels." },
    { v: "story", t: "Story", d: "Forsvinder efter 24 timer" },
    { v: "profil", t: "Profil", d: "Linket på profilen" },
    { v: "cm", t: "Svar og DM", d: "Community management" }
  ],
  linkedin: [
    { v: "post", t: "Opslag", d: "Tekst, billede eller link" },
    { v: "document", t: "Karrusel", d: "PDF, man bladrer i" },
    { v: "video", t: "Video", d: "Video i feedet" },
    { v: "article", t: "Artikel", d: "Længere tekst på LinkedIn" },
    { v: "profil", t: "Profil", d: "Linket på profilen" },
    { v: "cm", t: "Svar og DM", d: "Community management" }
  ],
  meta_paid: [
    { v: "image", t: "Billede", d: "Enkelt billede", o: "Kører også i story og reels. Placeringen kommer med automatisk." },
    { v: "video", t: "Video", d: "Enkelt video", o: "Kører også som reel og story. Placeringen kommer med automatisk." },
    { v: "carousel", t: "Karrusel", d: "Flere billeder eller videoer" },
    { v: "collection", t: "Collection", d: "Forside med flere billeder" },
    { v: "leadcard", t: "Lead-annonce", d: "Formular i Meta", o: "Kan være billede eller video. Vælg Lead-annonce." }
  ],
  linkedin_paid: [
    { v: "image", t: "Billede", d: "Enkelt billede" },
    { v: "video", t: "Video", d: "Enkelt video" },
    { v: "carousel", t: "Karrusel", d: "Flere billeder", o: "Karrusel er billeder. Er det en PDF, vælg Dokument." },
    { v: "document", t: "Dokument", d: "PDF i feedet" },
    { v: "leadcard", t: "Lead-annonce", d: "Formular i LinkedIn", o: "Kan være billede eller video. Vælg Lead-annonce." },
    { v: "message", t: "Besked", d: "Sendes i indbakken" }
  ],
  // Display købt uden om Google Ads. m = utm_medium, så GA4 lægger det i den rigtige kanal.
  display: [
    { v: "banner", t: "Banner", d: "Billede eller animation", m: "display" },
    { v: "video", t: "Video", d: "Pre-roll, online-tv", m: "display" },
    { v: "audio", t: "Podcast og lyd", d: "Spot i podcast eller netradio", m: "audio" },
    { v: "native", t: "Native", d: "Advertorial, betalt artikel", m: "paid-native" }
  ],
  printOwn: [
    { v: "journalen", t: "Journalen", d: "Medlemsbladet" },
    { v: "brev", t: "Brev", d: "Høstbrev, julebrev, andre breve" },
    { v: "gocard", t: "Go-card", d: "Gratis postkort" },
    { v: "flyer", t: "Flyer", d: "Flyer, folder" },
    { v: "outdoor", t: "Outdoor", d: "I det offentlige rum" }
  ],
  printPaid: [
    { v: "politiken", t: "Politiken" }, { v: "jyllandsposten", t: "Jyllands-Posten" },
    { v: "information", t: "Information" }, { v: "weekendavisen", t: "Weekendavisen" },
    { v: "kristeligt-dagblad", t: "Kristeligt Dagblad" },
    { v: "__other", t: "Andet medie", d: "Skriv navnet" }
  ],
  internal: [{ v: "banner", t: "Banner" }, { v: "popup", t: "Popup" }]
};
var CAMPAIGNS = [
  { v: "evergreen", t: "Nej", d: "Almindeligt indhold" },
  { v: "eoy2026", t: "eoy2026", d: "End of Year 2026" }
];

var DEFAULT_CODE_ONE = "2822", DEFAULT_CODE_FP = "2824", DEFAULT_CODE_GIFT = "2472";
