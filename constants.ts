
export const WORD_LIBRARY = {
  Easy: [
    'Pizza Slice', 'Donut', 'Cactus', 'Sunglasses', 'Ghost', 'Taco', 'Sword', 'Snail', 
    'Tooth', 'Mountains', 'Popsicle', 'Lightbulb', 'Stick Man', 'Envelope', 'Snake', 
    'Coffee Mug', 'Butterfly', 'Moon', 'Star', 'Key'
  ],
  Medium: [
    'Campfire', 'Scuba Diver', 'Skateboard', 'Broken Heart', 'Stinky Sock', 'Ice Cube', 
    'Sandwich', 'Bathtub', 'Jellyfish', 'Flying Saucer', 'Treasure Map', 'Brain Freeze', 
    'Melting Snowman', 'Angry Cloud', 'Hammer', 'Spider Web', 'Baguette', 'Rocket Ship', 
    'Windmill', 'Popcorn'
  ],
  Hard: [
    'Roller Coaster', 'Time Machine', 'Electric Guitar', 'Haunted House', 'Solar System', 
    'Underwater Party', 'Invisible Man', 'Rainy Day', 'Dragon Fire', 'Construction Site', 
    'Eiffel Tower', 'Limousine', 'Zebra', 'Diving Board', 'Backpack', 'Firetruck', 
    'Statue of Liberty', 'Microscope', 'Trombone', 'Video Game'
  ]
};

// Fallback flat list if needed
export const WORD_LIST = [...WORD_LIBRARY.Easy, ...WORD_LIBRARY.Medium, ...WORD_LIBRARY.Hard];

export const DIFFICULTY_CONFIG = {
  Easy: { duration: 60, points: 100 },
  Medium: { duration: 45, points: 200 },
  Hard: { duration: 30, points: 300 },
};

export const AVATARS = [
  '😌', '🐱', '🐼', '🦊', 
  '🐸', '👻', '👽', '🤖',
  '🎨', '✏️', '🍕', '🍦',
  '🤠', '😎', '🤪', '🥳'
];

// Fun facts shown during server wake-up (cycle every 4-5 seconds)
export const FUN_FACTS = [
  { category: 'Developer', text: "Did you know the dev (Aayush) is a massive tea addict? ☕" },
  { category: 'Developer', text: "Aayush is currently catching up on One Piece. No spoilers! 🏴‍☠️" },
  { category: 'Developer', text: "This game was built with React, Socket.io, and lots of caffeine 💻" },
  { category: 'Trivia', text: "Luffy's favorite food is meat, but he'd probably draw a bad circle 🍖" },
  { category: 'Trivia', text: "Messi has 8 Ballon d'Ors, but can he draw a 'Goat' in 20 seconds? 🐐" },
  { category: 'Trivia', text: "The fastest Pictionary round ever was guessed in under 2 seconds! ⚡" },
  { category: 'Game Tip', text: "Pro Tip: Use the 'Fill' tool to save time on large backgrounds! 🎨" },
  { category: 'Game Tip', text: "Speed matters! A messy drawing guessed fast is worth more points 🏃" },
  { category: 'Game Tip', text: "Draw the most recognizable part first - silhouettes work! ✏️" },
  { category: 'Fun', text: "Aayush is brewing tea while the server wakes up... 🍵" },
  { category: 'Fun', text: "Warming up the drawing pencils... ✏️" },
  { category: 'Fun', text: "Loading infinite creativity... 🎨" },
];
