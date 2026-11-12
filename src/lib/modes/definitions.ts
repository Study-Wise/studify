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
                    colors: {
                        background: '#22c55e',
                        foreground: '#7c3aed',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#22c55e"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#7c3aed"/><g fill="none" stroke="#fff" stroke-width=".5"><ellipse cx="12" cy="18.3" rx="2.4" ry="1"/><ellipse cx="12" cy="18.3" rx="2.4" ry="1" transform="rotate(60 12 18.3)"/><ellipse cx="12" cy="18.3" rx="2.4" ry="1" transform="rotate(120 12 18.3)"/></g><circle cx="12" cy="18.3" r=".4" fill="#fff"/><circle cx="12" cy="9.3" r="3.6" fill="#f1c27d"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#4a3222"/></svg>',
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
                    colors: {
                        background: '#22c55e',
                        foreground: '#15803d',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#22c55e"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#2b2b2b"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#15803d"/><path d="M11.1 16.6h1.8M11.4 16.6v1.5l-1 1.7a.5.5 0 0 0 .4.8h2.4a.5.5 0 0 0 .4-.8l-1-1.7v-1.5" fill="none" stroke="#fff" stroke-width=".5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="9.3" r="3.6" fill="#e0ac69"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#2b2b2b"/></svg>',
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
                    colors: {
                        background: '#22c55e',
                        foreground: '#2563eb',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#22c55e"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#8b4513"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#2563eb"/><path d="M10.6 16.6c2 .8 2 2.2 0 3M13.4 16.6c-2 .8-2 2.2 0 3M10.9 17.4h2.2M10.9 18.9h2.2" fill="none" stroke="#fff" stroke-width=".5" stroke-linecap="round"/><circle cx="12" cy="9.3" r="3.6" fill="#ffdbac"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#8b4513"/></svg>',
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
                    colors: {
                        background: '#22c55e',
                        foreground: '#1f2937',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#22c55e"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#1f2937"/><path d="M10.6 17.2l-1.2 1.1 1.2 1.1M13.4 17.2l1.2 1.1-1.2 1.1M12.6 16.8l-1.2 2.9" fill="none" stroke="#4ade80" stroke-width=".5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="9.3" r="3.6" fill="#f1c27d"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#3b2f2f"/><g fill="none" stroke="#111827" stroke-width=".35"><circle cx="10.6" cy="9.4" r="1"/><circle cx="13.4" cy="9.4" r="1"/><path d="M11.6 9.4h.8"/></g></svg>',
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
                    colors: {
                        background: '#ef4444',
                        foreground: '#f59e0b',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ef4444"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#f59e0b"/><path d="M12 16.6v3.4M10.3 18.3h3.4" stroke="#fff" stroke-width=".6" stroke-linecap="round"/><circle cx="12" cy="5.1" r="1.6" fill="#3b2f2f"/><circle cx="12" cy="9.3" r="3.6" fill="#c68642"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#3b2f2f"/></svg>',
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
                    colors: {
                        background: '#ef4444',
                        foreground: '#2563eb',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ef4444"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#2563eb"/><path d="M10.5 16.8l3 3M13.5 16.8l-3 3" stroke="#fff" stroke-width=".6" stroke-linecap="round"/><circle cx="12" cy="9.3" r="3.6" fill="#8d5524"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#ef4444',
                        foreground: '#eab308',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ef4444"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#1f2937"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#eab308"/><path d="M12 16.6l2 3.4h-4z" fill="none" stroke="#1f2937" stroke-width=".5" stroke-linejoin="round"/><circle cx="12" cy="9.3" r="3.6" fill="#f1c27d"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#ef4444',
                        foreground: '#0ea5e9',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ef4444"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#0ea5e9"/><path d="M9.4 18.3c.9-2 1.7-2 2.6 0s1.7 2 2.6 0" fill="none" stroke="#fff" stroke-width=".5" stroke-linecap="round"/><circle cx="12" cy="9.3" r="3.6" fill="#e0ac69"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#5b3a29"/></svg>',
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
                    colors: {
                        background: '#ef4444',
                        foreground: '#06b6d4',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ef4444"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#06b6d4"/><path d="M12.9 16.6c-.7-.5-1.1 0-1.1.7v2.2c0 .7-.4 1.2-1.1.7" fill="none" stroke="#fff" stroke-width=".5" stroke-linecap="round"/><circle cx="12" cy="9.3" r="3.6" fill="#f1c27d"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#d1d5db"/></svg>',
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
                    colors: {
                        background: '#ef4444',
                        foreground: '#92400e',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ef4444"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#1f2937"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#92400e"/><path d="M9.8 17h4.4M9.8 18.3h4.4M9.8 19.6h4.4" stroke="#fde68a" stroke-width=".4"/><g fill="#fde68a"><circle cx="11" cy="17" r=".5"/><circle cx="13" cy="18.3" r=".5"/><circle cx="11.6" cy="19.6" r=".5"/></g><circle cx="12" cy="9.3" r="3.6" fill="#c68642"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#ef4444',
                        foreground: '#2563eb',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ef4444"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#2563eb"/><path d="M12 16.5l2 2-2 2-2-2z" fill="#fff"/><circle cx="12" cy="9.3" r="3.6" fill="#f1c27d"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#6b7280"/></svg>',
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
                    colors: {
                        background: '#ef4444',
                        foreground: '#16a34a',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ef4444"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v3.2H7.9z" fill="#b45309"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#16a34a"/><path d="M9.4 19.8c1.6 0 1.8-3.2 2.6-3.2s1 3.2 2.6 3.2" fill="none" stroke="#fff" stroke-width=".5" stroke-linecap="round"/><circle cx="12" cy="9.3" r="3.6" fill="#ffdbac"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#b45309"/></svg>',
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
                    colors: {
                        background: '#facc15',
                        foreground: '#d6b98c',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#facc15"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#d6b98c"/><path d="M10.6 16.6h2.8v3.2h-2.8z" fill="none" stroke="#7c5a2b" stroke-width=".5"/><path d="M11.2 17.6h1.6M11.2 18.5h1.6" stroke="#7c5a2b" stroke-width=".4"/><circle cx="12" cy="9.3" r="3.6" fill="#e0ac69"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#5b3a29"/></svg>',
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
                    colors: {
                        background: '#facc15',
                        foreground: '#0284c7',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#facc15"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#1f2937"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#0284c7"/><circle cx="12" cy="18.3" r="1.7" fill="none" stroke="#fff" stroke-width=".5"/><path d="M10.3 18.3h3.4M12 16.6c-.9 1-.9 2.4 0 3.4M12 16.6c.9 1 .9 2.4 0 3.4" fill="none" stroke="#fff" stroke-width=".4"/><circle cx="12" cy="9.3" r="3.6" fill="#f1c27d"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#facc15',
                        foreground: '#1d4ed8',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><clipPath id="us-body"><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z"/></clipPath></defs><circle cx="12" cy="12" r="12" fill="#facc15"/><g clip-path="url(#us-body)"><rect x="0" y="15" width="24" height="9" fill="#fff"/><rect x="0" y="15.2" width="24" height="1.1" fill="#dc2626"/><rect x="0" y="17.4" width="24" height="1.1" fill="#dc2626"/><rect x="0" y="19.6" width="24" height="1.1" fill="#dc2626"/><rect x="0" y="21.8" width="24" height="1.1" fill="#dc2626"/><rect x="2" y="15" width="9" height="3.6" fill="#1d4ed8"/><path d="M6.5 15.9l.3.7.7.1-.5.5.1.7-.6-.3-.6.3.1-.7-.5-.5.7-.1z" fill="#fff"/></g><circle cx="12" cy="9.3" r="3.6" fill="#e0ac69"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#3b2f2f"/></svg>',
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
                    colors: {
                        background: '#facc15',
                        foreground: '#c2410c',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#facc15"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#1f2937"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#c2410c"/><path d="M9.8 20h4.4M10.6 17.8v2.2M12 17.8v2.2M13.4 17.8v2.2M9.8 17.8l2.2-1.2 2.2 1.2z" stroke="#fde68a" stroke-width=".45" fill="none" stroke-linejoin="round"/><circle cx="12" cy="9.3" r="3.6" fill="#c68642"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#facc15',
                        foreground: '#6b7280',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#facc15"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#6b7280"/><path d="M10.5 16.8l3 3.2M13.5 16.8l-3 3.2" stroke="#fff" stroke-width=".6" stroke-linecap="round"/><circle cx="12" cy="9.3" r="3.6" fill="#f1c27d"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#5b3a29"/></svg>',
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
                    colors: {
                        background: '#facc15',
                        foreground: '#374151',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#facc15"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#374151"/><path d="M10.4 17h3.2M10.4 18.2h3.2M10.4 19.4h2" stroke="#fff" stroke-width=".5" stroke-linecap="round"/><circle cx="12" cy="9.3" r="3.6" fill="#e0ac69"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#facc15',
                        foreground: '#1e40af',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#facc15"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#d4a017"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#1e40af"/><g fill="#facc15"><circle cx="13.5" cy="18.4" r=".35"/><circle cx="13.06" cy="19.46" r=".35"/><circle cx="12" cy="19.9" r=".35"/><circle cx="10.94" cy="19.46" r=".35"/><circle cx="10.5" cy="18.4" r=".35"/><circle cx="10.94" cy="17.34" r=".35"/><circle cx="12" cy="16.9" r=".35"/><circle cx="13.06" cy="17.34" r=".35"/></g><circle cx="12" cy="9.3" r="3.6" fill="#ffdbac"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#d4a017"/></svg>',
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
                    colors: {
                        background: '#facc15',
                        foreground: '#b91c1c',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#facc15"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#1f2937"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#b91c1c"/><path d="M9.6 17.4l2.4-1 2.4 1M10.2 18.8l1.8-.9 1.8.9M12 17.4v2.6M10.6 20h2.8" stroke="#fff" fill="none" stroke-width=".45" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="9.3" r="3.6" fill="#f1c27d"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#facc15',
                        foreground: '#15803d',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#facc15"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#15803d"/><path d="M12 20v-3.2M12 16.8c-1.6-.1-2.6.6-2.8 1.4M12 16.8c1.6-.1 2.6.6 2.8 1.4M12 17.6c-1.2.2-1.8.9-1.9 1.6M12 17.6c1.2.2 1.8.9 1.9 1.6" stroke="#fff" fill="none" stroke-width=".45" stroke-linecap="round"/><circle cx="12" cy="5.1" r="1.6" fill="#1f2937"/><circle cx="12" cy="9.3" r="3.6" fill="#8d5524"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#facc15',
                        foreground: '#2563eb',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#facc15"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#5b3a29"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#2563eb"/><circle cx="12" cy="18.3" r="1.7" fill="none" stroke="#fff" stroke-width=".5"/><path d="M10.3 18.3h3.4M12 16.6c-.9 1-.9 2.4 0 3.4M12 16.6c.9 1 .9 2.4 0 3.4" fill="none" stroke="#fff" stroke-width=".4"/><circle cx="12" cy="9.3" r="3.6" fill="#c68642"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#5b3a29"/></svg>',
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
                    colors: {
                        background: '#facc15',
                        foreground: '#cbd5e1',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#facc15"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#cbd5e1"/><path d="M9.8 20h4.4M10.6 17.8v2.2M12 17.8v2.2M13.4 17.8v2.2M9.8 17.8l2.2-1.2 2.2 1.2z" stroke="#1e3a8a" stroke-width=".45" fill="none" stroke-linejoin="round"/><circle cx="12" cy="9.3" r="3.6" fill="#e0ac69"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#3b2f2f"/></svg>',
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
                    colors: {
                        background: '#facc15',
                        foreground: '#0ea5e9',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#facc15"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#1f2937"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#0ea5e9"/><circle cx="12" cy="18.3" r="1.7" fill="none" stroke="#fff" stroke-width=".5"/><path d="M10.3 18.3h3.4M12 16.6c-.9 1-.9 2.4 0 3.4M12 16.6c.9 1 .9 2.4 0 3.4" fill="none" stroke="#fff" stroke-width=".4"/><circle cx="12" cy="9.3" r="3.6" fill="#c68642"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#14b8a6',
                        foreground: '#92400e',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#14b8a6"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#92400e"/><path d="M10 17.6h4v2.4h-4zM11.2 17.6v-.8h1.6v.8" fill="none" stroke="#fff" stroke-width=".5" stroke-linejoin="round"/><circle cx="12" cy="9.3" r="3.6" fill="#f1c27d"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#2b2b2b"/></svg>',
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
                    colors: {
                        background: '#14b8a6',
                        foreground: '#c8a165',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#14b8a6"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#c8a165"/><path d="M12.9 17.2c-.2-.5-.8-.6-1.2-.5-.9.2-.9 1.1-.1 1.4l.8.3c.8.3.8 1.2-.1 1.4-.5.1-1-.1-1.3-.5M12 16.4v.4M12 20v.4" stroke="#5b3a29" fill="none" stroke-width=".45" stroke-linecap="round"/><circle cx="12" cy="9.3" r="3.6" fill="#e0ac69"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#5b3a29"/></svg>',
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
                    colors: {
                        background: '#14b8a6',
                        foreground: '#15803d',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#14b8a6"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v3.2H7.9z" fill="#8b4513"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#15803d"/><path d="M9.6 19.8l1.8-1.8 1.2 1 2-2.4M13.2 16.6h1.4v1.4" stroke="#fff" fill="none" stroke-width=".5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="9.3" r="3.6" fill="#ffdbac"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#8b4513"/></svg>',
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
                    colors: {
                        background: '#9ca3af',
                        foreground: '#475569',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#9ca3af"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#475569"/><circle cx="12" cy="18.3" r="1" fill="none" stroke="#fff" stroke-width=".5"/><path d="M12 16.4v.8M12 19.4v.8M10.1 18.3h.8M13.1 18.3h.8M10.7 17l.6.6M12.7 19l.6.6M10.7 19.6l.6-.6M12.7 17.6l.6-.6" stroke="#fff" stroke-width=".5" stroke-linecap="round"/><circle cx="12" cy="9.3" r="3.6" fill="#c68642"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#9ca3af',
                        foreground: '#facc15',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#9ca3af"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#facc15"/><path d="M12.6 16.5l-2 2.5h1.6l-.6 1.8 2-2.6h-1.6z" fill="#1f2937"/><circle cx="12" cy="9.3" r="3.6" fill="#f1c27d"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#5b3a29"/></svg>',
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
                    colors: {
                        background: '#9ca3af',
                        foreground: '#f97316',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#9ca3af"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#3b2f2f"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#f97316"/><path d="M9.4 19.6h5.2M10.2 19.6v-1M13.8 19.6v-1M9.6 18.6c1-2 4.8-2 5.6 0" stroke="#fff" fill="none" stroke-width=".5" stroke-linecap="round"/><circle cx="12" cy="9.3" r="3.6" fill="#e0ac69"/><path d="M8.2 8.6a3.8 3.8 0 0 1 7.6 0z" fill="#facc15"/><path d="M7.8 8.6h8.4" stroke="#facc15" stroke-width=".8" stroke-linecap="round"/></svg>',
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
                    colors: {
                        background: '#9ca3af',
                        foreground: '#0891b2',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#9ca3af"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#0891b2"/><path d="M11.1 16.6h1.8M11.4 16.6v1.5l-1 1.7a.5.5 0 0 0 .4.8h2.4a.5.5 0 0 0 .4-.8l-1-1.7v-1.5" fill="none" stroke="#fff" stroke-width=".5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="9.3" r="3.6" fill="#ffdbac"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#c2410c"/></svg>',
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
                    colors: {
                        background: '#9ca3af',
                        foreground: '#1d4ed8',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#9ca3af"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#1d4ed8"/><path d="M10.6 17.2h2.8v2.8h-2.8zM11.4 16.6v.6M12.6 16.6v.6M11.4 20v.6M12.6 20v.6M10 17.8h.6M10 19.4h.6M13.4 17.8h.6M13.4 19.4h.6" stroke="#fff" fill="none" stroke-width=".45" stroke-linecap="round"/><circle cx="12" cy="9.3" r="3.6" fill="#f1c27d"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#2b2b2b"/><g fill="none" stroke="#111827" stroke-width=".35"><circle cx="10.6" cy="9.4" r="1"/><circle cx="13.4" cy="9.4" r="1"/><path d="M11.6 9.4h.8"/></g></svg>',
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
                    colors: {
                        background: '#9ca3af',
                        foreground: '#7c2d12',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#9ca3af"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#7c2d12"/><path d="M9.6 20v-2.2l1.6 1v-1l1.6 1v-1l1.6 1V20zM13.6 17.6v-1.2h.8v1.2" fill="#fff"/><circle cx="12" cy="9.3" r="3.6" fill="#e0ac69"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#5b3a29"/></svg>',
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
                    colors: {
                        background: '#3b82f6',
                        foreground: '#fde68a',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#3b82f6"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#fde68a"/><path d="M10.2 19.8l.4-1.4 3-3 1 1-3 3z" fill="none" stroke="#92400e" stroke-width=".5" stroke-linejoin="round"/><circle cx="12" cy="9.3" r="3.6" fill="#e0ac69"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#b45309"/></svg>',
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
                    colors: {
                        background: '#3b82f6',
                        foreground: '#9f1239',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#3b82f6"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#3b2f2f"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#9f1239"/><path d="M9.6 17c1-.4 1.8-.2 2.4.4.6-.6 1.4-.8 2.4-.4v3c-1-.4-1.8-.2-2.4.4-.6-.6-1.4-.8-2.4-.4zM12 17.4v3" stroke="#fff" fill="none" stroke-width=".45" stroke-linejoin="round"/><circle cx="12" cy="9.3" r="3.6" fill="#ffdbac"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#3b2f2f"/></svg>',
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
                    colors: {
                        background: '#3b82f6',
                        foreground: '#facc15',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#3b82f6"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#facc15"/><circle cx="12" cy="17.6" r=".7" fill="#1f2937"/><path d="M12 18.3c.2 1-.3 1.6-1 2" stroke="#1f2937" fill="none" stroke-width=".6" stroke-linecap="round"/><circle cx="12" cy="9.3" r="3.6" fill="#f1c27d"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#f3f4f6"/></svg>',
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
                    colors: {
                        background: '#3b82f6',
                        foreground: '#fef3c7',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#3b82f6"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#fef3c7"/><path d="M9.6 20l1.2-3.4 1.2 3.4M10.1 19h1.4" stroke="#1f2937" fill="none" stroke-width=".5" stroke-linecap="round"/><circle cx="13.3" cy="19" r=".8" fill="none" stroke="#1f2937" stroke-width=".5"/><circle cx="12" cy="5.1" r="1.6" fill="#1f2937"/><circle cx="12" cy="9.3" r="3.6" fill="#c68642"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#3b82f6',
                        foreground: '#1e293b',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#3b82f6"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v3.2H7.9z" fill="#5b3a29"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#1e293b"/><path d="M12 16.4l1.6 2.6-1.6 1.8-1.6-1.8zM12 18.2v1.2" stroke="#fff" fill="none" stroke-width=".5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="12" cy="9.3" r="3.6" fill="#e0ac69"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#5b3a29"/></svg>',
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
                    colors: {
                        background: '#3b82f6',
                        foreground: '#dc2626',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#3b82f6"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#dc2626"/><path d="M11.4 16.6h1.2v2a.6.6 0 0 1-1.2 0zM10.4 18.4a1.6 1.6 0 0 0 3.2 0M12 20v.4" stroke="#fff" fill="none" stroke-width=".45" stroke-linecap="round"/><circle cx="12" cy="9.3" r="3.6" fill="#8d5524"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#f97316',
                        foreground: '#dc2626',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><clipPath id="es-body"><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z"/></clipPath></defs><circle cx="12" cy="12" r="12" fill="#f97316"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#1f2937"/><g clip-path="url(#es-body)"><rect x="0" y="15" width="24" height="9" fill="#dc2626"/><rect x="0" y="17" width="24" height="4.5" fill="#facc15"/></g><circle cx="12" cy="9.3" r="3.6" fill="#c68642"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#f97316',
                        foreground: '#1d4ed8',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><clipPath id="fr-body"><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z"/></clipPath></defs><circle cx="12" cy="12" r="12" fill="#f97316"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#5b3a29"/><g clip-path="url(#fr-body)"><rect x="0" y="15" width="8" height="9" fill="#1d4ed8"/><rect x="8" y="15" width="8" height="9" fill="#fff"/><rect x="16" y="15" width="8" height="9" fill="#dc2626"/></g><circle cx="12" cy="9.3" r="3.6" fill="#ffdbac"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#5b3a29"/></svg>',
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
                    colors: {
                        background: '#f97316',
                        foreground: '#dc2626',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><clipPath id="de-body"><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z"/></clipPath></defs><circle cx="12" cy="12" r="12" fill="#f97316"/><g clip-path="url(#de-body)"><rect x="0" y="15" width="24" height="2.4" fill="#1f2937"/><rect x="0" y="17.4" width="24" height="2.4" fill="#dc2626"/><rect x="0" y="19.8" width="24" height="4.2" fill="#facc15"/></g><circle cx="12" cy="9.3" r="3.6" fill="#ffdbac"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#d4a017"/></svg>',
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
                    colors: {
                        background: '#f97316',
                        foreground: '#16a34a',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><clipPath id="it-body"><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z"/></clipPath></defs><circle cx="12" cy="12" r="12" fill="#f97316"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#1f2937"/><g clip-path="url(#it-body)"><rect x="0" y="15" width="8" height="9" fill="#16a34a"/><rect x="8" y="15" width="8" height="9" fill="#fff"/><rect x="16" y="15" width="8" height="9" fill="#dc2626"/></g><circle cx="12" cy="9.3" r="3.6" fill="#e0ac69"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#a855f7',
                        foreground: '#f3f4f6',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#a855f7"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#f3f4f6"/><g><circle cx="9.6" cy="18" r=".8" fill="#ef4444"/><circle cx="13.2" cy="19.6" r=".9" fill="#3b82f6"/><circle cx="15.4" cy="17.6" r=".7" fill="#facc15"/><circle cx="11.2" cy="20.8" r=".6" fill="#22c55e"/></g><circle cx="12" cy="9.3" r="3.6" fill="#f1c27d"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#5b3a29"/><ellipse cx="12.6" cy="6.3" rx="4.2" ry="1.5" fill="#ef4444"/></svg>',
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
                    colors: {
                        background: '#a855f7',
                        foreground: '#8b4513',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#a855f7"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#1f2937"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#8b4513"/><path d="M11 20v-3.4l2.6-.6v3.4M11 20a.8.7 0 1 1-1.6 0 .8.7 0 0 1 1.6 0zM13.6 19.4a.8.7 0 1 1-1.6 0 .8.7 0 0 1 1.6 0z" stroke="#111827" fill="none" stroke-width=".45"/><circle cx="12" cy="9.3" r="3.6" fill="#c68642"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#ec4899',
                        foreground: '#ef4444',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ec4899"/><path d="M7.9 9.4a4.1 4.1 0 0 1 8.2 0v5.2H7.9z" fill="#3b2f2f"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#ef4444"/><path d="M12 20.2s-2.2-1.4-2.2-3a1.1 1.1 0 0 1 2.2-.5 1.1 1.1 0 0 1 2.2.5c0 1.6-2.2 3-2.2 3z" fill="#fff"/><circle cx="12" cy="9.3" r="3.6" fill="#e0ac69"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#3b2f2f"/></svg>',
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
                    colors: {
                        background: '#ec4899',
                        foreground: '#eab308',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ec4899"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#eab308"/><path d="M9.6 17.6v1.6M10.8 17v2.8M13.2 17v2.8M14.4 17.6v1.6M10.8 18.4h2.4" stroke="#1f2937" stroke-width=".5" stroke-linecap="round"/><circle cx="12" cy="9.3" r="3.6" fill="#c68642"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#1f2937"/></svg>',
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
                    colors: {
                        background: '#ff8e1c',
                        foreground: '#92400e',
                    },
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ff8e1c"/><path d="M2.6 19.4C4 16.4 8 15.4 12 15.4s8 1 9.4 4A12 12 0 0 1 2.6 19.4z" fill="#92400e"/><path d="M10.4 16.8h3.2v3.4h-3.2zM11.2 16.4h1.6v.8h-1.6zM11 18h2M11 19h2" stroke="#fff" fill="none" stroke-width=".4"/><circle cx="12" cy="9.3" r="3.6" fill="#f1c27d"/><path d="M8.4 9.2a3.6 3.6 0 0 1 7.2 0c-1.4-1.3-2.6-1.9-3.6-1.9s-2.2.6-3.6 1.9z" fill="#3b2f2f"/></svg>',
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
