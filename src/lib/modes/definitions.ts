import config from '@/lib/ai.config';
import type { Category } from '@/lib/modes';

const modeDefinitions: Record<string, Category> = {
    science: {
        name: 'Science',
        description: 'Explore the natural world through physics, chemistry, biology, and computer science',
        modes: {
            physics: {
                name: 'Physics',
                description: 'Study matter, energy, motion, and the fundamental forces of nature',
                icon: '⚛️',
                desmos: true,
                character: {
                    name: 'Newt Maxwell',
                    personality: 'curious and energetic, sees physics in everything from skateboards to sunsets',
                    interests: ['rollercoasters', 'stargazing', 'taking apart old gadgets'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#2563eb"/><g fill="none" stroke="#fff" stroke-width="1.4"><ellipse cx="12" cy="12" rx="7.5" ry="3"/><ellipse cx="12" cy="12" rx="7.5" ry="3" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="7.5" ry="3" transform="rotate(120 12 12)"/></g><circle cx="12" cy="12" r="1.5" fill="#fff"/></svg>',
                },
            },
            chemistry: {
                name: 'Chemistry',
                description: 'Learn about atoms, molecules, chemical reactions, and the composition of matter',
                icon: '🧪',
                character: {
                    name: 'Ivy Pauling',
                    personality: 'bubbly and precise, gets excited when things react',
                    interests: ['baking experiments', 'candle making', 'colorful tea blends'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#7c3aed"/><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5h4M10.5 5v5L6.5 18a1 1 0 0 0 1 1.5h9a1 1 0 0 0 1-1.5L13.5 10V5M8.8 14.5h6.4"/></g></svg>',
                },
            },
            biology: {
                name: 'Biology',
                description: 'Discover life processes, organisms, ecosystems, and biological systems',
                icon: '🧬',
                character: {
                    name: 'Fern Bloom',
                    personality: 'warm and observant, patient like someone who watches plants grow',
                    interests: ['birdwatching', 'terrariums', 'weekend nature walks'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#16a34a"/><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18C6 10 10 6 18 6c0 8-4 12-12 12zM6 18l7-7"/></g></svg>',
                },
            },
            'computer-science': {
                name: 'Computer Science',
                description: 'Master programming, algorithms, data structures, and computational thinking',
                icon: '💻',
                character: {
                    name: 'Byte Hopper',
                    personality: 'laid-back and logical, loves a clean solution and a good bug story',
                    interests: ['side projects', 'mechanical keyboards', 'retro games'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#0f766e"/><g fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/></g></svg>',
                },
            },
        },
    },
    math: {
        name: 'Math',
        description: 'Develop problem-solving skills through numbers, patterns, and mathematical reasoning',
        modes: {
            general: {
                name: 'General',
                description: 'General mathematics and problem-solving across all topics',
                icon: '📐',
                desmos: true,
                character: {
                    name: 'Penny Sumner',
                    personality: 'upbeat and reassuring, makes numbers feel friendly',
                    interests: ['puzzle books', 'board games', 'budgeting spreadsheets'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#9333ea"/><g fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v12M6 12h12"/></g></svg>',
                },
            },
            algebra: {
                name: 'Algebra',
                description: 'Master equations, variables, functions, and algebraic manipulation',
                icon: '🔢',
                desmos: true,
                character: {
                    name: 'Xavier Pell',
                    personality: 'easygoing and patient, loves solving for the unknown',
                    interests: ['mystery novels', 'escape rooms', 'crosswords'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#c026d3"/><g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M8 8l8 8M16 8l-8 8"/></g></svg>',
                },
            },
            geometry: {
                name: 'Geometry',
                description: 'Study shapes, angles, areas, volumes, and spatial reasoning',
                icon: '📏',
                desmos: true,
                character: {
                    name: 'Angie Lane',
                    personality: 'creative and visual, always sketching a diagram',
                    interests: ['origami', 'architecture photos', 'tiling patterns'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#6d28d9"/><g fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6l7 12H5z"/></g></svg>',
                },
            },
            'pre-calculus': {
                name: 'Pre-Calculus',
                description: 'Explore advanced functions, trigonometry, and preparation for calculus',
                icon: '📊',
                desmos: true,
                character: {
                    name: 'Sine Cosgrove',
                    personality: 'calm and steady, good at connecting the dots between topics',
                    interests: ['surfing videos', 'music production', 'long bike rides'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#4f46e5"/><g fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12c2.5-7 5.5-7 8 0s5.5 7 8 0"/></g></svg>',
                },
            },
            calculus: {
                name: 'Calculus',
                description: 'Master derivatives, integrals, limits, and rates of change',
                icon: '∫',
                desmos: true,
                character: {
                    name: 'Leo Newton',
                    personality: 'thoughtful and encouraging, never rushes you toward the answer',
                    interests: ['chess', 'astronomy podcasts', 'strong coffee'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#4338ca"/><g fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6.5c-1.3-1-2.5-.3-2.5 1.5v8c0 1.8-1.2 2.5-2.5 1.5"/></g></svg>',
                },
            },
            'applied-math': {
                name: 'Applied Math',
                description: 'Apply mathematical concepts to real-world problems and applications',
                icon: '🧮',
                desmos: true,
                character: {
                    name: 'Maya Kovac',
                    personality: 'practical and curious, always asks where the math shows up in real life',
                    interests: ['weather maps', 'city transit', 'sports stats'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#7e22ce"/><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6v12h12M8.5 15l3-4 2.5 2 3.5-5"/></g></svg>',
                },
            },
            'discrete-math': {
                name: 'Discrete Math',
                description: 'Study combinatorics, graph theory, logic, and discrete structures',
                icon: '🔷',
                character: {
                    name: 'Gray Euler',
                    personality: 'sharp and playful, loves a neat proof and a clever counting trick',
                    interests: ['card games', 'logic puzzles', 'building with blocks'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#5b21b6"/><g stroke="#fff" stroke-width="1.4" stroke-linecap="round"><path d="M8 8l8 3M8 8l3 9M16 11l-5 6"/></g><g fill="#fff"><circle cx="8" cy="8" r="2"/><circle cx="16" cy="11" r="2"/><circle cx="11" cy="17" r="2"/></g></svg>',
                },
            },
            statistics: {
                name: 'Statistics',
                description: 'Analyze data, probability, distributions, and statistical inference',
                icon: '📈',
                desmos: true,
                character: {
                    name: 'Stella Fisher',
                    personality: 'grounded and funny, skeptical of a number until she sees where it came from',
                    interests: ['survey quirks', 'true crime podcasts', 'baseball'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#8b5cf6"/><g fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17c3 0 4-10 8-10s5 10 8 10"/></g></svg>',
                },
            },
        },
    },
    'social-studies': {
        name: 'Social Studies',
        description: 'Understand society, culture, government, history, and human interactions',
        modes: {
            general: {
                name: 'General History',
                description: 'General history topics and historical analysis across all time periods',
                icon: '📜',
                character: {
                    name: 'Atlas Mercer',
                    personality: 'friendly and well-traveled, connects past and present',
                    interests: ['maps', 'trivia nights', 'documentaries'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#b45309"/><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5h8M8 19h8M8 5c0 4 8 4 8 7s-8 3-8 7"/></g></svg>',
                },
            },
            'world-history': {
                name: 'World History',
                description: 'Study global events, civilizations, and interconnections across continents',
                icon: '🗺️',
                character: {
                    name: 'Dara Nakamura',
                    personality: 'enthusiastic storyteller who likes seeing how cultures connect',
                    interests: ['street food', 'museums', 'language apps'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#c2410c"/><g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><path d="M5 12h14M12 5c-3 3-3 11 0 14M12 5c3 3 3 11 0 14"/></g></svg>',
                },
            },
            'us-history': {
                name: 'US History',
                description: 'Explore American history from colonization to the present day',
                icon: '🇺🇸',
                character: {
                    name: 'Sam Hamilton',
                    personality: 'down-to-earth and thoughtful, likes hearing every side of a story',
                    interests: ['road trips', 'historic sites', 'diner pie'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1d4ed8"/><path fill="#fff" d="M12 5l2.1 4.6 5 .6-3.7 3.4 1 5-4.4-2.4-4.4 2.4 1-5-3.7-3.4 5-.6z"/></svg>',
                },
            },
            'ancient-history': {
                name: 'Ancient History',
                description: 'Discover ancient civilizations including Egypt, Greece, Rome, and Mesopotamia',
                icon: '🏺',
                character: {
                    name: 'Cleo Ramsey',
                    personality: 'dramatic in a fun way, brings old civilizations to life',
                    interests: ['pottery', 'mythology', 'archaeology dig videos'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#a16207"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18h12M8 9v9M12 9v9M16 9v9M12 5l6 4H6z"/></g></svg>',
                },
            },
            'medieval-history': {
                name: 'Medieval History',
                description: 'Study the Middle Ages, feudalism, crusades, and medieval societies',
                icon: '⚔️',
                character: {
                    name: 'Rowan Knight',
                    personality: 'cozy and wry, loves castles and the stories behind them',
                    interests: ['fantasy novels', 'calligraphy', 'renaissance fairs'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#9f1239"/><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5l2 3v8h-4V8zM8.5 16h7M12 16v3"/></g></svg>',
                },
            },
            'modern-history': {
                name: 'Modern History',
                description: 'Analyze events from the Renaissance through the 21st century',
                icon: '🗞️',
                character: {
                    name: 'Nova Sinclair',
                    personality: 'sharp and current, links today\'s headlines to their roots',
                    interests: ['podcasts', 'vintage posters', 'record collecting'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#be123c"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h12v12H6zM8.5 9h7M8.5 12h7M8.5 15h4"/></g></svg>',
                },
            },
            'european-history': {
                name: 'European History',
                description: 'Explore European civilizations, empires, wars, and cultural movements',
                icon: '🇪🇺',
                character: {
                    name: 'Elise Marchand',
                    personality: 'polished and kind, with a soft spot for old cities',
                    interests: ['train travel', 'cafes', 'classical music'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1e40af"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5l-4 14M12 5l4 14M9.5 13h5M8 19h8"/></g></svg>',
                },
            },
            'asian-history': {
                name: 'Asian History',
                description: 'Study the rich histories of China, Japan, India, and other Asian civilizations',
                icon: '🏯',
                character: {
                    name: 'Mei Tang',
                    personality: 'calm and thoughtful, patient with big timelines',
                    interests: ['tea ceremonies', 'ink painting', 'regional cooking'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#b91c1c"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l7-3 7 3M7.5 13l4.5-2 4.5 2M10 18h4M12 6v12"/></g></svg>',
                },
            },
            'african-history': {
                name: 'African History',
                description: 'Discover African kingdoms, colonialism, independence movements, and cultures',
                icon: '🌴',
                character: {
                    name: 'Amara Okafor',
                    personality: 'vibrant and proud, an energetic storyteller',
                    interests: ['music', 'textiles', 'oral history recordings'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#d97706"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 5v2M12 17v2M5 12h2M17 12h2M7 7l1.4 1.4M15.6 15.6L17 17M7 17l1.4-1.4M15.6 8.4L17 7"/></g></svg>',
                },
            },
            geography: {
                name: 'Geography',
                description: 'Study Earth\'s physical features, climate, populations, and human-environment interactions',
                icon: '🌍',
                character: {
                    name: 'Terra Landry',
                    personality: 'adventurous and upbeat, always has a place she wants to show you',
                    interests: ['hiking trails', 'globes', 'travel vlogs'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#15803d"/><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19s5-4.5 5-9a5 5 0 0 0-10 0c0 4.5 5 9 5 9z"/><circle cx="12" cy="10" r="1.8"/></g></svg>',
                },
            },
            'american-civics': {
                name: 'American Civics',
                description: 'Learn about US government, Constitution, citizenship, and democratic processes',
                icon: '🏛️',
                character: {
                    name: 'Jordan Madison',
                    personality: 'fair-minded and clear, explains how things work without taking sides',
                    interests: ['local council meetings', 'debate club', 'political cartoons'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1e3a8a"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18h14M7 18v-6M12 18v-6M17 18v-6M5 11h14L12 6z"/></g></svg>',
                },
            },
            'world-civics': {
                name: 'World Civics',
                description: 'Understand global governments, international relations, and civic responsibilities',
                icon: '🌐',
                character: {
                    name: 'Noor Haddad',
                    personality: 'diplomatic and curious, enjoys comparing how different countries run things',
                    interests: ['model UN', 'world news', 'language exchange'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#0e7490"/><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 19V5M7 6h10l-2 3 2 3H7"/></g></svg>',
                },
            },
        },
    },
    'decision-sciences': {
        name: 'Decision Sciences',
        description: 'Apply analytical thinking to business, economics, and strategic decision-making',
        modes: {
            business: {
                name: 'Business',
                description: 'Explore entrepreneurship, management, marketing, and business operations',
                icon: '💼',
                character: {
                    name: 'Biz Ventura',
                    personality: 'quick and friendly, turns big ideas into simple steps',
                    interests: ['startup stories', 'coffee shops', 'pitch decks'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#0369a1"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9h12v9H6zM9.5 9V7h5v2M6 13h12"/></g></svg>',
                },
            },
            economics: {
                name: 'Economics',
                description: 'Study supply and demand, markets, money, and economic decision-making',
                icon: '💰',
                desmos: true,
                character: {
                    name: 'Cass Keynes',
                    personality: 'witty and observant, finds trade-offs in everyday choices',
                    interests: ['thrift stores', 'farmers markets', 'strategy games'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#0f766e"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6.5"/><path d="M14 10c0-1.3-4-1.3-4 0s4 1.3 4 3-4 1.7-4 0M12 8v8"/></g></svg>',
                },
            },
            finance: {
                name: 'Finance',
                description: 'Master financial analysis, investment strategies, and money management principles',
                icon: '💹',
                desmos: true,
                character: {
                    name: 'Penelope Graham',
                    personality: 'steady and encouraging, makes money topics feel less scary',
                    interests: ['budgeting apps', 'tidy planners', 'saving for trips'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#047857"/><g fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17l5-5 3 3 6-7M15 8h4v4"/></g></svg>',
                },
            },
        },
    },
    engineering: {
        name: 'Engineering',
        description: 'Apply scientific and mathematical principles to design, build, and solve real-world problems',
        modes: {
            mechanical: {
                name: 'Mechanical Engineering',
                description: 'Study mechanics, thermodynamics, materials, and mechanical system design',
                icon: '⚙️',
                character: {
                    name: 'Gear Rollins',
                    personality: 'hands-on and cheerful, loves anything that moves',
                    interests: ['bike repair', '3D printing', 'model engines'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#475569"/><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.5"/><path d="M12 5v2.5M12 16.5V19M5 12h2.5M16.5 12H19M7 7l1.8 1.8M15.2 15.2L17 17M7 17l1.8-1.8M15.2 8.8L17 7"/></g></svg>',
                },
            },
            electrical: {
                name: 'Electrical Engineering',
                description: 'Explore circuits, electronics, signals, and electrical system design',
                icon: '⚡',
                character: {
                    name: 'Watt Faraday',
                    personality: 'bright and a bit zappy, great at making circuits feel simple',
                    interests: ['soldering projects', 'synths', 'string lights'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ca8a04"/><path fill="#fff" d="M13 5l-5 8h4l-1 6 5-8h-4z"/></svg>',
                },
            },
            civil: {
                name: 'Civil Engineering',
                description: 'Design infrastructure, structures, transportation systems, and public works',
                icon: '🏗️',
                character: {
                    name: 'Bridget Brooks',
                    personality: 'dependable and practical, loves things built to last',
                    interests: ['bridge photography', 'LEGO cities', 'skyline walks'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#57534e"/><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h16M6 14v4M18 14v4M6 14c2-6 10-6 12 0"/></g></svg>',
                },
            },
            chemical: {
                name: 'Chemical Engineering',
                description: 'Apply chemistry to industrial processes, materials, and chemical systems',
                icon: '⚗️',
                character: {
                    name: 'Flo Haber',
                    personality: 'methodical and warm, good at following a process step by step',
                    interests: ['cooking from scratch', 'brewing', 'plant-based recipes'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#6d28d9"/><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5l6 3.5v7L12 19l-6-3.5v-7z"/></g></svg>',
                },
            },
            computer: {
                name: 'Computer Engineering',
                description: 'Design hardware, embedded systems, and computer architecture',
                icon: '🖥️',
                character: {
                    name: 'Chip Moore',
                    personality: 'friendly and nerdy, bridges hardware and software',
                    interests: ['building PCs', 'microcontroller kits', 'gadget reviews'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#334155"/><g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 8h8v8H8zM10.5 5v3M13.5 5v3M10.5 16v3M13.5 16v3M5 10.5h3M5 13.5h3M16 10.5h3M16 13.5h3"/></g></svg>',
                },
            },
            industrial: {
                name: 'Industrial Engineering',
                description: 'Optimize processes, systems, and operations for efficiency and productivity',
                icon: '🏭',
                character: {
                    name: 'Flow Taylor',
                    personality: 'organized and upbeat, always looking for a smoother way',
                    interests: ['planners', 'factory tour videos', 'puzzle games'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#c2410c"/><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 9a6 6 0 0 0-10-1.5M7 15a6 6 0 0 0 10 1.5M7 5v3.5h3.5M17 19v-3.5h-3.5"/></g></svg>',
                },
            },
        },
    },
    english: {
        name: 'English',
        description: 'Master communication skills through reading, writing, speaking, and literary analysis',
        modes: {
            general: {
                name: 'General',
                description: 'General English language skills and communication',
                icon: '📝',
                character: {
                    name: 'Quill Penn',
                    personality: 'kind and thoughtful, loves words and helping people say what they mean',
                    interests: ['journaling', 'bookstores', 'poetry nights'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#db2777"/><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12v8H11l-3 3v-3H6z"/></g></svg>',
                },
            },
            literature: {
                name: 'Literature',
                description: 'Analyze novels, poetry, drama, and literary techniques across different genres',
                icon: '📚',
                character: {
                    name: 'Austen Shelley',
                    personality: 'dreamy but sharp, loves digging into themes and characters',
                    interests: ['book clubs', 'rainy day reading', 'annotated paperbacks'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#be185d"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7c3-1 5 0 7 1.5C14 7 16 6 19 7v10c-3-1-5 0-7 1.5C10 17 8 16 5 17zM12 8.5V18"/></g></svg>',
                },
            },
            grammar: {
                name: 'Grammar',
                description: 'Master sentence structure, punctuation, and proper language usage',
                icon: '✏️',
                character: {
                    name: 'Comma White',
                    personality: 'gentle and a little cheeky, never makes you feel bad about a mistake',
                    interests: ['crosswords', 'proofreading menus for fun', 'tea'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#e11d48"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18l1-4 8-8 3 3-8 8zM14 7l3 3"/></g></svg>',
                },
            },
            vocabulary: {
                name: 'Vocabulary',
                description: 'Expand word knowledge, etymology, and effective word choice',
                icon: '📖',
                character: {
                    name: 'Lexi Webster',
                    personality: 'playful and quick, collects new words like trading cards',
                    interests: ['word games', 'etymology threads', 'flashcard doodles'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#c026d3"/><g fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18l5-12 5 12M9 14h6"/></g></svg>',
                },
            },
            'reading-and-writing': {
                name: 'Reading and Writing',
                description: 'Develop comprehension skills and effective written communication',
                icon: '✍️',
                character: {
                    name: 'Paige Turnbull',
                    personality: 'supportive and patient, great with blank pages',
                    interests: ['short stories', 'library corners', 'fountain pens'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#a21caf"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5l4 7-4 7-4-7zM12 12v3"/></g></svg>',
                },
            },
            'speaking-and-listening': {
                name: 'Speaking and Listening',
                description: 'Improve oral communication, presentation skills, and active listening',
                icon: '🎤',
                character: {
                    name: 'Echo Carnegie',
                    personality: 'confident and encouraging, a good listener first',
                    interests: ['podcasts', 'open mic nights', 'improv'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#9d174d"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5h4v7a2 2 0 0 1-4 0zM7.5 11a4.5 4.5 0 0 0 9 0M12 15.5V19M9.5 19h5"/></g></svg>',
                },
            },
        },
    },
    'foreign-languages': {
        name: 'Foreign Languages',
        description: 'Learn new languages to communicate across cultures and expand global perspectives',
        modes: {
            spanish: {
                name: 'Spanish',
                description: 'Master Spanish language, grammar, vocabulary, and cultural understanding',
                icon: '🇪🇸',
                character: {
                    name: 'Sol Herrera',
                    personality: 'sunny and encouraging, celebrates every small win',
                    interests: ['salsa classes', 'telenovelas', 'street tacos'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#dc2626"/><g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M12 7v.1M12 10.5V17"/></g></svg>',
                },
            },
            french: {
                name: 'French',
                description: 'Learn French language, pronunciation, grammar, and Francophone culture',
                icon: '🇫🇷',
                character: {
                    name: 'Margaux Laurent',
                    personality: 'charming and relaxed, patient with tricky pronunciation',
                    interests: ['bakeries', 'indie films', 'sketching cafes'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#2563eb"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10h9v4a4 4 0 0 1-4 4h-1a4 4 0 0 1-4-4zM15 11h1.5a1.8 1.8 0 0 1 0 3.6H15M9 5v2M12 5v2"/></g></svg>',
                },
            },
            german: {
                name: 'German',
                description: 'Study German language, grammar, vocabulary, and German-speaking cultures',
                icon: '🇩🇪',
                character: {
                    name: 'Finn Becker',
                    personality: 'dry-humored and clear, makes long words feel manageable',
                    interests: ['board games', 'hiking', 'bike trails'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#b45309"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h9v10H6zM15 10h2.5a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5H15M6 8c0-2 3-2 4-1 1-1.5 5-1 5 1"/></g></svg>',
                },
            },
            italian: {
                name: 'Italian',
                description: 'Explore Italian language, culture, and communication skills',
                icon: '🇮🇹',
                character: {
                    name: 'Gia Rossi',
                    personality: 'expressive and warm, believes language is best learned with good food',
                    interests: ['pasta nights', 'opera clips', 'coastal travel videos'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#15803d"/><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18L6 8c4-3 8-3 12 0zM10 11v.1M13.5 12.5v.1"/></g></svg>',
                },
            },
        },
    },
    arts: {
        name: 'Arts',
        description: 'Express creativity through visual arts, music, and artistic exploration',
        modes: {
            art: {
                name: 'Art',
                description: 'Develop artistic skills, creativity, and appreciation for visual arts',
                icon: '🎨',
                character: {
                    name: 'Hue Sargent',
                    personality: 'creative and gentle, encourages trying things and making a mess',
                    interests: ['sketchbooks', 'gallery visits', 'watercolor'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ea580c"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a7 7 0 1 0 0 14c1.5 0 1.8-1 1.2-2-.7-1.2.2-2.5 1.6-2.5H17a2 2 0 0 0 2-2c0-4-3-7.5-7-7.5zM8.5 11v.1M11 8.5v.1M14.5 9v.1"/></g></svg>',
                },
            },
            music: {
                name: 'Music',
                description: 'Learn music theory, instruments, composition, and musical appreciation',
                icon: '🎵',
                character: {
                    name: 'Melody Strauss',
                    personality: 'cheerful and rhythmic, hums while she thinks',
                    interests: ['vinyl records', 'live shows', 'writing songs'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#9333ea"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17V7l8-2v10M10 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM18 15a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/></g></svg>',
                },
            },
        },
    },
    'health-and-fitness': {
        name: 'Health and Fitness',
        description: 'Promote physical wellness, nutrition, mental health, and healthy lifestyle choices',
        modes: {
            'health-and-wellness': {
                name: 'Health and Wellness',
                description: 'Explore nutrition, exercise, mental health, and holistic wellness practices',
                icon: '💚',
                character: {
                    name: 'Willow Brook',
                    personality: 'calm and caring, never preachy',
                    interests: ['yoga', 'herbal tea', 'long walks'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#059669"/><g fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18s-6-3.8-6-8a3.2 3.2 0 0 1 6-1.6A3.2 3.2 0 0 1 18 10c0 4.2-6 8-6 8z"/></g></svg>',
                },
            },
            'fitness-and-strength': {
                name: 'Fitness and Strength',
                description: 'Build physical strength, endurance, and flexibility through exercise and strength training',
                icon: '💪',
                character: {
                    name: 'Rex Sandow',
                    personality: 'motivating and upbeat, big on form and rest days',
                    interests: ['lifting', 'trail runs', 'meal prep'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#dc2626"/><g fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9v6M10 7v10M14 7v10M17 9v6M10 12h4M5 11v2M19 11v2"/></g></svg>',
                },
            },
        },
    },
    general: {
        name: 'General',
        description: 'General academic support and cross-curricular learning assistance',
        modes: {
            general: {
                name: 'General',
                description: 'General academic help and study support across all subjects',
                icon: '📋',
                character: {
                    name: 'Stu Bennett',
                    personality: 'friendly and adaptable, ready to help with any subject',
                    interests: ['planners', 'highlighters', 'good playlists'],
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1d8aff"/><g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10l8-4 8 4-8 4zM7.5 12v4c2.5 2 6.5 2 9 0v-4"/></g></svg>',
                },
            },
        },
    },
    support: {
        name: 'Support',
        description: 'Get help with Studify itself: how the app works, issues, and feedback',
        modes: {
            margo: {
                show: false,
                name: 'Margo Page',
                description: 'Chat with Margo Page, our Support Lead, about the app, issues, and feedback',
                icon: '🎧',
                sidebarSections: { studyMaterials: false },
                excludedTools: config.contentGenerationExcludeTools,
            },
        },
    },
}

export default modeDefinitions;
