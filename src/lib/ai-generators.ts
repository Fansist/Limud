/**
 * AI content generators for demo mode.
 * These produce specialized, detailed content based on subject/grade/topic
 * rather than generic placeholder text.
 */

// ─── LESSON PLAN GENERATOR ────────────────────────────────────

const LESSON_PLAN_BANKS: Record<string, Record<string, any>> = {
  Math: {
    'Fractions': {
      title: 'Mastering Fraction Operations',
      objectives: ['Students will add and subtract fractions with unlike denominators using the LCD method', 'Students will multiply and divide fractions and mixed numbers fluently', 'Students will solve real-world problems involving fraction operations and justify their reasoning'],
      standards: 'CCSS.MATH.CONTENT.5.NF.A.1 - Add and subtract fractions with unlike denominators; CCSS.MATH.CONTENT.5.NF.B.4 - Apply and extend previous understandings of multiplication to multiply a fraction or whole number by a fraction',
      materials: ['Fraction manipulatives (fraction bars/circles)', 'Whiteboards and dry-erase markers', 'Recipe cards for cooking activity', '"Fraction War" card game decks', 'Exit ticket worksheet'],
      warmUp: 'Display a pizza cut into 8 slices on the board. Ask: "If you eat 3/8 of the pizza and your friend eats 2/8, how much pizza is left?" Then ask: "What if the pizza was cut into 6 slices instead?" Have students discuss in pairs why the second question is harder. This surfaces the need for common denominators.',
      directInstruction: '**Finding the LCD (10 min)**\nModel finding the Least Common Denominator step by step:\n1. List multiples of each denominator\n2. Identify the smallest common multiple\n3. Convert each fraction to equivalent fractions with the LCD\n\n**Example walkthrough**: 2/3 + 1/4\n- Multiples of 3: 3, 6, 9, **12**, 15...\n- Multiples of 4: 4, 8, **12**, 16...\n- LCD = 12\n- 2/3 = 8/12 and 1/4 = 3/12\n- 8/12 + 3/12 = 11/12\n\n**Multiplication & Division (10 min)**\nShow "multiply straight across" for multiplication.\nFor division, teach "Keep, Change, Flip" (KCF) method.\nWork through 3 examples of increasing difficulty.',
      guidedPractice: '**"Recipe Rescue" Activity (15 min)**\nStudents work in pairs. Each pair receives a recipe that needs to be doubled or halved. They must:\n1. Convert all measurements using fraction operations\n2. Show their work on whiteboards\n3. Verify with a partner pair\n\nExample: Original recipe calls for 2/3 cup flour and 3/4 cup sugar. Double it.\nTeacher circulates asking probing questions: "How did you find the common denominator?" "Why did you flip the second fraction?"',
      independentPractice: 'Students complete a tiered problem set (choose your level):\n\n**Level 1 (Approaching)**: 8 problems with like and unlike denominators, whole number results\n**Level 2 (On Grade)**: 10 problems including mixed numbers and word problems\n**Level 3 (Advanced)**: 6 multi-step word problems requiring multiple operations\n\nStudents self-assess after each problem using a traffic light system (green = confident, yellow = unsure, red = need help).',
      assessment: '**Exit Ticket (5 min)**: 3 questions\n1. Solve: 5/6 - 2/9 (tests LCD)\n2. Solve: 3/4 × 2/5 (tests multiplication)\n3. A carpenter has a board that is 7 3/4 feet long. He cuts off 2 1/2 feet. How long is the remaining piece? (tests real-world application)\n\nScore: 3/3 = mastery, 2/3 = approaching, 1/3 or less = needs intervention',
      closure: 'Quick class poll: "Rate your confidence with fraction operations 1-5 with your fingers." Address any 1s and 2s briefly.\n\nConnect to tomorrow: "Now that you can work with fractions, tomorrow we\'ll explore how fractions, decimals, and percentages are all connected. Bring your fraction skills!"',
      differentiation: '**ELL Students**: Bilingual fraction vocabulary card (numerator/numerador, denominator/denominador); visual fraction wall reference sheet\n**IEP Accommodations**: Pre-printed number lines, calculator for checking work, reduced problem set (5 problems)\n**Advanced Learners**: Create their own word problems for classmates; explore fraction operations with variables (e.g., a/b + c/d)\n**Kinesthetic Learners**: Use physical fraction manipulatives throughout; allow standing at whiteboards',
      homework: '**Fraction Practice (20 min)**\n1. Problems 1-12 on the fraction operations worksheet\n2. Real-world challenge: Find a recipe at home. Rewrite it to serve half the original number of people. Bring your converted recipe to class tomorrow.\n3. Optional enrichment: Research where fractions are used in music (time signatures, note values)',
    },
    'Algebra': {
      title: 'Introduction to Algebraic Expressions & Equations',
      objectives: ['Students will translate verbal expressions into algebraic expressions using variables', 'Students will solve one-step and two-step equations using inverse operations', 'Students will verify solutions by substituting back into the original equation'],
      standards: 'CCSS.MATH.CONTENT.6.EE.A.2 - Write, read, and evaluate expressions in which letters stand for numbers; CCSS.MATH.CONTENT.6.EE.B.7 - Solve real-world and mathematical problems by writing and solving equations of the form x + p = q and px = q',
      materials: ['Algebra tiles or virtual manipulatives', 'Balance scale (physical or image)', 'Equation Bingo cards', 'Colored pencils for two-column notes', 'Mini whiteboards per student'],
      warmUp: 'Mystery Number Challenge: "I\'m thinking of a number. When I add 7 to it, I get 15. What\'s my number?" Then: "When I double my number and subtract 3, I get 11. What\'s my number?" Have students explain their reasoning. Bridge: "Today we\'ll learn the formal way to solve these mysteries using algebra."',
      directInstruction: '**What is a Variable? (5 min)**\nA variable is a letter that represents an unknown value. Show how "a number plus 7 equals 15" becomes "x + 7 = 15".\n\n**The Balance Principle (10 min)**\nUse a balance scale image. Whatever you do to one side, you MUST do to the other side.\n- Show: x + 7 = 15 → subtract 7 from both sides → x = 8\n- Show: 3x = 21 → divide both sides by 3 → x = 7\n\n**Two-Step Equations (10 min)**\n"Undo" operations in reverse order (PEMDAS backwards):\n- 2x + 5 = 13\n- Step 1: Subtract 5 from both sides → 2x = 8\n- Step 2: Divide both sides by 2 → x = 4\n- CHECK: 2(4) + 5 = 8 + 5 = 13 ✓',
      guidedPractice: '**"Equation Detectives" (12 min)**\nStudents work in groups of 3. Each group receives 6 equation cards:\n1. Sort equations by difficulty (one-step vs. two-step)\n2. Solve each equation showing all work\n3. Verify each solution by substituting back\n4. The "Detective Badge" goes to the first team to correctly solve and verify all 6\n\nTeacher visits each group, asking: "Which operation are you undoing first? Why?"',
      independentPractice: 'Students complete the "Equation Challenge" worksheet independently:\n- Section A: Translate 5 verbal expressions to algebraic expressions\n- Section B: Solve 6 one-step equations\n- Section C: Solve 4 two-step equations\n- Section D: Write and solve 2 real-world equation problems\n\nEarly finishers create their own "Mystery Number" puzzles for classmates.',
      assessment: '**Formative Checks Throughout**:\n- Thumbs up/down after each worked example\n- Whiteboard problems (hold up answers simultaneously)\n\n**Exit Ticket**:\n1. Write an equation for: "A number doubled, then increased by 4, equals 18"\n2. Solve: x/3 - 2 = 5\n3. Maya has $45. She earns $8 per hour babysitting. How many hours must she work to have $93? Write and solve an equation.',
      closure: 'Pair-Share: "Tell your partner one thing you learned today about solving equations and one thing you want to practice more."\n\nPreview: "Tomorrow we\'ll use these equation skills to solve problems about percentages and proportions - like figuring out sale prices and cooking for different group sizes!"',
      differentiation: '**ELL Students**: Vocabulary anchor chart with "expression," "equation," "variable," "solve," "substitute" with translations and visual examples\n**IEP Students**: Pre-highlighted notes, equation-solving checklist, use of algebra tiles for every problem\n**Advanced Learners**: Multi-step equations with variables on both sides; introduction to inequalities\n**Visual Learners**: Color-code each step (blue for operation on left, red for operation on right)',
      homework: '**Algebra Practice (20 min)**:\n1. Solve equations 1-10 on worksheet (show all work and check answers)\n2. Real-world connection: Find something at home with a price tag. If there were a 25% off sale, write an equation to find the sale price. Solve it.\n3. Journal reflection: "Why is it important to check your answer after solving an equation?"',
    },
    '_default': {
      title: 'Exploring Mathematical Concepts',
      objectives: ['Students will understand and apply key mathematical concepts related to the topic', 'Students will solve problems using multiple strategies and justify their reasoning', 'Students will connect mathematical ideas to real-world situations'],
      standards: 'Aligned with Common Core Mathematics Standards for the appropriate grade level',
      materials: ['Graph paper and rulers', 'Calculators', 'Manipulatives (as needed)', 'Practice worksheets', 'Digital whiteboard or projector'],
      warmUp: 'Begin with a Number Talk: Display a problem on the board and ask students to solve it mentally. Share strategies as a class. This builds number sense and activates mathematical thinking.',
      directInstruction: '**Concept Introduction (10 min)**\nIntroduce the key vocabulary and concepts using visual models and concrete examples. Work through 2-3 examples on the board, gradually increasing complexity.\n\n**Connecting to Prior Knowledge (5 min)**\nShow how today\'s topic builds on what students already know. Create an anchor chart showing the connections.\n\n**Think Aloud (5 min)**\nModel your problem-solving process by thinking aloud through a challenging example. Show that mistakes are part of learning.',
      guidedPractice: '**Partner Problem Solving (12 min)**\nStudents work in pairs using the "Rally Coach" strategy:\n- Partner A solves while Partner B coaches\n- Switch roles for the next problem\n- Both must agree before moving on\n\nProvide 6 practice problems at increasing difficulty. Teacher circulates and provides targeted feedback.',
      independentPractice: 'Students complete a differentiated problem set:\n- **Must Do**: 8 foundational problems\n- **Should Do**: 4 application problems\n- **Can Do**: 2 challenge problems\n\nStudents track their confidence with a self-assessment rubric after each section.',
      assessment: 'Exit Ticket (3 questions):\n1. A computation problem testing the main skill\n2. A word problem requiring application\n3. "Explain in your own words how to..." (tests conceptual understanding)',
      closure: 'Gallery Walk: Students display their work on desks. Classmates rotate, leaving sticky-note feedback (one compliment and one question). Debrief as a class.',
      differentiation: '**Below Grade Level**: Reduced problem set with visual supports and manipulatives\n**On Grade Level**: Standard problem set with real-world applications\n**Above Grade Level**: Open-ended investigation problems and peer tutoring opportunities\n**ELL**: Sentence frames for mathematical explanations, bilingual glossary',
      homework: 'Complete the practice worksheet (problems 1-10). Write a brief reflection: "What strategy worked best for me today and why?" Find a real-world example of this math concept and bring it to share tomorrow.',
    },
  },
  Science: {
    'Photosynthesis': {
      title: 'The Science of Photosynthesis: How Plants Make Food',
      objectives: ['Students will explain the process of photosynthesis including reactants, products, and the role of chlorophyll', 'Students will design and analyze an experiment testing variables that affect photosynthesis rates', 'Students will connect photosynthesis to the carbon cycle and its importance for all life on Earth'],
      standards: 'NGSS MS-LS1-6: Construct a scientific explanation based on evidence for the role of photosynthesis in the cycling of matter and flow of energy into and out of organisms',
      materials: ['Elodea (aquatic plant) specimens', 'Beakers, water, baking soda', 'Light sources (desk lamps)', 'Colored cellophane (red, blue, green)', 'Bromothymol blue indicator', 'Lab worksheets and safety goggles'],
      warmUp: 'Display two plants: one healthy green plant and one that was kept in the dark for a week (yellowed). Ask: "What happened to this plant? Why?" Then: "What do plants need that animals don\'t have to make for themselves?" Have students write predictions in their lab journals.',
      directInstruction: '**The Photosynthesis Equation (8 min)**\n6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂\n\nBreak it down:\n- **Inputs**: Carbon dioxide (from air), water (from soil), sunlight (energy source)\n- **Outputs**: Glucose (food/energy), oxygen (waste product we breathe!)\n- **Location**: Chloroplasts, specifically using chlorophyll\n\n**How It Works (10 min)**\nUse an animated diagram showing:\n1. Light-dependent reactions: Chlorophyll captures light energy, splits water molecules\n2. Light-independent reactions (Calvin Cycle): CO₂ is converted to glucose\n3. Show the chloroplast structure: thylakoids, stroma, granum\n\n**Why It Matters (5 min)**\nPhotosynthesis is the foundation of almost all food chains. It also produces the oxygen we breathe and removes CO₂ from the atmosphere.',
      guidedPractice: '**Elodea Bubble Lab (15 min)**\nStudents work in groups of 3-4:\n1. Place Elodea in a beaker of water with baking soda (CO₂ source)\n2. Shine light on the plant at different distances (5cm, 15cm, 30cm)\n3. Count oxygen bubbles per minute at each distance\n4. Record data in a table\n5. Discuss: "What does the number of bubbles tell us about the rate of photosynthesis?"\n\nTeacher guides students through making observations and forming conclusions.',
      independentPractice: 'Students complete the Photosynthesis Investigation Lab Report:\n1. **Hypothesis**: Predict how light intensity affects photosynthesis rate\n2. **Data Table**: Record bubble counts from the experiment\n3. **Graph**: Create a bar graph showing bubbles/min vs. distance\n4. **Analysis**: Write 3-4 sentences explaining the relationship\n5. **Extension Question**: "What would happen if we used colored light filters?"',
      assessment: '**Lab Report Rubric (scored out of 20)**:\n- Hypothesis (4 pts): Clear, testable, uses if/then format\n- Data Collection (4 pts): Accurate, organized table\n- Graph (4 pts): Correctly labeled axes, appropriate scale\n- Analysis (4 pts): Evidence-based conclusions\n- Scientific Vocabulary (4 pts): Uses key terms correctly\n\n**Quick Check**: Students draw and label a chloroplast from memory',
      closure: 'Think-Pair-Share: "If all plants on Earth suddenly stopped photosynthesizing, what would happen?" Students discuss for 2 minutes, then share with the class.\n\nConnect to next lesson: "Tomorrow we\'ll explore the reverse process: cellular respiration. How do YOU get energy from the food that plants make?"',
      differentiation: '**ELL Students**: Photosynthesis vocabulary cards with images and translations; sentence starters for lab report\n**IEP Students**: Pre-labeled diagram to reference; simplified lab report template with fill-in-the-blank; lab partner support\n**Advanced Learners**: Research the light spectrum and explain why plants are green (reflect green light, absorb red and blue); design their own experiment\n**Kinesthetic Learners**: Act out photosynthesis - students play roles of CO₂, H₂O, light, chlorophyll, glucose, O₂',
      homework: '**Photosynthesis Review (20 min)**:\n1. Complete the photosynthesis diagram worksheet (label reactants, products, and location)\n2. Watch the 5-minute "Photosynthesis: Crash Course Biology" video and write 3 new facts you learned\n3. Challenge: Explain to a family member how plants make their own food. Get them to sign that you explained it!',
    },
    '_default': {
      title: 'Scientific Investigation & Discovery',
      objectives: ['Students will apply the scientific method to investigate the topic', 'Students will collect, analyze, and interpret data using appropriate tools', 'Students will communicate findings using scientific evidence and reasoning'],
      standards: 'NGSS aligned - specific standard depends on topic and grade level',
      materials: ['Lab equipment (as appropriate)', 'Safety goggles and lab aprons', 'Data recording sheets', 'Digital resources and simulations', 'Science journals'],
      warmUp: 'Present a phenomenon or discrepant event related to the topic. Ask students to make observations and generate questions. Record on a class "Wonder Wall."',
      directInstruction: '**Phenomenon Introduction (5 min)**\nPresent the key scientific concept through a real-world phenomenon that students can relate to.\n\n**Core Content (12 min)**\nTeach the essential vocabulary and concepts using the 5E model:\n- Engage → Explore → Explain → Elaborate → Evaluate\nUse diagrams, models, and demonstrations to make abstract concepts concrete.\n\n**Scientific Practices (5 min)**\nModel how scientists ask questions, design investigations, and analyze data.',
      guidedPractice: '**Lab Investigation (15 min)**\nStudents work in lab groups to investigate the concept:\n1. Follow the guided procedure\n2. Collect data carefully\n3. Record observations\n4. Discuss findings with group members\n\nTeacher circulates asking: "What patterns do you notice?" "How does this support or contradict your prediction?"',
      independentPractice: 'Students complete a CER (Claim-Evidence-Reasoning) paragraph:\n- **Claim**: A one-sentence answer to the investigation question\n- **Evidence**: Specific data from the lab that supports the claim\n- **Reasoning**: Scientific explanation connecting the evidence to the claim\n\nInclude a labeled diagram or data visualization.',
      assessment: 'Lab report evaluation using the CER rubric. Exit ticket: "Draw and explain the concept in your own words."',
      closure: 'Return to the opening phenomenon. "Now that we\'ve investigated, how can we explain what we observed at the beginning of class?" Connect to the next lesson in the unit.',
      differentiation: '**ELL**: Visual vocabulary cards, lab procedure with diagrams, sentence frames for CER\n**IEP**: Modified lab procedure, graphic organizer for CER, extended time\n**Advanced**: Design their own follow-up experiment, research current scientific studies\n**Visual/Kinesthetic**: Hands-on models, color-coded diagrams, movement activities',
      homework: 'Review lab notes. Complete the vocabulary practice sheet. Write a "Science in My Life" journal entry connecting today\'s topic to something you observe at home or in nature.',
    },
  },
  English: {
    '_default': {
      title: 'Close Reading & Critical Analysis',
      objectives: ['Students will identify and analyze the author\'s use of literary devices and their effect on meaning', 'Students will construct evidence-based arguments supported by textual evidence', 'Students will engage in collaborative discussion using accountable talk strategies'],
      standards: 'CCSS.ELA-LITERACY.RL.8.1 - Cite textual evidence that most strongly supports an analysis; CCSS.ELA-LITERACY.W.8.1 - Write arguments to support claims with clear reasons and relevant evidence',
      materials: ['Copies of the text (one per student)', 'Highlighters (3 colors)', 'Annotation guide bookmark', 'Discussion sentence starters', 'Graphic organizer for essay planning'],
      warmUp: 'Quick Write (5 min): "Think about a time when something surprised you. How did it change the way you saw the situation?" This connects to themes of perspective and revelation in the text.',
      directInstruction: '**Close Reading Strategy - SOAPSTone (12 min)**\n- **S**peaker: Who is the narrator/speaker?\n- **O**ccasion: What is the context?\n- **A**udience: Who is the intended audience?\n- **P**urpose: Why was this written?\n- **S**ubject: What is the topic?\n- **Tone**: What is the author\'s attitude?\n\nModel the strategy with a short passage on the board. Think aloud through each element. Then apply to today\'s text passage.',
      guidedPractice: '**Collaborative Annotation (15 min)**\nStudents work in pairs to annotate a selected passage:\n- Yellow highlight: Key vocabulary and figurative language\n- Green highlight: Character development moments\n- Pink highlight: Theme-related evidence\n\nAfter annotating, pairs join another pair to form a "Literature Circle" of 4. Each person shares their most important finding.',
      independentPractice: 'Students write a RACE paragraph responding to the analysis question:\n- **R**estate the question\n- **A**nswer the question with a claim\n- **C**ite evidence from the text (at least 2 quotes)\n- **E**xplain how the evidence supports your answer\n\nMinimum 8 sentences. Use the provided graphic organizer to plan before writing.',
      assessment: 'RACE paragraph scored on a 4-point rubric:\n4 = Strong claim, multiple relevant quotes, thorough explanation\n3 = Clear claim, sufficient evidence, adequate explanation\n2 = Vague claim, limited evidence, partial explanation\n1 = Missing components or off-topic',
      closure: 'Share Chair: 2-3 volunteers read their best sentence from their RACE paragraph. Class snaps to show appreciation. Exit ticket: "One thing I understood well today / One thing I want to explore more."',
      differentiation: '**ELL**: Pre-teach vocabulary, provide translated text excerpts, allow bilingual annotations\n**IEP**: Shortened passage, fill-in-the-blank RACE template, audio version of text\n**Advanced**: Compare two passages; write a full essay instead of a paragraph; analyze author\'s style choices\n**Auditory Learners**: Text read aloud, discussion-based assessment option',
      homework: 'Read the next chapter/section. Complete 5 annotations using the SOAPSTone method. Write 3 discussion questions for tomorrow\'s Literature Circle.',
    },
  },
  History: {
    '_default': {
      title: 'Historical Investigation: Sources, Evidence & Perspective',
      objectives: ['Students will analyze primary and secondary sources to understand historical events from multiple perspectives', 'Students will evaluate the credibility and bias of historical sources', 'Students will construct an evidence-based historical argument'],
      standards: 'C3 Framework D2.His.1.6-8 - Analyze connections among events and developments; D2.His.6.6-8 - Analyze how people\'s perspectives influenced what information is available in the historical record',
      materials: ['Primary source document packets (images, letters, newspapers)', 'Source Analysis Toolkit (HIPP: Historical context, Intended audience, Purpose, Point of view)', 'Timeline template', 'Comparison matrix worksheet', 'Chromebooks for digital research'],
      warmUp: 'Present two different newspaper headlines about the SAME historical event (one from each side). Ask: "These are about the same event. Why do they sound so different?" Discuss how perspective shapes how we record history.',
      directInstruction: '**Source Analysis with HIPP (10 min)**\nTeach the HIPP method for analyzing any historical source:\n- **H**istorical Context: What was happening at this time?\n- **I**ntended Audience: Who was this created for?\n- **P**urpose: Why was this source created?\n- **P**oint of View: What perspective does the creator have?\n\nModel with a primary source document. Show how each HIPP element reveals different information about the event.',
      guidedPractice: '**Document Analysis Stations (15 min)**\nSet up 4 stations, each with a different primary source about the same event:\n- Station 1: Government document/speech\n- Station 2: Personal letter or diary entry\n- Station 3: Newspaper article\n- Station 4: Political cartoon or photograph\n\nGroups rotate (4 min each), completing a HIPP analysis card at each station. After all stations, groups discuss: "Which source was most reliable? Why?"',
      independentPractice: 'Students write a "Historical Detective Report":\n1. Summarize the event based on ALL sources (not just one perspective)\n2. Identify at least 2 areas where sources agree\n3. Identify at least 2 areas where sources disagree\n4. Explain which source you find most credible and why\n5. What questions remain unanswered?\n\nMinimum 2 paragraphs with at least 3 specific source references.',
      assessment: '**Historical Detective Report rubric (20 pts)**:\n- Use of multiple sources (5 pts)\n- Identification of bias/perspective (5 pts)\n- Evidence-based argument (5 pts)\n- Historical accuracy (5 pts)\n\nExit Ticket: "Why is it important to look at multiple sources when studying history?"',
      closure: 'Class discussion: "If someone 100 years from now wanted to understand what life was like today, what 3 sources would give them the best picture? What would be missing from those sources?" This reinforces the importance of multiple perspectives.',
      differentiation: '**ELL**: Simplified source excerpts, visual sources emphasized, vocabulary pre-teach\n**IEP**: Graphic organizer for HIPP, reduced stations (2 instead of 4), partner support\n**Advanced**: Compare events across different time periods; analyze how historical interpretations change over time\n**Visual Learners**: Primary source images, political cartoons, maps, and infographics emphasized',
      homework: 'Read the textbook section on the next historical event. Find ONE primary source online related to the topic (use approved databases). Complete a HIPP analysis on it and bring to class.',
    },
  },
};

