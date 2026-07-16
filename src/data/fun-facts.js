const FUN_FACTS = [
  { category: 'fitness', text: 'Your muscles store glycogen, which helps fuel intense exercise.' },
  { category: 'fitness', text: 'Strength training can increase your resting metabolic rate by up to 15%.' },
  { category: 'fitness', text: 'The average person has over 600 muscles in their body.' },
  { category: 'fitness', text: 'Muscles are three times more efficient at burning calories than fat.' },
  { category: 'fitness', text: 'Your body has over 200 bones, and more than half are in your hands and feet.' },
  { category: 'fitness', text: 'Exercise improves brain function by increasing blood flow and oxygen.' },
  { category: 'fitness', text: 'Compound lifts like squats and deadlifts activate more muscle fibers than isolation exercises.' },
  { category: 'fitness', text: 'Rest days are when your muscles actually grow and repair.' },
  { category: 'fitness', text: 'Progressive overload is the single most important principle for building strength.' },
  { category: 'fitness', text: 'A proper warm-up can improve your workout performance by up to 20%.' },
  { category: 'science', text: 'Your brain uses about 20% of your total daily energy expenditure.' },
  { category: 'science', text: 'Water expands by about 9% when it freezes, which is why ice floats.' },
  { category: 'science', text: 'The human body contains about 37.2 trillion cells.' },
  { category: 'science', text: 'Sound travels about four times faster in water than in air.' },
  { category: 'science', text: 'Your DNA, if stretched out, would extend about 10 billion miles.' },
  { category: 'science', text: 'The human eye can distinguish approximately 10 million different colors.' },
  { category: 'science', text: 'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.' },
  { category: 'science', text: 'Bananas are naturally radioactive due to their potassium content.' },
  { category: 'science', text: 'There are more stars in the universe than grains of sand on Earth.' },
  { category: 'science', text: 'Your body generates about 25 million new cells each second.' },
  { category: 'body', text: 'Your heart beats about 100,000 times per day.' },
  { category: 'body', text: 'The human body is about 60% water by weight.' },
  { category: 'body', text: 'Your bones are stronger pound-for-pound than steel.' },
  { category: 'body', text: 'The small intestine is about 20 feet long, longer than a car.' },
  { category: 'body', text: 'You shed about 30,000 to 40,000 dead skin cells every hour.' },
  { category: 'body', text: 'Your nose can remember about 50,000 different scents.' },
  { category: 'body', text: 'The strongest muscle in your body relative to size is the masseter (jaw).' },
  { category: 'body', text: 'Your liver performs over 500 different functions in the body.' },
  { category: 'body', text: 'Fingernails and toenails grow at different rates, with toenails growing slower.' },
  { category: 'body', text: 'The human brain can process visual information in as little as 13 milliseconds.' },
  { category: 'nutrition', text: 'Eating protein helps build and repair muscle tissue after exercise.' },
  { category: 'nutrition', text: 'Creatine is one of the most studied and effective supplements for strength gains.' },
  { category: 'nutrition', text: 'Your body needs about 0.8 grams of protein per kilogram of body weight daily.' },
  { category: 'nutrition', text: 'Vitamin D is produced when your skin is exposed to sunlight.' },
  { category: 'nutrition', text: 'Fiber-rich foods can help lower cholesterol and improve digestion.' },
  { category: 'nutrition', text: 'Dehydration of just 2% can significantly reduce physical performance.' },
  { category: 'nutrition', text: 'Omega-3 fatty acids found in fish oil support heart and brain health.' },
  { category: 'nutrition', text: 'Eating before a workout can improve performance, but heavy meals may slow you down.' },
  { category: 'nutrition', text: 'Electrolytes like sodium and potassium are essential for muscle contractions.' },
  { category: 'nutrition', text: 'Post-workout nutrition within 30-60 minutes can enhance muscle recovery.' },
  { category: 'space', text: 'A day on Venus is longer than a year on Venus.' },
  { category: 'space', text: 'There is a planet made entirely of diamonds, called 55 Cancri e.' },
  { category: 'space', text: 'The Sun makes up 99.86% of the mass in our solar system.' },
  { category: 'space', text: 'Neutron stars can spin up to 600 times per second.' },
  { category: 'space', text: 'The footprints on the Moon will likely stay there for 100 million years.' },
  { category: 'space', text: 'Saturn would float in water if you could find a bathtub large enough.' },
  { category: 'space', text: 'The universe is about 13.8 billion years old.' },
  { category: 'space', text: 'Light from the Andromeda Galaxy takes 2.5 million years to reach us.' },
  { category: 'space', text: 'The International Space Station orbits Earth about 16 times per day.' },
  { category: 'space', text: 'There are more galaxies in the observable universe than people on Earth.' },
  { category: 'technology', text: 'The first computer mouse was made of wood.' },
  { category: 'technology', text: 'Over 90% of the world\'s data was created in the last two years.' },
  { category: 'technology', text: 'The average smartphone has more computing power than NASA had in 1969.' },
  { category: 'technology', text: 'WiFi doesn\'t stand for anything — it\'s a trademark name.' },
  { category: 'technology', text: 'The first text message was sent in 1992 and said "Merry Christmas."' },
  { category: 'technology', text: 'Over 5 billion people worldwide use the internet.' },
  { category: 'technology', text: 'The first video uploaded to YouTube was 18 seconds long.' },
  { category: 'technology', text: 'Modern GPUs can perform billions of calculations per second.' },
  { category: 'technology', text: 'The first computer bug was an actual bug found inside a relay.' },
  { category: 'technology', text: 'Bluetooth technology is named after a Viking king, Harald Bluetooth.' }
];

export const FACT_CATEGORIES = [
  { id: 'fitness', label: 'Fitness', emoji: '🏋️' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'body', label: 'Human Body', emoji: '🫀' },
  { id: 'nutrition', label: 'Nutrition', emoji: '🥗' },
  { id: 'space', label: 'Space', emoji: '🌌' },
  { id: 'technology', label: 'Technology', emoji: '💻' }
];

export function getDailyFact(dateKey, enabledCategories) {
  const pool = FUN_FACTS.filter(f => enabledCategories.includes(f.category));
  if (!pool.length) return null;
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = ((hash << 5) - hash) + dateKey.charCodeAt(i);
    hash |= 0;
  }
  return pool[Math.abs(hash) % pool.length];
}

export function getRandomFact(enabledCategories) {
  const pool = FUN_FACTS.filter(f => enabledCategories.includes(f.category));
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getFactPool(enabledCategories) {
  return FUN_FACTS.filter(f => enabledCategories.includes(f.category));
}

export default FUN_FACTS;
