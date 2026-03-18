import { modules } from '@/lib/tools';
import { generateModePrompt } from '@/lib/prompt-generator';
import type { ToolRecord } from '@/lib/ai-service';

export interface Mode {
    name: string;
    description: string;
    icon?: string;
    prompt?: Promise<string>;
    tools?: ToolRecord;
    show?: boolean;
    desmos?: boolean;
}

export interface Category {
    name: string;
    description: string;
    modes: Record<string, Mode>;
}

const categories: Record<string, Category> = {
    science: {
        name: 'Science',
        description: 'Explore the natural world through physics, chemistry, biology, and computer science',
        modes: {
            physics: {
                show: true,
                name: 'Physics',
                description: 'Study matter, energy, motion, and the fundamental forces of nature',
                icon: '⚛️',
                desmos: true,
            },
            chemistry: {
                show: true,
                name: 'Chemistry',
                description: 'Learn about atoms, molecules, chemical reactions, and the composition of matter',
                icon: '🧪',
            },
            biology: {
                show: true,
                name: 'Biology',
                description: 'Discover life processes, organisms, ecosystems, and biological systems',
                icon: '🧬',
            },
            'computer-science': {
                show: true,
                name: 'Computer Science',
                description: 'Master programming, algorithms, data structures, and computational thinking',
                icon: '💻',
            },
        },
    },
    math: {
        name: 'Math',
        description: 'Develop problem-solving skills through numbers, patterns, and mathematical reasoning',
        modes: {
            general: {
                show: true,
                name: 'General',
                description: 'General mathematics and problem-solving across all topics',
                icon: '📐',
                desmos: true,
            },
            algebra: {
                show: true,
                name: 'Algebra',
                description: 'Master equations, variables, functions, and algebraic manipulation',
                icon: '🔢',
                desmos: true,
            },
            geometry: {
                show: true,
                name: 'Geometry',
                description: 'Study shapes, angles, areas, volumes, and spatial reasoning',
                icon: '📏',
                desmos: true,
            },
            'pre-calculus': {
                show: true,
                name: 'Pre-Calculus',
                description: 'Explore advanced functions, trigonometry, and preparation for calculus',
                icon: '📊',
                desmos: true,
            },
            calculus: {
                show: true,
                name: 'Calculus',
                description: 'Master derivatives, integrals, limits, and rates of change',
                icon: '∫',
                desmos: true,
            },
            'applied-math': {
                show: true,
                name: 'Applied Math',
                description: 'Apply mathematical concepts to real-world problems and applications',
                icon: '🧮',
                desmos: true,
            },
            'discrete-math': {
                show: true,
                name: 'Discrete Math',
                description: 'Study combinatorics, graph theory, logic, and discrete structures',
                icon: '🔷',
            },
            statistics: {
                show: true,
                name: 'Statistics',
                description: 'Analyze data, probability, distributions, and statistical inference',
                icon: '📈',
                desmos: true,
            },
        },
    },
    'social-studies': {
        name: 'Social Studies',
        description: 'Understand society, culture, government, history, and human interactions',
        modes: {
            general: {
                show: true,
                name: 'General History',
                description: 'General history topics and historical analysis across all time periods',
                icon: '📜',
            },
            'world-history': {
                show: true,
                name: 'World History',
                description: 'Study global events, civilizations, and interconnections across continents',
                icon: '🗺️',
            },
            'us-history': {
                show: true,
                name: 'US History',
                description: 'Explore American history from colonization to the present day',
                icon: '🇺🇸',
            },
            'ancient-history': {
                show: true,
                name: 'Ancient History',
                description: 'Discover ancient civilizations including Egypt, Greece, Rome, and Mesopotamia',
                icon: '🏺',
            },
            'medieval-history': {
                show: true,
                name: 'Medieval History',
                description: 'Study the Middle Ages, feudalism, crusades, and medieval societies',
                icon: '⚔️',
            },
            'modern-history': {
                show: true,
                name: 'Modern History',
                description: 'Analyze events from the Renaissance through the 21st century',
                icon: '🏭',
            },
            'european-history': {
                show: true,
                name: 'European History',
                description: 'Explore European civilizations, empires, wars, and cultural movements',
                icon: '🇪🇺',
            },
            'asian-history': {
                show: true,
                name: 'Asian History',
                description: 'Study the rich histories of China, Japan, India, and other Asian civilizations',
                icon: '🏯',
            },
            'african-history': {
                show: true,
                name: 'African History',
                description: 'Discover African kingdoms, colonialism, independence movements, and cultures',
                icon: '🌴',
            },
            geography: {
                show: true,
                name: 'Geography',
                description: 'Study Earth\'s physical features, climate, populations, and human-environment interactions',
                icon: '🌍',
            },
            'american-civics': {
                show: true,
                name: 'American Civics',
                description: 'Learn about US government, Constitution, citizenship, and democratic processes',
                icon: '🏛️',
            },
            'world-civics': {
                show: true,
                name: 'World Civics',
                description: 'Understand global governments, international relations, and civic responsibilities',
                icon: '🌐',
            },
        },
    },
    'decision-sciences': {
        name: 'Decision Sciences',
        description: 'Apply analytical thinking to business, economics, and strategic decision-making',
        modes: {
            business: {
                show: true,
                name: 'Business',
                description: 'Explore entrepreneurship, management, marketing, and business operations',
                icon: '💼',
            },
            economics: {
                show: true,
                name: 'Economics',
                description: 'Study supply and demand, markets, money, and economic decision-making',
                icon: '💰',
                desmos: true,
            },
            finance: {
                show: true,
                name: 'Finance',
                description: 'Master financial analysis, investment strategies, and money management principles',
                icon: '📊',
                desmos: true,
            },
        },
    },
    engineering: {
        name: 'Engineering',
        description: 'Apply scientific and mathematical principles to design, build, and solve real-world problems',
        modes: {
            mechanical: {
                show: true,
                name: 'Mechanical Engineering',
                description: 'Study mechanics, thermodynamics, materials, and mechanical system design',
                icon: '⚙️',
            },
            electrical: {
                show: true,
                name: 'Electrical Engineering',
                description: 'Explore circuits, electronics, signals, and electrical system design',
                icon: '⚡',
            },
            civil: {
                show: true,
                name: 'Civil Engineering',
                description: 'Design infrastructure, structures, transportation systems, and public works',
                icon: '🏗️',
            },
            chemical: {
                show: true,
                name: 'Chemical Engineering',
                description: 'Apply chemistry to industrial processes, materials, and chemical systems',
                icon: '⚗️',
            },
            computer: {
                show: true,
                name: 'Computer Engineering',
                description: 'Design hardware, embedded systems, and computer architecture',
                icon: '🖥️',
            },
            industrial: {
                show: true,
                name: 'Industrial Engineering',
                description: 'Optimize processes, systems, and operations for efficiency and productivity',
                icon: '🏭',
            },
        },
    },
    english: {
        name: 'English',
        description: 'Master communication skills through reading, writing, speaking, and literary analysis',
        modes: {
            general: {
                show: true,
                name: 'General',
                description: 'General English language skills and communication',
                icon: '📝',
            },
            literature: {
                show: true,
                name: 'Literature',
                description: 'Analyze novels, poetry, drama, and literary techniques across different genres',
                icon: '📚',
            },
            grammar: {
                show: true,
                name: 'Grammar',
                description: 'Master sentence structure, punctuation, and proper language usage',
                icon: '✏️',
            },
            vocabulary: {
                show: true,
                name: 'Vocabulary',
                description: 'Expand word knowledge, etymology, and effective word choice',
                icon: '📖',
            },
            'reading-and-writing': {
                show: true,
                name: 'Reading and Writing',
                description: 'Develop comprehension skills and effective written communication',
                icon: '✍️',
            },
            'speaking-and-listening': {
                show: true,
                name: 'Speaking and Listening',
                description: 'Improve oral communication, presentation skills, and active listening',
                icon: '🎤',
            },
        },
    },
    'foreign-languages': {
        name: 'Foreign Languages',
        description: 'Learn new languages to communicate across cultures and expand global perspectives',
        modes: {
            spanish: {
                show: true,
                name: 'Spanish',
                description: 'Master Spanish language, grammar, vocabulary, and cultural understanding',
                icon: '🇪🇸',
            },
            french: {
                show: true,
                name: 'French',
                description: 'Learn French language, pronunciation, grammar, and Francophone culture',
                icon: '🇫🇷',
            },
            german: {
                show: true,
                name: 'German',
                description: 'Study German language, grammar, vocabulary, and German-speaking cultures',
                icon: '🇩🇪',
            },
            italian: {
                show: true,
                name: 'Italian',
                description: 'Explore Italian language, culture, and communication skills',
                icon: '🇮🇹',
            },
        },
    },
    arts: {
        name: 'Arts',
        description: 'Express creativity through visual arts, music, and artistic exploration',
        modes: {
            art: {
                show: true,
                name: 'Art',
                description: 'Develop artistic skills, creativity, and appreciation for visual arts',
                icon: '🎨',
            },
            music: {
                show: true,
                name: 'Music',
                description: 'Learn music theory, instruments, composition, and musical appreciation',
                icon: '🎵',
            },
        },
    },
    'health-and-fitness': {
        name: 'Health and Fitness',
        description: 'Promote physical wellness, nutrition, mental health, and healthy lifestyle choices',
        modes: {
            'health-and-wellness': {
                show: true,
                name: 'Health and Wellness',
                description: 'Explore nutrition, exercise, mental health, and holistic wellness practices',
                icon: '💚',
            },
            'fitness-and-strength': {
                show: true,
                name: 'Fitness and Strength',
                description: 'Build physical strength, endurance, and flexibility through exercise and strength training',
                icon: '💪',
            },
        },
    },
    general: {
        name: 'General',
        description: 'General academic support and cross-curricular learning assistance',
        modes: {
            general: {
                show: true,
                name: 'General',
                description: 'General academic help and study support across all subjects',
                icon: '📋',
            },
        },
    },
}

// Generate prompts programmatically for each mode
for (const topicKey of Object.keys(categories)) {
    const topicKeyTyped = topicKey;
    const topic = categories[topicKeyTyped];
    const modes = topic.modes;

    for (const modeKey of Object.keys(modes)) {
        const mode = modes[modeKey];

        // Generate the prompt using the mode's name and category
        const prompt = generateModePrompt(mode.name, topicKey);
        mode.prompt = Promise.resolve(prompt);

        // Set default tools if not specified
        if (!mode.tools) {
            mode.tools = modules;
        }

        modes[modeKey] = mode;
    }

    categories[topicKeyTyped] = topic;
}

// Export auto-generated types based on the categories object
export type CategoryName = keyof typeof categories;

export type ModeName = {
    [K in keyof typeof categories]: keyof typeof categories[K]['modes']
}[keyof typeof categories];

export default categories;
