/* ─── Disciplined 5-color palette (everything else gets pulled toward this) */
export const PALETTE = {
  skyTop:    "#2a1338",
  skyMid:    "#a04020",
  skyHorizon:"#d8a050",
  stone:     "#7a6a58",
  stoneDark: "#3e2e22",
  foliage:   "#3a4a28",
  fire:      "#ff7028",
  cream:     "#e8c898",
};

export type Landmark = {
  id: string;
  pos: [number, number, number];
  radius: number;
  name: string;
  hint: string;
};

export const LANDMARKS: Landmark[] = [
  { id: "torii",    pos: [0, 0, 70],   radius: 8,  name: "Threshold Gate",        hint: "You are entering sacred ground" },
  { id: "tablet",   pos: [8, 0, 64],   radius: 4,  name: "Vintazk Stone Tablet",  hint: "The seal of the order · carved in the old script" },
  { id: "altar",    pos: [0, 0, 8],    radius: 6,  name: "Spell Circle",          hint: "Pulses with ancient warmth" },
  { id: "gong",     pos: [-15, 0, 12], radius: 5,  name: "Bronze Gong",           hint: "Press E to strike · or click the disc" },
  { id: "pool",     pos: [22, 0, -8],  radius: 6,  name: "Reflecting Pool",       hint: "Lotus and koi · still as glass" },
  { id: "training", pos: [-22, 0, -8], radius: 6,  name: "Sparring Grounds",      hint: "Posts of polished cypress" },
  { id: "temple",   pos: [0, 0, -28],  radius: 12, name: "Main Temple",           hint: "Climb the steps · the spires hum" },
  { id: "sanctum",  pos: [-32, 0, -28],radius: 10, name: "Sanctum Hall",          hint: "Step inside · the library awaits" },
  { id: "tomes",    pos: [-38, 1, -32],radius: 4,  name: "Project Tomes",         hint: "Barangay Connect · Bose Café · Vintazk" },
  { id: "relic",    pos: [-26, 1, -32],radius: 3,  name: "Cursed Acer Aspire",    hint: "Water-damaged · still revered" },
  { id: "throne",   pos: [-32, 1, -42],radius: 4,  name: "The Throne-Desk",       hint: "Where the heroes write their grimoires" },
  { id: "sigil",    pos: [-32, 0.1, -28], radius: 3, name: "KENTO·O Sigil",        hint: "The seal of the order" },
];