export function generateSpecializedLessonPlan(subject: string, gradeLevel: string, topic: string, duration: string, additionalNotes?: string) {
  // Try to find a topic-specific bank first, then fall back to subject default
  const subjectBank = LESSON_PLAN_BANKS[subject] || LESSON_PLAN_BANKS['Math'];
  
  // Check for topic keyword matches
  let planTemplate: any = null;
  const topicLower = topic.toLowerCase();
  
  for (const [key, template] of Object.entries(subjectBank)) {
    if (key === '_default') continue;
    if (topicLower.includes(key.toLowerCase())) {
      planTemplate = template;
      break;
    }
  }
  
  // Fall back to subject default
  if (!planTemplate) {
    planTemplate = subjectBank['_default'] || LESSON_PLAN_BANKS['Math']['_default'];
  }
  
  // Customize the template with the specific topic/grade
  const customized = { ...planTemplate };
  
  // Replace generic topic references with the specific topic
  if (!topicLower.includes(customized.title.toLowerCase().replace(/[^a-z]/g, ' ').trim())) {
    customized.title = `${topic}: ${customized.title}`;
  }
  
  // Adjust duration references in homework
  if (duration && customized.homework) {
    customized.homework = customized.homework.replace(/\(20 min\)/, `(${parseInt(duration) <= 30 ? '10' : '20'} min)`);
  }
  
  // Add grade-level reference to standards if not already present
  if (customized.standards && !customized.standards.includes(gradeLevel)) {
    customized.standards = `${gradeLevel} Grade: ${customized.standards}`;
  }
  
  return customized;
}


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
