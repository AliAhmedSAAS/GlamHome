export const DUBAI_AREAS = [
  // Premium Areas
  "Dubai Marina",
  "Palm Jumeirah",
  "Downtown Dubai",
  "Business Bay",
  "Jumeirah Beach Residence (JBR)",
  "Dubai Hills Estate",
  "Arabian Ranches",
  "Emirates Hills",
  "Jumeirah",
  "Jumeirah 1",
  "Jumeirah 2",
  "Jumeirah 3",
  "Umm Suqeim",
  
  // Central Dubai
  "Bur Dubai",
  "Deira",
  "Al Barsha",
  "Al Quoz",
  "Al Karama",
  "Al Satwa",
  "Oud Metha",
  "Al Mankhool",
  
  // New Dubai
  "Dubai South",
  "Dubai Sports City",
  "Motor City",
  "Jumeirah Village Circle (JVC)",
  "Jumeirah Village Triangle (JVT)",
  "Jumeirah Lakes Towers (JLT)",
  "Damac Hills",
  "Arjan",
  "Barsha Heights (TECOM)",
  "Dubai Silicon Oasis",
  "International City",
  
  // East Dubai
  "Mirdif",
  "Muhaisnah",
  "Al Nahda",
  "Al Qusais",
  "Hor Al Anz",
  
  // Modern Developments
  "City Walk",
  "La Mer",
  "Bluewaters Island",
  "The Springs",
  "The Meadows",
  "The Lakes",
  "The Greens",
  "The Views",
  "Discovery Gardens",
  "Dubai Production City",
  
  // Waterfront & Beach
  "Jumeirah Islands",
  "Al Sufouh",
  "Madinat Jumeirah",
  
  // Business & Commercial
  "Dubai Internet City",
  "Dubai Media City",
  "Dubai Knowledge Park",
  "Sheikh Zayed Road",
  
  // Other Notable Areas
  "Al Barari",
  "Meydan",
  "Nad Al Sheba",
  "Al Warqaa",
  "Rashidiya",
  "Festival City",
  "Academic City",
  "Remraam",
  "Town Square",
  "Mudon",
  "Serena",
  "Dubai Creek Harbour",
  "Al Furjan",
  "Jebel Ali",
  "The Sustainable City",
] as const;

export type DubaiArea = typeof DUBAI_AREAS[number];
