import { shouldExcludeRecipe } from '../../shared/dietRules.js';

const tests: [string, string][] = [
  ['Pizza Dough', 'flour water yeast salt'],
  ['Pizza Margherita', 'pizza dough tomato mozzarella basil'],
  ['Pasta Bolognese', 'pasta beef mince tomato'],
  ['White Rice Bowl', 'white rice chicken vegetables'],
  ['Bread Roll', 'bread flour yeast butter'],
  ['Potato Gratin', 'potato cream cheese'],
  ['Banana Smoothie', 'banana milk honey'],
  ['Chickpea Curry', 'chickpeas tomato onion garlic'],
  ['Lentil Soup', 'lentils onion carrot vegetable stock'],
  ['Spinach Salad', 'spinach lettuce tomato cucumber'],
  ['Grilled Chicken', 'chicken breast lemon herbs olive oil'],
  ['Salmon Fillet', 'salmon lemon butter dill'],
  ['Scrambled Eggs', 'eggs butter salt pepper'],
  ['Avocado Salad', 'avocado tomato onion'],
  ['Oatmeal Porridge', 'oats milk honey'],
  ['Steak Ribeye', 'beef steak butter salt pepper'],
  ['Mac and Cheese', 'macaroni cheddar butter milk flour'],
  ['Hummus Toast', 'hummus bread chickpeas'],
];

const patterns = ['Keto','Low-Carb','Paleo','Carnivore','Mediterranean','DASH','MIND','Flexitarian','Vegetarian','Vegan'];

console.log('\n=== DIETARY EXCLUSION MATRIX ===');
console.log('Food'.padEnd(22), ...patterns.map(p => p.substring(0,10).padEnd(11)));
console.log('-'.repeat(22 + 11 * patterns.length));
for (const [name, ingredients] of tests) {
  const text = (name + ' ' + ingredients).toLowerCase();
  const row = patterns.map(p => shouldExcludeRecipe(text, { dietPattern: p, dietRestrictions: [] }) ? 'EXCL      ' : '-         ');
  console.log(name.padEnd(22), ...row);
}

// Test Keto scoring - does it boost pizza with cheese?
import { scoreRecipeForDiet } from '../../shared/dietRules.js';

console.log('\n=== KETO SCORE BOOST TEST (cheese/dairy in pizza) ===');
const ketoMeals = [
  ['Pizza Margherita', 'pizza dough tomato mozzarella basil'],
  ['Cheese Pizza', 'pizza base cheese tomato sauce'],
  ['Keto Salmon Bowl', 'salmon avocado eggs cream cheese'],
  ['Low-carb Steak', 'beef steak butter cream garlic'],
  ['Pasta Carbonara', 'pasta eggs bacon parmesan cream'],
  ['Rice Pudding', 'rice milk sugar cream'],
  ['Lentil Dahl', 'lentils onion tomato coconut milk spices'],
];
for (const [name, ingredients] of ketoMeals) {
  const text = (name + ' ' + ingredients).toLowerCase();
  const excluded = shouldExcludeRecipe(text, { dietPattern: 'Keto', dietRestrictions: [] });
  const score = scoreRecipeForDiet(text, 'Keto');
  console.log(`${excluded ? 'EXCL' : 'PASS'} | score:${score.toString().padStart(3)} | ${name} (${ingredients})`);
}

console.log('\n=== PIZZA: Does ingredient listing style determine exclusion? ===');
const pizzaVariants = [
  ['Pizza Margherita', 'pizza dough tomato mozzarella basil'],         // "pizza dough" as ingredient
  ['Pizza Margherita', 'flour water yeast tomato mozzarella basil'],   // "flour" as ingredient
  ['Pizza Margherita', 'bread dough tomato mozzarella basil'],         // "bread dough"
  ['Homemade Pizza', 'pizza base mozzarella tomato sauce peppers'],    // "pizza base" 
  ['Neapolitan Pizza', 'wheat flour water yeast tomato fior di latte'], // "wheat flour"
];
for (const [name, ingredients] of pizzaVariants) {
  const text = (name + ' ' + ingredients).toLowerCase();
  const excluded = shouldExcludeRecipe(text, { dietPattern: 'Keto', dietRestrictions: [] });
  console.log(`${excluded ? 'EXCL' : 'PASS'} | Keto | "${name}" | ingredients: [${ingredients}]`);
}
