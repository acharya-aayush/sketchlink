
export const WORD_LIBRARY = {
  Easy: [
    // Basic Objects
    'Apple', 'Sun', 'House', 'Tree', 'Car', 'Book', 'Chair', 'Fish', 'Bird', 'Moon',
    'Ball', 'Smile', 'Cloud', 'Star', 'Cat', 'Dog', 'Hat', 'Eye', 'Mouth', 'Door',
    'Pizza Slice', 'Donut', 'Cactus', 'Sunglasses', 'Ghost', 'Taco', 'Sword', 'Snail',
    'Tooth', 'Mountains', 'Popsicle', 'Lightbulb', 'Stick Man', 'Envelope', 'Snake',
    'Coffee Mug', 'Butterfly', 'Key', 'Balloon', 'Umbrella', 'Cupcake', 'Rainbow',
    'Mushroom', 'Candle', 'Snowman', 'Heart', 'Flower', 'Banana', 'Ladybug', 'Bee'
  ],
  Medium: [
    // Food & Objects
    'Campfire', 'Scuba Diver', 'Skateboard', 'Broken Heart', 'Stinky Sock', 'Ice Cube',
    'Sandwich', 'Bathtub', 'Jellyfish', 'Flying Saucer', 'Treasure Map', 'Brain Freeze',
    'Melting Snowman', 'Angry Cloud', 'Hammer', 'Spider Web', 'Baguette', 'Rocket Ship',
    'Windmill', 'Popcorn', 'Ninja', 'Pirate Ship', 'Wizard Hat', 'Magic Wand',
    'Headphones', 'Microphone', 'Bowling Pin', 'Anchor', 'Compass', 'Treasure Chest',
    // Pop Culture - Easy References
    'Lightsaber', 'Pokeball', 'Mario Mushroom', 'Minecraft Creeper', 'Among Us',
    'Baby Yoda', 'Pikachu', 'SpongeBob', 'Patrick Star', 'Shrek', 'Minion',
    'Bart Simpson', 'Homer Simpson', 'Mickey Mouse', 'Sonic', 'Pac-Man',
    'Thor Hammer', 'Captain America Shield', 'Batman Logo', 'Superman Logo'
  ],
  Hard: [
    // Challenging Objects
    'Roller Coaster', 'Time Machine', 'Electric Guitar', 'Haunted House', 'Solar System',
    'Underwater Party', 'Invisible Man', 'Rainy Day', 'Dragon Fire', 'Construction Site',
    'Eiffel Tower', 'Limousine', 'Diving Board', 'Backpack', 'Firetruck',
    'Statue of Liberty', 'Microscope', 'Trombone', 'Video Game Controller',
    // Dinosaurs & Creatures
    'Tyrannosaurus Rex', 'Velociraptor', 'Pterodactyl', 'Triceratops', 'Stegosaurus',
    'Kraken', 'Werewolf', 'Medusa', 'Centaur', 'Phoenix', 'Griffin',
    // Pop Culture - Harder References  
    'Thanos Snap', 'Infinity Gauntlet', 'Death Star', 'Millennium Falcon', 'TARDIS',
    'Iron Man Suit', 'Straw Hat Luffy', 'Goku Kamehameha', 'Naruto Running',
    'One Punch Man', 'Attack on Titan', 'Demon Slayer Sword', 'Jujutsu Kaisen',
    'Walter White', 'The Mandalorian', 'Squid Game Guard', 'Wednesday Addams',
    // Medical/Scientific (Challenging)
    'Stethoscope', 'DNA Helix', 'Atom Model', 'Black Hole', 'Space Station',
    'Brain Surgery', 'X-Ray Skeleton', 'Chemical Reaction', 'Telescope',
    // Abstract/Actions
    'Monday Morning', 'Awkward Silence', 'Deja Vu', 'Plot Twist', 'Cliffhanger',
    'Photobomb', 'Selfie Stick', 'Binge Watching', 'Brain Fart', 'Food Coma',
    // Sports References
    'Ronaldo Celebration', 'Messi Dribbling', 'LeBron Dunk', 'Tiger Woods Swing',
    'Olympic Rings', 'World Cup Trophy', 'Slam Dunk', 'Hole in One'
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
  { category: 'Developer', text: "Aayush is finally caught up with One Piece! Gear 5 was worth it 🏴‍☠️" },
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
  { category: 'Pop Culture', text: "Try drawing 'Goku Kamehameha' - good luck! 🐉" },
  { category: 'Pop Culture', text: "Can you draw 'Naruto Running' without looking silly? 🏃‍♂️" },
  { category: 'Challenge', text: "Hard mode unlocked: Try drawing 'Awkward Silence' 😶" },
];
