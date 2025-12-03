
export const WORD_LIBRARY = {
  Easy: [
    'Apple', 'Sun', 'House', 'Tree', 'Car', 'Book', 'Chair', 'Fish', 'Bird', 'Moon',
    'Ball', 'Smile', 'Cloud', 'Star', 'Cat', 'Dog', 'Hat', 'Eye', 'Mouth', 'Door'
  ],
  Medium: [
    'Pizza', 'Ice Cream', 'Boat', 'Plane', 'Clock', 'Phone', 'Computer', 'Guitar',
    'Robot', 'Alien', 'Ghost', 'Spider', 'Turtle', 'Rabbit', 'Duck', 'Horse', 
    'Camera', 'Watch', 'Lamp', 'Shoes'
  ],
  Hard: [
    'Astronaut', 'Playground', 'Waterfall', 'Hurricane', 'Hospital', 'Library',
    'Dragon', 'Unicorn', 'Dinosaur', 'Pyramid', 'Sphinx', 'Volcano', 'Tornado',
    'Cactus', 'Kangaroo', 'Octopus', 'Penguin', 'Giraffe', 'Zebra', 'Elephant'
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
  '🐶', '🐱', '🐼', '🦊', 
  '🐸', '👻', '👽', '🤖',
  '🎨', '✏️', '🍕', '🍦',
  '🤠', '😎', '🤪', '🥳'
];
