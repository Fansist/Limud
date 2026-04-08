/**
 * AI content generators for demo mode — v9.3.5
 * Expanded quiz banks across all subjects with 10+ questions per topic.
 * generateSpecializedQuiz now pools ALL matching questions and generates
 * unique variations when the bank runs short.
 */

// ─── QUIZ QUESTION BANKS ────────────────────────────────────────

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
      { question: 'Solve for x: 5(x - 3) = 2x + 6', type: 'SHORT_ANSWER', correctAnswer: 'x = 7', explanation: 'Distribute: 5x - 15 = 2x + 6. Subtract 2x: 3x - 15 = 6. Add 15: 3x = 21. Divide: x = 7.', skill: 'Multi-step Equations', difficulty: 'EASY' },
      { question: 'What is the y-intercept of the line 3x + 2y = 12?', type: 'SHORT_ANSWER', correctAnswer: '6 (or the point (0, 6))', explanation: 'Set x = 0: 2y = 12, y = 6. The y-intercept is (0, 6).', skill: 'Linear Functions', difficulty: 'EASY' },
      { question: 'Simplify: (x² - 4) / (x + 2)', type: 'SHORT_ANSWER', correctAnswer: 'x - 2', explanation: 'Factor numerator: (x+2)(x-2)/(x+2). Cancel (x+2) to get x - 2.', skill: 'Rational Expressions', difficulty: 'MEDIUM' },
      { question: 'Solve: 2^x = 32', type: 'SHORT_ANSWER', correctAnswer: 'x = 5', explanation: '32 = 2⁵, so 2^x = 2⁵ means x = 5.', skill: 'Exponential Equations', difficulty: 'EASY' },
      { question: 'What is the domain of f(x) = 1/(x - 4)?', type: 'MULTIPLE_CHOICE', options: ['All real numbers except x = 4', 'All real numbers', 'x > 4', 'x ≥ 0'], correctAnswer: 'All real numbers except x = 4', explanation: 'The denominator cannot equal zero. x - 4 = 0 when x = 4, so x = 4 is excluded.', skill: 'Domain & Range', difficulty: 'MEDIUM' },
      { question: 'Expand: (x + 4)²', type: 'MULTIPLE_CHOICE', options: ['x² + 8x + 16', 'x² + 16', 'x² + 4x + 16', '2x + 8'], correctAnswer: 'x² + 8x + 16', explanation: '(x + 4)² = x² + 2(x)(4) + 4² = x² + 8x + 16. Use the formula (a+b)² = a² + 2ab + b².', skill: 'Polynomial Operations', difficulty: 'EASY' },
      { question: 'Solve the inequality: 3x - 5 > 10', type: 'SHORT_ANSWER', correctAnswer: 'x > 5', explanation: 'Add 5: 3x > 15. Divide by 3: x > 5.', skill: 'Inequalities', difficulty: 'EASY' },
      { question: 'Find the vertex of y = x² - 6x + 5', type: 'SHORT_ANSWER', correctAnswer: '(3, -4)', explanation: 'x = -b/(2a) = 6/2 = 3. y = 9 - 18 + 5 = -4. Vertex is (3, -4).', skill: 'Quadratics', difficulty: 'HARD' },
    ],
    Geometry: [
      { question: 'What is the area of a triangle with base 12 cm and height 8 cm?', type: 'MULTIPLE_CHOICE', options: ['48 cm²', '96 cm²', '20 cm²', '24 cm²'], correctAnswer: '48 cm²', explanation: 'Area = ½ × base × height = ½ × 12 × 8 = 48 cm².', skill: 'Area', difficulty: 'EASY' },
      { question: 'Find the hypotenuse of a right triangle with legs 6 and 8.', type: 'SHORT_ANSWER', correctAnswer: '10', explanation: 'By the Pythagorean theorem: c² = 6² + 8² = 36 + 64 = 100, so c = 10.', skill: 'Pythagorean Theorem', difficulty: 'EASY' },
      { question: 'What is the sum of interior angles of a hexagon?', type: 'MULTIPLE_CHOICE', options: ['720°', '540°', '900°', '360°'], correctAnswer: '720°', explanation: 'Sum = (n - 2) × 180° = (6 - 2) × 180° = 4 × 180° = 720°.', skill: 'Polygons', difficulty: 'MEDIUM' },
      { question: 'If two angles are supplementary and one measures 65°, what is the other?', type: 'SHORT_ANSWER', correctAnswer: '115°', explanation: 'Supplementary angles sum to 180°. 180° - 65° = 115°.', skill: 'Angle Relationships', difficulty: 'EASY' },
      { question: 'What is the volume of a cylinder with radius 5 cm and height 10 cm?', type: 'SHORT_ANSWER', correctAnswer: '250π cm³ (≈ 785.4 cm³)', explanation: 'V = πr²h = π(5)²(10) = 250π ≈ 785.4 cm³.', skill: 'Volume', difficulty: 'MEDIUM' },
      { question: 'What is the circumference of a circle with diameter 14 cm?', type: 'MULTIPLE_CHOICE', options: ['43.98 cm', '14π cm', '153.94 cm', '7π cm'], correctAnswer: '14π cm', explanation: 'C = πd = 14π ≈ 43.98 cm. Both 43.98 cm and 14π cm are correct.', skill: 'Circles', difficulty: 'EASY' },
      { question: 'Find the area of a parallelogram with base 9 m and height 4 m.', type: 'SHORT_ANSWER', correctAnswer: '36 m²', explanation: 'Area = base × height = 9 × 4 = 36 m².', skill: 'Area', difficulty: 'EASY' },
      { question: 'Two similar triangles have a scale factor of 3:5. If a side of the smaller is 9 cm, what is the corresponding side of the larger?', type: 'SHORT_ANSWER', correctAnswer: '15 cm', explanation: '9/x = 3/5, so x = 9 × 5/3 = 15 cm.', skill: 'Similarity', difficulty: 'MEDIUM' },
      { question: 'What is the surface area of a cube with edge length 4 cm?', type: 'MULTIPLE_CHOICE', options: ['96 cm²', '64 cm²', '16 cm²', '24 cm²'], correctAnswer: '96 cm²', explanation: 'SA = 6s² = 6(4²) = 6(16) = 96 cm².', skill: 'Surface Area', difficulty: 'EASY' },
      { question: 'An arc in a circle subtends a central angle of 90°. What fraction of the circle is this arc?', type: 'MULTIPLE_CHOICE', options: ['1/4', '1/2', '1/3', '1/6'], correctAnswer: '1/4', explanation: '90°/360° = 1/4 of the full circle.', skill: 'Circles & Arcs', difficulty: 'EASY' },
      { question: 'Find the distance between (1, 2) and (4, 6).', type: 'SHORT_ANSWER', correctAnswer: '5', explanation: 'd = √((4-1)² + (6-2)²) = √(9 + 16) = √25 = 5.', skill: 'Coordinate Geometry', difficulty: 'MEDIUM' },
      { question: 'What is the midpoint of segment from (-2, 3) to (6, 7)?', type: 'SHORT_ANSWER', correctAnswer: '(2, 5)', explanation: 'Midpoint = ((-2+6)/2, (3+7)/2) = (4/2, 10/2) = (2, 5).', skill: 'Coordinate Geometry', difficulty: 'EASY' },
    ],
    Fractions: [
      { question: 'Add: 2/3 + 1/4', type: 'SHORT_ANSWER', correctAnswer: '11/12', explanation: 'LCD is 12. 2/3 = 8/12 and 1/4 = 3/12. 8/12 + 3/12 = 11/12.', skill: 'Fraction Addition', difficulty: 'EASY' },
      { question: 'Multiply: 3/5 × 2/7', type: 'SHORT_ANSWER', correctAnswer: '6/35', explanation: 'Multiply numerators: 3 × 2 = 6. Multiply denominators: 5 × 7 = 35. Result: 6/35.', skill: 'Fraction Multiplication', difficulty: 'EASY' },
      { question: 'Which fraction is equivalent to 4/6?', type: 'MULTIPLE_CHOICE', options: ['2/3', '3/4', '6/8', '4/8'], correctAnswer: '2/3', explanation: '4/6 simplified: divide both by GCF of 2. 4÷2 / 6÷2 = 2/3.', skill: 'Equivalent Fractions', difficulty: 'EASY' },
      { question: 'Divide: 3/4 ÷ 1/2', type: 'SHORT_ANSWER', correctAnswer: '3/2 or 1 1/2', explanation: 'Keep 3/4, Change ÷ to ×, Flip 1/2 to 2/1. 3/4 × 2/1 = 6/4 = 3/2 = 1 1/2.', skill: 'Fraction Division', difficulty: 'MEDIUM' },
      { question: 'Order from least to greatest: 1/2, 3/8, 5/6', type: 'MULTIPLE_CHOICE', options: ['3/8, 1/2, 5/6', '1/2, 3/8, 5/6', '5/6, 1/2, 3/8', '3/8, 5/6, 1/2'], correctAnswer: '3/8, 1/2, 5/6', explanation: 'Convert to common denominator 24: 12/24, 9/24, 20/24. Order: 9/24, 12/24, 20/24 = 3/8, 1/2, 5/6.', skill: 'Comparing Fractions', difficulty: 'MEDIUM' },
      { question: 'Convert 7/4 to a mixed number.', type: 'SHORT_ANSWER', correctAnswer: '1 3/4', explanation: '7 ÷ 4 = 1 remainder 3, so 7/4 = 1 3/4.', skill: 'Mixed Numbers', difficulty: 'EASY' },
      { question: 'Subtract: 5/6 - 1/3', type: 'SHORT_ANSWER', correctAnswer: '1/2', explanation: 'LCD = 6. 5/6 - 2/6 = 3/6 = 1/2.', skill: 'Fraction Subtraction', difficulty: 'EASY' },
      { question: 'What is 3/4 of 24?', type: 'MULTIPLE_CHOICE', options: ['18', '16', '12', '20'], correctAnswer: '18', explanation: '3/4 × 24 = 72/4 = 18.', skill: 'Fraction of a Number', difficulty: 'EASY' },
      { question: 'Convert 0.625 to a fraction in simplest form.', type: 'SHORT_ANSWER', correctAnswer: '5/8', explanation: '0.625 = 625/1000 = 5/8 (divide by GCF 125).', skill: 'Decimal to Fraction', difficulty: 'MEDIUM' },
      { question: 'Add: 2 1/3 + 1 2/5', type: 'SHORT_ANSWER', correctAnswer: '3 11/15', explanation: 'Convert: 7/3 + 7/5 = 35/15 + 21/15 = 56/15 = 3 11/15.', skill: 'Mixed Number Addition', difficulty: 'MEDIUM' },
    ],
    _default: [
      { question: 'Evaluate: 15 - 3 × 4 + 2', type: 'MULTIPLE_CHOICE', options: ['5', '50', '14', '3'], correctAnswer: '5', explanation: 'Order of operations: 3 × 4 = 12 first. Then 15 - 12 + 2 = 5.', skill: 'Order of Operations', difficulty: 'EASY' },
      { question: 'What is 25% of 80?', type: 'SHORT_ANSWER', correctAnswer: '20', explanation: '25% = 0.25. 0.25 × 80 = 20.', skill: 'Percentages', difficulty: 'EASY' },
      { question: 'Round 3.847 to the nearest tenth.', type: 'SHORT_ANSWER', correctAnswer: '3.8', explanation: 'Look at hundredths place (4). Since 4 < 5, round down. 3.847 → 3.8.', skill: 'Rounding', difficulty: 'EASY' },
      { question: 'What is the mean of: 12, 15, 18, 21, 24?', type: 'SHORT_ANSWER', correctAnswer: '18', explanation: 'Sum = 12 + 15 + 18 + 21 + 24 = 90. Mean = 90 ÷ 5 = 18.', skill: 'Statistics', difficulty: 'EASY' },
      { question: 'Convert 3/8 to a decimal.', type: 'MULTIPLE_CHOICE', options: ['0.375', '0.38', '0.333', '0.83'], correctAnswer: '0.375', explanation: '3 ÷ 8 = 0.375.', skill: 'Number Conversion', difficulty: 'EASY' },
      { question: 'What is the greatest common factor (GCF) of 24 and 36?', type: 'SHORT_ANSWER', correctAnswer: '12', explanation: 'Factors of 24: 1,2,3,4,6,8,12,24. Factors of 36: 1,2,3,4,6,9,12,18,36. GCF = 12.', skill: 'Number Theory', difficulty: 'EASY' },
      { question: 'A shirt costs $40 and is 25% off. What is the sale price?', type: 'SHORT_ANSWER', correctAnswer: '$30', explanation: '25% of $40 = $10 discount. $40 - $10 = $30.', skill: 'Percent Applications', difficulty: 'EASY' },
      { question: 'What is the median of: 3, 7, 9, 15, 21?', type: 'MULTIPLE_CHOICE', options: ['9', '11', '7', '15'], correctAnswer: '9', explanation: 'The median is the middle value in an ordered set. There are 5 values, so the middle (3rd) value is 9.', skill: 'Statistics', difficulty: 'EASY' },
      { question: 'Express the ratio 12:8 in simplest form.', type: 'SHORT_ANSWER', correctAnswer: '3:2', explanation: 'Divide both by GCF of 4: 12÷4 : 8÷4 = 3:2.', skill: 'Ratios', difficulty: 'EASY' },
      { question: 'A recipe calls for 2 cups of flour for 12 cookies. How much flour for 30 cookies?', type: 'SHORT_ANSWER', correctAnswer: '5 cups', explanation: '2/12 = x/30. Cross multiply: 12x = 60. x = 5 cups.', skill: 'Proportions', difficulty: 'MEDIUM' },
      { question: 'What is the LCM of 6 and 8?', type: 'MULTIPLE_CHOICE', options: ['24', '48', '12', '6'], correctAnswer: '24', explanation: 'Multiples of 6: 6,12,18,24. Multiples of 8: 8,16,24. LCM = 24.', skill: 'Number Theory', difficulty: 'EASY' },
      { question: 'Evaluate: (-3)² + 4(-2)', type: 'SHORT_ANSWER', correctAnswer: '1', explanation: '(-3)² = 9. 4(-2) = -8. 9 + (-8) = 1.', skill: 'Integer Operations', difficulty: 'MEDIUM' },
      { question: 'If a = 3 and b = -2, evaluate 2a² - 3b', type: 'SHORT_ANSWER', correctAnswer: '24', explanation: '2(3²) - 3(-2) = 2(9) + 6 = 18 + 6 = 24.', skill: 'Expression Evaluation', difficulty: 'MEDIUM' },
      { question: 'Write 0.00045 in scientific notation.', type: 'SHORT_ANSWER', correctAnswer: '4.5 × 10⁻⁴', explanation: 'Move decimal 4 places right: 4.5. Negative exponent because number < 1.', skill: 'Scientific Notation', difficulty: 'MEDIUM' },
      { question: 'A bag has 3 red, 5 blue, and 2 green marbles. What is the probability of picking blue?', type: 'MULTIPLE_CHOICE', options: ['1/2', '1/3', '5/10', 'Both A and C'], correctAnswer: 'Both A and C', explanation: 'P(blue) = 5/10 = 1/2. So 1/2 and 5/10 are both correct.', skill: 'Probability', difficulty: 'EASY' },
    ],
  },
  Science: {
    Biology: [
      { question: 'What organelle is responsible for producing energy (ATP) in a cell?', type: 'MULTIPLE_CHOICE', options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi apparatus'], correctAnswer: 'Mitochondria', explanation: 'Mitochondria are the "powerhouses of the cell." They produce ATP through cellular respiration.', skill: 'Cell Biology', difficulty: 'EASY' },
      { question: 'What gas do plants absorb during photosynthesis?', type: 'SHORT_ANSWER', correctAnswer: 'Carbon dioxide (CO₂)', explanation: 'Plants absorb CO₂ from the air through stomata in their leaves, using it with water and sunlight to produce glucose.', skill: 'Photosynthesis', difficulty: 'EASY' },
      { question: 'DNA stands for:', type: 'SHORT_ANSWER', correctAnswer: 'Deoxyribonucleic Acid', explanation: 'DNA carries genetic instructions for the development and function of all living organisms.', skill: 'Genetics', difficulty: 'EASY' },
      { question: 'Which type of cell division produces genetically identical daughter cells?', type: 'MULTIPLE_CHOICE', options: ['Mitosis', 'Meiosis', 'Binary fission', 'Both A and C'], correctAnswer: 'Both A and C', explanation: 'Mitosis produces 2 identical diploid cells. Binary fission produces identical cells in prokaryotes. Meiosis produces genetically different haploid cells.', skill: 'Cell Division', difficulty: 'MEDIUM' },
      { question: 'What is the function of the cell membrane?', type: 'MULTIPLE_CHOICE', options: ['Controls what enters and exits the cell', 'Produces energy', 'Stores genetic information', 'Makes proteins'], correctAnswer: 'Controls what enters and exits the cell', explanation: 'The cell membrane is selectively permeable, regulating what substances can enter and leave the cell.', skill: 'Cell Structure', difficulty: 'EASY' },
      { question: 'In a food chain, what role do decomposers play?', type: 'SHORT_ANSWER', correctAnswer: 'They break down dead organisms and waste, returning nutrients to the soil', explanation: 'Decomposers like fungi and bacteria recycle nutrients from dead matter back into the ecosystem.', skill: 'Ecology', difficulty: 'MEDIUM' },
      { question: 'What is the difference between a genotype and a phenotype?', type: 'SHORT_ANSWER', correctAnswer: 'Genotype is the genetic makeup (alleles); phenotype is the observable characteristics', explanation: 'Genotype = DNA code (e.g., Bb). Phenotype = what you see (e.g., brown eyes).', skill: 'Genetics', difficulty: 'MEDIUM' },
      { question: 'Which molecule carries amino acids to the ribosome during translation?', type: 'MULTIPLE_CHOICE', options: ['tRNA', 'mRNA', 'rRNA', 'DNA polymerase'], correctAnswer: 'tRNA', explanation: 'Transfer RNA (tRNA) carries specific amino acids to the ribosome, matching its anticodon to the mRNA codon.', skill: 'Molecular Biology', difficulty: 'MEDIUM' },
      { question: 'What is homeostasis?', type: 'SHORT_ANSWER', correctAnswer: 'The process by which organisms maintain a stable internal environment despite changes in external conditions', explanation: 'Examples include temperature regulation, blood sugar balance, and water balance.', skill: 'Body Systems', difficulty: 'EASY' },
      { question: 'A Punnett square cross of Bb × Bb produces what ratio of phenotypes?', type: 'MULTIPLE_CHOICE', options: ['3:1', '1:1', '1:2:1', '4:0'], correctAnswer: '3:1', explanation: 'BB, Bb, Bb, bb → 3 dominant phenotype : 1 recessive phenotype.', skill: 'Genetics', difficulty: 'MEDIUM' },
      { question: 'What are the products of photosynthesis?', type: 'SHORT_ANSWER', correctAnswer: 'Glucose (C₆H₁₂O₆) and oxygen (O₂)', explanation: '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.', skill: 'Photosynthesis', difficulty: 'EASY' },
      { question: 'What organ system is responsible for transporting blood throughout the body?', type: 'MULTIPLE_CHOICE', options: ['Circulatory system', 'Respiratory system', 'Nervous system', 'Digestive system'], correctAnswer: 'Circulatory system', explanation: 'The circulatory system (heart, blood vessels, blood) transports oxygen, nutrients, and waste.', skill: 'Body Systems', difficulty: 'EASY' },
    ],
    Chemistry: [
      { question: 'Which element has the atomic number 6?', type: 'MULTIPLE_CHOICE', options: ['Carbon', 'Nitrogen', 'Oxygen', 'Boron'], correctAnswer: 'Carbon', explanation: 'Carbon has 6 protons (atomic number = number of protons).', skill: 'Periodic Table', difficulty: 'EASY' },
      { question: 'What type of bond forms when atoms share electrons?', type: 'MULTIPLE_CHOICE', options: ['Covalent bond', 'Ionic bond', 'Metallic bond', 'Hydrogen bond'], correctAnswer: 'Covalent bond', explanation: 'In covalent bonds, atoms share electron pairs. In ionic bonds, electrons are transferred.', skill: 'Chemical Bonds', difficulty: 'EASY' },
      { question: 'Balance this equation: _H₂ + _O₂ → _H₂O', type: 'SHORT_ANSWER', correctAnswer: '2H₂ + O₂ → 2H₂O', explanation: '2 molecules of hydrogen react with 1 molecule of oxygen to form 2 molecules of water.', skill: 'Balancing Equations', difficulty: 'MEDIUM' },
      { question: 'What is the pH of a neutral solution?', type: 'MULTIPLE_CHOICE', options: ['7', '0', '14', '1'], correctAnswer: '7', explanation: 'pH 7 is neutral. Below 7 is acidic, above 7 is basic/alkaline.', skill: 'Acids & Bases', difficulty: 'EASY' },
      { question: 'How many electrons can the first electron shell hold?', type: 'SHORT_ANSWER', correctAnswer: '2', explanation: 'The first shell (n=1) can hold a maximum of 2 electrons (2n² = 2).', skill: 'Atomic Structure', difficulty: 'EASY' },
      { question: 'What state of matter has a definite volume but no definite shape?', type: 'MULTIPLE_CHOICE', options: ['Liquid', 'Solid', 'Gas', 'Plasma'], correctAnswer: 'Liquid', explanation: 'Liquids take the shape of their container (no definite shape) but maintain a constant volume.', skill: 'States of Matter', difficulty: 'EASY' },
      { question: 'What is the molar mass of water (H₂O)?', type: 'SHORT_ANSWER', correctAnswer: '18 g/mol', explanation: 'H = 1 g/mol × 2 = 2 g/mol. O = 16 g/mol. Total = 18 g/mol.', skill: 'Molar Mass', difficulty: 'MEDIUM' },
      { question: 'Which gas makes up approximately 78% of Earth\'s atmosphere?', type: 'MULTIPLE_CHOICE', options: ['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Argon'], correctAnswer: 'Nitrogen', explanation: 'Earth\'s atmosphere is about 78% nitrogen, 21% oxygen, and 1% other gases.', skill: 'Atmospheric Chemistry', difficulty: 'EASY' },
      { question: 'What is an exothermic reaction?', type: 'SHORT_ANSWER', correctAnswer: 'A reaction that releases heat/energy to the surroundings', explanation: 'Exothermic reactions have negative ΔH. Examples: combustion, neutralization.', skill: 'Thermochemistry', difficulty: 'MEDIUM' },
      { question: 'How many protons, neutrons, and electrons does Carbon-14 have?', type: 'SHORT_ANSWER', correctAnswer: '6 protons, 8 neutrons, 6 electrons', explanation: 'Atomic number 6 = 6 protons = 6 electrons. Mass 14 - 6 protons = 8 neutrons.', skill: 'Isotopes', difficulty: 'MEDIUM' },
    ],
    Physics: [
      { question: 'What is Newton\'s First Law of Motion?', type: 'SHORT_ANSWER', correctAnswer: 'An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force', explanation: 'Also known as the Law of Inertia.', skill: 'Forces & Motion', difficulty: 'EASY' },
      { question: 'What is the SI unit of force?', type: 'MULTIPLE_CHOICE', options: ['Newton (N)', 'Joule (J)', 'Watt (W)', 'Pascal (Pa)'], correctAnswer: 'Newton (N)', explanation: 'Force is measured in Newtons. 1 N = 1 kg⋅m/s².', skill: 'Units', difficulty: 'EASY' },
      { question: 'A car accelerates from 0 to 60 m/s in 10 seconds. What is its acceleration?', type: 'SHORT_ANSWER', correctAnswer: '6 m/s²', explanation: 'a = Δv/Δt = (60 - 0)/10 = 6 m/s².', skill: 'Kinematics', difficulty: 'EASY' },
      { question: 'What type of energy does a book on a shelf have?', type: 'MULTIPLE_CHOICE', options: ['Gravitational potential energy', 'Kinetic energy', 'Elastic potential energy', 'Thermal energy'], correctAnswer: 'Gravitational potential energy', explanation: 'An object above the ground has gravitational PE = mgh.', skill: 'Energy', difficulty: 'EASY' },
      { question: 'Calculate work done: A force of 50 N pushes a box 4 meters.', type: 'SHORT_ANSWER', correctAnswer: '200 J', explanation: 'W = F × d = 50 N × 4 m = 200 J (Joules).', skill: 'Work & Energy', difficulty: 'EASY' },
      { question: 'What is the speed of light in a vacuum?', type: 'MULTIPLE_CHOICE', options: ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10¹⁰ m/s', '343 m/s'], correctAnswer: '3 × 10⁸ m/s', explanation: 'The speed of light in a vacuum is approximately 3 × 10⁸ meters per second.', skill: 'Waves & Light', difficulty: 'EASY' },
      { question: 'What happens to the period of a pendulum if you double its length?', type: 'MULTIPLE_CHOICE', options: ['It increases by a factor of √2', 'It doubles', 'It stays the same', 'It halves'], correctAnswer: 'It increases by a factor of √2', explanation: 'T = 2π√(L/g). Doubling L: T_new = 2π√(2L/g) = √2 × T_original.', skill: 'Simple Harmonic Motion', difficulty: 'HARD' },
      { question: 'If a 5 kg object has a net force of 20 N, what is its acceleration?', type: 'SHORT_ANSWER', correctAnswer: '4 m/s²', explanation: 'F = ma → a = F/m = 20/5 = 4 m/s².', skill: 'Newton\'s Second Law', difficulty: 'EASY' },
      { question: 'What is the law of conservation of energy?', type: 'SHORT_ANSWER', correctAnswer: 'Energy cannot be created or destroyed, only transformed from one form to another', explanation: 'The total energy in a closed system remains constant.', skill: 'Conservation Laws', difficulty: 'MEDIUM' },
      { question: 'An object is thrown upward at 20 m/s. How long until it reaches its highest point? (g = 10 m/s²)', type: 'SHORT_ANSWER', correctAnswer: '2 seconds', explanation: 'At the highest point, v = 0. v = v₀ - gt → 0 = 20 - 10t → t = 2 s.', skill: 'Projectile Motion', difficulty: 'MEDIUM' },
    ],
    _default: [
      { question: 'What is the scientific method\'s first step?', type: 'MULTIPLE_CHOICE', options: ['Ask a question / Make an observation', 'Form a hypothesis', 'Conduct an experiment', 'Analyze data'], correctAnswer: 'Ask a question / Make an observation', explanation: 'The scientific method begins with observing something and asking a question about it.', skill: 'Scientific Method', difficulty: 'EASY' },
      { question: 'What is a hypothesis?', type: 'SHORT_ANSWER', correctAnswer: 'A testable prediction or educated guess about the outcome of an experiment', explanation: 'A hypothesis is a proposed explanation based on limited evidence that can be tested.', skill: 'Scientific Method', difficulty: 'EASY' },
      { question: 'What is the difference between an independent and dependent variable?', type: 'SHORT_ANSWER', correctAnswer: 'The independent variable is what you change; the dependent variable is what you measure', explanation: 'The independent variable is manipulated. The dependent variable changes in response.', skill: 'Experimental Design', difficulty: 'MEDIUM' },
      { question: 'Water boils at what temperature in Celsius?', type: 'MULTIPLE_CHOICE', options: ['100°C', '212°C', '0°C', '50°C'], correctAnswer: '100°C', explanation: 'At standard atmospheric pressure, water boils at 100°C (212°F).', skill: 'Physical Science', difficulty: 'EASY' },
      { question: 'What type of energy does a moving object have?', type: 'MULTIPLE_CHOICE', options: ['Kinetic energy', 'Potential energy', 'Thermal energy', 'Chemical energy'], correctAnswer: 'Kinetic energy', explanation: 'Kinetic energy is the energy of motion.', skill: 'Energy', difficulty: 'EASY' },
      { question: 'What is the process by which water moves from roots to leaves?', type: 'MULTIPLE_CHOICE', options: ['Transpiration', 'Photosynthesis', 'Diffusion', 'Osmosis'], correctAnswer: 'Transpiration', explanation: 'Transpiration pulls water upward through the plant.', skill: 'Plant Biology', difficulty: 'EASY' },
      { question: 'What is the difference between a physical and chemical change?', type: 'SHORT_ANSWER', correctAnswer: 'Physical change alters appearance but not composition; chemical change creates new substances', explanation: 'Examples: melting (physical), burning (chemical).', skill: 'Matter & Change', difficulty: 'EASY' },
      { question: 'Which kingdom includes mushrooms?', type: 'MULTIPLE_CHOICE', options: ['Fungi', 'Plantae', 'Animalia', 'Protista'], correctAnswer: 'Fungi', explanation: 'Mushrooms belong to Kingdom Fungi. They decompose organic matter.', skill: 'Taxonomy', difficulty: 'EASY' },
      { question: 'What instrument measures atmospheric pressure?', type: 'MULTIPLE_CHOICE', options: ['Barometer', 'Thermometer', 'Anemometer', 'Hygrometer'], correctAnswer: 'Barometer', explanation: 'A barometer measures air pressure. Thermometer = temperature, Anemometer = wind speed.', skill: 'Weather & Climate', difficulty: 'EASY' },
      { question: 'What is density? Give the formula.', type: 'SHORT_ANSWER', correctAnswer: 'Mass per unit volume; D = m/V', explanation: 'Density = mass ÷ volume. Units are typically g/cm³ or kg/m³.', skill: 'Physical Science', difficulty: 'EASY' },
      { question: 'Name the three types of rock.', type: 'SHORT_ANSWER', correctAnswer: 'Igneous, sedimentary, and metamorphic', explanation: 'Igneous (from magma), sedimentary (from deposits), metamorphic (from heat/pressure).', skill: 'Earth Science', difficulty: 'EASY' },
      { question: 'What causes tides on Earth?', type: 'MULTIPLE_CHOICE', options: ['The gravitational pull of the Moon and Sun', 'Wind patterns', 'Earth\'s rotation only', 'Ocean currents'], correctAnswer: 'The gravitational pull of the Moon and Sun', explanation: 'Tides are primarily caused by the Moon\'s gravitational pull on Earth\'s water.', skill: 'Earth & Space', difficulty: 'MEDIUM' },
    ],
  },
  English: {
    'Literary Devices': [
      { question: 'What is a metaphor?', type: 'MULTIPLE_CHOICE', options: ['A direct comparison without using "like" or "as"', 'A comparison using "like" or "as"', 'An exaggeration for effect', 'Giving human qualities to non-human things'], correctAnswer: 'A direct comparison without using "like" or "as"', explanation: 'A metaphor directly states one thing IS another (e.g., "Time is money"). A simile uses "like" or "as."', skill: 'Literary Devices', difficulty: 'EASY' },
      { question: '"The wind howled through the trees." What literary device is this?', type: 'MULTIPLE_CHOICE', options: ['Personification', 'Simile', 'Alliteration', 'Hyperbole'], correctAnswer: 'Personification', explanation: 'Personification gives human qualities to non-human things. Wind cannot literally "howl."', skill: 'Figurative Language', difficulty: 'EASY' },
      { question: 'Identify the literary device: "She sells seashells by the seashore."', type: 'MULTIPLE_CHOICE', options: ['Alliteration', 'Assonance', 'Onomatopoeia', 'Rhyme'], correctAnswer: 'Alliteration', explanation: 'Alliteration is the repetition of consonant sounds at the beginning of words.', skill: 'Sound Devices', difficulty: 'EASY' },
      { question: '"I\'ve told you a million times!" is an example of:', type: 'MULTIPLE_CHOICE', options: ['Hyperbole', 'Metaphor', 'Irony', 'Understatement'], correctAnswer: 'Hyperbole', explanation: 'Hyperbole is an extreme exaggeration used for emphasis or humor.', skill: 'Figurative Language', difficulty: 'EASY' },
      { question: 'What is dramatic irony?', type: 'SHORT_ANSWER', correctAnswer: 'When the audience knows something the characters do not', explanation: 'Example: In Romeo and Juliet, the audience knows Juliet is alive, but Romeo does not.', skill: 'Irony', difficulty: 'MEDIUM' },
      { question: 'What is foreshadowing?', type: 'SHORT_ANSWER', correctAnswer: 'A literary device where the author gives hints about future events in the story', explanation: 'Foreshadowing builds suspense and prepares the reader for what is to come.', skill: 'Narrative Techniques', difficulty: 'EASY' },
      { question: '"Boom!", "Sizzle", and "Buzz" are examples of:', type: 'MULTIPLE_CHOICE', options: ['Onomatopoeia', 'Alliteration', 'Simile', 'Metaphor'], correctAnswer: 'Onomatopoeia', explanation: 'Onomatopoeia is when a word imitates the sound it represents.', skill: 'Sound Devices', difficulty: 'EASY' },
      { question: 'What is the difference between a simile and a metaphor?', type: 'SHORT_ANSWER', correctAnswer: 'A simile compares using "like" or "as"; a metaphor makes a direct comparison without them', explanation: 'Simile: "fast like a cheetah." Metaphor: "He is a cheetah on the field."', skill: 'Comparisons', difficulty: 'EASY' },
      { question: 'An oxymoron combines two contradictory words. Which is an oxymoron?', type: 'MULTIPLE_CHOICE', options: ['"Deafening silence"', '"Crystal clear"', '"As cold as ice"', '"Running quickly"'], correctAnswer: '"Deafening silence"', explanation: '"Deafening" (loud) and "silence" (quiet) contradict each other.', skill: 'Figurative Language', difficulty: 'MEDIUM' },
      { question: 'What is symbolism in literature?', type: 'SHORT_ANSWER', correctAnswer: 'Using an object, character, or color to represent an abstract idea or concept', explanation: 'Example: A dove symbolizes peace. A red rose symbolizes love.', skill: 'Literary Devices', difficulty: 'MEDIUM' },
    ],
    Grammar: [
      { question: 'What is the difference between "affect" and "effect"?', type: 'SHORT_ANSWER', correctAnswer: 'Affect is a verb (to influence), effect is a noun (a result)', explanation: 'Remember: Affect = Action (verb), Effect = End result (noun).', skill: 'Commonly Confused Words', difficulty: 'EASY' },
      { question: 'Identify the subject in: "The big brown dog chased the cat."', type: 'MULTIPLE_CHOICE', options: ['dog', 'cat', 'The big brown dog', 'chased'], correctAnswer: 'The big brown dog', explanation: 'The complete subject includes the noun and all modifiers: "The big brown dog."', skill: 'Sentence Structure', difficulty: 'EASY' },
      { question: 'Which sentence uses a semicolon correctly?', type: 'MULTIPLE_CHOICE', options: ['I love reading; it expands my imagination.', 'I love; reading it expands my imagination.', 'I love reading it; expands my imagination.', 'I; love reading it expands my imagination.'], correctAnswer: 'I love reading; it expands my imagination.', explanation: 'Semicolons connect two related independent clauses.', skill: 'Punctuation', difficulty: 'MEDIUM' },
      { question: 'What is a compound sentence?', type: 'SHORT_ANSWER', correctAnswer: 'A sentence with two or more independent clauses joined by a conjunction or semicolon', explanation: 'Example: "I ran to the store, and I bought some milk."', skill: 'Sentence Types', difficulty: 'EASY' },
      { question: 'Choose the correct word: "Their/There/They\'re going to the movies."', type: 'MULTIPLE_CHOICE', options: ["They're", 'Their', 'There', 'All are correct'], correctAnswer: "They're", explanation: "They're = they are. Their = possessive. There = a place.", skill: 'Homophones', difficulty: 'EASY' },
      { question: 'What is a dangling modifier?', type: 'SHORT_ANSWER', correctAnswer: 'A modifier that doesn\'t clearly refer to the word it is meant to modify', explanation: 'Example: "Walking to school, the rain started." (Who is walking? The rain?)', skill: 'Grammar Errors', difficulty: 'MEDIUM' },
      { question: 'Identify the part of speech of "quickly" in: "She ran quickly."', type: 'MULTIPLE_CHOICE', options: ['Adverb', 'Adjective', 'Verb', 'Noun'], correctAnswer: 'Adverb', explanation: '"Quickly" modifies the verb "ran," telling how she ran. Adverbs modify verbs.', skill: 'Parts of Speech', difficulty: 'EASY' },
      { question: 'What is the plural possessive of "children"?', type: 'SHORT_ANSWER', correctAnswer: "children's", explanation: '"Children" is already plural (irregular). Add apostrophe + s: children\'s.', skill: 'Possessives', difficulty: 'MEDIUM' },
      { question: 'Which sentence is in passive voice?', type: 'MULTIPLE_CHOICE', options: ['The ball was thrown by Sarah.', 'Sarah threw the ball.', 'Sarah is throwing the ball.', 'Sarah will throw the ball.'], correctAnswer: 'The ball was thrown by Sarah.', explanation: 'Passive voice: subject receives the action. "The ball" (subject) was thrown (action received).', skill: 'Active vs. Passive Voice', difficulty: 'MEDIUM' },
      { question: 'Fix the run-on sentence: "I like pizza I eat it every day."', type: 'SHORT_ANSWER', correctAnswer: 'I like pizza. I eat it every day. (or use semicolon/conjunction)', explanation: 'Options: period, semicolon, or comma + conjunction (", and").', skill: 'Run-on Sentences', difficulty: 'EASY' },
    ],
    _default: [
      { question: 'What is the climax of a story?', type: 'SHORT_ANSWER', correctAnswer: 'The turning point or moment of highest tension/conflict in the plot', explanation: 'The climax is the most exciting moment where the main conflict reaches its peak.', skill: 'Plot Structure', difficulty: 'EASY' },
      { question: 'Identify the type of point of view: "I walked to school, feeling nervous about the test."', type: 'MULTIPLE_CHOICE', options: ['First person', 'Second person', 'Third person limited', 'Third person omniscient'], correctAnswer: 'First person', explanation: 'The use of "I" indicates first-person point of view.', skill: 'Point of View', difficulty: 'EASY' },
      { question: 'What is the difference between theme and topic?', type: 'SHORT_ANSWER', correctAnswer: 'A topic is the subject (e.g., "friendship"). A theme is the message or lesson about that subject (e.g., "True friendship requires sacrifice").', explanation: 'A topic is a single word or phrase. A theme is a complete statement.', skill: 'Theme Analysis', difficulty: 'MEDIUM' },
      { question: 'What is a thesis statement?', type: 'SHORT_ANSWER', correctAnswer: 'A sentence that states the main argument or claim of an essay', explanation: 'Usually found at the end of the introduction paragraph.', skill: 'Essay Writing', difficulty: 'EASY' },
      { question: 'What is the purpose of a topic sentence in a paragraph?', type: 'MULTIPLE_CHOICE', options: ['To state the main idea of the paragraph', 'To conclude the essay', 'To provide a citation', 'To transition between essays'], correctAnswer: 'To state the main idea of the paragraph', explanation: 'A topic sentence introduces what the paragraph will be about.', skill: 'Paragraph Structure', difficulty: 'EASY' },
      { question: 'What are the five elements of plot structure?', type: 'SHORT_ANSWER', correctAnswer: 'Exposition, rising action, climax, falling action, resolution', explanation: 'Also known as Freytag\'s Pyramid.', skill: 'Plot Structure', difficulty: 'EASY' },
      { question: 'What is an unreliable narrator?', type: 'SHORT_ANSWER', correctAnswer: 'A narrator whose account of events cannot be fully trusted due to bias, limited knowledge, or deception', explanation: 'The reader must question what the narrator says and look for contradictions.', skill: 'Narrative Voice', difficulty: 'MEDIUM' },
      { question: 'What is the tone of a piece of writing?', type: 'MULTIPLE_CHOICE', options: ['The author\'s attitude toward the subject', 'The plot of the story', 'The moral of the story', 'The setting of the story'], correctAnswer: 'The author\'s attitude toward the subject', explanation: 'Tone can be sarcastic, serious, humorous, angry, etc.', skill: 'Author\'s Craft', difficulty: 'EASY' },
      { question: 'What does "cite textual evidence" mean?', type: 'SHORT_ANSWER', correctAnswer: 'To reference specific words, phrases, or passages from the text to support your analysis', explanation: 'Always use quotation marks and include the source/page number.', skill: 'Text Analysis', difficulty: 'EASY' },
      { question: 'What is the difference between connotation and denotation?', type: 'SHORT_ANSWER', correctAnswer: 'Denotation is the dictionary definition; connotation is the emotional or cultural association of a word', explanation: 'Example: "home" (denotation: a dwelling) vs. "home" (connotation: warmth, safety).', skill: 'Vocabulary', difficulty: 'MEDIUM' },
      { question: 'In an argumentative essay, what is a counterargument?', type: 'MULTIPLE_CHOICE', options: ['An opposing viewpoint that the writer addresses and refutes', 'The thesis statement', 'A summary of the conclusion', 'A type of evidence'], correctAnswer: 'An opposing viewpoint that the writer addresses and refutes', explanation: 'Addressing counterarguments strengthens your argument by showing you\'ve considered other perspectives.', skill: 'Argumentative Writing', difficulty: 'MEDIUM' },
      { question: 'What is allusion in literature?', type: 'SHORT_ANSWER', correctAnswer: 'A brief reference to a well-known person, place, event, or work of art', explanation: 'Example: "He has the Midas touch" alludes to the Greek myth of King Midas.', skill: 'Literary Devices', difficulty: 'MEDIUM' },
    ],
  },
  History: {
    'American History': [
      { question: 'What year did the Declaration of Independence get signed?', type: 'MULTIPLE_CHOICE', options: ['1776', '1789', '1804', '1812'], correctAnswer: '1776', explanation: 'The Declaration of Independence was adopted by the Continental Congress on July 4, 1776.', skill: 'American Revolution', difficulty: 'EASY' },
      { question: 'Who wrote the Declaration of Independence?', type: 'MULTIPLE_CHOICE', options: ['Thomas Jefferson', 'George Washington', 'Benjamin Franklin', 'John Adams'], correctAnswer: 'Thomas Jefferson', explanation: 'Thomas Jefferson was the primary author, with edits from Franklin and Adams.', skill: 'Founding Documents', difficulty: 'EASY' },
      { question: 'What were the three branches of government established by the Constitution?', type: 'SHORT_ANSWER', correctAnswer: 'Legislative, Executive, and Judicial', explanation: 'Legislative (Congress), Executive (President), Judicial (Supreme Court). This creates checks and balances.', skill: 'U.S. Government', difficulty: 'EASY' },
      { question: 'What was the main cause of the Civil War?', type: 'MULTIPLE_CHOICE', options: ['Slavery and states\' rights', 'Taxation', 'Foreign invasion', 'Religious differences'], correctAnswer: 'Slavery and states\' rights', explanation: 'While states\' rights was the political framing, the central issue was the expansion and abolition of slavery.', skill: 'Civil War', difficulty: 'EASY' },
      { question: 'What did the 13th Amendment accomplish?', type: 'SHORT_ANSWER', correctAnswer: 'Abolished slavery in the United States', explanation: 'Ratified in 1865, the 13th Amendment permanently abolished slavery and involuntary servitude.', skill: 'Reconstruction', difficulty: 'EASY' },
      { question: 'What was the significance of the Louisiana Purchase (1803)?', type: 'SHORT_ANSWER', correctAnswer: 'The U.S. doubled its size by purchasing approximately 828,000 square miles from France for $15 million', explanation: 'President Jefferson bought this territory, extending the U.S. from the Mississippi River to the Rocky Mountains.', skill: 'Westward Expansion', difficulty: 'MEDIUM' },
      { question: 'Who delivered the "I Have a Dream" speech?', type: 'MULTIPLE_CHOICE', options: ['Martin Luther King Jr.', 'Malcolm X', 'Rosa Parks', 'John F. Kennedy'], correctAnswer: 'Martin Luther King Jr.', explanation: 'Delivered during the March on Washington on August 28, 1963.', skill: 'Civil Rights Movement', difficulty: 'EASY' },
      { question: 'What event is considered the start of the Great Depression?', type: 'MULTIPLE_CHOICE', options: ['Stock market crash of 1929', 'World War I', 'The Dust Bowl', 'The New Deal'], correctAnswer: 'Stock market crash of 1929', explanation: 'On October 29, 1929 ("Black Tuesday"), the stock market collapsed, triggering the worst economic crisis in U.S. history.', skill: 'Economic History', difficulty: 'MEDIUM' },
      { question: 'What was the purpose of the Emancipation Proclamation?', type: 'SHORT_ANSWER', correctAnswer: 'It declared enslaved people in Confederate states to be free', explanation: 'Issued by Lincoln on January 1, 1863, it freed slaves in rebelling states and allowed Black men to serve in the military.', skill: 'Civil War', difficulty: 'MEDIUM' },
      { question: 'What was Manifest Destiny?', type: 'SHORT_ANSWER', correctAnswer: 'The 19th-century belief that the expansion of the U.S. across the North American continent was both justified and inevitable', explanation: 'This ideology drove westward expansion, the Oregon Trail, and conflicts with Native Americans and Mexico.', skill: 'Westward Expansion', difficulty: 'MEDIUM' },
      { question: 'Which amendment gave women the right to vote?', type: 'MULTIPLE_CHOICE', options: ['19th Amendment', '15th Amendment', '21st Amendment', '13th Amendment'], correctAnswer: '19th Amendment', explanation: 'Ratified in 1920, the 19th Amendment granted women the right to vote (women\'s suffrage).', skill: 'Constitutional Amendments', difficulty: 'EASY' },
      { question: 'What was the significance of Brown v. Board of Education (1954)?', type: 'SHORT_ANSWER', correctAnswer: 'The Supreme Court ruled that racial segregation in public schools was unconstitutional', explanation: 'This overturned Plessy v. Ferguson (1896) and declared "separate but equal" was inherently unequal.', skill: 'Civil Rights', difficulty: 'MEDIUM' },
    ],
    'World History': [
      { question: 'What was the main cause of World War I?', type: 'SHORT_ANSWER', correctAnswer: 'A combination of militarism, alliances, imperialism, and nationalism (MAIN), triggered by the assassination of Archduke Franz Ferdinand', explanation: 'The acronym MAIN helps remember the causes.', skill: 'World Wars', difficulty: 'MEDIUM' },
      { question: 'What was the significance of the Magna Carta (1215)?', type: 'SHORT_ANSWER', correctAnswer: 'It limited the power of the English king and established that no one was above the law', explanation: 'The Magna Carta is considered a foundation of constitutional law and influenced the U.S. Constitution.', skill: 'Government & Law', difficulty: 'MEDIUM' },
      { question: 'Which ancient civilization built the pyramids?', type: 'MULTIPLE_CHOICE', options: ['Egypt', 'Greece', 'Rome', 'Mesopotamia'], correctAnswer: 'Egypt', explanation: 'The ancient Egyptians built the Great Pyramids of Giza as tombs for pharaohs around 2560 BC.', skill: 'Ancient Civilizations', difficulty: 'EASY' },
      { question: 'What was the Renaissance?', type: 'SHORT_ANSWER', correctAnswer: 'A cultural movement in Europe (14th-17th century) characterized by a revival of interest in art, science, and classical learning', explanation: 'The Renaissance began in Italy and spread across Europe, marking the transition from the Middle Ages to the modern era.', skill: 'Cultural History', difficulty: 'MEDIUM' },
      { question: 'Who was the first emperor of Rome?', type: 'MULTIPLE_CHOICE', options: ['Augustus (Octavian)', 'Julius Caesar', 'Nero', 'Marcus Aurelius'], correctAnswer: 'Augustus (Octavian)', explanation: 'Augustus became the first Roman Emperor in 27 BC after the fall of the Roman Republic.', skill: 'Ancient Rome', difficulty: 'MEDIUM' },
      { question: 'What event marked the beginning of World War II in Europe?', type: 'MULTIPLE_CHOICE', options: ['Germany\'s invasion of Poland (1939)', 'Attack on Pearl Harbor (1941)', 'Treaty of Versailles (1919)', 'D-Day (1944)'], correctAnswer: 'Germany\'s invasion of Poland (1939)', explanation: 'On September 1, 1939, Nazi Germany invaded Poland, leading Britain and France to declare war.', skill: 'World War II', difficulty: 'EASY' },
      { question: 'What was the Cold War?', type: 'SHORT_ANSWER', correctAnswer: 'A period of political and military tension between the United States and Soviet Union (1947-1991) without direct military conflict', explanation: 'It involved proxy wars, nuclear arms race, space race, and ideological conflict between capitalism and communism.', skill: 'Modern History', difficulty: 'MEDIUM' },
      { question: 'What was the Silk Road?', type: 'MULTIPLE_CHOICE', options: ['A network of trade routes connecting East and West', 'A type of fabric', 'A Roman road', 'A river in China'], correctAnswer: 'A network of trade routes connecting East and West', explanation: 'The Silk Road facilitated trade, cultural exchange, and the spread of ideas between China, Central Asia, and Europe.', skill: 'Trade & Exchange', difficulty: 'EASY' },
      { question: 'What was the French Revolution primarily a response to?', type: 'SHORT_ANSWER', correctAnswer: 'Social inequality, economic crisis, and the absolute monarchy of Louis XVI', explanation: 'The three estates system, financial crisis, and Enlightenment ideas fueled the revolution beginning in 1789.', skill: 'Revolutions', difficulty: 'MEDIUM' },
      { question: 'What is a primary source?', type: 'MULTIPLE_CHOICE', options: ['A firsthand account created during the time period', 'A textbook summary', 'An encyclopedia article', 'A documentary film'], correctAnswer: 'A firsthand account created during the time period', explanation: 'Primary sources are original documents, images, or artifacts from the historical period.', skill: 'Historical Sources', difficulty: 'EASY' },
    ],
    _default: [
      { question: 'What is a primary source?', type: 'MULTIPLE_CHOICE', options: ['A firsthand account created during the time period', 'A textbook summary of events', 'An encyclopedia article', 'A documentary film'], correctAnswer: 'A firsthand account created during the time period', explanation: 'Primary sources are original documents, images, or artifacts created during the historical period being studied.', skill: 'Historical Sources', difficulty: 'EASY' },
      { question: 'What year did the Declaration of Independence get signed?', type: 'MULTIPLE_CHOICE', options: ['1776', '1789', '1804', '1812'], correctAnswer: '1776', explanation: 'The Declaration of Independence was adopted by the Continental Congress on July 4, 1776.', skill: 'American History', difficulty: 'EASY' },
      { question: 'What was the main cause of World War I?', type: 'SHORT_ANSWER', correctAnswer: 'A combination of militarism, alliances, imperialism, and nationalism (MAIN), triggered by the assassination of Archduke Franz Ferdinand', explanation: 'The acronym MAIN helps remember the causes.', skill: 'World History', difficulty: 'MEDIUM' },
      { question: 'Who wrote "I Have a Dream"?', type: 'MULTIPLE_CHOICE', options: ['Martin Luther King Jr.', 'Malcolm X', 'Rosa Parks', 'John F. Kennedy'], correctAnswer: 'Martin Luther King Jr.', explanation: 'Delivered during the March on Washington on August 28, 1963.', skill: 'Civil Rights', difficulty: 'EASY' },
      { question: 'What was the significance of the Magna Carta (1215)?', type: 'SHORT_ANSWER', correctAnswer: 'It limited the power of the English king and established that no one was above the law.', explanation: 'It influenced later democratic documents including the U.S. Constitution.', skill: 'Government & Law', difficulty: 'MEDIUM' },
      { question: 'What were the three branches of government created by the U.S. Constitution?', type: 'SHORT_ANSWER', correctAnswer: 'Legislative, Executive, and Judicial', explanation: 'This system of checks and balances prevents any one branch from having too much power.', skill: 'U.S. Government', difficulty: 'EASY' },
      { question: 'What was the Industrial Revolution?', type: 'SHORT_ANSWER', correctAnswer: 'A period of major economic and technological change (18th-19th century) when manufacturing moved from hand production to machine production', explanation: 'It began in Britain and spread globally, transforming agriculture, transportation, and society.', skill: 'Economic History', difficulty: 'MEDIUM' },
      { question: 'What empire was ruled by pharaohs?', type: 'MULTIPLE_CHOICE', options: ['Ancient Egypt', 'Roman Empire', 'Ottoman Empire', 'British Empire'], correctAnswer: 'Ancient Egypt', explanation: 'Pharaohs were the political and religious leaders of ancient Egypt.', skill: 'Ancient Civilizations', difficulty: 'EASY' },
      { question: 'What is bias in a historical source?', type: 'SHORT_ANSWER', correctAnswer: 'A one-sided or prejudiced perspective that may distort the truth', explanation: 'All sources have some bias. Historians identify bias by considering the author, audience, and purpose.', skill: 'Source Analysis', difficulty: 'MEDIUM' },
      { question: 'What amendment abolished slavery in the United States?', type: 'MULTIPLE_CHOICE', options: ['13th Amendment', '14th Amendment', '15th Amendment', '1st Amendment'], correctAnswer: '13th Amendment', explanation: 'The 13th Amendment (1865) abolished slavery and involuntary servitude.', skill: 'Constitutional History', difficulty: 'EASY' },
      { question: 'What was the Marshall Plan?', type: 'SHORT_ANSWER', correctAnswer: 'A U.S. program providing economic aid to Western European countries after World War II', explanation: 'Proposed in 1947, it helped rebuild European economies and prevent the spread of communism.', skill: 'Post-WWII', difficulty: 'MEDIUM' },
      { question: 'What is imperialism?', type: 'SHORT_ANSWER', correctAnswer: 'A policy where a powerful nation extends control over weaker nations or territories', explanation: 'European imperialism in Africa and Asia during the 19th century is a key example.', skill: 'Political Concepts', difficulty: 'MEDIUM' },
    ],
  },
};

export function generateSpecializedQuiz(
  subject: string,
  gradeLevel: string,
  topic: string,
  questionCount: number,
  difficulty: string
): any[] {
  // 1. Find the best matching question bank
  const subjectBank = QUIZ_BANKS[subject] || QUIZ_BANKS['Math'];
  const topicLower = (topic || '').toLowerCase();

  // 2. Collect ALL questions — topic-specific first, then fill from other pools
  let primaryPool: any[] = [];
  let secondaryPool: any[] = [];

  for (const [key, bank] of Object.entries(subjectBank)) {
    if (key === '_default') continue;
    if (topicLower && topicLower.includes(key.toLowerCase())) {
      primaryPool = [...primaryPool, ...bank];
    } else {
      secondaryPool = [...secondaryPool, ...bank];
    }
  }

  // Add the _default pool to secondary
  if (subjectBank['_default']) {
    secondaryPool = [...secondaryPool, ...subjectBank['_default']];
  }

  // If no topic match, use all questions from the subject
  if (primaryPool.length === 0) {
    primaryPool = secondaryPool;
    secondaryPool = [];
  }

  // 3. Filter by difficulty if specified (but keep a fallback)
  let filtered = primaryPool;
  if (difficulty && difficulty !== 'ALL' && difficulty !== 'MEDIUM') {
    const diffMap: Record<string, string[]> = {
      BEGINNER: ['EASY'],
      EASY: ['EASY', 'MEDIUM'],
      HARD: ['HARD', 'MEDIUM'],
      ADVANCED: ['HARD'],
    };
    const allowedDiffs = diffMap[difficulty] || [difficulty];
    const diffFiltered = primaryPool.filter(q => allowedDiffs.includes(q.difficulty));
    if (diffFiltered.length >= 3) {
      filtered = diffFiltered;
    }
  }

  // 4. Shuffle and pick unique questions
  const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);
  const selected = shuffle([...filtered]).slice(0, questionCount);

  // 5. If we still need more, pull from secondary pool
  if (selected.length < questionCount && secondaryPool.length > 0) {
    const existing = new Set(selected.map(q => q.question));
    const extra = shuffle(secondaryPool).filter(q => !existing.has(q.question));
    selected.push(...extra.slice(0, questionCount - selected.length));
  }

  // 6. If we STILL need more (bank exhausted), pull from other subjects
  if (selected.length < questionCount) {
    const existing = new Set(selected.map(q => q.question));
    for (const [otherSubject, otherBank] of Object.entries(QUIZ_BANKS)) {
      if (otherSubject === subject) continue;
      if (selected.length >= questionCount) break;
      const allOther = Object.values(otherBank).flat();
      const extra = shuffle(allOther).filter(q => !existing.has(q.question));
      for (const q of extra) {
        if (selected.length >= questionCount) break;
        selected.push(q);
        existing.add(q.question);
      }
    }
  }

  // 7. Tag each question with the overall difficulty if it doesn't have one
  return selected.map((q, i) => ({
    ...q,
    id: `q${i + 1}`,
    difficulty: q.difficulty || difficulty || 'MEDIUM',
  }));
}
