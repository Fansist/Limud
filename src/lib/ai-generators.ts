/**
 * AI content generators for demo mode.
 * These produce specialized, detailed content based on subject/grade/topic
 * rather than generic placeholder text.
 */

// ─── QUIZ QUESTION GENERATOR ────────────────────────────────────

const QUIZ_BANKS: Record<string, Record<string, any[]>> = {
  Math: {
    Algebra: [
      { question: 'Solve for x: 3x + 7 = 22', type: 'SHORT_ANSWER', correctAnswer: 'x = 5', explanation: 'Subtract 7 from both sides to get 3x = 15, then divide both sides by 3 to get x = 5.', skill: 'Linear Equations', difficulty: 'EASY' },
      { question: 'What is the slope of the line y = -4x + 9?', type: 'MULTIPLE_CHOICE', options: ['-4', '9', '4', '-9'], correctAnswer: '-4', explanation: 'In slope-intercept form y = mx + b, the coefficient m of x is the slope. Here m = -4.', skill: 'Linear Functions', difficulty: 'EASY' },
      { question: 'Factor the expression: x² - 9', type: 'SHORT_ANSWER', correctAnswer: '(x + 3)(x - 3)', explanation: 'This is a difference of squares: a² - b² = (a + b)(a - b). Here a = x and b = 3.', skill: 'Factoring', difficulty: 'MEDIUM' },
      { question: 'Solve the system: y = 2x + 1 and y = -x + 7', type: 'SHORT_ANSWER', correctAnswer: 'x = 2, y = 5', explanation: 'Set equal: 2x + 1 = -x + 7 → 3x = 6 → x = 2. Then y = 2(2) + 1 = 5.', skill: 'Systems of Equations', difficulty: 'MEDIUM' },
      { question: 'If f(x) = 2x² - 3x + 1, find f(-2)', type: 'MULTIPLE_CHOICE', options: ['15', '11', '-1', '3'], correctAnswer: '15', explanation: 'f(-2) = 2(-2)² - 3(-2) + 1 = 2(4) + 6 + 1 = 8 + 6 + 1 = 15', skill: 'Functions', difficulty: 'MEDIUM' },
      { question: 'Simplify: (2x³)(5x²)', type: 'SHORT_ANSWER', correctAnswer: '10x⁵', explanation: 'Multiply coefficients (2 × 5 = 10) and add exponents (3 + 2 = 5).', skill: 'Exponents', difficulty: 'EASY' },
      { question: 'What are the solutions to x² + 5x + 6 = 0?', type: 'MULTIPLE_CHOICE', options: ['x = -2 and x = -3', 'x = 2 and x = 3', 'x = -1 and x = -6', 'x = 1 and x = 6'], correctAnswer: 'x = -2 and x = -3', explanation: 'Factor: (x + 2)(x + 3) = 0, so x = -2 or x = -3.', skill: 'Quadratic Equations', difficulty: 'MEDIUM' },
      { question: 'Solve: |2x - 6| = 10', type: 'SHORT_ANSWER', correctAnswer: 'x = 8 or x = -2', explanation: '2x - 6 = 10 → x = 8, or 2x - 6 = -10 → x = -2.', skill: 'Absolute Value', difficulty: 'HARD' },
      { question: 'Write the equation of a line passing through (3, 5) with slope 2.', type: 'SHORT_ANSWER', correctAnswer: 'y = 2x - 1', explanation: 'Using point-slope form: y - 5 = 2(x - 3) → y = 2x - 6 + 5 → y = 2x - 1.', skill: 'Linear Equations', difficulty: 'MEDIUM' },
      { question: 'Which graph represents y > 2x - 1?', type: 'MULTIPLE_CHOICE', options: ['Dashed line, shaded above', 'Solid line, shaded above', 'Dashed line, shaded below', 'Solid line, shaded below'], correctAnswer: 'Dashed line, shaded above', explanation: 'The > (not ≥) means a dashed boundary line, and > means shade above the line.', skill: 'Inequalities', difficulty: 'MEDIUM' },
    ],
    Geometry: [
      { question: 'What is the area of a triangle with base 12 cm and height 8 cm?', type: 'MULTIPLE_CHOICE', options: ['48 cm²', '96 cm²', '20 cm²', '24 cm²'], correctAnswer: '48 cm²', explanation: 'Area = ½ × base × height = ½ × 12 × 8 = 48 cm².', skill: 'Area', difficulty: 'EASY' },
      { question: 'Find the hypotenuse of a right triangle with legs 6 and 8.', type: 'SHORT_ANSWER', correctAnswer: '10', explanation: 'By the Pythagorean theorem: c² = 6² + 8² = 36 + 64 = 100, so c = 10.', skill: 'Pythagorean Theorem', difficulty: 'EASY' },
      { question: 'What is the sum of interior angles of a hexagon?', type: 'MULTIPLE_CHOICE', options: ['720°', '540°', '900°', '360°'], correctAnswer: '720°', explanation: 'Sum = (n - 2) × 180° = (6 - 2) × 180° = 4 × 180° = 720°.', skill: 'Polygons', difficulty: 'MEDIUM' },
      { question: 'If two angles are supplementary and one measures 65°, what is the other?', type: 'SHORT_ANSWER', correctAnswer: '115°', explanation: 'Supplementary angles sum to 180°. 180° - 65° = 115°.', skill: 'Angle Relationships', difficulty: 'EASY' },
      { question: 'What is the volume of a cylinder with radius 5 cm and height 10 cm?', type: 'SHORT_ANSWER', correctAnswer: '250π cm³ (≈ 785.4 cm³)', explanation: 'V = πr²h = π(5)²(10) = 250π ≈ 785.4 cm³.', skill: 'Volume', difficulty: 'MEDIUM' },
    ],
    Fractions: [
      { question: 'Add: 2/3 + 1/4', type: 'SHORT_ANSWER', correctAnswer: '11/12', explanation: 'LCD is 12. 2/3 = 8/12 and 1/4 = 3/12. 8/12 + 3/12 = 11/12.', skill: 'Fraction Addition', difficulty: 'EASY' },
      { question: 'Multiply: 3/5 × 2/7', type: 'SHORT_ANSWER', correctAnswer: '6/35', explanation: 'Multiply numerators: 3 × 2 = 6. Multiply denominators: 5 × 7 = 35. Result: 6/35.', skill: 'Fraction Multiplication', difficulty: 'EASY' },
      { question: 'Which fraction is equivalent to 4/6?', type: 'MULTIPLE_CHOICE', options: ['2/3', '3/4', '6/8', '4/8'], correctAnswer: '2/3', explanation: '4/6 simplified: divide both by GCF of 2. 4÷2 / 6÷2 = 2/3.', skill: 'Equivalent Fractions', difficulty: 'EASY' },
      { question: 'Divide: 3/4 ÷ 1/2', type: 'SHORT_ANSWER', correctAnswer: '3/2 or 1 1/2', explanation: 'Keep 3/4, Change ÷ to ×, Flip 1/2 to 2/1. 3/4 × 2/1 = 6/4 = 3/2 = 1 1/2.', skill: 'Fraction Division', difficulty: 'MEDIUM' },
      { question: 'Order from least to greatest: 1/2, 3/8, 5/6', type: 'MULTIPLE_CHOICE', options: ['3/8, 1/2, 5/6', '1/2, 3/8, 5/6', '5/6, 1/2, 3/8', '3/8, 5/6, 1/2'], correctAnswer: '3/8, 1/2, 5/6', explanation: 'Convert to common denominator 24: 12/24, 9/24, 20/24. Order: 9/24, 12/24, 20/24 = 3/8, 1/2, 5/6.', skill: 'Comparing Fractions', difficulty: 'MEDIUM' },
    ],
    _default: [
      { question: 'Evaluate: 15 - 3 × 4 + 2', type: 'MULTIPLE_CHOICE', options: ['5', '50', '14', '3'], correctAnswer: '5', explanation: 'Order of operations: 3 × 4 = 12 first. Then 15 - 12 + 2 = 5.', skill: 'Order of Operations', difficulty: 'EASY' },
      { question: 'What is 25% of 80?', type: 'SHORT_ANSWER', correctAnswer: '20', explanation: '25% = 0.25. 0.25 × 80 = 20.', skill: 'Percentages', difficulty: 'EASY' },
      { question: 'Round 3.847 to the nearest tenth.', type: 'SHORT_ANSWER', correctAnswer: '3.8', explanation: 'Look at hundredths place (4). Since 4 < 5, round down. 3.847 → 3.8.', skill: 'Rounding', difficulty: 'EASY' },
      { question: 'What is the mean of: 12, 15, 18, 21, 24?', type: 'SHORT_ANSWER', correctAnswer: '18', explanation: 'Sum = 12 + 15 + 18 + 21 + 24 = 90. Mean = 90 ÷ 5 = 18.', skill: 'Statistics', difficulty: 'EASY' },
      { question: 'Convert 3/8 to a decimal.', type: 'MULTIPLE_CHOICE', options: ['0.375', '0.38', '0.333', '0.83'], correctAnswer: '0.375', explanation: '3 ÷ 8 = 0.375.', skill: 'Number Conversion', difficulty: 'EASY' },
    ],
  },
  Science: {
    Biology: [
      { question: 'What organelle is responsible for producing energy (ATP) in a cell?', type: 'MULTIPLE_CHOICE', options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi apparatus'], correctAnswer: 'Mitochondria', explanation: 'Mitochondria are the "powerhouses of the cell." They produce ATP through cellular respiration.', skill: 'Cell Biology', difficulty: 'EASY' },
      { question: 'What gas do plants absorb during photosynthesis?', type: 'SHORT_ANSWER', correctAnswer: 'Carbon dioxide (CO₂)', explanation: 'Plants absorb CO₂ from the air through stomata in their leaves, using it with water and sunlight to produce glucose.', skill: 'Photosynthesis', difficulty: 'EASY' },
      { question: 'DNA stands for:', type: 'SHORT_ANSWER', correctAnswer: 'Deoxyribonucleic Acid', explanation: 'DNA (Deoxyribonucleic Acid) is the molecule that carries genetic instructions for the development and function of all living organisms.', skill: 'Genetics', difficulty: 'EASY' },
      { question: 'Which type of cell division produces genetically identical daughter cells?', type: 'MULTIPLE_CHOICE', options: ['Mitosis', 'Meiosis', 'Binary fission', 'Both A and C'], correctAnswer: 'Both A and C', explanation: 'Mitosis produces 2 identical diploid cells (in eukaryotes). Binary fission produces identical cells in prokaryotes. Meiosis produces genetically different haploid cells.', skill: 'Cell Division', difficulty: 'MEDIUM' },
      { question: 'What is the function of the cell membrane?', type: 'MULTIPLE_CHOICE', options: ['Controls what enters and exits the cell', 'Produces energy', 'Stores genetic information', 'Makes proteins'], correctAnswer: 'Controls what enters and exits the cell', explanation: 'The cell membrane is selectively permeable, regulating what substances can enter and leave the cell.', skill: 'Cell Structure', difficulty: 'EASY' },
      { question: 'In a food chain, what role do decomposers play?', type: 'SHORT_ANSWER', correctAnswer: 'They break down dead organisms and waste, returning nutrients to the soil', explanation: 'Decomposers like fungi and bacteria recycle nutrients from dead matter back into the ecosystem, completing the nutrient cycle.', skill: 'Ecology', difficulty: 'MEDIUM' },
    ],
    _default: [
      { question: 'What is the scientific method\'s first step?', type: 'MULTIPLE_CHOICE', options: ['Ask a question / Make an observation', 'Form a hypothesis', 'Conduct an experiment', 'Analyze data'], correctAnswer: 'Ask a question / Make an observation', explanation: 'The scientific method begins with observing something and asking a question about it.', skill: 'Scientific Method', difficulty: 'EASY' },
      { question: 'What is a hypothesis?', type: 'SHORT_ANSWER', correctAnswer: 'A testable prediction or educated guess about the outcome of an experiment', explanation: 'A hypothesis is a proposed explanation based on limited evidence that can be tested through experimentation.', skill: 'Scientific Method', difficulty: 'EASY' },
      { question: 'What is the difference between an independent and dependent variable?', type: 'SHORT_ANSWER', correctAnswer: 'The independent variable is what you change; the dependent variable is what you measure/observe as a result', explanation: 'The independent variable is manipulated by the experimenter. The dependent variable changes in response to the independent variable.', skill: 'Experimental Design', difficulty: 'MEDIUM' },
      { question: 'Water boils at what temperature in Celsius?', type: 'MULTIPLE_CHOICE', options: ['100°C', '212°C', '0°C', '50°C'], correctAnswer: '100°C', explanation: 'At standard atmospheric pressure, water boils at 100°C (212°F).', skill: 'Physical Science', difficulty: 'EASY' },
      { question: 'What type of energy does a moving object have?', type: 'MULTIPLE_CHOICE', options: ['Kinetic energy', 'Potential energy', 'Thermal energy', 'Chemical energy'], correctAnswer: 'Kinetic energy', explanation: 'Kinetic energy is the energy of motion. The faster an object moves, the more kinetic energy it has.', skill: 'Energy', difficulty: 'EASY' },
    ],
  },
  English: {
    _default: [
      { question: 'What is a metaphor?', type: 'MULTIPLE_CHOICE', options: ['A direct comparison without using "like" or "as"', 'A comparison using "like" or "as"', 'An exaggeration for effect', 'Giving human qualities to non-human things'], correctAnswer: 'A direct comparison without using "like" or "as"', explanation: 'A metaphor directly states one thing IS another (e.g., "Time is money"). A simile uses "like" or "as."', skill: 'Literary Devices', difficulty: 'EASY' },
      { question: '"The wind howled through the trees." What literary device is this?', type: 'MULTIPLE_CHOICE', options: ['Personification', 'Simile', 'Alliteration', 'Hyperbole'], correctAnswer: 'Personification', explanation: 'Personification gives human qualities to non-human things. Wind cannot literally "howl" - that\'s a human/animal action.', skill: 'Figurative Language', difficulty: 'EASY' },
      { question: 'What is the climax of a story?', type: 'SHORT_ANSWER', correctAnswer: 'The turning point or moment of highest tension/conflict in the plot', explanation: 'The climax is the most exciting or important moment in a story where the main conflict reaches its peak.', skill: 'Plot Structure', difficulty: 'EASY' },
      { question: 'Identify the type of point of view: "I walked to school, feeling nervous about the test."', type: 'MULTIPLE_CHOICE', options: ['First person', 'Second person', 'Third person limited', 'Third person omniscient'], correctAnswer: 'First person', explanation: 'The use of "I" indicates first-person point of view, where the narrator is a character in the story.', skill: 'Point of View', difficulty: 'EASY' },
      { question: 'What is the difference between theme and topic?', type: 'SHORT_ANSWER', correctAnswer: 'A topic is the subject (e.g., "friendship"). A theme is the message or lesson about that subject (e.g., "True friendship requires sacrifice").', explanation: 'A topic is a single word or phrase. A theme is a complete statement about what the author wants the reader to understand.', skill: 'Theme Analysis', difficulty: 'MEDIUM' },
    ],
  },
  History: {
    _default: [
      { question: 'What is a primary source?', type: 'MULTIPLE_CHOICE', options: ['A firsthand account created during the time period', 'A textbook summary of events', 'An encyclopedia article', 'A documentary film'], correctAnswer: 'A firsthand account created during the time period', explanation: 'Primary sources are original documents, images, or artifacts created during the historical period being studied.', skill: 'Historical Sources', difficulty: 'EASY' },
      { question: 'What year did the Declaration of Independence get signed?', type: 'MULTIPLE_CHOICE', options: ['1776', '1789', '1804', '1812'], correctAnswer: '1776', explanation: 'The Declaration of Independence was adopted by the Continental Congress on July 4, 1776.', skill: 'American History', difficulty: 'EASY' },
      { question: 'What was the main cause of World War I?', type: 'SHORT_ANSWER', correctAnswer: 'A combination of militarism, alliances, imperialism, and nationalism (MAIN), triggered by the assassination of Archduke Franz Ferdinand', explanation: 'The acronym MAIN helps remember the causes: Militarism, Alliances, Imperialism, Nationalism. The assassination was the immediate trigger.', skill: 'World History', difficulty: 'MEDIUM' },
      { question: 'Who wrote "I Have a Dream"?', type: 'MULTIPLE_CHOICE', options: ['Martin Luther King Jr.', 'Malcolm X', 'Rosa Parks', 'John F. Kennedy'], correctAnswer: 'Martin Luther King Jr.', explanation: 'Dr. Martin Luther King Jr. delivered the famous "I Have a Dream" speech during the March on Washington on August 28, 1963.', skill: 'Civil Rights', difficulty: 'EASY' },
      { question: 'What was the significance of the Magna Carta (1215)?', type: 'SHORT_ANSWER', correctAnswer: 'It limited the power of the English king and established that no one, including the king, was above the law. It is considered a foundation of constitutional law.', explanation: 'The Magna Carta established principles of due process and rule of law that influenced later democratic documents including the U.S. Constitution.', skill: 'Government & Law', difficulty: 'MEDIUM' },
    ],
  },
};

export function generateSpecializedQuiz(subject: string, gradeLevel: string, topic: string, questionCount: number, difficulty: string) {
  // Find the best matching question bank
  const subjectBank = QUIZ_BANKS[subject] || QUIZ_BANKS['Math'];
  const topicLower = topic?.toLowerCase() || '';
  
  let questions: any[] = [];
  
  // Try topic match first
  for (const [key, bank] of Object.entries(subjectBank)) {
    if (key === '_default') continue;
    if (topicLower.includes(key.toLowerCase())) {
      questions = [...bank];
      break;
    }
  }
  
  // Fall back to subject default
  if (questions.length === 0) {
    questions = [...(subjectBank['_default'] || QUIZ_BANKS['Math']['_default'])];
  }
  
  // Filter by difficulty if specified
  if (difficulty && difficulty !== 'ALL') {
    const diffFiltered = questions.filter(q => q.difficulty === difficulty);
    if (diffFiltered.length >= 3) questions = diffFiltered;
  }
  
  // Shuffle and take requested count
  const shuffled = questions.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));
  
  // If we need more questions than we have, generate variations
  while (selected.length < questionCount) {
    const base = questions[selected.length % questions.length];
    selected.push({
      ...base,
      question: `(${selected.length + 1}) ${base.question}`,
    });
  }
  
  return selected;
}
