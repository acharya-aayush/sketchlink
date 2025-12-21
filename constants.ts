
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
