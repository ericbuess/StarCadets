import type { EducationContent } from "./types"

type Difficulty = "easy" | "medium" | "hard"

interface TaggedContent extends EducationContent {
  difficulty?: Difficulty
}

interface SubjectBank {
  subject: string
  grades: string[]
  quizzes: TaggedContent[]
  flashcards: TaggedContent[]
  videos: TaggedContent[]
}

const questionBanks: SubjectBank[] = [
  {
    subject: "Math",
    grades: ["3", "4", "5", "6", "7", "8"],
    quizzes: [
      { type: "quiz", subject: "Math", difficulty: "easy", question: "What is 7 × 8?", options: ["54", "56", "58", "64"], correctAnswer: 1, explanation: "7 × 8 = 56. You can think of it as (7 × 4) × 2 = 28 × 2 = 56." },
      { type: "quiz", subject: "Math", difficulty: "easy", question: "What is 144 ÷ 12?", options: ["10", "11", "12", "14"], correctAnswer: 2, explanation: "144 ÷ 12 = 12. This is because 12 × 12 = 144." },
      { type: "quiz", subject: "Math", difficulty: "easy", question: "What is the area of a rectangle with length 8 and width 5?", options: ["13", "26", "35", "40"], correctAnswer: 3, explanation: "Area = length × width = 8 × 5 = 40 square units." },
      { type: "quiz", subject: "Math", difficulty: "medium", question: "Which fraction is equivalent to 3/4?", options: ["6/8", "4/6", "5/8", "9/16"], correctAnswer: 0, explanation: "3/4 = 6/8 because both numerator and denominator are multiplied by 2." },
      { type: "quiz", subject: "Math", difficulty: "medium", question: "What is 15% of 200?", options: ["15", "20", "25", "30"], correctAnswer: 3, explanation: "15% of 200 = 0.15 × 200 = 30." },
      { type: "quiz", subject: "Math", difficulty: "hard", question: "Solve: 3x + 7 = 22. What is x?", options: ["3", "4", "5", "6"], correctAnswer: 2, explanation: "3x + 7 = 22 → 3x = 15 → x = 5." },
      { type: "quiz", subject: "Math", difficulty: "easy", question: "What is the perimeter of a square with side 9?", options: ["18", "27", "36", "81"], correctAnswer: 2, explanation: "Perimeter = 4 × side = 4 × 9 = 36." },
      { type: "quiz", subject: "Math", difficulty: "medium", question: "What is √81?", options: ["7", "8", "9", "10"], correctAnswer: 2, explanation: "√81 = 9 because 9 × 9 = 81." },
      { type: "quiz", subject: "Math", difficulty: "medium", question: "What is the next prime number after 13?", options: ["14", "15", "16", "17"], correctAnswer: 3, explanation: "17 is prime because it has no factors other than 1 and itself." },
      { type: "quiz", subject: "Math", difficulty: "medium", question: "If a triangle has angles of 60° and 80°, what is the third angle?", options: ["30°", "40°", "50°", "60°"], correctAnswer: 1, explanation: "Triangle angles sum to 180°. 180 - 60 - 80 = 40°." },
      { type: "quiz", subject: "Math", difficulty: "hard", question: "What is 2³ × 3²?", options: ["36", "48", "72", "108"], correctAnswer: 2, explanation: "2³ = 8, 3² = 9, and 8 × 9 = 72." },
      { type: "quiz", subject: "Math", difficulty: "hard", question: "Convert 0.75 to a fraction.", options: ["1/2", "2/3", "3/4", "4/5"], correctAnswer: 2, explanation: "0.75 = 75/100 = 3/4 when simplified." },
    ],
    flashcards: [
      { type: "flashcard", subject: "Math", difficulty: "easy", term: "Numerator", definition: "The top number in a fraction, showing how many parts we have." },
      { type: "flashcard", subject: "Math", difficulty: "easy", term: "Denominator", definition: "The bottom number in a fraction, showing how many equal parts the whole is divided into." },
      { type: "flashcard", subject: "Math", difficulty: "easy", term: "Prime Number", definition: "A number greater than 1 that can only be divided by 1 and itself." },
      { type: "flashcard", subject: "Math", difficulty: "easy", term: "Perimeter", definition: "The total distance around the outside of a shape." },
      { type: "flashcard", subject: "Math", difficulty: "easy", term: "Area", definition: "The amount of space inside a 2D shape, measured in square units." },
      { type: "flashcard", subject: "Math", difficulty: "medium", term: "Volume", definition: "The amount of space inside a 3D object, measured in cubic units." },
      { type: "flashcard", subject: "Math", difficulty: "medium", term: "Mean (Average)", definition: "Add all the numbers together, then divide by how many numbers there are." },
      { type: "flashcard", subject: "Math", difficulty: "medium", term: "Median", definition: "The middle value when numbers are arranged in order." },
      { type: "flashcard", subject: "Math", difficulty: "hard", term: "Exponent", definition: "A number that shows how many times the base is multiplied by itself. Example: 2³ = 2 × 2 × 2 = 8." },
      { type: "flashcard", subject: "Math", difficulty: "hard", term: "Ratio", definition: "A comparison of two quantities. Example: 3:5 means for every 3 of one thing there are 5 of another." },
    ],
    videos: [
      { type: "video", subject: "Math", videoTitle: "Understanding Fractions", videoContent: "Fractions represent parts of a whole. The numerator tells us how many parts we have, and the denominator tells us how many equal parts the whole is divided into.\n\nKey concepts:\n• 1/2 means one out of two equal parts\n• Equivalent fractions: 1/2 = 2/4 = 3/6\n• To add fractions, you need a common denominator\n• To multiply fractions, multiply across: 2/3 × 3/4 = 6/12 = 1/2\n\nPractice: Try dividing a pizza into different numbers of slices to visualize fractions!" },
      { type: "video", subject: "Math", videoTitle: "Order of Operations (PEMDAS)", videoContent: "When solving math expressions with multiple operations, follow PEMDAS:\n\nP - Parentheses first\nE - Exponents (powers)\nM/D - Multiplication and Division (left to right)\nA/S - Addition and Subtraction (left to right)\n\nExample: 3 + 4 × 2 = 3 + 8 = 11 (NOT 14!)\nExample: (3 + 4) × 2 = 7 × 2 = 14\n\nRemember: Multiplication and Division have EQUAL priority. Same for Addition and Subtraction. Work left to right for equal priority operations." },
      { type: "video", subject: "Math", videoTitle: "Introduction to Geometry", videoContent: "Geometry is the study of shapes, sizes, and positions of figures.\n\nBasic shapes:\n• Triangle: 3 sides, angles sum to 180°\n• Square: 4 equal sides, all 90° angles\n• Rectangle: opposite sides equal, all 90° angles\n• Circle: all points same distance from center\n\nKey formulas:\n• Rectangle area = length × width\n• Triangle area = ½ × base × height\n• Circle area = π × radius²\n• Circle circumference = 2 × π × radius" },
    ]
  },
  {
    subject: "Science",
    grades: ["3", "4", "5", "6", "7", "8"],
    quizzes: [
      { type: "quiz", subject: "Science", difficulty: "easy", question: "What planet is closest to the Sun?", options: ["Venus", "Mercury", "Mars", "Earth"], correctAnswer: 1, explanation: "Mercury is the closest planet to the Sun at about 36 million miles." },
      { type: "quiz", subject: "Science", difficulty: "medium", question: "What is the chemical formula for water?", options: ["CO2", "H2O", "O2", "NaCl"], correctAnswer: 1, explanation: "Water is H₂O — two hydrogen atoms bonded to one oxygen atom." },
      { type: "quiz", subject: "Science", difficulty: "medium", question: "What type of rock is formed from cooled lava?", options: ["Sedimentary", "Metamorphic", "Igneous", "Mineral"], correctAnswer: 2, explanation: "Igneous rocks form when molten rock (magma/lava) cools and solidifies." },
      { type: "quiz", subject: "Science", difficulty: "easy", question: "What organ pumps blood through your body?", options: ["Brain", "Lungs", "Heart", "Liver"], correctAnswer: 2, explanation: "The heart pumps blood through blood vessels to deliver oxygen and nutrients to every cell." },
      { type: "quiz", subject: "Science", difficulty: "easy", question: "Which of these is NOT a state of matter?", options: ["Solid", "Liquid", "Energy", "Gas"], correctAnswer: 2, explanation: "The three common states of matter are solid, liquid, and gas. Energy is not a state of matter." },
      { type: "quiz", subject: "Science", difficulty: "medium", question: "What process do plants use to make food from sunlight?", options: ["Respiration", "Photosynthesis", "Fermentation", "Digestion"], correctAnswer: 1, explanation: "Photosynthesis converts sunlight, CO₂, and water into glucose and oxygen." },
      { type: "quiz", subject: "Science", difficulty: "easy", question: "What force keeps us on the ground?", options: ["Magnetism", "Friction", "Gravity", "Inertia"], correctAnswer: 2, explanation: "Gravity is the force of attraction between objects with mass. Earth's gravity pulls us toward its center." },
      { type: "quiz", subject: "Science", difficulty: "hard", question: "How many bones does an adult human body have?", options: ["106", "156", "206", "256"], correctAnswer: 2, explanation: "Adults have 206 bones. Babies start with about 270, but many fuse together as we grow." },
    ],
    flashcards: [
      { type: "flashcard", subject: "Science", difficulty: "medium", term: "Photosynthesis", definition: "The process by which plants use sunlight, water, and CO₂ to make glucose (food) and oxygen." },
      { type: "flashcard", subject: "Science", difficulty: "medium", term: "Ecosystem", definition: "A community of living organisms interacting with each other and their physical environment." },
      { type: "flashcard", subject: "Science", difficulty: "hard", term: "Atom", definition: "The smallest unit of matter that retains the properties of an element. Made of protons, neutrons, and electrons." },
      { type: "flashcard", subject: "Science", difficulty: "medium", term: "Cell", definition: "The basic unit of life. All living organisms are made of one or more cells." },
      { type: "flashcard", subject: "Science", difficulty: "easy", term: "Gravity", definition: "A force of attraction between any two objects with mass. Larger objects have stronger gravitational pull." },
      { type: "flashcard", subject: "Science", difficulty: "easy", term: "Evaporation", definition: "The process where liquid water turns into water vapor (gas) when heated." },
      { type: "flashcard", subject: "Science", difficulty: "easy", term: "Habitat", definition: "The natural home or environment of an animal, plant, or other organism." },
      { type: "flashcard", subject: "Science", difficulty: "hard", term: "Density", definition: "How much mass is packed into a given volume. Density = mass ÷ volume." },
    ],
    videos: [
      { type: "video", subject: "Science", videoTitle: "The Solar System", videoContent: "Our solar system has 8 planets orbiting the Sun:\n\n1. Mercury - smallest, closest to Sun\n2. Venus - hottest planet, thick atmosphere\n3. Earth - our home, has liquid water\n4. Mars - the Red Planet, has ice caps\n5. Jupiter - largest planet, Great Red Spot\n6. Saturn - famous for its rings\n7. Uranus - tilted on its side\n8. Neptune - farthest, strong winds\n\nThe Sun contains 99.8% of all mass in the solar system! Planets closer to the Sun orbit faster than distant ones." },
      { type: "video", subject: "Science", videoTitle: "States of Matter", videoContent: "Matter exists in three main states:\n\nSOLID: Particles packed tightly, vibrate in place. Fixed shape and volume.\nExamples: ice, wood, metal\n\nLIQUID: Particles close but can slide past each other. Fixed volume, takes shape of container.\nExamples: water, juice, oil\n\nGAS: Particles far apart, move freely. No fixed shape or volume, fills container.\nExamples: air, steam, helium\n\nChanging states:\n• Melting: solid → liquid (add heat)\n• Freezing: liquid → solid (remove heat)\n• Evaporation: liquid → gas (add heat)\n• Condensation: gas → liquid (remove heat)" },
    ]
  },
  {
    subject: "English",
    grades: ["3", "4", "5", "6", "7", "8"],
    quizzes: [
      { type: "quiz", subject: "English", difficulty: "easy", question: "What is a noun?", options: ["An action word", "A describing word", "A person, place, or thing", "A connecting word"], correctAnswer: 2, explanation: "A noun names a person (teacher), place (school), thing (book), or idea (freedom)." },
      { type: "quiz", subject: "English", difficulty: "medium", question: "Which word is an adverb?", options: ["Beautiful", "Quickly", "Happy", "Table"], correctAnswer: 1, explanation: "Adverbs describe how an action is done. 'Quickly' tells us HOW something moves." },
      { type: "quiz", subject: "English", difficulty: "easy", question: "What is the plural of 'mouse'?", options: ["Mouses", "Mousies", "Mice", "Mouse"], correctAnswer: 2, explanation: "'Mouse' has an irregular plural form: 'mice'. Not all nouns add -s or -es." },
      { type: "quiz", subject: "English", difficulty: "easy", question: "Which sentence uses correct punctuation?", options: ["lets go to the park", "Let's go to the park.", "Lets go to the park", "let's go to the park"], correctAnswer: 1, explanation: "Sentences start with capital letters, use apostrophes in contractions (let's), and end with punctuation." },
      { type: "quiz", subject: "English", difficulty: "easy", question: "What is a synonym for 'happy'?", options: ["Sad", "Angry", "Joyful", "Tired"], correctAnswer: 2, explanation: "Synonyms are words with similar meanings. 'Joyful' means very happy." },
      { type: "quiz", subject: "English", difficulty: "medium", question: "What type of sentence asks a question?", options: ["Declarative", "Imperative", "Exclamatory", "Interrogative"], correctAnswer: 3, explanation: "Interrogative sentences ask questions and end with a question mark." },
      { type: "quiz", subject: "English", difficulty: "hard", question: "Which is a compound sentence?", options: ["I went to the store.", "Running fast and jumping high.", "I ran, and she walked.", "The big red ball."], correctAnswer: 2, explanation: "A compound sentence joins two independent clauses with a conjunction (and, but, or)." },
      { type: "quiz", subject: "English", difficulty: "medium", question: "What is an antonym for 'ancient'?", options: ["Old", "Modern", "Historical", "Dusty"], correctAnswer: 1, explanation: "Antonyms are words with opposite meanings. 'Modern' is the opposite of 'ancient'." },
    ],
    flashcards: [
      { type: "flashcard", subject: "English", difficulty: "easy", term: "Verb", definition: "A word that expresses an action (run, write) or a state of being (is, was, seem)." },
      { type: "flashcard", subject: "English", difficulty: "easy", term: "Adjective", definition: "A word that describes or modifies a noun. Example: the TALL building, a RED car." },
      { type: "flashcard", subject: "English", difficulty: "medium", term: "Simile", definition: "A comparison using 'like' or 'as'. Example: 'She runs like the wind.'" },
      { type: "flashcard", subject: "English", difficulty: "medium", term: "Metaphor", definition: "A comparison that says something IS something else (without like/as). Example: 'Time is money.'" },
      { type: "flashcard", subject: "English", difficulty: "hard", term: "Alliteration", definition: "Repetition of the same beginning sound in nearby words. Example: 'Peter Piper picked a peck.'" },
      { type: "flashcard", subject: "English", difficulty: "hard", term: "Onomatopoeia", definition: "A word that sounds like what it describes. Examples: buzz, hiss, crash, meow." },
      { type: "flashcard", subject: "English", difficulty: "hard", term: "Thesis Statement", definition: "The main argument or point of an essay, usually stated in the introduction." },
      { type: "flashcard", subject: "English", difficulty: "medium", term: "Conjunction", definition: "A word that connects words, phrases, or clauses. Examples: and, but, or, because, although." },
    ],
    videos: [
      { type: "video", subject: "English", videoTitle: "Parts of Speech", videoContent: "Every word in English belongs to a category called a 'part of speech':\n\n1. NOUN - person, place, thing, idea (dog, school, love)\n2. VERB - action or state of being (run, is, think)\n3. ADJECTIVE - describes a noun (big, blue, happy)\n4. ADVERB - describes a verb, adjective, or adverb (quickly, very, well)\n5. PRONOUN - replaces a noun (he, she, they, it)\n6. PREPOSITION - shows relationship (in, on, at, between)\n7. CONJUNCTION - connects words/clauses (and, but, or)\n8. INTERJECTION - expresses emotion (wow, ouch, hey)\n\nTip: Find the verb first, then the subject (noun doing the action)!" },
      { type: "video", subject: "English", videoTitle: "Writing a Great Paragraph", videoContent: "Every good paragraph has three parts:\n\n1. TOPIC SENTENCE - States the main idea. This is like a mini-thesis for the paragraph.\n\n2. SUPPORTING SENTENCES - Give details, examples, facts, or explanations that prove or expand on the topic sentence. Use 3-5 supporting sentences.\n\n3. CONCLUDING SENTENCE - Wraps up the paragraph. Can restate the main idea or transition to the next paragraph.\n\nTips:\n• Use transition words: first, also, however, finally\n• Show, don't tell: Instead of 'It was fun,' say 'We laughed until our stomachs hurt.'\n• Stay on topic - every sentence should relate to the main idea" },
    ]
  },
  {
    subject: "History",
    grades: ["4", "5", "6", "7", "8"],
    quizzes: [
      { type: "quiz", subject: "History", difficulty: "easy", question: "In what year did Columbus first reach the Americas?", options: ["1442", "1492", "1502", "1592"], correctAnswer: 1, explanation: "Christopher Columbus reached the Caribbean islands in 1492, sailing from Spain." },
      { type: "quiz", subject: "History", difficulty: "easy", question: "Who was the first President of the United States?", options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"], correctAnswer: 2, explanation: "George Washington served as the first U.S. President from 1789 to 1797." },
      { type: "quiz", subject: "History", difficulty: "medium", question: "What ancient civilization built the pyramids?", options: ["Romans", "Greeks", "Egyptians", "Mayans"], correctAnswer: 2, explanation: "The ancient Egyptians built pyramids as tombs for their pharaohs, starting around 2630 BCE." },
      { type: "quiz", subject: "History", difficulty: "medium", question: "What document begins with 'We the People'?", options: ["Declaration of Independence", "Bill of Rights", "U.S. Constitution", "Magna Carta"], correctAnswer: 2, explanation: "The U.S. Constitution begins with 'We the People of the United States...'" },
      { type: "quiz", subject: "History", difficulty: "hard", question: "Which war was fought between the North and South of the United States?", options: ["World War I", "Revolutionary War", "Civil War", "War of 1812"], correctAnswer: 2, explanation: "The American Civil War (1861-1865) was fought between the Union (North) and Confederacy (South)." },
      { type: "quiz", subject: "History", difficulty: "hard", question: "Who wrote the Declaration of Independence?", options: ["George Washington", "Benjamin Franklin", "Thomas Jefferson", "John Adams"], correctAnswer: 2, explanation: "Thomas Jefferson was the primary author of the Declaration of Independence in 1776." },
    ],
    flashcards: [
      { type: "flashcard", subject: "History", difficulty: "easy", term: "Democracy", definition: "A system of government where citizens vote to make decisions or choose their leaders." },
      { type: "flashcard", subject: "History", difficulty: "medium", term: "Revolution", definition: "A sudden, major change in government or society, often involving force." },
      { type: "flashcard", subject: "History", difficulty: "medium", term: "Constitution", definition: "A document that establishes the fundamental laws and principles of a government." },
      { type: "flashcard", subject: "History", difficulty: "hard", term: "Amendment", definition: "A change or addition to a constitution or law." },
      { type: "flashcard", subject: "History", difficulty: "easy", term: "Colony", definition: "A territory controlled by a foreign country. The 13 American colonies were controlled by Britain." },
      { type: "flashcard", subject: "History", difficulty: "medium", term: "Civilization", definition: "An advanced society with organized government, culture, religion, and technology." },
    ],
    videos: [
      { type: "video", subject: "History", videoTitle: "Ancient Egypt", videoContent: "Ancient Egypt was one of the world's first great civilizations, lasting over 3,000 years!\n\nKey facts:\n• Located along the Nile River in northeast Africa\n• The Nile's annual floods made the soil fertile for farming\n• Built massive pyramids as tombs for pharaohs\n• Developed hieroglyphics (picture writing)\n• Invented papyrus (early paper)\n• Mummified their dead to preserve bodies for the afterlife\n\nFamous pharaohs:\n• Khufu - built the Great Pyramid of Giza\n• Hatshepsut - one of few female pharaohs\n• Tutankhamun - 'King Tut,' whose tomb was found intact in 1922\n• Cleopatra - the last pharaoh before Roman conquest" },
    ]
  },
  {
    subject: "Spanish",
    grades: ["3", "4", "5", "6", "7", "8"],
    quizzes: [
      // Easy — colors, numbers, animals, greetings
      { type: "quiz", subject: "Spanish", difficulty: "easy", question: "What does 'gato' mean in English?", options: ["Dog", "Cat", "Bird", "Fish"], correctAnswer: 1, explanation: "'Gato' means 'cat' in Spanish." },
      { type: "quiz", subject: "Spanish", difficulty: "easy", question: "How do you say 'hello' in Spanish?", options: ["Adiós", "Gracias", "Hola", "Por favor"], correctAnswer: 2, explanation: "'Hola' is the Spanish word for 'hello'." },
      { type: "quiz", subject: "Spanish", difficulty: "easy", question: "What color is 'rojo'?", options: ["Blue", "Green", "Yellow", "Red"], correctAnswer: 3, explanation: "'Rojo' means 'red' in Spanish." },
      { type: "quiz", subject: "Spanish", difficulty: "easy", question: "How do you say the number 5 in Spanish?", options: ["Cuatro", "Cinco", "Seis", "Tres"], correctAnswer: 1, explanation: "The number 5 in Spanish is 'cinco'." },
      { type: "quiz", subject: "Spanish", difficulty: "easy", question: "What does 'perro' mean in English?", options: ["Cat", "Horse", "Dog", "Rabbit"], correctAnswer: 2, explanation: "'Perro' means 'dog' in Spanish." },
      { type: "quiz", subject: "Spanish", difficulty: "easy", question: "How do you say 'thank you' in Spanish?", options: ["De nada", "Gracias", "Lo siento", "Perdón"], correctAnswer: 1, explanation: "'Gracias' means 'thank you' in Spanish." },
      // Medium — food, family, body parts, basic phrases
      { type: "quiz", subject: "Spanish", difficulty: "medium", question: "What does 'manzana' mean in English?", options: ["Banana", "Orange", "Apple", "Grape"], correctAnswer: 2, explanation: "'Manzana' means 'apple' in Spanish." },
      { type: "quiz", subject: "Spanish", difficulty: "medium", question: "How do you say 'mother' in Spanish?", options: ["Padre", "Hermana", "Abuela", "Madre"], correctAnswer: 3, explanation: "'Madre' means 'mother' in Spanish." },
      { type: "quiz", subject: "Spanish", difficulty: "medium", question: "What body part is 'cabeza'?", options: ["Hand", "Foot", "Head", "Arm"], correctAnswer: 2, explanation: "'Cabeza' means 'head' in Spanish." },
      { type: "quiz", subject: "Spanish", difficulty: "medium", question: "What does 'agua' mean?", options: ["Fire", "Water", "Air", "Earth"], correctAnswer: 1, explanation: "'Agua' means 'water' in Spanish." },
      { type: "quiz", subject: "Spanish", difficulty: "medium", question: "How do you say 'I am hungry' in Spanish?", options: ["Tengo sed", "Tengo hambre", "Tengo frío", "Tengo sueño"], correctAnswer: 1, explanation: "'Tengo hambre' means 'I am hungry.' Spanish uses 'tener' (to have) for many feelings." },
      // Hard — complex phrases, verb conjugation, more vocabulary
      { type: "quiz", subject: "Spanish", difficulty: "hard", question: "What is the correct conjugation of 'hablar' (to speak) for 'yo' (I)?", options: ["Hablas", "Habla", "Hablo", "Hablan"], correctAnswer: 2, explanation: "The yo (I) form of 'hablar' is 'hablo'. Regular -ar verbs drop -ar and add -o for yo." },
      { type: "quiz", subject: "Spanish", difficulty: "hard", question: "What does '¿Dónde está la biblioteca?' mean?", options: ["Where is the school?", "Where is the library?", "Where is the store?", "Where is the park?"], correctAnswer: 1, explanation: "'Biblioteca' means 'library', and '¿Dónde está?' means 'Where is?'" },
      { type: "quiz", subject: "Spanish", difficulty: "hard", question: "Which is the correct way to say 'I like to read' in Spanish?", options: ["Me gusta leer", "Yo gusto leer", "Me gusta leo", "Yo gusta leer"], correctAnswer: 0, explanation: "'Me gusta' + infinitive verb is the pattern. 'Me gusta leer' = 'I like to read.'" },
      { type: "quiz", subject: "Spanish", difficulty: "hard", question: "What does 'hermano menor' mean?", options: ["Older brother", "Younger brother", "Older sister", "Younger sister"], correctAnswer: 1, explanation: "'Hermano' means 'brother' and 'menor' means 'younger' or 'smaller'." },
      { type: "quiz", subject: "Spanish", difficulty: "medium", question: "How do you say 'the house' in Spanish?", options: ["El carro", "La casa", "La mesa", "El libro"], correctAnswer: 1, explanation: "'La casa' means 'the house'. 'Casa' is feminine, so it uses 'la'." },
      { type: "quiz", subject: "Spanish", difficulty: "easy", question: "What does 'azul' mean?", options: ["Red", "Green", "Blue", "Yellow"], correctAnswer: 2, explanation: "'Azul' means 'blue' in Spanish." },
    ],
    flashcards: [
      // Easy
      { type: "flashcard", subject: "Spanish", difficulty: "easy", term: "Hola", definition: "Hello — a common greeting used any time of day." },
      { type: "flashcard", subject: "Spanish", difficulty: "easy", term: "Adiós", definition: "Goodbye — used when parting ways." },
      { type: "flashcard", subject: "Spanish", difficulty: "easy", term: "Rojo, Azul, Verde, Amarillo", definition: "Red, Blue, Green, Yellow — the four basic colors in Spanish." },
      { type: "flashcard", subject: "Spanish", difficulty: "easy", term: "Uno, Dos, Tres, Cuatro, Cinco", definition: "One, Two, Three, Four, Five — the first five numbers in Spanish." },
      // Medium
      { type: "flashcard", subject: "Spanish", difficulty: "medium", term: "La Familia", definition: "The Family — madre (mother), padre (father), hermano (brother), hermana (sister), abuelo (grandfather), abuela (grandmother)." },
      { type: "flashcard", subject: "Spanish", difficulty: "medium", term: "Manzana, Leche, Pan, Pollo", definition: "Apple, Milk, Bread, Chicken — common food words in Spanish." },
      { type: "flashcard", subject: "Spanish", difficulty: "medium", term: "Cabeza, Mano, Pie, Brazo", definition: "Head, Hand, Foot, Arm — basic body parts in Spanish." },
      { type: "flashcard", subject: "Spanish", difficulty: "medium", term: "Buenos días / Buenas noches", definition: "Good morning / Good night — time-of-day greetings in Spanish." },
      // Hard
      { type: "flashcard", subject: "Spanish", difficulty: "hard", term: "Ser vs. Estar", definition: "Both mean 'to be'. Ser = permanent traits (Soy alto = I am tall). Estar = temporary states or locations (Estoy cansado = I am tired)." },
      { type: "flashcard", subject: "Spanish", difficulty: "hard", term: "-AR Verb Conjugation (Present)", definition: "Hablar (to speak): yo hablo, tú hablas, él/ella habla, nosotros hablamos, ellos hablan. Drop -ar, add endings." },
      { type: "flashcard", subject: "Spanish", difficulty: "hard", term: "Me gusta / No me gusta", definition: "'I like' / 'I don't like' — used with a noun or infinitive verb. Example: Me gusta bailar (I like to dance)." },
      { type: "flashcard", subject: "Spanish", difficulty: "hard", term: "¿Cómo te llamas?", definition: "'What is your name?' — answered with 'Me llamo...' (My name is...). A key introductory phrase." },
    ],
    videos: [
      { type: "video", subject: "Spanish", videoTitle: "Spanish Greetings & Numbers 1-20", videoContent: "Learn the basics of Spanish greetings and counting!\n\nGreetings:\n• Hola — Hello\n• Buenos días — Good morning\n• Buenas tardes — Good afternoon\n• Buenas noches — Good evening/night\n• Adiós — Goodbye\n• ¿Cómo estás? — How are you?\n• Bien, gracias — Fine, thank you\n• Por favor — Please\n• Gracias — Thank you\n• De nada — You're welcome\n\nNumbers 1-20:\n1=uno, 2=dos, 3=tres, 4=cuatro, 5=cinco, 6=seis, 7=siete, 8=ocho, 9=nueve, 10=diez, 11=once, 12=doce, 13=trece, 14=catorce, 15=quince, 16=dieciséis, 17=diecisiete, 18=dieciocho, 19=diecinueve, 20=veinte\n\nPractice counting objects around you in Spanish!" },
      { type: "video", subject: "Spanish", videoTitle: "Spanish Colors & Common Phrases", videoContent: "Colors (Los Colores):\n• Rojo — Red\n• Azul — Blue\n• Verde — Green\n• Amarillo — Yellow\n• Naranja — Orange\n• Morado — Purple\n• Blanco — White\n• Negro — Black\n• Rosa — Pink\n• Marrón — Brown\n\nUseful Everyday Phrases:\n• ¿Dónde está...? — Where is...?\n• Me llamo... — My name is...\n• Tengo ___ años — I am ___ years old\n• No entiendo — I don't understand\n• ¿Puedo ir al baño? — May I go to the bathroom?\n• ¿Cuánto cuesta? — How much does it cost?\n\nTip: Practice by labeling items in your house with their Spanish names!" },
      { type: "video", subject: "Spanish", videoTitle: "Spanish Vocabulary: Animals, Food & Family", videoContent: "Animals (Los Animales):\n• Perro — Dog\n• Gato — Cat\n• Pájaro — Bird\n• Pez — Fish\n• Caballo — Horse\n• Mariposa — Butterfly\n• Tortuga — Turtle\n• Conejo — Rabbit\n\nFood (La Comida):\n• Manzana — Apple\n• Pan — Bread\n• Leche — Milk\n• Arroz — Rice\n• Pollo — Chicken\n• Queso — Cheese\n• Agua — Water\n\nFamily (La Familia):\n• Madre/Mamá — Mother/Mom\n• Padre/Papá — Father/Dad\n• Hermano/Hermana — Brother/Sister\n• Abuelo/Abuela — Grandfather/Grandmother\n• Tío/Tía — Uncle/Aunt\n• Primo/Prima — Cousin (male/female)\n\nTip: Spanish nouns have gender! Use 'el' for masculine and 'la' for feminine words." },
    ]
  },
  {
    subject: "3-Number Math",
    grades: ["3", "4", "5", "6", "7", "8"],
    quizzes: [
      // Easy — addition only
      { type: "quiz", subject: "3-Number Math", difficulty: "easy", question: "What is 5 + 3 + 7?", options: ["13", "14", "15", "16"], correctAnswer: 2, explanation: "5 + 3 = 8, then 8 + 7 = 15." },
      { type: "quiz", subject: "3-Number Math", difficulty: "easy", question: "What is 2 + 9 + 4?", options: ["13", "14", "15", "16"], correctAnswer: 2, explanation: "2 + 9 = 11, then 11 + 4 = 15." },
      { type: "quiz", subject: "3-Number Math", difficulty: "easy", question: "What is 6 + 6 + 6?", options: ["16", "17", "18", "19"], correctAnswer: 2, explanation: "6 + 6 = 12, then 12 + 6 = 18." },
      { type: "quiz", subject: "3-Number Math", difficulty: "easy", question: "What is 10 + 5 + 3?", options: ["15", "16", "17", "18"], correctAnswer: 3, explanation: "10 + 5 = 15, then 15 + 3 = 18." },
      { type: "quiz", subject: "3-Number Math", difficulty: "easy", question: "What is 8 + 1 + 9?", options: ["16", "17", "18", "19"], correctAnswer: 2, explanation: "8 + 1 = 9, then 9 + 9 = 18." },
      // Medium — mix of addition and subtraction
      { type: "quiz", subject: "3-Number Math", difficulty: "medium", question: "What is 12 - 4 + 6?", options: ["10", "12", "14", "16"], correctAnswer: 2, explanation: "Work left to right: 12 - 4 = 8, then 8 + 6 = 14." },
      { type: "quiz", subject: "3-Number Math", difficulty: "medium", question: "What is 20 - 7 - 5?", options: ["6", "7", "8", "9"], correctAnswer: 2, explanation: "20 - 7 = 13, then 13 - 5 = 8." },
      { type: "quiz", subject: "3-Number Math", difficulty: "medium", question: "What is 15 + 8 - 10?", options: ["11", "12", "13", "14"], correctAnswer: 2, explanation: "15 + 8 = 23, then 23 - 10 = 13." },
      { type: "quiz", subject: "3-Number Math", difficulty: "medium", question: "What is 25 - 12 + 3?", options: ["14", "15", "16", "17"], correctAnswer: 2, explanation: "25 - 12 = 13, then 13 + 3 = 16." },
      { type: "quiz", subject: "3-Number Math", difficulty: "medium", question: "What is 30 - 15 + 7?", options: ["20", "21", "22", "23"], correctAnswer: 2, explanation: "30 - 15 = 15, then 15 + 7 = 22." },
      // Hard — multiplication, division, order of operations
      { type: "quiz", subject: "3-Number Math", difficulty: "hard", question: "What is 8 × 2 - 3?", options: ["10", "11", "13", "16"], correctAnswer: 2, explanation: "Order of operations: multiply first. 8 × 2 = 16, then 16 - 3 = 13." },
      { type: "quiz", subject: "3-Number Math", difficulty: "hard", question: "What is 4 + 3 × 5?", options: ["19", "25", "35", "15"], correctAnswer: 0, explanation: "Order of operations: multiply first. 3 × 5 = 15, then 4 + 15 = 19." },
      { type: "quiz", subject: "3-Number Math", difficulty: "hard", question: "What is 20 ÷ 4 + 7?", options: ["10", "11", "12", "13"], correctAnswer: 2, explanation: "Order of operations: divide first. 20 ÷ 4 = 5, then 5 + 7 = 12." },
      { type: "quiz", subject: "3-Number Math", difficulty: "hard", question: "What is 6 × 3 + 4?", options: ["18", "20", "22", "42"], correctAnswer: 2, explanation: "Order of operations: multiply first. 6 × 3 = 18, then 18 + 4 = 22." },
      { type: "quiz", subject: "3-Number Math", difficulty: "hard", question: "What is 10 - 2 × 3?", options: ["4", "6", "24", "8"], correctAnswer: 0, explanation: "Order of operations: multiply first. 2 × 3 = 6, then 10 - 6 = 4." },
      { type: "quiz", subject: "3-Number Math", difficulty: "hard", question: "What is 18 ÷ 3 + 2 × 4?", options: ["10", "12", "14", "16"], correctAnswer: 2, explanation: "Order of operations: division and multiplication first (left to right). 18 ÷ 3 = 6, 2 × 4 = 8, then 6 + 8 = 14." },
    ],
    flashcards: [
      { type: "flashcard", subject: "3-Number Math", difficulty: "easy", term: "Adding Three Numbers", definition: "Add numbers from left to right. Example: 3 + 5 + 2 = 8 + 2 = 10. Tip: look for pairs that make 10!" },
      { type: "flashcard", subject: "3-Number Math", difficulty: "easy", term: "Commutative Property", definition: "You can add numbers in any order and get the same result. 3 + 5 + 2 = 2 + 3 + 5 = 10." },
      { type: "flashcard", subject: "3-Number Math", difficulty: "medium", term: "Mixed Addition & Subtraction", definition: "Work left to right when you have + and -. Example: 15 - 3 + 8 = 12 + 8 = 20. Don't skip ahead!" },
      { type: "flashcard", subject: "3-Number Math", difficulty: "medium", term: "Grouping Strategy", definition: "Look for numbers that are easy to combine. In 7 + 8 + 3, do 7 + 3 = 10 first, then 10 + 8 = 18." },
      { type: "flashcard", subject: "3-Number Math", difficulty: "hard", term: "PEMDAS / Order of Operations", definition: "Parentheses, Exponents, Multiplication/Division (left to right), Addition/Subtraction (left to right). Always follow this order!" },
      { type: "flashcard", subject: "3-Number Math", difficulty: "hard", term: "Multiplication Before Addition", definition: "In 4 + 3 × 5, do multiplication first: 3 × 5 = 15, then 4 + 15 = 19. NOT (4+3) × 5 = 35." },
      { type: "flashcard", subject: "3-Number Math", difficulty: "hard", term: "Division Before Subtraction", definition: "In 20 - 12 ÷ 4, do division first: 12 ÷ 4 = 3, then 20 - 3 = 17. NOT (20-12) ÷ 4 = 2." },
      { type: "flashcard", subject: "3-Number Math", difficulty: "medium", term: "Checking Your Work", definition: "After solving a multi-step problem, redo it in a different order or use the inverse operation to verify your answer." },
    ],
    videos: [
      { type: "video", subject: "3-Number Math", videoTitle: "Solving Multi-Step Math Problems", videoContent: "When you see a problem with three or more numbers, don't panic! Break it into steps.\n\nAddition problems:\n• 5 + 3 + 7: Do 5 + 3 = 8, then 8 + 7 = 15\n• Tip: Look for numbers that add to 10! In 6 + 8 + 4, do 6 + 4 = 10 first, then 10 + 8 = 18\n\nMixed problems:\n• 15 - 4 + 6: Work left to right. 15 - 4 = 11, then 11 + 6 = 17\n• 20 + 3 - 8: Work left to right. 20 + 3 = 23, then 23 - 8 = 15\n\nWith multiplication (Order of Operations):\n• 4 + 3 × 5: Multiply first! 3 × 5 = 15, then 4 + 15 = 19\n• 8 × 2 - 3: Multiply first! 8 × 2 = 16, then 16 - 3 = 13\n\nAlways write down each step to avoid mistakes!" },
      { type: "video", subject: "3-Number Math", videoTitle: "Understanding Order of Operations", videoContent: "Order of operations tells us WHICH math to do first when there are multiple operations.\n\nThe rule is PEMDAS:\n1. Parentheses — do what's inside ( ) first\n2. Exponents — powers like 2³\n3. Multiplication & Division — left to right\n4. Addition & Subtraction — left to right\n\nExamples:\n• 2 + 3 × 4 = 2 + 12 = 14 (multiply first)\n• (2 + 3) × 4 = 5 × 4 = 20 (parentheses first)\n• 10 - 6 ÷ 2 = 10 - 3 = 7 (divide first)\n• 12 ÷ 3 + 2 × 5 = 4 + 10 = 14 (divide and multiply first, then add)\n\nCommon mistake: Going left to right ignoring the rules!\n3 + 4 × 2 is NOT 14. It IS 11." },
    ]
  }
]

let usedQuizIndices: Record<string, Set<number>> = {}
let usedFlashcardIndices: Record<string, Set<number>> = {}

const MASTERED_KEY = "sc_mastered_questions"

function loadMastered(): Set<string> {
  try {
    const saved = localStorage.getItem(MASTERED_KEY)
    if (saved) return new Set(JSON.parse(saved))
  } catch { /* ignore */ }
  return new Set()
}

function saveMastered(set: Set<string>): void {
  localStorage.setItem(MASTERED_KEY, JSON.stringify([...set]))
}

function questionKey(q: TaggedContent): string {
  return `${q.subject}::${q.question || q.term || ""}`
}

export function markQuestionMastered(subject: string, questionText: string): void {
  const mastered = loadMastered()
  mastered.add(`${subject}::${questionText}`)
  saveMastered(mastered)
}

export function resetUsedContent() {
  usedQuizIndices = {}
  usedFlashcardIndices = {}
}

function getAllowedDifficulties(grade?: string): Difficulty[] {
  if (!grade) return ["easy", "medium", "hard"]
  const g = parseInt(grade, 10)
  if (g <= 4) return ["easy"]
  if (g <= 6) return ["easy", "medium"]
  return ["easy", "medium", "hard"]
}

function filterByDifficulty<T extends TaggedContent>(items: T[], allowed: Difficulty[]): T[] {
  const filtered = items.filter(item => !item.difficulty || allowed.includes(item.difficulty))
  // If filtering removes everything, return all items as fallback
  return filtered.length > 0 ? filtered : items
}

export function getEducationSet(
  subjects: string[],
  grade?: string
): EducationContent[] {
  const activeSubjects = subjects.length > 0
    ? subjects
    : questionBanks.map(b => b.subject)

  const content: EducationContent[] = []
  const allowed = getAllowedDifficulties(grade)

  // Pick a random subject from active ones
  const subjectName = activeSubjects[Math.floor(Math.random() * activeSubjects.length)]
  const bank = questionBanks.find(b => b.subject === subjectName)
  if (!bank) return getDefaultContent()

  // Get a video/lesson
  if (bank.videos.length > 0) {
    content.push(bank.videos[Math.floor(Math.random() * bank.videos.length)])
  }

  // Filter by difficulty and exclude mastered questions
  const mastered = loadMastered()
  const gradeFilteredFlashcards = filterByDifficulty(bank.flashcards, allowed)
  const gradeFilteredQuizzes = filterByDifficulty(bank.quizzes, allowed)

  // Get 3-5 flashcards (flashcards don't get "mastered" — they're review material)
  if (!usedFlashcardIndices[subjectName]) usedFlashcardIndices[subjectName] = new Set()
  const availableFlashcards = gradeFilteredFlashcards
    .map((f, i) => ({ ...f, _idx: i }))
    .filter(f => !usedFlashcardIndices[subjectName].has(f._idx))

  if (availableFlashcards.length === 0) {
    usedFlashcardIndices[subjectName] = new Set()
  }

  const fcPool = availableFlashcards.length > 0 ? availableFlashcards : gradeFilteredFlashcards.map((f, i) => ({ ...f, _idx: i }))
  const fcCount = Math.min(4, fcPool.length)
  const shuffledFC = fcPool
    .sort(() => Math.random() - 0.5)
    .slice(0, fcCount)

  for (const fc of shuffledFC) {
    usedFlashcardIndices[subjectName]?.add(fc._idx)
    content.push({ type: "flashcard", subject: fc.subject, term: fc.term, definition: fc.definition })
  }

  // Get 3-4 quiz questions — skip ones already answered correctly
  if (!usedQuizIndices[subjectName]) usedQuizIndices[subjectName] = new Set()
  const unmasteredQuizzes = gradeFilteredQuizzes.filter(q => !mastered.has(questionKey(q)))
  const quizSource = unmasteredQuizzes.length > 0 ? unmasteredQuizzes : gradeFilteredQuizzes
  const availableQuizzes = quizSource
    .map((q, i) => ({ ...q, _idx: i }))
    .filter(q => !usedQuizIndices[subjectName].has(q._idx))

  if (availableQuizzes.length === 0) {
    usedQuizIndices[subjectName] = new Set()
  }

  const qPool = availableQuizzes.length > 0 ? availableQuizzes : quizSource.map((q, i) => ({ ...q, _idx: i }))
  const qCount = Math.min(3, qPool.length)
  const shuffledQ = qPool
    .sort(() => Math.random() - 0.5)
    .slice(0, qCount)

  for (const q of shuffledQ) {
    usedQuizIndices[subjectName]?.add(q._idx)
    content.push({
      type: "quiz", subject: q.subject, question: q.question,
      options: q.options, correctAnswer: q.correctAnswer, explanation: q.explanation
    })
  }

  return content
}

function getDefaultContent(): EducationContent[] {
  return [
    { type: "video", subject: "General", videoTitle: "Learning is an Adventure!", videoContent: "Every time you learn something new, your brain creates new connections between neurons. The more you practice, the stronger these connections become!\n\nTips for better learning:\n• Take breaks every 25 minutes\n• Explain what you learned to someone else\n• Use drawings and diagrams\n• Connect new ideas to things you already know\n• Get enough sleep — your brain organizes memories while you sleep!" },
    { type: "flashcard", subject: "General", term: "Growth Mindset", definition: "Believing that abilities can be developed through dedication and hard work." },
    { type: "flashcard", subject: "General", term: "Mnemonics", definition: "Memory tricks that help you remember information. Like 'Roy G. Biv' for rainbow colors." },
    { type: "quiz", subject: "General", question: "What helps your brain remember things better?", options: ["Cramming the night before", "Practicing regularly over time", "Only reading once", "Skipping sleep"], correctAnswer: 1, explanation: "Spaced repetition — practicing over time — helps move information into long-term memory." }
  ]
}

export function getAvailableSubjects(): string[] {
  return questionBanks.map(b => b.subject)
}
