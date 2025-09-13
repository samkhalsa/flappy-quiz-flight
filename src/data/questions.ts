import { Question } from '@/types/game';

export const QUESTIONS: Record<'math' | 'science' | 'language', Question[]> = {
  math: [
    {
      text: "What is 7 × 8?",
      options: ["54", "56", "64", "48"],
      correctAnswer: 1,
      category: 'math'
    },
    {
      text: "What is 15% of 80?",
      options: ["10", "12", "15", "18"],
      correctAnswer: 1,
      category: 'math'
    },
    {
      text: "What is √64?",
      options: ["6", "7", "8", "9"],
      correctAnswer: 2,
      category: 'math'
    },
    {
      text: "What is 144 ÷ 12?",
      options: ["11", "12", "13", "14"],
      correctAnswer: 1,
      category: 'math'
    },
    {
      text: "What is 2³?",
      options: ["6", "8", "9", "12"],
      correctAnswer: 1,
      category: 'math'
    }
  ],
  science: [
    {
      text: "What gas do plants absorb from the atmosphere?",
      options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
      correctAnswer: 2,
      category: 'science'
    },
    {
      text: "How many bones are in an adult human body?",
      options: ["186", "206", "226", "246"],
      correctAnswer: 1,
      category: 'science'
    },
    {
      text: "What is the chemical symbol for gold?",
      options: ["Go", "Gd", "Au", "Ag"],
      correctAnswer: 2,
      category: 'science'
    },
    {
      text: "Which planet is closest to the Sun?",
      options: ["Venus", "Earth", "Mercury", "Mars"],
      correctAnswer: 2,
      category: 'science'
    },
    {
      text: "What is the speed of light?",
      options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
      correctAnswer: 0,
      category: 'science'
    }
  ],
  language: [
    {
      text: "What is the plural of 'mouse'?",
      options: ["Mouses", "Mice", "Mouse", "Meese"],
      correctAnswer: 1,
      category: 'language'
    },
    {
      text: "Which word is a synonym for 'happy'?",
      options: ["Sad", "Angry", "Joyful", "Tired"],
      correctAnswer: 2,
      category: 'language'
    },
    {
      text: "What is the past tense of 'run'?",
      options: ["Runned", "Ran", "Running", "Runs"],
      correctAnswer: 1,
      category: 'language'
    },
    {
      text: "Which is the correct spelling?",
      options: ["Recieve", "Receive", "Receave", "Receve"],
      correctAnswer: 1,
      category: 'language'
    },
    {
      text: "What type of word is 'quickly'?",
      options: ["Noun", "Verb", "Adjective", "Adverb"],
      correctAnswer: 3,
      category: 'language'
    }
  ]
};

export function getRandomQuestion(category: 'math' | 'science' | 'language'): Question {
  const categoryQuestions = QUESTIONS[category];
  const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
  return categoryQuestions[randomIndex];
}