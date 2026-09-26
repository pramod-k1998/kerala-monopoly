// Kerala-inspired board data. 28 tiles, corners at index 0, 7, 14, 21.
// group colors are purely original, not copied from any existing game.
const GROUP_COLORS = {
  beach:    "#2FA4A9", // sea teal
  backwater:"#3F7D4A", // paddy green
  cultural: "#C1543A", // terracotta
  hill:     "#6B4E9B", // tea-hill violet
  premium:  "#D9A441", // temple gold
  transport:"#4A3427", // coir brown
  special:  "#8A8F98"
};

const BOARD = [
  { i:0,  type:"go",       name:"Marina Muhurtham",        emoji:"🏁" },
  { i:1,  type:"property", name:"Kovalam Beach",           emoji:"🏖️", group:"beach",     price:500,  rent:30 },
  { i:2,  type:"chest",    name:"Surprise",                emoji:"🎁" },
  { i:3,  type:"property", name:"Varkala Cliff",           emoji:"🏖️", group:"beach",     price:550,  rent:40 },
  { i:4,  type:"tax",      name:"KSEB Bill",               emoji:"💡", amount:150 },
  { i:5,  type:"property", name:"Bekal Fort",              emoji:"🏰", group:"beach",     price:650,  rent:45 },
  { i:6,  type:"transport",name:"KSRTC Bus Stand",         emoji:"🚌", price:400,  rent:75 },
  { i:7,  type:"jail",     name:"Alappuzha — Just Visiting", emoji:"🚤" },
  { i:8,  type:"property", name:"Kumarakom",               emoji:"🌾", group:"backwater", price:800,  rent:55 },
  { i:9,  type:"chest",    name:"Surprise",                emoji:"🎁" },
  { i:10, type:"property", name:"Kollam Backwaters",       emoji:"🌾", group:"backwater", price:900,  rent:60 },
  { i:11, type:"transport",name:"Kochi Water Metro",       emoji:"⛴️", price:400,  rent:75 },
  { i:12, type:"property", name:"Kozhikode Beach Road",    emoji:"🕌", group:"cultural",  price:1050, rent:70 },
  { i:13, type:"property", name:"Thrissur Pooram Grounds", emoji:"🐘", group:"cultural",  price:1100, rent:75 },
  { i:14, type:"parking",  name:"Fort Kochi — Backwater Break", emoji:"🌅" },
  { i:15, type:"property", name:"Kannur Theyyam Grounds",  emoji:"🔥", group:"cultural",  price:1200, rent:85 },
  { i:16, type:"chest",    name:"Surprise",                emoji:"🎁" },
  { i:17, type:"transport",name:"Kochi Metro",             emoji:"🚇", price:400,  rent:75 },
  { i:18, type:"property", name:"Wayanad Hills",           emoji:"⛰️", group:"hill",      price:1350, rent:100 },
  { i:19, type:"property", name:"Thekkady Tea Estate",     emoji:"🍃", group:"hill",      price:1450, rent:105 },
  { i:20, type:"tax",      name:"Toddy Shop Tax",          emoji:"🥥", amount:100 },
  { i:21, type:"gotojail", name:"Police Checkpost",        emoji:"🚓" },
  { i:22, type:"property", name:"Munnar Tea Gardens",      emoji:"🍵", group:"hill",      price:1600, rent:120 },
  { i:23, type:"chest",    name:"Surprise",                emoji:"🎁" },
  { i:24, type:"property", name:"Athirappilly Falls",      emoji:"💦", group:"premium",   price:1700, rent:130 },
  { i:25, type:"transport",name:"Kerala Water Authority",  emoji:"🚰", price:400,  rent:75 },
  { i:26, type:"property", name:"Kochi Marine Drive",      emoji:"🏙️", group:"premium",   price:1850, rent:145 },
  { i:27, type:"property", name:"Thiruvananthapuram Fort", emoji:"👑", group:"premium",   price:2000, rent:160 }
];

const SURPRISE_CARDS = [
  { text: "Onam Sadya invitation! Collect ₹150.", money: 150 },
  { text: "Your houseboat needs repairs. Pay ₹100.", money: -100 },
  { text: "You won the Vallam Kali boat race! Collect ₹225.", money: 225 },
  { text: "Monsoon flooding damages your stall. Pay ₹75.", money: -75 },
  { text: "A tourist tips you generously. Collect ₹75.", money: 75 },
  { text: "Advance to Marina Muhurtham (GO). Collect ₹150.", moveTo: 0, collectGo: true, bonus: 150 },
  { text: "Take a free houseboat ride to Munnar Tea Gardens.", moveTo: 22 },
  { text: "Kathakali performance fee. Pay ₹50.", money: -50 },
  { text: "Spice trade profits! Collect ₹100.", money: 100 },
  { text: "Go directly to the Police Checkpost jail.", toJail: true },
  { text: "A spice shipment sells out. Collect ₹200.", money: 200 },
  { text: "Head to Kochi Marine Drive for a festival.", moveTo: 26 },
  { text: "Visit Kovalam Beach for a weekend break.", moveTo: 1 },
  { text: "A ferry delay costs you ₹100.", money: -100 },
  { text: "A monsoon detour sends you to the Police Checkpost.", toJail: true },
  { text: "Festival fund! Split ₹600 equally among all active players.", splitPool: 600 },
  { text: "Pay ₹100 to the bank for a road permit.", payBank: 100 }
];

const TOKENS = ["🥥","🛶","🐘","🦚","🌴","🏵️"];
const START_MONEY = 12000;
const PASS_GO_BONUS = 1500;
const JAIL_BAIL = 100;
const JAIL_SENTENCE_TURNS = 3;
const JAIL_INDEX = 7;
const GO_TO_JAIL_INDEX = 21;
