interface Mode {
    name: string;
    description: string;
    icon?: string;
    prompt?: Promise<any>;
    show?: true | false;
}

interface Category {
    name: string;
    description: string;
    modes: Record<string, Mode>;
}

interface Tool {
    name: string;
    description: string;
    parameters: any;
    execute: (params: any) => Promise<any>;
}

export type { Mode, Category, Tool };